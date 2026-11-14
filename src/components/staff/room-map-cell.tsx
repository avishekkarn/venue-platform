import type { JSX } from "react";
import type { Room } from "@/domain/organization/room.repository";

/**
 * A single room cell in the staff world's room map (and the dashboard's).
 *
 * Mirrors the inline RoomCard in app/staff/page.tsx exactly — same markup,
 * same data-* attributes, same badge classes, same button shape. The
 * data-* attributes (`data-room-id`, `data-room-number`,
 * `data-room-status`, `data-action="checkout-room"`) are read by the
 * existing click delegation in app/staff/page.tsx.
 *
 * The client-side polling replacement uses roomCardHtml(room, isOccupied)
 * to produce identical markup. Both must match, so the poll does not
 * visually change the cell when it refreshes. The 8.1.3.A manual check
 * verifies both render the same shape.
 *
 * This is a Server Component. It does no client work — the button's
 * click is handled by the parent page's event delegation.
 *
 * Reference: DESIGN.md §4.10.3, §4.6.17.13 (TableMapCell — the room
 * cell is the same shape), D-9.2, D-19.1, SYSTEM.md §7.
 */
export interface RoomMapCellProps {
  readonly room: Room;
  readonly isOccupied: boolean;
  readonly canCheckout?: boolean;
}

export function RoomMapCell({
  room,
  isOccupied,
  canCheckout = true,
}: RoomMapCellProps): JSX.Element {
  return (
    <article
      data-room-id={room.id}
      data-room-number={room.number}
      data-room-status={isOccupied ? "OCCUPIED" : "FREE"}
      className="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[28px] font-bold">{room.number}</div>
          <div className="text-[11px] uppercase text-staff-text-muted">Room</div>
        </div>
        {isOccupied ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            Occupied
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Vacant
          </span>
        )}
      </div>
      <div className="pt-2 border-t border-staff-border-subtle">
        {isOccupied && canCheckout ? (
          <button
            type="button"
            data-action="checkout-room"
            data-room-id={room.id}
            data-room-number={room.number}
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-staff-text-muted border border-staff-border-subtle hover:bg-staff-surface-sunken w-full"
          >
            Checkout Room
          </button>
        ) : (
          <span className="text-xs text-staff-text-muted">—</span>
        )}
      </div>
    </article>
  );
}
