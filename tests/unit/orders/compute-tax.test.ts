import { describe, expect, it } from "vitest";
import { computeTax, computeTotal } from "@/domain/orders/compute-tax";
import { DomainErrorCode } from "@/domain/shared/result";

describe("computeTax and computeTotal domain arithmetic", () => {
  describe("computeTax", () => {
    it("computes tax with a standard whole percentage rate", () => {
      // 10% on $100.00 = $10.00
      const result = computeTax("100.00", "0.10");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("10.00");
    });

    it("computes tax with a fractional rate", () => {
      // 13% on $47.00 = $6.11
      const result = computeTax("47.00", "0.13");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("6.11");
    });

    it("computes tax with four-decimal venue tax rate and half-up rounding", () => {
      // 8.25% (0.0825) on $47.00 = 3.8775 -> half-up rounds to $3.88
      const result = computeTax("47.00", "0.0825");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("3.88");
    });

    it("computes tax with a zero tax rate", () => {
      const result = computeTax("47.00", "0.00");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("0.00");
    });

    it("computes tax with a zero subtotal", () => {
      const result = computeTax("0.00", "0.0825");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("0.00");
    });

    it("performs exact half-up rounding boundary tests", () => {
      // 100 * 0.10005 = 10.005 -> 10.01
      const rUp = computeTax("100.00", "0.10005");
      expect(rUp.ok).toBe(true);
      if (rUp.ok) expect(rUp.value).toBe("10.01");

      // 100 * 0.10004 = 10.004 -> 10.00
      const rDown = computeTax("100.00", "0.10004");
      expect(rDown.ok).toBe(true);
      if (rDown.ok) expect(rDown.value).toBe("10.00");
    });

    it("fails with VALIDATION_FAILED on a malformed subtotal", () => {
      const r1 = computeTax("invalid", "0.0825");
      expect(r1.ok).toBe(false);
      if (r1.ok) return;
      expect(r1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      const r2 = computeTax("", "0.0825");
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on a negative subtotal", () => {
      const result = computeTax("-47.00", "0.0825");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on a malformed tax rate", () => {
      const result = computeTax("47.00", "not-a-rate");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on a negative tax rate", () => {
      const result = computeTax("47.00", "-0.05");
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  describe("computeTotal", () => {
    it("computes total = subtotal + taxAmount", () => {
      // $47.00 + $3.88 = $50.88
      const result = computeTotal("47.00", "3.88");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("50.88");
    });

    it("computes total with zero tax", () => {
      const result = computeTotal("47.00", "0.00");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("47.00");
    });

    it("prevents floating-point addition artefacts", () => {
      // 0.10 + 0.20 = 0.30
      const result = computeTotal("0.10", "0.20");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("0.30");
    });

    it("computes second verified fixture from Task 2.2.9 integration suite", () => {
      // Subtotal $35.50 + Tax $3.55 = Total $39.05
      const result = computeTotal("35.50", "3.55");
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBe("39.05");
    });

    it("fails with VALIDATION_FAILED on malformed subtotal or taxAmount", () => {
      const r1 = computeTotal("bad", "3.88");
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      const r2 = computeTotal("47.00", "bad");
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });

    it("fails with VALIDATION_FAILED on negative subtotal or taxAmount", () => {
      const r1 = computeTotal("-47.00", "3.88");
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      const r2 = computeTotal("47.00", "-3.88");
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });
});

