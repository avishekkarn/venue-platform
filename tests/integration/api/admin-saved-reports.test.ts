import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { withTransaction } from "../setup";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { generateCsrfToken } from "@/infrastructure/csrf/token";
import {
  GET as getSavedReportsHandler,
  POST as postSavedReportsHandler,
  setTestDbClient as setSavedTestDb,
} from "@/../app/api/admin/reports/saved/route";
import {
  DELETE as deleteSavedReportHandler,
  setTestDbClient as setDeleteSavedTestDb,
} from "@/../app/api/admin/reports/saved/[id]/route";
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

vi.mock("@/infrastructure/csrf/cookies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/csrf/cookies")>();
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("Milestone 8.7 Task 8.7.5 — Saved Reports & Report-Run Audit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setSavedTestDb(null);
    setDeleteSavedTestDb(null);
    setReportsTestDb(null);
  });

  it("POST /api/admin/reports/saved creates saved report and GET lists it", async () => {
    await withTransaction(async (tx) => {
      setSavedTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Saved Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-saved-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "saved-session-token",
        },
      });

      const csrfToken = generateCsrfToken();
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue(csrfToken);

      // 1. Create a saved report
      const postReq = new NextRequest("http://localhost:3000/api/admin/reports/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          name: "Weekend Dinner Latency",
          view: "funnel",
          params: { dateFrom: "2026-03-01", dateTo: "2026-03-07" },
        }),
      });

      const postRes = await postSavedReportsHandler(postReq);
      expect(postRes.status).toBe(201);
      const postJson = await postRes.json();
      expect(postJson.ok).toBe(true);
      expect(postJson.data.name).toBe("Weekend Dinner Latency");
      expect(postJson.data.view).toBe("funnel");
      expect(postJson.data.createdBy.name).toBe("Alice Manager");

      const savedReportId = postJson.data.id;

      // 2. Reject duplicate report name with 409 CONFLICT
      const dupReq = new NextRequest("http://localhost:3000/api/admin/reports/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          name: "Weekend Dinner Latency",
          view: "revenue",
        }),
      });
      const dupRes = await postSavedReportsHandler(dupReq);
      expect(dupRes.status).toBe(409);

      // 3. GET /api/admin/reports/saved lists the report
      const getReq = new NextRequest("http://localhost:3000/api/admin/reports/saved");
      const getRes = await getSavedReportsHandler(getReq);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.ok).toBe(true);
      expect(getJson.data).toHaveLength(1);
      expect(getJson.data[0].id).toBe(savedReportId);
      expect(getJson.data[0].name).toBe("Weekend Dinner Latency");
    });
  });

  it("DELETE /api/admin/reports/saved/[id] removes the saved report", async () => {
    await withTransaction(async (tx) => {
      setDeleteSavedTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Delete Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-del-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "del-session-token",
        },
      });

      const saved = await tx.savedReport.create({
        data: {
          venueId: venue.id,
          name: "Old Report",
          view: "tax",
          createdByStaffId: staff.id,
        },
      });

      const csrfToken = generateCsrfToken();
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue(csrfToken);

      const delReq = new NextRequest(`http://localhost:3000/api/admin/reports/saved/${saved.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });

      const delRes = await deleteSavedReportHandler(delReq, {
        params: Promise.resolve({ id: saved.id }),
      });

      expect(delRes.status).toBe(200);
      const delJson = await delRes.json();
      expect(delJson.ok).toBe(true);

      // Verify row is deleted
      const check = await tx.savedReport.findUnique({
        where: { id: saved.id },
      });
      expect(check).toBeNull();
    });
  });

  it("ReportRun compliance audit: records every executed report run per D-12.7", async () => {
    await withTransaction(async (tx) => {
      setReportsTestDb(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Audit Bistro",
          slug: "juniper-house",
          taxRate: "0.1000",
          brandColor: "#112233",
        },
      });

      const staff = await tx.staffMember.create({
        data: {
          venueId: venue.id,
          name: "Alice Manager",
          username: `alice-audit-${Date.now()}`,
          passwordHash: await hashPassword("pass1234"),
          roles: [StaffRole.MANAGER],
          state: StaffState.ACTIVE,
        },
      });

      const session = await tx.staffSession.create({
        data: {
          staffMemberId: staff.id,
          token: "audit-session-token",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost:3000/api/admin/reports/revenue?dateFrom=2026-03-01&dateTo=2026-03-10");
      const res = await getReportsHandler(req, {
        params: Promise.resolve({ view: "revenue" }),
      });

      expect(res.status).toBe(200);

      // Verify compliance audit in ReportRun table
      const runs = await tx.reportRun.findMany({
        where: { venueId: venue.id },
      });

      expect(runs).toHaveLength(1);
      const run = runs[0];
      expect(run?.view).toBe("revenue");
      expect(run?.ranByStaffId).toBe(staff.id);
      expect((run?.paramsJson as any)?.dateFrom).toBe("2026-03-01");
      expect((run?.paramsJson as any)?.dateTo).toBe("2026-03-10");
    });
  });
});
