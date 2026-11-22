/**
 * Pure domain calculator: Tax Remittance Report (View 5 / View 12).
 *
 * Headers:
 * # Rate shown as both decimal and percent for accountant readability.
 * Period Start,Period End,Tax Rate,Tax Rate %,Taxable Subtotal,Tax Collected,Orders
 *
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
    periodStart: string;
    periodEnd: string;
    taxRate: string;
    taxRatePct: string;
    taxableSubtotalNum: number;
    taxCollectedNum: number;
    orders: number;
  }

  const map = new Map<string, Acc>();

  for (const o of orders) {
    const placedDate = o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt);
    if (isNaN(placedDate.getTime())) continue;

    const iso = placedDate.toISOString();
    let periodStart = "";
    let periodEnd = "";

    if (periodType === "MONTHLY") {
      const year = placedDate.getUTCFullYear();
      const month = String(placedDate.getUTCMonth() + 1).padStart(2, "0");
      periodStart = `${year}-${month}-01`;
      const lastDay = new Date(Date.UTC(year, placedDate.getUTCMonth() + 1, 0)).getUTCDate();
      periodEnd = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
    } else {
      periodStart = iso.slice(0, 10);
      periodEnd = iso.slice(0, 10);
    }

    const taxRate = o.taxRate || "0.0000";
    const rateNum = parseFloat(taxRate);
    const taxRatePct = (rateNum * 100).toFixed(1) + "%";

    const key = `${periodStart}__${periodEnd}__${taxRate}`;

    const subRes = parseDecimal(o.subtotal);
    const taxRes = parseDecimal(o.taxAmount);

    if (!subRes.ok || !taxRes.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid money string in tax order: subtotal=${o.subtotal}, tax=${o.taxAmount}`
      );
    }

    const current = map.get(key) ?? {
      periodStart,
      periodEnd,
      taxRate,
      taxRatePct,
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
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart) || a.taxRate.localeCompare(b.taxRate))
    .map((item) => ({
      periodStart: item.periodStart,
      periodEnd: item.periodEnd,
      taxRate: item.taxRate,
      taxRatePct: item.taxRatePct,
      taxableSubtotal: roundToTwoDecimals(item.taxableSubtotalNum),
      taxCollected: roundToTwoDecimals(item.taxCollectedNum),
      orders: item.orders,
    }));

  return ok(rows);
}
