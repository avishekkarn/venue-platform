import type {
  HTMLAttributes,
  JSX,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

// ---- Root ---------------------------------------------------------------
// Wrapped in a horizontally-scrollable container so wide tables do not
// break the layout on narrower viewports. The scroll container is
// scrollable only when the content exceeds the container width; otherwise
// it is transparent to the page.

interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

function Table({
  className,
  children,
  ...props
}: TableProps): JSX.Element {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn(
          "w-full border-collapse text-left " +
            "text-[14px] leading-[20px] " +
            "text-staff-text-primary " +
            "[data-world=guest]_&:text-guest-text-primary",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

// ---- Header / Body / Footer ---------------------------------------------
// Plain wrappers. The styling lives on the cells.

function TableHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

function TableBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

function TableFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return (
    <tfoot
      className={cn(
        "border-t " +
          "border-staff-border-subtle " +
          "[data-world=guest]_&:border-guest-border-subtle",
        className
      )}
      {...props}
    >
      {children}
    </tfoot>
  );
}

// ---- Caption ------------------------------------------------------------
// A <caption> element for screen readers. Visually hidden by default;
// a consumer can pass a className to make it visible.

function TableCaption({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLTableCaptionElement>): JSX.Element {
  return (
    <caption className={cn("sr-only", className)} {...props}>
      {children}
    </caption>
  );
}

// ---- Row ----------------------------------------------------------------
// data-state: default (omitted) | selected | expanded | loading.
// Hover changes background. Motion is off — tables do not animate rows.

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

function TableRow({
  className,
  children,
  ...props
}: TableRowProps): JSX.Element {
  return (
    <tr
      className={cn(
        "border-b " +
          "border-staff-border-subtle " +
          "[data-world=guest]_&:border-guest-border-subtle " +
          "transition-colors duration-0 " +
          // Hover
          "hover:bg-staff-surface-sunken " +
          "[data-world=guest]_&:hover:bg-guest-surface-sunken " +
          // Selected
          "data-[state=selected]:bg-staff-surface-sunken " +
          "[data-world=guest]_&:data-[state=selected]:bg-guest-surface-sunken " +
          // Expanded: same visual as selected, but semantically distinct
          "data-[state=expanded]:bg-staff-surface-sunken " +
          "[data-world=guest]_&:data-[state=expanded]:bg-guest-surface-sunken " +
          // Loading: reduced opacity, no pointer events
          "data-[state=loading]:pointer-events-none data-[state=loading]:opacity-60",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

// ---- Header cell --------------------------------------------------------
// <th>. Sortable columns set `sortable` and `aria-sort` and receive
// an onClick from the consumer. The component does not sort.

type AriaSort = "none" | "ascending" | "descending" | "other";

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
  sortable?: boolean;
  "aria-sort"?: AriaSort;
}

function TableHead({
  className,
  children,
  sortable = false,
  ...props
}: TableHeadProps): JSX.Element {
  return (
    <th
      scope="col"
      className={cn(
        "h-9 px-3 align-middle " +
          "text-[12px] font-semibold uppercase tracking-wide leading-[16px] " +
          "text-staff-text-muted " +
          "[data-world=guest]_&:text-guest-text-muted " +
          "border-b " +
          "border-staff-border-subtle " +
          "[data-world=guest]_&:border-guest-border-subtle",
        sortable && "cursor-pointer select-none",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

// ---- Cell ---------------------------------------------------------------
// <td>. Padding and vertical alignment only.

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

function TableCell({
  className,
  children,
  ...props
}: TableCellProps): JSX.Element {
  return (
    <td
      className={cn("px-3 py-2 align-middle", className)}
      {...props}
    >
      {children}
    </td>
  );
}

// ---- Empty state --------------------------------------------------------
// A single row with a colSpan cell. Rendered inside a <TableBody> when
// there are no rows. Text is centered and muted.

interface TableEmptyProps {
  colSpan: number;
  children?: ReactNode;
  className?: string;
}

function TableEmpty({
  colSpan,
  children,
  className,
}: TableEmptyProps): JSX.Element {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          "px-3 py-8 text-center " +
            "text-[14px] leading-[20px] " +
            "text-staff-text-muted " +
            "[data-world=guest]_&:text-guest-text-muted",
          className
        )}
      >
        {children ?? "No data."}
      </td>
    </tr>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableCaption,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
};