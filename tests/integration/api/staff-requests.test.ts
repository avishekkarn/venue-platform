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
import {
  POST as POST_DECLINE,
  setTestDbClient as setTestDbClientDecline,
} from "@/../app/api/staff/requests/[id]/decline/route";
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
  setTestDbClientDecline(client);
}

describe("Staff Service Requests Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("Test 1: GET returns active requests (200; data.length === 3)", async () => {
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

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-101" },
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

      // 1. SUBMITTED
      const req1 = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
        guestSessionId: guestSession.id,
      });
      expect(req1.ok).toBe(true);

      // 2. ACKNOWLEDGED
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

      // 3. IN_PROGRESS
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
      expect(json.data).toHaveLength(3);
    });
  });

  it("Test 2: GET returns 401 with no cookie", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/staff/requests", {
        method: "GET",
      });
      const res = await GET_REQUESTS(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
    });
  });

  it("Test 3: GET returns 403 with TABLE_SERVICE-only staff", async () => {
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
      const venue = venueResult.value;

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Table Waiter",
        username: `waiter-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.TABLE_SERVICE],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const req = new NextRequest("http://localhost/api/staff/requests", {
        method: "GET",
      });
      const res = await GET_REQUESTS(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("Test 4: POST advance moves SUBMITTED → ACKNOWLEDGED", async () => {
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

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-adv-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-ADV" },
      });

      const createRes = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
      });
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;
      const requestId = createRes.value.id;

      const postReq = new NextRequest(
        `http://localhost/api/staff/requests/${requestId}/advance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toState: RequestState.ACKNOWLEDGED }),
        }
      );

      const res = await POST_ADVANCE(postReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.state).toBe(RequestState.ACKNOWLEDGED);
      const lastChange = json.data.stateChanges[json.data.stateChanges.length - 1];
      expect(lastChange.staffMemberId).toBe(staff.id);
      expect(lastChange.state).toBe(RequestState.ACKNOWLEDGED);
    });
  });

  it("Test 5: POST advance returns 409 on IN_PROGRESS → ACKNOWLEDGED", async () => {
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

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-inv-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-INV" },
      });

      const createRes = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
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
      await requestRepo.advanceState({
        venueId: venue.id,
        requestId,
        toState: RequestState.IN_PROGRESS,
        staffMemberId: staff.id,
      });

      // Attempt invalid backward transition IN_PROGRESS -> ACKNOWLEDGED
      const postReq = new NextRequest(
        `http://localhost/api/staff/requests/${requestId}/advance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toState: RequestState.ACKNOWLEDGED }),
        }
      );

      const res = await POST_ADVANCE(postReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe(DomainErrorCode.INVALID_STATE);
    });
  });

  it("Test 6: POST cancel succeeds from ACKNOWLEDGED", async () => {
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

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-can-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-CAN" },
      });

      const createRes = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
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

      const postReq = new NextRequest(
        `http://localhost/api/staff/requests/${requestId}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "guest left" }),
        }
      );

      const res = await POST_CANCEL(postReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.state).toBe(RequestState.CANCELLED);

      const readBack = await requestRepo.findById(venue.id, requestId);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.state).toBe(RequestState.CANCELLED);
      }
    });
  });

  it("Test 7: POST decline succeeds from SUBMITTED", async () => {
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

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-dec-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-DEC" },
      });

      const createRes = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
      });
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;
      const requestId = createRes.value.id;

      const postReq = new NextRequest(
        `http://localhost/api/staff/requests/${requestId}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "sold out" }),
        }
      );

      const res = await POST_DECLINE(postReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.state).toBe(RequestState.DECLINED);

      const readBack = await requestRepo.findById(venue.id, requestId);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.state).toBe(RequestState.DECLINED);
      }
    });
  });

  it("Test 8: POST decline returns 400 on empty reason", async () => {
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

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-dec400-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-DEC400" },
      });

      const createRes = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
      });
      expect(createRes.ok).toBe(true);
      if (!createRes.ok) return;
      const requestId = createRes.value.id;

      const postReq = new NextRequest(
        `http://localhost/api/staff/requests/${requestId}/decline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: " " }),
        }
      );

      const res = await POST_DECLINE(postReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  it("Test 9: Request from a closed session is excluded", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-closed-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-CLOSED-1" },
      });

      const sessionRes = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionRes.ok).toBe(true);
      if (!sessionRes.ok) return;
      const guestSession = sessionRes.value;

      // Close the session
      await tx.guestSession.update({
        where: { id: guestSession.id },
        data: { endedAt: new Date() },
      });

      const req1 = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
        guestSessionId: guestSession.id,
      });
      expect(req1.ok).toBe(true);

      const req = new NextRequest("http://localhost/api/staff/requests", {
        method: "GET",
      });
      const res = await GET_REQUESTS(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data).toBeDefined();
      expect(json.data).toHaveLength(0);
    });
  });

  it("Test 10: Request from an active session is included while closed session request is excluded", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Front Desk Staff",
        username: `fd-active-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-ACTIVE-1" },
      });

      // Session A: Active (endedAt is null)
      const sessionResA = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResA.ok).toBe(true);
      if (!sessionResA.ok) return;
      const sessionA = sessionResA.value;

      // Session B: Closed (endedAt set)
      const sessionResB = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResB.ok).toBe(true);
      if (!sessionResB.ok) return;
      const sessionB = sessionResB.value;

      await tx.guestSession.update({
        where: { id: sessionB.id },
        data: { endedAt: new Date() },
      });

      // Request for sessionA (active)
      const reqA = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
        guestSessionId: sessionA.id,
      });
      expect(reqA.ok).toBe(true);

      // Request for sessionB (closed)
      const reqB = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.LAUNDRY,
        guestSessionId: sessionB.id,
      });
      expect(reqB.ok).toBe(true);

      const req = new NextRequest("http://localhost/api/staff/requests", {
        method: "GET",
      });
      const res = await GET_REQUESTS(req);
      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data).toBeDefined();
      expect(json.data).toHaveLength(1);
      expect(json.data[0].guestSessionId).toBe(sessionA.id);
    });
  });
});

