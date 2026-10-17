import { describe, it, expect } from "vitest";
import { type Prisma } from "@prisma/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { withTransaction } from "../setup";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getOrCreateVenueAndTable(
  tx: Prisma.TransactionClient
): Promise<{ venueId: string; tableId: string }> {
  const existingVenue = await tx.venue.findFirst({
    include: { tables: true },
  });
  if (existingVenue && existingVenue.tables.length > 0) {
    return {
      venueId: existingVenue.id,
      tableId: existingVenue.tables[0]!.id,
    };
  }

  const venueRepo = createPrismaVenueRepository(tx);
  const tableRepo = createPrismaTableRepository(tx);
  const v = await venueRepo.create({
    name: "Guest Session Test Venue",
    slug: `gst-venue-${Date.now()}`,
    taxRate: "0.1000",
    modules: ["TABLE"],
  });
  if (!v.ok) throw new Error("Venue creation failed in test setup");

  const t = await tableRepo.create(v.value.id, {
    number: `T-GS-${Date.now()}`,
  });
  if (!t.ok) throw new Error("Table creation failed in test setup");

  return { venueId: v.value.id, tableId: t.value.id };
}

describe("GuestSessionRepository Integration Tests", () => {
  it("creates a session with ok, endedAt is null, and token is a UUID", async () => {
    await withTransaction(async (tx) => {
      const { venueId, tableId } = await getOrCreateVenueAndTable(tx);
      const repo = createPrismaGuestSessionRepository(tx);

      const result = await repo.create({
        venueId,
        placeType: PlaceType.TABLE,
        placeId: tableId,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value.endedAt).toBeNull();
      expect(result.value.venueId).toBe(venueId);
      expect(result.value.placeType).toBe(PlaceType.TABLE);
      expect(result.value.placeId).toBe(tableId);
      expect(result.value.token).toMatch(UUID_REGEX);
    });
  });

  it("findByToken returns ok(mappedSession) for existing and ok(null) for unknown", async () => {
    await withTransaction(async (tx) => {
      const { venueId, tableId } = await getOrCreateVenueAndTable(tx);
      const repo = createPrismaGuestSessionRepository(tx);

      const created = await repo.create({
        venueId,
        placeType: PlaceType.TABLE,
        placeId: tableId,
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const found = await repo.findByToken(created.value.token);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value).not.toBeNull();
        expect(found.value?.id).toBe(created.value.id);
        expect(found.value?.token).toBe(created.value.token);
        expect(found.value?.placeId).toBe(tableId);
      }

      const unknown = await repo.findByToken(
        "00000000-0000-0000-0000-000000000000"
      );
      expect(unknown.ok).toBe(true);
      if (unknown.ok) {
        expect(unknown.value).toBeNull();
      }
    });
  });

  it("invalidateByToken returns ok, and subsequent findByToken shows endedAt set", async () => {
    await withTransaction(async (tx) => {
      const { venueId, tableId } = await getOrCreateVenueAndTable(tx);
      const repo = createPrismaGuestSessionRepository(tx);

      const created = await repo.create({
        venueId,
        placeType: PlaceType.TABLE,
        placeId: tableId,
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const invalidated = await repo.invalidateByToken(created.value.token);
      expect(invalidated.ok).toBe(true);

      const found = await repo.findByToken(created.value.token);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value).not.toBeNull();
        expect(found.value?.endedAt).not.toBeNull();
        expect(found.value?.endedAt instanceof Date).toBe(true);
      }
    });
  });

  it("invalidateByPlace returns ok(2) after creating two sessions for the same table", async () => {
    await withTransaction(async (tx) => {
      const { venueId, tableId } = await getOrCreateVenueAndTable(tx);
      const repo = createPrismaGuestSessionRepository(tx);

      // Clean up any existing active sessions for this table first
      await repo.invalidateByPlace(venueId, PlaceType.TABLE, tableId);

      const s1 = await repo.create({
        venueId,
        placeType: PlaceType.TABLE,
        placeId: tableId,
      });
      const s2 = await repo.create({
        venueId,
        placeType: PlaceType.TABLE,
        placeId: tableId,
      });
      expect(s1.ok).toBe(true);
      expect(s2.ok).toBe(true);

      const countResult = await repo.invalidateByPlace(
        venueId,
        PlaceType.TABLE,
        tableId
      );
      expect(countResult.ok).toBe(true);
      if (countResult.ok) {
        expect(countResult.value).toBe(2);
      }

      if (s1.ok) {
        const found1 = await repo.findByToken(s1.value.token);
        expect(found1.ok && found1.value?.endedAt !== null).toBe(true);
      }
      if (s2.ok) {
        const found2 = await repo.findByToken(s2.value.token);
        expect(found2.ok && found2.value?.endedAt !== null).toBe(true);
      }
    });
  });
});
