import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, setTestDbClient } from "@/../app/api/guest/orders/route";
import { withTransaction } from "../setup";
import { PlaceType } from "@/domain/orders/order.repository";
import { MenuItemState, ModifierChoiceType } from "@/domain/menu/menu.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";

vi.mock("@/infrastructure/guest/cookies", () => ({
  getGuestCookie: vi.fn(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

import { getGuestCookie } from "@/infrastructure/guest/cookies";

describe("POST /api/guest/orders Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("Happy path: creates an order with frozen database money, initial PLACED state change, and session place context (201)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      // 1. Fixture: venue with 10% tax rate
      const venue = await tx.venue.create({
        data: {
          name: "Bistro Orders Test",
          slug: `bistro-orders-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      // 2. Fixture: table
      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-42",
        },
      });

      // 3. Fixture: menu category and item ($12.00)
      const category = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Mains",
          sortOrder: 1,
        },
      });

      const menuItem = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Truffle Burger",
          description: "Black truffle burger",
          price: "12.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      // 4. Fixture: modifier group and option (+$2.50)
      const modGroup = await tx.modifierGroup.create({
        data: {
          menuItemId: menuItem.id,
          name: "Add Cheese",
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

      // 5. Fixture: guest session linked to table
      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;
      const guestSession = sessionResult.value;

      vi.mocked(getGuestCookie).mockResolvedValue(guestSession.token);

      const idempotencyKey = "22222222-2222-4222-8222-222222222222";
      const request = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          items: [
            {
              menuItemId: menuItem.id,
              quantity: 2,
              selectedModifierIds: [modOption.id],
              notes: "Extra crispy",
            },
          ],
          notes: "Please hurry",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      const order = json.data;

      // Assert order totals:
      // Base: $12.00 + Mod: $2.50 = $14.50 unit total.
      // Qty 2 -> lineTotal = $29.00 -> subtotal = 29.00.
      // Tax: 10% of 29.00 = 2.90.
      // Total: 29.00 + 2.90 = 31.90.
      expect(order.subtotal).toBe("29.00");
      expect(order.taxRate).toBe("0.1000");
      expect(order.taxAmount).toBe("2.90");
      expect(order.total).toBe("31.90");
      expect(order.state).toBe("PLACED");
      expect(order.placeType).toBe("TABLE");
      expect(order.tableId).toBe(table.id);
      expect(order.guestSessionId).toBe(guestSession.id);
      expect(order.notes).toBe("Please hurry");
      expect(order.items).toHaveLength(1);
      expect(order.items[0].itemName).toBe("Truffle Burger");
      expect(order.items[0].itemPrice).toBe("12.00");
      expect(order.items[0].modifierPrice).toBe("2.50");
      expect(order.items[0].lineTotal).toBe("29.00");
      expect(order.items[0].notes).toBe("Extra crispy");

      // Verify persisted state change in database
      const dbOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true, stateChanges: true },
      });
      expect(dbOrder).not.toBeNull();
      expect(dbOrder?.stateChanges).toHaveLength(1);
      expect(dbOrder?.stateChanges[0]?.state).toBe("PLACED");
    });
  });

  it("Rejects missing or malformed idempotencyKey with 400 VALIDATION_FAILED", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Bistro Malformed Key",
          slug: `bistro-malformed-${Date.now()}`,
          taxRate: "0.0825",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-1" },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;
      const guestSession = sessionResult.value;

      vi.mocked(getGuestCookie).mockResolvedValue(guestSession.token);

      // Missing idempotency key
      const req1 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ menuItemId: "some-item", quantity: 1 }],
        }),
      });

      const res1 = await POST(req1);
      expect(res1.status).toBe(400);
      const json1 = await res1.json();
      expect(json1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(json1.error.message).toContain("idempotencyKey");

      // Malformed idempotency key (not UUID)
      const req2 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "not-a-uuid-1234",
          items: [{ menuItemId: "some-item", quantity: 1 }],
        }),
      });

      const res2 = await POST(req2);
      expect(res2.status).toBe(400);
      const json2 = await res2.json();
      expect(json2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      // Verify no order created
      const count = await tx.order.count({ where: { venueId: venue.id } });
      expect(count).toBe(0);
    });
  });

  it("Rejects unauthenticated request when guest cookie is missing or session is invalid (401)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      // 1. Missing cookie
      vi.mocked(getGuestCookie).mockResolvedValue(null);

      const req1 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "44444444-4444-4444-8444-444444444444",
          items: [{ menuItemId: "item-1", quantity: 1 }],
        }),
      });

      const res1 = await POST(req1);
      expect(res1.status).toBe(401);
      const json1 = await res1.json();
      expect(json1.error.code).toBe(DomainErrorCode.UNAUTHORIZED);

      // 2. Cookie contains unknown token
      vi.mocked(getGuestCookie).mockResolvedValue("55555555-5555-4555-8555-555555555555");

      const req2 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "44444444-4444-4444-8444-444444444444",
          items: [{ menuItemId: "item-1", quantity: 1 }],
        }),
      });

      const res2 = await POST(req2);
      expect(res2.status).toBe(401);
      const json2 = await res2.json();
      expect(json2.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
    });
  });

  it("Strictly ignores client-supplied venue, table, prices, tax, and totals (D-2.1, D-4.1)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Authoritative Venue",
          slug: `authoritative-venue-${Date.now()}`,
          taxRate: "0.0500", // 5%
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-99" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Pizzas", sortOrder: 1 },
      });

      const pizza = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Margherita Pizza",
          price: "20.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;
      const guestSession = sessionResult.value;

      vi.mocked(getGuestCookie).mockResolvedValue(guestSession.token);

      // Client attempts to spoof venue, table, price ($0.01), subtotal, tax, and total
      const spoofedRequest = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId: "fake-venue-id-attack",
          tableId: "fake-table-id-attack",
          idempotencyKey: "77777777-7777-4777-8777-777777777777",
          subtotal: "0.01",
          taxRate: "0.00",
          taxAmount: "0.00",
          total: "0.01",
          items: [
            {
              menuItemId: pizza.id,
              quantity: 1,
              price: "0.01",
              lineTotal: "0.01",
            },
          ],
        }),
      });

      const response = await POST(spoofedRequest);
      expect(response.status).toBe(201);

      const json = await response.json();
      const order = json.data;

      // Authoritative values enforced from session and DB
      expect(order.venueId).toBe(venue.id);
      expect(order.tableId).toBe(table.id);
      expect(order.subtotal).toBe("20.00"); // Not 0.01
      expect(order.taxRate).toBe("0.0500");
      expect(order.taxAmount).toBe("1.00");
      expect(order.total).toBe("21.00"); // Not 0.01
    });
  });

  it("Idempotency: repeating identical request returns existing order without creating duplicate rows", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Idempotency Venue",
          slug: `idempotency-venue-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-7" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Drinks", sortOrder: 1 },
      });

      const drink = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Sparkling Lemonade",
          price: "5.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;
      const guestSession = sessionResult.value;

      vi.mocked(getGuestCookie).mockResolvedValue(guestSession.token);

      const idempotencyKey = "99999999-9999-4999-8999-999999999999";
      const payload = {
        idempotencyKey,
        items: [{ menuItemId: drink.id, quantity: 1 }],
      };

      // First call
      const req1 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res1 = await POST(req1);
      expect(res1.status).toBe(201);
      const json1 = await res1.json();
      const firstOrderId = json1.data.id;

      // Second call with same idempotencyKey
      const req2 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(201);
      const json2 = await res2.json();

      expect(json2.data.id).toBe(firstOrderId);

      // Verify exactly 1 order row exists
      const count = await tx.order.count({ where: { venueId: venue.id } });
      expect(count).toBe(1);
    });
  });

  it("Counter flow captures pickupName alongside placeContext", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Counter Venue",
          slug: `counter-venue-${Date.now()}`,
          taxRate: "0.0800",
        },
      });

      const counter = await tx.counter.create({
        data: { venueId: venue.id, name: "Main Counter" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Pastries", sortOrder: 1 },
      });

      const pastry = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Croissant",
          price: "4.50",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.COUNTER,
        placeId: counter.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;
      const guestSession = sessionResult.value;

      vi.mocked(getGuestCookie).mockResolvedValue(guestSession.token);

      const idempotencyKey = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
      const request = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          items: [{ menuItemId: pastry.id, quantity: 1 }],
          pickupName: "Ramesh",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.data.placeType).toBe("COUNTER");
      expect(json.data.counterId).toBe(counter.id);
      expect(json.data.pickupName).toBe("Ramesh");
    });
  });
});
