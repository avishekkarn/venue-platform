import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { OrderState, PlaceType } from "@/domain/orders/order.repository";
import type { Order, OrderItem } from "@/domain/orders/order.repository";
import { OrderQueueRow } from "@/components/staff/order-queue-row";
import { formatMoney } from "@/lib/money";
import { formatElapsed } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * The Active Orders tab (DESIGN.md §4.10.6).
 *
 * A full-width list of active orders — PLACED, APPROVED, PREPARING, READY,
 * DELIVERED — sorted oldest first. Each row is an OrderQueueRow wrapped in a
 * Link to ?id=<orderId>. When searchParams.id is set, the page renders a
 * right-side detail panel with the full order (items, states, history,
 * notes).
 *
 * This is a Server Component. It reads via the repositories directly, like
 * the dashboard at app/admin/(shell)/page.tsx. No API route, no client
 * polling. The admin panel has no decorative motion (DESIGN.md §4.10.14).
 *
 * Reference: DESIGN.md §4.10.6, §4.10.14, D-9.2, D-19.1, SYSTEM.md §15.4,
 * D-10.2, ROADMAP.md §12 (Task 8.2.2).
 */

const ACTIVE_STATES: readonly OrderState[] = [
  OrderState.PLACED,
  OrderState.APPROVED,
  OrderState.PREPARING,
  OrderState.READY,
  OrderState.DELIVERED,
];

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

interface ActiveOrdersPageProps {
  readonly searchParams: Promise<{ id?: string }>;
}

export default async function ActiveOrdersPage({
  searchParams,
}: ActiveOrdersPageProps): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const orderRepo = createPrismaOrderRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const [venueResult, ordersResult, tablesResult, roomsResult] = await Promise.all([
    venueRepo.findById(staff.venueId),
    orderRepo.listForVenue(staff.venueId),
    tableRepo.listForVenue(staff.venueId),
    roomRepo.listForVenue(staff.venueId),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "USD" : "USD";
  const allOrders = ordersResult.ok ? ordersResult.value : [];
  const tables = tablesResult.ok ? tablesResult.value : [];
  const rooms = roomsResult.ok ? roomsResult.value : [];

  const tableNumberById = new Map<string, string>();
  for (const t of tables) tableNumberById.set(t.id, t.number);
  const roomNumberById = new Map<string, string>();
  for (const r of rooms) roomNumberById.set(r.id, r.number);

  const activeOrders = allOrders
    .filter((o) => ACTIVE_STATES.includes(o.state))
    .sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime()); // oldest first

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

  const params = await searchParams;
  const selectedId = params.id;
  const selectedOrder: Order | null = selectedId
    ? activeOrders.find((o) => o.id === selectedId) ?? null
    : null;

  const now = new Date();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
          Active Orders
        </h1>
        <p className="text-sm text-staff-text-muted">
          {activeOrders.length} order{activeOrders.length === 1 ? "" : "s"}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div
          id="active-orders-list"
          className="flex flex-col gap-3"
          aria-label="Active orders"
        >
          {activeOrders.length === 0 ? (
            <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl">
              No active orders.
            </p>
          ) : (
            activeOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/active?id=${order.id}`}
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
