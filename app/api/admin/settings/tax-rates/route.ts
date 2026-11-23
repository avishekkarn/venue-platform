/**
 * GET /api/admin/settings/tax-rates — list venue tax rates with usage counts
 * POST /api/admin/settings/tax-rates — create a new tax rate
 *
 * Milestone 8.8 (Tax Rates Expansion, D-4.13).
 * Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), CSRF-protected on POST (withCsrf).
 * Rate is immutable once created.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { resolveAdminContext, adminResolvers, type DbClient } from "@/infrastructure/auth/admin-context";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import {
  validateCreateTaxRate,
  triggerDebouncedSeedSnapshot,
  type TaxRateSummary,
} from "@/domain/settings";

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const getHandler: AuditedRouteHandler = async (_request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const taxRatesPromise = (db as any).taxRate
    ? db.taxRate.findMany({
        where: { venueId: auth.venue.id },
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        include: {
          _count: {
            select: {
              menuItems: true,
              menuCategories: true,
            },
          },
        },
      })
    : Promise.resolve([]);

  const [taxRates, venueRecord] = await Promise.all([
    taxRatesPromise,
    db.venue.findUnique({
      where: { id: auth.venue.id },
      select: { taxRateId: true },
    }),
  ]);

  const defaultId = venueRecord?.taxRateId ?? null;

  const data: TaxRateSummary[] = taxRates.map((tr) => {
    const isVenueDefault = tr.isDefault || tr.id === defaultId;
    const usageCount = tr._count.menuItems + tr._count.menuCategories + (isVenueDefault ? 1 : 0);

    return {
      id: tr.id,
      name: tr.name,
      rate: tr.rate.toFixed(4),
      isDefault: isVenueDefault,
      isActive: tr.isActive,
      isInclusive: tr.isInclusive,
      createdAt: tr.createdAt.toISOString(),
      updatedAt: tr.updatedAt.toISOString(),
      usageCount,
    };
  });

  return NextResponse.json({ data }, { status: 200 });
};

const postHandler: AuditedRouteHandler = async (request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Malformed JSON body" } },
      { status: 400 }
    );
  }

  const validation = validateCreateTaxRate({
    venueId: auth.venue.id,
    name: typeof rawBody.name === "string" ? rawBody.name : "",
    rate: typeof rawBody.rate === "string" ? rawBody.rate : String(rawBody.rate ?? ""),
    isDefault: typeof rawBody.isDefault === "boolean" ? rawBody.isDefault : false,
    isInclusive: typeof rawBody.isInclusive === "boolean" ? rawBody.isInclusive : false,
  });

  if (!validation.ok) {
    return NextResponse.json(
      { error: { code: validation.error.code, message: validation.error.message } },
      { status: 400 }
    );
  }

  const input = validation.value;

  const created = await db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.taxRate.updateMany({
        where: { venueId: auth.venue.id },
        data: { isDefault: false },
      });
    }

    const newRate = await tx.taxRate.create({
      data: {
        venueId: auth.venue.id,
        name: input.name,
        rate: input.rate,
        isDefault: input.isDefault ?? false,
        isActive: true,
        isInclusive: input.isInclusive ?? false,
      },
    });

    if (input.isDefault) {
      await tx.venue.update({
        where: { id: auth.venue.id },
        data: { defaultTaxRate: { connect: { id: newRate.id } } },
      });
    }

    return newRate;
  });

  triggerDebouncedSeedSnapshot(db as any, auth.venue.id);

  const data: TaxRateSummary = {
    id: created.id,
    name: created.name,
    rate: created.rate.toFixed(4),
    isDefault: created.isDefault,
    isActive: created.isActive,
    isInclusive: created.isInclusive,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    usageCount: created.isDefault ? 1 : 0,
  };

  return NextResponse.json({ data }, { status: 201 });
};

const getMeta: AuditMeta = {
  route: "/api/admin/settings/tax-rates",
  method: "GET",
};

const postMeta: AuditMeta = {
  route: "/api/admin/settings/tax-rates",
  method: "POST",
};

export const GET = withAudit(adminResolvers, getMeta, getHandler);
export const POST = withAudit(adminResolvers, postMeta, withCsrf(postHandler));
