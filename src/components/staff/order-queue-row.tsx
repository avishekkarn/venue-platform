import type { JSX } from "react";
import type { Order, OrderState } from "@/domain/orders/order.repository";

/**
 * One row in the admin dashboard's recent-orders list (DESIGN.md §4.10.5).
 *
 * Mirrors RequestQueueRow's shape: 64×64 place square on the left, order
 * ID + items summary in the middle, status badge inline, elapsed time
 * inline, `—` in the action slot (no buttons — this is a dashboard
 * preview; the Active Orders tab at 8.2.2 wires the actions).
 *
 * The badge classes follow DESIGN.md §4.2.3's locked "Order status → color
 * mapping": PLACED waiting (amber), APPROVED/PREPARING active (purple/
 * sky), READY ready (green via --status-ready tokens), DELIVERED/
 * COMPLETED done (sage via --status-done tokens), CANCELLED cancelled
 * (rust via --status-cancelled tokens).
 *
 * `elapsedLabel` is computed by the caller (e.g., "5m", "1h 12m") — the
 * row is presentational; the time arithmetic is the page's.
 *
 * No motion (DESIGN.md §4.10.14). Server Component.
 */
export interface OrderQueueRowProps {
  readonly order: Order;
  readonly placeLabel: string;
  readonly placeTypeLabel: string; // "Table" | "Room" | "Counter"
  readonly elapsedLabel: string;
}

function itemsSummary(order: Order): string {
  if (order.items.length === 0) return "No items";
  return order.items
    .map((it) => `${it.quantity}× ${it.itemName}`)
    .join(", ");
}

function badgeClass(state: OrderState): string {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (state) {
    case "PLACED":
      return `${base} bg-amber-100 text-amber-800`;
    case "APPROVED":
      return `${base} bg-purple-100 text-purple-800`;
    case "PREPARING":
      return `${base} bg-sky-100 text-sky-800`;
    case "READY":
      return `${base} bg-status-ready-bg text-status-ready`;
    case "DELIVERED":
    case "COMPLETED":
      return `${base} bg-status-done-bg text-status-done`;
    case "CANCELLED":
      return `${base} bg-status-cancelled-bg text-status-cancelled`;
    default:
      return base;
  }
}

export function OrderQueueRow({
  order,
  placeLabel,
  placeTypeLabel,
  elapsedLabel,
}: OrderQueueRowProps): JSX.Element {
  return (
    <article
      data-order-id={order.id}
      data-order-state={order.state}
      data-place-label={placeLabel}
      className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">
          <span className="text-[11px] font-semibold text-staff-text-muted uppercase">
            {placeTypeLabel}
          </span>
          <span className="text-[20px] font-bold text-staff-text-primary">
            {placeLabel}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-staff-text-primary">
              #{order.id.slice(0, 8).toUpperCase()}
            </span>
            <span className={badgeClass(order.state)}>{order.state}</span>
            <span className="text-xs font-mono text-staff-text-muted">
              {elapsedLabel}
            </span>
          </div>
          <p className="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">
            {itemsSummary(order)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
        <span className="text-sm text-staff-text-muted">—</span>
      </div>
    </article>
  );
}
