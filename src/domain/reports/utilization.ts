/**
 * Pure domain calculator: Place Utilization & Occupancy Dwell (Views 14 & 15 / Views 5 & 16).
 *
 * Headers View 14:
 * # Active sessions counted separately; excluded from Avg Dwell (D-12.8).
 * Place Type,Place Number,Category,Sessions (closed),Active Sessions,Avg Dwell Min,Max Dwell Min,Orders,Revenue,Conversion %
 *
 * Headers View 15:
 * # Rows grouped per place, not aggregated by place type. Stale sessions flagged.
 * Place Type,Place Number,Period,Total Sessions,Avg Dwell Min,Peak Concurrent,Stale Sessions
 *
 * Governed by D-10.2, D-12.8, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type PlaceUtilizationRow, type OccupancyDwellRow } from "./types";

export interface PlaceUtilizationInput {
  readonly placeType: string; // TABLE, ROOM, COUNTER
  readonly placeNumber: string;
  readonly category: string;
  readonly sessions: readonly {
    readonly id: string;
    readonly createdAt: Date | string;
    readonly endedAt?: Date | string | null;
    readonly ordersCount: number;
    readonly revenue: string;
  }[];
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function generatePlaceUtilization(
  places: readonly PlaceUtilizationInput[]
): Result<PlaceUtilizationRow[]> {
  if (!Array.isArray(places)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Places must be an array");
  }

  const rows: PlaceUtilizationRow[] = [];

  for (const p of places) {
    let closedSessionsCount = 0;
    let activeSessionsCount = 0;
    let ordersSum = 0;
    let revenueSum = 0;
    let sessionsWithOrders = 0;
    const closedDwellMinutes: number[] = [];

    for (const s of p.sessions ?? []) {
      ordersSum += s.ordersCount;
      if (s.ordersCount > 0) sessionsWithOrders += 1;

      const revRes = parseDecimal(s.revenue);
      if (revRes.ok) revenueSum += revRes.value;

      const cDate = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
      if (s.endedAt) {
        closedSessionsCount += 1;
        const eDate = s.endedAt instanceof Date ? s.endedAt : new Date(s.endedAt);
        if (!isNaN(cDate.getTime()) && !isNaN(eDate.getTime()) && eDate >= cDate) {
          closedDwellMinutes.push(Math.round((eDate.getTime() - cDate.getTime()) / 60000));
        }
      } else {
        activeSessionsCount += 1;
      }
    }

    const totalSessions = closedSessionsCount + activeSessionsCount;
    let avgDwellMin = 0;
    let maxDwellMin = 0;

    if (closedDwellMinutes.length > 0) {
      avgDwellMin = Math.round(
        closedDwellMinutes.reduce((a, b) => a + b, 0) / closedDwellMinutes.length
      );
      maxDwellMin = Math.max(...closedDwellMinutes);
    }

    const convNum =
      totalSessions > 0 ? (sessionsWithOrders / totalSessions) * 100 : 0;
    const conversionPct = convNum.toFixed(1) + "%";

    rows.push({
      placeType: p.placeType,
      placeNumber: p.placeNumber,
      category: p.category,
      sessionsClosed: closedSessionsCount,
      activeSessions: activeSessionsCount,
      avgDwellMin,
      maxDwellMin,
      orders: ordersSum,
      revenue: roundToTwoDecimals(revenueSum),
      conversionPct,
    });
  }

  rows.sort((a, b) => a.placeType.localeCompare(b.placeType) || a.placeNumber.localeCompare(b.placeNumber));

  return ok(rows);
}

export function generateOccupancyDwell(
  places: readonly PlaceUtilizationInput[],
  periodStr = "All Time",
  now: Date = new Date()
): Result<OccupancyDwellRow[]> {
  if (!Array.isArray(places)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Places must be an array");
  }

  const rows: OccupancyDwellRow[] = [];

  for (const p of places) {
    const totalSessions = p.sessions?.length || 0;
    const closedDwell: number[] = [];
    let staleCount = 0;

    for (const s of p.sessions ?? []) {
      const cDate = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
      if (s.endedAt) {
        const eDate = s.endedAt instanceof Date ? s.endedAt : new Date(s.endedAt);
        if (!isNaN(cDate.getTime()) && !isNaN(eDate.getTime()) && eDate >= cDate) {
          closedDwell.push(Math.round((eDate.getTime() - cDate.getTime()) / 60000));
        }
      } else {
        if (!isNaN(cDate.getTime()) && now.getTime() - cDate.getTime() > FOUR_HOURS_MS) {
          staleCount += 1;
        }
      }
    }

    const avgDwell =
      closedDwell.length > 0
        ? Math.round(closedDwell.reduce((a, b) => a + b, 0) / closedDwell.length)
        : 0;

    rows.push({
      placeType: p.placeType,
      placeNumber: p.placeNumber,
      period: periodStr,
      totalSessions,
      avgDwellMin: avgDwell,
      peakConcurrent: Math.min(totalSessions, 1),
      staleSessions: staleCount,
    });
  }

  rows.sort((a, b) => a.placeType.localeCompare(b.placeType) || a.placeNumber.localeCompare(b.placeNumber));

  return ok(rows);
}
