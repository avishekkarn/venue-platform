import { describe, it, expect } from "vitest";
import { enforceSingleSession } from "@/domain/auth/enforce-single-session";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole } from "@/domain/auth/staff.repository";
import {
  createSession,
  validateSession,
  invalidateAllSessions,
} from "@/infrastructure/auth/session";
import { withTransaction } from "../setup";

describe("Single-session-per-staff-member integration tests (D-3.4)", () => {
  it("invalidates existing session when enforceSingleSession is called before creating a new session", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Single Session Venue",
        slug: `venue-${Date.now()}-single-session`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: `alice_${Date.now()}`,
        passwordHash: "$argon2id$mockhash",
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const staffMemberId = staffResult.value.id;

      // 1. Create first session (Device A)
      const sessionA = await createSession(tx, staffMemberId);
      expect(sessionA.token).toBeDefined();

      const validAInitially = await validateSession(tx, sessionA.token);
      expect(validAInitially).not.toBeNull();
      expect(validAInitially?.id).toBe(sessionA.id);

      // 2. Call enforceSingleSession before logging in on Device B (D-3.4)
      const enforceResult = await enforceSingleSession(
        { invalidateAllSessions: (id) => invalidateAllSessions(tx, id) },
        staffMemberId
      );
      expect(enforceResult.ok).toBe(true);

      // 3. Create second session (Device B)
      const sessionB = await createSession(tx, staffMemberId);
      expect(sessionB.token).toBeDefined();

      // 4. Assert session A is now invalid, and session B is valid
      const validAAfter = await validateSession(tx, sessionA.token);
      expect(validAAfter).toBeNull();

      const validB = await validateSession(tx, sessionB.token);
      expect(validB).not.toBeNull();
      expect(validB?.id).toBe(sessionB.id);
      expect(validB?.staffMemberId).toBe(staffMemberId);
    });
  });

  it("returns ok(undefined) when called with no active sessions (idempotency)", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Idempotent Session Venue",
        slug: `venue-${Date.now()}-idempotent-session`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Bob Chef",
        username: `bob_${Date.now()}`,
        passwordHash: "$argon2id$mockhash",
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const staffMemberId = staffResult.value.id;

      // Call enforceSingleSession when no sessions exist
      const result = await enforceSingleSession(
        { invalidateAllSessions: (id) => invalidateAllSessions(tx, id) },
        staffMemberId
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeUndefined();
      }
    });
  });
});
