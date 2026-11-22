/**
 * Pure domain calculator: Hourly Heatmap Report (View 8 / View 9).
 *
 * Headers:
 * # Hours in venue local time (Venue.timezone, D-11.5).
 * Date,Hour (Venue Time),Place Type,Orders,Revenue
 *
 * Governed by D-4.6, D-11.5, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type HourlyHeatmapRow } from "./types";

export interface HeatmapOrderInput {
  readonly placedAt: Date | string;
  readonly total: string;
  readonly placeType?: string; // TABLE, ROOM, COUNTER
}

/**
 * Extracts the local date string (YYYY-MM-DD) and hour (0..23) for a date in a given IANA timezone.
 */
function getZonedParts(date: Date, timeZone: string): { dateStr: string; hour: number } {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(date);
    let year = "1970";
    let month = "01";
    let day = "01";
    let hour = 0;

    for (const p of parts) {
      if (p.type === "year") year = p.value;
      if (p.type === "month") month = p.value;
      if (p.type === "day") day = p.value;
      if (p.type === "hour") hour = parseInt(p.value, 10);
    }
    return { dateStr: `${year}-${month}-${day}`, hour };
  } catch {
    // Fallback if timezone is invalid
    return {
      dateStr: date.toISOString().slice(0, 10),
      hour: date.getUTCHours(),
    };
  }
}

export function generateHourlyHeatmap(
  orders: readonly HeatmapOrderInput[],
  timeZone = "Asia/Kathmandu"
): Result<HourlyHeatmapRow[]> {
  if (!Array.isArray(orders)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Orders must be an array");
  }

  interface Acc {
    date: string;
    hour: number;
    placeType: string;
    orders: number;
    revenueNum: number;
  }

  const map = new Map<string, Acc>();

  for (const o of orders) {
    const placedDate = o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt);
    if (isNaN(placedDate.getTime())) continue;

    const { dateStr, hour } = getZonedParts(placedDate, timeZone);
    const placeType = (o.placeType || "TABLE").toUpperCase();
    const key = `${dateStr}__${hour}__${placeType}`;

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
      placeType,
      orders: 0,
      revenueNum: 0,
    };

    current.orders += 1;
    current.revenueNum += totRes.value;

    map.set(key, current);
  }

  const rows: HourlyHeatmapRow[] = Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour || a.placeType.localeCompare(b.placeType))
    .map((item) => ({
      date: item.date,
      hour: item.hour,
      placeType: item.placeType,
      orders: item.orders,
      revenue: roundToTwoDecimals(item.revenueNum),
    }));

  return ok(rows);
}
