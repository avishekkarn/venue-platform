import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../../../app/api/auth/login/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { setSessionCookie } from "@/infrastructure/auth/cookies";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  setSessionCookie: vi.fn().mockResolvedValue(undefined),
  getSessionCookie: vi.fn().mockResolvedValue(null),
  clearSessionCookie: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/auth/login Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticates valid credentials, sets session cookie, and returns staff with allowed areas (200)", async () => {
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
        username: "alice_login_test",
        passwordHash: hashedPassword,
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "alice_login_test",
          password: "password123",
        }),
      });

      const response = await POST(request, { db: tx });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.staff.username).toBe("alice_login_test");
      expect(json.data.staff.name).toBe("Alice Manager");
      expect(json.data.staff.roles).toEqual([StaffRole.MANAGER]);
      expect(Array.isArray(json.data.allowedAreas)).toBe(true);
      expect(json.data.allowedAreas.length).toBeGreaterThan(0);
      expect(json.data.allowedAreas).toContain("admin");

      expect(setSessionCookie).toHaveBeenCalledTimes(1);
      expect(setSessionCookie).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it("rejects invalid password with UNAUTHORIZED (401)", async () => {
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
        name: "Bob Chef",
        username: "bob_login_test",
        passwordHash: hashedPassword,
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "bob_login_test",
          password: "wrongpassword",
        }),
      });

      const response = await POST(request, { db: tx });
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("Incorrect username or password");
      expect(setSessionCookie).not.toHaveBeenCalled();
    });
  });

  it("rejects request with missing password field with VALIDATION_FAILED (400)", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "alice",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe("VALIDATION_FAILED");
    expect(json.error.message).toBe("username and password are required");
    expect(setSessionCookie).not.toHaveBeenCalled();
  });
});
