import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import {
  POST as postRequest,
  GET as listRequests,
  setTestDbClient as setRequestsDbClient,
} from "@/../app/api/guest/requests/route";
import {
  GET as getRequestById,
  PATCH as editRequestRoute,
  setTestDbClient as setRequestIdDbClient,
} from "@/../app/api/guest/requests/[id]/route";
import {
  POST as cancelRequestRoute,
  setTestDbClient as setRequestCancelDbClient,
} from "@/../app/api/guest/requests/[id]/cancel/route";
import { withTransaction } from "../setup";
import {
  HotelService,
  PlaceType,
  RequestState,
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

function setTestDbClient(
  client: Parameters<typeof setRequestsDbClient>[0]
): void {
  setRequestsDbClient(client);
  setRequestIdDbClient(client);
  setRequestCancelDbClient(client);
}

describe("Guest Service Requests Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
  });

  afterEach(() => {
    setTestDbClient(null);
  });

  it("Case 1: POST creates request from valid guest session (201, SUBMITTED, HOUSEKEEPING, roomId)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      // 1. Fixtures: venue and room
      const venue = await tx.venue.create({
        data: {
          name: "Requests Test Hotel",
          slug: `req-venue-${Date.now()}-1`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-101",
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

      vi.mocked(getGuestCookie).mockResolvedValue(session.token);

      // 3. POST /api/guest/requests
      const req = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
          details: { note: "Extra towels please", towelsCount: 2 },
        }),
      });

      const res = await postRequest(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.id).toBeDefined();
      expect(json.data.venueId).toBe(venue.id);
      expect(json.data.placeType).toBe("ROOM");
      expect(json.data.roomId).toBe(room.id);
      expect(json.data.tableId).toBeNull();
      expect(json.data.counterId).toBeNull();
      expect(json.data.serviceType).toBe(HotelService.HOUSEKEEPING);
      expect(json.data.state).toBe(RequestState.SUBMITTED);
      expect(json.data.details).toEqual({
        note: "Extra towels please",
        towelsCount: 2,
      });

      // 4. Verify DB read-back
      const readBack = await requestRepo.findById(venue.id, json.data.id);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.serviceType).toBe(HotelService.HOUSEKEEPING);
        expect(readBack.value.roomId).toBe(room.id);
        expect(readBack.value.placeType).toBe(PlaceType.ROOM);
        expect(readBack.value.state).toBe(RequestState.SUBMITTED);
      }
    });
  });

  it("Case 2: POST returns 401 with no cookie", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getGuestCookie).mockResolvedValue(null);

      const req = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
        }),
      });

      const res = await postRequest(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
    });
  });

  it("Case 3: POST returns 400 with invalid serviceType", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Invalid Type Venue",
          slug: `req-venue-${Date.now()}-3`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-102",
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      const req = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: "NON_EXISTENT_SERVICE",
        }),
      });

      const res = await postRequest(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  it("Case 4: POST ignores client-supplied roomId and uses session place (201, data.roomId === session room id)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Spoof Prevention Venue",
          slug: `req-venue-${Date.now()}-4`,
          taxRate: "0.1000",
        },
      });

      const sessionRoom = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-AUTH",
        },
      });

      const spoofedRoom = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-SPOOF",
        },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: sessionRoom.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // Attempt to spoof placeId/roomId and venueId
      const req = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
          roomId: spoofedRoom.id,
          tableId: "some-fake-table-id",
          venueId: "some-fake-venue-id",
          details: { note: "Spoof attempt" },
        }),
      });

      const res = await postRequest(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.roomId).toBe(sessionRoom.id);
      expect(json.data.roomId).not.toBe(spoofedRoom.id);
      expect(json.data.venueId).toBe(venue.id);
      expect(json.data.tableId).toBeNull();

      // Verify DB confirms session room
      const readBack = await requestRepo.findById(venue.id, json.data.id);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.roomId).toBe(sessionRoom.id);
      }
    });
  });

  it("Case 5: GET returns session's requests (200, length === 2)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "List Requests Venue",
          slug: `req-venue-${Date.now()}-5`,
          taxRate: "0.1000",
        },
      });

      const roomA = await tx.room.create({
        data: { venueId: venue.id, number: "R-A" },
      });

      const roomB = await tx.room.create({
        data: { venueId: venue.id, number: "R-B" },
      });

      const sessionAResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: roomA.id,
      });
      expect(sessionAResult.ok).toBe(true);
      if (!sessionAResult.ok) return;
      const sessionA = sessionAResult.value;

      const sessionBResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: roomB.id,
      });
      expect(sessionBResult.ok).toBe(true);
      if (!sessionBResult.ok) return;
      const sessionB = sessionBResult.value;

      // Seed 2 requests for Room A
      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.token);
      const reqA1 = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({ serviceType: HotelService.HOUSEKEEPING }),
      });
      const resA1 = await postRequest(reqA1);
      expect(resA1.status).toBe(201);
      const jsonA1 = await resA1.json();

      const reqA2 = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({ serviceType: HotelService.LAUNDRY }),
      });
      const resA2 = await postRequest(reqA2);
      expect(resA2.status).toBe(201);
      const jsonA2 = await resA2.json();

      // Seed 1 request for Room B
      vi.mocked(getGuestCookie).mockResolvedValue(sessionB.token);
      const reqB1 = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({ serviceType: HotelService.MAINTENANCE }),
      });
      const resB1 = await postRequest(reqB1);
      expect(resB1.status).toBe(201);
      const jsonB1 = await resB1.json();

      // Query GET /api/guest/requests with Session A
      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.token);
      const listReq = new NextRequest("http://localhost/api/guest/requests", {
        method: "GET",
      });
      const listRes = await listRequests(listReq);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();

      expect(listJson.data).toHaveLength(2);
      const ids = listJson.data.map((r: { id: string }) => r.id);
      expect(ids).toContain(jsonA1.data.id);
      expect(ids).toContain(jsonA2.data.id);
      expect(ids).not.toContain(jsonB1.data.id);

      expect(
        listJson.data.every(
          (r: { roomId: string }) => r.roomId === roomA.id
        )
      ).toBe(true);
    });
  });

  it("Case 6: PATCH edits details while SUBMITTED (200, details updated)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Edit Requests Venue",
          slug: `req-venue-${Date.now()}-6`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-EDIT" },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // Create request in SUBMITTED state
      const createReq = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
          details: { note: "Initial note" },
        }),
      });
      const createRes = await postRequest(createReq);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      const requestId = createJson.data.id;

      // PATCH details
      const patchReq = new NextRequest(
        `http://localhost/api/guest/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
          body: JSON.stringify({
            details: { note: "Updated note", extraPillows: 3 },
          }),
        }
      );
      const patchRes = await editRequestRoute(patchReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(patchRes.status).toBe(200);
      const patchJson = await patchRes.json();

      expect(patchJson.data.details).toEqual({
        note: "Updated note",
        extraPillows: 3,
      });

      // Verify DB read-back
      const readBack = await requestRepo.findById(venue.id, requestId);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.details).toEqual({
          note: "Updated note",
          extraPillows: 3,
        });
      }
    });
  });

  it("Case 7: PATCH returns 409 when request is not SUBMITTED (e.g. advanced to ACKNOWLEDGED)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Conflict State Venue",
          slug: `req-venue-${Date.now()}-7`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-CONF" },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // Create request in SUBMITTED state
      const createReq = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
          details: { note: "Initial" },
        }),
      });
      const createRes = await postRequest(createReq);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      const requestId = createJson.data.id;

      // Staff/System advances request to ACKNOWLEDGED
      const advanceResult = await requestRepo.advanceState({
        venueId: venue.id,
        requestId,
        toState: RequestState.ACKNOWLEDGED,
        staffMemberId: null,
      });
      expect(advanceResult.ok).toBe(true);

      // Attempt PATCH by guest
      const patchReq = new NextRequest(
        `http://localhost/api/guest/requests/${requestId}`,
        {
          method: "PATCH",
          headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
          body: JSON.stringify({
            details: { note: "Late change attempt" },
          }),
        }
      );
      const patchRes = await editRequestRoute(patchReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(patchRes.status).toBe(409);
      const patchJson = await patchRes.json();
      expect(patchJson.error.code).toBe(DomainErrorCode.INVALID_STATE);
    });
  });

  it("Case 8: POST /cancel cancels while SUBMITTED (200, state CANCELLED)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venue = await tx.venue.create({
        data: {
          name: "Cancel Request Venue",
          slug: `req-venue-${Date.now()}-8`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: { venueId: venue.id, number: "R-CANCEL" },
      });

      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      vi.mocked(getGuestCookie).mockResolvedValue(sessionResult.value.token);

      // Create request in SUBMITTED state
      const createReq = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
          details: { note: "Please clean room" },
        }),
      });
      const createRes = await postRequest(createReq);
      expect(createRes.status).toBe(201);
      const createJson = await createRes.json();
      const requestId = createJson.data.id;

      // Cancel request as guest
      const cancelReq = new NextRequest(
        `http://localhost/api/guest/requests/${requestId}/cancel`,
        {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
          body: JSON.stringify({
            reason: "Guest changed mind",
          }),
        }
      );
      const cancelRes = await cancelRequestRoute(cancelReq, {
        params: Promise.resolve({ id: requestId }),
      });
      expect(cancelRes.status).toBe(200);
      const cancelJson = await cancelRes.json();
      expect(cancelJson.data.state).toBe(RequestState.CANCELLED);

      // Verify DB read-back
      const readBack = await requestRepo.findById(venue.id, requestId);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.state).toBe(RequestState.CANCELLED);
        const cancelledChange = readBack.value.stateChanges.find(
          (sc) => sc.state === RequestState.CANCELLED
        );
        expect(cancelledChange).toBeDefined();
        expect(cancelledChange?.note).toBe("Guest changed mind");
      }
    });
  });

  it("Case 9: POST writes guestSessionId (201, matches session.id, persisted in DB)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      // 1. Fixtures: venue and room
      const venue = await tx.venue.create({
        data: {
          name: "Session Requests Hotel",
          slug: `req-venue-${Date.now()}-9`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-901",
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

      vi.mocked(getGuestCookie).mockResolvedValue(session.token);

      // 3. POST /api/guest/requests
      const req = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
          details: { note: "Fresh towels" },
        }),
      });

      const res = await postRequest(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data).toBeDefined();
      expect(json.data.guestSessionId).toBe(session.id);

      // 4. Verify DB read-back
      const readBack = await requestRepo.findById(venue.id, json.data.id);
      expect(readBack.ok).toBe(true);
      if (readBack.ok) {
        expect(readBack.value.guestSessionId).toBe(session.id);
      }
    });
  });

  it("Case 10: GET returns only the current session's requests (200, session-scoped)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      // 1. Fixtures: venue and room
      const venue = await tx.venue.create({
        data: {
          name: "Session Scoped Get Hotel",
          slug: `req-venue-${Date.now()}-10`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-1001",
        },
      });

      // 2. Two sessions on the same room
      const sessionResultA = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResultA.ok).toBe(true);
      if (!sessionResultA.ok) return;
      const sessionA = sessionResultA.value;

      const sessionResultB = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResultB.ok).toBe(true);
      if (!sessionResultB.ok) return;
      const sessionB = sessionResultB.value;

      // 3. POST request from session A
      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.token);
      const reqA = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.HOUSEKEEPING,
          details: { note: "Session A request" },
        }),
      });
      const resA = await postRequest(reqA);
      expect(resA.status).toBe(201);

      // 4. POST request from session B
      vi.mocked(getGuestCookie).mockResolvedValue(sessionB.token);
      const reqB = new NextRequest("http://localhost/api/guest/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          serviceType: HotelService.MAINTENANCE,
          details: { note: "Session B request" },
        }),
      });
      const resB = await postRequest(reqB);
      expect(resB.status).toBe(201);

      // 5. GET /api/guest/requests with session A's cookie
      vi.mocked(getGuestCookie).mockResolvedValue(sessionA.token);
      const getReq = new NextRequest("http://localhost/api/guest/requests", {
        method: "GET",
      });
      const getRes = await listRequests(getReq);
      expect(getRes.status).toBe(200);
      const getJson = await getRes.json();

      expect(getJson.data).toHaveLength(1);
      expect(getJson.data[0].guestSessionId).toBe(sessionA.id);
      expect(getJson.data[0].serviceType).toBe(HotelService.HOUSEKEEPING);
    });
  });

  it("rejects POST without X-CSRF-Token header with 403 FORBIDDEN (CSRF enforcement)", async () => {
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
    const request = new NextRequest("http://localhost/api/guest/requests", {
      method: "POST",
    });
    const response = await postRequest(request);
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error.code).toBe("FORBIDDEN");
    expect(json.error.message).toBe("CSRF token missing or invalid");
  });
});

