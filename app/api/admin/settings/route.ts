/**
 * GET /api/admin/settings — get venue operational and regional settings
 * PATCH /api/admin/settings — update contact, regional, and default tax rate
 *
 * Milestone 8.8 (Settings Expansion).
 * Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), CSRF-protected on PATCH (withCsrf).
 * Enforces currency immutability after orders exist (D-11.6).
 * Triggers debounced reference seed snapshot (D-8.6).
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
  validateRegionalUpdate,
  validateContactUpdate,
  triggerDebouncedSeedSnapshot,
  type VenueSettings,
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

  const [venueRecord, ordersCount] = await Promise.all([
    db.venue.findUnique({
      where: { id: auth.venue.id },
      include: (db as any).taxRate
        ? {
            taxRates: {
              where: { isDefault: true },
              take: 1,
            },
          }
        : undefined,
    }),
    db.order.count({
      where: { venueId: auth.venue.id },
    }),
  ]);

  if (!venueRecord) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: "Venue not found" } },
      { status: 404 }
    );
  }

  const defaultTaxRate = (venueRecord as any)?.taxRates?.[0] ?? null;

  const data: VenueSettings = {
    venueId: venueRecord.id,
    name: venueRecord.name,
    slug: venueRecord.slug,
    contactName: venueRecord.contactName,
    contactPhone: venueRecord.contactPhone,
    contactEmail: venueRecord.contactEmail,
    counterPhone: venueRecord.counterPhone,
    receiptHeader: venueRecord.receiptHeader,
    receiptFooter: venueRecord.receiptFooter,
    currency: venueRecord.currency,
    isCurrencyLocked: ordersCount > 0,
    currencyLockedAt: venueRecord.currencyLockedAt ? venueRecord.currencyLockedAt.toISOString() : null,
    timezone: venueRecord.timezone,
    timeFormat: venueRecord.timeFormat as "12h" | "24h",
    defaultTaxRateId: venueRecord.taxRateId,
    defaultTaxRate: defaultTaxRate
      ? {
          id: defaultTaxRate.id,
          name: defaultTaxRate.name,
          rate: defaultTaxRate.rate.toFixed(4),
          isDefault: defaultTaxRate.isDefault,
          isActive: defaultTaxRate.isActive,
          isInclusive: defaultTaxRate.isInclusive,
          createdAt: defaultTaxRate.createdAt.toISOString(),
          updatedAt: defaultTaxRate.updatedAt.toISOString(),
        }
      : null,
    taxRateFallback: venueRecord.taxRate.toFixed(4),
  };

  return NextResponse.json({ data }, { status: 200 });
};

const patchHandler: AuditedRouteHandler = async (request: NextRequest): Promise<NextResponse> => {
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

  // Reject writes to taxRate fallback field directly
  if ("taxRate" in rawBody && rawBody.taxRate !== undefined) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "taxRate is read-only baseline; use taxRateId or /api/admin/settings/tax-rates (D-4.13)",
        },
      },
      { status: 400 }
    );
  }

  const ordersCount = await db.order.count({
    where: { venueId: auth.venue.id },
  });

  const regionalValidation = validateRegionalUpdate(
    {
      currency: typeof rawBody.currency === "string" ? rawBody.currency : undefined,
      timezone: typeof rawBody.timezone === "string" ? rawBody.timezone : undefined,
      timeFormat: typeof rawBody.timeFormat === "string" ? (rawBody.timeFormat as any) : undefined,
    },
    {
      currency: auth.venue.currency,
      hasOrders: ordersCount > 0,
    }
  );

  if (!regionalValidation.ok) {
    return NextResponse.json(
      { error: { code: regionalValidation.error.code, message: regionalValidation.error.message } },
      { status: 400 }
    );
  }

  const contactValidation = validateContactUpdate({
    contactName: typeof rawBody.contactName === "string" || rawBody.contactName === null ? rawBody.contactName : undefined,
    contactPhone: typeof rawBody.contactPhone === "string" || rawBody.contactPhone === null ? rawBody.contactPhone : undefined,
    contactEmail: typeof rawBody.contactEmail === "string" || rawBody.contactEmail === null ? rawBody.contactEmail : undefined,
    counterPhone: typeof rawBody.counterPhone === "string" || rawBody.counterPhone === null ? rawBody.counterPhone : undefined,
    receiptHeader: typeof rawBody.receiptHeader === "string" || rawBody.receiptHeader === null ? rawBody.receiptHeader : undefined,
    receiptFooter: typeof rawBody.receiptFooter === "string" || rawBody.receiptFooter === null ? rawBody.receiptFooter : undefined,
  });

  if (!contactValidation.ok) {
    return NextResponse.json(
      { error: { code: contactValidation.error.code, message: contactValidation.error.message } },
      { status: 400 }
    );
  }

  // Handle defaultTaxRateId if provided
  let newTaxRateId: string | null | undefined = undefined;
  if ("taxRateId" in rawBody) {
    if (rawBody.taxRateId === null || rawBody.taxRateId === "") {
      newTaxRateId = null;
    } else if (typeof rawBody.taxRateId === "string") {
      const taxRate = await db.taxRate.findFirst({
        where: { id: rawBody.taxRateId, venueId: auth.venue.id },
      });
      if (!taxRate) {
        return NextResponse.json(
          { error: { code: DomainErrorCode.NOT_FOUND, message: "Specified taxRateId not found for venue" } },
          { status: 404 }
        );
      }
      if (!taxRate.isActive) {
        return NextResponse.json(
          { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Cannot select an inactive tax rate as default" } },
          { status: 400 }
        );
      }
      newTaxRateId = taxRate.id;
    }
  }

  const updateData: Prisma.VenueUpdateInput = {};

  if (regionalValidation.value.currency !== undefined) {
    updateData.currency = regionalValidation.value.currency;
    if (ordersCount > 0 && !auth.venue.currencyLockedAt) {
      updateData.currencyLockedAt = new Date();
    }
  }
  if (regionalValidation.value.timezone !== undefined) {
    updateData.timezone = regionalValidation.value.timezone;
  }
  if (regionalValidation.value.timeFormat !== undefined) {
    updateData.timeFormat = regionalValidation.value.timeFormat;
  }

  if (contactValidation.value.contactName !== undefined) {
    updateData.contactName = contactValidation.value.contactName;
  }
  if (contactValidation.value.contactPhone !== undefined) {
    updateData.contactPhone = contactValidation.value.contactPhone;
  }
  if (contactValidation.value.contactEmail !== undefined) {
    updateData.contactEmail = contactValidation.value.contactEmail;
  }
  if (contactValidation.value.counterPhone !== undefined) {
    updateData.counterPhone = contactValidation.value.counterPhone;
  }
  if (contactValidation.value.receiptHeader !== undefined) {
    updateData.receiptHeader = contactValidation.value.receiptHeader;
  }
  if (contactValidation.value.receiptFooter !== undefined) {
    updateData.receiptFooter = contactValidation.value.receiptFooter;
  }

  if (newTaxRateId !== undefined) {
    updateData.defaultTaxRate = newTaxRateId ? { connect: { id: newTaxRateId } } : { disconnect: true };
  }

  // Execute in transaction: if default tax rate changed, update isDefault flags
  const updatedVenue = await db.$transaction(async (tx) => {
    if (newTaxRateId !== undefined) {
      // Clear previous default
      await tx.taxRate.updateMany({
        where: { venueId: auth.venue.id },
        data: { isDefault: false },
      });
      if (newTaxRateId !== null) {
        await tx.taxRate.update({
          where: { id: newTaxRateId },
          data: { isDefault: true },
        });
      }
    }

    return tx.venue.update({
      where: { id: auth.venue.id },
      data: updateData,
      include: {
        taxRates: {
          where: { isDefault: true },
          take: 1,
        },
      },
    });
  });

  // Trigger debounced seed snapshot (D-8.6)
  triggerDebouncedSeedSnapshot(db as any, auth.venue.id);

  const defaultTaxRate = updatedVenue.taxRates[0] ?? null;

  const data: VenueSettings = {
    venueId: updatedVenue.id,
    name: updatedVenue.name,
    slug: updatedVenue.slug,
    contactName: updatedVenue.contactName,
    contactPhone: updatedVenue.contactPhone,
    contactEmail: updatedVenue.contactEmail,
    counterPhone: updatedVenue.counterPhone,
    receiptHeader: updatedVenue.receiptHeader,
    receiptFooter: updatedVenue.receiptFooter,
    currency: updatedVenue.currency,
    isCurrencyLocked: ordersCount > 0,
    currencyLockedAt: updatedVenue.currencyLockedAt ? updatedVenue.currencyLockedAt.toISOString() : null,
    timezone: updatedVenue.timezone,
    timeFormat: updatedVenue.timeFormat as "12h" | "24h",
    defaultTaxRateId: updatedVenue.taxRateId,
    defaultTaxRate: defaultTaxRate
      ? {
          id: defaultTaxRate.id,
          name: defaultTaxRate.name,
          rate: defaultTaxRate.rate.toFixed(4),
          isDefault: defaultTaxRate.isDefault,
          isActive: defaultTaxRate.isActive,
          isInclusive: defaultTaxRate.isInclusive,
          createdAt: defaultTaxRate.createdAt.toISOString(),
          updatedAt: defaultTaxRate.updatedAt.toISOString(),
        }
      : null,
    taxRateFallback: updatedVenue.taxRate.toFixed(4),
  };

  return NextResponse.json({ data }, { status: 200 });
};

const getMeta: AuditMeta = {
  route: "/api/admin/settings",
  method: "GET",
};

const patchMeta: AuditMeta = {
  route: "/api/admin/settings",
  method: "PATCH",
};

export const GET = withAudit(adminResolvers, getMeta, getHandler);
export const PATCH = withAudit(adminResolvers, patchMeta, withCsrf(patchHandler));
