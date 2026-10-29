import { describe, expect, it } from "vitest";
import { computeLineTotal, computeSubtotal } from "@/domain/orders/compute-price";
import {
  parseDecimal,
  roundToTwoDecimals,
  addDecimal,
  multiplyDecimal,
} from "@/domain/shared/money";
import { DomainErrorCode } from "@/domain/shared/result";

describe("computePrice domain arithmetic", () => {
  describe("computeLineTotal", () => {
    it("computes line total for a single item with no modifiers and quantity 1", () => {
      const result = computeLineTotal("12.50", [], 1);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("12.50");
    });

    it("computes line total for an item with multiple modifiers and quantity 1", () => {
      // Item: $18.50, Modifiers: $2.00, $0.75, $1.25 -> sum = $22.50
      const result = computeLineTotal("18.50", ["2.00", "0.75", "1.25"], 1);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("22.50");
    });

    it("computes line total with quantity greater than 1", () => {
      // (18.50 + 2.00) * 2 = 41.00
      const result = computeLineTotal("18.50", ["2.00"], 2);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("41.00");
    });

    it("formats output to exact two decimal places even with whole numbers or 1 decimal", () => {
      const result = computeLineTotal("10", ["2.5"], 2);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("25.00");
    });

    it("prevents binary floating-point representation artefacts", () => {
      // 0.10 + 0.20 naive float in JS is 0.30000000000000004
      const result1 = computeLineTotal("0.10", ["0.20"], 1);
      expect(result1.ok).toBe(true);
      if (!result1.ok) return;
      expect(result1.value).toBe("0.30");

      // Multiple additions that could trigger float drift
      const result2 = computeLineTotal("10.98", ["0.01"], 1);
      expect(result2.ok).toBe(true);
      if (!result2.ok) return;
      expect(result2.value).toBe("10.99");
    });

    it("fails with VALIDATION_FAILED on a malformed item price", () => {
      const r1 = computeLineTotal("invalid", [], 1);
      expect(r1.ok).toBe(false);
      if (r1.ok) return;
      expect(r1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      const r2 = computeLineTotal("", [], 1);
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on a negative item price", () => {
      const result = computeLineTotal("-5.00", [], 1);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on a malformed modifier price", () => {
      const result = computeLineTotal("10.00", ["1.50", "abc"], 1);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on a negative modifier price", () => {
      const result = computeLineTotal("10.00", ["-1.50"], 1);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on non-positive or non-integer quantities", () => {
      const rZero = computeLineTotal("10.00", [], 0);
      expect(rZero.ok).toBe(false);
      if (!rZero.ok) expect(rZero.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      const rNeg = computeLineTotal("10.00", [], -2);
      expect(rNeg.ok).toBe(false);
      if (!rNeg.ok) expect(rNeg.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      const rFloat = computeLineTotal("10.00", [], 1.5);
      expect(rFloat.ok).toBe(false);
      if (!rFloat.ok) expect(rFloat.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  describe("computeSubtotal", () => {
    it("returns '0.00' for an empty line-total list", () => {
      const result = computeSubtotal([]);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("0.00");
    });

    it("sums multiple line totals into an exact two-decimal subtotal", () => {
      // 41.00 + 6.00 = 47.00
      const result = computeSubtotal(["41.00", "6.00"]);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("47.00");
    });

    it("sums larger arrays of line totals without float drift", () => {
      const result = computeSubtotal(["12.50", "8.25", "19.99", "4.50"]);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      // 12.50 + 8.25 = 20.75 + 19.99 = 40.74 + 4.50 = 45.24
      expect(result.value).toBe("45.24");
    });

    it("fails with VALIDATION_FAILED on malformed line totals", () => {
      const result = computeSubtotal(["41.00", "not-a-price"]);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on negative line totals", () => {
      const result = computeSubtotal(["41.00", "-6.00"]);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  describe("shared money helpers", () => {
    it("parseDecimal validates and parses valid decimal strings", () => {
      expect(parseDecimal("10.99")).toEqual({ ok: true, value: 10.99 });
      expect(parseDecimal("0")).toEqual({ ok: true, value: 0 });
      expect(parseDecimal("0.0825")).toEqual({ ok: true, value: 0.0825 });
    });

    it("parseDecimal fails on invalid strings", () => {
      expect(parseDecimal("").ok).toBe(false);
      expect(parseDecimal("abc").ok).toBe(false);
      expect(parseDecimal("10.99.00").ok).toBe(false);
    });

    it("roundToTwoDecimals performs half-up rounding", () => {
      expect(roundToTwoDecimals(1.005)).toBe("1.01");
      expect(roundToTwoDecimals(1.004)).toBe("1.00");
      expect(roundToTwoDecimals(10.989999999999998)).toBe("10.99");
      expect(roundToTwoDecimals(0)).toBe("0.00");
    });

    it("addDecimal adds two strings to a two-decimal string", () => {
      expect(addDecimal("10.50", "2.75")).toBe("13.25");
      expect(addDecimal("0.1", "0.2")).toBe("0.30");
    });

    it("multiplyDecimal multiplies string by factor to a two-decimal string", () => {
      expect(multiplyDecimal("10.50", 3)).toBe("31.50");
      expect(multiplyDecimal("0.10", 3)).toBe("0.30");
    });
  });
});

