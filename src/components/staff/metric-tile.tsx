import type { JSX } from "react";

/**
 * One metric tile on the admin dashboard (DESIGN.md §4.10.5, §4.6.17.15).
 *
 * The tile is a small rectangle: label, value. The label is muted; the
 * value is primary. No change indicator in the first version — the
 * dashboard route's six-field response has no `changes` field. A future
 * task can add `change?: { direction: "up" | "down"; percent: number }`
 * if the route grows the data.
 *
 * No motion (DESIGN.md §4.10.14: "The admin panel has no decorative
 * motion. No fade-ins on load.").
 *
 * Server Component — it renders what it receives.
 */
export interface MetricTileProps {
  readonly label: string;
  readonly value: string | number;
  readonly subtext?: string;
}

export function MetricTile({ label, value, subtext }: MetricTileProps): JSX.Element {
  const valueStr = String(value);
  const isLong = valueStr.length > 10;
  const isMedium = valueStr.length > 7;

  return (
    <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-4 flex flex-col gap-1 min-w-0 overflow-hidden">
      <span
        className="text-[12px] leading-[16px] font-medium text-staff-text-muted uppercase tracking-wide truncate"
        title={label}
      >
        {label}
      </span>
      <span
        className={`font-semibold text-staff-text-primary tracking-tight whitespace-nowrap overflow-hidden text-ellipsis ${
          isLong
            ? "text-lg sm:text-xl lg:text-lg xl:text-xl leading-tight"
            : isMedium
            ? "text-xl sm:text-2xl lg:text-xl xl:text-2xl leading-tight"
            : "text-[26px] sm:text-[28px] leading-[36px]"
        }`}
        title={valueStr}
      >
        {value}
      </span>
      {subtext ? (
        <span
          className="text-[11px] leading-[14px] text-staff-text-secondary mt-0.5 font-medium truncate"
          title={subtext}
        >
          {subtext}
        </span>
      ) : null}
    </div>
  );
}
