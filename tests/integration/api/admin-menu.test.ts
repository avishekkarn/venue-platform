import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { withTransaction } from "../setup";

/**
 * The admin menu data assembly (8.3.1, F-0004).
 *
 * The page (`app/admin/(shell)/menu/page.tsx`) is a Server Component that
 * reads `menuRepo.getFullMenu(venueId)` directly. There is no route. These
 * tests prove the data shape the page renders:
 *   - `getFullMenu` returns HIDDEN items (the admin view includes them;
 *     the guest tree's `getMenu` excludes them — D-4.2, W-0005),
 *   - all three MenuItemState values map through unchanged,
 *   - an empty menu returns an empty array.
 *
 * The transaction harness is D-3.12; the client injection is D-3.13.
 * No route, no `withCsrf` — this is a read.
 */
describe("The admin menu list data (8.3.1, F-0004)", () => {
  beforeEach(() => {
    // The withTransaction harness handles the rollback.
  });

  afterEach(() => {
    // The harness rolls back; nothing else to reset.
  });

  it("getFullMenu returns HIDDEN items (the admin view includes them)", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const categoryResult = await menuRepo.createCategory({
        venueId,
        name: "Starters",
        sortOrder: 1,
      });
      expect(categoryResult.ok).toBe(true);
      if (!categoryResult.ok) return;
      const categoryId = categoryResult.value.id;

      const availableResult = await menuRepo.createItem({
        venueId,
        categoryId,
        name: "Available Item",
        price: "6.50",
      });
      expect(availableResult.ok).toBe(true);
      if (!availableResult.ok) return;

      const hiddenItemResult = await menuRepo.createItem({
        venueId,
        categoryId,
        name: "Hidden Item",
        price: "9.00",
      });
      expect(hiddenItemResult.ok).toBe(true);
      if (!hiddenItemResult.ok) return;

      const hiddenStateResult = await menuRepo.setItemState(
        venueId,
        hiddenItemResult.value.id,
        MenuItemState.HIDDEN
      );
      expect(hiddenStateResult.ok).toBe(true);

      const menuResult = await menuRepo.getFullMenu(venueId);
      expect(menuResult.ok).toBe(true);
      if (!menuResult.ok) return;

      const allItems = menuResult.value.flatMap((c) => c.items);
      const names = allItems.map((i) => i.name);
      expect(names).toContain("Available Item");
      expect(names).toContain("Hidden Item");
      const hidden = allItems.find((i) => i.name === "Hidden Item");
      expect(hidden).toBeDefined();
      if (hidden) {
        expect(hidden.state).toBe(MenuItemState.HIDDEN);
      }
    });
  });

  it("all three MenuItemState values map through unchanged", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const categoryResult = await menuRepo.createCategory({
        venueId,
        name: "Mains",
        sortOrder: 1,
      });
      expect(categoryResult.ok).toBe(true);
      if (!categoryResult.ok) return;
      const categoryId = categoryResult.value.id;

      for (const state of [
        MenuItemState.AVAILABLE,
        MenuItemState.UNAVAILABLE,
        MenuItemState.HIDDEN,
      ]) {
        const itemResult = await menuRepo.createItem({
          venueId,
          categoryId,
          name: `Item ${state}`,
          price: "10.00",
        });
        expect(itemResult.ok).toBe(true);
        if (!itemResult.ok) return;
        const setResult = await menuRepo.setItemState(
          venueId,
          itemResult.value.id,
          state
        );
        expect(setResult.ok).toBe(true);
      }

      const menuResult = await menuRepo.getFullMenu(venueId);
      expect(menuResult.ok).toBe(true);
      if (!menuResult.ok) return;

      const byName = new Map(
        menuResult.value.flatMap((c) => c.items).map((i) => [i.name, i])
      );
      expect(byName.get("Item AVAILABLE")?.state).toBe(MenuItemState.AVAILABLE);
      expect(byName.get("Item UNAVAILABLE")?.state).toBe(MenuItemState.UNAVAILABLE);
      expect(byName.get("Item HIDDEN")?.state).toBe(MenuItemState.HIDDEN);
    });
  });

  it("an empty menu returns an empty array", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const menuResult = await menuRepo.getFullMenu(venueResult.value.id);
      expect(menuResult.ok).toBe(true);
      if (!menuResult.ok) return;
      expect(menuResult.value).toEqual([]);
    });
  });
});
