import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PATCH, setTestDbClient } from "@/../app/api/admin/menu/items/[id]/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
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

describe("PATCH /api/admin/menu/items/[id] Route Tests (8.3.3)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "menu-items-patch-audit-test-"));
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

    const id = "11111111-2222-3333-4444-555555555555";
    const request = new NextRequest(`http://localhost/api/admin/menu/items/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "test-csrf-token",
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify({ price: "12.50" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id }) });
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
        username: "leader_menu_item_patch",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const id = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(`http://localhost/api/admin/menu/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ price: "12.50" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id }) });
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("returns 400 VALIDATION_FAILED when body contains invalid price", async () => {
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
        name: "Manager Staff",
        username: "manager_menu_item_patch_400",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const id = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(`http://localhost/api/admin/menu/items/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ price: "abc" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id }) });
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  it("updates item price on 200 with partial body and leaves other fields unchanged", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
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
        username: "alice_menu_item_patch_200",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const categoryResult = await menuRepo.createCategory({
        venueId,
        name: "Mains",
        sortOrder: 1,
      });
      expect(categoryResult.ok).toBe(true);
      if (!categoryResult.ok) return;
      const categoryId = categoryResult.value.id;

      const createResult = await menuRepo.createItem({
        venueId,
        categoryIds: [categoryId],
        name: "Steak Frites",
        description: "Ribeye with hand-cut fries",
        price: "28.00",
        photoUrl: "/uploads/catalog/steak.webp",
        photoBlurData: "data:image/webp;base64,TESTBLUR",
        state: MenuItemState.AVAILABLE,
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;
      const itemId = createResult.value.id;

      const request = new NextRequest(`http://localhost/api/admin/menu/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ price: "32.50" }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: itemId }) });
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe(itemId);
      expect(json.data.price).toBe("32.50");
      expect(json.data.name).toBe("Steak Frites");
      expect(json.data.description).toBe("Ribeye with hand-cut fries");
      expect(json.data.categoryIds).toEqual([categoryId]);
      expect(json.data.photoUrl).toBe("/uploads/catalog/steak.webp");
      expect(json.data.photoBlurData).toBe("data:image/webp;base64,TESTBLUR");
      expect(json.data.state).toBe("AVAILABLE");
    });
  });
});
