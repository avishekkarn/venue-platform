import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, setTestDbClient } from "@/../app/api/admin/qr/generate/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

import { getSessionCookie } from "@/infrastructure/auth/cookies";

describe("POST /api/admin/qr/generate Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("creates an active QR token for a TABLE (201)", async () => {
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

      const table = await tx.table.create({
        data: {
          venueId: venueResult.value.id,
          number: "101",
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_manager_table",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "TABLE",
          tableId: table.id,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(json.data.placeType).toBe("TABLE");
      expect(json.data.state).toBe("ACTIVE");
      expect(json.data.venueId).toBe(venueResult.value.id);
      expect(typeof json.data.id).toBe("string");
      expect(typeof json.data.token).toBe("string");
      expect(json.data.token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(typeof json.data.createdAt).toBe("string");

      const rows = await tx.qrToken.findMany({
        where: { venueId: venueResult.value.id, tableId: table.id },
      });
      expect(rows).toHaveLength(1);
    });
  });

  it("creates an active QR token for a ROOM (201)", async () => {
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

      const room = await tx.room.create({
        data: {
          venueId: venueResult.value.id,
          number: "204",
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_manager_room",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "ROOM",
          roomId: room.id,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(json.data.placeType).toBe("ROOM");
      expect(json.data.state).toBe("ACTIVE");

      const rows = await tx.qrToken.findMany({
        where: { venueId: venueResult.value.id, roomId: room.id },
      });
      expect(rows).toHaveLength(1);
    });
  });

  it("creates an active QR token for a COUNTER (201)", async () => {
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

      const counter = await tx.counter.create({
        data: {
          venueId: venueResult.value.id,
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_manager_counter",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "COUNTER",
          counterId: counter.id,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(json.data.placeType).toBe("COUNTER");
      expect(json.data.state).toBe("ACTIVE");

      const rows = await tx.qrToken.findMany({
        where: { venueId: venueResult.value.id, counterId: counter.id },
      });
      expect(rows).toHaveLength(1);
    });
  });

  it("rejects invalid placeType (400 VALIDATION_FAILED)", async () => {
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
        username: "alice_invalid_placetype",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "INVALID",
          tableId: "some-id",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
    });
  });

  it("rejects mismatched place ID (400 VALIDATION_FAILED)", async () => {
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
        username: "alice_mismatched_id",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "TABLE",
          roomId: "some-room-id",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
    });
  });

  it("rejects missing place ID (400 VALIDATION_FAILED)", async () => {
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
        username: "alice_missing_id",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "TABLE",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
    });
  });

  it("rejects malformed JSON (400 VALIDATION_FAILED)", async () => {
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
        username: "alice_malformed_json",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid",
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
      expect(json.error.message).toBe("Invalid JSON body");
    });
  });

  it("rejects request without session cookie (401 UNAUTHORIZED)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "TABLE",
          tableId: "some-id",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("No active session");
    });
  });

  it("rejects request with invalid session token (401 UNAUTHORIZED)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      vi.mocked(getSessionCookie).mockResolvedValue("non-existent-session-token");

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "TABLE",
          tableId: "some-id",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("No active session");
    });
  });

  it("rejects request from deactivated staff member (401 UNAUTHORIZED)", async () => {
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
        name: "Alice Deactivated",
        username: "alice_deactivated",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      // Deactivate staff
      await staffRepo.setState(venueResult.value.id, staffResult.value.id, StaffState.DEACTIVATED);

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "TABLE",
          tableId: "some-id",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("No active session");
    });
  });

  it("rejects request from non-admin role (403 FORBIDDEN)", async () => {
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
        name: "Chef Charlie",
        username: "chef_charlie",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placeType: "TABLE",
          tableId: "some-id",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toBe("Insufficient permissions");
    });
  });

  it("ignores client-supplied venueId in body and uses server-resolved venue (cross-venue rejection)", async () => {
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

      const otherVenueResult = await venueRepo.create({
        name: "Attacker Venue",
        slug: "attacker-venue",
        taxRate: "0.0825",
      });
      expect(otherVenueResult.ok).toBe(true);
      if (!otherVenueResult.ok) return;

      const table = await tx.table.create({
        data: {
          venueId: venueResult.value.id,
          number: "999",
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_cross_venue",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: otherVenueResult.value.id, // Attacker attempts to forge venueId
          placeType: "TABLE",
          tableId: table.id,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.data.venueId).toBe(venueResult.value.id);
      expect(json.data.venueId).not.toBe(otherVenueResult.value.id);

      const rows = await tx.qrToken.findMany({
        where: { id: json.data.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.venueId).toBe(venueResult.value.id);
    });
  });
});
