import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as GET_ORDERS,
  setTestDbClient as setTestDbClientOrders,
} from "@/../app/api/staff/orders/route";
import {
  POST as POST_APPROVE,
  setTestDbClient as setTestDbClientApprove,
} from "@/../app/api/staff/orders/[id]/approve/route";
import {
  POST as POST_DELIVER,
  setTestDbClient as setTestDbClientDeliver,
} from "@/../app/api/staff/orders/[id]/deliver/route";
import {
  POST as POST_COMPLETE,
  setTestDbClient as setTestDbClientComplete,
} from "@/../app/api/staff/orders/[id]/complete/route";
import {
  POST as POST_CANCEL,
  setTestDbClient as setTestDbClientCancel,
} from "@/../app/api/staff/orders/[id]/cancel/route";
import {
  POST as POST_CLOSE_TABLE,
  setTestDbClient as setTestDbClientCloseTable,
} from "@/../app/api/staff/tables/[id]/close/route";
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

describe("Staff Orders & Place Action API Routes Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClientOrders(null);
    setTestDbClientApprove(null);
    setTestDbClientDeliver(null);
    setTestDbClientComplete(null);
    setTestDbClientCancel(null);
    setTestDbClientCloseTable(null);
    setTestDbClientCheckoutRoom(null);
  });

  describe("GET /api/staff/orders", () => {
    it("returns 200 with staff-visible orders (PLACED, READY, DELIVERED) and excludes kitchen-only states", async () => {
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

        // Seed 5 orders across states
        const states = ["PLACED", "APPROVED", "PREPARING", "READY", "DELIVERED"];
        for (const state of states) {
          await tx.order.create({
            data: {
              venueId: venue.id,
              placeType: "TABLE",
              tableId: table.id,
              state: state as any,
              subtotal: "10.00",
              taxRate: "0.1000",
              taxAmount: "1.00",
              total: "11.00",
              idempotencyKey: `idem-get-${state}-${Date.now()}`,
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
                create: [{ state: state as any }],
              },
            },
          });
        }

        // Staff with TABLE_SERVICE role
        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Alice Waiter",
          username: `alice_waiter_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        expect(staffResult.ok).toBe(true);
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest("http://localhost/api/staff/orders", {
          method: "GET",
        });

        const response = await GET_ORDERS(request);
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json).toHaveProperty("data");
        expect(Array.isArray(json.data)).toBe(true);
        expect(json.data.length).toBe(3);

        const returnedStates = new Set(
          json.data.map((order: { state: string }) => order.state)
        );
        expect(returnedStates).toEqual(
          new Set(["PLACED", "READY", "DELIVERED"])
        );
        expect(returnedStates.has("APPROVED")).toBe(false);
        expect(returnedStates.has("PREPARING")).toBe(false);
      });
    });

    it("returns 401 when there is no session cookie", async () => {
      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/staff/orders", {
        method: "GET",
      });

      const response = await GET_ORDERS(request);
      expect(response.status).toBe(401);
    });

    it("returns 403 when the staff member has kitchen CHEF role only", async () => {
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
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Chef Only",
          username: `chef_only_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.CHEF],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest("http://localhost/api/staff/orders", {
          method: "GET",
        });

        const response = await GET_ORDERS(request);
        expect(response.status).toBe(403);
      });
    });
  });

  describe("POST /api/staff/orders/[id]/approve", () => {
    it("advances a PLACED order to APPROVED (200)", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientApprove(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T2" },
        });

        const order = await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "PLACED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-approve-${Date.now()}`,
            stateChanges: { create: [{ state: "PLACED" }] },
          },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Front Desk Staff",
          username: `front_desk_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.FRONT_DESK],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/orders/${order.id}/approve`,
          { method: "POST" }
        );

        const response = await POST_APPROVE(request, {
          params: Promise.resolve({ id: order.id }),
        });
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.state).toBe("APPROVED");
      });
    });

    it("returns 409 INVALID_STATE when order is already APPROVED", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientApprove(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T3" },
        });

        const order = await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "APPROVED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-already-appr-${Date.now()}`,
            stateChanges: { create: [{ state: "APPROVED" }] },
          },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Table Staff",
          username: `table_staff_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/orders/${order.id}/approve`,
          { method: "POST" }
        );

        const response = await POST_APPROVE(request, {
          params: Promise.resolve({ id: order.id }),
        });
        expect(response.status).toBe(409);
      });
    });
  });

  describe("POST /api/staff/orders/[id]/deliver", () => {
    it("advances a READY order to DELIVERED (200)", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientDeliver(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T4" },
        });

        const order = await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "READY",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-deliver-${Date.now()}`,
            stateChanges: { create: [{ state: "READY" }] },
          },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Waiter",
          username: `waiter_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/orders/${order.id}/deliver`,
          { method: "POST" }
        );

        const response = await POST_DELIVER(request, {
          params: Promise.resolve({ id: order.id }),
        });
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.state).toBe("DELIVERED");
      });
    });

    it("returns 409 INVALID_STATE when calling deliver on a PLACED order", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientDeliver(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T5" },
        });

        const order = await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "PLACED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-del-placed-${Date.now()}`,
            stateChanges: { create: [{ state: "PLACED" }] },
          },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Waiter",
          username: `waiter_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/orders/${order.id}/deliver`,
          { method: "POST" }
        );

        const response = await POST_DELIVER(request, {
          params: Promise.resolve({ id: order.id }),
        });
        expect(response.status).toBe(409);
      });
    });
  });

  describe("POST /api/staff/orders/[id]/complete", () => {
    it("advances a DELIVERED order to COMPLETED (200)", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientComplete(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T6" },
        });

        const order = await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "DELIVERED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-complete-${Date.now()}`,
            stateChanges: { create: [{ state: "DELIVERED" }] },
          },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Manager",
          username: `manager_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.MANAGER],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/orders/${order.id}/complete`,
          { method: "POST" }
        );

        const response = await POST_COMPLETE(request, {
          params: Promise.resolve({ id: order.id }),
        });
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.state).toBe("COMPLETED");
      });
    });
  });

  describe("POST /api/staff/orders/[id]/cancel", () => {
    it("cancels a PLACED order with reason (200)", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCancel(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T7" },
        });

        const order = await tx.order.create({
          data: {
            venueId: venue.id,
            placeType: "TABLE",
            tableId: table.id,
            state: "PLACED",
            subtotal: "10.00",
            taxRate: "0.1000",
            taxAmount: "1.00",
            total: "11.00",
            idempotencyKey: `idem-cancel-${Date.now()}`,
            stateChanges: { create: [{ state: "PLACED" }] },
          },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Waiter",
          username: `waiter_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/orders/${order.id}/cancel`,
          {
            method: "POST",
            body: JSON.stringify({ reason: "Item out of stock" }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST_CANCEL(request, {
          params: Promise.resolve({ id: order.id }),
        });
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.state).toBe("CANCELLED");
      });
    });

    it("rejects cancel request with 400 if reason is missing", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCancel(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Waiter",
          username: `waiter_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const fakeOrderId = "11111111-1111-1111-1111-111111111111";
        const request = new NextRequest(
          `http://localhost/api/staff/orders/${fakeOrderId}/cancel`,
          {
            method: "POST",
            body: JSON.stringify({ reason: "  " }),
            headers: { "Content-Type": "application/json" },
          }
        );

        const response = await POST_CANCEL(request, {
          params: Promise.resolve({ id: fakeOrderId }),
        });
        expect(response.status).toBe(400);
      });
    });
  });

  describe("POST /api/staff/tables/[id]/close", () => {
    it("closes a table, frees it, and invalidates active guest sessions (200)", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCloseTable(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T10", state: "OCCUPIED" },
        });

        // Guest session attached to table
        const guestRepo = createPrismaGuestSessionRepository(tx);
        const guestSessionRes = await guestRepo.create({
          venueId: venue.id,
          placeType: PlaceType.TABLE,
          placeId: table.id,
        });
        expect(guestSessionRes.ok).toBe(true);
        if (!guestSessionRes.ok) return;
        const guestSession = guestSessionRes.value;

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Waiter",
          username: `waiter_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/tables/${table.id}/close`,
          { method: "POST" }
        );

        const response = await POST_CLOSE_TABLE(request, {
          params: Promise.resolve({ id: table.id }),
        });
        expect(response.status).toBe(200);

        const json = await response.json();
        expect(json.data.success).toBe(true);

        // Verify table state is FREE
        const updatedTable = await tx.table.findUnique({
          where: { id: table.id },
        });
        expect(updatedTable?.state).toBe("FREE");

        // Verify guest session has endedAt set
        const updatedSession = await tx.guestSession.findUnique({
          where: { id: guestSession.id },
        });
        expect(updatedSession?.endedAt).not.toBeNull();
      });
    });

    it("returns 403 when staff has ROOM_SERVICE only role", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCloseTable(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const table = await tx.table.create({
          data: { venueId: venue.id, number: "T11" },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Room Attendant",
          username: `room_attendant_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.ROOM_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const request = new NextRequest(
          `http://localhost/api/staff/tables/${table.id}/close`,
          { method: "POST" }
        );

        const response = await POST_CLOSE_TABLE(request, {
          params: Promise.resolve({ id: table.id }),
        });
        expect(response.status).toBe(403);
      });
    });
  });

  describe("POST /api/staff/rooms/[id]/checkout", () => {
    it("checks out a room, sets it to VACANT, and invalidates active guest sessions (200)", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCheckoutRoom(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const room = await tx.room.create({
          data: { venueId: venue.id, number: "R101", state: "OCCUPIED" },
        });

        const guestRepo = createPrismaGuestSessionRepository(tx);
        const guestSessionRes = await guestRepo.create({
          venueId: venue.id,
          placeType: PlaceType.ROOM,
          placeId: room.id,
        });
        expect(guestSessionRes.ok).toBe(true);
        if (!guestSessionRes.ok) return;
        const guestSession = guestSessionRes.value;

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Room Service Staff",
          username: `room_staff_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.ROOM_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
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

    it("returns 403 when staff has TABLE_SERVICE only role", async () => {
      await withTransaction(async (tx) => {
        setTestDbClientCheckoutRoom(tx);

        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.1000",
        });
        if (!venueResult.ok) return;
        const venue = venueResult.value;

        const room = await tx.room.create({
          data: { venueId: venue.id, number: "R102" },
        });

        const staffResult = await staffRepo.create({
          venueId: venue.id,
          name: "Table Waiter",
          username: `table_waiter_${Date.now()}`,
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.TABLE_SERVICE],
        });
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
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
});
