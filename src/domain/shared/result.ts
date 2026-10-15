/**
 * The Result contract for domain operations.
 *
 * Every public function in the domain layer that can fail for a business
 * reason returns a Result<T>. The Result<T> is the domain's way of saying
 * "this worked" or "this failed for a known reason" without throwing an
 * exception.
 *
 * Rules:
 * 1. Expected business failures are returned, not thrown.
 * 2. null is never returned to signal failure. Use fail.
 * 3. Only true programming errors (null dereference, invariant violation) may throw.
 * 4. Database errors are wrapped into DomainError at the infrastructure boundary,
 *    never leaked upward as database types.
 * 5. API routes translate a failed Result into the correct HTTP status.
 *
 * Reference: SYSTEM.md §5 (The Result Contract).
 */

export enum DomainErrorCode {
  NOT_FOUND = "NOT_FOUND", // 404
  UNAUTHORIZED = "UNAUTHORIZED", // 401
  FORBIDDEN = "FORBIDDEN", // 403
  VALIDATION_FAILED = "VALIDATION_FAILED", // 400
  CONFLICT = "CONFLICT", // 409
  INVALID_STATE = "INVALID_STATE", // 409 (state machine violation)
  RATE_LIMITED = "RATE_LIMITED", // 429
  INTERNAL = "INTERNAL", // 500 (programming error / infrastructure failure)
}

export interface DomainError {
  code: DomainErrorCode;
  message: string; // safe to show to a human
}

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = (code: DomainErrorCode, message: string): Result<never> => ({
  ok: false,
  error: { code, message },
});
