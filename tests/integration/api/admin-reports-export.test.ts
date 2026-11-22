import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { withTransaction } from "../setup";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import {
  GET as getExportHandler,
  setTestDbClient as setExportTestDb,
} from "@/../app/api/admin/reports/[view]/export/route";

vi.mock("@/infrastructure/auth/cookies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/auth/cookies")>();
  return {
    ...actual,
    getSessionCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";

describe("Milestone 8.7 Task 8.7.4 — Reports CSV Streaming Export Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setExportTestDb(null);
  });

  it("401 Unauthorized: rejects unauthenticated export requests", async () => {
    await withTransaction(async (tx) => {
      setExportTestDb(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue/export?dateFrom=2026-03-01&dateTo=2026-03-10");
      const res = await getExportHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(401);
    });
  });

  it("400 Validation Failed: rejects date range exceeding 180 days per D-12.1", async () => {
    await withTransaction(async (tx) => {
      setExportTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Export Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-exp-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "admin-exp-token",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue/export?dateFrom=2026-01-01&dateTo=2026-08-01");
      const res = await getExportHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
      expect(json.error.message).toContain("180 days");
    });
  });

  it("200 CSV Export: exports revenue summary with UTF-8 BOM, RFC 4180 escaping, and exact headers", async () => {
    await withTransaction(async (tx) => {
      setExportTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Export Bistro",
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
          username: `alice-exp2-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "admin-exp-token-2",
        },
      });

      await tx.order.create({
        data: {
          venueId: venue.id,
          idempotencyKey: "exp-order-1",
          placeType: "TABLE",
          state: "COMPLETED",
          subtotal: "150.00",
          taxRate: "0.1000",
          taxAmount: "15.00",
          total: "165.00",
          placedAt: new Date("2026-03-05T12:00:00Z"),
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue/export?dateFrom=2026-03-01&dateTo=2026-03-10");
      const res = await getExportHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      expect(res.headers.get("Content-Disposition")).toContain('attachment; filename="juniper-house-report-revenue-2026-03-01-to-2026-03-10.csv"');

      const bytes = new Uint8Array(await res.arrayBuffer());

      // Verify UTF-8 BOM prefix (0xEF, 0xBB, 0xBF) for Excel/Numbers compatibility (D-12.5)
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);

      const csv = new TextDecoder("utf-8").decode(bytes);

      // Verify exact RFC 4180 headers
      expect(csv).toContain('"Date","Place Type","Completed Orders","Subtotal","Tax Collected","Total Revenue","Currency"');

      // Verify row data
      expect(csv).toContain('"2026-03-05","TABLE",1,"150.00","15.00","165.00","NPR"');
    });
  });

  it("200 CSV Export: exports payment empty-state CSV with headers per D-7.1 and D-7.7", async () => {
    await withTransaction(async (tx) => {
      setExportTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Export Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-exp3-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "admin-exp-token-3",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/payment/export");
      const res = await getExportHandler(req, {
        params: Promise.resolve({ view: "payment" }),
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(bytes[0]).toBe(0xef);
      expect(bytes[1]).toBe(0xbb);
      expect(bytes[2]).toBe(0xbf);
      const csv = new TextDecoder("utf-8").decode(bytes);
      expect(csv).toContain('"Payment Method","Status","Orders","Amount Collected","Discrepancies"');
      expect(csv).toContain('# Payment Reconciliation inactive in v1');
    });
  });
});
