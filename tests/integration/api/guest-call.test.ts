import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  POST,
  setTestDbClient,
} from "@/../app/api/guest/call/route";
import { withTransaction } from "../setup";
import {
  PlaceType,
  HotelService,
} from "@/domain/requests/request.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";

vi.mock("@/infrastructure/guest/cookies", () => ({
  getGuestCookie: vi.fn(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("POST /api/guest/call Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("Case 1: Happy path — calls waiter for a table session (201)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      // 1. Fixture: venue and table
      const venue = await tx.venue.create({
        data: {
          name: "Call Test Venue",
          slug: `call-venue-${Date.now()}-1`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-10",
        },
      });

      // 2. Fixture: guest session bound to table
      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;
      const session = sessionResult.value;

      vi.mocked(getGuestCookie).mockResolvedValue(session.token);

      // 3. POST /api/guest/call with type: "WAITER"
      const req = new NextRequest("http://localhost/api/guest/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({ type: "WAITER" }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.id).toBeDefined();
      expect(json.data.venueId).toBe(venue.id);
      expect(json.data.placeType).toBe("TABLE");
      expect(json.data.tableId).toBe(table.id);
      expect(json.data.roomId).toBeNull();
      expect(json.data.counterId).toBeNull();
      expect(json.data.serviceType).toBe(HotelService.CALL_WAITER);
      expect(json.data.state).toBe("SUBMITTED");

      // Verify direct database read back
      const readBack = await requestRepo.findById(venue.id, json.data.id);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.serviceType).toBe(HotelService.CALL_WAITER);
        expect(readBack.value.tableId).toBe(table.id);
        expect(readBack.value.placeType).toBe(PlaceType.TABLE);
      }
    });
  });

  it("Case 2: Happy path — requests bill for a room session with order context (201)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      // 1. Fixture: venue and room
      const venue = await tx.venue.create({
        data: {
          name: "Call Room Test Venue",
          slug: `call-venue-${Date.now()}-2`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-305",
        },
      });

      // 2. Fixture: guest session bound to room
      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;
      const session = sessionResult.value;

      // 3. Fixture: order belonging to this session
      const order = await tx.order.create({
        data: {
          venueId: venue.id,
          guestSessionId: session.id,
          placeType: "ROOM",
          roomId: room.id,
          subtotal: "20.00",
          taxRate: "0.1000",
          taxAmount: "2.00",
          total: "22.00",
          idempotencyKey: `idem-${Date.now()}-room`,
        },
      });

      vi.mocked(getGuestCookie).mockResolvedValue(session.token);

      // 4. POST /api/guest/call with type: "BILL" and orderId
      const req = new NextRequest("http://localhost/api/guest/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          type: "BILL",
          orderId: order.id,
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.serviceType).toBe(HotelService.REQUEST_BILL);
      expect(json.data.placeType).toBe("ROOM");
      expect(json.data.roomId).toBe(room.id);
      expect(json.data.tableId).toBeNull();
      expect(json.data.counterId).toBeNull();
      expect(json.data.details).toEqual({ orderId: order.id });

      // Read back via request repository
      const readBack = await requestRepo.findById(venue.id, json.data.id);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.serviceType).toBe(HotelService.REQUEST_BILL);
        expect(readBack.value.roomId).toBe(room.id);
        expect(readBack.value.details).toEqual({ orderId: order.id });
      }
    });
  });

  it("Case 3: Rejects with 401 when no active guest session cookie exists", async () => {
    vi.mocked(getGuestCookie).mockResolvedValue(null);

    const req = new NextRequest("http://localhost/api/guest/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "test-csrf-token",
      },
      body: JSON.stringify({ type: "WAITER" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("Case 4: Rejects with 400 when type is invalid or missing", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Venue 4",
          slug: `call-venue-${Date.now()}-4`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-4",
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // Invalid type
      const reqInvalid = new NextRequest("http://localhost/api/guest/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({ type: "SOMETHING_ELSE" }),
      });
      const resInvalid = await POST(reqInvalid);
      expect(resInvalid.status).toBe(400);
      const jsonInvalid = await resInvalid.json();
      expect(jsonInvalid.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);

      // Missing type
      const reqMissing = new NextRequest("http://localhost/api/guest/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({}),
      });
      const resMissing = await POST(reqMissing);
      expect(resMissing.status).toBe(400);
      const jsonMissing = await resMissing.json();
      expect(jsonMissing.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  it("Case 5: Session-scoped storage — ignores client-supplied tampered venueId and placeId", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      // Session venue and table
      const venue = await tx.venue.create({
        data: {
          name: "Legit Venue",
          slug: `legit-venue-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const legitTable = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-Legit",
        },
      });

      // Another venue and table (attacker target)
      const foreignVenue = await tx.venue.create({
        data: {
          name: "Foreign Venue",
          slug: `foreign-venue-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const foreignTable = await tx.table.create({
        data: {
          venueId: foreignVenue.id,
          number: "T-Foreign",
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: legitTable.id,
      });
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // Tampered body attempting to write request for foreignVenue and foreignTable
      const req = new NextRequest("http://localhost/api/guest/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          type: "WAITER",
          venueId: foreignVenue.id,
          tableId: foreignTable.id,
          roomId: "some-fake-room",
          placeType: "ROOM",
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      // The request MUST be recorded against the session's venue and table ONLY
      expect(json.data.venueId).toBe(venue.id);
      expect(json.data.tableId).toBe(legitTable.id);
      expect(json.data.placeType).toBe("TABLE");
      expect(json.data.venueId).not.toBe(foreignVenue.id);
      expect(json.data.tableId).not.toBe(foreignTable.id);

      // Foreign venue list returns 0 requests
      const foreignRequests = await requestRepo.listForVenue(foreignVenue.id);
      expect(foreignRequests.ok).toBe(true);
      if (foreignRequests.ok) {
        expect(foreignRequests.value).toHaveLength(0);
      }
    });
  });

  it("Case 6: Rejects with 400 when client supplies orderId belonging to a different guest session", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Cross Order Venue",
          slug: `cross-order-${Date.now()}`,
          taxRate: "0.1000",
        },
      });

      const table = await tx.table.create({
        data: {
          venueId: venue.id,
          number: "T-Cross",
        },
      });

      const sessionA = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      const sessionB = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.TABLE,
        placeId: table.id,
      });
      if (!sessionA.ok || !sessionB.ok) return;

      // Order created by Session B
      const orderB = await tx.order.create({
        data: {
          venueId: venue.id,
          guestSessionId: sessionB.value.id,
          placeType: "TABLE",
          tableId: table.id,
          subtotal: "15.00",
          taxRate: "0.1000",
          taxAmount: "1.50",
          total: "16.50",
          idempotencyKey: `idem-${Date.now()}-b`,
        },
      });

      // Session A calls with Session B's orderId
      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.value.token);

      const req = new NextRequest("http://localhost/api/guest/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          type: "BILL",
          orderId: orderB.id,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(json.error.message).toContain("Order does not belong to session");
    });
  });

  it("rejects POST without X-CSRF-Token header with 403 FORBIDDEN (CSRF enforcement)", async () => {
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
    const request = new NextRequest("http://localhost/api/guest/call", {
      method: "POST",
    });
    const response = await POST(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
  });
});
