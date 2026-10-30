import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, setTestDbClient } from "@/../app/api/kitchen/orders/route";
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

