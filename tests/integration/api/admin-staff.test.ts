import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { withTransaction } from "../setup";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import {
  GET as getStaffHandler,
  POST as postStaffHandler,
  setTestDbClient as setStaffTestDb,
} from "@/../app/api/admin/staff/route";
import {
  PATCH as patchStaffHandler,
  setTestDbClient as setPatchTestDb,
} from "@/../app/api/admin/staff/[id]/route";
import {
  POST as resetPasswordHandler,
  setTestDbClient as setResetTestDb,
} from "@/../app/api/admin/staff/[id]/reset-password/route";
import {
  GET as getActivityHandler,
  setTestDbClient as setActivityTestDb,
} from "@/../app/api/admin/staff/[id]/activity/route";

vi.mock("@/infrastructure/auth/cookies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/auth/cookies")>();
  return {
    ...actual,
    getSessionCookie: vi.fn(),
  };
});

vi.mock("@/infrastructure/csrf/cookies", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/infrastructure/csrf/cookies")>();
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("Admin Staff Management API Integration Tests (Milestone 8.6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setStaffTestDb(null);
    setPatchTestDb(null);
    setResetTestDb(null);
    setActivityTestDb(null);
  });

  it("GET /api/admin/staff returns staff accounts, summary metrics, and active hours", async () => {
    await withTransaction(async (tx) => {
      setStaffTestDb(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Staff Test Venue",
        slug: venueSlug,
        taxRate: "0.13",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      // Create Admin Staff Member
      const adminStaff = await staffRepo.create({
        venueId,
        name: "Alice Admin",
        username: "alice_admin",
        passwordHash: await hashPassword("AdminSecret123"),
        roles: [StaffRole.OWNER, StaffRole.MANAGER],
      });
      expect(adminStaff.ok).toBe(true);
      if (!adminStaff.ok) return;

      // Create Waiter Staff Member (ended shift)
      const waiterStaff = await staffRepo.create({
        venueId,
        name: "Waiter Bob",
        username: "waiter_bob",
        passwordHash: await hashPassword("WaiterSecret123"),
        roles: [StaffRole.TABLE_SERVICE, StaffRole.ROOM_SERVICE],
      });
      expect(waiterStaff.ok).toBe(true);
      if (!waiterStaff.ok) return;

      // Create Shift Leader Staff Member (session started > 24 hours ago, still active per D-3.2)
      const leaderStaff = await staffRepo.create({
        venueId,
        name: "Charlie Leader",
        username: "charlie_leader",
        passwordHash: await hashPassword("LeaderSecret123"),
        roles: [StaffRole.LEADER],
      });
      expect(leaderStaff.ok).toBe(true);
      if (!leaderStaff.ok) return;

      // Create active session for admin (live now)
      const adminSession = await tx.staffSession.create({
        data: {
          staffMemberId: adminStaff.value.id,
          token: "admin-session-token",
          createdAt: new Date(),
        },
      });

      // Create active session for leader from 30 hours ago (still active per D-3.2)
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
      await tx.staffSession.create({
        data: {
          staffMemberId: leaderStaff.value.id,
          token: "leader-session-token",
          createdAt: thirtyHoursAgo,
          endedAt: null,
        },
      });

      // Create historical ended session for waiter (2 hours duration)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      await tx.staffSession.create({
        data: {
          staffMemberId: waiterStaff.value.id,
          token: "waiter-session-token",
          createdAt: twoHoursAgo,
          endedAt: new Date(),
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(adminSession.token);

      const req = new NextRequest("http://localhost:3000/api/admin/staff", {
        method: "GET",
      });

      const res = await getStaffHandler(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(body.data.summary.totalStaff).toBe(3);
      expect(body.data.summary.activeStaff).toBe(3);
      expect(body.data.summary.onlineStaff).toBe(2); // Alice and Charlie are online
      expect(body.data.staff).toHaveLength(3);

      const alice = body.data.staff.find((s: { username: string }) => s.username === "alice_admin");
      expect(alice.isOnline).toBe(true);
      expect(alice.roles).toContain(StaffRole.OWNER);

      const charlie = body.data.staff.find((s: { username: string }) => s.username === "charlie_leader");
      expect(charlie.isOnline).toBe(true);
      expect(charlie.roles).toEqual([StaffRole.LEADER]);

      const bob = body.data.staff.find((s: { username: string }) => s.username === "waiter_bob");
      expect(bob.isOnline).toBe(false);
      expect(bob.roles).toEqual([StaffRole.TABLE_SERVICE, StaffRole.ROOM_SERVICE]);
      expect(bob.totalHistoricalHours).toBeGreaterThanOrEqual(1.9);
    });
  });

  it("POST /api/admin/staff creates a new staff account with hashed password and assigned roles", async () => {
    await withTransaction(async (tx) => {
      setStaffTestDb(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Staff Post Venue",
        slug: venueSlug,
        taxRate: "0.13",
      });
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const adminStaff = await staffRepo.create({
        venueId,
        name: "Admin Alice",
        username: "admin_alice",
        passwordHash: await hashPassword("AdminPass123"),
        roles: [StaffRole.MANAGER],
      });
      if (!adminStaff.ok) return;

      const adminSession = await tx.staffSession.create({
        data: {
          staffMemberId: adminStaff.value.id,
          token: "post-test-session",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(adminSession.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf");

      const req = new NextRequest("http://localhost:3000/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf",
        },
        body: JSON.stringify({
          name: "Charlie Chef",
          username: "charlie_chef",
          password: "SuperSecret123",
          roles: [StaffRole.CHEF],
        }),
      });

      const res = await postStaffHandler(req);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body.data.username).toBe("charlie_chef");
      expect(body.data.name).toBe("Charlie Chef");
      expect(body.data.roles).toEqual([StaffRole.CHEF]);
      expect(body.data.state).toBe(StaffState.ACTIVE);
      expect(body.data.passwordHash).toBeUndefined(); // Never leaks hash
    });
  });

  it("PATCH /api/admin/staff/[id] updates staff roles and invalidates sessions on deactivation", async () => {
    await withTransaction(async (tx) => {
      setPatchTestDb(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Staff Patch Venue",
        slug: venueSlug,
        taxRate: "0.13",
      });
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const adminStaff = await staffRepo.create({
        venueId,
        name: "Admin Alice",
        username: "admin_alice",
        passwordHash: await hashPassword("AdminPass123"),
        roles: [StaffRole.OWNER],
      });
      if (!adminStaff.ok) return;

      const waiter = await staffRepo.create({
        venueId,
        name: "David Waiter",
        username: "david_waiter",
        passwordHash: await hashPassword("DavidPass123"),
        roles: [StaffRole.TABLE_SERVICE],
      });
      if (!waiter.ok) return;

      const adminSession = await tx.staffSession.create({
        data: {
          staffMemberId: adminStaff.value.id,
          token: "patch-test-session",
        },
      });

      const waiterSession = await tx.staffSession.create({
        data: {
          staffMemberId: waiter.value.id,
          token: "waiter-active-session",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(adminSession.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf");

      // 1. Update roles
      const updateRoleReq = new NextRequest(
        `http://localhost:3000/api/admin/staff/${waiter.value.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf",
          },
          body: JSON.stringify({
            name: "David Senior Waiter",
            roles: [StaffRole.TABLE_SERVICE, StaffRole.ROOM_SERVICE],
          }),
        }
      );

      const updateRes = await patchStaffHandler(updateRoleReq, {
        params: Promise.resolve({ id: waiter.value.id }),
      });
      expect(updateRes.status).toBe(200);
      const updateBody = await updateRes.json();
      expect(updateBody.data.name).toBe("David Senior Waiter");
      expect(updateBody.data.roles).toEqual([StaffRole.TABLE_SERVICE, StaffRole.ROOM_SERVICE]);

      // 2. Deactivate waiter
      const deactReq = new NextRequest(
        `http://localhost:3000/api/admin/staff/${waiter.value.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf",
          },
          body: JSON.stringify({
            state: StaffState.DEACTIVATED,
          }),
        }
      );

      const deactRes = await patchStaffHandler(deactReq, {
        params: Promise.resolve({ id: waiter.value.id }),
      });
      expect(deactRes.status).toBe(200);
      const deactBody = await deactRes.json();
      expect(deactBody.data.state).toBe(StaffState.DEACTIVATED);

      // Verify waiter's active session was invalidated in DB
      const updatedSession = await tx.staffSession.findUnique({
        where: { id: waiterSession.id },
      });
      expect(updatedSession?.endedAt).not.toBeNull();
    });
  });

  it("POST /api/admin/staff/[id]/reset-password updates password and invalidates sessions", async () => {
    await withTransaction(async (tx) => {
      setResetTestDb(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Staff Reset Venue",
        slug: venueSlug,
        taxRate: "0.13",
      });
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const adminStaff = await staffRepo.create({
        venueId,
        name: "Admin Alice",
        username: "admin_alice",
        passwordHash: await hashPassword("AdminPass123"),
        roles: [StaffRole.OWNER],
      });
      if (!adminStaff.ok) return;

      const staffTarget = await staffRepo.create({
        venueId,
        name: "Eve Housekeeping",
        username: "eve_hk",
        passwordHash: await hashPassword("OldPass12345"),
        roles: [StaffRole.HOUSEKEEPING],
      });
      if (!staffTarget.ok) return;

      const adminSession = await tx.staffSession.create({
        data: {
          staffMemberId: adminStaff.value.id,
          token: "reset-admin-session",
        },
      });

      const targetSession = await tx.staffSession.create({
        data: {
          staffMemberId: staffTarget.value.id,
          token: "target-active-session",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(adminSession.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf");

      const resetReq = new NextRequest(
        `http://localhost:3000/api/admin/staff/${staffTarget.value.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf",
          },
          body: JSON.stringify({
            password: "NewBrandSecret999",
          }),
        }
      );

      const resetRes = await resetPasswordHandler(resetReq, {
        params: Promise.resolve({ id: staffTarget.value.id }),
      });
      expect(resetRes.status).toBe(200);
      const body = await resetRes.json();
      expect(body.data.success).toBe(true);

      // Verify active session was terminated
      const sessionAfter = await tx.staffSession.findUnique({
        where: { id: targetSession.id },
      });
      expect(sessionAfter?.endedAt).not.toBeNull();
    });
  });

  it("GET /api/admin/staff/[id]/activity returns detailed shift timeline and duty hours", async () => {
    await withTransaction(async (tx) => {
      setActivityTestDb(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Staff Activity Venue",
        slug: venueSlug,
        taxRate: "0.13",
      });
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const adminStaff = await staffRepo.create({
        venueId,
        name: "Admin Alice",
        username: "admin_alice",
        passwordHash: await hashPassword("AdminPass123"),
        roles: [StaffRole.OWNER],
      });
      if (!adminStaff.ok) return;

      const adminSession = await tx.staffSession.create({
        data: {
          staffMemberId: adminStaff.value.id,
          token: "activity-admin-session",
        },
      });

      vi.mocked(getSessionCookie).mockResolvedValue(adminSession.token);

      const activityReq = new NextRequest(
        `http://localhost:3000/api/admin/staff/${adminStaff.value.id}/activity`,
        { method: "GET" }
      );

      const activityRes = await getActivityHandler(activityReq, {
        params: Promise.resolve({ id: adminStaff.value.id }),
      });
      expect(activityRes.status).toBe(200);

      const body = await activityRes.json();
      expect(body.data.staffMember.username).toBe("admin_alice");
      expect(body.data.activity).toBeDefined();
      expect(body.data.activity.isOnline).toBe(true);
      expect(body.data.activity.recentSessions).toHaveLength(1);
    });
  });
});
