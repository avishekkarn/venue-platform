import { describe, it, expect } from "vitest";
import {
  validateRegionalUpdate,
  validateContactUpdate,
  validateCreateTaxRate,
  validateUpdateTaxRate,
} from "@/domain/settings";

describe("Settings Domain Functions (Milestone 8.8)", () => {
  describe("validateRegionalUpdate (D-11.6)", () => {
    it("allows currency change when venue has zero orders", () => {
      const res = validateRegionalUpdate(
        { currency: "NPR" },
        { currency: "USD", hasOrders: false }
      );
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.currency).toBe("NPR");
      }
    });

    it("rejects currency change when venue has existing orders", () => {
      const res = validateRegionalUpdate(
        { currency: "NPR" },
        { currency: "USD", hasOrders: true }
      );
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.error.message).toContain("Currency is locked after the first order");
      }
    });

    it("allows passing the same currency even when orders exist", () => {
      const res = validateRegionalUpdate(
        { currency: "USD" },
        { currency: "USD", hasOrders: true }
      );
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.currency).toBe("USD");
      }
    });

    it("validates valid IANA timezone and rejects invalid", () => {
      expect(
        validateRegionalUpdate({ timezone: "Asia/Kathmandu" }, { currency: "USD", hasOrders: true }).ok
      ).toBe(true);
      expect(
        validateRegionalUpdate({ timezone: "Invalid/Fake_Zone" }, { currency: "USD", hasOrders: true }).ok
      ).toBe(false);
    });

    it("validates time format (12h or 24h)", () => {
      expect(
        validateRegionalUpdate({ timeFormat: "24h" }, { currency: "USD", hasOrders: true }).ok
      ).toBe(true);
      expect(
        validateRegionalUpdate(
          { timeFormat: "48h" as unknown as "12h" },
          { currency: "USD", hasOrders: true }
        ).ok
      ).toBe(false);
    });
  });

  describe("validateContactUpdate (D-9.16, D-9.18)", () => {
    it("sanitizes and validates contact fields", () => {
      const res = validateContactUpdate({
        contactName: "  Alice Host  ",
        contactPhone: " +977-9801234567 ",
        contactEmail: " Alice@Venue.com ",
        counterPhone: " +977-61-12345 ",
        receiptHeader: "  Juniper House · PAN: 601234567  ",
        receiptFooter: "  Thank you!  ",
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.contactName).toBe("Alice Host");
        expect(res.value.contactPhone).toBe("+977-9801234567");
        expect(res.value.contactEmail).toBe("alice@venue.com");
        expect(res.value.counterPhone).toBe("+977-61-12345");
        expect(res.value.receiptHeader).toBe("Juniper House · PAN: 601234567");
        expect(res.value.receiptFooter).toBe("Thank you!");
      }
    });

    it("rejects invalid email formats", () => {
      const res = validateContactUpdate({
        contactEmail: "invalid-email-string",
      });
      expect(res.ok).toBe(false);
    });
  });

  describe("validateCreateTaxRate (D-4.13)", () => {
    it("validates valid tax rate creation", () => {
      const res = validateCreateTaxRate({
        venueId: "v-123",
        name: "Standard VAT",
        rate: "0.1300",
        isDefault: true,
        isInclusive: false,
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.rate).toBe("0.1300");
        expect(res.value.isDefault).toBe(true);
      }
    });

    it("rejects negative or > 100% rates", () => {
      expect(
        validateCreateTaxRate({ venueId: "v-1", name: "Bad", rate: "-0.05" }).ok
      ).toBe(false);
      expect(
        validateCreateTaxRate({ venueId: "v-1", name: "Bad", rate: "1.50" }).ok
      ).toBe(false);
    });
  });

  describe("validateUpdateTaxRate (D-4.13)", () => {
    it("allows updating name, default status, and active status", () => {
      const res = validateUpdateTaxRate({
        name: "Updated VAT",
        isActive: false,
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.name).toBe("Updated VAT");
        expect(res.value.isActive).toBe(false);
      }
    });
  });
});
