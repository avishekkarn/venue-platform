import type { JSX } from "react";
import { MenuRowActions } from "./menu-row-actions";
import {
  type MenuItemView,
  MenuItemState,
} from "@/domain/menu/menu.repository";
import { Badge, type BadgeStatus } from "@/components/ui/badge";
import { TableRow, TableCell } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";

/**
 * A single row of the admin menu list (8.3.1, DESIGN.md §4.10.8).
 *
 * Six cells: Photo (a plain <img> or "—"), Name, Category, Price (via
 * `formatMoney`), State (a Badge), Actions (three disabled buttons with
 * titles pointing to 8.3.3 / 8.3.4). The badge maps MenuItemState to the
 * Badge primitive's status: AVAILABLE → "ready" (DESIGN.md §4.2.3: Ready /
 * Available -> status-ready, green #3d7a4a), UNAVAILABLE → "cancelled"
 * (muted rust #8a3a34), HIDDEN → "done" (sage).
 *
 * The row is a Server Component. No client state, no onClick. The buttons
 * are disabled until the routes are wired (8.3.3 for Edit, 8.3.4 for the
 * state toggle); a clickable button that does nothing is a lie to the
 * operator.
 *
 * Reference: DESIGN.md §4.10.8, D-4.2, D-20.1.
 */
interface MenuItemRowProps {
  readonly item: MenuItemView;
  readonly categoryId?: string;
  readonly categoryName: string;
  readonly currency: string;
  readonly editHref?: string;
  readonly canMoveUp?: boolean;
}

function stateToBadge(state: MenuItemState): { status: BadgeStatus; label: string } {
  switch (state) {
    case MenuItemState.AVAILABLE:
      return { status: "ready", label: "Available" };
    case MenuItemState.UNAVAILABLE:
      return { status: "cancelled", label: "Unavailable" };
    case MenuItemState.HIDDEN:
      return { status: "done", label: "Hidden" };
  }
}

export function MenuItemRow({
  item,
  categoryId,
  categoryName,
  currency,
  editHref,
  canMoveUp,
}: MenuItemRowProps): JSX.Element {
  const badge = stateToBadge(item.state);
  const priceLabel = formatMoney(item.price, currency);

  return (
    <TableRow>
      <TableCell>
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <span
            aria-label="No photo"
            className="inline-block h-10 w-10 rounded-md bg-staff-surface-sunken text-staff-text-muted text-center leading-10"
          >
            —
          </span>
        )}
      </TableCell>
      <TableCell className="font-medium text-staff-text-primary">
        {item.name}
      </TableCell>
      <TableCell className="text-staff-text-secondary">{categoryName}</TableCell>
      <TableCell className="text-right font-mono text-staff-text-primary">
        {priceLabel}
      </TableCell>
      <TableCell>
        <Badge variant="status" status={badge.status}>
          {badge.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <MenuRowActions
          item={item}
          editHref={editHref}
          categoryId={categoryId}
          canMoveUp={canMoveUp}
        />
      </TableCell>
    </TableRow>
  );
}
