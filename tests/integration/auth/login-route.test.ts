import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, setTestDbClient } from "../../../app/api/auth/login/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getCsrfCookie } from "@/infrastructure/csrf/cookies";
import { resetRateLimiter } from "@/infrastructure/auth/rate-limiter";

describe("POST /api/auth/login Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimiter();
  });

  afterEach(() => {
    setTestDbClient(null);
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
        headers: { "Content-Type": "application/json", "X-CSRF-Token": "test-csrf-token" },
        body: JSON.stringify({
          username: "alice_login_test",
          password: "password123",
        }),
      });

      setTestDbClient(tx);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.staff.username).toBe("alice_login_test");
      expect(json.data.staff.name).toBe("Alice Manager");
      expect(json.data.staff.roles).toEqual([StaffRole.MANAGER]);
      expect(Array.isArray(json.data.allowedAreas)).toBe(true);
      expect(json.data.allowedAreas.length).toBeGreaterThan(0);
      expect(json.data.allowedAreas).toContain("admin");
      expect(json.data.landingRoute).toBe("/admin");

      const setCookie = response.headers.get("set-cookie") ?? "";
      expect(setCookie).toMatch(/venue_staff=[^;]+/);
      expect(setCookie).toMatch(/HttpOnly/i);
      expect(setCookie).toMatch(/SameSite=Lax/i);
    });
  });

  it("authenticates staff member with TABLE_SERVICE and LEADER roles and returns /staff landingRoute (200)", async () => {
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
        name: "Charlie Leader",
        username: "charlie_login_test",
        passwordHash: hashedPassword,
        roles: [StaffRole.TABLE_SERVICE, StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const request = new NextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": "test-csrf-token" },
        body: JSON.stringify({
          username: "charlie_login_test",
          password: "password123",
        }),
      });

      setTestDbClient(tx);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.staff.username).toBe("charlie_login_test");
      expect(json.data.landingRoute).toBe("/staff");
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
        headers: { "Content-Type": "application/json", "X-CSRF-Token": "test-csrf-token" },
        body: JSON.stringify({
          username: "bob_login_test",
          password: "wrongpassword",
        }),
      });

      setTestDbClient(tx);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
      const response = await POST(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("Incorrect username or password");
      expect(response.headers.get("set-cookie")).toBeNull();
    });
  });

  it("rejects request with missing password field with VALIDATION_FAILED (400)", async () => {
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRF-Token": "test-csrf-token" },
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
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects POST without X-CSRF-Token header with 403 FORBIDDEN (CSRF enforcement)", async () => {
    // No valid credentials needed — the CSRF check runs before any body
    // parse or password verification.
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "any-username",
        password: "any-password",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);

    const json = await response.json();
    expect(json.error).toBeDefined();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rate limit: 5 failed logins from the same IP, the 6th returns 429 RATE_LIMITED", async () => {
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
        name: "Rate Limit Staff",
        username: "ratelimit1",
        passwordHash: hashedPassword,
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      setTestDbClient(tx);

      vi.mocked(getCsrfCookie).mockResolvedValue("csrf-abc-123");

      const makeReq = (password: string): NextRequest =>
        new NextRequest("http://localhost/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "csrf-abc-123",
            "x-forwarded-for": "203.0.113.42",
          },
          body: JSON.stringify({ username: "ratelimit1", password }),
        });

      for (let i = 0; i < 5; i++) {
        const res = await POST(makeReq("wrong-password"));
        expect(res.status).toBe(401);
      }
      const sixth = await POST(makeReq("wrong-password"));
      expect(sixth.status).toBe(429);
      const sixthBody = (await sixth.json()) as {
        error?: { code?: string; message?: string };
      };
      expect(sixthBody.error?.code).toBe("RATE_LIMITED");
      expect(typeof sixthBody.error?.message).toBe("string");
      const message = sixthBody.error?.message ?? "";
      expect(message).toContain("minute");
      expect(/\d/.test(message)).toBe(true);
    });
  });

  it("rate limit: a successful login clears the failed-attempt counter", async () => {
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
        name: "Rate Limit Staff 2",
        username: "ratelimit2",
        passwordHash: hashedPassword,
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      setTestDbClient(tx);

      vi.mocked(getCsrfCookie).mockResolvedValue("csrf-abc-123");

      const makeReq = (password: string): NextRequest =>
        new NextRequest("http://localhost/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "csrf-abc-123",
            "x-forwarded-for": "203.0.113.43",
          },
          body: JSON.stringify({ username: "ratelimit2", password }),
        });

      // 4 failed attempts.
      for (let i = 0; i < 4; i++) {
        const res = await POST(makeReq("wrong-password"));
        expect(res.status).toBe(401);
      }
      // A successful login clears the bucket.
      const success = await POST(makeReq("password123"));
      expect(success.status).toBe(200);
      // 5 more failed attempts after the success: all 401, not 429.
      for (let i = 0; i < 5; i++) {
        const res = await POST(makeReq("wrong-password"));
        expect(res.status).toBe(401);
      }
    });
  });

  it("rate limit: a 400 VALIDATION_FAILED does not count against the limit", async () => {
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
        name: "Rate Limit Staff 3",
        username: "ratelimit3",
        passwordHash: hashedPassword,
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      setTestDbClient(tx);

      vi.mocked(getCsrfCookie).mockResolvedValue("csrf-abc-123");

      const makeBadBody = (): NextRequest =>
        new NextRequest("http://localhost/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "csrf-abc-123",
            "x-forwarded-for": "203.0.113.44",
          },
          body: JSON.stringify({ username: "ratelimit3" }),
        });

      // 10 requests with a missing password field: each 400, none counts.
      for (let i = 0; i < 10; i++) {
        const res = await POST(makeBadBody());
        expect(res.status).toBe(400);
      }
      // The limiter is still at 0 for this IP; a 401 is reachable, not a 429.
      const makeWrongPassword = (): NextRequest =>
        new NextRequest("http://localhost/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "csrf-abc-123",
            "x-forwarded-for": "203.0.113.44",
          },
          body: JSON.stringify({ username: "ratelimit3", password: "wrong" }),
        });
      const first = await POST(makeWrongPassword());
      expect(first.status).toBe(401);
    });
  });
});
