import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { rmSync, mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET, setTestDbClient } from "@/../app/api/admin/orders/export/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
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

describe("GET /api/admin/orders/export Integration Tests (Task 8.2.4)", () => {
  let auditDir: string;
  const originalEnv = process.env["AUDIT_LOG_DIR"];
  const originalSlug = process.env["VENUE_SLUG"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "orders-export-test-"));
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

  it("returns 200 text/csv with the header row and one quoted row per terminal order", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const orderRepo = createPrismaOrderRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      // Staff member first (so the order's history can name them).
      const staffResult = await staffRepo.create({
        venueId,
        name: "Alice Manager",
        username: "alice_orders_export",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      // Table (so the Place column resolves to "Table 1").
      const table = await tx.table.create({
        data: { venueId, number: "1" },
      });

      // Terminal order, with the staff member advancing it.
      const terminal = await orderRepo.create({
        venueId,
        idempotencyKey: `idem-export-terminal-${Date.now()}`,
        placeType: PlaceType.TABLE,
        tableId: table.id,
        subtotal: "10.00", taxRate: "0.0825", taxAmount: "0.83", total: "10.83",
        items: [{ itemName: "Garden Salad", itemPrice: "10.00", quantity: 1, lineTotal: "10.00" }],
      });
      expect(terminal.ok).toBe(true);
      if (!terminal.ok) return;
      const adv = await orderRepo.advanceState({
        venueId,
        orderId: terminal.value.id,
        toState: OrderState.COMPLETED,
        staffMemberId: staffResult.value.id,
      });
      expect(adv.ok).toBe(true);

      // A non-terminal order that the CSV must exclude.
      const placed = await orderRepo.create({
        venueId,
        idempotencyKey: `idem-export-placed-${Date.now()}`,
        placeType: PlaceType.TABLE,
        tableId: table.id,
        subtotal: "5.00", taxRate: "0.0825", taxAmount: "0.41", total: "5.41",
        items: [{ itemName: "Soup", itemPrice: "5.00", quantity: 1, lineTotal: "5.00" }],
      });
      expect(placed.ok).toBe(true);

      const request = new NextRequest(
        "http://localhost/api/admin/orders/export",
        { method: "GET" }
      );
      const response = await GET(request);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("content-disposition")).toMatch(
        /^attachment; filename="orders-all-all-\d{4}-\d{2}-\d{2}\.csv"$/
      );

      const text = await response.text();
      const lines = text.split("\n").filter((l) => l.length > 0);

      // Header row (the enriched 10-column form).
      expect(lines[0]).toBe(
        '"Order ID","Place","Status","Items","Notes","Subtotal","Tax","Total","Placed At (UTC)","History"'
      );

      // One body row (the terminal order; the PLACED is excluded).
      expect(lines.length).toBe(2);

      // The Place cell is the display label.
      expect(lines[1]).toContain('"Table 1"');
      // The Status is COMPLETED; the PLACED is excluded.
      expect(lines[1]).toContain('"COMPLETED"');
      expect(lines[1]).not.toContain('"PLACED"');
      // The Items cell is the order's contents.
      expect(lines[1]).toContain("Garden Salad");
      // The History cell names the staff member who advanced the order.
      expect(lines[1]).toContain("by Alice Manager at");
      // The money cells are quoted strings.
      expect(lines[1]).toContain('"10.00"');
      expect(lines[1]).toContain('"0.83"');
      expect(lines[1]).toContain('"10.83"');
    });
  });

  it("returns 401 UNAUTHORIZED without a session cookie", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);
      const request = new NextRequest("http://localhost/api/admin/orders/export", { method: "GET" });
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
        username: "charlie_orders_export",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        "http://localhost/api/admin/orders/export",
        { method: "GET" }
      );
      const response = await GET(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  it("returns 400 VALIDATION_FAILED for an invalid from date", async () => {
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
        username: "alice_orders_export_bad",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest(
        "http://localhost/api/admin/orders/export?from=not-a-date",
        { method: "GET" }
      );
      const response = await GET(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_FAILED");
    });
  });
});
