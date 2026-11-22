/**
 * POST /api/admin/sessions/[id]/end — force terminate any active guest session
 *
 * Universal session termination for Counter, Table, or Room guest sessions.
 * Milestone 8.5.10a. Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAuditedDynamicRoute), CSRF-protected (withCsrf).
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAuditedDynamicRoute,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveAdmin(db: DbClient) {
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return { ok: false as const, status: 500, code: DomainErrorCode.INTERNAL, message: "Venue not configured" };
  }
  const venue = venueResult.value;

  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  if (!canAccess(staffResult.value.roles, "admin")) {
    return { ok: false as const, status: 403, code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" };
  }

  return { ok: true as const, venue, staff: staffResult.value };
}

const postHandler = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const { id } = await context.params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid session ID" } },
      { status: 400 }
    );
  }

  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const guestSession = await db.guestSession.findFirst({
    where: { id, venueId: auth.venue.id },
  });

  if (!guestSession) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: `Guest session '${id}' not found` } },
      { status: 404 }
    );
  }

  // Terminate session
  await db.guestSession.update({
    where: { id },
    data: { endedAt: new Date() },
  });

  // Cancel any open service requests bound to this session
  await db.serviceRequest.updateMany({
    where: {
      venueId: auth.venue.id,
      guestSessionId: id,
      state: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] },
    },
    data: { state: "CANCELLED" },
  });

  // If table-bound, reset table state to FREE if no other active sessions
  if (guestSession.tableId) {
    const remainingActive = await db.guestSession.count({
      where: { venueId: auth.venue.id, tableId: guestSession.tableId, endedAt: null },
    });
    if (remainingActive === 0) {
      await db.table.update({
        where: { id: guestSession.tableId },
        data: { state: "FREE" },
      });
    }
  }

  // If room-bound, reset room state to VACANT if no other active sessions
  if (guestSession.roomId) {
    const remainingActive = await db.guestSession.count({
      where: { venueId: auth.venue.id, roomId: guestSession.roomId, endedAt: null },
    });
    if (remainingActive === 0) {
      await db.room.update({
        where: { id: guestSession.roomId },
        data: { state: "VACANT" },
      });
    }
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
};

const postMeta: AuditMeta = { route: "/api/admin/sessions/[id]/end", method: "POST" };

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
