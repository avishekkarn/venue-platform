import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, setTestDbClient } from "../../../app/api/auth/logout/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { createSession } from "@/infrastructure/auth/session";
import { getSessionCookie, clearSessionCookie } from "@/infrastructure/auth/cookies";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  setSessionCookie: vi.fn().mockResolvedValue(undefined),
  getSessionCookie: vi.fn().mockResolvedValue(null),
  clearSessionCookie: vi.fn().mockResolvedValue(undefined),
}));

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

describe("POST /api/auth/logout Route Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("logs out valid session: marks session as ended, clears cookie, returns success (200)", async () => {
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
        username: "alice_logout_test",
        passwordHash: hashedPassword,
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": "test-csrf-token" },
      });

      setTestDbClient(tx);
      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({ data: { success: true } });
      expect(clearSessionCookie).toHaveBeenCalledTimes(1);

      const sessionInDb = await tx.staffSession.findUnique({
        where: { id: session.id },
      });
      expect(sessionInDb).not.toBeNull();
      expect(sessionInDb?.endedAt).not.toBeNull();
    });
  });

  it("handles request with no cookie: clears cookie and returns success (200)", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: { "X-CSRF-Token": "test-csrf-token" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual({ data: { success: true } });
    expect(clearSessionCookie).toHaveBeenCalledTimes(1);
  });

  it("handles request with invalid token: clears cookie and returns success (200)", async () => {
    await withTransaction(async (tx) => {
      vi.mocked(getSessionCookie).mockResolvedValue("non-existent-token-12345");
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": "test-csrf-token" },
      });

      setTestDbClient(tx);
      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toEqual({ data: { success: true } });
      expect(clearSessionCookie).toHaveBeenCalledTimes(1);
    });
  });

  it("rejects POST without X-CSRF-Token header with 403 FORBIDDEN (CSRF enforcement)", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue("any-token");
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

    const request = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
    expect(clearSessionCookie).not.toHaveBeenCalled();
  });
});
