import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { TableState } from "@/domain/organization/table.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

describe("TableRepository Integration Tests", () => {
  it("returns NOT_FOUND when reading a non-existent table", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Test Venue",
        slug: `venue-${Date.now()}-table-404`,
        taxRate: "0.1000",
        modules: ["TABLE"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const byIdResult = await tableRepo.findById(
        venueId,
        "00000000-0000-0000-0000-000000000000"
      );
      expect(byIdResult.ok).toBe(false);
      if (!byIdResult.ok) {
        expect(byIdResult.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      const byNumberResult = await tableRepo.findByNumber(venueId, "NONEXISTENT");
      expect(byNumberResult.ok).toBe(false);
      if (!byNumberResult.ok) {
        expect(byNumberResult.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("creates a table and reads it back with correct shape", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Table Venue",
        slug: `venue-${Date.now()}-table-crud`,
        taxRate: "0.0800",
        modules: ["TABLE"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      // Create table
      const createResult = await tableRepo.create(venueId, {
        number: "T-101",
        state: TableState.FREE,
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const created = createResult.value;
      expect(created.id).toBeDefined();
      expect(created.venueId).toBe(venueId);
      expect(created.number).toBe("T-101");
      expect(created.state).toBe(TableState.FREE);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      // Read by ID
      const byIdResult = await tableRepo.findById(venueId, created.id);
      expect(byIdResult.ok).toBe(true);
      if (byIdResult.ok) {
        expect(byIdResult.value.id).toBe(created.id);
        expect(byIdResult.value.number).toBe("T-101");
        expect(byIdResult.value.state).toBe(TableState.FREE);
      }

      // Read by Number
      const byNumberResult = await tableRepo.findByNumber(venueId, "T-101");
      expect(byNumberResult.ok).toBe(true);
      if (byNumberResult.ok) {
        expect(byNumberResult.value.id).toBe(created.id);
        expect(byNumberResult.value.number).toBe("T-101");
      }

      // List for Venue
      const listResult = await tableRepo.listForVenue(venueId);
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toHaveLength(1);
        expect(listResult.value[0]?.number).toBe("T-101");
      }

      // Set State
      const setStateResult = await tableRepo.setState(
        venueId,
        created.id,
        TableState.OCCUPIED
      );
      expect(setStateResult.ok).toBe(true);
      if (setStateResult.ok) {
        expect(setStateResult.value.state).toBe(TableState.OCCUPIED);
      }
    });
  });

  it("returns CONFLICT when creating a table with a duplicate number in the same venue", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Conflict Venue",
        slug: `venue-${Date.now()}-table-conflict`,
        taxRate: "0.0500",
        modules: ["TABLE"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const first = await tableRepo.create(venueId, {
        number: "T-200",
      });
      expect(first.ok).toBe(true);

      const duplicate = await tableRepo.create(venueId, {
        number: "T-200",
      });
      expect(duplicate.ok).toBe(false);
      if (!duplicate.ok) {
        expect(duplicate.error.code).toBe(DomainErrorCode.CONFLICT);
      }
    });
  });
});
