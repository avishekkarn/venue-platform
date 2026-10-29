/**
 * Shared decimal-money helper for domain arithmetic.
 *
 * Rules (BUILD.md §5.7, §7.1):
 * - Every monetary value is a decimal string across domain boundaries, never a floating-point number.
 * - Internal arithmetic uses standard half-up rounding to two decimal places.
 * - All inputs that can be malformed are validated and return Result<T>.
 *
 * Reference: BUILD.md §5.7, §7.1, SYSTEM.md §5, DECISIONS.md D-4.1, D-4.4.
 */

import { type Result, ok, fail, DomainErrorCode } from "./result";

const DECIMAL_REGEX = /^-?\d+(\.\d+)?$/;

/**
 * Validates a decimal string and returns it parsed as a finite number.
 * Fails with VALIDATION_FAILED on a malformed, empty, or non-finite string.
 */
export function parseDecimal(value: string): Result<number> {
  if (
    typeof value !== "string" ||
    value.trim() === "" ||
    !DECIMAL_REGEX.test(value.trim())
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Value '${value}' is not a valid decimal string`
    );
  }

  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Value '${value}' parsed to a non-finite number`
    );
  }

  return ok(parsed);
}

/**
 * Rounds a finite numeric value to two decimal places using standard half-up rounding
 * and returns it as a two-decimal string.
 *
 * Protects against binary floating-point representation inaccuracies
 * (such as 10.989999999999998 or 0.30000000000000004) by scaling via exponential notation.
 */
export function roundToTwoDecimals(value: number): string {
  if (!Number.isFinite(value) || value === 0) {
    return "0.00";
  }

  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  const rounded = Math.round(Number(abs + "e+2"));
  const res = sign * Number(rounded + "e-2");

  if (Object.is(res, -0) || res === 0) {
    return "0.00";
  }

  return res.toFixed(2);
}

/**
 * Adds two decimal strings and returns the result as a two-decimal string.
 * Uses parseDecimal and roundToTwoDecimals.
 */
export function addDecimal(a: string, b: string): string {
  const parsedA = parseDecimal(a);
  const parsedB = parseDecimal(b);
  const valA = parsedA.ok ? parsedA.value : 0;
  const valB = parsedB.ok ? parsedB.value : 0;
  return roundToTwoDecimals(valA + valB);
}

/**
 * Multiplies a decimal string by a factor (e.g. integer quantity) and returns
 * the result as a two-decimal string.
 */
export function multiplyDecimal(value: string, factor: number): string {
  const parsed = parseDecimal(value);
  const val = parsed.ok ? parsed.value : 0;
  return roundToTwoDecimals(val * factor);
}

