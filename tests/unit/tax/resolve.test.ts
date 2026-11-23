import { describe, it, expect } from "vitest";
import {
  resolveEffectiveTaxRate,
  computeTaxForLine,
  type TaxRateEntity,
} from "@/domain/tax/resolve";

describe("Tax Resolution Domain (D-4.13)", () => {
  const standardVat: TaxRateEntity = {
    id: "rate-standard",
    name: "Standard VAT",
    rate: "0.1300",
    isInclusive: false,
    isActive: true,
  };

  const alcoholExcise: TaxRateEntity = {
    id: "rate-alcohol",
    name: "Alcohol Excise",
    rate: "0.2000",
    isInclusive: false,
    isActive: true,
  };

  const exemptRate: TaxRateEntity = {
    id: "rate-exempt",
    name: "Tax Exempt",
    rate: "0.0000",
    isInclusive: false,
    isActive: true,
  };

  const inactiveRate: TaxRateEntity = {
    id: "rate-inactive",
    name: "Old Rate",
    rate: "0.1500",
    isInclusive: false,
    isActive: false,
  };

  const ratesMap: Record<string, TaxRateEntity> = {
    [standardVat.id]: standardVat,
    [alcoholExcise.id]: alcoholExcise,
    [exemptRate.id]: exemptRate,
    [inactiveRate.id]: inactiveRate,
  };

  it("tier 1: resolves item-level override when set and active", () => {
    const resolved = resolveEffectiveTaxRate({
      item: { taxRateId: alcoholExcise.id },
      category: { taxRateId: standardVat.id },
      venue: { taxRate: "0.1000", defaultTaxRate: standardVat },
      taxRatesMap: ratesMap,
    });

    expect(resolved.source).toBe("ITEM");
    expect(resolved.id).toBe(alcoholExcise.id);
    expect(resolved.name).toBe("Alcohol Excise");
    expect(resolved.rate).toBe("0.2000");
  });

  it("tier 2: resolves category-level override when item has no override", () => {
    const resolved = resolveEffectiveTaxRate({
      item: { taxRateId: null },
      category: { taxRateId: alcoholExcise.id },
      venue: { taxRate: "0.1000", defaultTaxRate: standardVat },
      taxRatesMap: ratesMap,
    });

    expect(resolved.source).toBe("CATEGORY");
    expect(resolved.id).toBe(alcoholExcise.id);
    expect(resolved.rate).toBe("0.2000");
  });

  it("tier 3: resolves venue default tax rate when item and category have no override", () => {
    const resolved = resolveEffectiveTaxRate({
      item: { taxRateId: null },
      category: { taxRateId: null },
      venue: { taxRate: "0.1000", defaultTaxRate: standardVat },
      taxRatesMap: ratesMap,
    });

    expect(resolved.source).toBe("VENUE_DEFAULT");
    expect(resolved.id).toBe(standardVat.id);
    expect(resolved.rate).toBe("0.1300");
  });

  it("tier 4: falls back to venue baseline rate when no default TaxRate entity exists", () => {
    const resolved = resolveEffectiveTaxRate({
      item: null,
      category: null,
      venue: { taxRate: "0.1000", defaultTaxRate: null },
      taxRatesMap: ratesMap,
    });

    expect(resolved.source).toBe("VENUE_FALLBACK");
    expect(resolved.id).toBeNull();
    expect(resolved.rate).toBe("0.1000");
  });

  it("skips inactive tax rate and falls through to next tier", () => {
    const resolved = resolveEffectiveTaxRate({
      item: { taxRateId: inactiveRate.id },
      category: { taxRateId: alcoholExcise.id },
      venue: { taxRate: "0.1000", defaultTaxRate: standardVat },
      taxRatesMap: ratesMap,
    });

    // Skips inactive item rate and picks category
    expect(resolved.source).toBe("CATEGORY");
    expect(resolved.id).toBe(alcoholExcise.id);
  });

  describe("computeTaxForLine", () => {
    it("computes exclusive tax correctly", () => {
      // 100 * 0.13 = 13 tax, net 100, gross 113
      const res = computeTaxForLine("100.00", "0.1300", false);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.taxAmount).toBe("13.00");
      expect(res.value.netSubtotal).toBe("100.00");
      expect(res.value.grossTotal).toBe("113.00");
    });

    it("computes inclusive tax correctly", () => {
      // Gross 113 with 13% tax -> Net 100.00, Tax 13.00
      const res = computeTaxForLine("113.00", "0.1300", true);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.grossTotal).toBe("113.00");
      expect(res.value.netSubtotal).toBe("100.00");
      expect(res.value.taxAmount).toBe("13.00");
    });

    it("rejects invalid or negative values", () => {
      expect(computeTaxForLine("-10.00", "0.1300").ok).toBe(false);
      expect(computeTaxForLine("100.00", "-0.1300").ok).toBe(false);
      expect(computeTaxForLine("abc", "0.1300").ok).toBe(false);
      expect(computeTaxForLine("100.00", "xyz").ok).toBe(false);
    });
  });
});
