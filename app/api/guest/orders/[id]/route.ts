import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
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
  request: NextRequest,
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

  // 2. Validate id route param
  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Invalid order ID format",
        },
      },
      { status: 400 }
    );
  }

  // 3. Query order by venue and id
  const orderRepo = createPrismaOrderRepository(db);
  const result = await orderRepo.findById(session.venueId, id.trim());

  if (!result.ok) {
    const status = domainErrorToStatus(result.error.code);
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  const order = result.value;

  // 4. Privacy & session scoping: guest may only read orders belonging to their active guestSessionId
  // If order belongs to a different guest session, return NOT_FOUND (never reveal existence, SYSTEM.md §15.4)
  if (order.guestSessionId !== session.id) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.NOT_FOUND,
          message: `Order '${id.trim()}' not found for venue '${session.venueId}'`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: order }, { status: 200 });
}

