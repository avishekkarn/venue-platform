import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

describe("VenueRepository Integration Tests", () => {
  it("creates a venue and reads it by ID and slug", async () => {
    await withTransaction(async (tx) => {
      const repo = createPrismaVenueRepository(tx);
      const slug = `venue-${Date.now()}`;

      const createResult = await repo.create({
        name: "Grand Hotel & Bistro",
        slug,
        brandColor: "#2E5A44",
        taxRate: "0.0825",
        modules: ["TABLE", "ROOM", "KITCHEN"],
        services: ["ROOM_SERVICE_FOOD", "HOUSEKEEPING"],
      });

      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const created = createResult.value;
      expect(created.name).toBe("Grand Hotel & Bistro");
      expect(created.slug).toBe(slug);
      expect(created.brandColor).toBe("#2E5A44");
      expect(created.taxRate).toBe("0.0825");
      expect(created.modules).toContain("TABLE");
      expect(created.modules).toContain("ROOM");
      expect(created.modules).toContain("KITCHEN");
      expect(created.modules).not.toContain("COUNTER");
      expect(created.services).toContain("ROOM_SERVICE_FOOD");
      expect(created.services).toContain("HOUSEKEEPING");

      // Verify findById
      const byIdResult = await repo.findById(created.id);
      expect(byIdResult.ok).toBe(true);
      if (byIdResult.ok) {
        expect(byIdResult.value.id).toBe(created.id);
        expect(byIdResult.value.slug).toBe(slug);
      }

      // Verify findBySlug
      const bySlugResult = await repo.findBySlug(slug);
      expect(bySlugResult.ok).toBe(true);
      if (bySlugResult.ok) {
        expect(bySlugResult.value.id).toBe(created.id);
        expect(bySlugResult.value.slug).toBe(slug);
      }
    });
  });

  it("returns NOT_FOUND when reading a non-existent venue", async () => {
    await withTransaction(async (tx) => {
      const repo = createPrismaVenueRepository(tx);

      const byIdResult = await repo.findById("00000000-0000-0000-0000-000000000000");
      expect(byIdResult.ok).toBe(false);
      if (!byIdResult.ok) {
        expect(byIdResult.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      const bySlugResult = await repo.findBySlug("non-existent-slug");
      expect(bySlugResult.ok).toBe(false);
      if (!bySlugResult.ok) {
        expect(bySlugResult.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("returns CONFLICT when creating a venue with a duplicate slug", async () => {
    await withTransaction(async (tx) => {
      const repo = createPrismaVenueRepository(tx);
      const slug = `duplicate-${Date.now()}`;

      const first = await repo.create({
        name: "First Venue",
        slug,
        taxRate: "0.0500",
      });
      expect(first.ok).toBe(true);

      const duplicate = await repo.create({
        name: "Second Venue with same slug",
        slug,
        taxRate: "0.0500",
      });
      expect(duplicate.ok).toBe(false);
      if (!duplicate.ok) {
        expect(duplicate.error.code).toBe(DomainErrorCode.CONFLICT);
      }
    });
  });
});
