/**
 * POST /api/admin/menu/modifiers/[id]/options — create a modifier option under group [id].
 *
 * Phase 8.3.6. Admin-only (MANAGER or OWNER; LEADER -> 403),
 * audited via withAuditedDynamicRoute<{ id: string }> (W-0021),
 * CSRF-protected with withCsrf (D-20.1).
 *
 * Body: { name: string, additionalPrice: string, sortOrder?: number }.
 * Returns { data: ModifierOption } at 201.
 *
 * Reference: ROADMAP.md §12 (8.3.6), BUILD.md §7.1, D-10.2, D-20.1, W-0021.
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
const DECIMAL_STRING = /^\d+(\.\d{1,2})?$/;

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

async function resolveAdminContext(db: DbClient): Promise<
  | { ok: true; venueId: string }
  | { ok: false; status: number; code: string; message: string }
> {
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return { ok: false, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return { ok: false, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return { ok: false, status: 500, code: DomainErrorCode.INTERNAL, message: "Venue not configured" };
  }
  const venue = venueResult.value;
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return { ok: false, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  if (!canAccess(staffResult.value.roles, "admin")) {
    return { ok: false, status: 403, code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" };
  }
  return { ok: true, venueId: venue.id };
}

const postHandler = async (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;

  const ctx = await resolveAdminContext(db);
  if (!ctx.ok) {
    return NextResponse.json(
      { error: { code: ctx.code, message: ctx.message } },
      { status: ctx.status }
    );
  }

  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid modifier group id format" } },
      { status: 400 }
    );
  }
  const groupId = id.trim();

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
  const additionalPrice = body["additionalPrice"];
  const sortOrderRaw = body["sortOrder"];

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "name is required" } },
      { status: 400 }
    );
  }

  if (
    typeof additionalPrice !== "string" ||
    !DECIMAL_STRING.test(additionalPrice.trim())
  ) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "additionalPrice must be a decimal string (e.g. '2.50')",
        },
      },
      { status: 400 }
    );
  }

  let sortOrder: number | undefined;
  if (sortOrderRaw !== undefined && sortOrderRaw !== null) {
    if (typeof sortOrderRaw !== "number") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "sortOrder must be a number" } },
        { status: 400 }
      );
    }
    sortOrder = sortOrderRaw;
  }

  // Verify group belongs to this venue (D-10.2)
  const group = await (db as PrismaClient).modifierGroup.findFirst({
    where: {
      id: groupId,
      menuItem: { venueId: ctx.venueId },
    },
  });
  if (!group) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: "Modifier group not found in this venue" } },
      { status: 404 }
    );
  }

  const menuRepo = createPrismaMenuRepository(db);
  const result = await menuRepo.createModifierOption({
    modifierGroupId: groupId,
    name: name.trim(),
    additionalPrice: additionalPrice.trim(),
    sortOrder,
  });

  if (!result.ok) {
    const status = domainErrorToStatus(result.error.code);
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  return NextResponse.json({ data: result.value }, { status: 201 });
};

const postMeta: AuditMeta = {
  route: "/api/admin/menu/modifiers/[id]/options",
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
