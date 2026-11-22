/**
 * PATCH /api/admin/counters/[id] — update counter name
 * DELETE /api/admin/counters/[id] — delete counter
 *
 * Milestone 8.5.10c. Admin-only (OWNER or MANAGER; LEADER -> 403),
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

const patchHandler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const { id } = await context.params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid counter ID" } },
      { status: 400 }
    );
  }

  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { name } = (rawBody as { name?: unknown }) ?? {};
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Counter name is required" } },
      { status: 400 }
    );
  }

  const existing = await db.counter.findFirst({
    where: { id, venueId: auth.venue.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: `Counter '${id}' not found` } },
      { status: 404 }
    );
  }

  const updated = await db.counter.update({
    where: { id },
    data: { name: name.trim() },
  });

  return NextResponse.json({ data: updated }, { status: 200 });
};

const deleteHandler = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const { id } = await context.params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid counter ID" } },
      { status: 400 }
    );
  }

  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const existing = await db.counter.findFirst({
    where: { id, venueId: auth.venue.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: `Counter '${id}' not found` } },
      { status: 404 }
    );
  }

  // Reject if active sessions exist
  const activeSessions = await db.guestSession.count({
    where: { venueId: auth.venue.id, counterId: id, endedAt: null },
  });
  if (activeSessions > 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.CONFLICT, message: "Cannot delete counter with active guest sessions. End sessions first." } },
      { status: 409 }
    );
  }

  // Revoke any active QR tokens before deleting
  await db.qrToken.updateMany({
    where: { venueId: auth.venue.id, counterId: id, state: "ACTIVE" },
    data: { state: "REVOKED", revokedAt: new Date() },
  });

  await db.counter.delete({
    where: { id },
  });

  return NextResponse.json({ data: { success: true } }, { status: 200 });
};

const patchMeta: AuditMeta = { route: "/api/admin/counters/[id]", method: "PATCH" };
const deleteMeta: AuditMeta = { route: "/api/admin/counters/[id]", method: "DELETE" };

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
export const DELETE = withAuditedDynamicRoute<{ id: string }>(
  resolvers,
  deleteMeta,
  withCsrf(deleteHandler)
);
