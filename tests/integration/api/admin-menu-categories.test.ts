import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET, POST, setTestDbClient as setCategoriesTestDbClient } from "@/../app/api/admin/menu/categories/route";
import { PATCH, DELETE, setTestDbClient as setCategoryDynamicTestDbClient } from "@/../app/api/admin/menu/categories/[id]/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
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

describe("Admin Menu Categories API Integration Tests (8.3.5)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "menu-categories-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setCategoriesTestDbClient(null);
    setCategoryDynamicTestDbClient(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  it("Test 1: returns 401 UNAUTHORIZED when session is missing (GET)", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/admin/menu/categories", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("Test 2: returns 403 FORBIDDEN for LEADER role (POST)", async () => {
    await withTransaction(async (tx) => {
      setCategoriesTestDbClient(tx);
      setCategoryDynamicTestDbClient(tx);

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
        username: "leader_menu_category_create",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost/api/admin/menu/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ name: "Starters" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("Test 3: returns 400 VALIDATION_FAILED when name is missing (POST)", async () => {
    await withTransaction(async (tx) => {
      setCategoriesTestDbClient(tx);
      setCategoryDynamicTestDbClient(tx);

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
        username: "alice_menu_category_400",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost/api/admin/menu/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ sortOrder: 1 }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(json.error.message).toContain("name is required");
    });
  });

  it("Test 4: full lifecycle (200 / 201 / 204 / 409)", async () => {
    await withTransaction(async (tx) => {
      setCategoriesTestDbClient(tx);
      setCategoryDynamicTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      // a. Venue and Manager setup
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
        username: "alice_menu_category_lifecycle",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      // b. POST Starters -> 201
      const createReq1 = new NextRequest("http://localhost/api/admin/menu/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ name: "Starters", sortOrder: 1 }),
      });
      const createRes1 = await POST(createReq1);
      expect(createRes1.status).toBe(201);
      const json1 = await createRes1.json();
      expect(json1.data.name).toBe("Starters");
      const firstId = json1.data.id;

      // c. POST Mains -> 201
      const createReq2 = new NextRequest("http://localhost/api/admin/menu/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ name: "Mains", sortOrder: 2 }),
      });
      const createRes2 = await POST(createReq2);
      expect(createRes2.status).toBe(201);
      const json2 = await createRes2.json();
      expect(json2.data.name).toBe("Mains");
      const secondId = json2.data.id;

      // d. PATCH /<firstId> name: "Appetizers" -> 200
      const patchReq = new NextRequest(`http://localhost/api/admin/menu/categories/${firstId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ name: "Appetizers" }),
      });
      const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: firstId }) });
      expect(patchRes.status).toBe(200);
      const patchJson = await patchRes.json();
      expect(patchJson.data.name).toBe("Appetizers");

      // e. Create a MenuItem in the first category
      const itemResult = await menuRepo.createItem({
        venueId,
        categoryIds: [firstId],
        name: "Soup",
        price: "5.00",
      });
      expect(itemResult.ok).toBe(true);

      // f. DELETE /<firstId> -> 409 CONFLICT (join-aware contract)
      const deleteReq1 = new NextRequest(`http://localhost/api/admin/menu/categories/${firstId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
      });
      const deleteRes1 = await DELETE(deleteReq1, { params: Promise.resolve({ id: firstId }) });
      expect(deleteRes1.status).toBe(409);
      const deleteJson1 = await deleteRes1.json();
      expect(deleteJson1.error.code).toBe(DomainErrorCode.CONFLICT);
      expect(deleteJson1.error.message).toContain("has 1 item(s)");

      // g. DELETE /<secondId> -> 204 No Content
      const deleteReq2 = new NextRequest(`http://localhost/api/admin/menu/categories/${secondId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
      });
      const deleteRes2 = await DELETE(deleteReq2, { params: Promise.resolve({ id: secondId }) });
      expect(deleteRes2.status).toBe(204);
      expect(deleteRes2.body).toBeNull();

      // h. GET /api/admin/menu/categories -> 200, category named "Appetizers" remains
      const getReq = new NextRequest("http://localhost/api/admin/menu/categories", {
        method: "GET",
      });
      const getRes = await GET(getReq);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson.data).toBeDefined();
      expect(getJson.data.length).toBe(1);
      expect(getJson.data[0].id).toBe(firstId);
      expect(getJson.data[0].name).toBe("Appetizers");
    });
  });
});
