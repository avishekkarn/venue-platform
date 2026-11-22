/**
 * Pure domain calculator: Place Utilization (View 5).
 *
 * Headers: Place Type,Place Number,Category,Sessions,Avg Dwell (min),Orders,Revenue,Conversion %
 * Governed by D-8.5.1 to D-8.5.7, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type PlaceUtilizationRow } from "./types";

export interface PlaceSessionInput {
  readonly id: string;
  readonly createdAt: Date | string;
  readonly endedAt: Date | string | null;
  readonly hasOrders?: boolean;
}

export interface PlaceUtilizationInput {
  readonly placeType: string;
  readonly placeNumber: string;
  readonly category?: string | null;
  readonly sessions: readonly PlaceSessionInput[];
  readonly orderTotals: readonly string[];
}

export function generatePlaceUtilization(
  places: readonly PlaceUtilizationInput[]
): Result<PlaceUtilizationRow[]> {
  if (!Array.isArray(places)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Places must be an array");
  }

  const rows: PlaceUtilizationRow[] = [];

  for (const p of places) {
    let dwellTotalMinutes = 0;
    let endedSessionsCount = 0;
    let convertedSessionsCount = 0;

    for (const s of p.sessions) {
      if (s.hasOrders) {
        convertedSessionsCount += 1;
      }
      if (s.endedAt) {
        const start = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
        const end = s.endedAt instanceof Date ? s.endedAt : new Date(s.endedAt);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() >= start.getTime()) {
          const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
          dwellTotalMinutes += diffMinutes;
          endedSessionsCount += 1;
        }
      }
    }

    const avgDwell = endedSessionsCount > 0 ? Math.round(dwellTotalMinutes / endedSessionsCount) : 0;
    const sessionCount = p.sessions.length;

    let revenueSum = 0;
    for (const tot of p.orderTotals) {
      const dec = parseDecimal(tot);
      if (dec.ok) {
        revenueSum += dec.value;
      }
    }

    const convPct =
      sessionCount > 0
        ? ((convertedSessionsCount / sessionCount) * 100).toFixed(1) + "%"
        : "0.0%";

    rows.push({
      placeType: p.placeType,
      placeNumber: p.placeNumber,
      category: p.category?.trim() || "-",
      sessions: sessionCount,
      avgDwellMin: avgDwell,
      orders: p.orderTotals.length,
      revenue: roundToTwoDecimals(revenueSum),
      conversionPct: convPct,
    });
  }

  rows.sort((a, b) => a.placeType.localeCompare(b.placeType) || a.placeNumber.localeCompare(b.placeNumber));

  return ok(rows);
}
