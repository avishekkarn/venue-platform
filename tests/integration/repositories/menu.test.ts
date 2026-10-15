import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import {
  MenuItemState,
  ModifierChoiceType,
} from "@/domain/menu/menu.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

describe("MenuRepository Integration Tests", () => {
  it("Case 1: listCategories on a venue with no categories returns ok([])", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Empty Venue",
        slug: `venue-${Date.now()}-c1`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const listResult = await menuRepo.listCategories(venueResult.value.id);
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toEqual([]);
      }
    });
  });

  it("Case 2: createCategory writes a category row", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Cat Venue",
        slug: `venue-${Date.now()}-c2`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const catResult = await menuRepo.createCategory({
        venueId: venueResult.value.id,
        name: "Appetizers",
        sortOrder: 1,
      });
      expect(catResult.ok).toBe(true);
      if (catResult.ok) {
        expect(catResult.value.id).toBeDefined();
        expect(catResult.value.venueId).toBe(venueResult.value.id);
        expect(catResult.value.name).toBe("Appetizers");
        expect(catResult.value.sortOrder).toBe(1);
        expect(catResult.value.createdAt).toBeInstanceOf(Date);
        expect(catResult.value.updatedAt).toBeInstanceOf(Date);
      }
    });
  });

  it("Case 3: listCategories after createCategory returns the new category", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Cat List Venue",
        slug: `venue-${Date.now()}-c3`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const catResult = await menuRepo.createCategory({
        venueId,
        name: "Entrees",
      });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const listResult = await menuRepo.listCategories(venueId);
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toHaveLength(1);
        expect(listResult.value[0]?.id).toBe(catResult.value.id);
        expect(listResult.value[0]?.name).toBe("Entrees");
      }
    });
  });

  it("Case 4: createItem writes a menu item with a string price equal to caller input", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Item Venue",
        slug: `venue-${Date.now()}-c4`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const catResult = await menuRepo.createCategory({ venueId, name: "Burgers" });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryId: catResult.value.id,
        name: "Classic Cheeseburger",
        description: "Aged cheddar and pickles",
        price: "15.00",
      });
      expect(itemResult.ok).toBe(true);
      if (itemResult.ok) {
        expect(itemResult.value.id).toBeDefined();
        expect(typeof itemResult.value.price).toBe("string");
        expect(itemResult.value.price).toBe("15.00");
      }
    });
  });

  it("Case 5: listItemsForCategory after createItem returns the new item", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "List Items Venue",
        slug: `venue-${Date.now()}-c5`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const catResult = await menuRepo.createCategory({ venueId, name: "Pastas" });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryId: catResult.value.id,
        name: "Spaghetti Carbonara",
        price: "18.50",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;

      const listResult = await menuRepo.listItemsForCategory(
        venueId,
        catResult.value.id
      );
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toHaveLength(1);
        expect(listResult.value[0]?.id).toBe(itemResult.value.id);
        expect(listResult.value[0]?.name).toBe("Spaghetti Carbonara");
        expect(typeof listResult.value[0]?.price).toBe("string");
      }
    });
  });

  it("Case 6: listItemsForCategory on a category with no items returns ok([])", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Empty Cat Venue",
        slug: `venue-${Date.now()}-c6`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const catResult = await menuRepo.createCategory({
        venueId: venueResult.value.id,
        name: "Empty Category",
      });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const listResult = await menuRepo.listItemsForCategory(
        venueResult.value.id,
        catResult.value.id
      );
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toEqual([]);
      }
    });
  });

  it("Case 7: getItemWithModifiers on an item with no modifier groups returns modifierGroups: []", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "No Mods Venue",
        slug: `venue-${Date.now()}-c7`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const catResult = await menuRepo.createCategory({ venueId, name: "Salads" });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryId: catResult.value.id,
        name: "Caesar Salad",
        price: "12.00",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;

      const fetched = await menuRepo.getItemWithModifiers(
        venueId,
        itemResult.value.id
      );
      expect(fetched.ok).toBe(true);
      if (fetched.ok) {
        expect(fetched.value.id).toBe(itemResult.value.id);
        expect(fetched.value.modifierGroups).toEqual([]);
      }
    });
  });

  it("Case 8: createModifierGroup writes a group and createModifierOption writes an option with string additionalPrice", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Create Mods Venue",
        slug: `venue-${Date.now()}-c8`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const catResult = await menuRepo.createCategory({ venueId, name: "Pizza" });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryId: catResult.value.id,
        name: "Margherita",
        price: "14.00",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;

      const groupResult = await menuRepo.createModifierGroup({
        menuItemId: itemResult.value.id,
        name: "Extra Crust",
        choiceType: ModifierChoiceType.SINGLE,
        isRequired: false,
      });
      expect(groupResult.ok).toBe(true);
      if (!groupResult.ok) return;

      const optionResult = await menuRepo.createModifierOption({
        modifierGroupId: groupResult.value.id,
        name: "Stuffed Crust",
        additionalPrice: "2.50",
      });
      expect(optionResult.ok).toBe(true);
      if (optionResult.ok) {
        expect(optionResult.value.id).toBeDefined();
        expect(optionResult.value.name).toBe("Stuffed Crust");
        expect(typeof optionResult.value.additionalPrice).toBe("string");
        expect(optionResult.value.additionalPrice).toBe("2.50");
      }
    });
  });

  it("Case 9: getItemWithModifiers after creating group and option returns the item with one group carrying one option", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Full Tree Venue",
        slug: `venue-${Date.now()}-c9`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const catResult = await menuRepo.createCategory({ venueId, name: "Beverages" });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryId: catResult.value.id,
        name: "Latte",
        price: "5.00",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;

      const groupResult = await menuRepo.createModifierGroup({
        menuItemId: itemResult.value.id,
        name: "Syrup Flavor",
        choiceType: ModifierChoiceType.MULTIPLE,
      });
      expect(groupResult.ok).toBe(true);
      if (!groupResult.ok) return;

      const optionResult = await menuRepo.createModifierOption({
        modifierGroupId: groupResult.value.id,
        name: "Vanilla",
        additionalPrice: "0.80",
      });
      expect(optionResult.ok).toBe(true);
      if (!optionResult.ok) return;

      const fullItem = await menuRepo.getItemWithModifiers(
        venueId,
        itemResult.value.id
      );
      expect(fullItem.ok).toBe(true);
      if (fullItem.ok) {
        expect(fullItem.value.modifierGroups).toHaveLength(1);
        const group = fullItem.value.modifierGroups[0]!;
        expect(group.name).toBe("Syrup Flavor");
        expect(group.options).toHaveLength(1);
        expect(group.options[0]?.name).toBe("Vanilla");
        expect(typeof group.options[0]?.additionalPrice).toBe("string");
        expect(group.options[0]?.additionalPrice).toBe("0.80");
      }
    });
  });

  it("Case 10: setItemState to UNAVAILABLE writes the state without deleting the row", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Unavail Venue",
        slug: `venue-${Date.now()}-c10`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const cat = await menuRepo.createCategory({ venueId, name: "Fish" });
      expect(cat.ok).toBe(true);
      if (!cat.ok) return;

      const item = await menuRepo.createItem({
        venueId,
        categoryId: cat.value.id,
        name: "Salmon",
        price: "22.00",
      });
      expect(item.ok).toBe(true);
      if (!item.ok) return;

      const setRes = await menuRepo.setItemState(
        venueId,
        item.value.id,
        MenuItemState.UNAVAILABLE
      );
      expect(setRes.ok).toBe(true);
      if (setRes.ok) {
        expect(setRes.value.state).toBe(MenuItemState.UNAVAILABLE);
      }

      const readBack = await menuRepo.getItemWithModifiers(
        venueId,
        item.value.id
      );
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.state).toBe(MenuItemState.UNAVAILABLE);
      }
    });
  });

  it("Case 11: setItemState to HIDDEN writes the state and the row still exists", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Hidden Venue",
        slug: `venue-${Date.now()}-c11`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const cat = await menuRepo.createCategory({ venueId, name: "Specials" });
      expect(cat.ok).toBe(true);
      if (!cat.ok) return;

      const item = await menuRepo.createItem({
        venueId,
        categoryId: cat.value.id,
        name: "Seasonal Tart",
        price: "9.50",
      });
      expect(item.ok).toBe(true);
      if (!item.ok) return;

      const setRes = await menuRepo.setItemState(
        venueId,
        item.value.id,
        MenuItemState.HIDDEN
      );
      expect(setRes.ok).toBe(true);
      if (setRes.ok) {
        expect(setRes.value.state).toBe(MenuItemState.HIDDEN);
      }

      const readBack = await menuRepo.getItemWithModifiers(
        venueId,
        item.value.id
      );
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.state).toBe(MenuItemState.HIDDEN);
      }
    });
  });

  it("Case 12: setItemState to the same state the item already has is idempotent", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Idempotent Venue",
        slug: `venue-${Date.now()}-c12`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const cat = await menuRepo.createCategory({ venueId, name: "Snacks" });
      expect(cat.ok).toBe(true);
      if (!cat.ok) return;

      const item = await menuRepo.createItem({
        venueId,
        categoryId: cat.value.id,
        name: "Roasted Nuts",
        price: "4.00",
      });
      expect(item.ok).toBe(true);
      if (!item.ok) return;

      // Item is created in AVAILABLE state; setting to AVAILABLE again is idempotent
      const setRes = await menuRepo.setItemState(
        venueId,
        item.value.id,
        MenuItemState.AVAILABLE
      );
      expect(setRes.ok).toBe(true);
      if (setRes.ok) {
        expect(setRes.value.state).toBe(MenuItemState.AVAILABLE);
      }
    });
  });

  it("Case 13: getItemWithModifiers on an item belonging to another venue returns NOT_FOUND", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const v1 = await venueRepo.create({
        name: "Venue Alpha",
        slug: `venue-${Date.now()}-c13-a`,
        taxRate: "0.0825",
      });
      const v2 = await venueRepo.create({
        name: "Venue Beta",
        slug: `venue-${Date.now()}-c13-b`,
        taxRate: "0.0825",
      });
      expect(v1.ok).toBe(true);
      expect(v2.ok).toBe(true);
      if (!v1.ok || !v2.ok) return;

      const cat1 = await menuRepo.createCategory({
        venueId: v1.value.id,
        name: "V1 Starters",
      });
      expect(cat1.ok).toBe(true);
      if (!cat1.ok) return;

      const item1 = await menuRepo.createItem({
        venueId: v1.value.id,
        categoryId: cat1.value.id,
        name: "V1 Bruschetta",
        price: "8.00",
      });
      expect(item1.ok).toBe(true);
      if (!item1.ok) return;

      const crossVenueRead = await menuRepo.getItemWithModifiers(
        v2.value.id,
        item1.value.id
      );
      expect(crossVenueRead.ok).toBe(false);
      if (!crossVenueRead.ok) {
        expect(crossVenueRead.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });
});
