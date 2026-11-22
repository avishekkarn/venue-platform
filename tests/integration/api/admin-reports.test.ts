import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { withTransaction } from "../setup";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import {
  GET as getReportsHandler,
  setTestDbClient as setReportsTestDb,
} from "@/../app/api/admin/reports/[view]/route";

vi.mock("@/infrastructure/auth/cookies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/auth/cookies")>();
  return {
    ...actual,
    getSessionCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";

describe("Milestone 8.7 Task 8.7.3 — Admin Reports API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setReportsTestDb(null);
  });

  it("401 Unauthorized: returns 401 when no session cookie is present", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue?dateFrom=2026-03-01&dateTo=2026-03-15");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });

  it("403 Forbidden: rejects staff without admin role (e.g. TABLE_SERVICE waiter)", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Report Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Waiter Dave",
          username: `dave-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.TABLE_SERVICE],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "waiter-session-token",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue?dateFrom=2026-03-01&dateTo=2026-03-15");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  it("400 Validation Failed: rejects unknown view name", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/fake_view?dateFrom=2026-03-01&dateTo=2026-03-15");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "fake_view" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
      expect(json.error.message).toContain("Unknown report view");
    });
  });

  it("400 Validation Failed: rejects date range exceeding 180 days per D-12.1", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Report Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "admin-session-token",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // 200 days range
      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue?dateFrom=2026-01-01&dateTo=2026-08-01");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
      expect(json.error.message).toContain("180 days");
    });
  });

  it("404 Cross-Venue: rejects manager from another venue (D-10.2)", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venueA = await tx.venue.create({
        data: {
          name: "Bistro A",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const venueB = await tx.venue.create({
        data: {
          name: "Bistro B",
          slug: `bistro-b-${Date.now()}`,
          taxRate: "0.1000",
          brandColor: "#445566",
        },
      });

      const foreignStaff = await tx.staffMember.create({
        data: {
          venueId: venueB.id,
          name: "Foreign Manager",
          username: `foreign-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: foreignStaff.id,
          token: "foreign-token",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue?dateFrom=2026-03-01&dateTo=2026-03-15");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });

  it("200 Payment View: returns INACTIVE_V1_SCOPE descriptor per D-7.1 and D-7.7", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Report Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "admin-session-token",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/payment");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "payment" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.view).toBe("payment");
      expect(json.data.status).toBe("INACTIVE_V1_SCOPE");
      expect(json.data.commentary).toContain("cash at counter");
    });
  });

  it("200 Happy Path: GET /api/admin/reports/revenue aggregates completed orders in date range", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Report Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
          currency: "NPR",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "admin-session-token",
        },
      });

      // Fixture: completed order in range
      await tx.order.create({
        data: {
          venueId: venue.id,
          idempotencyKey: "11111111-2222-3333-4444-555555555555",
          placeType: "TABLE",
          state: "COMPLETED",
          subtotal: "100.00",
          taxRate: "0.1000",
          taxAmount: "10.00",
          total: "110.00",
          placedAt: new Date("2026-03-05T12:00:00Z"),
        },
      });

      // Fixture: placed order (not completed) — should not be counted in completed revenue
      await tx.order.create({
        data: {
          venueId: venue.id,
          idempotencyKey: "22222222-3333-4444-5555-666666666666",
          placeType: "TABLE",
          state: "PLACED",
          subtotal: "50.00",
          taxRate: "0.1000",
          taxAmount: "5.00",
          total: "55.00",
          placedAt: new Date("2026-03-05T13:00:00Z"),
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue?dateFrom=2026-03-01&dateTo=2026-03-10");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.view).toBe("revenue");
      expect(json.data.rows).toHaveLength(1);

      const row = json.data.rows[0];
      expect(row.date).toBe("2026-03-05");
      expect(row.placeType).toBe("TABLE");
      expect(row.completedOrders).toBe(1);
      expect(row.subtotal).toBe("100.00");
      expect(row.taxCollected).toBe("10.00");
      expect(row.totalRevenue).toBe("110.00");
      expect(row.currency).toBe("NPR");
    });
  });

  it("200 Happy Path: GET /api/admin/reports/sales returns item sales with category snapshot", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Sales Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-sales-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "sales-session-token",
        },
      });

      const order = await tx.order.create({
        data: {
          venueId: venue.id,
          idempotencyKey: "sales-order-key",
          placeType: "TABLE",
          state: "COMPLETED",
          subtotal: "40.00",
          taxRate: "0.1000",
          taxAmount: "4.00",
          total: "44.00",
          placedAt: new Date("2026-03-05T12:00:00Z"),
          items: {
            create: [
              {
                itemName: "Momo Dumplings",
                categoryName: "Appetizers",
                itemPrice: "10.00",
                quantity: 4,
                modifierPrice: "0.00",
                lineTotal: "40.00",
              },
            ],
          },
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/sales?dateFrom=2026-03-01&dateTo=2026-03-10");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "sales" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.view).toBe("sales");
      expect(json.data.rows).toHaveLength(1);
      expect(json.data.rows[0].itemName).toBe("Momo Dumplings");
      expect(json.data.rows[0].category).toBe("Appetizers");
      expect(json.data.rows[0].unitsSold).toBe(4);
      expect(json.data.rows[0].lineRevenue).toBe("40.00");
    });
  });

  it("200 Happy Path: GET /api/admin/reports/requests aggregates service requests and state changes", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Service Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-service-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "service-session-token",
        },
      });

      await tx.serviceRequest.create({
        data: {
          venueId: venue.id,
          serviceType: "LAUNDRY",
          state: "COMPLETED",
          submittedAt: new Date("2026-03-05T10:00:00Z"),
          stateChanges: {
            create: [
              { state: "SUBMITTED", occurredAt: new Date("2026-03-05T10:00:00Z") },
              { state: "COMPLETED", occurredAt: new Date("2026-03-05T10:30:00Z") },
            ],
          },
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/requests?dateFrom=2026-03-01&dateTo=2026-03-10");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "requests" }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.ok).toBe(true);
      expect(json.data.view).toBe("requests");
      expect(json.data.rows).toHaveLength(1);
      expect(json.data.rows[0].serviceType).toBe("LAUNDRY");
      expect(json.data.rows[0].completed).toBe(1);
      expect(json.data.rows[0].avgResolutionMin).toBe(30);
    });
  });
});
