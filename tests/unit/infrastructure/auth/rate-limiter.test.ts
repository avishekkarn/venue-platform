import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  resetRateLimiter,
  RATE_LIMIT_MAX_ATTEMPTS,
  RATE_LIMIT_WINDOW_MS,
} from "@/infrastructure/auth/rate-limiter";

/**
 * Unit tests for the login rate limiter (Phase 7.7.5a).
 *
 * The limiter is the read-only check + the two mutators. The six tests
 * prove: (1) a fresh IP is allowed, (2) the limit trips on the (N+1)th
 * check after N failures, (3) a success clears the bucket, (4) the fixed
 * window expires, (5) resetRateLimiter clears all state, (6) two IPs are
 * independent. Tests 2 and 4 mock Date.now() to control the window.
 *
 * Reference: ROADMAP.md §11 (Tasks 7.7.5, 7.7.5a), BUILD.md §8.8.
 */
describe("Login rate limiter", () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-14T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimiter();
  });

  it("allows a fresh IP with no recorded failures", () => {
    expect(checkRateLimit("10.0.0.1")).toEqual({ allowed: true });
  });

  it("trips after RATE_LIMIT_MAX_ATTEMPTS failures and reports a positive retryAfterMs", () => {
    const ip = "10.0.0.2";
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailedAttempt(ip);
    }
    // The Nth failure is still allowed by the check (the route counts it
    // as a 401; the check is what the NEXT request sees).
    // The (N+1)th check — the next request — is refused.
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    if (result.allowed) {
      throw new Error("expected not allowed");
    }
    expect(result.retryAfterMs).toBeGreaterThan(0);
    expect(result.retryAfterMs).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_MS);
  });

  it("clears the bucket on a successful login", () => {
    const ip = "10.0.0.3";
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailedAttempt(ip);
    }
    expect(checkRateLimit(ip).allowed).toBe(false);
    clearFailedAttempts(ip);
    expect(checkRateLimit(ip)).toEqual({ allowed: true });
  });

  it("expires the fixed window after RATE_LIMIT_WINDOW_MS", () => {
    const ip = "10.0.0.4";
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailedAttempt(ip);
    }
    expect(checkRateLimit(ip).allowed).toBe(false);
    // Advance the mocked clock past the window.
    vi.setSystemTime(new Date(Date.now() + RATE_LIMIT_WINDOW_MS + 1));
    expect(checkRateLimit(ip)).toEqual({ allowed: true });
  });

  it("resetRateLimiter clears all state", () => {
    recordFailedAttempt("10.0.0.5");
    recordFailedAttempt("10.0.0.5");
    recordFailedAttempt("10.0.0.6");
    resetRateLimiter();
    expect(checkRateLimit("10.0.0.5")).toEqual({ allowed: true });
    expect(checkRateLimit("10.0.0.6")).toEqual({ allowed: true });
  });

  it("keeps two IPs independent — one hitting the limit does not affect the other", () => {
    const limited = "10.0.0.7";
    const other = "10.0.0.8";
    for (let i = 0; i < RATE_LIMIT_MAX_ATTEMPTS; i++) {
      recordFailedAttempt(limited);
    }
    expect(checkRateLimit(limited).allowed).toBe(false);
    expect(checkRateLimit(other)).toEqual({ allowed: true });
  });
});
