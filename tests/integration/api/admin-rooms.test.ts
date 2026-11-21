import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET as getCategories, POST as postCategory, setTestDbClient as setCatDb } from "@/../app/api/admin/rooms/categories/route";
import { PATCH as patchCategory, DELETE as deleteCategory, setTestDbClient as setCatDynDb } from "@/../app/api/admin/rooms/categories/[id]/route";
import { GET as getRooms, POST as postRoom, setTestDbClient as setRoomDb } from "@/../app/api/admin/rooms/route";
import { PATCH as patchRoom, DELETE as deleteRoom, setTestDbClient as setRoomDynDb } from "@/../app/api/admin/rooms/[id]/route";
import { POST as endRoomSession, setTestDbClient as setEndSessionDb } from "@/../app/api/admin/rooms/[id]/end-session/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
import { RoomState } from "@/domain/organization/room.repository";
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

describe("Admin Rooms & Categories API Integration Tests (Milestone 8.5.4)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "admin-rooms-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setCatDb(null);
    setCatDynDb(null);
    setRoomDb(null);
    setRoomDynDb(null);
    setEndSessionDb(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  it("returns 401 UNAUTHORIZED when session is missing", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/admin/rooms", {
      method: "GET",
    });

    const response = await getRooms(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("returns 403 FORBIDDEN when user has insufficient role (LEADER without admin)", async () => {
    await withTransaction(async (db) => {
      setRoomDb(db);
      const venueRepo = createPrismaVenueRepository(db);
      const staffRepo = createPrismaStaffRepository(db);

      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venue = venueRes.value;

      const pwHash = await hashPassword("password123");
      const leader = await staffRepo.create({
        venueId: venue.id,
        name: "Leader Staff",
        username: `leader-${Date.now()}`,
        passwordHash: pwHash,
        roles: [StaffRole.LEADER],
      });
      expect(leader.ok).toBe(true);
      if (!leader.ok) return;

      const session = await createSession(db, leader.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/rooms", {
        method: "GET",
      });

      const response = await getRooms(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("rejects duplicate room number with 409 CONFLICT", async () => {
    await withTransaction(async (db) => {
      setRoomDb(db);
      const venueRepo = createPrismaVenueRepository(db);
      const staffRepo = createPrismaStaffRepository(db);
      const roomRepo = createPrismaRoomRepository(db);

      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venue = venueRes.value;

      const pwHash = await hashPassword("password123");
      const owner = await staffRepo.create({
        venueId: venue.id,
        name: "Owner Staff",
        username: `owner-${Date.now()}`,
        passwordHash: pwHash,
        roles: [StaffRole.OWNER],
      });
      expect(owner.ok).toBe(true);
      if (!owner.ok) return;

      const session = await createSession(db, owner.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("valid-csrf");

      const existingNumber = `DUP-${Date.now()}`;
      await roomRepo.create(venue.id, {
        number: existingNumber,
      });

      const dupPostReq = new NextRequest("http://localhost/api/admin/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          number: existingNumber,
        }),
      });
      const dupPostRes = await postRoom(dupPostReq);
      expect(dupPostRes.status).toBe(409);
    });
  });

  it("allows admin to create category with basePrice, create room, list, update, and delete", async () => {
    await withTransaction(async (db) => {
      setCatDb(db);
      setCatDynDb(db);
      setRoomDb(db);
      setRoomDynDb(db);
      setEndSessionDb(db);

      const venueRepo = createPrismaVenueRepository(db);
      const staffRepo = createPrismaStaffRepository(db);
      const roomRepo = createPrismaRoomRepository(db);

      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueRes = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueRes.ok).toBe(true);
      if (!venueRes.ok) return;
      const venue = venueRes.value;

      const pwHash = await hashPassword("password123");
      const manager = await staffRepo.create({
        venueId: venue.id,
        name: "Manager Staff",
        username: `mgr-${Date.now()}`,
        passwordHash: pwHash,
        roles: [StaffRole.MANAGER],
      });
      expect(manager.ok).toBe(true);
      if (!manager.ok) return;

      const session = await createSession(db, manager.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("valid-csrf");

      // 1. Create a Room Category with basePrice (NPR 3,500)
      const catReq = new NextRequest("http://localhost/api/admin/rooms/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          name: "Test Super Deluxe",
          description: "Spacious with mountain view",
          basePrice: 3500,
          sortOrder: 1,
        }),
      });

      const catRes = await postCategory(catReq);
      expect(catRes.status).toBe(201);
      const catJson = await catRes.json();
      expect(catJson.data.name).toBe("Test Super Deluxe");
      expect(catJson.data.basePrice).toBe("3500.00");
      const categoryId = catJson.data.id;

      // 2. Create a Room under this category
      const roomNumber = `R-TEST-${Date.now()}`;
      const createRoomReq = new NextRequest("http://localhost/api/admin/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          number: roomNumber,
          categoryId,
          state: "VACANT",
        }),
      });
      const createRoomRes = await postRoom(createRoomReq);
      expect(createRoomRes.status).toBe(201);
      const roomJson = await createRoomRes.json();
      expect(roomJson.data.number).toBe(roomNumber);
      const roomId = roomJson.data.id;

      // 3. List rooms and verify category inclusion
      const listReq = new NextRequest("http://localhost/api/admin/rooms", { method: "GET" });
      const listRes = await getRooms(listReq);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();
      const foundRoom = listJson.data.find((r: { id: string }) => r.id === roomId);
      expect(foundRoom).toBeDefined();
      expect(foundRoom.category.name).toBe("Test Super Deluxe");
      expect(foundRoom.category.basePrice).toBe("3500.00");

      // 4. Create an active guest session on this room
      const qrToken = await db.qrToken.create({
        data: {
          venueId: venue.id,
          placeType: "ROOM",
          roomId,
          state: "ACTIVE",
        },
      });
      await db.guestSession.create({
        data: {
          venueId: venue.id,
          roomId,
          placeType: "ROOM",
          qrTokenId: qrToken.id,
          token: "active-guest-room-token",
        },
      });
      await roomRepo.setState(venue.id, roomId, RoomState.OCCUPIED);

      // 5. Attempting to change state away from OCCUPIED while session is active returns 409
      const conflictPatchReq = new NextRequest(`http://localhost/api/admin/rooms/${roomId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          state: "VACANT",
        }),
      });
      const conflictPatchRes = await patchRoom(conflictPatchReq, { params: Promise.resolve({ id: roomId }) });
      expect(conflictPatchRes.status).toBe(409);

      // 6. Admin force-ends the room session
      const endSessionReq = new NextRequest(`http://localhost/api/admin/rooms/${roomId}/end-session`, {
        method: "POST",
        headers: {
          "X-CSRF-Token": "valid-csrf",
        },
      });
      const endSessionRes = await endRoomSession(endSessionReq, { params: Promise.resolve({ id: roomId }) });
      expect(endSessionRes.status).toBe(200);

      // Verify room state is now VACANT
      const roomAfter = await roomRepo.findById(venue.id, roomId);
      expect(roomAfter.ok).toBe(true);
      if (roomAfter.ok) {
        expect(roomAfter.value.state).toBe("VACANT");
      }

      // 7. Update category basePrice
      const patchCatReq = new NextRequest(`http://localhost/api/admin/rooms/categories/${categoryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "valid-csrf",
        },
        body: JSON.stringify({
          basePrice: 4200,
        }),
      });
      const patchCatRes = await patchCategory(patchCatReq, { params: Promise.resolve({ id: categoryId }) });
      expect(patchCatRes.status).toBe(200);
      const patchCatJson = await patchCatRes.json();
      expect(patchCatJson.data.basePrice).toBe("4200.00");

      // 8. Delete room
      const deleteRoomReq = new NextRequest(`http://localhost/api/admin/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "valid-csrf",
        },
      });
      const deleteRoomRes = await deleteRoom(deleteRoomReq, { params: Promise.resolve({ id: roomId }) });
      expect(deleteRoomRes.status).toBe(200);

      // 9. Delete category
      const deleteCatReq = new NextRequest(`http://localhost/api/admin/rooms/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": "valid-csrf",
        },
      });
      const deleteCatRes = await deleteCategory(deleteCatReq, { params: Promise.resolve({ id: categoryId }) });
      expect(deleteCatRes.status).toBe(200);
    });
  });
});
