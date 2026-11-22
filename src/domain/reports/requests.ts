/**
 * Pure domain calculator: Service Requests & Service SLA (Views 11 & 12).
 *
 * Headers View 11:
 * # Avg Resolution is computed over completed only. "—" when no completions.
 * Service Type,Submitted,Completed,Declined,Cancelled,Avg Resolution Min (completed only)
 *
 * Headers View 12:
 * # P90/P99 suppressed when N < 20; "P50 / max" shown instead.
 * Service Type,N,P50 Resolution Min,P90 Resolution Min,P99 Resolution Min,Max Resolution Min,Open at End of Period
 *
 * Governed by D-5.2, D-5.3, D-5.4, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type ServiceRequestsRow, type ServiceSlaRow } from "./types";

export interface RequestStateChangeInput {
  readonly state: string;
  readonly occurredAt: Date | string;
}

export interface ServiceRequestInput {
  readonly id: string;
  readonly serviceType: string;
  readonly submittedAt: Date | string;
  readonly state: string;
  readonly stateChanges: readonly RequestStateChangeInput[];
}

function computeQuantile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[idx] ?? 0;
}

export function generateServiceRequests(
  requests: readonly ServiceRequestInput[]
): Result<ServiceRequestsRow[]> {
  if (!Array.isArray(requests)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Requests must be an array");
  }

  interface Acc {
    serviceType: string;
    submitted: number;
    completed: number;
    declined: number;
    cancelled: number;
    resolutionMinutes: number[];
  }

  const map = new Map<string, Acc>();

  for (const r of requests) {
    const type = r.serviceType;
    const current: Acc = map.get(type) ?? {
      serviceType: type,
      submitted: 0,
      completed: 0,
      declined: 0,
      cancelled: 0,
      resolutionMinutes: [],
    };

    current.submitted += 1;

    const subDate = r.submittedAt instanceof Date ? r.submittedAt : new Date(r.submittedAt);
    const subTs = !isNaN(subDate.getTime()) ? subDate.getTime() : null;

    let endTs: number | null = null;
    let isCompleted = r.state === "COMPLETED";
    let isDeclined = r.state === "DECLINED";
    let isCancelled = r.state === "CANCELLED";

    for (const sc of r.stateChanges ?? []) {
      const t = sc.occurredAt instanceof Date ? sc.occurredAt : new Date(sc.occurredAt);
      if (!isNaN(t.getTime())) {
        if (sc.state === "COMPLETED") {
          isCompleted = true;
          endTs = t.getTime();
        } else if (sc.state === "DECLINED") {
          isDeclined = true;
        } else if (sc.state === "CANCELLED") {
          isCancelled = true;
        }
      }
    }

    if (isCompleted) current.completed += 1;
    if (isDeclined) current.declined += 1;
    if (isCancelled) current.cancelled += 1;

    if (isCompleted && subTs && endTs && endTs >= subTs) {
      current.resolutionMinutes.push(Math.round((endTs - subTs) / 60000));
    }

    map.set(type, current);
  }

  const rows: ServiceRequestsRow[] = Array.from(map.values())
    .sort((a, b) => a.serviceType.localeCompare(b.serviceType))
    .map((item) => {
      let avgResolutionMin: number | null = null;
      if (item.completed > 0 && item.resolutionMinutes.length > 0) {
        const sum = item.resolutionMinutes.reduce((a, b) => a + b, 0);
        avgResolutionMin = Math.round(sum / item.resolutionMinutes.length);
      }

      return {
        serviceType: item.serviceType,
        submitted: item.submitted,
        completed: item.completed,
        declined: item.declined,
        cancelled: item.cancelled,
        avgResolutionMin, // null when no completions
      };
    });

  return ok(rows);
}

export function generateServiceSla(
  requests: readonly ServiceRequestInput[]
): Result<ServiceSlaRow[]> {
  if (!Array.isArray(requests)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Requests must be an array");
  }

  interface Acc {
    serviceType: string;
    durations: number[];
    openCount: number;
  }

  const map = new Map<string, Acc>();

  for (const r of requests) {
    const type = r.serviceType;
    const current: Acc = map.get(type) ?? {
      serviceType: type,
      durations: [],
      openCount: 0,
    };

    const isOpen = r.state === "SUBMITTED" || r.state === "IN_PROGRESS";
    if (isOpen) {
      current.openCount += 1;
    }

    const subDate = r.submittedAt instanceof Date ? r.submittedAt : new Date(r.submittedAt);
    const subTs = !isNaN(subDate.getTime()) ? subDate.getTime() : null;

    let endTs: number | null = null;
    let isCompleted = r.state === "COMPLETED";

    for (const sc of r.stateChanges ?? []) {
      const t = sc.occurredAt instanceof Date ? sc.occurredAt : new Date(sc.occurredAt);
      if (!isNaN(t.getTime()) && sc.state === "COMPLETED") {
        isCompleted = true;
        endTs = t.getTime();
      }
    }

    if (isCompleted && subTs && endTs && endTs >= subTs) {
      current.durations.push(Math.round((endTs - subTs) / 60000));
    }

    map.set(type, current);
  }

  const rows: ServiceSlaRow[] = Array.from(map.values())
    .sort((a, b) => a.serviceType.localeCompare(b.serviceType))
    .map((item) => {
      const sorted = [...item.durations].sort((a, b) => a - b);
      const n = sorted.length;
      const p50 = n > 0 ? computeQuantile(sorted, 0.5) : 0;
      const max = n > 0 ? (sorted[n - 1] ?? 0) : 0;

      // P90 / P99 are suppressed (null) when sample size N < 20
      const p90 = n >= 20 ? computeQuantile(sorted, 0.9) : null;
      const p99 = n >= 20 ? computeQuantile(sorted, 0.99) : null;

      return {
        serviceType: item.serviceType,
        n,
        p50ResolutionMin: p50,
        p90ResolutionMin: p90,
        p99ResolutionMin: p99,
        maxResolutionMin: max,
        openAtEndOfPeriod: item.openCount,
      };
    });

  return ok(rows);
}
