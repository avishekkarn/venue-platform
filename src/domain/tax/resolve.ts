/**
 * Pure domain functions for hierarchical tax rate resolution and arithmetic.
 *
 * Rules:
 * - Pure domain function: zero database, zero framework imports, zero side effects (BUILD.md §5.4).
 * - Implements D-4.13 three-tier tax hierarchy: Item Override > Category Override > Venue Default > Venue Fallback.
 * - String decimal arithmetic, half-up rounding to two decimals.
 * - Handles both tax-exclusive and tax-inclusive rates (D-4.13).
 *
 * Reference: DECISIONS.md D-4.1, D-4.4, D-4.13, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";

export interface ResolvedTaxRate {
  readonly id: string | null;
  readonly name: string;
  readonly rate: string; // Decimal string (e.g. "0.1300", "0.2000")
  readonly isInclusive: boolean;
  readonly source: "ITEM" | "CATEGORY" | "VENUE_DEFAULT" | "VENUE_FALLBACK";
}

export interface TaxRateEntity {
  readonly id: string;
  readonly name: string;
  readonly rate: string;
  readonly isInclusive?: boolean;
  readonly isActive?: boolean;
}

export interface ResolveTaxInput {
  readonly item?: {
    readonly taxRateId?: string | null;
    readonly taxRate?: TaxRateEntity | null;
  } | null;
  readonly category?: {
    readonly taxRateId?: string | null;
    readonly taxRate?: TaxRateEntity | null;
  } | null;
  readonly venue: {
    readonly taxRate: string; // e.g. "0.1300"
    readonly defaultTaxRate?: TaxRateEntity | null;
  };
  readonly taxRatesMap?: Record<string, TaxRateEntity>;
}

/**
 * Resolves the effective tax rate for an order line item following the 3-tier hierarchy:
 * 1. Item-level override (if set, active, and resolved)
 * 2. Category-level override (if set, active, and resolved)
 * 3. Venue default rate (if set, active, and resolved)
 * 4. Venue baseline rate (fallback)
 */
export function resolveEffectiveTaxRate(input: ResolveTaxInput): ResolvedTaxRate {
  const rates = input.taxRatesMap ?? {};

  // 1. Item-level override
  const itemRate = input.item?.taxRate ?? (input.item?.taxRateId ? rates[input.item.taxRateId] : null);
  if (itemRate && itemRate.isActive !== false) {
    return {
      id: itemRate.id,
      name: itemRate.name,
      rate: itemRate.rate,
      isInclusive: !!itemRate.isInclusive,
      source: "ITEM",
    };
  }

  // 2. Category-level override
  const catRate = input.category?.taxRate ?? (input.category?.taxRateId ? rates[input.category.taxRateId] : null);
  if (catRate && catRate.isActive !== false) {
    return {
      id: catRate.id,
      name: catRate.name,
      rate: catRate.rate,
      isInclusive: !!catRate.isInclusive,
      source: "CATEGORY",
    };
  }

  // 3. Venue default rate
  const venueDefault = input.venue.defaultTaxRate;
  if (venueDefault && venueDefault.isActive !== false) {
    return {
      id: venueDefault.id,
      name: venueDefault.name,
      rate: venueDefault.rate,
      isInclusive: !!venueDefault.isInclusive,
      source: "VENUE_DEFAULT",
    };
  }

  // 4. Venue baseline fallback
  return {
    id: null,
    name: "Standard Tax",
    rate: input.venue.taxRate,
    isInclusive: false,
    source: "VENUE_FALLBACK",
  };
}

/**
 * Computes tax amount for a given line total and tax rate.
 * - Tax-exclusive: taxAmount = lineTotal * rate
 * - Tax-inclusive: taxAmount = lineTotal - (lineTotal / (1 + rate))
 * All rounding is half-up to two decimal places.
 */
export function computeTaxForLine(
  lineTotal: string,
  rateStr: string,
  isInclusive: boolean = false
): Result<{ taxAmount: string; netSubtotal: string; grossTotal: string }> {
  const lineResult = parseDecimal(lineTotal);
  if (!lineResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Invalid line total: ${lineTotal}`
    );
  }
  if (lineResult.value < 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Line total cannot be negative: ${lineTotal}`
    );
  }

  const rateResult = parseDecimal(rateStr);
  if (!rateResult.ok) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Invalid tax rate: ${rateStr}`
    );
  }
  if (rateResult.value < 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Tax rate cannot be negative: ${rateStr}`
    );
  }

  const amount = lineResult.value;
  const rate = rateResult.value;

  if (isInclusive) {
    // Inclusive: amount includes tax
    const net = amount / (1 + rate);
    const tax = amount - net;
    const roundedTax = roundToTwoDecimals(tax);
    const roundedNet = roundToTwoDecimals(net);
    const roundedGross = roundToTwoDecimals(amount);
    return ok({
      taxAmount: roundedTax,
      netSubtotal: roundedNet,
      grossTotal: roundedGross,
    });
  } else {
    // Exclusive: amount is net, tax is added
    const tax = amount * rate;
    const roundedTax = roundToTwoDecimals(tax);
    const gross = amount + tax;
    return ok({
      taxAmount: roundedTax,
      netSubtotal: roundToTwoDecimals(amount),
      grossTotal: roundToTwoDecimals(gross),
    });
  }
}
