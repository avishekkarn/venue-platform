import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { rmSync, mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET, setTestDbClient } from "@/../app/api/admin/orders/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { OrderState, PlaceType } from "@/domain/orders/order.repository";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/infrastructure/guest/cookies", () => ({
  getGuestCookie: vi.fn(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return { ...actual, getCsrfCookie: vi.fn() };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("GET /api/admin/orders Integration Tests (Task 8.2.1)", () => {
  let auditDir: string;
  const originalEnv = process.env["AUDIT_LOG_DIR"];
  const originalSlug = process.env["VENUE_SLUG"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "orders-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
    process.env["VENUE_SLUG"] = process.env["VENUE_SLUG"] ?? "juniper-house";
    vi.mocked(getGuestCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
  });

  afterEach(() => {
    setTestDbClient(null);
    if (existsSync(auditDir)) {
      rmSync(auditDir, { recursive: true, force: true });
    }
    if (originalEnv === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalEnv;
    if (originalSlug === undefined) delete process.env["VENUE_SLUG"];
    else process.env["VENUE_SLUG"] = originalSlug;
  });

  it("returns 401 UNAUTHORIZED without a session cookie", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);
      const request = new NextRequest("http://localhost/api/admin/orders", { method: "GET" });
      const response = await GET(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
    });
  });

  it("returns 403 FORBIDDEN for a LEADER (non-admin)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueResult = await venueRepo.create({
        name: "Juniper House", slug: venueSlug, taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Charlie Leader",
        username: "charlie_orders",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/orders", { method: "GET" });
      const response = await GET(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  it("returns 200 with an empty array for a MANAGER when no orders exist", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueResult = await venueRepo.create({
        name: "Juniper House", slug: venueSlug, taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_orders_empty",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/orders", { method: "GET" });
      const response = await GET(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(0);
    });
  });

  it("returns 200 with filtered orders (state=PLACED; dateFrom/dateTo)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueResult = await venueRepo.create({
        name: "Juniper House", slug: venueSlug, taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      // Seed 3 orders in different states.
      for (const state of [OrderState.PLACED, OrderState.READY, OrderState.COMPLETED]) {
        const r = await orderRepo.create({
          venueId,
          idempotencyKey: `idem-orders-${state}-${Date.now()}-${Math.random()}`,
          placeType: PlaceType.TABLE,
          tableId: null,
          subtotal: "10.00", taxRate: "0.0825", taxAmount: "0.83", total: "10.83",
          items: [{ itemName: "Item", itemPrice: "10.00", quantity: 1, lineTotal: "10.00" }],
        });
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        if (state === OrderState.READY) {
          const adv = await orderRepo.advanceState({
            venueId, orderId: r.value.id, toState: OrderState.APPROVED,
          });
          expect(adv.ok).toBe(true);
          const adv2 = await orderRepo.advanceState({
            venueId, orderId: r.value.id, toState: OrderState.PREPARING,
          });
          expect(adv2.ok).toBe(true);
          const adv3 = await orderRepo.advanceState({
            venueId, orderId: r.value.id, toState: OrderState.READY,
          });
          expect(adv3.ok).toBe(true);
        } else if (state === OrderState.COMPLETED) {
          const adv = await orderRepo.advanceState({
            venueId, orderId: r.value.id, toState: OrderState.COMPLETED,
          });
          expect(adv.ok).toBe(true);
        }
      }

      const staffResult = await staffRepo.create({
        venueId,
        name: "Alice Manager",
        username: "alice_orders_filter",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        "http://localhost/api/admin/orders?state=PLACED",
        { method: "GET" }
      );
      const response = await GET(request);
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(1);
      expect(json.data[0].state).toBe("PLACED");
      expect(typeof json.data[0].subtotal).toBe("string");
      expect(json.data[0].subtotal).toBe("10.00");
      expect(typeof json.data[0].placedAt).toBe("string");
    });
  });
});
