/**
 * Pure domain calculator: Sales by Item & Category (View 2).
 *
 * Headers: Category,Item Name,Units Sold,Base Revenue,Modifier Revenue,Line Revenue,Modifier Attach Rate %
 * Governed by D-4.1, D-12.6 (snapshotted categoryName), BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type ItemSalesRow } from "./types";

export interface OrderItemSalesInput {
  readonly itemName: string;
  readonly categoryName?: string | null;
  readonly quantity: number;
  readonly itemPrice: string;
  readonly modifierPrice: string;
  readonly lineTotal: string;
  readonly modifiersJson?: unknown;
}

export function generateItemSales(
  items: readonly OrderItemSalesInput[]
): Result<ItemSalesRow[]> {
  if (!Array.isArray(items)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Items must be an array");
  }

  interface Acc {
    category: string;
    itemName: string;
    unitsSold: number;
    unitsWithModifiers: number;
    baseRevenueNum: number;
    modifierRevenueNum: number;
    lineRevenueNum: number;
  }

  const map = new Map<string, Acc>();

  for (const it of items) {
    const category = it.categoryName?.trim() || "Uncategorized";
    const itemName = it.itemName.trim();
    const key = `${category}__${itemName}`;

    const priceRes = parseDecimal(it.itemPrice);
    const modRes = parseDecimal(it.modifierPrice);
    const lineRes = parseDecimal(it.lineTotal);

    if (!priceRes.ok || !modRes.ok || !lineRes.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid money string in order item: price=${it.itemPrice}, mod=${it.modifierPrice}, line=${it.lineTotal}`
      );
    }

    const qty = Math.max(0, it.quantity || 0);
    const hasModifiers =
      (Array.isArray(it.modifiersJson) && it.modifiersJson.length > 0) ||
      modRes.value > 0;

    const current = map.get(key) ?? {
      category,
      itemName,
      unitsSold: 0,
      unitsWithModifiers: 0,
      baseRevenueNum: 0,
      modifierRevenueNum: 0,
      lineRevenueNum: 0,
    };

    current.unitsSold += qty;
    if (hasModifiers) {
      current.unitsWithModifiers += qty;
    }
    current.baseRevenueNum += priceRes.value * qty;
    current.modifierRevenueNum += modRes.value * qty;
    current.lineRevenueNum += lineRes.value;

    map.set(key, current);
  }

  const rows: ItemSalesRow[] = Array.from(map.values())
    .sort((a, b) => a.category.localeCompare(b.category) || b.lineRevenueNum - a.lineRevenueNum)
    .map((rec) => {
      const attachRate =
        rec.unitsSold > 0
          ? ((rec.unitsWithModifiers / rec.unitsSold) * 100).toFixed(1) + "%"
          : "0.0%";

      return {
        category: rec.category,
        itemName: rec.itemName,
        unitsSold: rec.unitsSold,
        baseRevenue: roundToTwoDecimals(rec.baseRevenueNum),
        modifierRevenue: roundToTwoDecimals(rec.modifierRevenueNum),
        lineRevenue: roundToTwoDecimals(rec.lineRevenueNum),
        modifierAttachRate: attachRate,
      };
    });

  return ok(rows);
}
