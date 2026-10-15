import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

describe("StaffRepository Integration Tests", () => {
  it("returns NOT_FOUND when looking up a non-existent staff member by ID or username", async () => {
    await withTransaction(async (tx) => {
      const staffRepo = createPrismaStaffRepository(tx);
      const fakeVenueId = "00000000-0000-0000-0000-000000000000";

      const byId = await staffRepo.findById(
        fakeVenueId,
        "00000000-0000-0000-0000-000000000000"
      );
      expect(byId.ok).toBe(false);
      if (!byId.ok) {
        expect(byId.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      const byUsername = await staffRepo.findByUsername(
        fakeVenueId,
        "nonexistent_user"
      );
      expect(byUsername.ok).toBe(false);
      if (!byUsername.ok) {
        expect(byUsername.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("creates a staff member, reads via findById (public shape) and findByUsername (credentials shape)", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Staff Test Venue",
        slug: `venue-${Date.now()}-staff`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      // 1. Create staff member
      const createResult = await staffRepo.create({
        venueId,
        name: "Alice Chef",
        username: "alice_chef",
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakehash123",
        roles: [StaffRole.CHEF, StaffRole.TABLE_SERVICE],
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const created = createResult.value;
      expect(created.id).toBeDefined();
      expect(created.venueId).toBe(venueId);
      expect(created.name).toBe("Alice Chef");
      expect(created.username).toBe("alice_chef");
      expect(created.state).toBe(StaffState.ACTIVE);
      // Public shape should not expose passwordHash
      expect("passwordHash" in created).toBe(false);

      // 2. findById returns public shape with mapped domain roles
      const byIdResult = await staffRepo.findById(venueId, created.id);
      expect(byIdResult.ok).toBe(true);
      if (byIdResult.ok) {
        const staff = byIdResult.value;
        expect(staff.id).toBe(created.id);
        expect(staff.roles).toEqual([StaffRole.CHEF, StaffRole.TABLE_SERVICE]);
        expect("passwordHash" in staff).toBe(false);
      }

      // 3. findByUsername returns credentials shape with passwordHash
      const byUsernameResult = await staffRepo.findByUsername(
        venueId,
        "alice_chef"
      );
      expect(byUsernameResult.ok).toBe(true);
      if (byUsernameResult.ok) {
        const creds = byUsernameResult.value;
        expect(creds.id).toBe(created.id);
        expect(creds.username).toBe("alice_chef");
        expect(creds.passwordHash).toBe(
          "$argon2id$v=19$m=65536,t=3,p=4$fakehash123"
        );
        expect(creds.roles).toContain(StaffRole.CHEF);
      }
    });
  });

  it("returns CONFLICT when creating a staff member with a duplicate [venueId, username]", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Conflict Staff Venue",
        slug: `venue-${Date.now()}-conflict-staff`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const first = await staffRepo.create({
        venueId,
        name: "Bob Manager",
        username: "bob_mgr",
        passwordHash: "$fakehash",
        roles: [StaffRole.MANAGER],
      });
      expect(first.ok).toBe(true);

      const duplicate = await staffRepo.create({
        venueId,
        name: "Bob Impostor",
        username: "bob_mgr",
        passwordHash: "$anotherfakehash",
        roles: [StaffRole.FRONT_DESK],
      });
      expect(duplicate.ok).toBe(false);
      if (!duplicate.ok) {
        expect(duplicate.error.code).toBe(DomainErrorCode.CONFLICT);
      }
    });
  });

  it("updates password hash and deactivates staff member without deleting the row", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Lifecycle Staff Venue",
        slug: `venue-${Date.now()}-lifecycle-staff`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const createResult = await staffRepo.create({
        venueId,
        name: "Charlie Server",
        username: "charlie_s",
        passwordHash: "$initialHash",
        roles: [StaffRole.TABLE_SERVICE],
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const staffId = createResult.value.id;

      // Update password hash
      const updateHashResult = await staffRepo.updatePasswordHash(
        venueId,
        staffId,
        "$newUpdatedHash999"
      );
      expect(updateHashResult.ok).toBe(true);
      if (updateHashResult.ok) {
        expect("passwordHash" in updateHashResult.value).toBe(false);
      }

      // Verify new hash via findByUsername
      const readCreds = await staffRepo.findByUsername(venueId, "charlie_s");
      expect(readCreds.ok).toBe(true);
      if (readCreds.ok) {
        expect(readCreds.value.passwordHash).toBe("$newUpdatedHash999");
      }

      // Deactivate staff member
      const deactivateResult = await staffRepo.setState(
        venueId,
        staffId,
        StaffState.DEACTIVATED
      );
      expect(deactivateResult.ok).toBe(true);
      if (deactivateResult.ok) {
        expect(deactivateResult.value.state).toBe(StaffState.DEACTIVATED);
      }

      // Verify row still exists in database
      const readAfterDeactivate = await staffRepo.findById(venueId, staffId);
      expect(readAfterDeactivate.ok).toBe(true);
      if (readAfterDeactivate.ok) {
        expect(readAfterDeactivate.value.state).toBe(StaffState.DEACTIVATED);
      }
    });
  });

  it("lists staff members for venue with optional state filter", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);

      const venueResult = await venueRepo.create({
        name: "List Staff Venue",
        slug: `venue-${Date.now()}-list-staff`,
        taxRate: "0.0500",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const staff1 = await staffRepo.create({
        venueId,
        name: "Staff Active",
        username: "staff_active",
        passwordHash: "$hash1",
        roles: [StaffRole.FRONT_DESK],
      });
      const staff2 = await staffRepo.create({
        venueId,
        name: "Staff To Deactivate",
        username: "staff_deactivated",
        passwordHash: "$hash2",
        roles: [StaffRole.HOUSEKEEPING],
      });
      expect(staff1.ok).toBe(true);
      expect(staff2.ok).toBe(true);
      if (!staff1.ok || !staff2.ok) return;

      await staffRepo.setState(
        venueId,
        staff2.value.id,
        StaffState.DEACTIVATED
      );

      // List all
      const listAll = await staffRepo.listForVenue(venueId);
      expect(listAll.ok).toBe(true);
      if (listAll.ok) {
        expect(listAll.value).toHaveLength(2);
      }

      // Filter by ACTIVE
      const listActive = await staffRepo.listForVenue(venueId, {
        state: StaffState.ACTIVE,
      });
      expect(listActive.ok).toBe(true);
      if (listActive.ok) {
        expect(listActive.value).toHaveLength(1);
        expect(listActive.value[0]?.username).toBe("staff_active");
      }
    });
  });
});
