/**
 * Report Metadata Builder — Task 5 / Task 10 (G-15).
 *
 * Attaches standard report metadata and data quality metrics to API responses.
 *
 * Governed by BUILD.md §6.2, §11, D-12.1.
 */

import { buildReportQualityMeta } from "@/domain/reports/quality";
import { type ReportQualityMeta } from "@/domain/reports/types";

export interface ReportMetaEnvelope {
  readonly view: string;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly quality: ReportQualityMeta;
  readonly [key: string]: unknown;
}

export function buildReportMeta(params: {
  view: string;
  dateFrom: string;
  dateTo: string;
  uncategorizedItemPct?: number;
  outlierOrders?: number;
  staleSessions?: number;
  extra?: Record<string, unknown>;
}): ReportMetaEnvelope {
  return {
    view: params.view,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    quality: buildReportQualityMeta({
      uncategorizedItemPct: params.uncategorizedItemPct,
      outlierOrders: params.outlierOrders,
      staleSessions: params.staleSessions,
    }),
    ...(params.extra ?? {}),
  };
}
