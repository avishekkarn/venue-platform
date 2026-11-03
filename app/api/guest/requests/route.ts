import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import {
  createRequest,
  type CreateRequestInput,
} from "@/domain/requests/create-request";
import {
  HotelService,
  PlaceType,
  type ServiceRequest,
  type ServiceRequestDetails,
} from "@/domain/requests/request.repository";
import { DomainErrorCode, type Result } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

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

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  // 2. Parse request body
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

  // 3. Validate serviceType
  const rawServiceType = body["serviceType"];
  if (
    typeof rawServiceType !== "string" ||
    !Object.values(HotelService).includes(rawServiceType as HotelService)
  ) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Valid serviceType is required",
        },
      },
      { status: 400 }
    );
  }
  const serviceType = rawServiceType as HotelService;

  // 4. Validate details (optional object)
  let details: ServiceRequestDetails = {};
  if ("details" in body && body["details"] !== undefined && body["details"] !== null) {
    if (typeof body["details"] !== "object" || Array.isArray(body["details"])) {
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
    details = body["details"] as ServiceRequestDetails;
  }

  // 5. Authoritative venue and place resolved strictly from the session
  const placeType = session.placeType as unknown as PlaceType;
  let tableId: string | null = null;
  let roomId: string | null = null;
  let counterId: string | null = null;

  if (placeType === PlaceType.TABLE) {
    tableId = session.placeId;
  } else if (placeType === PlaceType.ROOM) {
    roomId = session.placeId;
  } else if (placeType === PlaceType.COUNTER) {
    counterId = session.placeId;
  }

  const createRequestInput: CreateRequestInput = {
    venueId: session.venueId,
    placeType,
    tableId,
    roomId,
    counterId,
    serviceType,
    details,
  };

  // 6. Execute createRequest domain function
  const requestRepo = createPrismaServiceRequestRepository(db);
  const result = await createRequest({ requestRepo }, createRequestInput);

  if (!result.ok) {
    const status = domainErrorToStatus(result.error.code);
    return NextResponse.json(
      {
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      },
      { status }
    );
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
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

  // 2. Fetch requests scoped to the session's place
  const requestRepo = createPrismaServiceRequestRepository(db);
  let listResult: Result<ServiceRequest[]>;

  if (session.placeType === PlaceType.TABLE) {
    listResult = await requestRepo.listForTable(session.venueId, session.placeId);
  } else if (session.placeType === PlaceType.ROOM) {
    listResult = await requestRepo.listForRoom(session.venueId, session.placeId);
  } else if (session.placeType === PlaceType.COUNTER) {
    listResult = await requestRepo.listForCounter(session.venueId, session.placeId);
  } else {
    return NextResponse.json({ data: [] }, { status: 200 });
  }

  if (!listResult.ok) {
    const status = domainErrorToStatus(listResult.error.code);
    return NextResponse.json(
      {
        error: {
          code: listResult.error.code,
          message: listResult.error.message,
        },
      },
      { status }
    );
  }

  return NextResponse.json({ data: listResult.value }, { status: 200 });
}

