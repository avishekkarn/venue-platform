import { describe, it, expect } from "vitest";
import { withTransaction } from "../setup";
import {
  createOrder,
  type CreateOrderRequest,
} from "@/domain/orders/create-order";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import {
  PlaceType,
  OrderState,
  type CreateOrderInput,
} from "@/domain/orders/order.repository";
import {
  MenuItemState,
  ModifierChoiceType,
} from "@/domain/menu/menu.repository";
import { DomainErrorCode } from "@/domain/shared/result";

describe("Milestone 5.5 Verification — createOrder against real PostgreSQL database", () => {
  it("Happy path with frozen money: writes order with authoritative database prices, tax, and OrderItem fields", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);

      // 1. Create fixture venue with known tax rate (10%)
      const venue = await tx.venue.create({
        data: {
          name: "Integration Test Bistro",
          slug: `bistro-${Date.now()}-happy`,
          taxRate: "0.1000",
          brandColor: "#223344",
        },
      });

      // 2. Create fixture table
      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-10",
        },
      });

      // 3. Create fixture menu category
      const category = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Main Courses",
          sortOrder: 1,
        },
      });

      // 4. Create available burger item with price $18.50
      const burgerItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Gourmet Angus Burger",
          price: "18.50",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      // 5. Create modifier group and option (Aged Cheddar +$2.50)
      const modGroup = await tx.modifierGroup.create({
        data: {
          menuItemId: burgerItem.id,
          name: "Cheese Selection",
          choiceType: ModifierChoiceType.SINGLE,
          isRequired: false,
          sortOrder: 1,
        },
      });

      const modOption = await tx.modifierOption.create({
        data: {
          modifierGroupId: modGroup.id,
          name: "Aged Cheddar",
          additionalPrice: "2.50",
          sortOrder: 1,
        },
      });

      // 6. Create available drink item with price $5.00
      const drinkItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Artisan Soda",
          price: "5.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 2,
        },
      });

      // 7. Request: 2 Burgers with Aged Cheddar, 1 Drink
      // Expected calculations from database:
      // Item 1: (18.50 + 2.50) * 2 = 42.00
      // Item 2: 5.00 * 1 = 5.00
      // Subtotal = 47.00
      // Tax = 47.00 * 0.1000 = 4.70
      // Total = 47.00 + 4.70 = 51.70
      const idempotencyKey = "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d";
      const request: CreateOrderRequest = {
        venueId: venue.id,
        idempotencyKey,
        placeType: PlaceType.TABLE,
        tableId: table.id,
        notes: "Window table please",
        items: [
          {
            menuItemId: burgerItem.id,
            quantity: 2,
            selectedModifierIds: [modOption.id],
            notes: "Medium well",
          },
          {
            menuItemId: drinkItem.id,
            quantity: 1,
          },
        ],
      };

      const result = await createOrder(
        { orderRepo, menuRepo, venueRepo },
        request
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const order = result.value;
      expect(order.id).toBeDefined();
      expect(order.venueId).toBe(venue.id);
      expect(order.state).toBe(OrderState.PLACED);
      expect(order.placeType).toBe(PlaceType.TABLE);
      expect(order.tableId).toBe(table.id);
      expect(order.subtotal).toBe("47.00");
      expect(order.taxRate).toBe("0.1000");
      expect(order.taxAmount).toBe("4.70");
      expect(order.total).toBe("51.70");
      expect(order.notes).toBe("Window table please");

      // 8. Direct database read verification (D-4.1, D-4.4)
      const dbOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: true,
          stateChanges: { orderBy: { occurredAt: "asc" } },
        },
      });

      expect(dbOrder).not.toBeNull();
      if (!dbOrder) return;

      // Frozen order headers
      expect(dbOrder.subtotal.toFixed(2)).toBe("47.00");
      expect(dbOrder.taxRate.toFixed(4)).toBe("0.1000");
      expect(dbOrder.taxAmount.toFixed(2)).toBe("4.70");
      expect(dbOrder.total.toFixed(2)).toBe("51.70");

      // Frozen items
      expect(dbOrder.items).toHaveLength(2);
      const dbBurgerItem = dbOrder.items.find((i) => i.menuItemId === burgerItem.id);
      const dbDrinkItem = dbOrder.items.find((i) => i.menuItemId === drinkItem.id);
      expect(dbBurgerItem).toBeDefined();
      expect(dbDrinkItem).toBeDefined();
      if (!dbBurgerItem || !dbDrinkItem) return;

      // Assert Burger item frozen values
      expect(dbBurgerItem.menuItemId).toBe(burgerItem.id);
      expect(dbBurgerItem.itemName).toBe("Gourmet Angus Burger");
      expect(dbBurgerItem.itemPrice.toFixed(2)).toBe("18.50");
      expect(dbBurgerItem.quantity).toBe(2);
      expect(dbBurgerItem.modifierPrice.toFixed(2)).toBe("2.50");
      expect(dbBurgerItem.lineTotal.toFixed(2)).toBe("42.00");
      expect(dbBurgerItem.notes).toBe("Medium well");
      expect(dbBurgerItem.modifiersJson).toEqual([
        {
          id: modOption.id,
          name: "Aged Cheddar",
          price: "2.50",
        },
      ]);

      // Assert Drink item frozen values
      expect(dbDrinkItem.menuItemId).toBe(drinkItem.id);
      expect(dbDrinkItem.itemName).toBe("Artisan Soda");
      expect(dbDrinkItem.itemPrice.toFixed(2)).toBe("5.00");
      expect(dbDrinkItem.quantity).toBe(1);
      expect(dbDrinkItem.modifierPrice.toFixed(2)).toBe("0.00");
      expect(dbDrinkItem.lineTotal.toFixed(2)).toBe("5.00");

      // Assert initial PLACED state change
      expect(dbOrder.stateChanges).toHaveLength(1);
      const sc = dbOrder.stateChanges[0];
      expect(sc).toBeDefined();
      if (!sc) return;
      expect(sc.state).toBe("PLACED");
      expect(sc.staffMemberId).toBeNull();
      expect(sc.note).toBeNull();
      expect(sc.occurredAt).toBeInstanceOf(Date);
    });
  });

  it("The initial PLACED state change exists in the same transaction", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "State Change Venue",
          slug: `bistro-${Date.now()}-statechange`,
          taxRate: "0.0825",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-1" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Food", sortOrder: 1 },
      });

      const item = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Quick Snack",
          price: "10.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const result = await createOrder(
        { orderRepo, menuRepo, venueRepo },
        {
          venueId: venue.id,
          idempotencyKey: "11111111-2222-3333-4444-555555555555",
          placeType: PlaceType.TABLE,
          tableId: table.id,
          items: [{ menuItemId: item.id, quantity: 1 }],
        }
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const stateChanges = await tx.orderStateChange.findMany({
        where: { orderId: result.value.id },
      });

      expect(stateChanges).toHaveLength(1);
      const firstChange = stateChanges[0];
      expect(firstChange).toBeDefined();
      if (!firstChange) return;
      expect(firstChange.state).toBe("PLACED");
      expect(firstChange.staffMemberId).toBeNull();
      expect(firstChange.note).toBeNull();
      expect(firstChange.occurredAt).toBeInstanceOf(Date);
    });
  });

  it("The idempotency retry: calling createOrder twice with identical idempotencyKey returns existing order and creates no second row", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Idempotency Venue",
          slug: `bistro-${Date.now()}-idempotency`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-2" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Snacks", sortOrder: 1 },
      });

      const item = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "French Fries",
          price: "6.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const idempotencyKey = "22222222-3333-4444-5555-666666666666";
      const request: CreateOrderRequest = {
        venueId: venue.id,
        idempotencyKey,
        placeType: PlaceType.TABLE,
        tableId: table.id,
        items: [{ menuItemId: item.id, quantity: 1 }],
      };

      // First call: creates order
      const res1 = await createOrder(
        { orderRepo, menuRepo, venueRepo },
        request
      );
      expect(res1.ok).toBe(true);
      if (!res1.ok) return;

      const orderCountAfterFirst = await tx.order.count({
        where: { venueId: venue.id },
      });
      expect(orderCountAfterFirst).toBe(1);

      // Second call (retry): must return the exact same order
      const res2 = await createOrder(
        { orderRepo, menuRepo, venueRepo },
        request
      );
      expect(res2.ok).toBe(true);
      if (!res2.ok) return;

      expect(res2.value.id).toBe(res1.value.id);
      expect(res2.value.total).toBe(res1.value.total);
      expect(res2.value.placedAt).toEqual(res1.value.placedAt);

      // Verify no second row was created
      const orderCountAfterSecond = await tx.order.count({
        where: { venueId: venue.id },
      });
      expect(orderCountAfterSecond).toBe(1);

      const itemCount = await tx.orderItem.count({
        where: { order: { venueId: venue.id } },
      });
      expect(itemCount).toBe(1);

      const stateChangeCount = await tx.orderStateChange.count({
        where: { order: { venueId: venue.id } },
      });
      expect(stateChangeCount).toBe(1);
    });
  });

  it("A non-orderable item is rejected with VALIDATION_FAILED and no order row is written", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Unavailable Item Venue",
          slug: `bistro-${Date.now()}-unavailable`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-3" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Desserts", sortOrder: 1 },
      });

      const unavailableItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Sold-out Souffle",
          price: "12.00",
          state: MenuItemState.UNAVAILABLE,
          sortOrder: 1,
        },
      });

      const request: CreateOrderRequest = {
        venueId: venue.id,
        idempotencyKey: "33333333-4444-5555-6666-777777777777",
        placeType: PlaceType.TABLE,
        tableId: table.id,
        items: [{ menuItemId: unavailableItem.id, quantity: 1 }],
      };

      const result = await createOrder(
        { orderRepo, menuRepo, venueRepo },
        request
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result.error.message).toContain("not available for ordering");

      // Verify no order was written
      const orderCount = await tx.order.count({
        where: { venueId: venue.id },
      });
      expect(orderCount).toBe(0);
    });
  });

  it("A nonexistent item is rejected with NOT_FOUND and no order row is written", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Nonexistent Item Venue",
          slug: `bistro-${Date.now()}-nonexistent`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-4" },
      });

      const request: CreateOrderRequest = {
        venueId: venue.id,
        idempotencyKey: "44444444-5555-6666-7777-888888888888",
        placeType: PlaceType.TABLE,
        tableId: table.id,
        items: [{ menuItemId: "00000000-0000-0000-0000-000000000000", quantity: 1 }],
      };

      const result = await createOrder(
        { orderRepo, menuRepo, venueRepo },
        request
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(result.error.message).toContain("not found");

      // Verify no order was written
      const orderCount = await tx.order.count({
        where: { venueId: venue.id },
      });
      expect(orderCount).toBe(0);
    });
  });

  it("The transaction rolls back on error: forcing a database constraint failure leaves no orphan Order or OrderItem rows", async () => {
    await withTransaction(async (tx) => {
      const orderRepo = createPrismaOrderRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Rollback Venue",
          slug: `bistro-${Date.now()}-rollback`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-5" },
      });

      // Force failure mechanism:
      // Drive the adapter's create with an item carrying a menuItemId that does not exist in the MenuItem table.
      // In PostgreSQL, the foreign key constraint `order_items_menuItemId_fkey` causes the nested insert to fail.
      const invalidCreateInput: CreateOrderInput = {
        venueId: venue.id,
        idempotencyKey: "55555555-6666-7777-8888-999999999999",
        placeType: PlaceType.TABLE,
        tableId: table.id,
        subtotal: "20.00",
        taxRate: "0.1000",
        taxAmount: "2.00",
        total: "22.00",
        items: [
          {
            menuItemId: "ffffffff-ffff-ffff-ffff-ffffffffffff", // Violates foreign key constraint
            itemName: "Phantom Burger",
            itemPrice: "20.00",
            quantity: 1,
            lineTotal: "20.00",
          },
        ],
      };

      const result = await orderRepo.create(invalidCreateInput);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.INTERNAL);

      // Verify complete atomic rollback: no orphan order, no orphan items, no state change
      const orderCount = await tx.order.count({
        where: { venueId: venue.id },
      });
      const itemCount = await tx.orderItem.count({
        where: { order: { venueId: venue.id } },
      });
      const stateChangeCount = await tx.orderStateChange.count({
        where: { order: { venueId: venue.id } },
      });

      expect(orderCount).toBe(0);
      expect(itemCount).toBe(0);
      expect(stateChangeCount).toBe(0);
    });
  });

  it("Cross-venue isolation: an order created for venue A cannot be read with venue B's id", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);

      // Create Venue A
      const venueA = await tx.venue.create({
        data: {
          name: "Venue Alpha",
          slug: `venue-${Date.now()}-alpha`,
          taxRate: "0.1000",
        },
      });

      // Create Venue B
      const venueB = await tx.venue.create({
        data: {
          name: "Venue Beta",
          slug: `venue-${Date.now()}-beta`,
          taxRate: "0.0800",
        },
      });

      const tableA = await tx.table.create({
        data: { venueId: venueA.id, number: "T-Alpha" },
      });

      const categoryA = await tx.menuCategory.create({
        data: { venueId: venueA.id, name: "Food A", sortOrder: 1 },
      });

      const itemA = await tx.menuItem.create({
        data: {
          venueId: venueA.id,
          categoryId: categoryA.id,
          name: "Alpha Special",
          price: "12.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      // Create order for Venue A
      const orderResult = await createOrder(
        { orderRepo, menuRepo, venueRepo },
        {
          venueId: venueA.id,
          idempotencyKey: "66666666-7777-8888-9999-aaaaaaaaaaaa",
          placeType: PlaceType.TABLE,
          tableId: tableA.id,
          items: [{ menuItemId: itemA.id, quantity: 1 }],
        }
      );

      expect(orderResult.ok).toBe(true);
      if (!orderResult.ok) return;

      const orderA = orderResult.value;

      // Attempt reading Venue A's order using Venue B's venueId
      // Cross-venue isolation requires returning NOT_FOUND (never FORBIDDEN or leaking) per SYSTEM.md §15.4 and D-10.2.
      // (Also thoroughly tested at the repository layer in tests/integration/repositories/order.repo.test.ts Case 12).
      const readWithVenueB = await orderRepo.findById(venueB.id, orderA.id);
      expect(readWithVenueB.ok).toBe(false);
      if (readWithVenueB.ok) return;
      expect(readWithVenueB.error.code).toBe(DomainErrorCode.NOT_FOUND);

      // Confirm Venue A can read its own order successfully
      const readWithVenueA = await orderRepo.findById(venueA.id, orderA.id);
      expect(readWithVenueA.ok).toBe(true);
      if (!readWithVenueA.ok) return;
      expect(readWithVenueA.value.id).toBe(orderA.id);
    });
  });
});
