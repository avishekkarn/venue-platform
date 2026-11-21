import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET as getCategories, POST as postCategory, setTestDbClient as setCatDb } from "@/../app/api/admin/tables/categories/route";
import { PATCH as patchCategory, DELETE as deleteCategory, setTestDbClient as setCatDynDb } from "@/../app/api/admin/tables/categories/[id]/route";
import { GET as getTables, POST as postTable, setTestDbClient as setTableDb } from "@/../app/api/admin/tables/route";
import { PATCH as patchTable, DELETE as deleteTable, setTestDbClient as setTableDynDb } from "@/../app/api/admin/tables/[id]/route";
import { POST as endTableSession, setTestDbClient as setEndSessionDb } from "@/../app/api/admin/tables/[id]/end-session/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
import { TableState } from "@/domain/organization/table.repository";
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

describe("Admin Tables & Categories API Integration Tests (Milestone 8.5.2)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "admin-tables-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setCatDb(null);
    setCatDynDb(null);
    setTableDb(null);
    setTableDynDb(null);
    setEndSessionDb(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  it("returns 401 UNAUTHORIZED when session is missing", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/admin/tables", {
      method: "GET",
    });

    const response = await getTables(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("returns 403 FORBIDDEN when user has LEADER role (insufficient permissions)", async () => {
    await withTransaction(async (db) => {
      setTableDb(db);

      const venueRepo = createPrismaVenueRepository(db);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venue = venueRes.value;

      const staffRepo = createPrismaStaffRepository(db);
      const pwHash = await hashPassword("password123");
      const leader = await staffRepo.create({
        venueId: venue.id,
        name: "Leader Staff",
        username: "leader-test",
        passwordHash: pwHash,
        roles: [StaffRole.LEADER],
      });
      expect(leader.ok).toBe(true);
      if (!leader.ok) return;

      const session = await createSession(db, leader.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/tables", {
        method: "GET",
      });

      const response = await getTables(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("performs full table category CRUD including isReserved flag", async () => {
    await withTransaction(async (db) => {
      setCatDb(db);
      setCatDynDb(db);

      const venueRepo = createPrismaVenueRepository(db);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venue = venueRes.value;

      const staffRepo = createPrismaStaffRepository(db);
      const pwHash = await hashPassword("password123");
      const manager = await staffRepo.create({
        venueId: venue.id,
        name: "Manager Staff",
        username: "manager-cat-test",
        passwordHash: pwHash,
        roles: [StaffRole.MANAGER],
      });
      expect(manager.ok).toBe(true);
      if (!manager.ok) return;

      const session = await createSession(db, manager.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("valid-csrf");

      // 1. Create Reserved category
      const createReq = new NextRequest("http://localhost/api/admin/tables/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          name: "Terrace Reserved",
          description: "Exclusive reserved terrace tables",
          isReserved: true,
          sortOrder: 10,
        }),
      });

      const createRes = await postCategory(createReq);
      expect(createRes.status).toBe(201);
      const createdJson = await createRes.json();
      expect(createdJson.data.name).toBe("Terrace Reserved");
      expect(createdJson.data.isReserved).toBe(true);
      const catId = createdJson.data.id;

      // 2. Read categories
      const listReq = new NextRequest("http://localhost/api/admin/tables/categories", {
        method: "GET",
      });
      const listRes = await getCategories(listReq);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();
      const found = listJson.data.find((c: { id: string }) => c.id === catId);
      expect(found).toBeDefined();
      expect(found.isReserved).toBe(true);

      // 3. Patch category
      const patchReq = new NextRequest(`http://localhost/api/admin/tables/categories/${catId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          name: "Terrace VIP Reserved",
          description: "Updated description",
        }),
      });
      const patchRes = await patchCategory(patchReq, { params: Promise.resolve({ id: catId }) });
      expect(patchRes.status).toBe(200);
      const patchedJson = await patchRes.json();
      expect(patchedJson.data.name).toBe("Terrace VIP Reserved");

      // 4. Delete category
      const deleteReq = new NextRequest(`http://localhost/api/admin/tables/categories/${catId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "valid-csrf",
        },
      });
      const deleteRes = await deleteCategory(deleteReq, { params: Promise.resolve({ id: catId }) });
      expect(deleteRes.status).toBe(204);
    });
  });

  it("rejects duplicate table number with 409 CONFLICT", async () => {
    await withTransaction(async (db) => {
      setTableDb(db);

      const venueRepo = createPrismaVenueRepository(db);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venue = venueRes.value;

      const staffRepo = createPrismaStaffRepository(db);
      const pwHash = await hashPassword("password123");
      const manager = await staffRepo.create({
        venueId: venue.id,
        name: "Manager Staff",
        username: "manager-dup-test",
        passwordHash: pwHash,
        roles: [StaffRole.MANAGER],
      });
      expect(manager.ok).toBe(true);
      if (!manager.ok) return;

      const session = await createSession(db, manager.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("valid-csrf");

      // Create first table
      const postReq1 = new NextRequest("http://localhost/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({ number: "Table Dup" }),
      });
      const postRes1 = await postTable(postReq1);
      expect(postRes1.status).toBe(201);

      // Create duplicate table
      const dupReq = new NextRequest("http://localhost/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({ number: "Table Dup" }),
      });
      const dupRes = await postTable(dupReq);
      expect(dupRes.status).toBe(409);
    });
  });

  it("performs full Table CRUD, enforces conflict rules, and terminates active sessions", async () => {
    await withTransaction(async (db) => {
      setCatDb(db);
      setTableDb(db);
      setTableDynDb(db);
      setEndSessionDb(db);

      const venueRepo = createPrismaVenueRepository(db);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venue = venueRes.value;

      const staffRepo = createPrismaStaffRepository(db);
      const pwHash = await hashPassword("password123");
      const manager = await staffRepo.create({
        venueId: venue.id,
        name: "Manager Staff",
        username: "manager-table-test",
        passwordHash: pwHash,
        roles: [StaffRole.MANAGER],
      });
      expect(manager.ok).toBe(true);
      if (!manager.ok) return;

      const session = await createSession(db, manager.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("valid-csrf");

      // 1. Create a category
      const tableRepo = createPrismaTableRepository(db);
      const catRes = await tableRepo.createCategory(venue.id, {
        name: "Test Patio",
        isReserved: false,
        sortOrder: 1,
      });
      expect(catRes.ok).toBe(true);
      if (!catRes.ok) return;
      const categoryId = catRes.value.id;

      // 2. Create table with custom name
      const postReq = new NextRequest("http://localhost/api/admin/tables", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          number: "Patio VIP 1",
          categoryId,
          state: "FREE",
        }),
      });
      const postRes = await postTable(postReq);
      expect(postRes.status).toBe(201);
      const tableJson = await postRes.json();
      expect(tableJson.data.number).toBe("Patio VIP 1");
      expect(tableJson.data.categoryId).toBe(categoryId);
      const tableId = tableJson.data.id;

      // 3. List tables with details
      const listReq = new NextRequest("http://localhost/api/admin/tables", { method: "GET" });
      const listRes = await getTables(listReq);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();
      const foundTable = listJson.data.find((t: { id: string }) => t.id === tableId);
      expect(foundTable).toBeDefined();
      expect(foundTable.category.name).toBe("Test Patio");

      // 4. Create an active guest session on this table
      const qrToken = await db.qrToken.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId,
          state: "ACTIVE",
        },
      });
      const guestSession = await db.guestSession.create({
        data: {
          venueId: venue.id,
          tableId,
          placeType: "TABLE",
          qrTokenId: qrToken.id,
          token: "active-guest-token",
        },
      });
      await tableRepo.setState(venue.id, tableId, TableState.OCCUPIED);

      // 5. Attempting to change state away from OCCUPIED while session is active returns 409
      const conflictPatchReq = new NextRequest(`http://localhost/api/admin/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          state: "FREE",
        }),
      });
      const conflictPatchRes = await patchTable(conflictPatchReq, { params: Promise.resolve({ id: tableId }) });
      expect(conflictPatchRes.status).toBe(409);

      // 6. Attempting to delete table while session is active returns 409
      const conflictDeleteReq = new NextRequest(`http://localhost/api/admin/tables/${tableId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "valid-csrf",
        },
      });
      const conflictDeleteRes = await deleteTable(conflictDeleteReq, { params: Promise.resolve({ id: tableId }) });
      expect(conflictDeleteRes.status).toBe(409);

      // 7. Force End Session via POST /api/admin/tables/[id]/end-session
      const endReq = new NextRequest(`http://localhost/api/admin/tables/${tableId}/end-session`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": "valid-csrf",
        },
      });
      const endRes = await endTableSession(endReq, { params: Promise.resolve({ id: tableId }) });
      expect(endRes.status).toBe(200);

      // Verify session is ended and table state is FREE
      const sessionAfter = await db.guestSession.findUnique({ where: { id: guestSession.id } });
      expect(sessionAfter?.endedAt).not.toBeNull();
      const tableAfter = await tableRepo.findById(venue.id, tableId);
      expect(tableAfter.ok).toBe(true);
      if (tableAfter.ok) {
        expect(tableAfter.value.state).toBe(TableState.FREE);
      }

      // 8. Now table can be safely deleted
      const finalDeleteReq = new NextRequest(`http://localhost/api/admin/tables/${tableId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "valid-csrf",
        },
      });
      const finalDeleteRes = await deleteTable(finalDeleteReq, { params: Promise.resolve({ id: tableId }) });
      expect(finalDeleteRes.status).toBe(204);
    });
  });
});
