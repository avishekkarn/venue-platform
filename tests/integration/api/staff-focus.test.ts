import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as GET_ORDERS,
  setTestDbClient as setTestDbClientOrders,
} from "@/../app/api/staff/orders/route";
import {
  POST as POST_CHECKOUT_ROOM,
  setTestDbClient as setTestDbClientCheckoutRoom,
} from "@/../app/api/staff/rooms/[id]/checkout/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

import { getSessionCookie } from "@/infrastructure/auth/cookies";

describe("Staff Focus & LEADER Behaviour Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClientOrders(null);
    setTestDbClientCheckoutRoom(null);
  });

  describe("Test 1: LEADER sees all orders via GET /api/staff/orders", () => {
    it("returns both table and room orders for staff with [TABLE_SERVICE, LEADER] roles", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientOrders(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        expect(venueResult.ok).toBe(true);
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T1" },
        });
        const room = await tx.room.create({
          data: { venueId: venue.id, number: "101" },
        });

        const category = await tx.menuCategory.create({
          data: { venueId: venue.id, name: "Food", sortOrder: 1 },
        });
        const menuItem = await tx.menuItem.create({
          data: {
            venueId: venue.id,
            categoryId: category.id,
            name: "Burger",
            price: "10.00",
            sortOrder: 1,
          },
        });

        // 1 Table order (PLACED)
        await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "PLACED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-table-leader-${Date.now()}`,
            items: {
              create: [
                {
                  menuItemId: menuItem.id,
                  itemName: "Burger",
                  itemPrice: "10.00",
                  quantity: 1,
                  lineTotal: "10.00",
                },
              ],
            },
            stateChanges: {
              create: [{ state: "PLACED" }],
            },
          },
        });

        // 1 Room order (PLACED)
        await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "ROOM",
            roomId: room.id,
            state: "PLACED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-room-leader-${Date.now()}`,
            items: {
              create: [
                {
                  menuItemId: menuItem.id,
                  itemName: "Burger",
                  itemPrice: "10.00",
                  quantity: 1,
                  lineTotal: "10.00",
                },
              ],
            },
            stateChanges: {
              create: [{ state: "PLACED" }],
            },
          },
        });

        // Staff with [TABLE_SERVICE, LEADER]
        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Charlie Leader",
          username: `charlie_leader_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE, StaffRole.LEADER],
        });
        expect(staffResult.ok).toBe(true);
        if (!staffResult.ok) return;
        const staff = staffResult.value;

        const session = await createSession(tx, staff.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest("http://localhost/api/staff/orders");
        const response = await GET_ORDERS(request);
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.length).toBe(2);

        const placeTypes = json.data.map((o: { placeType: string }) => o.placeType);
        expect(placeTypes).toContain("TABLE");
        expect(placeTypes).toContain("ROOM");
      });
    });
  });

  describe("Test 2: LEADER can POST /api/staff/rooms/[id]/checkout", () => {
    it("successfully checks out room and ends guest session when staff has LEADER role", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCheckoutRoom(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const guestSessionRepo = createPrismaGuestSessionRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        expect(venueResult.ok).toBe(true);
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const room = await tx.room.create({
          data: { venueId: venue.id, number: "202", state: "OCCUPIED" },
        });

        const sessionResult = await guestSessionRepo.create({
          venueId: venue.id,
          placeType: PlaceType.ROOM,
          placeId: room.id,
        });
        expect(sessionResult.ok).toBe(true);
        if (!sessionResult.ok) return;
        const guestSession = sessionResult.value;

        // Staff with [TABLE_SERVICE, LEADER]
        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Charlie Leader",
          username: `charlie_checkout_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE, StaffRole.LEADER],
        });
        expect(staffResult.ok).toBe(true);
        if (!staffResult.ok) return;
        const staff = staffResult.value;

        const session = await createSession(tx, staff.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/rooms/${room.id}/checkout`,
          { method: "POST" }
        );

        const response = await POST_CHECKOUT_ROOM(request, {
          params: Promise.resolve({ id: room.id }),
        });
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.success).toBe(true);

        const updatedRoom = await tx.room.findUnique({
          where: { id: room.id },
        });
        expect(updatedRoom?.state).toBe("VACANT");

        const updatedSession = await tx.guestSession.findUnique({
          where: { id: guestSession.id },
        });
        expect(updatedSession?.endedAt).not.toBeNull();
      });
    });
  });

  describe("Test 3: TABLE_SERVICE-only staff cannot check out rooms", () => {
    it("returns 403 when staff has TABLE_SERVICE only role", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCheckoutRoom(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const guestSessionRepo = createPrismaGuestSessionRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        expect(venueResult.ok).toBe(true);
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const room = await tx.room.create({
          data: { venueId: venue.id, number: "303", state: "OCCUPIED" },
        });

        const sessionResult = await guestSessionRepo.create({
          venueId: venue.id,
          placeType: PlaceType.ROOM,
          placeId: room.id,
        });
        expect(sessionResult.ok).toBe(true);
        if (!sessionResult.ok) return;

        // Staff with TABLE_SERVICE only
        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Server Only",
          username: `server_only_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        expect(staffResult.ok).toBe(true);
        if (!staffResult.ok) return;
        const staff = staffResult.value;

        const session = await createSession(tx, staff.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/rooms/${room.id}/checkout`,
          { method: "POST" }
        );

        const response = await POST_CHECKOUT_ROOM(request, {
          params: Promise.resolve({ id: room.id }),
        });
        expect(response.status).toBe(403);
      });
    });
  });

  describe("Test 4: FOCUSED staff sees filtered orders via GET /api/staff/orders", () => {
    it("returns only table orders for TABLE_SERVICE-only staff and filters out room orders", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientOrders(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        expect(venueResult.ok).toBe(true);
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T2" },
        });
        const room = await tx.room.create({
          data: { venueId: venue.id, number: "102" },
        });

        const category = await tx.menuCategory.create({
          data: { venueId: venue.id, name: "Food", sortOrder: 1 },
        });
        const menuItem = await tx.menuItem.create({
          data: {
            venueId: venue.id,
            categoryId: category.id,
            name: "Burger",
            price: "10.00",
            sortOrder: 1,
          },
        });

        // 1 Table order (PLACED)
        await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "PLACED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-table-focused-${Date.now()}`,
            items: {
              create: [
                {
                  menuItemId: menuItem.id,
                  itemName: "Burger",
                  itemPrice: "10.00",
                  quantity: 1,
                  lineTotal: "10.00",
                },
              ],
            },
            stateChanges: {
              create: [{ state: "PLACED" }],
            },
          },
        });

        // 1 Room order (PLACED)
        await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "ROOM",
            roomId: room.id,
            state: "PLACED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-room-focused-${Date.now()}`,
            items: {
              create: [
                {
                  menuItemId: menuItem.id,
                  itemName: "Burger",
                  itemPrice: "10.00",
                  quantity: 1,
                  lineTotal: "10.00",
                },
              ],
            },
            stateChanges: {
              create: [{ state: "PLACED" }],
            },
          },
        });

        // Staff with TABLE_SERVICE only
        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Server Focused",
          username: `server_focused_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        expect(staffResult.ok).toBe(true);
        if (!staffResult.ok) return;
        const staff = staffResult.value;

        const session = await createSession(tx, staff.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest("http://localhost/api/staff/orders");
        const response = await GET_ORDERS(request);
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.length).toBe(1);
        expect(json.data[0].placeType).toBe("TABLE");
      });
    });
  });
});
