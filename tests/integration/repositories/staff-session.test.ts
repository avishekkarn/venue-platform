import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaStaffSessionRepository } from "@/infrastructure/db/repositories/staff-session.repo";
import { StaffRole } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

describe("StaffSessionRepository Integration Tests", () => {
  it("returns NOT_FOUND when looking up an unknown token", async () => {
    await withTransaction(async (tx) => {
      const sessionRepo = createPrismaStaffSessionRepository(tx);

      const byToken = await sessionRepo.findByToken(
        "00000000-0000-0000-0000-000000000000"
      );
      expect(byToken.ok).toBe(false);
      if (!byToken.ok) {
        expect(byToken.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("returns ok([]) when listing active sessions for a staff member with no sessions", async () => {
    await withTransaction(async (tx) => {
      const sessionRepo = createPrismaStaffSessionRepository(tx);

      const listResult = await sessionRepo.listActiveForStaff(
        "00000000-0000-0000-0000-000000000000"
      );
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toEqual([]);
      }
    });
  });

  it("creates a session, finds by token, lists active, and ends by id", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const sessionRepo = createPrismaStaffSessionRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Session Test Venue",
        slug: `venue-${Date.now()}-session`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Dave Host",
        username: "dave_host",
        passwordHash: "$hash",
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const staffMemberId = staffResult.value.id;
      const sessionToken = `staff-tok-${Date.now()}`;

      // 1. Create session
      const createResult = await sessionRepo.create({
        staffMemberId,
        token: sessionToken,
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const session = createResult.value;
      expect(session.id).toBeDefined();
      expect(session.staffMemberId).toBe(staffMemberId);
      expect(session.token).toBe(sessionToken);
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.endedAt).toBeNull();

      // 2. findByToken returns created session
      const byTokenResult = await sessionRepo.findByToken(sessionToken);
      expect(byTokenResult.ok).toBe(true);
      if (byTokenResult.ok) {
        expect(byTokenResult.value.id).toBe(session.id);
        expect(byTokenResult.value.token).toBe(sessionToken);
      }

      // 3. listActiveForStaff includes the active session
      const activeList = await sessionRepo.listActiveForStaff(staffMemberId);
      expect(activeList.ok).toBe(true);
      if (activeList.ok) {
        expect(activeList.value).toHaveLength(1);
        expect(activeList.value[0]?.id).toBe(session.id);
      }

      // 4. endById sets endedAt
      const endResult = await sessionRepo.endById(session.id);
      expect(endResult.ok).toBe(true);
      if (endResult.ok) {
        expect(endResult.value.endedAt).toBeInstanceOf(Date);
      }

      // 5. listActiveForStaff no longer includes the ended session
      const activeAfterEnd = await sessionRepo.listActiveForStaff(staffMemberId);
      expect(activeAfterEnd.ok).toBe(true);
      if (activeAfterEnd.ok) {
        expect(activeAfterEnd.value).toHaveLength(0);
      }

      // 6. endById on already-ended session returns INVALID_STATE
      const secondEnd = await sessionRepo.endById(session.id);
      expect(secondEnd.ok).toBe(false);
      if (!secondEnd.ok) {
        expect(secondEnd.error.code).toBe(DomainErrorCode.INVALID_STATE);
      }
    });
  });

  it("ends all active sessions for a staff member via endAllForStaff and returns count", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const sessionRepo = createPrismaStaffSessionRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Multi-Session Venue",
        slug: `venue-${Date.now()}-multi-session`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Eve Concierge",
        username: "eve_concierge",
        passwordHash: "$hash",
        roles: [StaffRole.CONCIERGE],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const staffMemberId = staffResult.value.id;

      // Create two active sessions
      const s1 = await sessionRepo.create({
        staffMemberId,
        token: `session-tok-1-${Date.now()}`,
      });
      const s2 = await sessionRepo.create({
        staffMemberId,
        token: `session-tok-2-${Date.now()}`,
      });
      expect(s1.ok).toBe(true);
      expect(s2.ok).toBe(true);

      // Verify active count is 2
      const beforeEnd = await sessionRepo.listActiveForStaff(staffMemberId);
      expect(beforeEnd.ok).toBe(true);
      if (beforeEnd.ok) {
        expect(beforeEnd.value).toHaveLength(2);
      }

      // endAllForStaff returns ok(2)
      const endAllResult = await sessionRepo.endAllForStaff(staffMemberId);
      expect(endAllResult.ok).toBe(true);
      if (endAllResult.ok) {
        expect(endAllResult.value).toBe(2);
      }

      // listActiveForStaff now returns ok([])
      const afterEnd = await sessionRepo.listActiveForStaff(staffMemberId);
      expect(afterEnd.ok).toBe(true);
      if (afterEnd.ok) {
        expect(afterEnd.value).toEqual([]);
      }
    });
  });
});
