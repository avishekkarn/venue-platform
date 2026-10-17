import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { getSession } from "@/domain/auth/get-session";
import { canAccess, type Area } from "@/domain/auth/can-access";
import { validateSession } from "@/infrastructure/auth/session";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { DomainErrorCode } from "@/domain/shared/result";

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

export async function GET(
  _request?: NextRequest | Request,
  context?: { db?: DbClient }
): Promise<NextResponse> {
  const db = context?.db ?? testDbClient ?? prisma;

  // 1. Read cookie
  const token = await getSessionCookie();
  if (!token) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 2. Resolve venue
  const venueId = await getVenueId(db);
  if (!venueId) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }

  // 3. Validate session via domain
  const sessionResult = await getSession(
    {
      validateSession: (t) => validateSession(db, t),
    },
    token
  );

  if (!sessionResult.ok) {
    return NextResponse.json(
      { error: { code: sessionResult.error.code, message: sessionResult.error.message } },
      { status: 401 }
    );
  }

  // 4. Fetch full StaffMember
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(
    venueId,
    sessionResult.value.staffMemberId
  );

  if (!staffResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "Staff not found" } },
      { status: 401 }
    );
  }

  // 5. Compute allowedAreas
  const allowedAreas = ALL_AREAS.filter((area) =>
    canAccess(staffResult.value.roles, area)
  );

  // 6. Return success envelope
  return NextResponse.json(
    {
      data: {
        session: {
          id: sessionResult.value.id,
          createdAt: sessionResult.value.createdAt,
        },
        staff: {
          id: staffResult.value.id,
          name: staffResult.value.name,
          username: staffResult.value.username,
          roles: staffResult.value.roles,
        },
        allowedAreas,
      },
    },
    { status: 200 }
  );
}
