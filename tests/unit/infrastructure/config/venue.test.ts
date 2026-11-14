import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getVenueSlug } from "@/infrastructure/config/venue";

/**
 * Unit tests for `getVenueSlug()` (W-0027, Task 8.1.1).
 *
 * Two cases prove the two branches of the contract:
 *   1. throws when VENUE_SLUG is unset (or empty)
 *   2. returns the value when VENUE_SLUG is set
 *
 * `vi.stubEnv` isolates the variable per test; `vi.unstubAllEnvs()`
 * restores it after. The test never relies on the developer's real
 * `.env.local` value.
 */
describe("getVenueSlug", () => {
  beforeEach(() => {
    vi.stubEnv("VENUE_SLUG", "");
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when VENUE_SLUG is unset", () => {
    vi.stubEnv("VENUE_SLUG", undefined);
    expect(() => getVenueSlug()).toThrow(/VENUE_SLUG is not set/);
  });

  it("throws when VENUE_SLUG is empty", () => {
    vi.stubEnv("VENUE_SLUG", "");
    expect(() => getVenueSlug()).toThrow(/VENUE_SLUG is not set/);
  });

  it("returns the value when VENUE_SLUG is set", () => {
    vi.stubEnv("VENUE_SLUG", "juniper-house");
    expect(getVenueSlug()).toBe("juniper-house");
  });
});
