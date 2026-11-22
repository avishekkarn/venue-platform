/**
 * POST /api/admin/qr/generate-missing — generate active QR tokens for all places missing one
 *
 * Milestone 8.5.10b. Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), CSRF-protected (withCsrf).
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
import { PlaceType } from "@/domain/qr/qr-token.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

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

const postHandler: AuditedRouteHandler = async (_request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;

  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  // 1. Fetch all places
  const [tables, rooms, counters, activeTokens] = await Promise.all([
    db.table.findMany({ where: { venueId: auth.venue.id }, select: { id: true } }),
    db.room.findMany({ where: { venueId: auth.venue.id }, select: { id: true } }),
    db.counter.findMany({ where: { venueId: auth.venue.id }, select: { id: true } }),
    db.qrToken.findMany({
      where: { venueId: auth.venue.id, state: "ACTIVE" },
      select: { tableId: true, roomId: true, counterId: true },
    }),
  ]);

  const activeTableIds = new Set(activeTokens.map((t) => t.tableId).filter(Boolean));
  const activeRoomIds = new Set(activeTokens.map((t) => t.roomId).filter(Boolean));
  const activeCounterIds = new Set(activeTokens.map((t) => t.counterId).filter(Boolean));

  const missingTokens: Array<{
    venueId: string;
    placeType: PlaceType;
    tableId: string | null;
    roomId: string | null;
    counterId: string | null;
    state: "ACTIVE";
  }> = [];

  for (const t of tables) {
    if (!activeTableIds.has(t.id)) {
      missingTokens.push({
        venueId: auth.venue.id,
        placeType: PlaceType.TABLE,
        tableId: t.id,
        roomId: null,
        counterId: null,
        state: "ACTIVE",
      });
    }
  }

  for (const r of rooms) {
    if (!activeRoomIds.has(r.id)) {
      missingTokens.push({
        venueId: auth.venue.id,
        placeType: PlaceType.ROOM,
        tableId: null,
        roomId: r.id,
        counterId: null,
        state: "ACTIVE",
      });
    }
  }

  for (const c of counters) {
    if (!activeCounterIds.has(c.id)) {
      missingTokens.push({
        venueId: auth.venue.id,
        placeType: PlaceType.COUNTER,
        tableId: null,
        roomId: null,
        counterId: c.id,
        state: "ACTIVE",
      });
    }
  }

  if (missingTokens.length > 0) {
    await db.qrToken.createMany({
      data: missingTokens,
    });
  }

  return NextResponse.json({ data: { generatedCount: missingTokens.length } }, { status: 200 });
};

const postMeta: AuditMeta = { route: "/api/admin/qr/generate-missing", method: "POST" };

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

export const POST = withAudit(resolvers, postMeta, withCsrf(postHandler));
