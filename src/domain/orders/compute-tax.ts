/**
 * Tax and total arithmetic for orders.
 *
 * Rules:
 * - Pure domain function: no database, no HTTP, no React, no side effects.
 * - computeTax: subtotal * taxRate rounded to two decimals (half-up).
 * - computeTotal: subtotal + taxAmount as a two-decimal string.
 * - Every value across domain boundaries is a two-decimal string.
 * - Malformed inputs return VALIDATION_FAILED.
 *
 * Reference: BUILD.md §5.7, §7.1, SYSTEM.md §5, §9.5, DECISIONS.md D-4.3, D-4.4.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals, addDecimal } from "@/domain/shared/money";

/**
 * Computes the tax amount for an order:
 * taxAmount = subtotal * taxRate, rounded to two decimal places.
 *
 * @param subtotal The order subtotal as a decimal string.
 * @param taxRate The venue tax rate as a decimal string (e.g. "0.0825", "0.1000").
 * @returns Result<string> with the two-decimal tax amount or VALIDATION_FAILED.
 */
export function computeTax(
  subtotal: string,
  taxRate: string
): Result<string> {
  const subResult = parseDecimal(subtotal);
  if (!subResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Subtotal '${subtotal}' is invalid: ${subResult.error.message}`
    );
  }
  if (subResult.value < 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Subtotal cannot be negative: '${subtotal}'`
    );
  }

  const rateResult = parseDecimal(taxRate);
  if (!rateResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Tax rate '${taxRate}' is invalid: ${rateResult.error.message}`
    );
  }
  if (rateResult.value < 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Tax rate cannot be negative: '${taxRate}'`
    );
  }

  const taxAmount = subResult.value * rateResult.value;
  return ok(roundToTwoDecimals(taxAmount));
}

/**
 * Computes the total for an order:
 * total = subtotal + taxAmount.
 *
 * @param subtotal The order subtotal as a decimal string.
 * @param taxAmount The computed tax amount as a decimal string.
 * @returns Result<string> with the two-decimal total or VALIDATION_FAILED.
 */
export function computeTotal(
  subtotal: string,
  taxAmount: string
): Result<string> {
  const subResult = parseDecimal(subtotal);
  if (!subResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Subtotal '${subtotal}' is invalid: ${subResult.error.message}`
    );
  }
  if (subResult.value < 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Subtotal cannot be negative: '${subtotal}'`
    );
  }

  const taxResult = parseDecimal(taxAmount);
  if (!taxResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Tax amount '${taxAmount}' is invalid: ${taxResult.error.message}`
    );
  }
  if (taxResult.value < 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Tax amount cannot be negative: '${taxAmount}'`
    );
  }

  return ok(addDecimal(subtotal, taxAmount));
}

