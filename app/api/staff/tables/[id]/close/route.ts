import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { closeTable } from "@/domain/staff/close-table";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hasTableCloseAccess(roles: readonly StaffRole[]): boolean {
  return canAccess(roles, "table-service") || canAccess(roles, "front-desk");
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const db = testDbClient ?? prisma;

  // 1. Session check: active staff session cookie
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 2. Session validation
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 3. Resolve venue by slug
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 4. Staff lookup and active check
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const staff = staffResult.value;

  // 5. Role check: table-service or front-desk
  if (!hasTableCloseAccess(staff.roles)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 6. Param validation: id must be a valid UUID
  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid table id format" } },
      { status: 400 }
    );
  }
  const tableId = id.trim();

  // 7. Call domain action
  const tableRepo = createPrismaTableRepository(db);
  const guestRepo = createPrismaGuestSessionRepository(db);
  const result = await closeTable(
    { tableRepo, guestRepo },
    {
      venueId: venue.id,
      tableId,
      staffMemberId: session.staffMemberId,
    }
  );

  // 8. Map Result to HTTP response
  if (!result.ok) {
    switch (result.error.code) {
      case DomainErrorCode.NOT_FOUND:
        return NextResponse.json(
          { error: { code: DomainErrorCode.NOT_FOUND, message: result.error.message } },
          { status: 404 }
        );
      case DomainErrorCode.VALIDATION_FAILED:
        return NextResponse.json(
          { error: { code: DomainErrorCode.VALIDATION_FAILED, message: result.error.message } },
          { status: 400 }
        );
      default:
        return NextResponse.json(
          { error: { code: DomainErrorCode.INTERNAL, message: result.error.message } },
          { status: 500 }
        );
    }
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}

