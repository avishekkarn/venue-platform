/**
 * Pure domain logic for validating and updating regional parameters (D-11.6).
 *
 * Rules:
 * - Currency is editable during initial setup, but locked as IMMUTABLE after the first order (D-11.6).
 * - Timezone must be a valid IANA identifier.
 * - Time format must be "12h" | "24h".
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type UpdateRegionalInput } from "./types";

export const SUPPORTED_CURRENCIES = [
  "USD",
  "NPR",
  "EUR",
  "GBP",
  "INR",
  "AUD",
  "CAD",
  "JPY",
] as const;

export function validateRegionalUpdate(
  input: UpdateRegionalInput,
  current: { currency: string; hasOrders: boolean }
): Result<{ currency?: string; timezone?: string; timeFormat?: "12h" | "24h" }> {
  const result: { currency?: string; timezone?: string; timeFormat?: "12h" | "24h" } = {};

  if (input.currency !== undefined) {
    const cur = input.currency.trim().toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(cur as (typeof SUPPORTED_CURRENCIES)[number])) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Unsupported currency: '${input.currency}'. Supported: ${SUPPORTED_CURRENCIES.join(", ")}`
      );
    }

    if (current.hasOrders && cur !== current.currency) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Currency is locked after the first order is placed. Historical financial records cannot be mutated (D-11.6)."
      );
    }

    result.currency = cur;
  }

  if (input.timezone !== undefined) {
    const tz = input.timezone.trim();
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      result.timezone = tz;
    } catch {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Invalid IANA timezone identifier: '${input.timezone}'`
      );
    }
  }

  if (input.timeFormat !== undefined) {
    if (input.timeFormat !== "12h" && input.timeFormat !== "24h") {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Time format must be either '12h' or '24h'."
      );
    }
    result.timeFormat = input.timeFormat;
  }

  return ok(result);
}
