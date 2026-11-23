/**
 * Pure domain validation for TaxRate CRUD operations (D-4.13).
 *
 * Rules:
 * - Rates must be valid non-negative decimals <= 1.0000.
 * - Once created, a TaxRate's rate is IMMUTABLE. Editing requires deactivation and creation of a new rate.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal } from "@/domain/shared/money";
import { type CreateTaxRateInput, type UpdateTaxRateInput } from "./types";

export function validateCreateTaxRate(
  input: CreateTaxRateInput
): Result<{
  venueId: string;
  name: string;
  rate: string;
  isDefault: boolean;
  isInclusive: boolean;
}> {
  if (!input.name || !input.name.trim()) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Tax rate name is required."
    );
  }
  const name = input.name.trim();
  if (name.length > 50) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Tax rate name cannot exceed 50 characters."
    );
  }

  const rateResult = parseDecimal(input.rate);
  if (!rateResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Invalid tax rate: '${input.rate}'. Must be a valid decimal string.`
    );
  }
  if (rateResult.value < 0 || rateResult.value > 1.0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Tax rate must be between 0.0000 and 1.0000 (0% to 100%)."
    );
  }

  return ok({
    venueId: input.venueId,
    name,
    rate: rateResult.value.toFixed(4),
    isDefault: !!input.isDefault,
    isInclusive: !!input.isInclusive,
  });
}

export function validateUpdateTaxRate(
  input: UpdateTaxRateInput
): Result<{ name?: string; isDefault?: boolean; isActive?: boolean }> {
  const result: { name?: string; isDefault?: boolean; isActive?: boolean } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Tax rate name cannot be empty."
      );
    }
    if (name.length > 50) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Tax rate name cannot exceed 50 characters."
      );
    }
    result.name = name;
  }

  if (input.isDefault !== undefined) {
    result.isDefault = !!input.isDefault;
  }

  if (input.isActive !== undefined) {
    result.isActive = !!input.isActive;
  }

  return ok(result);
}
