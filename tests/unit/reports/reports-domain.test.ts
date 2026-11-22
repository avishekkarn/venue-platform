import { describe, it, expect } from "vitest";
import {
  validateReportDateRange,
  generateRevenueSummary,
  generateItemSales,
  generateOrderFunnel,
  generateServiceRequests,
  generateServiceSla,
  generatePlaceUtilization,
  generateOccupancyDwell,
  generateQrLifecycle,
  generateConversion,
  generateAuditExport,
  generateHourlyHeatmap,
  generateMenuMatrix,
  generateModifierAttachReport,
  generateTaxRemittance,
  generateCancellationRootCause,
  generateRoomFolio,
  generatePaymentReconciliationStatus,
  buildReportQualityMeta,
} from "@/domain/reports";

describe("Milestone 8.7 — Master Reports Domain Unit Test Suite", () => {
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
    });
  });

  describe("View 2: Sales by Item (sales.ts)", () => {
    it("deduplicates items by itemName and marks category as Mixed if spanned", () => {
      const items = [
        {
          itemName: "Steam Momo",
          categoryName: "Breakfast",
          quantity: 2,
          itemPrice: "100.00",
          modifierPrice: "0.00",
          lineTotal: "200.00",
        },
        {
          itemName: "Steam Momo",
          categoryName: "Chinese",
          quantity: 4,
          itemPrice: "100.00",
          modifierPrice: "10.00",
          lineTotal: "440.00",
          modifiersJson: [{ name: "Extra Sauce", price: "10.00" }],
        },
      ];

      const res = generateItemSales(items);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.rows).toHaveLength(1);
      const momo = res.value.rows[0];
      expect(momo?.itemName).toBe("Steam Momo");
      expect(momo?.category).toBe("Mixed"); // Spanned Breakfast & Chinese
      expect(momo?.unitsSold).toBe(6); // 2 + 4
      expect(momo?.lineRevenue).toBe("640.00"); // 200 + 440
      expect(momo?.modifierAttachRate).toBe("66.7%"); // 4 of 6 units
      expect(res.value.uncategorizedItemPct).toBe(0);
    });

    it("tracks uncategorized item percentage accurately", () => {
      const items = [
        {
          itemName: "Chowmein",
          categoryName: null, // Uncategorized
          quantity: 4,
          itemPrice: "150.00",
          modifierPrice: "0.00",
          lineTotal: "600.00",
        },
        {
          itemName: "Tea",
          categoryName: "Beverages",
          quantity: 1,
          itemPrice: "30.00",
          modifierPrice: "0.00",
          lineTotal: "30.00",
        },
      ];

      const res = generateItemSales(items);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      // 4 of 5 total units are uncategorized -> 80.0%
      expect(res.value.uncategorizedItemPct).toBe(80.0);
    });
  });

  describe("View 7: Order Funnel & Latency (funnel.ts)", () => {
    it("satisfies the 5-segment mathematical invariant: sum(segments) == cycle within 1s", () => {
      const orders = [
        {
          id: "ord-1",
          placedAt: "2026-03-10T12:00:00.000Z",
          state: "COMPLETED",
          stateChanges: [
            { state: "PLACED", occurredAt: "2026-03-10T12:00:00.000Z" },
            { state: "APPROVED", occurredAt: "2026-03-10T12:00:30.000Z" },  // 30s approval
            { state: "READY", occurredAt: "2026-03-10T12:10:30.000Z" },     // 600s prep
            { state: "DELIVERED", occurredAt: "2026-03-10T12:12:30.000Z" }, // 120s delivery
            { state: "COMPLETED", occurredAt: "2026-03-10T12:12:33.000Z" }, // 3s close-out
          ],
        },
      ];

      const res = generateOrderFunnel(orders);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.rows).toHaveLength(1);
      const row = res.value.rows[0]!;
      expect(row.avgApprovalSec).toBe(30);
      expect(row.avgPrepSec).toBe(600);
      expect(row.avgDeliverySec).toBe(120);
      expect(row.avgCloseOutSec).toBe(3);
      expect(row.avgCycleSec).toBe(753);

      const segmentSum =
        row.avgApprovalSec + row.avgPrepSec + row.avgDeliverySec + row.avgCloseOutSec;
      expect(Math.abs(row.avgCycleSec - segmentSum)).toBeLessThanOrEqual(1);
    });

    it("surfaces anomalies exceeding 3x P90", () => {
      const normalOrders = [10, 12, 14, 15, 16].map((sec, idx) => ({
        id: `ord-normal-${idx}`,
        placedAt: "2026-03-10T12:00:00.000Z",
        state: "COMPLETED",
        stateChanges: [
          { state: "PLACED", occurredAt: "2026-03-10T12:00:00.000Z" },
          { state: "APPROVED", occurredAt: new Date(Date.parse("2026-03-10T12:00:00.000Z") + sec * 1000) },
          { state: "COMPLETED", occurredAt: new Date(Date.parse("2026-03-10T12:00:00.000Z") + (sec + 60) * 1000) },
        ],
      }));

      const outlierOrder = {
        id: "ord-outlier-56min",
        placedAt: "2026-03-10T12:00:00.000Z",
        state: "COMPLETED",
        stateChanges: [
          { state: "PLACED", occurredAt: "2026-03-10T12:00:00.000Z" },
          { state: "APPROVED", occurredAt: "2026-03-10T12:56:00.000Z" }, // 3360s!
          { state: "COMPLETED", occurredAt: "2026-03-10T13:00:00.000Z" },
        ],
      };

      const res = generateOrderFunnel([...normalOrders, outlierOrder]);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.anomalies.length).toBeGreaterThan(0);
      expect(res.value.anomalies[0]?.orderId).toBe("ord-outlier-56min");
      expect(res.value.anomalies[0]?.segment).toBe("Approval");
    });
  });

  describe("View 3: Menu Engineering Matrix (matrix.ts)", () => {
    it("computes single global medians across deduplicated items and classifies quadrants", () => {
      const items = [
        // Star: high volume, high revenue
        { itemName: "Steam Momo", unitsSold: 10, lineRevenue: "1000.00" },
        // Duplicate row for Steam Momo should combine (10 + 10 = 20 units, 2000.00 revenue)
        { itemName: "Steam Momo", unitsSold: 10, lineRevenue: "1000.00" },
        // Plowhorse: high volume, low revenue
        { itemName: "Chai", unitsSold: 50, lineRevenue: "500.00" },
        // Puzzle: low volume, high revenue
        { itemName: "Special Platter", unitsSold: 2, lineRevenue: "1500.00" },
        // Dog: low volume, low revenue
        { itemName: "Papad", unitsSold: 1, lineRevenue: "50.00" },
      ];

      const res = generateMenuMatrix(items);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      // 4 distinct items
      expect(res.value.itemCount).toBe(4);
      expect(res.value.rows).toHaveLength(4);

      const momo = res.value.rows.find((r) => r.itemName === "Steam Momo");
      expect(momo?.unitsSold).toBe(20);
      expect(momo?.lineRevenue).toBe("2000.00");
      expect(momo?.quadrant).toBe("Star");

      const chai = res.value.rows.find((r) => r.itemName === "Chai");
      expect(chai?.quadrant).toBe("Plowhorse");

      const platter = res.value.rows.find((r) => r.itemName === "Special Platter");
      expect(platter?.quadrant).toBe("Puzzle");

      const papad = res.value.rows.find((r) => r.itemName === "Papad");
      expect(papad?.quadrant).toBe("Dog");
    });
  });

  describe("View 13: Room Folio (folio.ts) & D-12.8 4-Hour Grouping", () => {
    it("groups consecutive sessions with gap <= 4h into one stay; splits if gap > 4h", () => {
      const sessions = [
        // Stay 1: Session 1 (07:00 -> 18:00), Session 2 (18:05 -> 03:37) -> gap 5 min <= 4h
        {
          roomNumber: "Room 101",
          createdAt: "2026-03-10T07:00:00Z",
          endedAt: "2026-03-10T18:00:00Z",
          ordersCount: 2,
          requestsCount: 1,
          ordersRevenue: "500.00",
        },
        {
          roomNumber: "Room 101",
          createdAt: "2026-03-10T18:05:00Z",
          endedAt: "2026-03-11T03:37:00Z",
          ordersCount: 1,
          requestsCount: 0,
          ordersRevenue: "250.00",
        },
        // Stay 2: Session 3 (13:00 -> active) -> gap from 03:37 to 13:00 is > 9h (> 4h gap)
        {
          roomNumber: "Room 101",
          createdAt: "2026-03-11T13:00:00Z",
          endedAt: null, // Active
          ordersCount: 1,
          requestsCount: 2,
          ordersRevenue: "300.00",
        },
      ];

      const res = generateRoomFolio(sessions);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      // Two distinct stays for Room 101
      expect(res.value).toHaveLength(2);

      const stay1 = res.value[0]!;
      expect(stay1.status).toBe("CLOSED");
      expect(stay1.orders).toBe(3); // 2 + 1
      expect(stay1.requests).toBe(1); // 1 + 0
      expect(stay1.orderRevenue).toBe("750.00"); // 500 + 250

      const stay2 = res.value[1]!;
      expect(stay2.status).toBe("ACTIVE");
      expect(stay2.stayEnd).toBeNull();
      expect(stay2.orders).toBe(1);
      expect(stay2.orderRevenue).toBe("300.00");
    });
  });

  describe("View 11 & 12: Service Requests & Service SLA (requests.ts)", () => {
    it("returns null avgResolutionMin when completions = 0 and handles sample size N", () => {
      const requests = [
        {
          id: "req-1",
          serviceType: "HOUSEKEEPING",
          submittedAt: "2026-03-10T10:00:00Z",
          state: "SUBMITTED", // Never completed
          stateChanges: [],
        },
      ];

      const v11 = generateServiceRequests(requests);
      expect(v11.ok).toBe(true);
      if (!v11.ok) return;
      expect(v11.value[0]?.avgResolutionMin).toBeNull();

      const v12 = generateServiceSla(requests);
      expect(v12.ok).toBe(true);
      if (!v12.ok) return;
      const sla = v12.value[0]!;
      expect(sla.n).toBe(0); // 0 completed
      expect(sla.openAtEndOfPeriod).toBe(1);
      expect(sla.p90ResolutionMin).toBeNull(); // Suppressed because N < 20
    });
  });

  describe("View 8: Hourly Heatmap (heatmap.ts)", () => {
    it("localizes hours to venue timezone and includes placeType dimension", () => {
      // 14:00 UTC in Asia/Kathmandu (UTC+5:45) is 19:45 (Hour 19)
      const orders = [
        {
          placedAt: "2026-03-15T14:00:00Z",
          placeType: "TABLE",
          total: "150.00",
        },
      ];

      const res = generateHourlyHeatmap(orders, "Asia/Kathmandu");
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value).toHaveLength(1);
      const row = res.value[0]!;
      expect(row.hour).toBe(19); // 19:45 local time
      expect(row.placeType).toBe("TABLE");
      expect(row.orders).toBe(1);
      expect(row.revenue).toBe("150.00");
    });
  });

  describe("View 6: Payment Reconciliation (payment.ts)", () => {
    it("renders cash collection summary line and inactive provider scope", () => {
      const status = generatePaymentReconciliationStatus({
        totalCashCollected: "726.60",
        completedOrdersCount: 8,
        currency: "NPR",
      });

      expect(status.status).toBe("INACTIVE_V1_SCOPE");
      expect(status.totalCashCollected).toBe("726.60 NPR");
      expect(status.completedOrdersCount).toBe(8);
      expect(status.commentary).toContain("payment provider is connected");
    });
  });

  describe("View 9: Cancellation Root-Cause (cancellations.ts)", () => {
    it("renders clean operations positive confirmation when cancellations = 0", () => {
      const res = generateCancellationRootCause([], 8);
      expect(res.ok).toBe(true);
      if (!res.ok) return;

      expect(res.value.isCleanOperations).toBe(true);
      expect(res.value.totalCancelled).toBe(0);
      expect(res.value.cancellationRatePct).toBe("0.0%");
    });
  });

  describe("Task 10: Quality Meta Envelope (quality.ts)", () => {
    it("builds meta.quality with threshold flags", () => {
      const meta = buildReportQualityMeta({
        uncategorizedItemPct: 80.0,
        outlierOrders: 1,
        staleSessions: 2,
      });

      expect(meta.uncategorizedItemPct).toBe(80.0);
      expect(meta.outlierOrders).toBe(1);
      expect(meta.staleSessions).toBe(2);
      expect(meta.tipsTracked).toBe(false);
      expect(meta.paymentMethodsTracked).toBe(false);
    });
  });
});
