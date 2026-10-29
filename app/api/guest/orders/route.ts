import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import {
  createOrder,
  type CreateOrderRequest,
  type CreateOrderItemRequest,
} from "@/domain/orders/create-order";
import { PlaceType } from "@/domain/orders/order.repository";
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
          message: "Invalid order request body",
        },
      },
      { status: 400 }
    );
  }

  const body = rawBody as Record<string, unknown>;

  // 3. Validate idempotencyKey before createOrder
  const idempotencyKey = body["idempotencyKey"];
  if (
    typeof idempotencyKey !== "string" ||
    !UUID_REGEX.test(idempotencyKey.trim())
  ) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "idempotencyKey must be a valid UUID",
        },
      },
      { status: 400 }
    );
  }

  // 4. Validate items array
  const rawItems = body["items"];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Order must contain at least one item",
        },
      },
      { status: 400 }
    );
  }

  const items: CreateOrderItemRequest[] = [];
  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== "object") {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Invalid item request in items array",
          },
        },
        { status: 400 }
      );
    }
    const it = rawItem as Record<string, unknown>;
    const menuItemId = it["menuItemId"] ?? it["itemId"];
    if (typeof menuItemId !== "string" || menuItemId.trim() === "") {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Item menuItemId is required and must be non-empty",
          },
        },
        { status: 400 }
      );
    }

    const quantity = it["quantity"];
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: `Item quantity must be a positive integer, received: ${quantity}`,
          },
        },
        { status: 400 }
      );
    }

    let selectedModifierIds: string[] | undefined = undefined;
    if (Array.isArray(it["selectedModifierIds"])) {
      selectedModifierIds = it["selectedModifierIds"].filter(
        (id): id is string => typeof id === "string" && id.trim().length > 0
      );
    }

    const notes = typeof it["notes"] === "string" ? it["notes"] : null;

    items.push({
      menuItemId: menuItemId.trim(),
      quantity,
      selectedModifierIds,
      notes,
    });
  }

  // 5. Authoritative venue and place resolved from session ONLY
  // Any client-supplied venueId, tableId, roomId, counterId is ignored per BUILD.md §6 rule 5 and D-2.1.
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

  const notes = typeof body["notes"] === "string" ? body["notes"] : null;
  const pickupName =
    typeof body["pickupName"] === "string" ? body["pickupName"] : null;

  const createRequest: CreateOrderRequest = {
    venueId: session.venueId,
    idempotencyKey: idempotencyKey.trim(),
    placeType,
    tableId,
    roomId,
    counterId,
    pickupName,
    guestSessionId: session.id,
    notes,
    items,
  };

  // 6. Execute createOrder domain orchestrator
  const orderRepo = createPrismaOrderRepository(db);
  const menuRepo = createPrismaMenuRepository(db);
  const venueRepo = createPrismaVenueRepository(db);

  const result = await createOrder(
    { orderRepo, menuRepo, venueRepo },
    createRequest
  );

  if (!result.ok) {
    const status = domainErrorToStatus(result.error.code);
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
}

