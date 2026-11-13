import { NextResponse, type NextRequest } from "next/server";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { editRequest } from "@/domain/requests/edit-request";
import {
  PlaceType,
  type ServiceRequestDetails,
} from "@/domain/requests/request.repository";
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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  // 3. Find request
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

  // 4. Scoping check: does this request belong to the guest's session place?
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

  return NextResponse.json({ data: serviceRequest }, { status: 200 });
}

const patchHandler = async (
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
  const details = body["details"];
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Field 'details' must be a valid JSON object",
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

  // 5. Call editRequest domain function
  const editResult = await editRequest(
    { requestRepo },
    {
      venueId: session.venueId,
      requestId,
      details: details as ServiceRequestDetails,
    }
  );

  if (!editResult.ok) {
    const status = domainErrorToStatus(editResult.error.code);
    return NextResponse.json(
      {
        error: {
          code: editResult.error.code,
          message: editResult.error.message,
        },
      },
      { status }
    );
  }

  return NextResponse.json({ data: editResult.value }, { status: 200 });
};

export const PATCH = withCsrf(patchHandler);

