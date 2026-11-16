import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  GET,
  POST,
  setTestDbClient as setCollectionsTestDbClient,
} from "@/../app/api/admin/menu/collections/route";
import {
  PATCH,
  DELETE as DELETE_COLLECTION,
  setTestDbClient as setCollectionDynamicTestDbClient,
} from "@/../app/api/admin/menu/collections/[id]/route";
import {
  POST as POST_ITEM,
  DELETE as DELETE_ITEM,
  setTestDbClient as setCollectionItemsTestDbClient,
} from "@/../app/api/admin/menu/collections/[id]/items/route";
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

describe("Admin Menu Collections API Integration Tests (8.3.5c.B)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "menu-collections-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setCollectionsTestDbClient(null);
    setCollectionDynamicTestDbClient(null);
    setCollectionItemsTestDbClient(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  it("Test 1: returns 401 UNAUTHORIZED when session is missing (GET)", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/admin/menu/collections", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("Test 2: returns 403 FORBIDDEN for LEADER role (POST)", async () => {
    await withTransaction(async (tx) => {
      setCollectionsTestDbClient(tx);
      setCollectionDynamicTestDbClient(tx);
      setCollectionItemsTestDbClient(tx);

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
        username: "leader_menu_collection_create",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost/api/admin/menu/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({ name: "Specials" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("Test 3: returns 400 VALIDATION_FAILED when name is missing (POST)", async () => {
    await withTransaction(async (tx) => {
      setCollectionsTestDbClient(tx);
      setCollectionDynamicTestDbClient(tx);
      setCollectionItemsTestDbClient(tx);

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
        username: "alice_menu_collection_400",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost/api/admin/menu/collections", {
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

  it("Test 4: full lifecycle (201 / 200 / 200 / 201 / 204 / 204 / 200)", async () => {
    await withTransaction(async (tx) => {
      setCollectionsTestDbClient(tx);
      setCollectionDynamicTestDbClient(tx);
      setCollectionItemsTestDbClient(tx);

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
        username: "alice_menu_coll_lifecycle",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      // b. Seed a category and menu item for collection item testing
      const catResult = await menuRepo.createCategory({
        venueId,
        name: "Seasonal",
        sortOrder: 1,
      });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryIds: [catResult.value.id],
        name: "Truffle Fries",
        price: "12.00",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;
      const menuItemId = itemResult.value.id;

      // c. POST creates a collection -> 201
      const createReq = new NextRequest("http://localhost/api/admin/menu/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          name: "Weekend Specials",
          featuredFrom: "2026-06-01T00:00:00.000Z",
          featuredTo: "2026-06-30T23:59:59.000Z",
          sortOrder: 1,
        }),
      });
      const createRes = await POST(createReq);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      expect(createJson.data.name).toBe("Weekend Specials");
      const collectionId = createJson.data.id;

      // d. GET with ?at= lists it -> 200
      const getAtReq = new NextRequest(
        "http://localhost/api/admin/menu/collections?at=2026-06-15T12:00:00.000Z",
        { method: "GET" }
      );
      const getAtRes = await GET(getAtReq);
      expect(getAtRes.status).toBe(200);
      const getAtJson = await getAtRes.json();
      expect(getAtJson.data.some((c: { id: string }) => c.id === collectionId)).toBe(true);

      // e. PATCH renames it -> 200
      const patchReq = new NextRequest(
        `http://localhost/api/admin/menu/collections/${collectionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({ name: "Summer Weekend Specials" }),
        }
      );
      const patchRes = await PATCH(patchReq, {
        params: Promise.resolve({ id: collectionId }),
      });
      expect(patchRes.status).toBe(200);
      const patchJson = await patchRes.json();
      expect(patchJson.data.name).toBe("Summer Weekend Specials");

      // f. POST item adds a menu item to collection -> 201
      const addItemReq = new NextRequest(
        `http://localhost/api/admin/menu/collections/${collectionId}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({ menuItemId, sortOrder: 1 }),
        }
      );
      const addItemRes = await POST_ITEM(addItemReq, {
        params: Promise.resolve({ id: collectionId }),
      });
      expect(addItemRes.status).toBe(201);
      const addItemJson = await addItemRes.json();
      expect(addItemJson.data.menuItemId).toBe(menuItemId);

      // g. DELETE item removes the item from collection -> 204
      const delItemReq = new NextRequest(
        `http://localhost/api/admin/menu/collections/${collectionId}/items`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({ menuItemId }),
        }
      );
      const delItemRes = await DELETE_ITEM(delItemReq, {
        params: Promise.resolve({ id: collectionId }),
      });
      expect(delItemRes.status).toBe(204);

      // h. DELETE collection deletes the collection -> 204
      const delCollReq = new NextRequest(
        `http://localhost/api/admin/menu/collections/${collectionId}`,
        {
          method: "DELETE",
          headers: {
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
        }
      );
      const delCollRes = await DELETE_COLLECTION(delCollReq, {
        params: Promise.resolve({ id: collectionId }),
      });
      expect(delCollRes.status).toBe(204);

      // i. GET /api/admin/menu/collections -> 200, collection no longer listed
      const finalGetReq = new NextRequest(
        "http://localhost/api/admin/menu/collections",
        { method: "GET" }
      );
      const finalGetRes = await GET(finalGetReq);
      expect(finalGetRes.status).toBe(200);
      const finalGetJson = await finalGetRes.json();
      expect(finalGetJson.data.some((c: { id: string }) => c.id === collectionId)).toBe(false);
    });
  });
});
