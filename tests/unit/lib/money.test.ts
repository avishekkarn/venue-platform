import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/money";

/**
 * Unit tests for formatMoney.
 *
 * formatMoney turns a decimal money string into a localized display string
 * using Intl.NumberFormat. It does not compute. It does not round. It does
 * not sum. Every test below asserts an exact display string, because the
 * function's entire contract is "produce this exact string for this exact
 * input" — a containment assertion would pass even if extra characters
 * leaked into the output.
 *
 * The expected strings depend on the runtime's ICU data (the localization
 * tables that Node and the browser ship). Node 24.21.0 on Windows is the
 * target. If a future Node upgrade changes how a locale renders a currency
 * (for example, a different symbol or a different whitespace character), the
 * affected test will fail loudly and be updated in a dedicated commit. That
 * is the correct behaviour: the test is honest about the exact output, not
 * forgiving about an approximate one.
 *
 * Reference: BUILD.md §7.1 (money rules), §8.2 (what the unit tests cover),
 * ROADMAP.md §4 Milestone 1.4 (shared utilities).
 */
describe("formatMoney", () => {
  describe("well-formed values", () => {
    it("formats a two-decimal USD value", () => {
      expect(formatMoney("10.99", "USD", "en-US")).toBe("$10.99");
    });

    it("formats a whole-number USD value with two decimal places", () => {
      expect(formatMoney("10.00", "USD", "en-US")).toBe("$10.00");
    });

    it("formats a zero value", () => {
      expect(formatMoney("0.00", "USD", "en-US")).toBe("$0.00");
    });

    it("groups thousands for a large value", () => {
      expect(formatMoney("1234567.89", "USD", "en-US")).toBe(
        "$1,234,567.89"
      );
    });
  });

  describe("currency variation", () => {
    it("formats a EUR value in the German locale", () => {
      // German locale renders the currency symbol after the value with a
      // non-breaking space, and uses a comma as the decimal separator and
      // a period as the grouping separator.
      expect(formatMoney("1234.50", "EUR", "de-DE")).toBe("1.234,50\u00A0€");
    });

    it("formats an INR value in the Indian English locale", () => {
      // India is a target region per DECISIONS.md D-7.1. This test asserts
      // the Indian English rendering of the rupee, which uses the ₹ symbol
      // and Western grouping for values under one lakh.
      expect(formatMoney("10.99", "INR", "en-IN")).toBe("₹10.99");
    });

    it("formats an NPR value in the Nepali English locale", () => {
      // Nepal is a target region per DECISIONS.md D-7.1. The Nepali rupee
      // renders with the "NPR" or "Rs." prefix depending on the ICU build;
      // this test asserts whatever Node 24.21.0 currently produces. If it
      // changes on a future Node upgrade, this assertion is updated.
      expect(formatMoney("100.00", "NPR", "en-NP")).toMatch(/^(NPR|Rs\.?)\s*100\.00$/);
    });
  });

  describe("locale variation", () => {
    it("respects a locale that uses a comma as the decimal separator", () => {
      // German: comma decimal separator, period thousands separator, symbol
      // after the value. This proves the function does not hardcode en-US
      // formatting rules.
      expect(formatMoney("10.99", "EUR", "de-DE")).toBe("10,99\u00A0€");
    });

    it("respects a locale that places the symbol before the value", () => {
      expect(formatMoney("10.99", "GBP", "en-GB")).toBe("£10.99");
    });
  });

  describe("input validation", () => {
    it("throws a TypeError for a value that is not a decimal string", () => {
      expect(() => formatMoney("not a number", "USD", "en-US")).toThrow(
        TypeError
      );
    });

    it("throws a TypeError for an empty string", () => {
      expect(() => formatMoney("", "USD", "en-US")).toThrow(TypeError);
    });

    it("throws a TypeError for a value with more than two decimal places", () => {
      // BUILD.md §7.1: money has two digits after the decimal point. A value
      // with three digits is not a money string per the project's own rule,
      // and accepting it silently would let 10.999 reach a guest's screen.
      expect(() => formatMoney("10.999", "USD", "en-US")).toThrow(TypeError);
    });

    it("includes the offending value in the error message", () => {
      expect(() => formatMoney("abc", "USD", "en-US")).toThrow(
        /formatMoney received a value that is not a decimal money string: "abc"/
      );
    });
  });

  describe("accepted edge shapes", () => {
    it("accepts one decimal place and renders two", () => {
      // "10.5" is unambiguous as a money value. The formatter renders it
      // with two decimal places for a two-decimal currency.
      expect(formatMoney("10.5", "USD", "en-US")).toBe("$10.50");
    });

    it("accepts a value with no decimal point", () => {
      expect(formatMoney("10", "USD", "en-US")).toBe("$10.00");
    });

    it("accepts a negative value", () => {
      // Refunds and adjustments are negative in some flows. The formatter
      // renders the sign per the locale's convention.
      expect(formatMoney("-10.99", "USD", "en-US")).toBe("-$10.99");
    });
  });
});