import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, setTestDbClient } from "../../../app/api/auth/session/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { createSession, deleteSession } from "@/infrastructure/auth/session";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  setSessionCookie: vi.fn().mockResolvedValue(undefined),
  getSessionCookie: vi.fn().mockResolvedValue(null),
  clearSessionCookie: vi.fn().mockResolvedValue(undefined),
}));

describe("GET /api/auth/session Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("returns active session, staff info, and allowed areas for valid session (200)", async () => {
    await withTransaction(async (tx) => {
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

      const hashedPassword = await hashPassword("password123");
      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_session_test",
        passwordHash: hashedPassword,
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      setTestDbClient(tx);
      const response = await GET();
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.session.id).toBe(session.id);
      expect(json.data.staff.id).toBe(staffResult.value.id);
      expect(json.data.staff.username).toBe("alice_session_test");
      expect(json.data.staff.name).toBe("Alice Manager");
      expect(json.data.staff.roles).toEqual([StaffRole.MANAGER]);
      expect(Array.isArray(json.data.allowedAreas)).toBe(true);
      expect(json.data.allowedAreas.length).toBeGreaterThan(0);
      expect(json.data.allowedAreas).toContain("admin");
    });
  });

  it("returns UNAUTHORIZED (401) when session cookie is missing", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const response = await GET();
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("No active session");
  });

  it("returns UNAUTHORIZED (401) when session token does not match any session", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });

      vi.mocked(getSessionCookie).mockResolvedValue("non-existent-token-12345");

      setTestDbClient(tx);
      const response = await GET();
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("Invalid or expired session");
    });
  });

  it("returns UNAUTHORIZED (401) when session is expired or ended", async () => {
    await withTransaction(async (tx) => {
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

      const hashedPassword = await hashPassword("password123");
      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Bob Staff",
        username: "bob_session_test",
        passwordHash: hashedPassword,
        roles: [StaffRole.TABLE_SERVICE],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      // Mark session as ended via deleteSession
      await deleteSession(tx, session.id);

      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      setTestDbClient(tx);
      const response = await GET();
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("Invalid or expired session");
    });
  });
});
