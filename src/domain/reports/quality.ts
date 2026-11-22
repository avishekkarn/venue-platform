/**
 * Pure domain builder: Report Data Quality & Anomaly Meta (Task 10 / B-10).
 *
 * Thresholds:
 * - uncategorizedItemPct > 10.0 -> warn
 * - outlierOrders > 0 -> surface anomalies
 * - staleSessions > 0 -> flag stale open sessions
 * - tipsTracked = false in v1 (D-7.4)
 * - paymentMethodsTracked = false in v1 (D-7.7)
 *
 * Governed by BUILD.md §6.2, §11.
 */

import { type ReportQualityMeta } from "./types";

export interface BuildQualityInput {
  readonly uncategorizedItemPct?: number;
  readonly outlierOrders?: number;
  readonly staleSessions?: number;
}

export function buildReportQualityMeta(input: BuildQualityInput = {}): ReportQualityMeta {
  return {
    uncategorizedItemPct: input.uncategorizedItemPct ?? 0,
    outlierOrders: input.outlierOrders ?? 0,
    tipsTracked: false,
    paymentMethodsTracked: false,
    staleSessions: input.staleSessions ?? 0,
  };
}
