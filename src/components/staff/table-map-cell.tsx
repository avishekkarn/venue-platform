import type { JSX } from "react";
import type { Table } from "@/domain/organization/table.repository";

/**
 * A single table cell in the staff world's table map (and the dashboard's).
 *
 * This mirrors the inline TableCard in app/staff/page.tsx exactly — same
 * markup, same data-* attributes, same badge classes, same button shape.
 * The data-* attributes (`data-table-id`, `data-table-number`,
 * `data-table-status`, `data-action="close-table"`) are read by the
 * existing click delegation in app/staff/page.tsx:
 *
 *   document.addEventListener('click', function(e) {
 *     var btn = e.target.closest('[data-action]');
 *     if (action === 'close-table' && btn.hasAttribute('data-table-id')) {
 *       handleCloseTable(btn.getAttribute('data-table-id'), btn.getAttribute('data-table-number'));
 *     }
 *     ...
 *   });
 *
 * The client-side polling replacement in app/staff/page.tsx uses the
 * inline function tableCardHtml(table, isOccupied) to produce identical
 * markup. Both the server-rendered cell (this component) and the
 * poll-rendered cell (the string) must match, so the poll does not
 * visually change the cell when it refreshes. The 8.1.3.A manual check
 * verifies both render the same shape.
 *
 * This is a Server Component. It does no client work — the button's
 * click is handled by the parent page's event delegation.
 *
 * Reference: DESIGN.md §4.10.3 (staff-world layout), §4.6.17.13
 * (TableMapCell), D-9.2 (brand color affects guest screens only),
 * D-19.1 (polling discipline), SYSTEM.md §7 (role model).
 */
export interface TableMapCellProps {
  readonly table: Table;
  readonly isOccupied: boolean;
  readonly canClose?: boolean;
}

export function TableMapCell({
  table,
  isOccupied,
  canClose = true,
}: TableMapCellProps): JSX.Element {
  return (
    <article
      data-table-id={table.id}
      data-table-number={table.number}
      data-table-status={isOccupied ? "OCCUPIED" : "FREE"}
      className="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[28px] font-bold">{table.number}</div>
          <div className="text-[11px] uppercase text-staff-text-muted">Table</div>
        </div>
        {isOccupied ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            Occupied
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Free
          </span>
        )}
      </div>
      <div className="pt-2 border-t border-staff-border-subtle">
        {isOccupied && canClose ? (
          <button
            type="button"
            data-action="close-table"
            data-table-id={table.id}
            data-table-number={table.number}
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-staff-text-muted border border-staff-border-subtle hover:bg-staff-surface-sunken w-full"
          >
            Close Table
          </button>
        ) : (
          <span className="text-xs text-staff-text-muted">—</span>
        )}
      </div>
    </article>
  );
}
