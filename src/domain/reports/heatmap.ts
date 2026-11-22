/**
 * Pure domain calculator: Hourly Heatmap Report (View 9).
 *
 * Headers: Date,Hour,Orders,Revenue
 * Governed by D-4.6, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type HourlyHeatmapRow } from "./types";

export interface HeatmapOrderInput {
  readonly placedAt: Date | string;
  readonly total: string;
}

export function generateHourlyHeatmap(
  orders: readonly HeatmapOrderInput[]
): Result<HourlyHeatmapRow[]> {
  if (!Array.isArray(orders)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Orders must be an array");
  }

  interface Acc {
    date: string;
    hour: number;
    orders: number;
    revenueNum: number;
  }

  const map = new Map<string, Acc>();

  for (const o of orders) {
    const placedDate = o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt);
    if (isNaN(placedDate.getTime())) continue;

    const dateStr = placedDate.toISOString().slice(0, 10);
    const hour = placedDate.getUTCHours();
    const key = `${dateStr}__${hour}`;

    const totRes = parseDecimal(o.total);
    if (!totRes.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid money string in heatmap order: total=${o.total}`
      );
    }

    const current = map.get(key) ?? {
      date: dateStr,
      hour,
      orders: 0,
      revenueNum: 0,
    };

    current.orders += 1;
    current.revenueNum += totRes.value;

    map.set(key, current);
  }

  const rows: HourlyHeatmapRow[] = Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour)
    .map((item) => ({
      date: item.date,
      hour: item.hour,
      orders: item.orders,
      revenue: roundToTwoDecimals(item.revenueNum),
    }));

  return ok(rows);
}
