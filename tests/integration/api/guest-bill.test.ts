import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as getBill,
  setTestDbClient,
} from "@/../app/api/guest/bill/route";
import { withTransaction } from "../setup";
import { PlaceType } from "@/domain/requests/request.repository";
import { OrderState } from "@/domain/orders/order.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";

vi.mock("@/infrastructure/guest/cookies", () => ({
  getGuestCookie: vi.fn(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

import { getGuestCookie } from "@/infrastructure/guest/cookies";

describe("Guest Consolidated Billing Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("Test 1: GET /api/guest/bill returns 401 when no session cookie", async () => {
    vi.mocked(getGuestCookie).mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/guest/bill");
    const res = await getBill(req);
    expect(res.status).toBe(401);
  });

  it("Test 2: Table session accumulates orders only", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Table Billing Hotel",
          slug: `table-billing-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-10",
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      if (!sessionResult.ok) throw new Error("Failed to create session");
      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // Create an order
      await tx.order.create({
        data: {
          venueId: venue.id,
          guestSessionId: sessionResult.value.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "DELIVERED",
          idempotencyKey: `order-1-${Date.now()}`,
          subtotal: "500.00",
          taxRate: "0.1000",
          taxAmount: "50.00",
          total: "550.00",
          items: {
            create: [
              {
                itemName: "Momo Platter",
                itemPrice: "500.00",
                quantity: 1,
                lineTotal: "500.00",
              },
            ],
          },
        },
      });

      const req = new NextRequest("http://localhost/api/guest/bill");
      const res = await getBill(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.placeType).toBe("TABLE");
      expect(body.data.placeLabel).toBe("Table T-10");
      expect(body.data.summary.ordersCount).toBe(1);
      expect(body.data.summary.ordersTotal).toBe("550.00");
      expect(body.data.summary.payableServicesCount).toBe(0);
      expect(body.data.summary.total).toBe("550.00");
    });
  });

  it("Test 3: Room session consolidates orders AND payable service requests", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Room Consolidated Folio Hotel",
          slug: `room-billing-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "404",
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      if (!sessionResult.ok) throw new Error("Failed to create session");
      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // 1. Food & beverage order: Total 660.00
      await tx.order.create({
        data: {
          venueId: venue.id,
          guestSessionId: sessionResult.value.id,
          placeType: "ROOM",
          roomId: room.id,
          state: "COMPLETED",
          idempotencyKey: `order-room-${Date.now()}`,
          subtotal: "600.00",
          taxRate: "0.1000",
          taxAmount: "60.00",
          total: "660.00",
          items: {
            create: [
              {
                itemName: "Room Dining Dinner",
                itemPrice: "600.00",
                quantity: 1,
                lineTotal: "600.00",
              },
            ],
          },
        },
      });

      // 2. Payable Spa Service: Price 700.00
      const category = await tx.serviceCategory.create({
        data: {
          venueId: venue.id,
          name: "Wellness",
          sortOrder: 1,
        },
      });

      const spaItem = await tx.serviceItem.create({
        data: {
          venueId: venue.id,
          categoryId: category.id,
          name: "Full Body Massage",
          price: "700.00",
          state: MenuItemState.AVAILABLE,
          estimatedMinutes: 60,
        },
      });

      await tx.serviceRequest.create({
        data: {
          venueId: venue.id,
          guestSessionId: sessionResult.value.id,
          roomId: room.id,
          serviceItemId: spaItem.id,
          serviceType: "SPA",
          state: "IN_PROGRESS",
          detailsJson: { treatment: "Full Body Massage" },
        },
      });

      const req = new NextRequest("http://localhost/api/guest/bill");
      const res = await getBill(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.placeType).toBe("ROOM");
      expect(body.data.placeLabel).toBe("Room 404");
      expect(body.data.summary.ordersCount).toBe(1);
      expect(body.data.summary.ordersTotal).toBe("660.00");
      expect(body.data.summary.payableServicesCount).toBe(1);
      expect(body.data.summary.payableServicesTotal).toBe("700.00");
      expect(body.data.payableServices[0].serviceName).toBe("Full Body Massage");
      expect(body.data.payableServices[0].price).toBe("700.00");
      // subtotal = 600 + 700 = 1300.00, tax = 60.00, total = 1360.00
      expect(body.data.summary.subtotal).toBe("1300.00");
      expect(body.data.summary.total).toBe("1360.00");
    });
  });
});
