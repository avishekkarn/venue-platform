import { describe, it, expect } from "vitest";
import {
  validateReportDateRange,
  generateRevenueSummary,
  generateItemSales,
  generateOrderFunnel,
  generateServiceRequestsReport,
  generatePlaceUtilization,
  generateQrLifecycleReport,
  generateAuditExport,
  generateHourlyHeatmap,
  generateMenuMatrix,
  generateModifierAttachReport,
  generateTaxRemittance,
  generateCancellationRootCause,
  generateServiceSla,
  generateRoomFolioReport,
  generateOccupancyDwell,
  generateQrConversionReport,
  PAYMENT_RECONCILIATION_V1_STATUS,
} from "@/domain/reports";

describe("Milestone 8.7 Task 8.7.2 — Reports Domain Calculations & Contracts", () => {
  describe("validateReportDateRange (D-12.1)", () => {
    it("accepts valid date range within 180 days", () => {
      const res = validateReportDateRange("2026-01-01", "2026-03-31");
      expect(res.ok).toBe(true);
      if (!res.ok) return;
      expect(res.value.days).toBeLessThanOrEqual(180);
      expect(res.value.dateFrom).toBe("2026-01-01");
      expect(res.value.dateTo).toBe("2026-03-31");
    });

    it("rejects date range exceeding 180 days with VALIDATION_FAILED", () => {
      const res = validateReportDateRange("2026-01-01", "2026-07-15");
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.message).toContain("180 days");
    });

    it("rejects dateFrom after dateTo", () => {
      const res = validateReportDateRange("2026-05-01", "2026-04-01");
      expect(res.ok).toBe(false);
      if (res.ok) return;
      expect(res.error.message).toContain("must be before or equal");
    });

    it("rejects malformed date strings", () => {
      expect(validateReportDateRange("invalid", "2026-04-01").ok).toBe(false);
      expect(validateReportDateRange("2026-01-01", 12345).ok).toBe(false);
    });
  });

  describe("View 1: Revenue Summary (revenue.ts)", () => {
    it("groups orders by date and place type with exact decimal arithmetic", () => {
      const orders = [
        {
          placedAt: "2026-03-15T12:00:00Z",
          placeType: "TABLE",
          subtotal: "100.00",
          taxAmount: "10.00",
          total: "110.00",
        },
        {
          placedAt: "2026-03-15T13:30:00Z",
          placeType: "TABLE",
          subtotal: "50.50",
          taxAmount: "5.05",
          total: "55.55",
        },
        {
          placedAt: "2026-03-15T14:00:00Z",
          placeType: "ROOM",
          subtotal: "200.00",
          taxAmount: "20.00",
          total: "220.00",
        },
      ];

      const res = generateRevenueSummary(orders, "NPR");
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(2);
      const tableRow = res.value.find((r) => r.placeType === "TABLE");
      expect(tableRow).toBeDefined();
      expect(tableRow?.completedOrders).toBe(2);
      expect(tableRow?.subtotal).toBe("150.50");
      expect(tableRow?.taxCollected).toBe("15.05");
      expect(tableRow?.totalRevenue).toBe("165.55");
      expect(tableRow?.currency).toBe("NPR");

      const roomRow = res.value.find((r) => r.placeType === "ROOM");
      expect(roomRow).toBeDefined();
      expect(roomRow?.completedOrders).toBe(1);
      expect(roomRow?.totalRevenue).toBe("220.00");
    });
  });

  describe("View 2: Sales by Item (sales.ts)", () => {
    it("calculates sales, base and modifier revenue, and attach rate", () => {
      const items = [
        {
          itemName: "Burger",
          categoryName: "Mains",
          quantity: 2,
          itemPrice: "15.00",
          modifierPrice: "2.00",
          lineTotal: "34.00",
          modifiersJson: [{ name: "Bacon", price: "2.00" }],
        },
        {
          itemName: "Burger",
          categoryName: "Mains",
          quantity: 1,
          itemPrice: "15.00",
          modifierPrice: "0.00",
          lineTotal: "15.00",
          modifiersJson: [],
        },
      ];

      const res = generateItemSales(items);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const burger = res.value[0];
      expect(burger?.category).toBe("Mains");
      expect(burger?.itemName).toBe("Burger");
      expect(burger?.unitsSold).toBe(3);
      expect(burger?.baseRevenue).toBe("45.00");
      expect(burger?.modifierRevenue).toBe("4.00");
      expect(burger?.lineRevenue).toBe("49.00");
      // 2 of 3 units had modifiers -> 66.7%
      expect(burger?.modifierAttachRate).toBe("66.7%");
    });
  });

  describe("View 3: Order Funnel & Latency (funnel.ts)", () => {
    it("calculates state counts and latencies across order lifecycle", () => {
      const orders = [
        {
          id: "ord-1",
          placedAt: "2026-03-10T12:00:00Z",
          state: "COMPLETED",
          stateChanges: [
            { state: "PLACED", occurredAt: "2026-03-10T12:00:00Z" },
            { state: "APPROVED", occurredAt: "2026-03-10T12:02:00Z" }, // 120s
            { state: "READY", occurredAt: "2026-03-10T12:12:00Z" },    // 600s
            { state: "COMPLETED", occurredAt: "2026-03-10T12:15:00Z" },// 180s delivery, 900s cycle
          ],
        },
      ];

      const res = generateOrderFunnel(orders);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.ordersPlaced).toBe(1);
      expect(row?.approved).toBe(1);
      expect(row?.ready).toBe(1);
      expect(row?.completed).toBe(1);
      expect(row?.avgApprovalSec).toBe(120);
      expect(row?.avgPrepSec).toBe(600);
      expect(row?.avgDeliverySec).toBe(180);
      expect(row?.avgCycleSec).toBe(900);
    });
  });

  describe("View 4: Service Requests Report (requests.ts)", () => {
    it("aggregates request volume, states, and average resolution time", () => {
      const requests = [
        {
          id: "req-1",
          serviceType: "HOUSEKEEPING",
          state: "COMPLETED",
          submittedAt: "2026-03-10T10:00:00Z",
          stateChanges: [
            { state: "SUBMITTED", occurredAt: "2026-03-10T10:00:00Z" },
            { state: "COMPLETED", occurredAt: "2026-03-10T10:20:00Z" }, // 20 min
          ],
        },
        {
          id: "req-2",
          serviceType: "HOUSEKEEPING",
          state: "DECLINED",
          submittedAt: "2026-03-10T11:00:00Z",
          stateChanges: [
            { state: "SUBMITTED", occurredAt: "2026-03-10T11:00:00Z" },
            { state: "DECLINED", occurredAt: "2026-03-10T11:10:00Z" }, // 10 min
          ],
        },
      ];

      const res = generateServiceRequestsReport(requests);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.serviceType).toBe("HOUSEKEEPING");
      expect(row?.submitted).toBe(2);
      expect(row?.completed).toBe(1);
      expect(row?.declined).toBe(1);
      expect(row?.avgResolutionMin).toBe(15); // (20 + 10) / 2
    });
  });

  describe("View 5: Place Utilization (utilization.ts)", () => {
    it("computes turns, dwell, revenue, and conversion percent", () => {
      const places = [
        {
          placeType: "TABLE",
          placeNumber: "Table 1",
          category: "Indoor",
          sessions: [
            {
              id: "s1",
              createdAt: "2026-03-10T12:00:00Z",
              endedAt: "2026-03-10T13:00:00Z", // 60 min
              hasOrders: true,
            },
            {
              id: "s2",
              createdAt: "2026-03-10T14:00:00Z",
              endedAt: "2026-03-10T14:30:00Z", // 30 min
              hasOrders: false,
            },
          ],
          orderTotals: ["45.00", "55.00"],
        },
      ];

      const res = generatePlaceUtilization(places);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.placeNumber).toBe("Table 1");
      expect(row?.sessions).toBe(2);
      expect(row?.avgDwellMin).toBe(45);
      expect(row?.orders).toBe(2);
      expect(row?.revenue).toBe("100.00");
      expect(row?.conversionPct).toBe("50.0%");
    });
  });

  describe("View 6: QR & Session Lifecycle (qr.ts)", () => {
    it("formats QR placard lifecycle status and issuance dates", () => {
      const tokens = [
        {
          tokenId: "tok-1",
          placeType: "TABLE",
          placeLabel: "Table 1",
          isRevoked: false,
          createdAt: "2026-01-01T10:00:00Z",
          revokedAt: null,
          sessionsCount: 12,
        },
        {
          tokenId: "tok-2",
          placeType: "ROOM",
          placeLabel: "Room 101",
          isRevoked: true,
          createdAt: "2026-01-01T10:00:00Z",
          revokedAt: "2026-02-01T10:00:00Z",
          sessionsCount: 4,
        },
      ];

      const res = generateQrLifecycleReport(tokens);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(2);
      const t1 = res.value.find((t) => t.tokenId === "tok-1");
      expect(t1?.status).toBe("ACTIVE");
      expect(t1?.revoked).toBe("-");
      expect(t1?.sessionsGenerated).toBe(12);

      const t2 = res.value.find((t) => t.tokenId === "tok-2");
      expect(t2?.status).toBe("REVOKED");
      expect(t2?.revoked).toContain("2026-02-01");
    });
  });

  describe("View 7: Payment Reconciliation descriptor (payment.ts)", () => {
    it("exposes INACTIVE_V1_SCOPE commentary per D-7.1 and D-7.7", () => {
      expect(PAYMENT_RECONCILIATION_V1_STATUS.status).toBe("INACTIVE_V1_SCOPE");
      expect(PAYMENT_RECONCILIATION_V1_STATUS.commentary).toContain("cash at counter");
    });
  });

  describe("View 8: Per-Record Audit Export (audit.ts)", () => {
    it("formats chronologically sorted audit records with staff attribution", () => {
      const events = [
        {
          timestamp: "2026-03-10T12:00:00Z",
          recordType: "ORDER" as const,
          entityId: "ord-1",
          targetState: "APPROVED",
          staffName: "Alice Manager",
          staffUsername: "alice",
          note: "Approved by manager",
        },
        {
          timestamp: "2026-03-10T12:05:00Z",
          recordType: "SERVICE_REQUEST" as const,
          entityId: "req-1",
          targetState: "COMPLETED",
          staffName: null,
          staffUsername: null,
          note: null,
        },
      ];

      const res = generateAuditExport(events);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(2);
      expect(res.value[0]?.recordType).toBe("SERVICE_REQUEST"); // later timestamp first
      expect(res.value[0]?.staffName).toBe("System");
      expect(res.value[0]?.staffUsername).toBe("system");

      expect(res.value[1]?.recordType).toBe("ORDER");
      expect(res.value[1]?.staffName).toBe("Alice Manager");
      expect(res.value[1]?.staffUsername).toBe("@alice");
    });
  });

  describe("View 9: Hourly Heatmap (heatmap.ts)", () => {
    it("groups orders by hour of day and aggregates revenue", () => {
      const orders = [
        { placedAt: "2026-03-10T12:15:00Z", total: "25.00" },
        { placedAt: "2026-03-10T12:45:00Z", total: "35.00" },
        { placedAt: "2026-03-10T13:00:00Z", total: "15.00" },
      ];

      const res = generateHourlyHeatmap(orders);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(2);
      const h12 = res.value.find((r) => r.hour === 12);
      expect(h12?.orders).toBe(2);
      expect(h12?.revenue).toBe("60.00");
    });
  });

  describe("View 10: Menu Engineering Matrix (matrix.ts)", () => {
    it("classifies items into Stars, Plowhorses, Puzzles, and Dogs based on medians", () => {
      const items = [
        { itemName: "Signature Steak", unitsSold: 50, lineRevenue: "1500.00" }, // High Vol, High Rev -> Star
        { itemName: "House Salad", unitsSold: 45, lineRevenue: "200.00" },      // High Vol, Low Rev -> Plowhorse
        { itemName: "Vintage Wine", unitsSold: 10, lineRevenue: "800.00" },      // Low Vol, High Rev -> Puzzle
        { itemName: "Side Bread", unitsSold: 5, lineRevenue: "25.00" },          // Low Vol, Low Rev -> Dog
      ];

      const res = generateMenuMatrix(items);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const steak = res.value.find((r) => r.itemName === "Signature Steak");
      expect(steak?.quadrant).toBe("Star");

      const salad = res.value.find((r) => r.itemName === "House Salad");
      expect(salad?.quadrant).toBe("Plowhorse");

      const wine = res.value.find((r) => r.itemName === "Vintage Wine");
      expect(wine?.quadrant).toBe("Puzzle");

      const bread = res.value.find((r) => r.itemName === "Side Bread");
      expect(bread?.quadrant).toBe("Dog");
    });
  });

  describe("View 11: Modifier Attach-Rate (modifiers.ts)", () => {
    it("calculates option selection counts and attach percentages", () => {
      const items = [
        {
          quantity: 2,
          modifiersJson: [
            { groupName: "Cheese", name: "Cheddar", price: "2.00" },
          ],
        },
        {
          quantity: 1,
          modifiersJson: [
            { groupName: "Cheese", name: "Cheddar", price: "2.00" },
            { groupName: "Sauce", name: "Garlic Mayo", price: "1.00" },
          ],
        },
      ];

      const res = generateModifierAttachReport(items, 10);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      const cheddar = res.value.find((r) => r.modifierOption === "Cheddar");
      expect(cheddar?.timesSelected).toBe(3); // 2 + 1
      expect(cheddar?.revenue).toBe("6.00");
      expect(cheddar?.attachRatePct).toBe("30.0%"); // 3 / 10
    });
  });

  describe("View 12: Tax Remittance (tax.ts)", () => {
    it("groups taxable subtotals and tax collected by period and tax rate", () => {
      const orders = [
        { placedAt: "2026-03-01T10:00:00Z", taxRate: "0.1000", subtotal: "100.00", taxAmount: "10.00" },
        { placedAt: "2026-03-15T10:00:00Z", taxRate: "0.1000", subtotal: "50.00", taxAmount: "5.00" },
      ];

      const res = generateTaxRemittance(orders, "MONTHLY");
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.period).toBe("2026-03");
      expect(row?.taxRate).toBe("0.1000");
      expect(row?.taxableSubtotal).toBe("150.00");
      expect(row?.taxCollected).toBe("15.00");
      expect(row?.orders).toBe(2);
    });
  });

  describe("View 13: Cancellation Root-Cause (cancellations.ts)", () => {
    it("identifies top reason and frequency for order cancellations", () => {
      const events = [
        { occurredAt: "2026-03-10T12:00:00Z", note: "Guest changed mind" },
        { occurredAt: "2026-03-10T14:00:00Z", note: "Guest changed mind" },
        { occurredAt: "2026-03-10T16:00:00Z", note: "Out of stock" },
      ];

      const res = generateCancellationRootCause(events);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.cancelledOrders).toBe(3);
      expect(row?.topReason).toBe("Guest changed mind");
      expect(row?.reasonCount).toBe(2);
    });
  });

  describe("View 14: Service SLA Dashboard (sla.ts)", () => {
    it("computes P50, P90, P99 percentiles and openNow counts", () => {
      const requests = [
        { serviceType: "CLEANING", state: "COMPLETED", submittedAt: "2026-03-10T10:00:00Z", resolvedAt: "2026-03-10T10:10:00Z" }, // 10 min
        { serviceType: "CLEANING", state: "COMPLETED", submittedAt: "2026-03-10T10:00:00Z", resolvedAt: "2026-03-10T10:20:00Z" }, // 20 min
        { serviceType: "CLEANING", state: "COMPLETED", submittedAt: "2026-03-10T10:00:00Z", resolvedAt: "2026-03-10T10:30:00Z" }, // 30 min
        { serviceType: "CLEANING", state: "IN_PROGRESS", submittedAt: "2026-03-10T11:00:00Z", resolvedAt: null }, // open
      ];

      const res = generateServiceSla(requests);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.openNow).toBe(1);
      expect(row?.p50ResolutionMin).toBe(20);
      expect(row?.p90ResolutionMin).toBe(30);
      expect(row?.p99ResolutionMin).toBe(30);
    });
  });

  describe("View 15: Room Folio Report (folio.ts)", () => {
    it("aggregates room stays with order revenue and request counts", () => {
      const stays = [
        {
          roomNumber: "Room 401",
          stayStart: "2026-03-01T14:00:00Z",
          stayEnd: "2026-03-05T11:00:00Z",
          orderTotals: ["120.00", "80.50"],
          serviceRequestsCount: 3,
        },
      ];

      const res = generateRoomFolioReport(stays);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.room).toBe("Room 401");
      expect(row?.orders).toBe(2);
      expect(row?.orderRevenue).toBe("200.50");
      expect(row?.requestCount).toBe(3);
    });
  });

  describe("View 16: Occupancy & Dwell (occupancy.ts)", () => {
    it("computes session counts, average dwell, and peak concurrency", () => {
      const sessions = [
        {
          placeType: "TABLE",
          createdAt: "2026-03-10T12:00:00Z",
          endedAt: "2026-03-10T13:00:00Z", // 12:00 - 13:00 (60 min)
        },
        {
          placeType: "TABLE",
          createdAt: "2026-03-10T12:30:00Z",
          endedAt: "2026-03-10T13:30:00Z", // 12:30 - 13:30 (overlaps 12:30-13:00 -> peak 2)
        },
      ];

      const res = generateOccupancyDwell(sessions, "DAILY");
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.totalSessions).toBe(2);
      expect(row?.avgDwellMin).toBe(60);
      expect(row?.peakConcurrent).toBe(2);
    });
  });

  describe("View 17: QR Scan-to-Order Conversion (conversion.ts)", () => {
    it("computes scan-to-order conversion rate and revenue per session", () => {
      const tokens = [
        {
          tokenId: "tok-1",
          placeType: "TABLE",
          sessionsCount: 10,
          convertedSessionsCount: 4,
          ordersCount: 5,
          orderTotals: ["100.00", "150.00"], // total 250.00
        },
      ];

      const res = generateQrConversionReport(tokens);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0];
      expect(row?.sessions).toBe(10);
      expect(row?.orders).toBe(5);
      expect(row?.conversionPct).toBe("40.0%");
      expect(row?.revenuePerSession).toBe("25.00"); // 250 / 10
    });
  });
});
