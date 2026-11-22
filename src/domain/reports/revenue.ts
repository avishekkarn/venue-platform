/**
 * Pure domain calculator: Revenue Summary Report (View 1).
 *
 * Headers: Date,Place Type,Completed Orders,Subtotal,Tax Collected,Total Revenue,Currency
 * Governed by D-7.4 (v1 tips: 0.00), D-7.7 (v1 method: CASH), D-10.2, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type RevenueSummaryRow } from "./types";

export interface OrderRevenueInput {
  readonly placedAt: Date | string;
  readonly placeType: string;
  readonly subtotal: string;
  readonly taxAmount: string;
  readonly total: string;
}

export function generateRevenueSummary(
  orders: readonly OrderRevenueInput[],
  currency: string
): Result<RevenueSummaryRow[]> {
  if (!Array.isArray(orders)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Orders must be an array");
  }

  // Key: `${date}_${placeType}`
  interface Acc {
    date: string;
    placeType: string;
    completedOrders: number;
    subtotalNum: number;
    taxNum: number;
    totalNum: number;
  }

  const map = new Map<string, Acc>();

  for (const o of orders) {
    const placedDate =
      o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt);
    if (isNaN(placedDate.getTime())) {
      continue;
    }
    const dateStr = placedDate.toISOString().slice(0, 10);
    const key = `${dateStr}__${o.placeType}`;

    const subResult = parseDecimal(o.subtotal);
    const taxResult = parseDecimal(o.taxAmount);
    const totResult = parseDecimal(o.total);

    if (!subResult.ok || !taxResult.ok || !totResult.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid money string in order: subtotal=${o.subtotal}, tax=${o.taxAmount}, total=${o.total}`
      );
    }

    const current = map.get(key) ?? {
      date: dateStr,
      placeType: o.placeType,
      completedOrders: 0,
      subtotalNum: 0,
      taxNum: 0,
      totalNum: 0,
    };

    current.completedOrders += 1;
    current.subtotalNum += subResult.value;
    current.taxNum += taxResult.value;
    current.totalNum += totResult.value;

    map.set(key, current);
  }

  const rows: RevenueSummaryRow[] = Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date) || a.placeType.localeCompare(b.placeType))
    .map((item) => ({
      date: item.date,
      placeType: item.placeType,
      completedOrders: item.completedOrders,
      subtotal: roundToTwoDecimals(item.subtotalNum),
      taxCollected: roundToTwoDecimals(item.taxNum),
      totalRevenue: roundToTwoDecimals(item.totalNum),
      currency,
    }));

  return ok(rows);
}
