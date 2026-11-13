import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { login } from "@/domain/auth/login";
import { canAccess, type Area } from "@/domain/auth/can-access";
import { verifyPassword } from "@/infrastructure/auth/password";
import {
  createSession,
  invalidateAllSessions,
} from "@/infrastructure/auth/session";
import { setSessionCookie } from "@/infrastructure/auth/cookies";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  CSRF_COOKIE_NAME,
  CSRF_MAX_AGE_SECONDS,
} from "@/infrastructure/csrf/cookies";
import { generateCsrfToken } from "@/infrastructure/csrf/token";
import type { AuditedRouteHandler } from "@/infrastructure/audit/with-audit";

type DbClient = PrismaClient | Prisma.TransactionClient;

const ALL_AREAS: Area[] = [
  "admin",
  "kitchen",
  "table-service",
  "room-service",
  "housekeeping",
  "maintenance",
  "concierge",
  "laundry",
  "spa",
  "front-desk",
];

let cachedVenueId: string | null = null;
let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

export function clearCachedVenueId(): void {
  cachedVenueId = null;
}

async function getVenueId(client: DbClient): Promise<string | null> {
  if (cachedVenueId && process.env["NODE_ENV"] !== "test") {
    return cachedVenueId;
  }
  const venueRepo = createPrismaVenueRepository(client);
  const result = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (result.ok) {
    if (process.env["NODE_ENV"] !== "test") {
      cachedVenueId = result.value.id;
    }
    return result.value.id;
  }
  return null;
}

const loginHandler: AuditedRouteHandler = async (
  request: NextRequest
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;

  // 1. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("username" in body) ||
    typeof (body as { username: unknown }).username !== "string" ||
    !("password" in body) ||
    typeof (body as { password: unknown }).password !== "string"
  ) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "username and password are required",
        },
      },
      { status: 400 }
    );
  }

  const { username, password } = body as { username: string; password: string };

  // 2. Resolve venue
  const venueId = await getVenueId(db);
  if (!venueId) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }

  // 3. Call login domain function
  const staffRepo = createPrismaStaffRepository(db);
  const result = await login(
    {
      staffRepo,
      verifyPassword,
      createSession: (staffMemberId) => createSession(db, staffMemberId),
      invalidateAllSessions: (staffMemberId) => invalidateAllSessions(db, staffMemberId),
    },
    {
      venueId,
      username,
      password,
    }
  );

  // 4. Map failure
  if (!result.ok) {
    const status =
      result.error.code === DomainErrorCode.UNAUTHORIZED
        ? 401
        : result.error.code === DomainErrorCode.VALIDATION_FAILED
        ? 400
        : 500;
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  // 5. Set cookie
  await setSessionCookie(result.value.sessionToken);

  // 6. Compute allowedAreas
  const allowedAreas = ALL_AREAS.filter((area) =>
    canAccess(result.value.staff.roles, area)
  );

  // 7. Return success envelope AND set csrf_token on the response.
  //    The csrf_token must be set on the same response that carries the
  //    session, so the next page (the redirect to /staff or /kitchen or
  //    /admin) has it. cookies().set(...) in the login page's Server
  //    Component is unreliable in Next.js App Router; response.cookies.set
  //    is guaranteed.
  const response = NextResponse.json(
    {
      data: {
        staff: {
          id: result.value.staff.id,
          name: result.value.staff.name,
          username: result.value.staff.username,
          roles: result.value.staff.roles,
        },
        allowedAreas,
      },
    },
    { status: 200 }
  );

  response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_MAX_AGE_SECONDS,
  });

  return response;
};

export const POST = withCsrf(loginHandler);

