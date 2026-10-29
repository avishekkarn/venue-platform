/**
 * Price arithmetic for orders.
 *
 * Rules:
 * - Pure domain function: no database, no HTTP, no React, no side effects.
 * - computeLineTotal: (itemPrice + sum(modifierPrices)) * quantity
 * - computeSubtotal: sum of line totals
 * - Every value across domain boundaries is a two-decimal string.
 * - Malformed inputs return VALIDATION_FAILED.
 *
 * Reference: BUILD.md §5.7, §7.1, SYSTEM.md §5, §9.4, DECISIONS.md D-4.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";

/**
 * Computes the line total for an order item:
 * lineTotal = (itemPrice + sum(modifierPrices)) * quantity
 *
 * @param itemPrice The base price of the item as a decimal string.
 * @param modifierPrices Array of modifier additional prices as decimal strings.
 * @param quantity The integer quantity (must be >= 1).
 * @returns Result<string> with the two-decimal line total or VALIDATION_FAILED.
 */
export function computeLineTotal(
  itemPrice: string,
  modifierPrices: readonly string[],
  quantity: number
): Result<string> {
  const itemPriceResult = parseDecimal(itemPrice);
  if (!itemPriceResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Item price '${itemPrice}' is invalid: ${itemPriceResult.error.message}`
    );
  }
  if (itemPriceResult.value < 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Item price cannot be negative: '${itemPrice}'`
    );
  }

  if (!Array.isArray(modifierPrices)) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "modifierPrices must be an array"
    );
  }

  let modSum = 0;
  for (const modPrice of modifierPrices) {
    const modResult = parseDecimal(modPrice);
    if (!modResult.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Modifier price '${modPrice}' is invalid: ${modResult.error.message}`
      );
    }
    if (modResult.value < 0) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Modifier price cannot be negative: '${modPrice}'`
      );
    }
    modSum += modResult.value;
  }

  if (
    typeof quantity !== "number" ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Quantity must be a positive integer, received: ${quantity}`
    );
  }

  const basePerItem = itemPriceResult.value + modSum;
  const total = basePerItem * quantity;

  return ok(roundToTwoDecimals(total));
}

/**
 * Computes the subtotal of an order by summing all line totals.
 * An empty list of line totals returns "0.00".
 *
 * @param lineTotals Array of line totals as decimal strings.
 * @returns Result<string> with the two-decimal subtotal or VALIDATION_FAILED.
 */
export function computeSubtotal(
  lineTotals: readonly string[]
): Result<string> {
  if (!Array.isArray(lineTotals)) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "lineTotals must be an array"
    );
  }

  if (lineTotals.length === 0) {
    return ok("0.00");
  }

  let sum = 0;
  for (const lt of lineTotals) {
    const parsed = parseDecimal(lt);
    if (!parsed.ok) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Line total '${lt}' is invalid: ${parsed.error.message}`
      );
    }
    if (parsed.value < 0) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Line total cannot be negative: '${lt}'`
      );
    }
    sum += parsed.value;
  }

  return ok(roundToTwoDecimals(sum));
}

