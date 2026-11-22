/**
 * Pure domain calculator: Modifier Attach-Rate Report (View 11).
 *
 * Headers: Modifier Group,Modifier Option,Times Selected,Revenue,Attach Rate %
 * Governed by D-4.1, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type ModifierAttachRow } from "./types";

export interface SelectedModifierData {
  readonly groupName?: string;
  readonly name: string;
  readonly price: string;
}

export interface ModifierItemInput {
  readonly quantity: number;
  readonly modifiersJson: unknown;
}

export function generateModifierAttachReport(
  items: readonly ModifierItemInput[],
  totalParentUnits: number
): Result<ModifierAttachRow[]> {
  if (!Array.isArray(items)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Items must be an array");
  }

  interface Acc {
    groupName: string;
    optionName: string;
    timesSelected: number;
    revenueNum: number;
  }

  const map = new Map<string, Acc>();

  for (const it of items) {
    const itemQty = Math.max(1, it.quantity || 1);
    if (!Array.isArray(it.modifiersJson)) continue;

    for (const mod of it.modifiersJson) {
      if (!mod || typeof mod !== "object") continue;
      const m = mod as SelectedModifierData;
      const groupName = m.groupName?.trim() || "Add-ons";
      const optionName = m.name?.trim() || "Option";
      const key = `${groupName}__${optionName}`;

      const priceRes = parseDecimal(String(m.price ?? "0.00"));
      const priceVal = priceRes.ok ? priceRes.value : 0;

      const current = map.get(key) ?? {
        groupName,
        optionName,
        timesSelected: 0,
        revenueNum: 0,
      };

      current.timesSelected += itemQty;
      current.revenueNum += priceVal * itemQty;

      map.set(key, current);
    }
  }

  const rows: ModifierAttachRow[] = Array.from(map.values())
    .sort((a, b) => b.timesSelected - a.timesSelected)
    .map((item) => {
      const attachPct =
        totalParentUnits > 0
          ? ((item.timesSelected / totalParentUnits) * 100).toFixed(1) + "%"
          : "0.0%";

      return {
        modifierGroup: item.groupName,
        modifierOption: item.optionName,
        timesSelected: item.timesSelected,
        revenue: roundToTwoDecimals(item.revenueNum),
        attachRatePct: attachPct,
      };
    });

  return ok(rows);
}
