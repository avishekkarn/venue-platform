import { describe, it, expect } from "vitest";
import { withTransaction } from "../setup";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { getMenu } from "@/domain/menu/get-menu";
import { getMenuItem } from "@/domain/menu/get-menu-item";
import { isOrderable } from "@/domain/menu/is-orderable";
import { MenuItemState, type MenuItemView } from "@/domain/menu/menu.repository";
import { DomainErrorCode } from "@/domain/shared/result";

describe("Milestone 5.1 Verification — HIDDEN Item Filter against real PostgreSQL", () => {
  it("getMenu excludes a HIDDEN item", async () => {
    await withTransaction(async (tx) => {
      const menuRepo = createPrismaMenuRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Hidden Filter Venue 1",
          slug: `venue-${Date.now()}-hidden-1`,
          taxRate: "0.0825",
        },
      });

      const category = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Starters",
          sortOrder: 1,
        },
      });

      const availableItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Available Bruschetta",
          price: "8.50",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const hiddenItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Secret Bruschetta",
          price: "12.00",
          state: MenuItemState.HIDDEN,
          sortOrder: 2,
        },
      });

      const menuResult = await getMenu({ menuRepo }, venue.id);
      expect(menuResult.ok).toBe(true);
      if (!menuResult.ok) return;

      const categories = menuResult.value;
      const returnedCat = categories.find((c) => c.id === category.id);
      expect(returnedCat).toBeDefined();

      const itemIds = returnedCat?.items.map((i) => i.id) ?? [];
      expect(itemIds).toContain(availableItem.id);
      expect(itemIds).not.toContain(hiddenItem.id);
    });
  });

  it("A category whose only item is HIDDEN is excluded entirely", async () => {
    await withTransaction(async (tx) => {
      const menuRepo = createPrismaMenuRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Hidden Filter Venue 2",
          slug: `venue-${Date.now()}-hidden-2`,
          taxRate: "0.0825",
        },
      });

      const visibleCategory = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Visible Category",
          sortOrder: 1,
        },
      });

      await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: visibleCategory.id,
          name: "Visible Soup",
          price: "6.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const hiddenCategory = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Hidden Only Category",
          sortOrder: 2,
        },
      });

      await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: hiddenCategory.id,
          name: "Off-Menu Special",
          price: "25.00",
          state: MenuItemState.HIDDEN,
          sortOrder: 1,
        },
      });

      const menuResult = await getMenu({ menuRepo }, venue.id);
      expect(menuResult.ok).toBe(true);
      if (!menuResult.ok) return;

      const categories = menuResult.value;
      expect(categories.some((c) => c.id === visibleCategory.id)).toBe(true);
      expect(categories.some((c) => c.id === hiddenCategory.id)).toBe(false);
    });
  });

  it("getMenuItem returns NOT_FOUND for the HIDDEN item", async () => {
    await withTransaction(async (tx) => {
      const menuRepo = createPrismaMenuRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Hidden Filter Venue 3",
          slug: `venue-${Date.now()}-hidden-3`,
          taxRate: "0.0825",
        },
      });

      const category = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Mains",
          sortOrder: 1,
        },
      });

      await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Available Pasta",
          price: "16.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const hiddenItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Secret Truffle Pasta",
          price: "45.00",
          state: MenuItemState.HIDDEN,
          sortOrder: 2,
        },
      });

      const itemResult = await getMenuItem({ menuRepo }, venue.id, hiddenItem.id);
      expect(itemResult.ok).toBe(false);
      if (itemResult.ok) return;

      expect(itemResult.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(itemResult.error.message).toBe("Menu item not found");
    });
  });

  it("isOrderable returns false for UNAVAILABLE and HIDDEN items", async () => {
    await withTransaction(async (tx) => {
      const menuRepo = createPrismaMenuRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Hidden Filter Venue 4",
          slug: `venue-${Date.now()}-hidden-4`,
          taxRate: "0.0825",
        },
      });

      const category = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Desserts",
          sortOrder: 1,
        },
      });

      const availableItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Tiramisu",
          price: "9.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const unavailableItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Sold Out Gelato",
          price: "7.00",
          state: MenuItemState.UNAVAILABLE,
          sortOrder: 2,
        },
      });

      const hiddenItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Secret Soufflé",
          price: "14.00",
          state: MenuItemState.HIDDEN,
          sortOrder: 3,
        },
      });

      const menuResult = await getMenu({ menuRepo }, venue.id);
      expect(menuResult.ok).toBe(true);
      if (!menuResult.ok) return;

      const returnedCat = menuResult.value.find((c) => c.id === category.id);
      expect(returnedCat).toBeDefined();

      const availableView = returnedCat?.items.find((i) => i.id === availableItem.id);
      const unavailableView = returnedCat?.items.find((i) => i.id === unavailableItem.id);
      expect(availableView).toBeDefined();
      expect(unavailableView).toBeDefined();

      if (availableView && unavailableView) {
        expect(isOrderable(availableView)).toBe(true);
        expect(isOrderable(unavailableView)).toBe(false);
      }

      const hiddenItemLiteral: MenuItemView = {
        id: hiddenItem.id,
        name: hiddenItem.name,
        description: hiddenItem.description,
        photoUrl: hiddenItem.photoUrl,
        price: "14.00",
        state: MenuItemState.HIDDEN,
        order: hiddenItem.sortOrder,
        modifierGroups: [],
      };
      expect(isOrderable(hiddenItemLiteral)).toBe(false);
    });
  });
});
