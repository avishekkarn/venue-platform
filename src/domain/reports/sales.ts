/**
 * Pure domain calculator: Sales by Item & Category (View 2).
 *
 * Headers: Category,Item Name,Units Sold,Base Revenue,Modifier Revenue,Line Revenue,Modifier Attach Rate %
 *
 * Rules:
 * - Grouped by itemName primarily so an item's volume is never split.
 * - Category is the frozen snapshot (D-12.6). If an item spanned categories historically, displays "Mixed".
 * - Tracks uncategorized items to feed meta.quality banner.
 *
 * Governed by D-4.1, D-12.6, BUILD.md §7.1.
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

export interface ItemSalesResult {
  readonly rows: ItemSalesRow[];
  readonly uncategorizedItemPct: number;
}

export function generateItemSales(
  items: readonly OrderItemSalesInput[]
): Result<ItemSalesResult> {
  if (!Array.isArray(items)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Items must be an array");
  }

  interface Acc {
    itemName: string;
    categories: Set<string>;
    unitsSold: number;
    unitsWithModifiers: number;
    baseRevenueNum: number;
    modifierRevenueNum: number;
    lineRevenueNum: number;
  }

  const map = new Map<string, Acc>();
  let uncategorizedUnits = 0;
  let totalUnits = 0;

  for (const it of items) {
    const rawCategory = it.categoryName?.trim();
    const category = rawCategory || "Uncategorized";
    const itemName = it.itemName.trim();
    if (!itemName) continue;

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
    totalUnits += qty;
    if (!rawCategory || rawCategory.toLowerCase() === "uncategorized") {
      uncategorizedUnits += qty;
    }

    const hasModifiers =
      (Array.isArray(it.modifiersJson) && it.modifiersJson.length > 0) ||
      modRes.value > 0;

    const current = map.get(itemName) ?? {
      itemName,
      categories: new Set<string>(),
      unitsSold: 0,
      unitsWithModifiers: 0,
      baseRevenueNum: 0,
      modifierRevenueNum: 0,
      lineRevenueNum: 0,
    };

    current.categories.add(category);
    current.unitsSold += qty;
    if (hasModifiers) {
      current.unitsWithModifiers += qty;
    }
    current.baseRevenueNum += priceRes.value * qty;
    current.modifierRevenueNum += modRes.value * qty;
    current.lineRevenueNum += lineRes.value;

    map.set(itemName, current);
  }

  const uncategorizedItemPct =
    totalUnits > 0
      ? Number(((uncategorizedUnits / totalUnits) * 100).toFixed(1))
      : 0;

  const rows: ItemSalesRow[] = Array.from(map.values())
    .map((rec) => {
      let finalCategory: string;
      if (rec.categories.size === 1) {
        finalCategory = Array.from(rec.categories)[0] ?? "Uncategorized";
      } else {
        finalCategory = "Mixed";
      }

      const attachRate =
        rec.unitsSold > 0
          ? ((rec.unitsWithModifiers / rec.unitsSold) * 100).toFixed(1) + "%"
          : "0.0%";

      return {
        category: finalCategory,
        itemName: rec.itemName,
        unitsSold: rec.unitsSold,
        baseRevenue: roundToTwoDecimals(rec.baseRevenueNum),
        modifierRevenue: roundToTwoDecimals(rec.modifierRevenueNum),
        lineRevenue: roundToTwoDecimals(rec.lineRevenueNum),
        modifierAttachRate: attachRate,
      };
    })
    .sort((a, b) => b.unitsSold - a.unitsSold || a.itemName.localeCompare(b.itemName));

  return ok({ rows, uncategorizedItemPct });
}
