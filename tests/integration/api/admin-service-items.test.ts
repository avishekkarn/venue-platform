import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { POST, setTestDbClient } from "@/../app/api/admin/services/items/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return { ...actual, getCsrfCookie: vi.fn() };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("POST /api/admin/services/items Route Tests (8.4.3)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "service-items-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setTestDbClient(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  it("returns 401 UNAUTHORIZED when session is missing", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

    const request = new NextRequest("http://localhost/api/admin/services/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "test-csrf-token",
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify({
        name: "Test Service",
        price: "10.00",
        categoryId: "11111111-2222-3333-4444-555555555555",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("returns 403 FORBIDDEN for LEADER role", async () => {
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
        name: "Leader Staff",
        username: "leader_service_item_create",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost/api/admin/services/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          name: "Test Service",
          price: "10.00",
          categoryId: "11111111-2222-3333-4444-555555555555",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("returns 400 VALIDATION_FAILED when required fields are missing", async () => {
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
        username: "alice_service_item_missing_fields",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      // Missing 'name' field
      const request = new NextRequest("http://localhost/api/admin/services/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          price: "10.00",
          categoryId: "11111111-2222-3333-4444-555555555555",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(json.error.message).toContain("name is required");
    });
  });

  it("creates a service item and returns 201 with estimatedMinutes and item details", async () => {
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
      const venueId = venueResult.value.id;

      const staffResult = await staffRepo.create({
        venueId,
        name: "Alice Manager",
        username: "alice_service_item_create_201",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const category = await tx.serviceCategory.create({
        data: {
          venueId,
          name: "Wellness & Spa",
          sortOrder: 1,
        },
      });

      const request = new NextRequest("http://localhost/api/admin/services/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          name: "Full Body Massage",
          description: "Relaxing deep tissue massage",
          price: "50.00",
          categoryId: category.id,
          estimatedMinutes: 60,
          photoUrl: "/uploads/catalog/test-service.webp",
          photoBlurData: "data:image/webp;base64,TESTBLURDATA",
          state: "AVAILABLE",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.id).toBeDefined();
      expect(json.data.name).toBe("Full Body Massage");
      expect(json.data.description).toBe("Relaxing deep tissue massage");
      expect(json.data.price).toBe("50.00");
      expect(json.data.categoryId).toBe(category.id);
      expect(json.data.estimatedMinutes).toBe(60);
      expect(json.data.photoUrl).toBe("/uploads/catalog/test-service.webp");
      expect(json.data.photoBlurData).toBe("data:image/webp;base64,TESTBLURDATA");
      expect(json.data.state).toBe("AVAILABLE");
    });
  });
});
