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
}

export function MetricTile({ label, value }: MetricTileProps): JSX.Element {
  return (
    <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-4 flex flex-col gap-1">
      <span className="text-[12px] leading-[16px] font-medium text-staff-text-muted uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
        {value}
      </span>
    </div>
  );
}
