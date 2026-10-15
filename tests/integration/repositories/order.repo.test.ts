import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { prisma } from "@/infrastructure/db/client";
import { cleanTestDatabase } from "../setup";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import {
  OrderState,
  PlaceType,
  type CreateOrderInput,
} from "@/domain/orders/order.repository";
import { DomainErrorCode } from "@/domain/shared/result";

describe("OrderRepository Integration Tests", () => {
  beforeEach(async () => {
    await cleanTestDatabase();
  });

  afterAll(async () => {
    await cleanTestDatabase();
  });

  async function createFixtureVenue(suffix: string) {
    const venueRepo = createPrismaVenueRepository(prisma);
    const result = await venueRepo.create({
      name: `Order Venue ${suffix}`,
      slug: `order-venue-${Date.now()}-${suffix}`,
      taxRate: "0.1000",
      modules: ["TABLE", "ROOM"],
    });
    if (!result.ok) {
      throw new Error(`Failed to create fixture venue: ${result.error.message}`);
    }
    return result.value;
  }

  function makeOrderInput(
    venueId: string,
    idempotencyKey: string,
    overrides?: Partial<CreateOrderInput>
  ): CreateOrderInput {
    return {
      venueId,
      idempotencyKey,
      placeType: PlaceType.TABLE,
      pickupName: "Guest Alpha",
      subtotal: "35.50",
      taxRate: "0.1000",
      taxAmount: "3.55",
      total: "39.05",
      notes: "Please deliver cutlery",
      items: [
        {
          itemName: "Margherita Pizza",
          itemPrice: "15.00",
          quantity: 2,
          modifierPrice: "2.75",
          lineTotal: "35.50",
          notes: "Extra basil",
          modifiersJson: [{ name: "Extra Cheese", price: "2.75" }],
        },
      ],
      ...overrides,
    };
  }

  it("Case 1: create writes the order, its items, and its first OrderStateChange (PLACED)", async () => {
    const venue = await createFixtureVenue("c1");
    const orderRepo = createPrismaOrderRepository(prisma);
    const key = `key-c1-${Date.now()}`;

    const createResult = await orderRepo.create(makeOrderInput(venue.id, key));
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;

    const order = createResult.value;
    expect(order.id).toBeDefined();
    expect(order.venueId).toBe(venue.id);
    expect(order.state).toBe(OrderState.PLACED);
    expect(order.placeType).toBe(PlaceType.TABLE);

    // Verify items in domain return
    expect(order.items).toHaveLength(1);
    expect(order.items[0]?.itemName).toBe("Margherita Pizza");
    expect(order.items[0]?.quantity).toBe(2);

    // Verify first OrderStateChange in domain return
    expect(order.stateChanges).toHaveLength(1);
    expect(order.stateChanges[0]?.state).toBe(OrderState.PLACED);
    expect(order.stateChanges[0]?.note).toBeNull();
    expect(order.stateChanges[0]?.occurredAt).toBeInstanceOf(Date);

    // Direct database assertions: all 3 exist in DB
    const dbOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true, stateChanges: true },
    });
    expect(dbOrder).not.toBeNull();
    expect(dbOrder?.items).toHaveLength(1);
    expect(dbOrder?.stateChanges).toHaveLength(1);
    expect(dbOrder?.stateChanges[0]?.state).toBe("PLACED");
  });

  it("Case 2: duplicate create with identical idempotencyKey returns ok(existingOrder) and creates no second row", async () => {
    const venue = await createFixtureVenue("c2");
    const orderRepo = createPrismaOrderRepository(prisma);
    const key = `key-c2-idem-${Date.now()}`;

    // First create
    const firstResult = await orderRepo.create(makeOrderInput(venue.id, key));
    expect(firstResult.ok).toBe(true);
    if (!firstResult.ok) return;

    // Second create with the exact same idempotencyKey
    const secondResult = await orderRepo.create(
      makeOrderInput(venue.id, key, { notes: "Different notes on retry" })
    );
    expect(secondResult.ok).toBe(true);
    if (!secondResult.ok) return;

    // Both returned the same order ID
    expect(secondResult.value.id).toBe(firstResult.value.id);
    expect(secondResult.value.notes).toBe("Please deliver cutlery"); // Unmodified original row

    // Database check: exactly 1 order row exists
    const orderCount = await prisma.order.count({
      where: { venueId: venue.id },
    });
    expect(orderCount).toBe(1);

    const itemCount = await prisma.orderItem.count({
      where: { orderId: firstResult.value.id },
    });
    expect(itemCount).toBe(1);

    const stateChangeCount = await prisma.orderStateChange.count({
      where: { orderId: firstResult.value.id },
    });
    expect(stateChangeCount).toBe(1);
  });

  it("Case 3: create with different idempotencyKey creates a second distinct order", async () => {
    const venue = await createFixtureVenue("c3");
    const orderRepo = createPrismaOrderRepository(prisma);

    const firstResult = await orderRepo.create(
      makeOrderInput(venue.id, `key-c3-a-${Date.now()}`)
    );
    const secondResult = await orderRepo.create(
      makeOrderInput(venue.id, `key-c3-b-${Date.now()}`)
    );

    expect(firstResult.ok).toBe(true);
    expect(secondResult.ok).toBe(true);
    if (!firstResult.ok || !secondResult.ok) return;

    expect(firstResult.value.id).not.toBe(secondResult.value.id);

    const totalOrders = await prisma.order.count({
      where: { venueId: venue.id },
    });
    expect(totalOrders).toBe(2);
  });

  it("Case 4: findById returns order with items and state changes", async () => {
    const venue = await createFixtureVenue("c4");
    const orderRepo = createPrismaOrderRepository(prisma);
    const key = `key-c4-${Date.now()}`;

    const created = await orderRepo.create(makeOrderInput(venue.id, key));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const found = await orderRepo.findById(venue.id, created.value.id);
    expect(found.ok).toBe(true);
    if (!found.ok) return;

    expect(found.value.id).toBe(created.value.id);
    expect(found.value.items).toHaveLength(1);
    expect(found.value.items[0]?.itemName).toBe("Margherita Pizza");
    expect(found.value.stateChanges).toHaveLength(1);
    expect(found.value.stateChanges[0]?.state).toBe(OrderState.PLACED);
  });

  it("Case 5: findByIdempotencyKey returns order", async () => {
    const venue = await createFixtureVenue("c5");
    const orderRepo = createPrismaOrderRepository(prisma);
    const key = `key-c5-${Date.now()}`;

    const created = await orderRepo.create(makeOrderInput(venue.id, key));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const found = await orderRepo.findByIdempotencyKey(venue.id, key);
    expect(found.ok).toBe(true);
    if (!found.ok) return;

    expect(found.value.id).toBe(created.value.id);
    expect(found.value.venueId).toBe(venue.id);
  });

  it("Case 6: listForVenue returns orders and respects state filtering", async () => {
    const venue = await createFixtureVenue("c6");
    const orderRepo = createPrismaOrderRepository(prisma);

    const o1 = await orderRepo.create(
      makeOrderInput(venue.id, `key-c6-1-${Date.now()}`)
    );
    const o2 = await orderRepo.create(
      makeOrderInput(venue.id, `key-c6-2-${Date.now()}`)
    );
    expect(o1.ok).toBe(true);
    expect(o2.ok).toBe(true);
    if (!o1.ok || !o2.ok) return;

    // Advance o2 to APPROVED
    await orderRepo.advanceState({
      venueId: venue.id,
      orderId: o2.value.id,
      toState: OrderState.APPROVED,
    });

    const allOrders = await orderRepo.listForVenue(venue.id);
    expect(allOrders.ok).toBe(true);
    if (allOrders.ok) {
      expect(allOrders.value).toHaveLength(2);
    }

    const filtered = await orderRepo.listForVenue(venue.id, {
      state: OrderState.APPROVED,
    });
    expect(filtered.ok).toBe(true);
    if (filtered.ok) {
      expect(filtered.value).toHaveLength(1);
      expect(filtered.value[0]?.id).toBe(o2.value.id);
      expect(filtered.value[0]?.state).toBe(OrderState.APPROVED);
    }
  });

  it("Case 7: listForVenue returns ok([]) for venue with no orders", async () => {
    const venue = await createFixtureVenue("c7");
    const orderRepo = createPrismaOrderRepository(prisma);

    const result = await orderRepo.listForVenue(venue.id);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("Case 8: listForGuestSession returns orders for guest session", async () => {
    const venue = await createFixtureVenue("c8");
    const orderRepo = createPrismaOrderRepository(prisma);

    // Create a QR token and guest session
    const qrToken = await prisma.qrToken.create({
      data: {
        venueId: venue.id,
        placeType: "TABLE",
      },
    });

    const session = await prisma.guestSession.create({
      data: {
        venueId: venue.id,
        qrTokenId: qrToken.id,
        placeType: "TABLE",
      },
    });

    const orderWithSession = await orderRepo.create(
      makeOrderInput(venue.id, `key-c8-sess-${Date.now()}`, {
        guestSessionId: session.id,
      })
    );
    expect(orderWithSession.ok).toBe(true);

    const sessionOrders = await orderRepo.listForGuestSession(
      venue.id,
      session.id
    );
    expect(sessionOrders.ok).toBe(true);
    if (sessionOrders.ok) {
      expect(sessionOrders.value).toHaveLength(1);
      expect(sessionOrders.value[0]?.guestSessionId).toBe(session.id);
    }

    const otherSession = await orderRepo.listForGuestSession(
      venue.id,
      "non-existent-session"
    );
    expect(otherSession.ok).toBe(true);
    if (otherSession.ok) {
      expect(otherSession.value).toEqual([]);
    }
  });

  it("Case 9: advanceState writes new state and a new OrderStateChange", async () => {
    const venue = await createFixtureVenue("c9");
    const orderRepo = createPrismaOrderRepository(prisma);
    const key = `key-c9-${Date.now()}`;

    const created = await orderRepo.create(makeOrderInput(venue.id, key));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const advanced = await orderRepo.advanceState({
      venueId: venue.id,
      orderId: created.value.id,
      toState: OrderState.PREPARING,
      staffMemberId: null,
    });

    expect(advanced.ok).toBe(true);
    if (!advanced.ok) return;

    expect(advanced.value.state).toBe(OrderState.PREPARING);
    expect(advanced.value.stateChanges).toHaveLength(2);
    expect(advanced.value.stateChanges[0]?.state).toBe(OrderState.PLACED);
    expect(advanced.value.stateChanges[1]?.state).toBe(OrderState.PREPARING);
    expect(advanced.value.stateChanges[1]?.note).toBeNull();

    // Verify in DB directly
    const dbChanges = await prisma.orderStateChange.findMany({
      where: { orderId: created.value.id },
      orderBy: { occurredAt: "asc" },
    });
    expect(dbChanges).toHaveLength(2);
    expect(dbChanges[1]?.state).toBe("PREPARING");
  });

  it("Case 10: cancel writes CANCELLED and a new OrderStateChange with reason", async () => {
    const venue = await createFixtureVenue("c10");
    const orderRepo = createPrismaOrderRepository(prisma);
    const key = `key-c10-${Date.now()}`;

    const created = await orderRepo.create(makeOrderInput(venue.id, key));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const cancelReason = "Kitchen ran out of dough";
    const cancelled = await orderRepo.cancel({
      venueId: venue.id,
      orderId: created.value.id,
      reason: cancelReason,
      staffMemberId: null,
    });

    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;

    expect(cancelled.value.state).toBe(OrderState.CANCELLED);
    expect(cancelled.value.stateChanges).toHaveLength(2);
    expect(cancelled.value.stateChanges[1]?.state).toBe(OrderState.CANCELLED);
    expect(cancelled.value.stateChanges[1]?.note).toBe(cancelReason);

    // Verify in DB directly
    const dbChanges = await prisma.orderStateChange.findMany({
      where: { orderId: created.value.id },
      orderBy: { occurredAt: "asc" },
    });
    expect(dbChanges).toHaveLength(2);
    expect(dbChanges[1]?.state).toBe("CANCELLED");
    expect(dbChanges[1]?.note).toBe(cancelReason);
  });

  it("Case 11: money fields round-trip as decimal strings without floating-point coercion", async () => {
    const venue = await createFixtureVenue("c11");
    const orderRepo = createPrismaOrderRepository(prisma);
    const key = `key-c11-${Date.now()}`;

    const created = await orderRepo.create(
      makeOrderInput(venue.id, key, {
        subtotal: "42.00",
        taxRate: "0.0825",
        taxAmount: "3.47",
        total: "45.47",
        items: [
          {
            itemName: "Special Truffle Pasta",
            itemPrice: "38.50",
            quantity: 1,
            modifierPrice: "3.50",
            lineTotal: "42.00",
            modifiersJson: [{ name: "Extra Truffle", price: "3.50" }],
          },
        ],
      })
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const found = await orderRepo.findById(venue.id, created.value.id);
    expect(found.ok).toBe(true);
    if (!found.ok) return;

    const order = found.value;
    // Types must be strictly string on the read path
    expect(typeof order.subtotal).toBe("string");
    expect(typeof order.taxRate).toBe("string");
    expect(typeof order.taxAmount).toBe("string");
    expect(typeof order.total).toBe("string");

    // Exact string round-trip with correct 2 decimal places
    expect(order.subtotal).toBe("42.00");
    expect(order.taxAmount).toBe("3.47");
    expect(order.total).toBe("45.47");

    const item = order.items[0];
    expect(item).toBeDefined();
    if (item) {
      expect(typeof item.itemPrice).toBe("string");
      expect(typeof item.modifierPrice).toBe("string");
      expect(typeof item.lineTotal).toBe("string");

      expect(item.itemPrice).toBe("38.50");
      expect(item.modifierPrice).toBe("3.50");
      expect(item.lineTotal).toBe("42.00");
    }
  });

  it("Case 12: cross-venue read returns NOT_FOUND, never FORBIDDEN", async () => {
    const venueA = await createFixtureVenue("c12a");
    const venueB = await createFixtureVenue("c12b");
    const orderRepo = createPrismaOrderRepository(prisma);

    const createdA = await orderRepo.create(
      makeOrderInput(venueA.id, `key-c12-${Date.now()}`)
    );
    expect(createdA.ok).toBe(true);
    if (!createdA.ok) return;

    // Venue B attempts to read Venue A's order by ID
    const crossById = await orderRepo.findById(venueB.id, createdA.value.id);
    expect(crossById.ok).toBe(false);
    if (!crossById.ok) {
      expect(crossById.error.code).toBe(DomainErrorCode.NOT_FOUND);
    }

    // Venue B attempts to read Venue A's order by idempotency key
    const crossByKey = await orderRepo.findByIdempotencyKey(
      venueB.id,
      createdA.value.id
    );
    expect(crossByKey.ok).toBe(false);
    if (!crossByKey.ok) {
      expect(crossByKey.error.code).toBe(DomainErrorCode.NOT_FOUND);
    }
  });

  it("Case 13: advanceState and cancel return NOT_FOUND on non-existent or cross-venue order", async () => {
    const venueA = await createFixtureVenue("c13a");
    const venueB = await createFixtureVenue("c13b");
    const orderRepo = createPrismaOrderRepository(prisma);

    const createdA = await orderRepo.create(
      makeOrderInput(venueA.id, `key-c13-${Date.now()}`)
    );
    expect(createdA.ok).toBe(true);
    if (!createdA.ok) return;

    // Cross-venue advanceState
    const crossAdvance = await orderRepo.advanceState({
      venueId: venueB.id,
      orderId: createdA.value.id,
      toState: OrderState.PREPARING,
    });
    expect(crossAdvance.ok).toBe(false);
    if (!crossAdvance.ok) {
      expect(crossAdvance.error.code).toBe(DomainErrorCode.NOT_FOUND);
    }

    // Cross-venue cancel
    const crossCancel = await orderRepo.cancel({
      venueId: venueB.id,
      orderId: createdA.value.id,
      reason: "Unauthorized attempt",
    });
    expect(crossCancel.ok).toBe(false);
    if (!crossCancel.ok) {
      expect(crossCancel.error.code).toBe(DomainErrorCode.NOT_FOUND);
    }
  });
});
