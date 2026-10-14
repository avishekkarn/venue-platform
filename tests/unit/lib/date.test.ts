import { describe, expect, it } from "vitest";
import { formatDateTime, formatElapsed, formatTime } from "@/lib/date";

/**
 * Unit tests for the date and time display helpers.
 *
 * Timezone-independence note:
 *
 * Intl.DateTimeFormat renders in the runtime's *local* timezone by default.
 * A fixed UTC instant therefore renders a different clock time on a machine
 * in UTC+5:30 than on a machine in UTC. These tests must pass on the
 * developer's machine, on a future CI machine, and on any future developer's
 * machine, so the tests cannot assert a specific local clock value for an
 * instant whose local rendering depends on where the test runs.
 *
 * Instead, the formatTime and formatDateTime tests assert:
 *   - the *shape* of the output (minute digits present, AM/PM present for
 *     en-US, absent for en-GB),
 *   - the *presence* of the year and the correct month abbreviation, which
 *     are stable across timezones for the fixed test instants because the
 *     timezone offset does not cross a month or year boundary,
 *   - the *absence* of the date in formatTime's output.
 *
 * The formatElapsed tests use exact-string assertions with fixed UTC
 * instants, because formatElapsed does not call Intl and does not depend on
 * the runtime's timezone. Every input is a UTC instant, the difference is
 * computed directly, and the output is deterministic.
 *
 * The single assertion that catches the most common real bug in date code —
 * the off-by-one on the month index — remains an exact assertion on the
 * month abbreviation. It is timezone-independent, and it is the assertion
 * that matters most.
 *
 * Reference: BUILD.md §2.5, §8.2, ROADMAP.md §4 Milestone 1.4.
 */
describe("formatTime", () => {
  it("formats an instant with a 12-hour clock in en-US", () => {
    const ts = new Date("2026-10-14T19:45:00Z");
    // Shape only: one or two hour digits, a colon, two minute digits, and
    // an AM/PM marker. en-US always uses the 12-hour clock.
    const result = formatTime(ts, "en-US");
    expect(result).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/);
  });

  it("formats an instant with a 24-hour clock in en-GB", () => {
    const ts = new Date("2026-10-14T19:45:00Z");
    // Shape only: one or two hour digits, a colon, two minute digits. No
    // AM/PM marker. en-GB uses the 24-hour clock, and with hour:"numeric"
    // the hour is not zero-padded (so "1:15" is a valid en-GB rendering).
    const result = formatTime(ts, "en-GB");
    expect(result).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it("does not include the date", () => {
    const ts = new Date("2026-10-14T19:45:00Z");
    // This is what makes formatTime different from formatDateTime, and it
    // is the whole reason both exist. The year must not appear.
    expect(formatTime(ts, "en-US")).not.toMatch(/2026/);
  });
});

describe("formatDateTime", () => {
  it("includes the year, month, day, and time in en-US", () => {
    const ts = new Date("2026-10-14T19:45:00Z");
    const result = formatDateTime(ts, "en-US");
    // The year and the month abbreviation are stable across timezones for
    // this instant (the offset from UTC does not push it into a different
    // year or month). The minutes are asserted as two digits, not as a
    // specific value, because the value depends on the machine's timezone.
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/:\d{2}/);
    expect(result).toMatch(/Oct/);
  });

  it("includes the year, month, day, and time in en-GB", () => {
    const ts = new Date("2026-10-14T19:45:00Z");
    const result = formatDateTime(ts, "en-GB");
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/:\d{2}/);
    expect(result).toMatch(/Oct/);
  });

  it("renders a different month correctly (no off-by-one)", () => {
    // March is month index 2. A naive implementation using getMonth() and
    // forgetting the 0-based index would render this as February. This is
    // the assertion that catches the most common real bug in date code, and
    // it is timezone-independent.
    const ts = new Date("2026-03-15T12:00:00Z");
    const result = formatDateTime(ts, "en-US");
    expect(result).toMatch(/Mar/);
    expect(result).not.toMatch(/Feb/);
  });
});

describe("formatElapsed", () => {
  it("returns '<1m' for a zero interval", () => {
    const ts = new Date("2026-10-14T19:45:00Z");
    expect(formatElapsed(ts, ts)).toBe("<1m");
  });

  it("returns '<1m' for less than one minute", () => {
    const from = new Date("2026-10-14T19:45:00Z");
    const to = new Date("2026-10-14T19:45:59Z");
    expect(formatElapsed(from, to)).toBe("<1m");
  });

  it("returns '1m' at exactly one minute", () => {
    const from = new Date("2026-10-14T19:45:00Z");
    const to = new Date("2026-10-14T19:46:00Z");
    expect(formatElapsed(from, to)).toBe("1m");
  });

  it("returns '59m' at fifty-nine minutes", () => {
    const from = new Date("2026-10-14T19:45:00Z");
    const to = new Date("2026-10-14T20:44:00Z");
    expect(formatElapsed(from, to)).toBe("59m");
  });

  it("returns '1h 0m' at exactly one hour", () => {
    const from = new Date("2026-10-14T19:45:00Z");
    const to = new Date("2026-10-14T20:45:00Z");
    expect(formatElapsed(from, to)).toBe("1h 0m");
  });

  it("returns '1h 12m' at one hour twelve minutes", () => {
    const from = new Date("2026-10-14T19:45:00Z");
    const to = new Date("2026-10-14T20:57:00Z");
    expect(formatElapsed(from, to)).toBe("1h 12m");
  });

  it("returns '2h 30m' at two hours thirty minutes", () => {
    const from = new Date("2026-10-14T19:45:00Z");
    const to = new Date("2026-10-14T22:15:00Z");
    expect(formatElapsed(from, to)).toBe("2h 30m");
  });

  it("returns '<1m' for a negative interval (defensive)", () => {
    // A "to" earlier than "from" is clock skew or misordered arguments.
    // A ticket must never render "-3m".
    const from = new Date("2026-10-14T19:48:00Z");
    const to = new Date("2026-10-14T19:45:00Z");
    expect(formatElapsed(from, to)).toBe("<1m");
  });
});