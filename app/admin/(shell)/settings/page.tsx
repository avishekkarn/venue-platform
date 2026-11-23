import type { JSX } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { SettingsView } from "./_settings-view";
import type { VenueSettings, TaxRateSummary } from "@/domain/settings/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminSettingsPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findById(staff.venueId);
  if (!venueResult.ok) {
    notFound();
  }
  const venue = venueResult.value;

  const taxRatesPromise = (prisma as any).taxRate?.findMany
    ? prisma.taxRate.findMany({
        where: { venueId: venue.id },
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

  const [venueRecord, ordersCount, taxRates, moduleToggles, serviceToggles, recentAuditRuns] =
    await Promise.all([
      prisma.venue.findUnique({
        where: { id: venue.id },
        include: (prisma as any).taxRate
          ? {
              taxRates: {
                where: { isDefault: true },
                take: 1,
              },
            }
          : undefined,
      }),
      prisma.order.count({
        where: { venueId: venue.id },
      }),
      taxRatesPromise,
      prisma.venueModuleToggle.findMany({
        where: { venueId: venue.id },
      }),
      prisma.venueServiceToggle.findMany({
        where: { venueId: venue.id },
      }),
      prisma.reportRun.findMany({
        where: { venueId: venue.id, view: "audit_export" },
        orderBy: { ranAt: "desc" },
        take: 5,
        include: {
          ranByStaff: {
            select: { name: true, username: true },
          },
        },
      }),
    ]);

  if (!venueRecord) {
    notFound();
  }

  const defaultTaxRate = (venueRecord as any)?.taxRates?.[0] ?? null;

  const initialSettings: VenueSettings = {
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
    timeFormat: (venueRecord.timeFormat as "12h" | "24h") || "12h",
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

  const initialTaxRates: TaxRateSummary[] = taxRates.map((tr) => {
    const isDefault = tr.isDefault || tr.id === venueRecord.taxRateId;
    return {
      id: tr.id,
      name: tr.name,
      rate: tr.rate.toFixed(4),
      isDefault,
      isActive: tr.isActive,
      isInclusive: tr.isInclusive,
      createdAt: tr.createdAt.toISOString(),
      updatedAt: tr.updatedAt.toISOString(),
      usageCount: tr._count.menuItems + tr._count.menuCategories + (isDefault ? 1 : 0),
    };
  });

  const ALL_MODULES = ["TABLE", "ROOM", "COUNTER", "KITCHEN"] as const;
  const modMap = new Map(moduleToggles.map((m) => [m.module, m.isEnabled]));
  const initialModules = ALL_MODULES.map((mod) => ({
    module: mod,
    isEnabled: modMap.get(mod as any) ?? false,
  }));

  const ALL_SERVICES = [
    "ROOM_SERVICE_FOOD",
    "HOUSEKEEPING",
    "MAINTENANCE",
    "CONCIERGE",
    "LAUNDRY",
    "SPA",
    "LATE_CHECKOUT",
    "WAKE_UP_CALL",
    "DO_NOT_DISTURB",
    "CALL_WAITER",
    "REQUEST_BILL",
  ] as const;
  const srvMap = new Map(serviceToggles.map((s) => [s.service, s.isEnabled]));
  const initialServices = ALL_SERVICES.map((srv) => ({
    service: srv,
    isEnabled: srvMap.get(srv as any) ?? false,
  }));

  const initialAuditRuns = recentAuditRuns.map((r) => ({
    id: r.id,
    ranAt: r.ranAt.toISOString(),
    rowCount: r.rowCount,
    params: r.paramsJson as Record<string, unknown>,
    staffName: r.ranByStaff?.name ?? r.ranByStaff?.username ?? "System",
  }));

  return (
    <SettingsView
      venueName={venue.name}
      initialSettings={initialSettings}
      initialTaxRates={initialTaxRates}
      initialModules={initialModules}
      initialServices={initialServices}
      initialAuditRuns={initialAuditRuns}
    />
  );
}
