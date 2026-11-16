/**
 * GET /api/admin/menu/collections — the venue's collections.
 * POST /api/admin/menu/collections — create a collection.
 *
 * Phase 8.3.5c. Both are admin-only (MANAGER or OWNER; LEADER -> 403),
 * both are audited (withAudit, W-0021), and POST is CSRF-protected
 * (withCsrf, D-20.1).
 *
 * GET accepts an optional ?at=<iso> query param for the date-window filter.
 * Returns { data: MenuCollectionView[] } at 200.
 *
 * POST body: { name: string, featuredFrom?: string | null, featuredTo?: string | null, sortOrder?: number }.
 * Returns { data: MenuCollection } at 201.
 *
 * Reference: ROADMAP.md §12 (8.3.5c), D-10.2, D-20.1, D-25.2, W-0021.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
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

const getHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;

  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  if (!canAccess(staffResult.value.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  const url = new URL(request.url);
  const atParam = url.searchParams.get("at");
  let at = new Date();
  if (atParam !== null) {
    at = new Date(atParam);
    if (isNaN(at.getTime())) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid date format for 'at' parameter" } },
        { status: 400 }
      );
    }
  }

  const menuRepo = createPrismaMenuRepository(db);
  const collectionsResult = await menuRepo.listCollections(venue.id, at);
  if (!collectionsResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read collections" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: collectionsResult.value }, { status: 200 });
};

const postHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;

  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  if (!canAccess(staffResult.value.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
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
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Request body must be a JSON object" } },
      { status: 400 }
    );
  }

  const body = rawBody as Record<string, unknown>;
  const name = body["name"];
  const featuredFromRaw = body["featuredFrom"];
  const featuredToRaw = body["featuredTo"];
  const sortOrder = body["sortOrder"];

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "name is required" } },
      { status: 400 }
    );
  }

  let featuredFrom: Date | null = null;
  if (featuredFromRaw !== undefined && featuredFromRaw !== null) {
    if (typeof featuredFromRaw !== "string") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "featuredFrom must be a date string" } },
        { status: 400 }
      );
    }
    featuredFrom = new Date(featuredFromRaw);
    if (isNaN(featuredFrom.getTime())) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid date format for 'featuredFrom'" } },
        { status: 400 }
      );
    }
  }

  let featuredTo: Date | null = null;
  if (featuredToRaw !== undefined && featuredToRaw !== null) {
    if (typeof featuredToRaw !== "string") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "featuredTo must be a date string" } },
        { status: 400 }
      );
    }
    featuredTo = new Date(featuredToRaw);
    if (isNaN(featuredTo.getTime())) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid date format for 'featuredTo'" } },
        { status: 400 }
      );
    }
  }

  if (sortOrder !== undefined && sortOrder !== null && typeof sortOrder !== "number") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "sortOrder must be a number" } },
      { status: 400 }
    );
  }

  const menuRepo = createPrismaMenuRepository(db);
  const created = await menuRepo.createCollection({
    venueId: venue.id,
    name: name.trim(),
    featuredFrom,
    featuredTo,
    sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
  });

  if (!created.ok) {
    const status = created.error.code === DomainErrorCode.CONFLICT ? 409 : 500;
    return NextResponse.json(
      { error: { code: created.error.code, message: created.error.message } },
      { status }
    );
  }

  return NextResponse.json({ data: created.value }, { status: 201 });
};

const getMeta: AuditMeta = { route: "/api/admin/menu/collections", method: "GET" };
const postMeta: AuditMeta = { route: "/api/admin/menu/collections", method: "POST" };

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

export const GET = withAudit(resolvers, getMeta, getHandler);
export const POST = withAudit(resolvers, postMeta, withCsrf(postHandler));
