import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { getMenu } from "@/domain/menu/get-menu";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
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

  // 2. Fetch items and structured menu for session venue
  const menuRepo = createPrismaMenuRepository(db);
  const [itemsResult, menuResult] = await Promise.all([
    menuRepo.listItems(session.venueId),
    getMenu({ menuRepo }, session.venueId),
  ]);

  if (!itemsResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: itemsResult.error.code,
          message: itemsResult.error.message,
        },
      },
      { status: 500 }
    );
  }

  // 3. Map to simple array of { id, state }
  const data = itemsResult.value.map((item) => ({
    id: item.id,
    state: item.state,
  }));

  // 4. Structural signature captures category IDs, items, and their sequential order
  const signature = menuResult.ok
    ? menuResult.value
        .map(
          (cat) =>
            `${cat.id}:${cat.items.map((it) => `${it.id}:${it.state}`).join(",")}`
        )
        .join("|")
    : "";

  return NextResponse.json({ data, signature }, { status: 200 });
}

