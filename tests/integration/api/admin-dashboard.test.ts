import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { rmSync, mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET, setTestDbClient } from "@/../app/api/admin/dashboard/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/infrastructure/guest/cookies", () => ({
  getGuestCookie: vi.fn(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return { ...actual, getCsrfCookie: vi.fn() };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("GET /api/admin/dashboard Integration Tests (Task 8.1.1)", () => {
  let auditDir: string;
  const originalEnv = process.env["AUDIT_LOG_DIR"];
  const originalSlug = process.env["VENUE_SLUG"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "dashboard-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
    process.env["VENUE_SLUG"] = process.env["VENUE_SLUG"] ?? "juniper-house";
    vi.mocked(getGuestCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
  });

  afterEach(() => {
    setTestDbClient(null);
    if (existsSync(auditDir)) {
      rmSync(auditDir, { recursive: true, force: true });
    }
    if (originalEnv === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalEnv;
    if (originalSlug === undefined) delete process.env["VENUE_SLUG"];
    else process.env["VENUE_SLUG"] = originalSlug;
  });

  it("returns 200 with the six metrics for a MANAGER", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_dash",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/dashboard", {
        method: "GET",
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(json.data).toHaveProperty("ordersWaiting");
      expect(json.data).toHaveProperty("inKitchen");
      expect(json.data).toHaveProperty("ready");
      expect(json.data).toHaveProperty("revenueToday");
      expect(json.data).toHaveProperty("ordersToday");
      expect(json.data).toHaveProperty("requestsOpen");
      expect(typeof json.data.ordersWaiting).toBe("number");
      expect(typeof json.data.inKitchen).toBe("number");
      expect(typeof json.data.ready).toBe("number");
      expect(typeof json.data.revenueToday).toBe("string");
      expect(json.data.revenueToday).toMatch(/^\d+\.\d{2}$/);
      expect(typeof json.data.ordersToday).toBe("number");
      expect(typeof json.data.requestsOpen).toBe("number");
    });
  });

  it("returns 401 UNAUTHORIZED without a session cookie", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/admin/dashboard", {
        method: "GET",
      });
      const response = await GET(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });

  it("returns 403 FORBIDDEN for a CHEF (non-admin)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Bob Chef",
        username: "bob_dash",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/dashboard", {
        method: "GET",
      });
      const response = await GET(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  it("writes one audit line with a real IP when a MANAGER reads the dashboard", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_dash_audit",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/dashboard", {
        method: "GET",
        headers: { "x-forwarded-for": "203.0.113.42" },
      });
      const response = await GET(request);
      expect(response.status).toBe(200);

      const today = new Date();
      const stamp =
        `${today.getUTCFullYear()}` +
        `-${String(today.getUTCMonth() + 1).padStart(2, "0")}` +
        `-${String(today.getUTCDate()).padStart(2, "0")}`;
      const auditFile = join(auditDir, `${stamp}.jsonl`);
      expect(existsSync(auditFile)).toBe(true);
      const lines = readFileSync(auditFile, "utf8")
        .split("\n")
        .filter((l) => l.length > 0)
        .map((l) => JSON.parse(l) as Record<string, unknown>);
      expect(lines.length).toBeGreaterThanOrEqual(1);
      const line = lines[lines.length - 1];
      expect(line).toBeDefined();
      if (!line) return;
      expect(line["route"]).toBe("/api/admin/dashboard");
      expect(line["method"]).toBe("GET");
      expect(line["status"]).toBe(200);
      expect(line["actorType"]).toBe("staff");
      expect(line["actorRole"]).toBe("MANAGER");
      expect(line["ip"]).toBe("203.0.113.42");
    });
  });
});

