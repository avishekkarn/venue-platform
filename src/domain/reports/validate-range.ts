/**
 * Report date range validator.
 * Enforces DECISIONS.md D-12.1:
 * - Date range <= 6 months (strictly 180 days).
 * - DateFrom <= DateTo.
 * - Valid YYYY-MM-DD ISO date strings.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 180;

export interface ValidatedDateRange {
  readonly fromDate: Date;
  readonly toDate: Date;
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly days: number;
}

export function validateReportDateRange(
  dateFrom: unknown,
  dateTo: unknown
): Result<ValidatedDateRange> {
  if (typeof dateFrom !== "string" || !DATE_REGEX.test(dateFrom)) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Invalid dateFrom format: expected YYYY-MM-DD, received '${String(dateFrom)}'`
    );
  }

  if (typeof dateTo !== "string" || !DATE_REGEX.test(dateTo)) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Invalid dateTo format: expected YYYY-MM-DD, received '${String(dateTo)}'`
    );
  }

  const from = new Date(`${dateFrom}T00:00:00.000Z`);
  const to = new Date(`${dateTo}T23:59:59.999Z`);

  if (isNaN(from.getTime())) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `dateFrom '${dateFrom}' is not a valid calendar date`
    );
  }

  if (isNaN(to.getTime())) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `dateTo '${dateTo}' is not a valid calendar date`
    );
  }

  if (from.getTime() > to.getTime()) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `dateFrom (${dateFrom}) must be before or equal to dateTo (${dateTo})`
    );
  }

  const diffMs = to.getTime() - from.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > MAX_RANGE_DAYS) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Date range exceeds maximum allowed window of 180 days (requested: ${diffDays} days)`
    );
  }

  return ok({
    fromDate: from,
    toDate: to,
    dateFrom,
    dateTo,
    days: diffDays,
  });
}
