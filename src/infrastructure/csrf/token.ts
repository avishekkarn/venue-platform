/**
 * CSRF token helpers.
 *
 * A CSRF token is an opaque random UUID (122 bits of entropy). It is
 * compared to the cookie's value with a constant-time comparison so a
 * timing attack cannot reveal any information about the expected token.
 *
 * Reference: DECISIONS.md D-20.1, BUILD.md §7.4.
 */

import { randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Generates a new CSRF token. A UUID has 122 bits of entropy; guessing it
 * by brute force is infeasible.
 */
export function generateCsrfToken(): string {
  return randomUUID();
}

/**
 * Compares two CSRF tokens in constant time.
 *
 * `crypto.timingSafeEqual` requires both buffers to be the same length and
 * throws otherwise. Two unequal-length strings cannot be a valid match
 * (the token is always a UUID's 36 characters), so an early return on
 * length mismatch is safe — it leaks only that the token is not a UUID,
 * which is not secret.
 *
 * A null or non-string argument returns false. The caller is expected to
 * have already validated the type, but the function is defensive so a
 * malformed header or cookie cannot produce a 500 at this layer.
 */
export function safeCompareCsrfTokens(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length === 0 || b.length === 0) return false;
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}
