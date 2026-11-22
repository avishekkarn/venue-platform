/**
 * Pure domain calculator: Cancellation Root-Cause Report (View 9 / View 13).
 *
 * Headers:
 * # Clean Operations: No cancellations in range. 0 of N orders were cancelled (0.0% cancellation rate).
 * Date,Cancelled Orders,Top Reason,Reason Count
 *
 * Governed by D-4.7, D-4.8, D-12.2.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type CancellationRootCauseRow } from "./types";

export interface CancellationEventInput {
  readonly occurredAt: Date | string;
  readonly note?: string | null;
}

export interface CancellationReportResult {
  readonly rows: CancellationRootCauseRow[];
  readonly totalOrders: number;
  readonly totalCancelled: number;
  readonly cancellationRatePct: string;
  readonly isCleanOperations: boolean;
}

export function generateCancellationRootCause(
  events: readonly CancellationEventInput[],
  totalOrders = 0
): Result<CancellationReportResult> {
  if (!Array.isArray(events)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Events must be an array");
  }

  interface Acc {
    date: string;
    cancelledOrders: number;
    reasonCounts: Map<string, number>;
  }

  const map = new Map<string, Acc>();
  let totalCancelled = 0;

  for (const e of events) {
    const t = e.occurredAt instanceof Date ? e.occurredAt : new Date(e.occurredAt);
    if (isNaN(t.getTime())) continue;

    const dateStr = t.toISOString().slice(0, 10);
    const reason = e.note?.trim() || "Unspecified";

    const current = map.get(dateStr) ?? {
      date: dateStr,
      cancelledOrders: 0,
      reasonCounts: new Map<string, number>(),
    };

    current.cancelledOrders += 1;
    totalCancelled += 1;
    current.reasonCounts.set(reason, (current.reasonCounts.get(reason) ?? 0) + 1);

    map.set(dateStr, current);
  }

  const rows: CancellationRootCauseRow[] = Array.from(map.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((item) => {
      let topReason = "None";
      let topCount = 0;

      for (const [r, count] of item.reasonCounts.entries()) {
        if (count > topCount) {
          topReason = r;
          topCount = count;
        }
      }

      return {
        date: item.date,
        cancelledOrders: item.cancelledOrders,
        topReason,
        reasonCount: topCount,
      };
    });

  const rateNum =
    totalOrders > 0 ? (totalCancelled / totalOrders) * 100 : 0;
  const cancellationRatePct = rateNum.toFixed(1) + "%";

  return ok({
    rows,
    totalOrders,
    totalCancelled,
    cancellationRatePct,
    isCleanOperations: totalCancelled === 0,
  });
}
