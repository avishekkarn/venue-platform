import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET as getSettings, PATCH as patchSettings, setTestDbClient as setSettingsDbClient } from "@/../app/api/admin/settings/route";
import { GET as getTaxRates, POST as postTaxRates, setTestDbClient as setTaxRatesDbClient } from "@/../app/api/admin/settings/tax-rates/route";
import { PATCH as patchTaxRate, setTestDbClient as setTaxRateItemDbClient } from "@/../app/api/admin/settings/tax-rates/[id]/route";
import { GET as getAuditExport, setTestDbClient as setAuditExportDbClient } from "@/../app/api/admin/settings/audit-export/route";
import { GET as getSeedSnapshot, POST as postSeedSnapshot, setTestDbClient as setSeedSnapshotDbClient } from "@/../app/api/admin/settings/seed-snapshot/route";
import { GET as getModules, PATCH as patchModules, setTestDbClient as setModulesDbClient } from "@/../app/api/admin/modules/route";
import { GET as getServices, PATCH as patchServices, setTestDbClient as setServicesDbClient } from "@/../app/api/admin/services/route";

import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";
import { DomainErrorCode } from "@/domain/shared/result";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("Admin Settings & Expansion API Integration Tests", () => {
  let auditDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = join(tmpdir(), `admin-settings-audit-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    mkdirSync(auditDir, { recursive: true });
    process.env["AUDIT_LOG_DIR"] = auditDir;
    vi.mocked(getGuestCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
  });

  afterEach(() => {
    setSettingsDbClient(null);
    setTaxRatesDbClient(null);
    setTaxRateItemDbClient(null);
    setAuditExportDbClient(null);
    setSeedSnapshotDbClient(null);
    setModulesDbClient(null);
    setServicesDbClient(null);

    if (existsSync(auditDir)) {
      rmSync(auditDir, { recursive: true, force: true });
    }
    delete process.env["AUDIT_LOG_DIR"];
  });

  async function ensureVenueAndAdmin(tx: any) {
    const venueRepo = createPrismaVenueRepository(tx);
    const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
    let venueRes = await venueRepo.findBySlug(venueSlug);
    if (!venueRes.ok) {
      venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1300",
      });
      if (!venueRes.ok) throw new Error("Failed to create venue");
    }
    const venue = venueRes.value;

    const staffRepo = createPrismaStaffRepository(tx);
    const hash = await hashPassword("ValidPass123!");
    const username = `admin_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const staffRes = await staffRepo.create({
      venueId: venue.id,
      name: "Admin User",
      username,
      passwordHash: hash,
      roles: [StaffRole.MANAGER],
    });
    if (!staffRes.ok) throw new Error("Failed to create staff");
    const session = await createSession(tx, staffRes.value.id);
    return { venue, staff: staffRes.value, session };
  }

  function createAuthedRequest(url: string, method: string, body?: any): NextRequest {
    const headers: Record<string, string> = {
      "x-csrf-token": "test-csrf-token",
    };
    if (body) {
      headers["content-type"] = "application/json";
    }
    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it("GET & PATCH /api/admin/settings: retrieves settings and enforces currency lock and validation", async () => {
    await withTransaction(async (tx) => {
      setSettingsDbClient(tx);
      const { venue, session } = await ensureVenueAndAdmin(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // 1. GET settings
      const getReq = createAuthedRequest("http://localhost:3000/api/admin/settings", "GET");
      const getRes = await getSettings(getReq);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.data.venueId).toBe(venue.id);
      expect(getData.data.currency).toBe(venue.currency);
      expect(getData.data.isCurrencyLocked).toBeDefined();

      // 2. PATCH contact and regional fields
      const patchReq = createAuthedRequest("http://localhost:3000/api/admin/settings", "PATCH", {
        contactName: "Front Desk Manager",
        contactPhone: "+977-1-5555555",
        receiptHeader: "Juniper House Hospitality Ltd",
        receiptFooter: "Thank you for visiting us!",
        timezone: "Asia/Kathmandu",
        timeFormat: "24h",
      });
      const patchRes = await patchSettings(patchReq);
      expect(patchRes.status).toBe(200);
      const patchData = await patchRes.json();
      expect(patchData.data.contactName).toBe("Front Desk Manager");
      expect(patchData.data.receiptHeader).toBe("Juniper House Hospitality Ltd");
      expect(patchData.data.timeFormat).toBe("24h");

      // 3. Reject mutating taxRate fallback directly (D-4.13)
      const rejectTaxReq = createAuthedRequest("http://localhost:3000/api/admin/settings", "PATCH", {
        taxRate: "0.2000",
      });
      const rejectTaxRes = await patchSettings(rejectTaxReq);
      expect(rejectTaxRes.status).toBe(400);
      const rejectTaxData = await rejectTaxRes.json();
      expect(rejectTaxData.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  it("POST & GET /api/admin/settings/tax-rates: manages venue tax rates and immutability (D-4.13)", async () => {
    await withTransaction(async (tx) => {
      setTaxRatesDbClient(tx);
      setTaxRateItemDbClient(tx);
      const { session } = await ensureVenueAndAdmin(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // 1. Create new Tax Rate
      const postReq = createAuthedRequest("http://localhost:3000/api/admin/settings/tax-rates", "POST", {
        name: "Luxury Tax",
        rate: "0.2000",
        isDefault: true,
        isInclusive: false,
      });
      const postRes = await postTaxRates(postReq);
      expect(postRes.status).toBe(201);
      const postData = await postRes.json();
      expect(postData.data.name).toBe("Luxury Tax");
      expect(postData.data.rate).toBe("0.2000");
      expect(postData.data.isDefault).toBe(true);

      const createdId = postData.data.id;

      // 2. GET list
      const getReq = createAuthedRequest("http://localhost:3000/api/admin/settings/tax-rates", "GET");
      const getRes = await getTaxRates(getReq);
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();
      expect(getData.data.length).toBeGreaterThan(0);
      const found = getData.data.find((tr: any) => tr.id === createdId);
      expect(found).toBeDefined();
      expect(found.isDefault).toBe(true);

      // 3. PATCH tax rate: try changing rate value (must be rejected per D-4.13)
      const patchRateReq = createAuthedRequest(
        `http://localhost:3000/api/admin/settings/tax-rates/${createdId}`,
        "PATCH",
        { rate: "0.2500" }
      );
      const patchRateRes = await patchTaxRate(patchRateReq, { params: Promise.resolve({ id: createdId }) });
      expect(patchRateRes.status).toBe(400);

      // 4. PATCH tax rate name
      const patchNameReq = createAuthedRequest(
        `http://localhost:3000/api/admin/settings/tax-rates/${createdId}`,
        "PATCH",
        { name: "Luxury Goods VAT" }
      );
      const patchNameRes = await patchTaxRate(patchNameReq, { params: Promise.resolve({ id: createdId }) });
      expect(patchNameRes.status).toBe(200);
      const patchNameData = await patchNameRes.json();
      expect(patchNameData.data.name).toBe("Luxury Goods VAT");
    });
  });

  it("GET /api/admin/settings/audit-export: streams RFC 4180 CSV and enforces 180-day limit (D-9.17, D-12.1)", async () => {
    await withTransaction(async (tx) => {
      setAuditExportDbClient(tx);
      const { session } = await ensureVenueAndAdmin(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // 1. Rejects date range > 180 days
      const invalidReq = createAuthedRequest(
        "http://localhost:3000/api/admin/settings/audit-export?from=2025-01-01&to=2026-01-01",
        "GET"
      );
      const invalidRes = await getAuditExport(invalidReq);
      expect(invalidRes.status).toBe(400);
      const invalidData = await invalidRes.json();
      expect(invalidData.error.message).toContain("180 days");

      // 2. Valid request returns CSV
      const today = new Date().toISOString().substring(0, 10);
      const validReq = createAuthedRequest(
        `http://localhost:3000/api/admin/settings/audit-export?from=${today}&to=${today}&audience=ALL`,
        "GET"
      );
      const validRes = await getAuditExport(validReq);
      expect(validRes.status).toBe(200);
      expect(validRes.headers.get("content-type")).toContain("text/csv");
      const csvText = await validRes.text();
      expect(csvText).toContain("Timestamp,Audience,ActorType");
    });
  });

  it("GET & POST /api/admin/settings/seed-snapshot: produces valid JSON snapshot (D-8.6)", async () => {
    await withTransaction(async (tx) => {
      setSeedSnapshotDbClient(tx);
      const { venue, session } = await ensureVenueAndAdmin(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const getReq = createAuthedRequest("http://localhost:3000/api/admin/settings/seed-snapshot", "GET");
      const getRes = await getSeedSnapshot(getReq);
      expect(getRes.status).toBe(200);
      expect(getRes.headers.get("content-type")).toContain("application/json");

      const bodyText = await getRes.text();
      const snapshot = JSON.parse(bodyText);
      expect(snapshot.version).toBe("1.0.0");
      expect(snapshot.venue.id).toBe(venue.id);
      expect(snapshot.venue.name).toBe(venue.name);

      // Verify zero guest PII
      expect(bodyText).not.toContain("guestEmail");
      expect(bodyText).not.toContain("guestSession");
    });
  });

  it("GET & PATCH /api/admin/modules and /services: toggles module and service configurations (D-9.6)", async () => {
    await withTransaction(async (tx) => {
      setModulesDbClient(tx);
      setServicesDbClient(tx);
      const { session } = await ensureVenueAndAdmin(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // 1. Modules GET
      const getModReq = createAuthedRequest("http://localhost:3000/api/admin/modules", "GET");
      const getModRes = await getModules(getModReq);
      expect(getModRes.status).toBe(200);
      const modData = await getModRes.json();
      expect(Array.isArray(modData.data)).toBe(true);

      // 2. Modules PATCH
      const patchModReq = createAuthedRequest("http://localhost:3000/api/admin/modules", "PATCH", {
        module: "KITCHEN",
        isEnabled: true,
      });
      const patchModRes = await patchModules(patchModReq);
      expect(patchModRes.status).toBe(200);
      const patchModData = await patchModRes.json();
      expect(patchModData.data.module).toBe("KITCHEN");
      expect(patchModData.data.isEnabled).toBe(true);

      // 3. Services GET & PATCH
      const getSrvReq = createAuthedRequest("http://localhost:3000/api/admin/services", "GET");
      const getSrvRes = await getServices(getSrvReq);
      expect(getSrvRes.status).toBe(200);

      const patchSrvReq = createAuthedRequest("http://localhost:3000/api/admin/services", "PATCH", {
        service: "SPA",
        isEnabled: true,
      });
      const patchSrvRes = await patchServices(patchSrvReq);
      expect(patchSrvRes.status).toBe(200);
      const patchSrvData = await patchSrvRes.json();
      expect(patchSrvData.data.service).toBe("SPA");
      expect(patchSrvData.data.isEnabled).toBe(true);
    });
  });
});
