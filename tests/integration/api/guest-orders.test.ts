import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  POST,
  GET as listOrders,
  setTestDbClient as setTestDbClientForOrdersRoute,
} from "@/../app/api/guest/orders/route";
import {
  GET as getOrderById,
  setTestDbClient as setTestDbClientForIdRoute,
} from "@/../app/api/guest/orders/[id]/route";
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

function setTestDbClient(client: Parameters<typeof setTestDbClientForOrdersRoute>[0]): void {
  setTestDbClientForOrdersRoute(client);
  setTestDbClientForIdRoute(client);
}

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

describe("GET /api/guest/orders/[id] Integration Tests (Task 5.6.2)", () => {
  it("5.6.2 Happy path: reads order for session and verifies frozen money (200)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Read Order Venue",
          slug: `read-order-venue-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-50" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Pizzas", sortOrder: 1 },
      });

      const item = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Special Pizza",
          price: "15.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      const modGroup = await tx.modifierGroup.create({
        data: {
          menuItemId: item.id,
          name: "Crust",
          choiceType: ModifierChoiceType.SINGLE,
          isRequired: false,
          sortOrder: 1,
        },
      });

      const modOption = await tx.modifierOption.create({
        data: {
          modifierGroupId: modGroup.id,
          name: "Stuffed Crust",
          additionalPrice: "2.50",
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

      // Create an order via POST
      const postReq = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "12345678-1234-4234-8234-1234567890ab",
          items: [
            {
              menuItemId: item.id,
              quantity: 1,
              selectedModifierIds: [modOption.id],
            },
          ],
        }),
      });

      const postRes = await POST(postReq);
      expect(postRes.status).toBe(201);
      const postJson = await postRes.json();
      const createdOrderId = postJson.data.id;

      // Read back with GET /api/guest/orders/[id]
      const getReq = new NextRequest(
        `http://localhost/api/guest/orders/${createdOrderId}`,
        { method: "GET" }
      );
      const getRes = await getOrderById(getReq, {
        params: Promise.resolve({ id: createdOrderId }),
      });

      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();
      expect(getJson).toHaveProperty("data");
      const readOrder = getJson.data;

      expect(readOrder.id).toBe(createdOrderId);
      expect(readOrder.guestSessionId).toBe(guestSession.id);
      expect(readOrder.subtotal).toBe("17.50");
      expect(readOrder.taxRate).toBe("0.1000");
      expect(readOrder.taxAmount).toBe("1.75");
      expect(readOrder.total).toBe("19.25");
      expect(readOrder.items).toHaveLength(1);
      expect(readOrder.items[0].itemName).toBe("Special Pizza");
      expect(readOrder.items[0].itemPrice).toBe("15.00");
      expect(readOrder.items[0].modifierPrice).toBe("2.50");
      expect(readOrder.items[0].lineTotal).toBe("17.50");
    });
  });

  it("5.6.2 NOT_FOUND for a nonexistent id (404)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Nonexistent Order Venue",
          slug: `nonexistent-venue-${Date.now()}`,
          taxRate: "0.0825",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-10" },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      const nonexistentId = "99999999-0000-4000-8000-000000000000";
      const getReq = new NextRequest(
        `http://localhost/api/guest/orders/${nonexistentId}`,
        { method: "GET" }
      );
      const getRes = await getOrderById(getReq, {
        params: Promise.resolve({ id: nonexistentId }),
      });

      expect(getRes.status).toBe(404);
      const json = await getRes.json();
      expect(json.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(json.error.message).toContain("not found");
      expect(json).not.toHaveProperty("data");
    });
  });

  it("5.6.2 Privacy negative (mandatory): reading another guest session's order returns 404 NOT_FOUND (no leak)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Privacy Venue",
          slug: `privacy-venue-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-99" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Salads", sortOrder: 1 },
      });

      const item = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Caesar Salad",
          price: "10.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      // 1. Guest Session A places an order
      const sessionResultA = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResultA.ok).toBe(true);
      if (!sessionResultA.ok) return;
      const sessionA = sessionResultA.value;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.token);

      const postReq = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
          items: [{ menuItemId: item.id, quantity: 1 }],
        }),
      });
      const postRes = await POST(postReq);
      expect(postRes.status).toBe(201);
      const postJson = await postRes.json();
      const orderAId = postJson.data.id;

      // 2. Guest Session B (second session at the same table/venue) attempts to read Order A
      const sessionResultB = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResultB.ok).toBe(true);
      if (!sessionResultB.ok) return;
      const sessionB = sessionResultB.value;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionB.token);

      const getReq = new NextRequest(
        `http://localhost/api/guest/orders/${orderAId}`,
        { method: "GET" }
      );
      const getRes = await getOrderById(getReq, {
        params: Promise.resolve({ id: orderAId }),
      });

      // Assert 404 NOT_FOUND (never 403 or 200), generic message, no data returned
      expect(getRes.status).toBe(404);
      const json = await getRes.json();
      expect(json.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(json.error.message).toContain("not found");
      expect(json).not.toHaveProperty("data");
    });
  });

  it("5.6.2 No session returns 401 UNAUTHORIZED", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      vi.mocked(getGuestCookie).mockResolvedValue(null);

      const validId = "11111111-2222-4333-8444-555555555555";
      const getReq = new NextRequest(
        `http://localhost/api/guest/orders/${validId}`,
        { method: "GET" }
      );
      const getRes = await getOrderById(getReq, {
        params: Promise.resolve({ id: validId }),
      });

      expect(getRes.status).toBe(401);
      const json = await getRes.json();
      expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
      expect(json.error.message).toBe("No active guest session");
    });
  });
});

describe("GET /api/guest/orders Integration Tests (Task 5.6.3)", () => {
  it("5.6.3 Happy path: lists only the session's own orders (200)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "List Orders Venue",
          slug: `list-orders-venue-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T-22" },
      });

      const category = await tx.menuCategory.create({
        data: { venueId: venue.id, name: "Snacks", sortOrder: 1 },
      });

      const snack = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Truffle Fries",
          price: "8.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      // 1. Session A creates 2 orders
      const sessionResultA = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResultA.ok).toBe(true);
      if (!sessionResultA.ok) return;
      const sessionA = sessionResultA.value;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.token);

      const postReqA1 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "11111111-aaaa-4aaa-8aaa-111111111111",
          items: [{ menuItemId: snack.id, quantity: 1 }],
        }),
      });
      const postResA1 = await POST(postReqA1);
      expect(postResA1.status).toBe(201);
      const postJsonA1 = await postResA1.json();
      const orderA1Id = postJsonA1.data.id;

      const postReqA2 = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "22222222-aaaa-4aaa-8aaa-222222222222",
          items: [{ menuItemId: snack.id, quantity: 2 }],
        }),
      });
      const postResA2 = await POST(postReqA2);
      expect(postResA2.status).toBe(201);
      const postJsonA2 = await postResA2.json();
      const orderA2Id = postJsonA2.data.id;

      // 2. Session B creates 1 order in the same venue
      const sessionResultB = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResultB.ok).toBe(true);
      if (!sessionResultB.ok) return;
      const sessionB = sessionResultB.value;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionB.token);

      const postReqB = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "33333333-bbbb-4bbb-8bbb-333333333333",
          items: [{ menuItemId: snack.id, quantity: 3 }],
        }),
      });
      const postResB = await POST(postReqB);
      expect(postResB.status).toBe(201);
      const postJsonB = await postResB.json();
      const orderBId = postJsonB.data.id;

      // 3. Switch back to Session A and list orders
      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.token);

      const listReq = new NextRequest("http://localhost/api/guest/orders", {
        method: "GET",
      });
      const listRes = await listOrders(listReq);

      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();
      expect(listJson).toHaveProperty("data");
      const orders = listJson.data;

      // Assert exactly Session A's orders are returned
      expect(orders).toHaveLength(2);
      const orderIds = orders.map((o: { id: string }) => o.id);
      expect(orderIds).toContain(orderA1Id);
      expect(orderIds).toContain(orderA2Id);
      expect(orderIds).not.toContain(orderBId);

      // Assert every returned order belongs strictly to Session A
      expect(
        orders.every(
          (o: { guestSessionId: string }) => o.guestSessionId === sessionA.id
        )
      ).toBe(true);
    });
  });

  it("5.6.3 No session returns 401 UNAUTHORIZED", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      vi.mocked(getGuestCookie).mockResolvedValue(null);

      const listReq = new NextRequest("http://localhost/api/guest/orders", {
        method: "GET",
      });
      const listRes = await listOrders(listReq);

      expect(listRes.status).toBe(401);
      const json = await listRes.json();
      expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
      expect(json.error.message).toBe("No active guest session");
    });
  });
});

describe("Milestone 5.6 Verification — Complete Guest Order Flow and Envelope Conformance (Task 5.6.4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("5.6.4 Full guest order flow: place order -> read back by id -> list session orders with SYSTEM.md §12 envelope conformance", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      // 1. Fixture: venue with 10% tax rate
      const venue = await tx.venue.create({
        data: {
          name: "Flow Verification Bistro",
          slug: `flow-verify-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      // 2. Fixture: table
      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-VERIFY",
        },
      });

      // 3. Fixture: menu category & item ($10.00)
      const category = await tx.menuCategory.create({
        data: {
          venueId: venue.id,
          name: "Mains",
          sortOrder: 1,
        },
      });

      const burger = await tx.menuItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Verification Burger",
          description: "Burger for verification",
          price: "10.00",
          state: MenuItemState.AVAILABLE,
          sortOrder: 1,
        },
      });

      // 4. Fixture: modifier group & option (+$2.00)
      const modGroup = await tx.modifierGroup.create({
        data: {
          menuItemId: burger.id,
          name: "Add-ons",
          choiceType: ModifierChoiceType.SINGLE,
          isRequired: false,
          sortOrder: 1,
        },
      });

      const cheese = await tx.modifierOption.create({
        data: {
          modifierGroupId: modGroup.id,
          name: "Extra Cheddar",
          additionalPrice: "2.00",
          sortOrder: 1,
        },
      });

      // 5. Fixture: active guest session for table
      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) throw new Error("Failed to create guest session fixture");
      const guestSession = sessionResult.value;

      vi.mocked(getGuestCookie).mockResolvedValue(guestSession.token);

      // --- STEP A: POST /api/guest/orders (Place Order) ---
      const postReq = new NextRequest("http://localhost/api/guest/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: "44444444-cccc-4ccc-8ccc-444444444444",
          items: [
            {
              menuItemId: burger.id,
              quantity: 2,
              selectedModifierIds: [cheese.id],
            },
          ],
        }),
      });

      const postRes = await POST(postReq);
      expect(postRes.status).toBe(201);
      const postJson = await postRes.json();

      // Envelope check: success envelope has data, no error (SYSTEM.md §12.1)
      expect(postJson).toHaveProperty("data");
      expect(postJson).not.toHaveProperty("error");
      const createdOrder = postJson.data;

      // Assert created order properties & frozen database money
      // unit price = 10.00, modifier = 2.00 => line total = (10+2)*2 = 24.00
      // subtotal = 24.00, taxRate = 0.1000, taxAmount = 2.40, total = 26.40
      expect(createdOrder.venueId).toBe(venue.id);
      expect(createdOrder.guestSessionId).toBe(guestSession.id);
      expect(createdOrder.placeType).toBe(PlaceType.TABLE);
      expect(createdOrder.tableId).toBe(table.id);
      expect(createdOrder.subtotal).toBe("24.00");
      expect(createdOrder.taxRate).toBe("0.1000");
      expect(createdOrder.taxAmount).toBe("2.40");
      expect(createdOrder.total).toBe("26.40");
      expect(createdOrder.items).toHaveLength(1);
      expect(createdOrder.items[0].quantity).toBe(2);
      expect(createdOrder.items[0].lineTotal).toBe("24.00");

      // --- STEP B: GET /api/guest/orders/[id] (Read Back Order) ---
      const getReq = new NextRequest(
        `http://localhost/api/guest/orders/${createdOrder.id}`,
        { method: "GET" }
      );
      const getRes = await getOrderById(getReq, {
        params: Promise.resolve({ id: createdOrder.id }),
      });
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();

      // Envelope check: success envelope has data, no error (SYSTEM.md §12.1)
      expect(getJson).toHaveProperty("data");
      expect(getJson).not.toHaveProperty("error");
      const fetchedOrder = getJson.data;

      // Assert fetched order matches created order
      expect(fetchedOrder.id).toBe(createdOrder.id);
      expect(fetchedOrder.subtotal).toBe("24.00");
      expect(fetchedOrder.taxRate).toBe("0.1000");
      expect(fetchedOrder.taxAmount).toBe("2.40");
      expect(fetchedOrder.total).toBe("26.40");
      expect(fetchedOrder.guestSessionId).toBe(guestSession.id);

      // --- STEP C: GET /api/guest/orders (List Orders) ---
      const listReq = new NextRequest("http://localhost/api/guest/orders", {
        method: "GET",
      });
      const listRes = await listOrders(listReq);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();

      // Envelope check: success envelope has data, no error (SYSTEM.md §12.1)
      expect(listJson).toHaveProperty("data");
      expect(listJson).not.toHaveProperty("error");
      const listData = listJson.data;

      expect(Array.isArray(listData)).toBe(true);
      expect(listData.some((o: { id: string }) => o.id === createdOrder.id)).toBe(true);

      // --- STEP D: Negative Case Envelope Check (404 Not Found) ---
      const nonExistentId = "00000000-0000-0000-0000-000000000000";
      const notFoundReq = new NextRequest(
        `http://localhost/api/guest/orders/${nonExistentId}`,
        { method: "GET" }
      );
      const notFoundRes = await getOrderById(notFoundReq, {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(notFoundRes.status).toBe(404);
      const notFoundJson = await notFoundRes.json();

      // Envelope check: error envelope has error, no data (SYSTEM.md §12.1)
      expect(notFoundJson).toHaveProperty("error");
      expect(notFoundJson).not.toHaveProperty("data");
      expect(notFoundJson.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(typeof notFoundJson.error.message).toBe("string");
    });
  });
});
