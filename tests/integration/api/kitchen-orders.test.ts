import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, setTestDbClient } from "@/../app/api/kitchen/orders/route";
import {
  POST as POST_START,
  setTestDbClient as setTestDbClientStart,
} from "@/../app/api/kitchen/orders/[id]/start/route";
import {
  POST as POST_READY,
  setTestDbClient as setTestDbClientReady,
} from "@/../app/api/kitchen/orders/[id]/ready/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

import { getSessionCookie } from "@/infrastructure/auth/cookies";

describe("GET /api/kitchen/orders Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("returns 200 with the kitchen-visible orders for a chef", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      // 1. Fixture: venue
      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      // 2. Fixture: table
      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "12",
        },
      });

      // 3. Fixture: menu item
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
          name: "Kitchen Burger",
          price: "15.00",
          sortOrder: 1,
        },
      });

      // 4. Fixture: 5 orders with different states
      // Order 1: APPROVED (kitchen-visible)
      await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "APPROVED",
          subtotal: "15.00",
          taxRate: "0.1000",
          taxAmount: "1.50",
          total: "16.50",
          idempotencyKey: `idem-${Date.now()}-approved`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Kitchen Burger",
                itemPrice: "15.00",
                quantity: 1,
                lineTotal: "15.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
            ],
          },
        },
      });

      // Order 2: PREPARING (kitchen-visible)
      await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "PREPARING",
          subtotal: "15.00",
          taxRate: "0.1000",
          taxAmount: "1.50",
          total: "16.50",
          idempotencyKey: `idem-${Date.now()}-preparing`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Kitchen Burger",
                itemPrice: "15.00",
                quantity: 1,
                lineTotal: "15.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
              { state: "PREPARING" },
            ],
          },
        },
      });

      // Order 3: READY (kitchen-visible)
      await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "READY",
          subtotal: "15.00",
          taxRate: "0.1000",
          taxAmount: "1.50",
          total: "16.50",
          idempotencyKey: `idem-${Date.now()}-ready`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Kitchen Burger",
                itemPrice: "15.00",
                quantity: 1,
                lineTotal: "15.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
              { state: "PREPARING" },
              { state: "READY" },
            ],
          },
        },
      });

      // Order 4: PLACED (kitchen must NOT see)
      await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "PLACED",
          subtotal: "15.00",
          taxRate: "0.1000",
          taxAmount: "1.50",
          total: "16.50",
          idempotencyKey: `idem-${Date.now()}-placed`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Kitchen Burger",
                itemPrice: "15.00",
                quantity: 1,
                lineTotal: "15.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
            ],
          },
        },
      });

      // Order 5: COMPLETED (kitchen must NOT see)
      await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "COMPLETED",
          subtotal: "15.00",
          taxRate: "0.1000",
          taxAmount: "1.50",
          total: "16.50",
          idempotencyKey: `idem-${Date.now()}-completed`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Kitchen Burger",
                itemPrice: "15.00",
                quantity: 1,
                lineTotal: "15.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
              { state: "PREPARING" },
              { state: "READY" },
              { state: "DELIVERED" },
              { state: "COMPLETED" },
            ],
          },
        },
      });

      // 5. Staff member with CHEF role
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Bob Chef",
        username: `bob_chef_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // 6. Execute GET /api/kitchen/orders
      const request = new NextRequest("http://localhost/api/kitchen/orders", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data).toHaveLength(3);

      const returnedStates = new Set(
        json.data.map((order: { state: string }) => order.state)
      );
      expect(returnedStates).toEqual(
        new Set(["APPROVED", "PREPARING", "READY"])
      );
      expect(returnedStates.has("PLACED")).toBe(false);
      expect(returnedStates.has("COMPLETED")).toBe(false);
    });
  });

  it("returns 401 when there is no session cookie", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/kitchen/orders", {
      method: "GET",
    });

    const response = await GET(request);
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json).toHaveProperty("error");
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(typeof json.error.message).toBe("string");
    expect(json.error.message.length).toBeGreaterThan(0);
  });

  it("returns 401 when the session cookie is invalid", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getSessionCookie).mockResolvedValue("non-existent-session-token");

      const request = new NextRequest("http://localhost/api/kitchen/orders", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(typeof json.error.message).toBe("string");
      expect(json.error.message.length).toBeGreaterThan(0);
    });
  });

  it("returns 403 when the staff member does not have the kitchen role", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

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

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Diana Housekeeper",
        username: `diana_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.HOUSEKEEPING],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/kitchen/orders", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toBe("Insufficient permissions");
    });
  });

  it("returns 401 when the staff member is deactivated", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

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

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Former Chef",
        username: `former_chef_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      // Deactivate staff member
      await tx.staffMember.update({
        where: { id: staffResult.value.id },
        data: { state: StaffState.DEACTIVATED },
      });

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/kitchen/orders", {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });
});

describe("POST /api/kitchen/orders/[id]/start and /ready", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClientStart(null);
    setTestDbClientReady(null);
  });

  it("start returns 200 and advances an APPROVED order to PREPARING", async () => {
    await withTransaction(async (tx) => {
      setTestDbClientStart(tx);

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
        data: {
          venueId: venue.id,
          number: "10",
        },
      });

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
          name: "Steak",
          price: "25.00",
          sortOrder: 1,
        },
      });

      const order = await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "APPROVED",
          subtotal: "25.00",
          taxRate: "0.1000",
          taxAmount: "2.50",
          total: "27.50",
          idempotencyKey: `idem-${Date.now()}-start-approved`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Steak",
                itemPrice: "25.00",
                quantity: 1,
                lineTotal: "25.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
            ],
          },
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Chef Mario",
        username: `chef_mario_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        `http://localhost/api/kitchen/orders/${order.id}/start`,
        { method: "POST" }
      );

      const response = await POST_START(request, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(json.data.id).toBe(order.id);
      expect(json.data.state).toBe("PREPARING");

      const stateChange = await tx.orderStateChange.findFirst({
        where: {
          orderId: order.id,
          state: "PREPARING",
        },
      });
      expect(stateChange).not.toBeNull();
      expect(stateChange?.staffMemberId).toBe(staffResult.value.id);
    });
  });

  it("ready returns 200 and advances a PREPARING order to READY", async () => {
    await withTransaction(async (tx) => {
      setTestDbClientReady(tx);

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
        data: {
          venueId: venue.id,
          number: "11",
        },
      });

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
          name: "Pasta",
          price: "18.00",
          sortOrder: 1,
        },
      });

      const order = await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "PREPARING",
          subtotal: "18.00",
          taxRate: "0.1000",
          taxAmount: "1.80",
          total: "19.80",
          idempotencyKey: `idem-${Date.now()}-ready-preparing`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Pasta",
                itemPrice: "18.00",
                quantity: 1,
                lineTotal: "18.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
              { state: "PREPARING" },
            ],
          },
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Chef Luigi",
        username: `chef_luigi_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        `http://localhost/api/kitchen/orders/${order.id}/ready`,
        { method: "POST" }
      );

      const response = await POST_READY(request, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty("data");
      expect(json.data.id).toBe(order.id);
      expect(json.data.state).toBe("READY");

      const stateChange = await tx.orderStateChange.findFirst({
        where: {
          orderId: order.id,
          state: "READY",
        },
      });
      expect(stateChange).not.toBeNull();
      expect(stateChange?.staffMemberId).toBe(staffResult.value.id);
    });
  });

  it("start returns 409 INVALID_STATE when called on a PLACED order", async () => {
    await withTransaction(async (tx) => {
      setTestDbClientStart(tx);

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
        data: {
          venueId: venue.id,
          number: "12",
        },
      });

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
          name: "Salad",
          price: "12.00",
          sortOrder: 1,
        },
      });

      const order = await tx.order.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "PLACED",
          subtotal: "12.00",
          taxRate: "0.1000",
          taxAmount: "1.20",
          total: "13.20",
          idempotencyKey: `idem-${Date.now()}-invalid-start-placed`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Salad",
                itemPrice: "12.00",
                quantity: 1,
                lineTotal: "12.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
            ],
          },
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Chef Bowser",
        username: `chef_bowser_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        `http://localhost/api/kitchen/orders/${order.id}/start`,
        { method: "POST" }
      );

      const response = await POST_START(request, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(response.status).toBe(409);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("INVALID_STATE");
      expect(json.error.message).toContain(
        "Transition from 'PLACED' to 'PREPARING' is not allowed"
      );
    });
  });

  it("ready returns 409 INVALID_STATE when called on an APPROVED order", async () => {
    await withTransaction(async (tx) => {
      setTestDbClientReady(tx);

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
        data: {
          venueId: venue.id,
          number: "13",
        },
      });

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
          name: "Soup",
          price: "10.00",
          sortOrder: 1,
        },
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
          idempotencyKey: `idem-${Date.now()}-invalid-ready-approved`,
          items: {
            create: [
              {
                menuItemId: menuItem.id,
                itemName: "Soup",
                itemPrice: "10.00",
                quantity: 1,
                lineTotal: "10.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
            ],
          },
        },
      });

      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Chef Peach",
        username: `chef_peach_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        `http://localhost/api/kitchen/orders/${order.id}/ready`,
        { method: "POST" }
      );

      const response = await POST_READY(request, {
        params: Promise.resolve({ id: order.id }),
      });
      expect(response.status).toBe(409);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("INVALID_STATE");
    });
  });

  it("start returns 401 when there is no session cookie", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const someId = "11111111-2222-3333-4444-555555555555";
    const request = new NextRequest(
      `http://localhost/api/kitchen/orders/${someId}/start`,
      { method: "POST" }
    );

    const response = await POST_START(request, {
      params: Promise.resolve({ id: someId }),
    });
    expect(response.status).toBe(401);

    const json = await response.json();
    expect(json).toHaveProperty("error");
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(json.error.message).toBe("No active session");
  });

  it("start returns 403 when the staff member does not have the kitchen role", async () => {
    await withTransaction(async (tx) => {
      setTestDbClientStart(tx);

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

      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Henry Housekeeper",
        username: `henry_hk_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.HOUSEKEEPING],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const someId = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/kitchen/orders/${someId}/start`,
        { method: "POST" }
      );

      const response = await POST_START(request, {
        params: Promise.resolve({ id: someId }),
      });
      expect(response.status).toBe(403);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toBe("Insufficient permissions");
    });
  });

  it("start returns 404 when the order does not exist", async () => {
    await withTransaction(async (tx) => {
      setTestDbClientStart(tx);

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

      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Chef Toad",
        username: `chef_toad_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const nonExistentId = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/kitchen/orders/${nonExistentId}/start`,
        { method: "POST" }
      );

      const response = await POST_START(request, {
        params: Promise.resolve({ id: nonExistentId }),
      });
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });

  it("start returns 404 when the order belongs to a different venue (cross-venue isolation)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClientStart(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueA = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueA.ok).toBe(true);
      if (!venueA.ok) return;

      const venueB = await venueRepo.create({
        name: "Other Venue",
        slug: "other-venue-diff",
        taxRate: "0.1000",
      });
      expect(venueB.ok).toBe(true);
      if (!venueB.ok) return;

      const tableB = await tx.table.create({
        data: {
          venueId: venueB.value.id,
          number: "99",
        },
      });

      const categoryB = await tx.menuCategory.create({
        data: {
          venueId: venueB.value.id,
          name: "Other Mains",
          sortOrder: 1,
        },
      });

      const menuItemB = await tx.menuItem.create({
        data: {
          venueId: venueB.value.id,
          categoryId: categoryB.id,
          name: "Other Burger",
          price: "10.00",
          sortOrder: 1,
        },
      });

      const orderB = await tx.order.create({
        data: {
          venueId: venueB.value.id,
          placeType: "TABLE",
          tableId: tableB.id,
          state: "APPROVED",
          subtotal: "10.00",
          taxRate: "0.1000",
          taxAmount: "1.00",
          total: "11.00",
          idempotencyKey: `idem-${Date.now()}-cross-venue-approved`,
          items: {
            create: [
              {
                menuItemId: menuItemB.id,
                itemName: "Other Burger",
                itemPrice: "10.00",
                quantity: 1,
                lineTotal: "10.00",
              },
            ],
          },
          stateChanges: {
            create: [
              { state: "PLACED" },
              { state: "APPROVED" },
            ],
          },
        },
      });

      const staffA = await staffRepo.create({
        venueId: venueA.value.id,
        name: "Chef Mario Venue A",
        username: `chef_mario_a_${Date.now()}`,
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffA.ok).toBe(true);
      if (!staffA.ok) return;

      const sessionA = await createSession(tx, staffA.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(sessionA.token);

      const request = new NextRequest(
        `http://localhost/api/kitchen/orders/${orderB.id}/start`,
        { method: "POST" }
      );

      const response = await POST_START(request, {
        params: Promise.resolve({ id: orderB.id }),
      });
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toHaveProperty("error");
      expect(json.error.code).toBe("NOT_FOUND");
    });
  });
});
