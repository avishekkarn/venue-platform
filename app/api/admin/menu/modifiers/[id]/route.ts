/**
 * PATCH /api/admin/menu/modifiers/[id] — update a modifier group.
 * DELETE /api/admin/menu/modifiers/[id] — delete a modifier group.
 *
 * Phase 8.3.6. Both are admin-only (MANAGER or OWNER; LEADER -> 403),
 * both use withAuditedDynamicRoute<{ id: string }> + withCsrf (D-20.1, W-0021).
 *
 * PATCH body: { name?: string, choiceType?: "SINGLE" | "MULTIPLE", isRequired?: boolean, sortOrder?: number }.
 * Returns { data: ModifierGroup } at 200.
 *
 * DELETE: Returns 204 No Content.
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
import {
  ModifierChoiceType,
  type UpdateModifierGroupInput,
} from "@/domain/menu/menu.repository";
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

const patchHandler = async (
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
  const choiceTypeRaw = body["choiceType"];
  const isRequiredRaw = body["isRequired"];
  const sortOrderRaw = body["sortOrder"];

  if (
    name === undefined &&
    choiceTypeRaw === undefined &&
    isRequiredRaw === undefined &&
    sortOrderRaw === undefined
  ) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "At least one field must be provided" } },
      { status: 400 }
    );
  }

  let targetName: string | undefined;
  let targetChoiceType: ModifierChoiceType | undefined;
  let targetIsRequired: boolean | undefined;
  let targetSortOrder: number | undefined;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "name must be a non-empty string" } },
        { status: 400 }
      );
    }
    targetName = name.trim();
  }

  if (choiceTypeRaw !== undefined) {
    if (choiceTypeRaw === "SINGLE" || choiceTypeRaw === ModifierChoiceType.SINGLE) {
      targetChoiceType = ModifierChoiceType.SINGLE;
    } else if (choiceTypeRaw === "MULTIPLE" || choiceTypeRaw === ModifierChoiceType.MULTIPLE) {
      targetChoiceType = ModifierChoiceType.MULTIPLE;
    } else {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "choiceType must be SINGLE or MULTIPLE" } },
        { status: 400 }
      );
    }
  }

  if (isRequiredRaw !== undefined) {
    if (typeof isRequiredRaw !== "boolean") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "isRequired must be a boolean" } },
        { status: 400 }
      );
    }
    targetIsRequired = isRequiredRaw;
  }

  if (sortOrderRaw !== undefined) {
    if (typeof sortOrderRaw !== "number") {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "sortOrder must be a number" } },
        { status: 400 }
      );
    }
    targetSortOrder = sortOrderRaw;
  }

  const input: UpdateModifierGroupInput = {
    ...(targetName !== undefined ? { name: targetName } : {}),
    ...(targetChoiceType !== undefined ? { choiceType: targetChoiceType } : {}),
    ...(targetIsRequired !== undefined ? { isRequired: targetIsRequired } : {}),
    ...(targetSortOrder !== undefined ? { sortOrder: targetSortOrder } : {}),
  };

  const menuRepo = createPrismaMenuRepository(db);
  const updated = await menuRepo.updateModifierGroup(ctx.venueId, groupId, input);
  if (!updated.ok) {
    const status = domainErrorToStatus(updated.error.code);
    return NextResponse.json(
      { error: { code: updated.error.code, message: updated.error.message } },
      { status }
    );
  }

  return NextResponse.json({ data: updated.value }, { status: 200 });
};

const deleteHandler = async (
  _request: NextRequest,
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

  const menuRepo = createPrismaMenuRepository(db);
  const deleted = await menuRepo.deleteModifierGroup(ctx.venueId, groupId);
  if (!deleted.ok) {
    const status = domainErrorToStatus(deleted.error.code);
    return NextResponse.json(
      { error: { code: deleted.error.code, message: deleted.error.message } },
      { status }
    );
  }

  return new NextResponse(null, { status: 204 });
};

const patchMeta: AuditMeta = {
  route: "/api/admin/menu/modifiers/[id]",
  method: "PATCH",
};
const deleteMeta: AuditMeta = {
  route: "/api/admin/menu/modifiers/[id]",
  method: "DELETE",
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
  patchMeta,
  withCsrf(patchHandler)
);
export const DELETE = withAuditedDynamicRoute<{ id: string }>(
  resolvers,
  deleteMeta,
  withCsrf(deleteHandler)
);
