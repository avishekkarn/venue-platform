/**
 * PATCH /api/admin/rooms/[id] — update room
 * DELETE /api/admin/rooms/[id] — delete room
 *
 * Milestone 8.5.4. Admin-only (OWNER or MANAGER), audited, withCsrf.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { RoomState } from "@/domain/organization/room.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import {
  withAuditedDynamicRoute,
  type AuditedDynamicRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";

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

type Params = { id: string };

const patchHandler: AuditedDynamicRouteHandler<Params> = async (
  request: NextRequest,
  context: { params: Promise<Params> }
) => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "id is required" } },
      { status: 400 }
    );
  }

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

  const { number, categoryId, state } = body as Record<string, unknown>;

  if (state !== undefined && !Object.values(RoomState).includes(state as RoomState)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid room state" } },
      { status: 400 }
    );
  }

  const roomRepo = createPrismaRoomRepository(db);

  if (categoryId !== undefined && categoryId !== null) {
    if (typeof categoryId !== "string") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "categoryId must be a string" } },
        { status: 400 }
      );
    }
    const catResult = await roomRepo.findCategoryById(auth.venue.id, categoryId);
    if (!catResult.ok) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.NOT_FOUND, message: "Room category not found" } },
        { status: 404 }
      );
    }
  }

  const result = await roomRepo.update(auth.venue.id, id, {
    number: typeof number === "string" ? number.trim() : undefined,
    categoryId: categoryId === null ? null : typeof categoryId === "string" ? categoryId : undefined,
    state: state as RoomState | undefined,
  });

  if (!result.ok) {
    const status =
      result.error.code === DomainErrorCode.NOT_FOUND
        ? 404
        : result.error.code === DomainErrorCode.CONFLICT
        ? 409
        : 500;
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  return NextResponse.json({ data: result.value }, { status: 200 });
};

const deleteHandler: AuditedDynamicRouteHandler<Params> = async (
  _request: NextRequest,
  context: { params: Promise<Params> }
) => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "id is required" } },
      { status: 400 }
    );
  }

  const roomRepo = createPrismaRoomRepository(db);
  const result = await roomRepo.delete(auth.venue.id, id);

  if (!result.ok) {
    const status =
      result.error.code === DomainErrorCode.NOT_FOUND
        ? 404
        : result.error.code === DomainErrorCode.CONFLICT
        ? 409
        : 500;
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
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

const patchMeta: AuditMeta = { route: "/api/admin/rooms/[id]", method: "PATCH" };
const deleteMeta: AuditMeta = { route: "/api/admin/rooms/[id]", method: "DELETE" };

export const PATCH = withAuditedDynamicRoute<Params>(
  resolvers,
  patchMeta,
  withCsrf(patchHandler)
);

export const DELETE = withAuditedDynamicRoute<Params>(
  resolvers,
  deleteMeta,
  withCsrf(deleteHandler)
);
