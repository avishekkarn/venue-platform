import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { OrderState, PlaceType, type OrderFilter } from "@/domain/orders/order.repository";
import type { Order, OrderItem } from "@/domain/orders/order.repository";
import { OrderQueueRow } from "@/components/staff/order-queue-row";
import { formatMoney } from "@/lib/money";
import { formatElapsed } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * The Completed Orders tab (DESIGN.md §4.10.7).
 *
 * A full-width list of completed orders — COMPLETED and CANCELLED — with
 * a date-range filter at the top (Today / Yesterday / This Week / This
 * Month / Custom) and an "Export CSV" button top-right. Sorted newest
 * first (the operator's mental model after service: what closed most
 * recently).
 *
 * The filter is URL state: ?range=today|yesterday|week|month|custom and,
 * for custom, &from=YYYY-MM-DD&to=YYYY-MM-DD. The page computes the
 * UTC day boundaries inline (the same contract as the 8.2.1 route's
 * parseDateBoundary), passes dateFrom/dateTo to the repository, and
 * renders the result.
 *
 * This is a Server Component. It reads via the repositories directly,
 * like the Active Orders tab at app/admin/orders/active/page.tsx. No
 * API route, no client polling. The admin panel has no decorative
 * motion (DESIGN.md §4.10.14).
 *
 * The "Export CSV" button links to /api/admin/orders/export with the
 * current filter params. The route is 8.2.4's job; the button ships
 * with this page per DESIGN.md §4.10.7. The click 404s until 8.2.4
 * ships the route — an honest 404 on an incomplete feature.
 *
 * Reference: DESIGN.md §4.10.7, §4.10.14, D-9.2, D-19.1, SYSTEM.md
 * §15.4, D-10.2, D-12.1, ROADMAP.md §12 (Task 8.2.3).
 */

const TERMINAL_STATES: readonly OrderState[] = [
  OrderState.COMPLETED,
  OrderState.CANCELLED,
];

type RangeKey = "today" | "yesterday" | "week" | "month" | "custom";

interface CompletedOrdersPageProps {
  readonly searchParams: Promise<{
    id?: string;
    range?: string;
    from?: string;
    to?: string;
  }>;
}

function badgeClass(state: OrderState): string {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (state) {
    case OrderState.PLACED:
      return `${base} bg-amber-100 text-amber-800`;
    case OrderState.APPROVED:
      return `${base} bg-purple-100 text-purple-800`;
    case OrderState.PREPARING:
      return `${base} bg-sky-100 text-sky-800`;
    case OrderState.READY:
      return `${base} bg-status-ready-bg text-status-ready`;
    case OrderState.DELIVERED:
    case OrderState.COMPLETED:
      return `${base} bg-status-done-bg text-status-done`;
    case OrderState.CANCELLED:
      return `${base} bg-status-cancelled-bg text-status-cancelled`;
    default:
      return base;
  }
}

function isDateString(s: string | undefined): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}

function endOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)
  );
}

function parseUtcDate(s: string): Date | null {
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeRange(range: RangeKey, from?: string, to?: string): {
  dateFrom?: Date;
  dateTo?: Date;
  label: string;
} {
  const now = new Date();
  const todayStart = startOfUtcDay(now);
  const todayEnd = endOfUtcDay(now);

  if (range === "today") {
    return { dateFrom: todayStart, dateTo: todayEnd, label: "Today" };
  }
  if (range === "yesterday") {
    const y = new Date(todayStart);
    y.setUTCDate(y.getUTCDate() - 1);
    return { dateFrom: startOfUtcDay(y), dateTo: endOfUtcDay(y), label: "Yesterday" };
  }
  if (range === "week") {
    // ISO week: Monday-start. The DESIGN.md §4.10.7 does not name the
    // start; Monday is the standard.
    const day = todayStart.getUTCDay(); // 0 = Sunday
    const diff = (day + 6) % 7; // days since Monday
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(weekStart.getUTCDate() - diff);
    return { dateFrom: weekStart, dateTo: todayEnd, label: "This Week" };
  }
  if (range === "month") {
    const monthStart = new Date(
      Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth(), 1, 0, 0, 0, 0)
    );
    return { dateFrom: monthStart, dateTo: todayEnd, label: "This Month" };
  }
  // Custom
  if (isDateString(from) && isDateString(to)) {
    const fromD = parseUtcDate(from);
    const toD = parseUtcDate(to);
    if (fromD && toD) {
      return {
        dateFrom: startOfUtcDay(fromD),
        dateTo: endOfUtcDay(toD),
        label: `${from} → ${to}`,
      };
    }
  }
  return { label: "Custom (pick a range)" };
}

export default async function CompletedOrdersPage({
  searchParams,
}: CompletedOrdersPageProps): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const orderRepo = createPrismaOrderRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const [venueResult, tablesResult, roomsResult] = await Promise.all([
    venueRepo.findById(staff.venueId),
    tableRepo.listForVenue(staff.venueId),
    roomRepo.listForVenue(staff.venueId),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "USD" : "USD";
  const tables = tablesResult.ok ? tablesResult.value : [];
  const rooms = roomsResult.ok ? roomsResult.value : [];

  const tableNumberById = new Map<string, string>();
  for (const t of tables) tableNumberById.set(t.id, t.number);
  const roomNumberById = new Map<string, string>();
  for (const r of rooms) roomNumberById.set(r.id, r.number);

  const params = await searchParams;
  const rangeKey: RangeKey =
    params.range === "yesterday" ||
    params.range === "week" ||
    params.range === "month" ||
    params.range === "custom"
      ? params.range
      : "today"; // default
  const range = computeRange(rangeKey, params.from, params.to);

  const filter: OrderFilter = {
    ...(range.dateFrom !== undefined ? { dateFrom: range.dateFrom } : {}),
    ...(range.dateTo !== undefined ? { dateTo: range.dateTo } : {}),
  };

  const ordersResult = await orderRepo.listForVenue(staff.venueId, filter);
  const allOrders = ordersResult.ok ? ordersResult.value : [];

  const completedOrders = allOrders
    .filter((o) => TERMINAL_STATES.includes(o.state))
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime()); // newest first

  function placeLabel(order: Order): string {
    if (order.placeType === PlaceType.TABLE) {
      return order.tableId ? tableNumberById.get(order.tableId) ?? "—" : "—";
    }
    if (order.placeType === PlaceType.ROOM) {
      return order.roomId ? roomNumberById.get(order.roomId) ?? "—" : "—";
    }
    return order.pickupName ?? "—";
  }

  function placeTypeLabel(order: Order): string {
    if (order.placeType === PlaceType.TABLE) return "Table";
    if (order.placeType === PlaceType.ROOM) return "Room";
    return "Counter";
  }

  const selectedId = params.id;
  const selectedOrder: Order | null = selectedId
    ? completedOrders.find((o) => o.id === selectedId) ?? null
    : null;

  const now = new Date();

  // Build the export href with the current filter params.
  const exportParams = new URLSearchParams();
  exportParams.set("range", rangeKey);
  if (rangeKey === "custom" && isDateString(params.from) && isDateString(params.to)) {
    exportParams.set("from", params.from);
    exportParams.set("to", params.to);
  }
  const exportHref = `/api/admin/orders/export?${exportParams.toString()}`;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Completed Orders
          </h1>
          <a
            href={exportHref}
            className="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-brand"
          >
            Export CSV
          </a>
        </div>

        {/* Date-range filter (DESIGN.md §4.10.7) */}
        <nav
          aria-label="Date range"
          className="flex flex-wrap items-center gap-2"
        >
          {(["today", "yesterday", "week", "month"] as const).map((key) => {
            const labelMap = {
              today: "Today",
              yesterday: "Yesterday",
              week: "This Week",
              month: "This Month",
            };
            const isActive = rangeKey === key;
            return (
              <Link
                key={key}
                href={`/admin/orders/completed?range=${key}`}
                className={cn(
                  "inline-flex items-center justify-center rounded-md px-3 h-9 text-sm font-medium border",
                  isActive
                    ? "bg-staff-brand text-staff-brand-contrast border-staff-brand"
                    : "bg-staff-surface-raised text-staff-text-primary border-staff-border-subtle hover:bg-staff-surface-sunken"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {labelMap[key]}
              </Link>
            );
          })}

          {/* Custom: a Server Component <form>. No client JS. */}
          <form
            action="/admin/orders/completed"
            method="GET"
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-2 py-1 border",
              rangeKey === "custom"
                ? "bg-staff-brand text-staff-brand-contrast border-staff-brand"
                : "bg-staff-surface-raised text-staff-text-primary border-staff-border-subtle"
            )}
          >
            <input type="hidden" name="range" value="custom" />
            <label className="text-xs font-medium whitespace-nowrap" htmlFor="from">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={isDateString(params.from) ? params.from : ""}
              className="h-8 rounded-sm border border-staff-border-subtle bg-staff-surface px-2 text-xs text-staff-text-primary"
            />
            <label className="text-xs font-medium whitespace-nowrap" htmlFor="to">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={isDateString(params.to) ? params.to : ""}
              className="h-8 rounded-sm border border-staff-border-subtle bg-staff-surface px-2 text-xs text-staff-text-primary"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-sm px-2 h-8 text-xs font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95"
            >
              Apply
            </button>
          </form>
        </nav>

        <p className="text-sm text-staff-text-muted">
          {range.label} · {completedOrders.length}{" "}
          order{completedOrders.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div
          id="completed-orders-list"
          className="flex flex-col gap-3"
          aria-label="Completed orders"
        >
          {completedOrders.length === 0 ? (
            <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl">
              No orders in this range.
            </p>
          ) : (
            completedOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/completed?range=${rangeKey}${
                  rangeKey === "custom" && isDateString(params.from) && isDateString(params.to)
                    ? `&from=${params.from}&to=${params.to}`
                    : ""
                }&id=${order.id}`}
                className={cn(
                  "block rounded-xl transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-brand",
                  selectedId === order.id && "ring-2 ring-staff-brand"
                )}
              >
                <OrderQueueRow
                  order={order}
                  placeLabel={placeLabel(order)}
                  placeTypeLabel={placeTypeLabel(order)}
                  elapsedLabel={formatElapsed(order.placedAt, now)}
                />
              </Link>
            ))
          )}
        </div>

        {selectedOrder ? (
          <aside
            id="order-detail-panel"
            className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-5 flex flex-col gap-4 self-start sticky top-4"
            aria-label="Order detail"
          >
            <header className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-staff-text-primary">
                #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </h2>
              <span className={badgeClass(selectedOrder.state)}>
                {selectedOrder.state}
              </span>
            </header>

            <div className="text-sm text-staff-text-secondary">
              {placeTypeLabel(selectedOrder)} {placeLabel(selectedOrder)}
            </div>

            {selectedOrder.notes ? (
              <p className="text-sm italic text-staff-text-muted">
                Note: {selectedOrder.notes}
              </p>
            ) : null}

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                Items
              </h3>
              <ul className="flex flex-col gap-2">
                {selectedOrder.items.map((it: OrderItem) => (
                  <li key={it.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-staff-text-primary">
                      {it.quantity}× {it.itemName}
                      {it.notes ? (
                        <span className="block text-xs italic text-staff-text-muted">
                          {it.notes}
                        </span>
                      ) : null}
                    </span>
                    <span className="font-mono text-staff-text-primary">
                      {formatMoney(it.lineTotal, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-staff-border-subtle pt-3 flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-staff-text-muted">Subtotal</span>
                <span className="font-mono text-staff-text-primary">
                  {formatMoney(selectedOrder.subtotal, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-staff-text-muted">Tax</span>
                <span className="font-mono text-staff-text-primary">
                  {formatMoney(selectedOrder.taxAmount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono text-staff-text-primary">
                  {formatMoney(selectedOrder.total, currency)}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                History
              </h3>
              <ul className="flex flex-col gap-1.5 text-xs text-staff-text-secondary">
                {selectedOrder.stateChanges.map((sc) => (
                  <li key={sc.id} className="flex items-center justify-between gap-3">
                    <span>{sc.state}</span>
                    <span className="font-mono text-staff-text-muted">
                      {sc.occurredAt.toISOString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : (
          <aside className="hidden lg:block">
            <p className="text-sm text-staff-text-muted py-6 text-center border border-dashed border-staff-border-subtle rounded-xl">
              Select an order to view its details.
            </p>
          </aside>
        )}
      </div>
    </section>
  );
}
