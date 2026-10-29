import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import {
  createRequest,
  type CreateRequestInput,
} from "@/domain/requests/create-request";
import {
  HotelService,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const db = testDbClient ?? prisma;

  // 1. Session check: token from guest session cookie (SYSTEM.md §6.3, §12.2)
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

  // 3. Validate call type: must be "WAITER" or "BILL"
  const rawType = body["type"];
  if (rawType !== "WAITER" && rawType !== "BILL") {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Invalid call type. Must be 'WAITER' or 'BILL'",
        },
      },
      { status: 400 }
    );
  }

  const serviceType =
    rawType === "WAITER"
      ? HotelService.CALL_WAITER
      : HotelService.REQUEST_BILL;

  // 4. Authoritative venue and place resolved strictly from the session
  // Any client-supplied venueId, tableId, roomId, counterId is ignored per D-2.1 and hard prohibitions.
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

  // 5. Optional orderId context verification: if provided, verify it belongs to this guest session
  let details: ServiceRequestDetails = {};
  if (
    typeof body["orderId"] === "string" &&
    body["orderId"].trim() !== ""
  ) {
    const candidateOrderId = body["orderId"].trim();
    if (!UUID_REGEX.test(candidateOrderId)) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Invalid orderId format",
          },
        },
        { status: 400 }
      );
    }

    const orderRepo = createPrismaOrderRepository(db);
    const orderResult = await orderRepo.findById(session.venueId, candidateOrderId);
    if (!orderResult.ok || orderResult.value.guestSessionId !== session.id) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Order does not belong to session",
          },
        },
        { status: 400 }
      );
    }

    details = { orderId: candidateOrderId };
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

