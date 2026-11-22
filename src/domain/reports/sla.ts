/**
 * Pure domain calculator: Service SLA Dashboard (View 14).
 *
 * Headers: Service Type,P50 Resolution (min),P90 Resolution (min),P99 Resolution (min),Open Now
 * Governed by D-5.1 to D-5.7.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type ServiceSlaRow } from "./types";

export interface SlaRequestInput {
  readonly serviceType: string;
  readonly state: string;
  readonly submittedAt: Date | string;
  readonly resolvedAt?: Date | string | null;
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))] ?? 0;
}

export function generateServiceSla(
  requests: readonly SlaRequestInput[]
): Result<ServiceSlaRow[]> {
  if (!Array.isArray(requests)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Requests must be an array");
  }

  interface Acc {
    serviceType: string;
    durationsMin: number[];
    openNow: number;
  }

  const map = new Map<string, Acc>();

  for (const r of requests) {
    const serviceType = r.serviceType || "OTHER";
    const current: Acc = map.get(serviceType) ?? {
      serviceType,
      durationsMin: [],
      openNow: 0,
    };

    const isOpen = ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(r.state);
    if (isOpen) {
      current.openNow += 1;
    }

    if (r.resolvedAt) {
      const sub = r.submittedAt instanceof Date ? r.submittedAt : new Date(r.submittedAt);
      const res = r.resolvedAt instanceof Date ? r.resolvedAt : new Date(r.resolvedAt);

      if (!isNaN(sub.getTime()) && !isNaN(res.getTime()) && res.getTime() >= sub.getTime()) {
        const diffMin = Math.round((res.getTime() - sub.getTime()) / (1000 * 60));
        current.durationsMin.push(diffMin);
      }
    }

    map.set(serviceType, current);
  }

  const rows: ServiceSlaRow[] = Array.from(map.values())
    .sort((a, b) => b.openNow - a.openNow || a.serviceType.localeCompare(b.serviceType))
    .map((item) => ({
      serviceType: item.serviceType,
      p50ResolutionMin: calculatePercentile(item.durationsMin, 50),
      p90ResolutionMin: calculatePercentile(item.durationsMin, 90),
      p99ResolutionMin: calculatePercentile(item.durationsMin, 99),
      openNow: item.openNow,
    }));

  return ok(rows);
}
