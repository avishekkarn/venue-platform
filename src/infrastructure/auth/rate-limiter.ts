/**
 * Login rate limiter (Phase 7.7.5a).
 *
 * The in-memory, per-IP limiter that protects `POST /api/auth/login` from
 * credential-guessing. The limiter is intentionally simple: a module-level
 * Map, no dependencies, no Redis, no node:crypto. It is sufficient for a
 * single-venue deployment (D-10.1); a distributed limiter is deferred to
 * W-0023.
 *
 * The contract:
 *
 *   - The limiter tracks FAILED attempts only. A successful login calls
 *     `clearFailedAttempts(ip)` and removes the IP from the map. A failed
 *     login (a 401 from the route) calls `recordFailedAttempt(ip)`.
 *     A 400 (VALIDATION_FAILED) and a 500 (INTERNAL) do NOT count — they
 *     are not credential guesses.
 *   - `checkRateLimit(ip)` is READ-ONLY. It does not mutate the map. It
 *     returns `{ allowed: true }` if the IP has fewer than LIMIT failures
 *     in the current window, or `{ allowed: false, retryAfterMs }` if it
 *     has reached the limit. The route calls it at the top of
 *     `loginHandler` and returns 429 on `!allowed`.
 *   - The window is a FIXED 15-minute window, set by the first failed
 *     attempt for the IP. A sliding window would let a spaced-out attacker
 *     never trip the limit; a fixed window is what the ROADMAP's "5
 *     attempts per 15 minutes" means.
 *   - The IP key is the string the route derives from `x-forwarded-for` /
 *     `x-real-ip`, with `"unknown"` as the fallback. `"unknown"` is a
 *     single shared bucket: if the proxy strips both headers, all
 *     proxied requests share one bucket. That is a known, documented
 *     limitation (a proxied attacker cannot bypass the limiter by
 *     stripping headers; the alternative — skipping the limiter for
 *     "unknown" — would let the attacker bypass it entirely, which is
 *     worse). A venue behind a trusted proxy sets `x-forwarded-for`,
 *     and the limiter works per-IP.
 *   - `resetRateLimiter()` clears all state. It is exported for tests:
 *     every integration test file that calls `POST /api/auth/login` calls
 *     it in `beforeEach`, the same discipline as `setTestDbClient` (D-3.13).
 *
 * Composition with `withCsrf`:
 *
 *   The login route is `export const POST = withCsrf(loginHandler)`. The
 *   CSRF check runs FIRST; the rate limiter runs INSIDE the handler, AFTER
 *   the CSRF check passes. A cross-site request without a CSRF token is
 *   rejected at 403 before the limiter is consulted. This is the correct
 *   order: the CSRF check is the cross-site defense; the rate limiter is
 *   the credential-guessing defense. They are orthogonal, and the limiter
 *   should not count a request that never reached the credential check.
 *
 * Reference: DECISIONS.md D-20.1 (CSRF), D-3.13 (test-injection discipline),
 * ROADMAP.md §11 (Tasks 7.7.5, 7.7.5a, 7.7.5b), BUILD.md §6 (API routes),
 * BUILD.md §8.8 (unit-test floor), SYSTEM.md §15 (security boundaries).
 */

/** The number of failed attempts allowed within the window. */
export const RATE_LIMIT_MAX_ATTEMPTS = 5;

/** The length of the fixed window, in milliseconds (15 minutes). */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

interface Bucket {
  count: number;
  firstAttemptAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * A read-only check. Does not mutate the map.
 *
 * Returns `{ allowed: true }` if the IP has fewer than the limit of
 * failures in the current window (including a fresh IP, an expired
 * window, and an IP that has been cleared). Returns `{ allowed: false,
 * retryAfterMs }` if the IP has reached the limit; `retryAfterMs` is the
 * time until the window expires, in milliseconds, and is at least 1.
 */
export function checkRateLimit(
  ip: string
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const bucket = buckets.get(ip);
  if (!bucket) {
    return { allowed: true };
  }
  const now = Date.now();
  const elapsed = now - bucket.firstAttemptAt;
  if (elapsed >= RATE_LIMIT_WINDOW_MS) {
    return { allowed: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const retryAfterMs = Math.max(1, RATE_LIMIT_WINDOW_MS - elapsed);
    return { allowed: false, retryAfterMs };
  }
  return { allowed: true };
}

/**
 * Records one failed attempt for the IP. Starts a new fixed window if
 * the IP has no bucket or its window has expired. If the IP has reached
 * the limit, this function still increments the count (it does not
 * refuse — the route only calls it on the 401 path, and the 429 path
 * returns before this is reached).
 */
export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const existing = buckets.get(ip);
  if (!existing || now - existing.firstAttemptAt >= RATE_LIMIT_WINDOW_MS) {
    buckets.set(ip, { count: 1, firstAttemptAt: now });
    return;
  }
  existing.count += 1;
}

/**
 * Clears the IP's bucket. Called on a successful login. The IP's next
 * failed attempt starts a fresh window.
 */
export function clearFailedAttempts(ip: string): void {
  buckets.delete(ip);
}

/**
 * Clears ALL state. Exported for tests: every integration test file that
 * calls `POST /api/auth/login` calls this in `beforeEach`.
 */
export function resetRateLimiter(): void {
  buckets.clear();
}
