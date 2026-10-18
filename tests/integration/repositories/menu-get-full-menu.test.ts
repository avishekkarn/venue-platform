import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import {
  MenuItemState,
  ModifierChoiceType,
} from "@/domain/menu/menu.repository";
import { withTransaction } from "../setup";

describe("MenuRepository.getFullMenu Integration Tests", () => {
  it("Case 1: Full tree with items nested", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Full Tree Venue",
        slug: `venue-${Date.now()}-full-tree`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const catResult = await menuRepo.createCategory({
        venueId,
        name: "Mains",
        sortOrder: 1,
      });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const item1Result = await menuRepo.createItem({
        venueId,
        categoryId: catResult.value.id,
        name: "Burger",
        description: "Juicy beef patty",
        price: "14.50",
        sortOrder: 1,
      });
      expect(item1Result.ok).toBe(true);
      if (!item1Result.ok) return;

      const item2Result = await menuRepo.createItem({
        venueId,
        categoryId: catResult.value.id,
        name: "Fries",
        description: "Crispy salted fries",
        price: "5.00",
        sortOrder: 2,
      });
      expect(item2Result.ok).toBe(true);
      if (!item2Result.ok) return;

      const groupResult = await menuRepo.createModifierGroup({
        menuItemId: item1Result.value.id,
        name: "Cheese Option",
        choiceType: ModifierChoiceType.SINGLE,
        isRequired: true,
        sortOrder: 1,
      });
      expect(groupResult.ok).toBe(true);
      if (!groupResult.ok) return;

      const opt1Result = await menuRepo.createModifierOption({
        modifierGroupId: groupResult.value.id,
        name: "Cheddar",
        additionalPrice: "1.00",
        sortOrder: 1,
      });
      expect(opt1Result.ok).toBe(true);

      const opt2Result = await menuRepo.createModifierOption({
        modifierGroupId: groupResult.value.id,
        name: "Swiss",
        additionalPrice: "1.50",
        sortOrder: 2,
      });
      expect(opt2Result.ok).toBe(true);

      const result = await menuRepo.getFullMenu(venueId);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value).toHaveLength(1);
      const cat = result.value[0];
      expect(cat).toBeDefined();
      if (!cat) return;

      expect(cat.id).toBe(catResult.value.id);
      expect(cat.name).toBe("Mains");
      expect(cat.order).toBe(1);
      expect(cat.items).toHaveLength(2);

      const item1 = cat.items[0];
      expect(item1).toBeDefined();
      if (!item1) return;

      expect(item1.id).toBe(item1Result.value.id);
      expect(item1.name).toBe("Burger");
      expect(item1.price).toBe("14.50");
      expect(typeof item1.price).toBe("string");
      expect(item1.state).toBe(MenuItemState.AVAILABLE);
      expect(item1.order).toBe(1);
      expect(item1.modifierGroups).toHaveLength(1);

      const mg = item1.modifierGroups[0];
      expect(mg).toBeDefined();
      if (!mg) return;

      expect(mg.id).toBe(groupResult.value.id);
      expect(mg.name).toBe("Cheese Option");
      expect(mg.required).toBe(true);
      expect(mg.multiple).toBe(false);
      expect(mg.options).toHaveLength(2);

      const opt1 = mg.options[0];
      const opt2 = mg.options[1];
      expect(opt1).toBeDefined();
      expect(opt2).toBeDefined();
      if (!opt1 || !opt2) return;

      expect(opt1.name).toBe("Cheddar");
      expect(opt1.additionalPrice).toBe("1.00");
      expect(typeof opt1.additionalPrice).toBe("string");

      expect(opt2.name).toBe("Swiss");
      expect(opt2.additionalPrice).toBe("1.50");
      expect(typeof opt2.additionalPrice).toBe("string");

      const item2 = cat.items[1];
      expect(item2).toBeDefined();
      if (!item2) return;

      expect(item2.id).toBe(item2Result.value.id);
      expect(item2.name).toBe("Fries");
      expect(item2.price).toBe("5.00");
      expect(typeof item2.price).toBe("string");
      expect(item2.modifierGroups).toHaveLength(0);
    });
  });

  it("Case 2: Categories ordered by order, items ordered by order", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Ordering Venue",
        slug: `venue-${Date.now()}-ordering`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      // Insert categories in order 2, 1, 3
      const cat2 = await menuRepo.createCategory({ venueId, name: "Cat 2", sortOrder: 2 });
      const cat1 = await menuRepo.createCategory({ venueId, name: "Cat 1", sortOrder: 1 });
      const cat3 = await menuRepo.createCategory({ venueId, name: "Cat 3", sortOrder: 3 });

      expect(cat2.ok && cat1.ok && cat3.ok).toBe(true);
      if (!cat1.ok || !cat2.ok || !cat3.ok) return;

      // Within category 1, insert items with order 2 and 1
      const item2 = await menuRepo.createItem({
        venueId,
        categoryId: cat1.value.id,
        name: "Item Order 2",
        price: "10.00",
        sortOrder: 2,
      });
      const item1 = await menuRepo.createItem({
        venueId,
        categoryId: cat1.value.id,
        name: "Item Order 1",
        price: "12.00",
        sortOrder: 1,
      });

      expect(item1.ok && item2.ok).toBe(true);
      if (!item1.ok || !item2.ok) return;

      const result = await menuRepo.getFullMenu(venueId);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.value).toHaveLength(3);
      const c1 = result.value[0];
      const c2 = result.value[1];
      const c3 = result.value[2];
      expect(c1).toBeDefined();
      expect(c2).toBeDefined();
      expect(c3).toBeDefined();
      if (!c1 || !c2 || !c3) return;

      expect(c1.order).toBe(1);
      expect(c1.name).toBe("Cat 1");
      expect(c2.order).toBe(2);
      expect(c2.name).toBe("Cat 2");
      expect(c3.order).toBe(3);
      expect(c3.name).toBe("Cat 3");

      expect(c1.items).toHaveLength(2);
      const c1Item1 = c1.items[0];
      const c1Item2 = c1.items[1];
      expect(c1Item1).toBeDefined();
      expect(c1Item2).toBeDefined();
      if (!c1Item1 || !c1Item2) return;

      expect(c1Item1.order).toBe(1);
      expect(c1Item1.name).toBe("Item Order 1");
      expect(c1Item2.order).toBe(2);
      expect(c1Item2.name).toBe("Item Order 2");
    });
  });

  it("Case 3: Empty venue returns empty tree", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Empty Menu Venue",
        slug: `venue-${Date.now()}-empty`,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const result = await menuRepo.getFullMenu(venueResult.value.id);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  it("Case 4: Cross-venue isolation", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueAResult = await venueRepo.create({
        name: "Venue A",
        slug: `venue-${Date.now()}-iso-a`,
        taxRate: "0.0825",
      });
      const venueBResult = await venueRepo.create({
        name: "Venue B",
        slug: `venue-${Date.now()}-iso-b`,
        taxRate: "0.0825",
      });

      expect(venueAResult.ok && venueBResult.ok).toBe(true);
      if (!venueAResult.ok || !venueBResult.ok) return;

      const venueAId = venueAResult.value.id;
      const venueBId = venueBResult.value.id;

      const catA = await menuRepo.createCategory({ venueId: venueAId, name: "Cat A", sortOrder: 1 });
      const catB = await menuRepo.createCategory({ venueId: venueBId, name: "Cat B", sortOrder: 1 });

      expect(catA.ok && catB.ok).toBe(true);
      if (!catA.ok || !catB.ok) return;

      const itemA = await menuRepo.createItem({
        venueId: venueAId,
        categoryId: catA.value.id,
        name: "Item A",
        price: "10.00",
      });
      const itemB = await menuRepo.createItem({
        venueId: venueBId,
        categoryId: catB.value.id,
        name: "Item B",
        price: "20.00",
      });

      expect(itemA.ok && itemB.ok).toBe(true);
      if (!itemA.ok || !itemB.ok) return;

      const menuA = await menuRepo.getFullMenu(venueAId);
      const menuB = await menuRepo.getFullMenu(venueBId);

      expect(menuA.ok && menuB.ok).toBe(true);
      if (!menuA.ok || !menuB.ok) return;

      expect(menuA.value).toHaveLength(1);
      expect(menuB.value).toHaveLength(1);
      const menuACat = menuA.value[0];
      const menuBCat = menuB.value[0];
      expect(menuACat).toBeDefined();
      expect(menuBCat).toBeDefined();
      if (!menuACat || !menuBCat) return;

      expect(menuACat.id).toBe(catA.value.id);
      expect(menuACat.items).toHaveLength(1);
      const menuAItem = menuACat.items[0];
      expect(menuAItem).toBeDefined();
      if (!menuAItem) return;
      expect(menuAItem.id).toBe(itemA.value.id);

      expect(menuBCat.id).toBe(catB.value.id);
      expect(menuBCat.items).toHaveLength(1);
      const menuBItem = menuBCat.items[0];
      expect(menuBItem).toBeDefined();
      if (!menuBItem) return;
      expect(menuBItem.id).toBe(itemB.value.id);

      expect(menuACat.id).not.toBe(catB.value.id);
      expect(menuAItem.id).not.toBe(itemB.value.id);
      expect(menuBCat.id).not.toBe(catA.value.id);
      expect(menuBItem.id).not.toBe(itemA.value.id);
    });
  });
});
