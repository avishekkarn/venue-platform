import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, setTestDbClient } from "@/../app/api/admin/qr/[id]/revoke/route";
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

describe("POST /api/admin/qr/[id]/revoke Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("valid revoke of an ACTIVE token returns 200 and marks state REVOKED", async () => {
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

      const qrToken = await tx.qrToken.create({
        data: {
          venueId: venueResult.value.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "ACTIVE",
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_revoke_valid",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        `http://localhost/api/admin/qr/${qrToken.id}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: qrToken.id }),
      });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(json.data.id).toBe(qrToken.id);
      expect(json.data.state).toBe("REVOKED");
      expect(typeof json.data.revokedAt).toBe("string");

      const row = await tx.qrToken.findUnique({
        where: { id: qrToken.id },
      });
      expect(row).not.toBeNull();
      expect(row?.state).toBe("REVOKED");
      expect(row?.revokedAt).not.toBeNull();
    });
  });

  it("cross-venue isolation: token from other venue returns 404 NOT_FOUND and remains ACTIVE", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueA = await venueRepo.create({
        name: "Venue A",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueA.ok).toBe(true);
      if (!venueA.ok) return;

      const venueB = await venueRepo.create({
        name: "Venue B",
        slug: "venue-b-other",
        taxRate: "0.0825",
      });
      expect(venueB.ok).toBe(true);
      if (!venueB.ok) return;

      const tableB = await tx.table.create({
        data: {
          venueId: venueB.value.id,
          number: "201",
        },
      });

      const tokenB = await tx.qrToken.create({
        data: {
          venueId: venueB.value.id,
          placeType: "TABLE",
          tableId: tableB.id,
          state: "ACTIVE",
        },
      });

      // Staff belonging to Venue A
      const staffA = await staffRepo.create({
        venueId: venueA.value.id,
        name: "Alice Manager A",
        username: "alice_manager_a",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffA.ok).toBe(true);
      if (!staffA.ok) return;

      const sessionA = await createSession(tx, staffA.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(sessionA.token);

      const request = new NextRequest(
        `http://localhost/api/admin/qr/${tokenB.id}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: tokenB.id }),
      });
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.error.code).toBe("NOT_FOUND");
      expect(json.error.message).toBe("QR token not found");

      // Verify token B is still ACTIVE in db
      const rowB = await tx.qrToken.findUnique({
        where: { id: tokenB.id },
      });
      expect(rowB?.state).toBe("ACTIVE");
      expect(rowB?.revokedAt).toBeNull();
    });
  });

  it("malformed token id returns 400 VALIDATION_FAILED", async () => {
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
        username: "alice_malformed_revoke",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        "http://localhost/api/admin/qr/not-a-uuid/revoke",
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: "not-a-uuid" }),
      });
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
      expect(json.error.message).toBe("Invalid token format");
    });
  });

  it("unknown UUID returns 404 NOT_FOUND", async () => {
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
        username: "alice_unknown_uuid",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const unknownId = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/admin/qr/${unknownId}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: unknownId }),
      });
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.error.code).toBe("NOT_FOUND");
      expect(json.error.message).toBe("QR token not found");
    });
  });

  it("already-revoked token returns 409 INVALID_STATE", async () => {
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
          number: "102",
        },
      });

      const qrToken = await tx.qrToken.create({
        data: {
          venueId: venueResult.value.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "REVOKED",
          revokedAt: new Date(),
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_already_revoked",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        `http://localhost/api/admin/qr/${qrToken.id}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: qrToken.id }),
      });
      expect(response.status).toBe(409);

      const json = await response.json();
      expect(json.error.code).toBe("INVALID_STATE");
      expect(json.error.message).toBe("QR token is already revoked");
    });
  });

  it("no session cookie returns 401 UNAUTHORIZED", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const someId = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/admin/qr/${someId}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: someId }),
      });
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("No active session");
    });
  });

  it("invalid session token returns 401 UNAUTHORIZED", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      vi.mocked(getSessionCookie).mockResolvedValue("non-existent-session-token");

      const someId = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/admin/qr/${someId}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: someId }),
      });
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("No active session");
    });
  });

  it("deactivated staff member returns 401 UNAUTHORIZED", async () => {
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
        username: "alice_deactivated_revoke",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      // Deactivate staff
      await staffRepo.setState(
        venueResult.value.id,
        staffResult.value.id,
        StaffState.DEACTIVATED
      );

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const someId = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/admin/qr/${someId}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: someId }),
      });
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("No active session");
    });
  });

  it("CHEF role returns 403 FORBIDDEN (mandatory negative)", async () => {
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
        username: "chef_charlie_revoke",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const someId = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/admin/qr/${someId}/revoke`,
        { method: "POST" }
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: someId }),
      });
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toBe("Insufficient permissions");
    });
  });
});
