import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { withTransaction } from "../setup";

describe("Milestone 8.3.5b.A — Multi-Category MenuItemCategory Integration Tests (D-25.1, W-0028)", () => {
  it("creates a menu item in multiple categories and getFullMenu returns it in both", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Himalayan Kitchen",
        slug: `himalayan-${Date.now()}`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const breakfastResult = await menuRepo.createCategory({
        venueId,
        name: "Breakfast",
        sortOrder: 1,
      });
      expect(breakfastResult.ok).toBe(true);
      if (!breakfastResult.ok) return;
      const breakfastId = breakfastResult.value.id;

      const chineseResult = await menuRepo.createCategory({
        venueId,
        name: "Chinese",
        sortOrder: 2,
      });
      expect(chineseResult.ok).toBe(true);
      if (!chineseResult.ok) return;
      const chineseId = chineseResult.value.id;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryIds: [breakfastId, chineseId],
        name: "Steamed Momo",
        description: "Dumplings with spicy tomato chutney",
        price: "8.00",
        photoUrl: "/uploads/catalog/momo.webp",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;
      const item = itemResult.value;

      expect(item.name).toBe("Steamed Momo");
      expect(item.categoryIds).toHaveLength(2);
      expect(item.categoryIds).toContain(breakfastId);
      expect(item.categoryIds).toContain(chineseId);

      // Verify single catalog row in DB, but two join rows
      const itemRowCount = await tx.menuItem.count({ where: { venueId } });
      const joinRowCount = await tx.menuItemCategory.count({ where: { venueId } });
      expect(itemRowCount).toBe(1);
      expect(joinRowCount).toBe(2);

      // Verify getFullMenu returns the item in both category groups
      const fullMenuResult = await menuRepo.getFullMenu(venueId);
      expect(fullMenuResult.ok).toBe(true);
      if (!fullMenuResult.ok) return;

      const categories = fullMenuResult.value;
      expect(categories).toHaveLength(2);

      const breakfastCategory = categories.find((c) => c.id === breakfastId);
      const chineseCategory = categories.find((c) => c.id === chineseId);
      expect(breakfastCategory).toBeDefined();
      expect(chineseCategory).toBeDefined();
      if (!breakfastCategory || !chineseCategory) return;

      expect(breakfastCategory.items).toHaveLength(1);
      expect(chineseCategory.items).toHaveLength(1);

      const itemInBreakfast = breakfastCategory.items[0];
      const itemInChinese = chineseCategory.items[0];
      expect(itemInBreakfast?.id).toBe(item.id);
      expect(itemInChinese?.id).toBe(item.id);
      expect(itemInBreakfast?.price).toBe("8.00");
      expect(itemInChinese?.price).toBe("8.00");
      expect(itemInBreakfast?.photoUrl).toBe("/uploads/catalog/momo.webp");
      expect(itemInChinese?.photoUrl).toBe("/uploads/catalog/momo.webp");
      expect(itemInBreakfast?.categoryIds).toEqual(expect.arrayContaining([breakfastId, chineseId]));
      expect(itemInChinese?.categoryIds).toEqual(expect.arrayContaining([breakfastId, chineseId]));

      // Verify listItemsForCategory returns item for both categories
      const breakfastItems = await menuRepo.listItemsForCategory(venueId, breakfastId);
      expect(breakfastItems.ok).toBe(true);
      if (breakfastItems.ok) {
        expect(breakfastItems.value).toHaveLength(1);
        expect(breakfastItems.value[0]?.id).toBe(item.id);
      }

      const chineseItems = await menuRepo.listItemsForCategory(venueId, chineseId);
      expect(chineseItems.ok).toBe(true);
      if (chineseItems.ok) {
        expect(chineseItems.value).toHaveLength(1);
        expect(chineseItems.value[0]?.id).toBe(item.id);
      }
    });
  });

  it("updates category associations and removes join rows when categoryIds is updated", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Himalayan Kitchen",
        slug: `himalayan-update-${Date.now()}`,
        taxRate: "0.1000",
      });
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const cat1Result = await menuRepo.createCategory({ venueId, name: "Breakfast", sortOrder: 1 });
      const cat2Result = await menuRepo.createCategory({ venueId, name: "Chinese", sortOrder: 2 });
      if (!cat1Result.ok || !cat2Result.ok) return;
      const cat1Id = cat1Result.value.id;
      const cat2Id = cat2Result.value.id;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryIds: [cat1Id, cat2Id],
        name: "Steamed Momo",
        price: "8.00",
      });
      if (!itemResult.ok) return;
      const itemId = itemResult.value.id;

      // Update to remove cat2
      const updateResult = await menuRepo.updateItem(venueId, itemId, {
        categoryIds: [cat1Id],
      });
      expect(updateResult.ok).toBe(true);
      if (!updateResult.ok) return;

      expect(updateResult.value.categoryIds).toEqual([cat1Id]);

      // DB join count should now be 1
      const joinRowCount = await tx.menuItemCategory.count({ where: { venueId } });
      expect(joinRowCount).toBe(1);

      // getFullMenu should now only have the item in Breakfast
      const fullMenuResult = await menuRepo.getFullMenu(venueId);
      expect(fullMenuResult.ok).toBe(true);
      if (!fullMenuResult.ok) return;

      const breakfastCategory = fullMenuResult.value.find((c) => c.id === cat1Id);
      const chineseCategory = fullMenuResult.value.find((c) => c.id === cat2Id);
      expect(breakfastCategory?.items).toHaveLength(1);
      expect(chineseCategory?.items).toHaveLength(0);
    });
  });
});
