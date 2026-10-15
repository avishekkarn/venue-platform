import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { RoomState } from "@/domain/organization/room.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

describe("RoomRepository Integration Tests", () => {
  it("returns NOT_FOUND when reading a non-existent room", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Test Venue",
        slug: `venue-${Date.now()}-room-404`,
        taxRate: "0.1000",
        modules: ["ROOM"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const byIdResult = await roomRepo.findById(
        venueId,
        "00000000-0000-0000-0000-000000000000"
      );
      expect(byIdResult.ok).toBe(false);
      if (!byIdResult.ok) {
        expect(byIdResult.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      const byNumberResult = await roomRepo.findByNumber(venueId, "NONEXISTENT");
      expect(byNumberResult.ok).toBe(false);
      if (!byNumberResult.ok) {
        expect(byNumberResult.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("creates a room and reads it back with correct shape", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Room Venue",
        slug: `venue-${Date.now()}-room-crud`,
        taxRate: "0.0800",
        modules: ["ROOM"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      // Create room
      const createResult = await roomRepo.create(venueId, {
        number: "R-301",
        state: RoomState.VACANT,
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const created = createResult.value;
      expect(created.id).toBeDefined();
      expect(created.venueId).toBe(venueId);
      expect(created.number).toBe("R-301");
      expect(created.state).toBe(RoomState.VACANT);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      // Read by ID
      const byIdResult = await roomRepo.findById(venueId, created.id);
      expect(byIdResult.ok).toBe(true);
      if (byIdResult.ok) {
        expect(byIdResult.value.id).toBe(created.id);
        expect(byIdResult.value.number).toBe("R-301");
        expect(byIdResult.value.state).toBe(RoomState.VACANT);
      }

      // Read by Number
      const byNumberResult = await roomRepo.findByNumber(venueId, "R-301");
      expect(byNumberResult.ok).toBe(true);
      if (byNumberResult.ok) {
        expect(byNumberResult.value.id).toBe(created.id);
        expect(byNumberResult.value.number).toBe("R-301");
      }

      // List for Venue
      const listResult = await roomRepo.listForVenue(venueId);
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toHaveLength(1);
        expect(listResult.value[0]?.number).toBe("R-301");
      }

      // Set State
      const setStateResult = await roomRepo.setState(
        venueId,
        created.id,
        RoomState.CLEANING
      );
      expect(setStateResult.ok).toBe(true);
      if (setStateResult.ok) {
        expect(setStateResult.value.state).toBe(RoomState.CLEANING);
      }
    });
  });

  it("returns CONFLICT when creating a room with a duplicate number in the same venue", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Conflict Venue",
        slug: `venue-${Date.now()}-room-conflict`,
        taxRate: "0.0500",
        modules: ["ROOM"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const first = await roomRepo.create(venueId, {
        number: "R-400",
      });
      expect(first.ok).toBe(true);

      const duplicate = await roomRepo.create(venueId, {
        number: "R-400",
      });
      expect(duplicate.ok).toBe(false);
      if (!duplicate.ok) {
        expect(duplicate.error.code).toBe(DomainErrorCode.CONFLICT);
      }
    });
  });
});
