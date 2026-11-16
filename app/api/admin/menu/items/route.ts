/**
 * POST /api/admin/menu/items — create a menu item for the venue.
 *
 * The body: { name, description?, photoUrl?, photoBlurData?, price,
 * categoryId, state? }. `price` is a decimal string. `state` defaults to
 * AVAILABLE. `photoUrl` and `photoBlurData` are the upload route's return
 * values (8.3.0); they are optional (the item can be created without a
 * photo).
 *
 * Guards:
 *   - withAudit(resolvers, meta, withCsrf(handler)) — audit-outer,
 *     CSRF-inner (D-20.1). The 403 rejection is audited (W-0021).
 *   - Session (admin-only: MANAGER or OWNER; LEADER -> 403).
 *   - The categoryId belongs to the resolved venue (D-10.2); a
 *     cross-venue category -> 400 VALIDATION_FAILED.
 *
 * Returns { data: MenuItem } at 201.
 *
 * Reference: ROADMAP.md §12 (8.3.2), D-4.2, D-10.2, D-20.1, D-22.1,
 * D-23.1, W-0021, W-0025.
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
import { MenuItemState } from "@/domain/menu/menu.repository";
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

const DECIMAL_STRING = /^\d+(\.\d{1,2})?$/;

const routeHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;

  // 1. Session
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

  // 2. Venue
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Staff + role
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "Staff not found" } },
      { status: 401 }
    );
  }
  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "Staff deactivated" } },
      { status: 401 }
    );
  }
  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Forbidden" } },
      { status: 403 }
    );
  }

  // 4. Parse + validate the body
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
  const price = body["price"];
  const categoryId = body["categoryId"];
  const description = body["description"];
  const photoUrl = body["photoUrl"];
  const photoBlurData = body["photoBlurData"];
  const state = body["state"];
  const sortOrder = body["sortOrder"];

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "name is required" } },
      { status: 400 }
    );
  }
  if (typeof price !== "string" || !DECIMAL_STRING.test(price)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "price must be a decimal string" } },
      { status: 400 }
    );
  }
  if (typeof categoryId !== "string" || categoryId.trim().length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "categoryId is required" } },
      { status: 400 }
    );
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "description must be a string" } },
      { status: 400 }
    );
  }
  if (photoUrl !== undefined && photoUrl !== null && typeof photoUrl !== "string") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "photoUrl must be a string" } },
      { status: 400 }
    );
  }
  if (photoBlurData !== undefined && photoBlurData !== null && typeof photoBlurData !== "string") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "photoBlurData must be a string" } },
      { status: 400 }
    );
  }

  let targetState: MenuItemState = MenuItemState.AVAILABLE;
  if (state !== undefined && state !== null) {
    if (
      state !== MenuItemState.AVAILABLE &&
      state !== MenuItemState.UNAVAILABLE &&
      state !== MenuItemState.HIDDEN
    ) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "state must be AVAILABLE, UNAVAILABLE, or HIDDEN" } },
        { status: 400 }
      );
    }
    targetState = state;
  }

  if (sortOrder !== undefined && sortOrder !== null && typeof sortOrder !== "number") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "sortOrder must be a number" } },
      { status: 400 }
    );
  }

  // 5. Category-vs-venue check (D-10.2)
  const menuRepo = createPrismaMenuRepository(db);
  const categoriesResult = await menuRepo.listCategories(venue.id);
  if (!categoriesResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read categories" } },
      { status: 500 }
    );
  }
  const categoryBelongsToVenue = categoriesResult.value.some((c) => c.id === categoryId);
  if (!categoryBelongsToVenue) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Category not found for this venue" } },
      { status: 400 }
    );
  }

  // 6. Create
  const created = await menuRepo.createItem({
    venueId: venue.id,
    categoryId,
    name: name.trim(),
    description: description === undefined ? null : (description as string | null),
    photoUrl: photoUrl === undefined ? null : (photoUrl as string | null),
    photoBlurData: photoBlurData === undefined ? null : (photoBlurData as string | null),
    price,
    sortOrder: sortOrder === undefined ? undefined : (sortOrder as number),
    state: targetState,
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

const meta: AuditMeta = {
  route: "/api/admin/menu/items",
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
    const staffResult = await staffRepo.findById(venueResult.value.id, session.staffMemberId);
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

export const POST = withAudit(resolvers, meta, withCsrf(routeHandler));
