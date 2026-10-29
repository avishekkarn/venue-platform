import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOrder,
  type CreateOrderDeps,
  type CreateOrderRequest,
} from "@/domain/orders/create-order";
import {
  type OrderRepository,
  type Order,
  OrderState,
  PlaceType,
} from "@/domain/orders/order.repository";
import {
  type MenuRepository,
  type MenuItemWithModifiers,
  MenuItemState,
  ModifierChoiceType,
} from "@/domain/menu/menu.repository";
import {
  type VenueRepository,
  type VenueWithModules,
} from "@/domain/organization/venue.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("createOrder domain function", () => {
  let mockOrderRepo: OrderRepository;
  let mockMenuRepo: MenuRepository;
  let mockVenueRepo: VenueRepository;
  let deps: CreateOrderDeps;

  const venueId = "venue-123";
  const validUUID = "a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d";

  const fakeVenue: VenueWithModules = {
    id: venueId,
    name: "The Grand Bistro",
    slug: "grand-bistro",
    brandColor: "#123456",
    logoUrl: null,
    heroImageUrl: null,
    welcomeMessage: "Welcome",
    language: "en",
    currency: "USD",
    taxRate: "0.1000", // 10%
    isActive: true,
    modules: ["TABLE", "COUNTER"],
    services: [],
    counter: { id: "counter-1", name: "Main Counter" },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const fakeBurger: MenuItemWithModifiers = {
    id: "item-burger",
    venueId,
    categoryId: "cat-mains",
    name: "Classic Burger",
    description: "Juicy beef burger",
    photoUrl: null,
    price: "15.00",
    state: MenuItemState.AVAILABLE,
    sortOrder: 1,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    modifierGroups: [
      {
        id: "mg-cheese",
        menuItemId: "item-burger",
        name: "Cheese",
        choiceType: ModifierChoiceType.SINGLE,
        isRequired: false,
        sortOrder: 1,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        options: [
          {
            id: "opt-cheddar",
            modifierGroupId: "mg-cheese",
            name: "Aged Cheddar",
            additionalPrice: "2.50",
            sortOrder: 1,
            createdAt: new Date("2026-01-01T00:00:00Z"),
          },
        ],
      },
    ],
  };

  const fakeDrink: MenuItemWithModifiers = {
    id: "item-drink",
    venueId,
    categoryId: "cat-drinks",
    name: "Sparkling Water",
    description: "Crisp sparkling water",
    photoUrl: null,
    price: "5.00",
    state: MenuItemState.AVAILABLE,
    sortOrder: 2,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    modifierGroups: [],
  };

  beforeEach(() => {
    mockOrderRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByIdempotencyKey: vi.fn().mockResolvedValue(
        fail(DomainErrorCode.NOT_FOUND, "Order not found")
      ),
      listForVenue: vi.fn(),
      listForGuestSession: vi.fn(),
      advanceState: vi.fn(),
      cancel: vi.fn(),
    };

    mockMenuRepo = {
      listCategories: vi.fn(),
      listItemsForCategory: vi.fn(),
      listItems: vi.fn(),
      getItemWithModifiers: vi.fn().mockImplementation((_vId, itemId) => {
        if (itemId === "item-burger") return Promise.resolve(ok(fakeBurger));
        if (itemId === "item-drink") return Promise.resolve(ok(fakeDrink));
        return Promise.resolve(fail(DomainErrorCode.NOT_FOUND, `Item ${itemId} not found`));
      }),
      createCategory: vi.fn(),
      createItem: vi.fn(),
      setItemState: vi.fn(),
      createModifierGroup: vi.fn(),
      createModifierOption: vi.fn(),
      getFullMenu: vi.fn(),
    };

    mockVenueRepo = {
      findById: vi.fn().mockResolvedValue(ok(fakeVenue)),
      findBySlug: vi.fn(),
      create: vi.fn(),
    };

    deps = {
      orderRepo: mockOrderRepo,
      menuRepo: mockMenuRepo,
      venueRepo: mockVenueRepo,
    };
  });

  it("Happy path: creates order with authoritative prices and tax computed from database", async () => {
    const mockCreatedOrder: Order = {
      id: "order-1",
      venueId,
      guestSessionId: "session-1",
      placeType: PlaceType.TABLE,
      tableId: "table-4",
      roomId: null,
      counterId: null,
      pickupName: null,
      state: OrderState.PLACED,
      subtotal: "40.00",
      taxRate: "0.1000",
      taxAmount: "4.00",
      total: "44.00",
      notes: "No onions",
      placedAt: new Date("2026-02-01T12:00:00Z"),
      updatedAt: new Date("2026-02-01T12:00:00Z"),
      items: [],
      stateChanges: [],
    };

    vi.mocked(mockOrderRepo.create).mockResolvedValueOnce(ok(mockCreatedOrder));

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-4",
      guestSessionId: "session-1",
      notes: "No onions",
      items: [
        {
          menuItemId: "item-burger",
          quantity: 2,
          selectedModifierIds: ["opt-cheddar"], // (15.00 + 2.50) * 2 = 35.00
        },
        {
          menuItemId: "item-drink",
          quantity: 1, // 5.00 * 1 = 5.00
        },
      ],
    };

    const result = await createOrder(deps, request);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(mockCreatedOrder);

    // Verify orderRepo.findByIdempotencyKey called first
    expect(mockOrderRepo.findByIdempotencyKey).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.findByIdempotencyKey).toHaveBeenCalledWith(venueId, validUUID);

    // Verify orderRepo.create called exactly once with authoritative calculations
    expect(mockOrderRepo.create).toHaveBeenCalledTimes(1);
    const firstCall = vi.mocked(mockOrderRepo.create).mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) return;
    const createCallArg = firstCall[0];
    expect(createCallArg).toBeDefined();
    if (!createCallArg) return;

    expect(createCallArg.venueId).toBe(venueId);
    expect(createCallArg.idempotencyKey).toBe(validUUID);
    expect(createCallArg.placeType).toBe(PlaceType.TABLE);
    expect(createCallArg.tableId).toBe("table-4");
    expect(createCallArg.subtotal).toBe("40.00");
    expect(createCallArg.taxRate).toBe("0.1000");
    expect(createCallArg.taxAmount).toBe("4.00");
    expect(createCallArg.total).toBe("44.00");
    expect(createCallArg.notes).toBe("No onions");

    expect(createCallArg.items).toHaveLength(2);
    const item0 = createCallArg.items[0];
    const item1 = createCallArg.items[1];
    expect(item0).toBeDefined();
    expect(item1).toBeDefined();
    if (!item0 || !item1) return;

    expect(item0).toEqual({
      menuItemId: "item-burger",
      itemName: "Classic Burger",
      itemPrice: "15.00",
      quantity: 2,
      modifiersJson: [
        {
          id: "opt-cheddar",
          name: "Aged Cheddar",
          price: "2.50",
        },
      ],
      modifierPrice: "2.50",
      lineTotal: "35.00",
      notes: null,
    });
    expect(item1).toEqual({
      menuItemId: "item-drink",
      itemName: "Sparkling Water",
      itemPrice: "5.00",
      quantity: 1,
      modifiersJson: [],
      modifierPrice: "0.00",
      lineTotal: "5.00",
      notes: null,
    });
  });

  it("Client price tampering: ignores client-supplied prices, subtotals, and totals", async () => {
    const mockCreatedOrder: Order = {
      id: "order-2",
      venueId,
      guestSessionId: null,
      placeType: PlaceType.COUNTER,
      tableId: null,
      roomId: null,
      counterId: "counter-1",
      pickupName: "Alice",
      state: OrderState.PLACED,
      subtotal: "15.00",
      taxRate: "0.1000",
      taxAmount: "1.50",
      total: "16.50",
      notes: null,
      placedAt: new Date(),
      updatedAt: new Date(),
      items: [],
      stateChanges: [],
    };

    vi.mocked(mockOrderRepo.create).mockResolvedValueOnce(ok(mockCreatedOrder));

    // Malicious client tries to inject $0.01 prices and zero tax
    const tamperedRequest: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.COUNTER,
      counterId: "counter-1",
      pickupName: "Alice",
      subtotal: "0.01",
      taxRate: "0.0000",
      taxAmount: "0.00",
      total: "0.01",
      items: [
        {
          menuItemId: "item-burger",
          quantity: 1,
          price: "0.01",
          itemPrice: "0.01",
          lineTotal: "0.01",
        },
      ],
    };

    const result = await createOrder(deps, tamperedRequest);

    expect(result.ok).toBe(true);
    expect(mockOrderRepo.create).toHaveBeenCalledTimes(1);

    const firstCall = vi.mocked(mockOrderRepo.create).mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) return;
    const receivedInput = firstCall[0];
    expect(receivedInput).toBeDefined();
    if (!receivedInput) return;

    // Assert that the fake repository received authoritative database calculations, not client values
    expect(receivedInput.subtotal).toBe("15.00"); // Not 0.01
    expect(receivedInput.taxRate).toBe("0.1000"); // From venueRepo, not 0.0000
    expect(receivedInput.taxAmount).toBe("1.50"); // 15.00 * 0.1000
    expect(receivedInput.total).toBe("16.50"); // Not 0.01

    const firstItem = receivedInput.items[0];
    expect(firstItem).toBeDefined();
    if (!firstItem) return;
    expect(firstItem.itemPrice).toBe("15.00"); // From menuRepo, not 0.01
    expect(firstItem.lineTotal).toBe("15.00"); // Not 0.01
  });

  it("Rejects non-orderable item (UNAVAILABLE) with VALIDATION_FAILED and does not call orderRepo.create", async () => {
    const unavailableBurger: MenuItemWithModifiers = {
      ...fakeBurger,
      state: MenuItemState.UNAVAILABLE,
    };
    vi.mocked(mockMenuRepo.getItemWithModifiers).mockResolvedValueOnce(ok(unavailableBurger));

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };

    const result = await createOrder(deps, request);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(result.error.message).toContain("not available for ordering");

    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("Rejects nonexistent item with NOT_FOUND and does not call orderRepo.create", async () => {
    vi.mocked(mockMenuRepo.getItemWithModifiers).mockResolvedValueOnce(
      fail(DomainErrorCode.NOT_FOUND, "Item not found")
    );

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-ghost", quantity: 1 }],
    };

    const result = await createOrder(deps, request);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
    expect(result.error.message).toContain("not found");

    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("Rejects missing or malformed idempotency key with VALIDATION_FAILED and does not call orderRepo.create", async () => {
    const malformedRequest = {
      venueId,
      idempotencyKey: "not-a-valid-uuid",
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    } as unknown as CreateOrderRequest;

    const result = await createOrder(deps, malformedRequest);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(result.error.message).toContain("idempotencyKey must be a valid UUID");

    expect(mockOrderRepo.create).not.toHaveBeenCalled();
    expect(mockOrderRepo.findByIdempotencyKey).not.toHaveBeenCalled();
  });

  it("Idempotency retry: returns existing order without creating a new one", async () => {
    const existingOrder: Order = {
      id: "order-existing-99",
      venueId,
      guestSessionId: "session-1",
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      roomId: null,
      counterId: null,
      pickupName: null,
      state: OrderState.PLACED,
      subtotal: "15.00",
      taxRate: "0.1000",
      taxAmount: "1.50",
      total: "16.50",
      notes: null,
      placedAt: new Date("2026-02-01T10:00:00Z"),
      updatedAt: new Date("2026-02-01T10:00:00Z"),
      items: [],
      stateChanges: [],
    };

    vi.mocked(mockOrderRepo.findByIdempotencyKey).mockResolvedValueOnce(ok(existingOrder));

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };

    const result = await createOrder(deps, request);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(existingOrder);

    expect(mockOrderRepo.findByIdempotencyKey).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
    expect(mockMenuRepo.getItemWithModifiers).not.toHaveBeenCalled();
    expect(mockVenueRepo.findById).not.toHaveBeenCalled();
  });

  it("Propagates repository failure from orderRepo.create unchanged", async () => {
    vi.mocked(mockOrderRepo.create).mockResolvedValueOnce(
      fail(DomainErrorCode.INTERNAL, "Database transaction failed")
    );

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };

    const result = await createOrder(deps, request);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
    expect(result.error.message).toBe("Database transaction failed");
  });

  it("Authoritative tax rate comes strictly from venue repository", async () => {
    const venueWithDifferentTax: VenueWithModules = {
      ...fakeVenue,
      taxRate: "0.0825", // 8.25%
    };
    vi.mocked(mockVenueRepo.findById).mockResolvedValueOnce(ok(venueWithDifferentTax));

    const mockCreatedOrder: Order = {
      id: "order-tax",
      venueId,
      guestSessionId: null,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      roomId: null,
      counterId: null,
      pickupName: null,
      state: OrderState.PLACED,
      subtotal: "100.00",
      taxRate: "0.0825",
      taxAmount: "8.25",
      total: "108.25",
      notes: null,
      placedAt: new Date(),
      updatedAt: new Date(),
      items: [],
      stateChanges: [],
    };
    vi.mocked(mockOrderRepo.create).mockResolvedValueOnce(ok(mockCreatedOrder));

    // Menu item with price 100.00
    const expensiveItem: MenuItemWithModifiers = {
      ...fakeDrink,
      price: "100.00",
    };
    vi.mocked(mockMenuRepo.getItemWithModifiers).mockResolvedValueOnce(ok(expensiveItem));

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      taxRate: "0.0500", // Client attempts to claim 5%
      items: [{ menuItemId: "item-drink", quantity: 1 }],
    };

    const result = await createOrder(deps, request);

    expect(result.ok).toBe(true);
    expect(mockOrderRepo.create).toHaveBeenCalledTimes(1);

    const firstCall = vi.mocked(mockOrderRepo.create).mock.calls[0];
    expect(firstCall).toBeDefined();
    if (!firstCall) return;
    const createArg = firstCall[0];
    expect(createArg).toBeDefined();
    if (!createArg) return;

    expect(createArg.taxRate).toBe("0.0825");
    expect(createArg.taxAmount).toBe("8.25");
    expect(createArg.total).toBe("108.25");
  });

  it("Rejects place type / place ID mismatches with VALIDATION_FAILED", async () => {
    // Missing tableId for TABLE
    const missingTableReq: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };
    const r1 = await createOrder(deps, missingTableReq);
    expect(r1.ok).toBe(false);
    if (!r1.ok) {
      expect(r1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(r1.error.message).toContain("tableId is required");
    }

    // Missing roomId for ROOM
    const missingRoomReq: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.ROOM,
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };
    const r2 = await createOrder(deps, missingRoomReq);
    expect(r2.ok).toBe(false);
    if (!r2.ok) {
      expect(r2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(r2.error.message).toContain("roomId is required");
    }

    // Missing counterId for COUNTER
    const missingCounterReq: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.COUNTER,
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };
    const r3 = await createOrder(deps, missingCounterReq);
    expect(r3.ok).toBe(false);
    if (!r3.ok) {
      expect(r3.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(r3.error.message).toContain("counterId is required");
    }
  });

  it("Rejects invalid item quantities and empty items list", async () => {
    // Empty items
    const emptyItemsReq: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [],
    };
    const r1 = await createOrder(deps, emptyItemsReq);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

    // Quantity <= 0
    const zeroQtyReq: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 0 }],
    };
    const r2 = await createOrder(deps, zeroQtyReq);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

    // Float quantity
    const floatQtyReq: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 1.5 }],
    };
    const r3 = await createOrder(deps, floatQtyReq);
    expect(r3.ok).toBe(false);
    if (!r3.ok) expect(r3.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
  });

  it("Rejects invalid modifier option not belonging to the menu item", async () => {
    const invalidModReq: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [
        {
          menuItemId: "item-burger",
          quantity: 1,
          selectedModifierIds: ["opt-nonexistent-999"],
        },
      ],
    };

    const result = await createOrder(deps, invalidModReq);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result.error.message).toContain("Modifier option 'opt-nonexistent-999' is invalid");
    }
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it("Propagates venue repository failure", async () => {
    vi.mocked(mockVenueRepo.findById).mockResolvedValueOnce(
      fail(DomainErrorCode.NOT_FOUND, "Venue not found")
    );

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };

    const result = await createOrder(deps, request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(result.error.message).toBe("Venue not found");
    }
  });

  it("Propagates unexpected failure from findByIdempotencyKey", async () => {
    vi.mocked(mockOrderRepo.findByIdempotencyKey).mockResolvedValueOnce(
      fail(DomainErrorCode.INTERNAL, "DB connection error")
    );

    const request: CreateOrderRequest = {
      venueId,
      idempotencyKey: validUUID,
      placeType: PlaceType.TABLE,
      tableId: "table-1",
      items: [{ menuItemId: "item-burger", quantity: 1 }],
    };

    const result = await createOrder(deps, request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
      expect(result.error.message).toBe("DB connection error");
    }
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });
});
