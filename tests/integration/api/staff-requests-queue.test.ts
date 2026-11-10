import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as GET_REQUESTS,
  setTestDbClient as setTestDbClientRequests,
} from "@/../app/api/staff/requests/route";
import {
  POST as POST_ADVANCE,
  setTestDbClient as setTestDbClientAdvance,
} from "@/../app/api/staff/requests/[id]/advance/route";
import {
  POST as POST_CANCEL,
  setTestDbClient as setTestDbClientCancel,
} from "@/../app/api/staff/requests/[id]/cancel/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
import {
  HotelService,
  PlaceType,
  RequestState,
} from "@/domain/requests/request.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

import { getSessionCookie } from "@/infrastructure/auth/cookies";

function setTestDbClient(
  client: Parameters<typeof setTestDbClientRequests>[0]
): void {
  setTestDbClientRequests(client);
  setTestDbClientAdvance(client);
  setTestDbClientCancel(client);
}

/**
 * Staff Request Queue Integration Tests.
 *
 * Verifies request visibility based on staff role access (LEADER vs TABLE_SERVICE-only),
 * and validates queue advance and cancel transitions.
 *
 * Reference: Task 7.5.14, D-18.1, D-18.2, SYSTEM.md §10.
 */

describe("Staff Request Queue UI & API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("Test 1: LEADER (TABLE_SERVICE + LEADER) sees all requests via GET /api/staff/requests", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      const passwordHash = await hashPassword("LeaderPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Leader Staff Charlie",
        username: `charlie-leader-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.TABLE_SERVICE, StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-LEADER-1" },
      });

      const guestRepo = createPrismaGuestSessionRepository(tx);
      const sessionRes = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionRes.ok).toBe(true);
      if (!sessionRes.ok) return;
      const guestSession = sessionRes.value;

      // 1. SUBMITTED request
      const req1 = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
        guestSessionId: guestSession.id,
      });
      expect(req1.ok).toBe(true);

      // 2. ACKNOWLEDGED request
      const req2 = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.LAUNDRY,
        guestSessionId: guestSession.id,
      });
      expect(req2.ok).toBe(true);
      if (!req2.ok) return;
      await requestRepo.advanceState({
        venueId: venue.id,
        requestId: req2.value.id,
        toState: RequestState.ACKNOWLEDGED,
        staffMemberId: staff.id,
      });

      // 3. IN_PROGRESS request
      const req3 = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.MAINTENANCE,
        guestSessionId: guestSession.id,
      });
      expect(req3.ok).toBe(true);
      if (!req3.ok) return;
      await requestRepo.advanceState({
        venueId: venue.id,
        requestId: req3.value.id,
        toState: RequestState.ACKNOWLEDGED,
        staffMemberId: staff.id,
      });
      await requestRepo.advanceState({
        venueId: venue.id,
        requestId: req3.value.id,
        toState: RequestState.IN_PROGRESS,
        staffMemberId: staff.id,
      });

      const req = new NextRequest("http://localhost/api/staff/requests", {
        method: "GET",
      });
      const res = await GET_REQUESTS(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBe(3);
    });
  });

  it("Test 2: TABLE_SERVICE-only staff cannot see the queue (returns 403)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      const passwordHash = await hashPassword("WaiterPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Table Waiter Bob",
        username: `bob-waiter-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.TABLE_SERVICE],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-BOB-1" },
      });

      await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
      });

      const req = new NextRequest("http://localhost/api/staff/requests", {
        method: "GET",
      });
      const res = await GET_REQUESTS(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("Test 3: Advance transitions SUBMITTED -> ACKNOWLEDGED", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      const passwordHash = await hashPassword("FrontDeskPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Alice Front Desk",
        username: `alice-fd-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-ADV-1" },
      });

      const createRes = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.CONCIERGE,
      });
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;
      const requestId = createRes.value.id;

      const postReq = new NextRequest(
        `http://localhost/api/staff/requests/${requestId}/advance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toState: "ACKNOWLEDGED" }),
        }
      );

      const res = await POST_ADVANCE(postReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.state).toBe(RequestState.ACKNOWLEDGED);

      const readBack = await requestRepo.findById(venue.id, requestId);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.state).toBe(RequestState.ACKNOWLEDGED);
      }
    });
  });

  it("Test 4: Cancel succeeds on ACKNOWLEDGED (staff cancel from non-terminal)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      const passwordHash = await hashPassword("FrontDeskPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Alice Front Desk",
        username: `alice-cancel-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-CANCEL-1" },
      });

      const createRes = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.SPA,
      });
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;
      const requestId = createRes.value.id;

      await requestRepo.advanceState({
        venueId: venue.id,
        requestId,
        toState: RequestState.ACKNOWLEDGED,
        staffMemberId: staff.id,
      });

      const cancelReq = new NextRequest(
        `http://localhost/api/staff/requests/${requestId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "guest left" }),
        }
      );

      const res = await POST_CANCEL(cancelReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data).toBeDefined();
      expect(json.data.state).toBe(RequestState.CANCELLED);

      const readBack = await requestRepo.findById(venue.id, requestId);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.state).toBe(RequestState.CANCELLED);
      }
    });
  });
});

