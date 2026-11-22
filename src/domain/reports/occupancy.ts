/**
 * Pure domain calculator: Occupancy & Dwell Report (View 16).
 *
 * Headers: Place Type,Period,Total Sessions,Avg Dwell (min),Peak Concurrent
 * Governed by D-2.1, D-10.2.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type OccupancyDwellRow } from "./types";

export interface OccupancySessionInput {
  readonly placeType: string;
  readonly createdAt: Date | string;
  readonly endedAt?: Date | string | null;
}

export function generateOccupancyDwell(
  sessions: readonly OccupancySessionInput[],
  periodType: "DAILY" | "MONTHLY" = "DAILY"
): Result<OccupancyDwellRow[]> {
  if (!Array.isArray(sessions)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Sessions must be an array");
  }

  interface Acc {
    placeType: string;
    period: string;
    totalSessions: number;
    dwellDurations: number[];
    sessionIntervals: Array<{ start: number; end: number }>;
  }

  const map = new Map<string, Acc>();

  for (const s of sessions) {
    const start = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
    if (isNaN(start.getTime())) continue;

    const iso = start.toISOString();
    const period = periodType === "MONTHLY" ? iso.slice(0, 7) : iso.slice(0, 10);
    const key = `${s.placeType}__${period}`;

    const current: Acc = map.get(key) ?? {
      placeType: s.placeType,
      period,
      totalSessions: 0,
      dwellDurations: [],
      sessionIntervals: [],
    };

    current.totalSessions += 1;

    let endMs = start.getTime() + 60 * 60 * 1000; // default 1h if ongoing
    if (s.endedAt) {
      const end = s.endedAt instanceof Date ? s.endedAt : new Date(s.endedAt);
      if (!isNaN(end.getTime()) && end.getTime() >= start.getTime()) {
        const diffMin = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
        current.dwellDurations.push(diffMin);
        endMs = end.getTime();
      }
    }

    current.sessionIntervals.push({ start: start.getTime(), end: endMs });
    map.set(key, current);
  }

  // Calculate peak concurrent active sessions per group
  function calculatePeak(intervals: Array<{ start: number; end: number }>): number {
    if (intervals.length === 0) return 0;
    const events: Array<{ time: number; type: 1 | -1 }> = [];
    for (const i of intervals) {
      events.push({ time: i.start, type: 1 });
      events.push({ time: i.end, type: -1 });
    }
    events.sort((a, b) => a.time - b.time || a.type - b.type);

    let max = 0;
    let current = 0;
    for (const e of events) {
      current += e.type;
      if (current > max) max = current;
    }
    return max;
  }

  const rows: OccupancyDwellRow[] = Array.from(map.values())
    .sort((a, b) => b.period.localeCompare(a.period) || a.placeType.localeCompare(b.placeType))
    .map((item) => {
      const avgDwell =
        item.dwellDurations.length > 0
          ? Math.round(item.dwellDurations.reduce((a, b) => a + b, 0) / item.dwellDurations.length)
          : 0;

      return {
        placeType: item.placeType,
        period: item.period,
        totalSessions: item.totalSessions,
        avgDwellMin: avgDwell,
        peakConcurrent: calculatePeak(item.sessionIntervals),
      };
    });

  return ok(rows);
}
