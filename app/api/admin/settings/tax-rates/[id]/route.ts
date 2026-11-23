/**
 * PATCH /api/admin/settings/tax-rates/[id] — update tax rate name, default status, or active status
 *
 * Milestone 8.8 (Tax Rates Expansion, D-4.13).
 * Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAuditedDynamicRoute), CSRF-protected on PATCH (withCsrf).
 * Rate value is immutable once created.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { resolveAdminContext, adminResolvers, type DbClient } from "@/infrastructure/auth/admin-context";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAuditedDynamicRoute,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import {
  validateUpdateTaxRate,
  triggerDebouncedSeedSnapshot,
  type TaxRateSummary,
} from "@/domain/settings";

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchHandler = async (
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const { id } = await context.params;

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Malformed JSON body" } },
      { status: 400 }
    );
  }

  const existing = await db.taxRate.findFirst({
    where: { id, venueId: auth.venue.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: "Tax rate not found" } },
      { status: 404 }
    );
  }

  // Reject rate mutation (immutable per D-4.13)
  if ("rate" in rawBody && rawBody.rate !== undefined) {
    const attemptedRate = String(rawBody.rate);
    if (attemptedRate !== existing.rate.toFixed(4) && attemptedRate !== existing.rate.toString()) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Tax rate values are immutable once created (D-4.13). Deactivate and create a new tax rate instead.",
          },
        },
        { status: 400 }
      );
    }
  }

  const validation = validateUpdateTaxRate({
    name: typeof rawBody.name === "string" ? rawBody.name : undefined,
    isDefault: typeof rawBody.isDefault === "boolean" ? rawBody.isDefault : undefined,
    isActive: typeof rawBody.isActive === "boolean" ? rawBody.isActive : undefined,
  });

  if (!validation.ok) {
    return NextResponse.json(
      { error: { code: validation.error.code, message: validation.error.message } },
      { status: 400 }
    );
  }

  const input = validation.value;

  // Cannot deactivate the venue default rate
  const isCurrentlyDefault = existing.isDefault || auth.venue.taxRateId === existing.id;
  if (input.isActive === false && isCurrentlyDefault && input.isDefault !== false) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Cannot deactivate the venue default tax rate. Set another rate as default first.",
        },
      },
      { status: 400 }
    );
  }

  const updated = await db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.taxRate.updateMany({
        where: { venueId: auth.venue.id },
        data: { isDefault: false },
      });
      await tx.venue.update({
        where: { id: auth.venue.id },
        data: { defaultTaxRate: { connect: { id } } },
      });
    }

    const dataToUpdate: Prisma.TaxRateUpdateInput = {};
    if (input.name !== undefined) dataToUpdate.name = input.name;
    if (input.isActive !== undefined) dataToUpdate.isActive = input.isActive;
    if (input.isDefault !== undefined) {
      dataToUpdate.isDefault = input.isDefault;
      if (input.isDefault) {
        dataToUpdate.isActive = true;
      }
    }

    return tx.taxRate.update({
      where: { id },
      data: dataToUpdate,
      include: {
        _count: {
          select: {
            menuItems: true,
            menuCategories: true,
          },
        },
      },
    });
  });

  triggerDebouncedSeedSnapshot(db as any, auth.venue.id);

  const usageCount =
    updated._count.menuItems + updated._count.menuCategories + (updated.isDefault ? 1 : 0);

  const data: TaxRateSummary = {
    id: updated.id,
    name: updated.name,
    rate: updated.rate.toFixed(4),
    isDefault: updated.isDefault,
    isActive: updated.isActive,
    isInclusive: updated.isInclusive,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    usageCount,
  };

  return NextResponse.json({ data }, { status: 200 });
};

const patchMeta: AuditMeta = {
  route: "/api/admin/settings/tax-rates/[id]",
  method: "PATCH",
};

export const PATCH = withAuditedDynamicRoute<{ id: string }>(
  adminResolvers,
  patchMeta,
  withCsrf(patchHandler as any)
);
