/**
 * Pure domain calculator: Menu Engineering Matrix (View 10).
 *
 * Classic Kasavana & Smith hospitality engineering quadrant:
 * - Star: High Volume, High Profitability / Revenue
 * - Plowhorse: High Volume, Low Profitability / Revenue
 * - Puzzle: Low Volume, High Profitability / Revenue
 * - Dog: Low Volume, Low Profitability / Revenue
 *
 * Headers: Item Name,Units Sold,Line Revenue,Quadrant
 * Governed by BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type MenuMatrixRow, type MenuMatrixQuadrant } from "./types";

export interface MenuMatrixItemInput {
  readonly itemName: string;
  readonly unitsSold: number;
  readonly lineRevenue: string;
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
): Result<MenuMatrixRow[]> {
  if (!Array.isArray(items)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Items must be an array");
  }

  interface ParsedItem {
    itemName: string;
    unitsSold: number;
    revenueNum: number;
    revenueStr: string;
  }

  const parsed: ParsedItem[] = [];

  for (const it of items) {
    const revRes = parseDecimal(it.lineRevenue);
    if (!revRes.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid revenue for item '${it.itemName}': ${it.lineRevenue}`
      );
    }

    parsed.push({
      itemName: it.itemName.trim(),
      unitsSold: Math.max(0, it.unitsSold || 0),
      revenueNum: revRes.value,
      revenueStr: roundToTwoDecimals(revRes.value),
    });
  }

  if (parsed.length === 0) {
    return ok([]);
  }

  const medianVolume = calculateMedian(parsed.map((p) => p.unitsSold));
  const medianRevenue = calculateMedian(parsed.map((p) => p.revenueNum));

  const rows: MenuMatrixRow[] = parsed.map((p) => {
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
      lineRevenue: p.revenueStr,
      quadrant,
    };
  });

  rows.sort((a, b) => b.unitsSold - a.unitsSold);

  return ok(rows);
}
