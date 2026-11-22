/**
 * Pure domain calculator: Tax Remittance Report (View 12).
 *
 * Headers: Period,Tax Rate,Taxable Subtotal,Tax Collected,Orders
 * Governed by D-4.1, D-4.4, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type TaxRemittanceRow } from "./types";

export interface TaxOrderInput {
  readonly placedAt: Date | string;
  readonly taxRate: string;
  readonly subtotal: string;
  readonly taxAmount: string;
}

export function generateTaxRemittance(
  orders: readonly TaxOrderInput[],
  periodType: "MONTHLY" | "DAILY" = "MONTHLY"
): Result<TaxRemittanceRow[]> {
  if (!Array.isArray(orders)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Orders must be an array");
  }

  interface Acc {
    period: string;
    taxRate: string;
    taxableSubtotalNum: number;
    taxCollectedNum: number;
    orders: number;
  }

  const map = new Map<string, Acc>();

  for (const o of orders) {
    const placedDate = o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt);
    if (isNaN(placedDate.getTime())) continue;

    const iso = placedDate.toISOString();
    const period = periodType === "MONTHLY" ? iso.slice(0, 7) : iso.slice(0, 10);
    const taxRate = o.taxRate || "0.0000";
    const key = `${period}__${taxRate}`;

    const subRes = parseDecimal(o.subtotal);
    const taxRes = parseDecimal(o.taxAmount);

    if (!subRes.ok || !taxRes.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid money string in tax order: subtotal=${o.subtotal}, tax=${o.taxAmount}`
      );
    }

    const current = map.get(key) ?? {
      period,
      taxRate,
      taxableSubtotalNum: 0,
      taxCollectedNum: 0,
      orders: 0,
    };

    current.orders += 1;
    current.taxableSubtotalNum += subRes.value;
    current.taxCollectedNum += taxRes.value;

    map.set(key, current);
  }

  const rows: TaxRemittanceRow[] = Array.from(map.values())
    .sort((a, b) => b.period.localeCompare(a.period) || a.taxRate.localeCompare(b.taxRate))
    .map((item) => ({
      period: item.period,
      taxRate: item.taxRate,
      taxableSubtotal: roundToTwoDecimals(item.taxableSubtotalNum),
      taxCollected: roundToTwoDecimals(item.taxCollectedNum),
      orders: item.orders,
    }));

  return ok(rows);
}
