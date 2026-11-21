import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { TablesView, type TableItemView } from "./_tables-view";
import { OrderState } from "@/domain/orders/order.repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTablesPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);
  const venueRepo = createPrismaVenueRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    venueResult,
    categoriesResult,
    tablesResult,
    activeTokens,
    todaySessions,
  ] = await Promise.all([
    venueRepo.findById(staff.venueId),
    tableRepo.listCategories(staff.venueId),
    tableRepo.listTablesWithDetails(staff.venueId),
    prisma.qrToken.findMany({
      where: {
        venueId: staff.venueId,
        placeType: "TABLE",
        state: "ACTIVE",
      },
      select: {
        id: true,
        tableId: true,
      },
    }),
    prisma.guestSession.findMany({
      where: {
        venueId: staff.venueId,
        tableId: { not: null },
        createdAt: { gte: todayStart },
      },
      include: {
        orders: {
          select: {
            state: true,
            total: true,
          },
        },
      },
    }),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "NPR" : "NPR";
  const categories = categoriesResult.ok ? categoriesResult.value : [];
  const tables = tablesResult.ok ? tablesResult.value : [];

  // Map QR token IDs by tableId
  const qrTokenByTableId = new Map<string, string>();
  for (const token of activeTokens) {
    if (token.tableId) {
      qrTokenByTableId.set(token.tableId, token.id);
    }
  }

  // Aggregate today's metrics by tableId
  const todayMetricsByTableId = new Map<
    string,
    { sessionsCount: number; ordersCount: number; revenue: number }
  >();

  for (const sess of todaySessions) {
    if (!sess.tableId) continue;
    const existing = todayMetricsByTableId.get(sess.tableId) ?? {
      sessionsCount: 0,
      ordersCount: 0,
      revenue: 0,
    };

    existing.sessionsCount += 1;
    for (const ord of sess.orders) {
      if (ord.state !== OrderState.CANCELLED) {
        existing.ordersCount += 1;
        existing.revenue += Number(ord.total);
      }
    }
    todayMetricsByTableId.set(sess.tableId, existing);
  }

  // Prepare views
  const tableViews: TableItemView[] = tables.map((t) => {
    const metrics = todayMetricsByTableId.get(t.id) ?? {
      sessionsCount: 0,
      ordersCount: 0,
      revenue: 0,
    };

    return {
      id: t.id,
      number: t.number,
      state: t.state,
      categoryId: t.categoryId ?? null,
      category: t.category
        ? {
            id: t.category.id,
            name: t.category.name,
            isReserved: t.category.isReserved,
          }
        : null,
      activeSession: t.activeSession
        ? {
            id: t.activeSession.id,
            startedAt: t.activeSession.startedAt.toISOString(),
            ordersCount: t.activeSession.ordersCount,
            totalAmount: t.activeSession.totalAmount,
          }
        : null,
      todaySessionsCount: metrics.sessionsCount,
      todayOrdersCount: metrics.ordersCount,
      todayRevenue: metrics.revenue,
      qrTokenId: qrTokenByTableId.get(t.id) ?? null,
    };
  });

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-staff-text-muted hover:text-staff-text-primary transition-colors mb-1.5"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Tables Management
          </h1>
          <p className="text-xs text-staff-text-secondary mt-1">
            Configure dining tables, categories, reserved zones, and inspect live sessions.
          </p>
        </div>
      </header>

      <TablesView
        initialTables={tableViews}
        categories={categories}
        currency={currency}
      />
    </section>
  );
}
