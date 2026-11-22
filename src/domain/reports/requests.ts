/**
 * Pure domain calculator: Service Requests Report (View 4).
 *
 * Headers: Service Type,Submitted,Completed,Declined,Cancelled,Avg Resolution (min)
 * Governed by D-5.1 to D-5.7.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type ServiceRequestsRow } from "./types";

export interface ServiceRequestStateChangeInput {
  readonly state: string;
  readonly occurredAt: Date | string;
}

export interface ServiceRequestReportInput {
  readonly id: string;
  readonly serviceType: string;
  readonly state: string;
  readonly submittedAt: Date | string;
  readonly stateChanges: readonly ServiceRequestStateChangeInput[];
}

export function generateServiceRequestsReport(
  requests: readonly ServiceRequestReportInput[]
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
    resolutionDurationsMin: number[];
  }

  const map = new Map<string, Acc>();

  for (const r of requests) {
    const serviceType = r.serviceType || "OTHER";
    const current: Acc = map.get(serviceType) ?? {
      serviceType,
      submitted: 0,
      completed: 0,
      declined: 0,
      cancelled: 0,
      resolutionDurationsMin: [],
    };

    current.submitted += 1;

    const submittedDate = r.submittedAt instanceof Date ? r.submittedAt : new Date(r.submittedAt);
    const subTime = isNaN(submittedDate.getTime()) ? null : submittedDate.getTime();

    // Check terminal states
    if (r.state === "COMPLETED") current.completed += 1;
    if (r.state === "DECLINED") current.declined += 1;
    if (r.state === "CANCELLED") current.cancelled += 1;

    // Check resolution duration: time until COMPLETED or DECLINED
    if (subTime) {
      let resolvedTime: number | null = null;
      for (const sc of r.stateChanges ?? []) {
        if (sc.state === "COMPLETED" || sc.state === "DECLINED") {
          const t = sc.occurredAt instanceof Date ? sc.occurredAt : new Date(sc.occurredAt);
          if (!isNaN(t.getTime())) {
            resolvedTime = t.getTime();
            break;
          }
        }
      }

      if (resolvedTime && resolvedTime >= subTime) {
        const diffMin = Math.round((resolvedTime - subTime) / (1000 * 60));
        current.resolutionDurationsMin.push(diffMin);
      }
    }

    map.set(serviceType, current);
  }

  const avg = (nums: number[]): number =>
    nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  const rows: ServiceRequestsRow[] = Array.from(map.values())
    .sort((a, b) => b.submitted - a.submitted)
    .map((item) => ({
      serviceType: item.serviceType,
      submitted: item.submitted,
      completed: item.completed,
      declined: item.declined,
      cancelled: item.cancelled,
      avgResolutionMin: avg(item.resolutionDurationsMin),
    }));

  return ok(rows);
}
