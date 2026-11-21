/**
 * GET /api/admin/rooms/categories — list room categories
 * POST /api/admin/rooms/categories — create a room category
 *
 * Milestone 8.5.4. Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), POST with CSRF protection (withCsrf).
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
import { DomainErrorCode } from "@/domain/shared/result";
import {
  withAudit,
  type AuditedRouteHandler,
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

const getHandler: AuditedRouteHandler = async (_request: NextRequest) => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const roomRepo = createPrismaRoomRepository(db);
  const result = await roomRepo.listCategories(auth.venue.id);
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read room categories" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: result.value }, { status: 200 });
};

const postHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
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

  const { name, description, basePrice, sortOrder } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "name is required" } },
      { status: 400 }
    );
  }

  let parsedPrice: number = 0;
  if (basePrice !== undefined && basePrice !== null) {
    const num = Number(basePrice);
    if (isNaN(num) || num < 0) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "basePrice must be a non-negative number" } },
        { status: 400 }
      );
    }
    parsedPrice = num;
  }

  const roomRepo = createPrismaRoomRepository(db);
  const result = await roomRepo.createCategory(auth.venue.id, {
    name: name.trim(),
    description: typeof description === "string" ? description.trim() : null,
    basePrice: parsedPrice.toFixed(2),
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
  });

  if (!result.ok) {
    const status = result.error.code === DomainErrorCode.CONFLICT ? 409 : 500;
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
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

const getMeta: AuditMeta = { route: "/api/admin/rooms/categories", method: "GET" };
const postMeta: AuditMeta = { route: "/api/admin/rooms/categories", method: "POST" };

export const GET = withAudit(resolvers, getMeta, getHandler);
export const POST = withAudit(resolvers, postMeta, withCsrf(postHandler));
