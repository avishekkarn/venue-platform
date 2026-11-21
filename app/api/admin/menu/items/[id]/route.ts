/**
 * PATCH /api/admin/menu/items/[id] — update a menu item for the venue.
 *
 * Accepts a partial body: name?, description?, photoUrl?, photoBlurData?,
 * price?, categoryIds?, state?, sortOrder?.
 *
 * Guards:
 *   - withAuditedDynamicRoute(resolvers, meta, withCsrf(patchHandler)) —
 *     audit-outer, CSRF-inner (D-20.1, D-24.1, W-0021).
 *   - Session (admin-only: MANAGER or OWNER; LEADER -> 403).
 *   - Category-vs-venue check if categoryIds is provided (D-10.2).
 *   - Decimal string validation if price is provided.
 *
 * Returns { data: MenuItem } at 200.
 *
 * Reference: ROADMAP.md §12 (8.3.3), D-4.2, D-10.2, D-20.1, D-24.1, W-0021.
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
import {
  MenuItemState,
  type UpdateItemInput,
} from "@/domain/menu/menu.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAuditedDynamicRoute,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";
import { deleteUploadedPhoto } from "@/infrastructure/media/delete-upload";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DECIMAL_STRING = /^\d+(\.\d{1,2})?$/;

const ALLOWED_FIELDS = new Set([
  "name",
  "description",
  "photoUrl",
  "photoBlurData",
  "price",
  "categoryIds",
  "state",
  "sortOrder",
]);

function domainErrorToStatus(code: DomainErrorCode): number {
  switch (code) {
    case DomainErrorCode.NOT_FOUND:
      return 404;
    case DomainErrorCode.UNAUTHORIZED:
      return 401;
    case DomainErrorCode.FORBIDDEN:
      return 403;
    case DomainErrorCode.VALIDATION_FAILED:
      return 400;
    case DomainErrorCode.CONFLICT:
    case DomainErrorCode.INVALID_STATE:
      return 409;
    case DomainErrorCode.RATE_LIMITED:
      return 429;
    case DomainErrorCode.INTERNAL:
    default:
      return 500;
  }
}

const patchHandler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;

  // 1. Session check: active staff session
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

  // 2. Resolve venue
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Staff check and admin role verification
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  const staff = staffResult.value;
  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 4. Validate item ID from route params
  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid menu item id format" } },
      { status: 400 }
    );
  }
  const itemId = id.trim();

  // 5. Parse JSON body
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
  const keys = Object.keys(body);

  if (keys.length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Request body cannot be empty" } },
      { status: 400 }
    );
  }

  for (const key of keys) {
    if (!ALLOWED_FIELDS.has(key)) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: `Unknown field '${key}'` } },
        { status: 400 }
      );
    }
  }

  const updateInput: UpdateItemInput = {};

  if (body["name"] !== undefined) {
    const name = body["name"];
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "name must be a non-empty string" } },
        { status: 400 }
      );
    }
    (updateInput as { name?: string }).name = name.trim();
  }

  if (body["description"] !== undefined) {
    const description = body["description"];
    if (description !== null && typeof description !== "string") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "description must be a string or null" } },
        { status: 400 }
      );
    }
    (updateInput as { description?: string | null }).description = description;
  }

  if (body["photoUrl"] !== undefined) {
    const photoUrl = body["photoUrl"];
    if (photoUrl !== null && typeof photoUrl !== "string") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "photoUrl must be a string or null" } },
        { status: 400 }
      );
    }
    (updateInput as { photoUrl?: string | null }).photoUrl = photoUrl;
  }

  if (body["photoBlurData"] !== undefined) {
    const photoBlurData = body["photoBlurData"];
    if (photoBlurData !== null && typeof photoBlurData !== "string") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "photoBlurData must be a string or null" } },
        { status: 400 }
      );
    }
    (updateInput as { photoBlurData?: string | null }).photoBlurData = photoBlurData;
  }

  if (body["price"] !== undefined) {
    const price = body["price"];
    if (typeof price !== "string" || !DECIMAL_STRING.test(price)) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "price must be a decimal string" } },
        { status: 400 }
      );
    }
    (updateInput as { price?: string }).price = price;
  }

  if (body["categoryIds"] !== undefined) {
    const categoryIdsRaw = body["categoryIds"];
    if (
      !Array.isArray(categoryIdsRaw) ||
      categoryIdsRaw.length === 0 ||
      !categoryIdsRaw.every((id) => typeof id === "string" && id.trim().length > 0)
    ) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "categoryIds must be a non-empty array of strings" } },
        { status: 400 }
      );
    }
    (updateInput as { categoryIds?: readonly string[] }).categoryIds = (categoryIdsRaw as string[]).map((id) => id.trim());
  }

  if (body["state"] !== undefined) {
    const state = body["state"];
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
    (updateInput as { state?: MenuItemState }).state = state;
  }

  if (body["sortOrder"] !== undefined) {
    const sortOrder = body["sortOrder"];
    if (typeof sortOrder !== "number") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "sortOrder must be a number" } },
        { status: 400 }
      );
    }
    (updateInput as { sortOrder?: number }).sortOrder = sortOrder;
  }

  const menuRepo = createPrismaMenuRepository(db);

  // 6. If categoryIds provided, verify they belong to venue (D-10.2)
  if (updateInput.categoryIds !== undefined) {
    const categoriesResult = await menuRepo.listCategories(venue.id);
    if (!categoriesResult.ok) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read categories" } },
        { status: 500 }
      );
    }
    const venueCategoryIds = new Set(categoriesResult.value.map((c) => c.id));
    const allCategoriesBelong = updateInput.categoryIds.every((id) =>
      venueCategoryIds.has(id)
    );
    if (!allCategoriesBelong) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Category not found for this venue" } },
        { status: 400 }
      );
    }
  }

  // 6.5. Clean up obsolete photo if photoUrl is being replaced or removed
  if (updateInput.photoUrl !== undefined) {
    const existingItem = await menuRepo.getItemWithModifiers(venue.id, itemId);
    if (
      existingItem.ok &&
      existingItem.value.photoUrl &&
      existingItem.value.photoUrl !== updateInput.photoUrl
    ) {
      await deleteUploadedPhoto(existingItem.value.photoUrl);
    }
  }

  // 7. Update menu item
  const result = await menuRepo.updateItem(venue.id, itemId, updateInput);
  if (!result.ok) {
    const status = domainErrorToStatus(result.error.code);
    return NextResponse.json(
      {
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      },
      { status }
    );
  }

  return NextResponse.json(
    { data: result.value },
    { status: 200 }
  );
};

const meta: AuditMeta = {
  route: "/api/admin/menu/items/[id]",
  method: "PATCH",
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

export const PATCH = withAuditedDynamicRoute<{ id: string }>(
  resolvers,
  meta,
  withCsrf(patchHandler)
);

const deleteHandler = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
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

  const staff = staffResult.value;
  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid menu item id format" } },
      { status: 400 }
    );
  }
  const itemId = id.trim();

  const menuRepo = createPrismaMenuRepository(db);
  const existing = await menuRepo.getItemWithModifiers(venue.id, itemId);
  if (!existing.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: "Menu item not found" } },
      { status: 404 }
    );
  }

  if (existing.value.photoUrl) {
    await deleteUploadedPhoto(existing.value.photoUrl);
  }

  const deleteResult = await menuRepo.deleteItem(venue.id, itemId);
  if (!deleteResult.ok) {
    const status = domainErrorToStatus(deleteResult.error.code);
    return NextResponse.json(
      {
        error: {
          code: deleteResult.error.code,
          message: deleteResult.error.message,
        },
      },
      { status }
    );
  }

  return new NextResponse(null, { status: 204 });
};

const deleteMeta: AuditMeta = {
  route: "/api/admin/menu/items/[id]",
  method: "DELETE",
};

export const DELETE = withAuditedDynamicRoute<{ id: string }>(
  resolvers,
  deleteMeta,
  withCsrf(deleteHandler)
);
