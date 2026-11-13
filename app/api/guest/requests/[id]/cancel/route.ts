import { NextResponse, type NextRequest } from "next/server";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { cancelRequest } from "@/domain/requests/cancel-request";
import { PlaceType } from "@/domain/requests/request.repository";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function domainErrorToStatus(code: DomainErrorCode): number {
  switch (code) {
    case DomainErrorCode.NOT_FOUND:
      return 404;
    case DomainErrorCode.UNAUTHORIZED:
      return 401;
    case DomainErrorCode.FORBIDDEN:
      return 403;
    case DomainErrorCode.VALIDATION_FAILED:
      return 400;
    case DomainErrorCode.CONFLICT:
    case DomainErrorCode.INVALID_STATE:
      return 409;
    case DomainErrorCode.RATE_LIMITED:
      return 429;
    case DomainErrorCode.INTERNAL:
    default:
      return 500;
  }
}

const postHandler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;

  // 1. Session check: token from guest session cookie
  const cookie = await getGuestCookie();
  if (!cookie) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.UNAUTHORIZED,
          message: "No active guest session",
        },
      },
      { status: 401 }
    );
  }

  const guestRepo = createPrismaGuestSessionRepository(db);
  const sessionResult = await getGuestSession({ repo: guestRepo }, cookie);
  if (!sessionResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.UNAUTHORIZED,
          message: sessionResult.error.message,
        },
      },
      { status: 401 }
    );
  }
  const session = sessionResult.value;

  // 2. Validate id param
  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Invalid request ID format",
        },
      },
      { status: 400 }
    );
  }
  const requestId = id.trim();

  // 3. Parse request body
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Invalid JSON body",
        },
      },
      { status: 400 }
    );
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Request body must be a JSON object",
        },
      },
      { status: 400 }
    );
  }

  const body = rawBody as Record<string, unknown>;
  const reason = body["reason"];
  if (typeof reason !== "string" || reason.trim() === "") {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Reason is required for cancellation",
        },
      },
      { status: 400 }
    );
  }

  // 4. Scoping check: does this request belong to the guest's session place?
  const requestRepo = createPrismaServiceRequestRepository(db);
  const findResult = await requestRepo.findById(session.venueId, requestId);
  if (!findResult.ok) {
    const status = domainErrorToStatus(findResult.error.code);
    return NextResponse.json(
      {
        error: {
          code: findResult.error.code,
          message: findResult.error.message,
        },
      },
      { status }
    );
  }

  const serviceRequest = findResult.value;
  const belongsToPlace =
    (session.placeType === PlaceType.TABLE && serviceRequest.tableId === session.placeId) ||
    (session.placeType === PlaceType.ROOM && serviceRequest.roomId === session.placeId) ||
    (session.placeType === PlaceType.COUNTER && serviceRequest.counterId === session.placeId);

  if (!belongsToPlace) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.NOT_FOUND,
          message: `Request '${requestId}' not found for venue '${session.venueId}'`,
        },
      },
      { status: 404 }
    );
  }

  // 5. Call cancelRequest domain function
  const cancelResult = await cancelRequest(
    { requestRepo },
    {
      venueId: session.venueId,
      requestId,
      reason: reason.trim(),
      by: "guest",
      staffMemberId: null,
    }
  );

  if (!cancelResult.ok) {
    const status = domainErrorToStatus(cancelResult.error.code);
    return NextResponse.json(
      {
        error: {
          code: cancelResult.error.code,
          message: cancelResult.error.message,
        },
      },
      { status }
    );
  }

  return NextResponse.json({ data: cancelResult.value }, { status: 200 });
};

export const POST = withCsrf(postHandler);

