import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession, invalidateAllSessions } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
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

const ALL_STAFF_ROLES = new Set<string>(Object.values(StaffRole));

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
 * PATCH /api/admin/staff/[id]
 * Updates staff member name, roles, or state.
 */
const patchHandler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await authenticateAdmin(db);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { venue, staff: currentAdmin } = auth;

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
  const target = targetResult.value;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Body must be an object" } },
      { status: 400 }
    );
  }

  const { name, roles, state } = body as Record<string, unknown>;

  if (name === undefined && roles === undefined && state === undefined) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "At least one field to update must be provided" } },
      { status: 400 }
    );
  }

  const patch: { name?: string; roles?: StaffRole[]; state?: StaffState } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Name must be between 2 and 60 characters" } },
        { status: 400 }
      );
    }
    patch.name = name.trim();
  }

  if (roles !== undefined) {
    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "At least one role must be assigned" } },
        { status: 400 }
      );
    }
    for (const r of roles) {
      if (typeof r !== "string" || !ALL_STAFF_ROLES.has(r)) {
        return NextResponse.json(
          { error: { code: DomainErrorCode.VALIDATION_FAILED, message: `Invalid role: '${r}'` } },
          { status: 400 }
        );
      }
    }
    patch.roles = roles as StaffRole[];
  }

  if (state !== undefined) {
    if (state !== StaffState.ACTIVE && state !== StaffState.DEACTIVATED) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "State must be ACTIVE or DEACTIVATED" } },
        { status: 400 }
      );
    }

    // Guard: Admin cannot deactivate themselves while logged in
    if (target.id === currentAdmin.id && state === StaffState.DEACTIVATED) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Cannot deactivate your own administrator account",
          },
        },
        { status: 400 }
      );
    }

    patch.state = state as StaffState;
  }

  // If deactivating, invalidate all sessions immediately
  if (patch.state === StaffState.DEACTIVATED) {
    try {
      await invalidateAllSessions(db, target.id);
    } catch (err) {
      console.error("[staff-patch] Failed to invalidate sessions on deactivation:", err);
    }
  }

  const updateResult = await staffRepo.update(venue.id, id, patch);
  if (!updateResult.ok) {
    return NextResponse.json(
      { error: { code: updateResult.error.code, message: updateResult.error.message } },
      { status: 500 }
    );
  }

  const updated = updateResult.value;
  return NextResponse.json(
    {
      data: {
        id: updated.id,
        venueId: updated.venueId,
        name: updated.name,
        username: updated.username,
        roles: updated.roles,
        state: updated.state,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    },
    { status: 200 }
  );
};

const patchMeta: AuditMeta = { route: "/api/admin/staff/[id]", method: "PATCH" };

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

export const PATCH = withAuditedDynamicRoute<{ id: string }>(
  resolvers,
  patchMeta,
  withCsrf(patchHandler)
);
