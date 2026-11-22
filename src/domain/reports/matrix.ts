/**
 * Pure domain calculator: Menu Engineering Matrix (View 10 / View 3).
 *
 * Classic Kasavana & Smith hospitality engineering quadrant:
 * - Star: High Volume, High Profitability / Revenue
 * - Plowhorse: High Volume, Low Profitability / Revenue
 * - Puzzle: Low Volume, High Profitability / Revenue
 * - Dog: Low Volume, Low Profitability / Revenue
 *
 * Headers:
 * # Median Volume = X, Median Revenue = Y NPR, Items = N
 * # Profitability axis = line revenue (item cost not tracked in v1 per D-4.1)
 * Item Name,Units Sold,Line Revenue,Quadrant
 *
 * Governed by D-4.1, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type MenuMatrixRow, type MenuMatrixQuadrant } from "./types";

export interface MenuMatrixItemInput {
  readonly itemName: string;
  readonly categoryName?: string | null;
  readonly unitsSold: number;
  readonly lineRevenue: string;
}

export interface MenuMatrixResult {
  readonly rows: MenuMatrixRow[];
  readonly medianVolume: number;
  readonly medianRevenue: string;
  readonly itemCount: number;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

export function generateMenuMatrix(
  items: readonly MenuMatrixItemInput[]
): Result<MenuMatrixResult> {
  if (!Array.isArray(items)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Items must be an array");
  }

  // 1. Deduplicate by unique itemName first across all orders
  interface AggregatedItem {
    itemName: string;
    unitsSold: number;
    revenueNum: number;
  }

  const map = new Map<string, AggregatedItem>();

  for (const it of items) {
    const revRes = parseDecimal(it.lineRevenue);
    if (!revRes.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid revenue for item '${it.itemName}': ${it.lineRevenue}`
      );
    }

    const name = it.itemName.trim();
    if (!name) continue;

    const current = map.get(name) ?? {
      itemName: name,
      unitsSold: 0,
      revenueNum: 0,
    };

    current.unitsSold += Math.max(0, it.unitsSold || 0);
    current.revenueNum += revRes.value;

    map.set(name, current);
  }

  const deduplicated = Array.from(map.values());

  if (deduplicated.length === 0) {
    return ok({
      rows: [],
      medianVolume: 0,
      medianRevenue: "0.00",
      itemCount: 0,
    });
  }

  // 2. Compute single global medians across the deduplicated item set
  const medianVolume = calculateMedian(deduplicated.map((p) => p.unitsSold));
  const medianRevenue = calculateMedian(deduplicated.map((p) => p.revenueNum));

  // 3. Classify each item against the global medians
  const rows: MenuMatrixRow[] = deduplicated.map((p) => {
    let quadrant: MenuMatrixQuadrant;

    const isHighVolume = p.unitsSold >= medianVolume;
    const isHighRevenue = p.revenueNum >= medianRevenue;

    if (isHighVolume && isHighRevenue) {
      quadrant = "Star";
    } else if (isHighVolume && !isHighRevenue) {
      quadrant = "Plowhorse";
    } else if (!isHighVolume && isHighRevenue) {
      quadrant = "Puzzle";
    } else {
      quadrant = "Dog";
    }

    return {
      itemName: p.itemName,
      unitsSold: p.unitsSold,
      lineRevenue: roundToTwoDecimals(p.revenueNum),
      quadrant,
    };
  });

  rows.sort((a, b) => b.unitsSold - a.unitsSold || a.itemName.localeCompare(b.itemName));

  return ok({
    rows,
    medianVolume,
    medianRevenue: roundToTwoDecimals(medianRevenue),
    itemCount: rows.length,
  });
}
