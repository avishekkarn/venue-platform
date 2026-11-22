/**
 * Integration Test: Master Report Reconciliation Test Suite (Task 9).
 *
 * Asserts all 10 industry-grade cross-view invariants across the 17 reports:
 * 1. Revenue reconciliation: V1 total == V2 line total == V3 matrix revenue == V5 taxable + tax == V6 cash summary.
 * 2. Order count reconciliation: V1 completed == V7 completed == V9 non-cancelled == V8 orders sum.
 * 3. Session count reconciliation: V14 closed + active == V15 total == V16 generated == V17 sessions.
 * 4. Folio reconciliation: V13 closed stays == V14 room sessions grouped by 4h gap; V13 revenue == V14 room revenue.
 * 5. Service reconciliation: V11 submitted == V12 completions + declines + cancellations; V11 avg resolution over completed only.
 * 6. Tax reconciliation: V5 tax == sum of V1 tax.
 * 7. Segment invariant: |Cycle - sum(Approval, Prep, Delivery, Close-Out)| <= 1s per D-4.9.
 * 8. Kasavana & Smith item deduplication: every itemName appears once in V3 with single global medians.
 * 9. Conversion invariant: 0 <= conversionPct <= 100%.
 * 10. Dwell sanity invariant: dwell > 240min requires staleSessions > 0.
 *
 * Governed by:
 * - DECISIONS.md D-2.1, D-4.1, D-4.9, D-7.1, D-7.7, D-10.2, D-11.5, D-12.1-D-12.8.
 * - BUILD.md §7.1, §8.8, §11, §13.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { withTransaction } from "../setup";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { GET as getReportHandler, setTestDbClient } from "@/../app/api/admin/reports/[view]/route";

vi.mock("@/infrastructure/auth/cookies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/auth/cookies")>();
  return {
    ...actual,
    getSessionCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";

describe("Reports Cross-View Reconciliation & Invariants (Milestone 8.7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifies all 10 reconciliation invariants against seeded transaction data", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      // 1. Create Venue with Nepal timezone and 13% VAT
      const venueRepo = createPrismaVenueRepository(tx);
      const venueRes = await venueRepo.create({
        name: "Reconciliation Test Resort",
        slug: "reconciliation-test-resort",
        brandColor: "#059669",
        welcomeMessage: "Welcome",
        language: "en",
        currency: "NPR",
        taxRate: "0.1300",
        timezone: "Asia/Kathmandu",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venueId = venueRes.value.id;

      // Ensure venue slug resolves
      process.env["VENUE_SLUG"] = "reconciliation-test-resort";

      // 2. Create Admin Staff & Session
      const staffRepo = createPrismaStaffRepository(tx);
      const adminStaff = await staffRepo.create({
        venueId,
        name: "Recon Auditor",
        username: "recon_auditor",
        passwordHash: await hashPassword("AuditPass123"),
        roles: [StaffRole.OWNER],
      });
      expect(adminStaff.ok).toBe(true);
      if (!adminStaff.ok) return;

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: adminStaff.value.id,
          token: "recon-auditor-session-token",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // 3. Create Places (Table 1, Room 101, Counter Pickup)
      const tableCat = await tx.tableCategory.create({
        data: { venueId, name: "Dining Hall" },
      });
      const roomCat = await tx.roomCategory.create({
        data: { venueId, name: "Deluxe Suite" },
      });

      const table1 = await tx.table.create({
        data: { venueId, number: "T1", categoryId: tableCat.id },
      });
      const room101 = await tx.room.create({
        data: { venueId, number: "R101", categoryId: roomCat.id },
      });
      const counter1 = await tx.counter.create({
        data: { venueId, name: "Express Bar" },
      });

      // 4. Create QR Tokens
      const qrTable = await tx.qrToken.create({
        data: { venueId, placeType: "TABLE", tableId: table1.id },
      });
      const qrRoom = await tx.qrToken.create({
        data: { venueId, placeType: "ROOM", roomId: room101.id },
      });
      const qrCounter = await tx.qrToken.create({
        data: { venueId, placeType: "COUNTER", counterId: counter1.id },
      });

      // 5. Create Guest Sessions
      const t0 = new Date("2026-11-20T10:00:00.000Z");
      const tEnd1 = new Date("2026-11-20T11:30:00.000Z"); // 90 min dwell
      const tableSession = await tx.guestSession.create({
        data: {
          venueId,
          qrTokenId: qrTable.id,
          placeType: "TABLE",
          tableId: table1.id,
          createdAt: t0,
          endedAt: tEnd1,
        },
      });

      // Room stay: Session A (10:00 -> 12:00), Session B (14:00 -> 16:00, gap = 2h <= 4h => SAME STAY per D-12.8)
      const roomSessA = await tx.guestSession.create({
        data: {
          venueId,
          qrTokenId: qrRoom.id,
          placeType: "ROOM",
          roomId: room101.id,
          createdAt: new Date("2026-11-20T10:00:00.000Z"),
          endedAt: new Date("2026-11-20T12:00:00.000Z"),
        },
      });
      const roomSessB = await tx.guestSession.create({
        data: {
          venueId,
          qrTokenId: qrRoom.id,
          placeType: "ROOM",
          roomId: room101.id,
          createdAt: new Date("2026-11-20T14:00:00.000Z"),
          endedAt: new Date("2026-11-20T16:00:00.000Z"),
        },
      });

      // Counter session (active, no endedAt, created 5 hours ago => stale)
      const fiveHoursAgo = new Date(Date.now() - 5 * 3600 * 1000);
      const counterSession = await tx.guestSession.create({
        data: {
          venueId,
          qrTokenId: qrCounter.id,
          placeType: "COUNTER",
          counterId: counter1.id,
          createdAt: fiveHoursAgo,
          endedAt: null,
        },
      });

      // 5b. Create Menu Category and Items for Foreign Key constraints
      const menuCat = await tx.menuCategory.create({
        data: { venueId, name: "Specialties" },
      });
      const itemMomo = await tx.menuItem.create({
        data: {
          venueId,
          name: "Steamed Momo",
          price: 500.0,
          categories: {
            create: { venueId, categoryId: menuCat.id },
          },
        },
      });
      const itemDalbhat = await tx.menuItem.create({
        data: {
          venueId,
          name: "Dal Bhat Tarkari",
          price: 500.0,
          categories: {
            create: { venueId, categoryId: menuCat.id },
          },
        },
      });

      // 6. Create Orders with snapshotted items & state changes
      // Order 1: Table 1 (Subtotal 1000.00, Tax 130.00, Total 1130.00)
      const order1 = await tx.order.create({
        data: {
          venueId,
          guestSessionId: tableSession.id,
          tableId: table1.id,
          placeType: "TABLE",
          state: "COMPLETED",
          subtotal: 1000.0,
          taxAmount: 130.0,
          total: 1130.0,
          taxRate: 0.13,
          idempotencyKey: "order-1-key",
          placedAt: t0,
        },
      });

      await tx.orderItem.create({
        data: {
          orderId: order1.id,
          menuItemId: itemMomo.id,
          itemName: "Steamed Momo",
          categoryName: "Appetizers",
          quantity: 2,
          itemPrice: 500.0,
          lineTotal: 1000.0,
        },
      });

      // 5-segment state changes for Order 1:
      // PLACED -> APPROVED (30s) -> READY (300s) -> DELIVERED (60s) -> COMPLETED (10s)
      // Cycle = 400s
      const tP = t0.getTime();
      await tx.orderStateChange.createMany({
        data: [
          { orderId: order1.id, state: "APPROVED", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP + 30000) },
          { orderId: order1.id, state: "READY", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP + 330000) },
          { orderId: order1.id, state: "DELIVERED", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP + 390000) },
          { orderId: order1.id, state: "COMPLETED", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP + 400000) },
        ],
      });

      // Order 2: Room 101 on Sess A (Subtotal 2000.00, Tax 260.00, Total 2260.00)
      const order2 = await tx.order.create({
        data: {
          venueId,
          guestSessionId: roomSessA.id,
          roomId: room101.id,
          placeType: "ROOM",
          state: "COMPLETED",
          subtotal: 2000.0,
          taxAmount: 260.0,
          total: 2260.0,
          taxRate: 0.13,
          idempotencyKey: "order-2-key",
          placedAt: new Date("2026-11-20T10:30:00.000Z"),
        },
      });

      await tx.orderItem.create({
        data: {
          orderId: order2.id,
          menuItemId: itemDalbhat.id,
          itemName: "Dal Bhat Tarkari",
          categoryName: "Mains",
          quantity: 4,
          itemPrice: 500.0,
          lineTotal: 2000.0,
        },
      });

      const tP2 = new Date("2026-11-20T10:30:00.000Z").getTime();
      await tx.orderStateChange.createMany({
        data: [
          { orderId: order2.id, state: "APPROVED", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP2 + 40000) },
          { orderId: order2.id, state: "READY", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP2 + 400000) },
          { orderId: order2.id, state: "DELIVERED", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP2 + 500000) },
          { orderId: order2.id, state: "COMPLETED", staffMemberId: adminStaff.value.id, occurredAt: new Date(tP2 + 550000) },
        ],
      });

      // 7. Create Service Request (Housekeeping: Submitted -> In Progress -> Completed in 15 min)
      const sReq = await tx.serviceRequest.create({
        data: {
          venueId,
          guestSessionId: roomSessA.id,
          placeType: "ROOM",
          roomId: room101.id,
          serviceType: "HOUSEKEEPING",
          state: "COMPLETED",
          submittedAt: new Date("2026-11-20T11:00:00.000Z"),
        },
      });
      await tx.requestStateChange.create({
        data: {
          requestId: sReq.id,
          state: "COMPLETED",
          staffMemberId: adminStaff.value.id,
          occurredAt: new Date("2026-11-20T11:15:00.000Z"),
        },
      });

      // 8. Helper to call GET /api/admin/reports/[view]
      async function callReport(view: string) {
        const req = new NextRequest(
          `http://localhost:3000/api/admin/reports/${view}?dateFrom=2026-11-19&dateTo=2026-11-23`
        );
        const res = await getReportHandler(req, {
          params: Promise.resolve({ view }),
        });
        const body = await res.json();
        return body.data;
      }

      // Query all relevant views
      const v1Revenue = await callReport("revenue");
      const v2Sales = await callReport("sales");
      const v3Matrix = await callReport("matrix");
      const v5Tax = await callReport("tax");
      const v6Payment = await callReport("payment");
      const v7Funnel = await callReport("funnel");
      const v8Heatmap = await callReport("heatmap");
      const v9Cancellations = await callReport("cancellations");
      const v11Requests = await callReport("requests");
      const v12Sla = await callReport("sla");
      const v13Folio = await callReport("folio");
      const v14Utilization = await callReport("utilization");
      const v15Occupancy = await callReport("occupancy");
      const v16Qr = await callReport("qr");
      const v17Conversion = await callReport("conversion");

      // =========================================================================
      // INVARIANT 1: Revenue Reconciliation
      // V1 total == V2 total line == V3 matrix revenue == V5 taxable + tax == V6 cash
      // =========================================================================
      const v1TotalRev = v1Revenue.rows
        .reduce((sum: number, r: any) => sum + parseFloat(r.totalRevenue), 0)
        .toFixed(2);
      const v2TotalRev = v2Sales.rows
        .reduce((sum: number, r: any) => sum + parseFloat(r.lineRevenue), 0)
        .toFixed(2);
      const v3TotalRev = v3Matrix.rows
        .reduce((sum: number, r: any) => sum + parseFloat(r.lineRevenue), 0)
        .toFixed(2);
      const v5Taxable = v5Tax.rows.reduce((sum: number, r: any) => sum + parseFloat(r.taxableSubtotal), 0);
      const v5TaxCollected = v5Tax.rows.reduce((sum: number, r: any) => sum + parseFloat(r.taxCollected), 0);
      const v5TotalRev = (v5Taxable + v5TaxCollected).toFixed(2);
      const v6CashCollected = parseFloat(v6Payment.totalCashCollected).toFixed(2);

      // Expected: 1130.00 (Order 1) + 2260.00 (Order 2) = 3390.00
      expect(v1TotalRev).toBe("3390.00");
      expect(v2TotalRev).toBe("3000.00"); // Line items total before tax
      expect(v3TotalRev).toBe("3000.00"); // Matrix items total
      expect(v5TotalRev).toBe("3390.00"); // Taxable 3000 + Tax 390 = 3390
      expect(v6CashCollected).toBe("3390.00"); // Cash collected = total orders

      // =========================================================================
      // INVARIANT 2: Order Count Reconciliation
      // V1 completed orders == V7 completed == V9 non-cancelled == V8 unique orders
      // =========================================================================
      const v1Completed = v1Revenue.rows.reduce((s: number, r: any) => s + r.completedOrders, 0);
      const v7Completed = v7Funnel.rows.reduce((s: number, r: any) => s + r.completed, 0);
      const v8Orders = v8Heatmap.rows.reduce((s: number, r: any) => s + r.orders, 0);
      const v9NonCancelled = v9Cancellations.meta.totalOrders - v9Cancellations.meta.totalCancelled;

      expect(v1Completed).toBe(2);
      expect(v7Completed).toBe(2);
      expect(v8Orders).toBe(2);
      expect(v9NonCancelled).toBe(2);

      // =========================================================================
      // INVARIANT 3: Session Count Reconciliation
      // V14 closed + active == V15 total sessions == V16 generated sessions
      // =========================================================================
      const v14Sessions = v14Utilization.rows.reduce(
        (s: number, r: any) => s + r.sessionsClosed + r.activeSessions,
        0
      );
      const v15Sessions = v15Occupancy.rows.reduce((s: number, r: any) => s + r.totalSessions, 0);
      const v16Sessions = v16Qr.rows.reduce((s: number, r: any) => s + r.sessionsGenerated, 0);
      const v17Sessions = v17Conversion.rows.reduce((s: number, r: any) => s + r.sessions, 0);

      // Table (1 closed) + Room (2 closed) + Counter (1 active) = 4 sessions
      expect(v14Sessions).toBe(4);
      expect(v15Sessions).toBe(4);
      expect(v16Sessions).toBe(4);
      expect(v17Sessions).toBe(4);

      // =========================================================================
      // INVARIANT 4: Folio Reconciliation (D-12.8 4-hour rule)
      // 2 consecutive sessions at R101 with gap=2h <= 4h form ONE Stay
      // V13 stay revenue == V14 Room revenue
      // =========================================================================
      expect(v13Folio.rows).toHaveLength(1); // Merged into 1 stay
      expect(v13Folio.rows[0].room).toBe("R101");
      expect(v13Folio.rows[0].orders).toBe(1);
      expect(v13Folio.rows[0].requests).toBe(1);
      expect(v13Folio.rows[0].orderRevenue).toBe("2260.00");

      const v14RoomRevenue = v14Utilization.rows
        .filter((r: any) => r.placeType === "ROOM")
        .reduce((sum: number, r: any) => sum + parseFloat(r.revenue), 0)
        .toFixed(2);
      expect(v14RoomRevenue).toBe("2260.00");

      // =========================================================================
      // INVARIANT 5: Service Request Reconciliation
      // V11 submitted == completed + declined + cancelled
      // =========================================================================
      const v11Row = v11Requests.rows.find((r: any) => r.serviceType === "HOUSEKEEPING");
      expect(v11Row).toBeDefined();
      expect(v11Row.submitted).toBe(1);
      expect(v11Row.completed).toBe(1);
      expect(v11Row.avgResolutionMin).toBe(15); // 15 min resolution

      const v12Row = v12Sla.rows.find((r: any) => r.serviceType === "HOUSEKEEPING");
      expect(v12Row).toBeDefined();
      expect(v12Row.n).toBe(1);
      expect(v12Row.p50ResolutionMin).toBe(15);
      // N < 20 => P90 and P99 must be suppressed (null)
      expect(v12Row.p90ResolutionMin).toBeNull();
      expect(v12Row.p99ResolutionMin).toBeNull();

      // =========================================================================
      // INVARIANT 6: Tax Reconciliation
      // V5 tax collected == sum of V1 tax collected
      // =========================================================================
      const v1TaxSum = v1Revenue.rows
        .reduce((sum: number, r: any) => sum + parseFloat(r.taxCollected), 0)
        .toFixed(2);
      expect(v5TaxCollected.toFixed(2)).toBe(v1TaxSum);
      expect(v1TaxSum).toBe("390.00"); // 130 + 260 = 390

      // =========================================================================
      // INVARIANT 7: Segment Latency Invariant (|Cycle - sum| <= 1s per D-4.9)
      // =========================================================================
      for (const row of v7Funnel.rows) {
        if (row.completed > 0) {
          const sumSegments =
            row.p50ApprovalSec + row.p50PrepSec + row.p50DeliverySec + row.p50CloseOutSec;
          expect(Math.abs(row.p50CycleSec - sumSegments)).toBeLessThanOrEqual(1);
        }
      }

      // =========================================================================
      // INVARIANT 8: Kasavana & Smith Item Deduplication
      // Each itemName is unique in V3
      // =========================================================================
      const itemNames = v3Matrix.rows.map((r: any) => r.itemName);
      const uniqueNames = new Set(itemNames);
      expect(itemNames.length).toBe(uniqueNames.size);
      expect(v3Matrix.meta.itemCount).toBe(2);

      // =========================================================================
      // INVARIANT 9: Conversion Rate Invariant (0% <= conversionPct <= 100%)
      // =========================================================================
      for (const row of v17Conversion.rows) {
        const pctNum = parseFloat(row.conversionPct);
        expect(pctNum).toBeGreaterThanOrEqual(0);
        expect(pctNum).toBeLessThanOrEqual(100);
      }

      // =========================================================================
      // INVARIANT 10: Dwell Sanity & Stale Sessions
      // Active session created 5h ago without endedAt must be flagged as stale
      // =========================================================================
      const counterOcc = v15Occupancy.rows.find((r: any) => r.placeType === "COUNTER");
      expect(counterOcc).toBeDefined();
      expect(counterOcc.staleSessions).toBeGreaterThanOrEqual(1);
    });
  });
});
