/**
 * POST /api/admin/menu/modifiers — create a modifier group.
 *
 * Phase 8.3.6. Admin-only (MANAGER or OWNER; LEADER -> 403),
 * audited via withAudit (W-0021), CSRF-protected with withCsrf (D-20.1).
 *
 * Body: { menuItemId: string, name: string, choiceType?: "SINGLE" | "MULTIPLE", isRequired?: boolean, sortOrder?: number }.
 * Returns { data: ModifierGroup } at 201.
 *
 * Reference: ROADMAP.md §12 (8.3.6), D-10.2, D-20.1, W-0021.
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
import { ModifierChoiceType } from "@/domain/menu/menu.repository";
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

const postHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;

  const ctx = await resolveAdminContext(db);
  if (!ctx.ok) {
    return NextResponse.json(
      { error: { code: ctx.code, message: ctx.message } },
      { status: ctx.status }
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
  const menuItemId = body["menuItemId"];
  const name = body["name"];
  const choiceTypeRaw = body["choiceType"];
  const isRequiredRaw = body["isRequired"];
  const sortOrderRaw = body["sortOrder"];

  if (typeof menuItemId !== "string" || menuItemId.trim().length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "menuItemId is required" } },
      { status: 400 }
    );
  }

  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "name is required" } },
      { status: 400 }
    );
  }

  let choiceType: ModifierChoiceType | undefined;
  if (choiceTypeRaw !== undefined && choiceTypeRaw !== null) {
    if (choiceTypeRaw === "SINGLE" || choiceTypeRaw === ModifierChoiceType.SINGLE) {
      choiceType = ModifierChoiceType.SINGLE;
    } else if (choiceTypeRaw === "MULTIPLE" || choiceTypeRaw === ModifierChoiceType.MULTIPLE) {
      choiceType = ModifierChoiceType.MULTIPLE;
    } else {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "choiceType must be SINGLE or MULTIPLE" } },
        { status: 400 }
      );
    }
  }

  let isRequired: boolean | undefined;
  if (isRequiredRaw !== undefined && isRequiredRaw !== null) {
    if (typeof isRequiredRaw !== "boolean") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "isRequired must be a boolean" } },
        { status: 400 }
      );
    }
    isRequired = isRequiredRaw;
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

  // Verify menuItemId belongs to this venue (D-10.2)
  const menuItem = await (db as PrismaClient).menuItem.findFirst({
    where: { id: menuItemId.trim(), venueId: ctx.venueId },
  });
  if (!menuItem) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Menu item not found for this venue" } },
      { status: 400 }
    );
  }

  const menuRepo = createPrismaMenuRepository(db);
  const result = await menuRepo.createModifierGroup({
    menuItemId: menuItemId.trim(),
    name: name.trim(),
    choiceType,
    isRequired,
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
  route: "/api/admin/menu/modifiers",
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

export const POST = withAudit(resolvers, postMeta, withCsrf(postHandler));
