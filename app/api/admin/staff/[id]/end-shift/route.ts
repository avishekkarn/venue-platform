import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession, invalidateAllSessions } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withAuditedDynamicRoute, type AuditMeta } from "@/infrastructure/audit/with-audit";
import { type ActorResolvers } from "@/infrastructure/audit/logger";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import { getVenueSlug } from "@/infrastructure/config/venue";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authenticateAdmin(db: DbClient) {
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  const session = await validateSession(db, sessionToken);
  if (!session) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(process.env["VENUE_SLUG"] ?? "juniper-house");
  if (!venueResult.ok) {
    return { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" }, status: 500 };
  }
  const venue = venueResult.value;

  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  if (!canAccess(staff.roles, "admin")) {
    return { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" }, status: 403 };
  }

  return { venue, staff };
}

/**
 * POST /api/admin/staff/[id]/end-shift
 * Ends any active shift/session for a staff member (D-3.2, D-3.14).
 */
const postHandler = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await authenticateAdmin(db);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { venue } = auth;

  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid staff ID format" } },
      { status: 400 }
    );
  }

  const staffRepo = createPrismaStaffRepository(db);
  const targetResult = await staffRepo.findById(venue.id, id);
  if (!targetResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: "Staff member not found" } },
      { status: 404 }
    );
  }

  const endedCount = await invalidateAllSessions(db, targetResult.value.id);

  return NextResponse.json(
    {
      data: {
        success: true,
        staffId: targetResult.value.id,
        endedSessionsCount: endedCount,
        message: `Ended ${endedCount} active session(s) for ${targetResult.value.name}`,
      },
    },
    { status: 200 }
  );
};

const postMeta: AuditMeta = {
  route: "/api/admin/staff/[id]/end-shift",
  method: "POST",
};

const resolvers: ActorResolvers = {
  resolveStaff: async () => {
    const db = testDbClient ?? prisma;
    const token = await getSessionCookie();
    if (!token) return null;
    const session = await validateSession(db, token);
    if (!session) return null;
    const venueRepo = createPrismaVenueRepository(db);
    const venueResult = await venueRepo.findBySlug(getVenueSlug());
    if (!venueResult.ok) return null;
    const staffRepo = createPrismaStaffRepository(db);
    const staffResult = await staffRepo.findById(
      venueResult.value.id,
      session.staffMemberId
    );
    if (!staffResult.ok) return null;
    const staff = staffResult.value;
    if (staff.state === StaffState.DEACTIVATED) return null;
    return {
      actorId: staff.id,
      actorRole: staff.roles[0] ?? "UNKNOWN",
      venueId: venueResult.value.id,
    };
  },
  resolveGuest: async () => null,
};

export const POST = withAuditedDynamicRoute<{ id: string }>(
  resolvers,
  postMeta,
  withCsrf(postHandler)
);
