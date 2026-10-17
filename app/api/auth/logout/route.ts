import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { logout } from "@/domain/auth/logout";
import { getSessionCookie, clearSessionCookie } from "@/infrastructure/auth/cookies";
import { deleteSession, validateSession } from "@/infrastructure/auth/session";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

export async function POST(
  _request: NextRequest,
  context?: { db?: DbClient }
): Promise<NextResponse> {
  const db = context?.db ?? testDbClient ?? prisma;

  // 1. Read cookie
  const token = await getSessionCookie();

  // 2. If token exists, look up session and delete it (idempotent)
  if (token) {
    const session = await validateSession(db, token);
    if (session) {
      const result = await logout(
        {
          deleteSession: (sessionId) => deleteSession(db, sessionId),
        },
        session.id
      );
      if (!result.ok) {
        // The domain logout wraps unexpected errors in INTERNAL.
        // We still clear the cookie below so the client can retry.
        // Do not throw; log and continue.
        console.error("Logout domain failure:", result.error);
      }
    }
  }

  // 3. Clear cookie (always, even if no session existed — idempotent)
  await clearSessionCookie();

  // 4. Return success envelope
  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
