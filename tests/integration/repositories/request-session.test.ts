/**
 * Integration tests for the guest-session scoping on ServiceRequestRepository.
 *
 * Proves that the new guestSessionId column (added in 7.5.15.A) is written
 * on create and can be used to filter requests to a single guest session.
 * Also proves the legacy listForRoom read remains unchanged.
 *
 * Companion to tests/integration/repositories/request.test.ts (which covers
 * the base repository surface: create, findById, listForVenue, listForRoom,
 * listForTable, listForCounter, advanceState, cancel, decline, updateDetails).
 *
 * Reference: D-2.3, D-2.5, SYSTEM.md §10.
 */

import { describe, it, expect } from "vitest";
import { withTransaction } from "../setup";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { HotelService, PlaceType } from "@/domain/requests/request.repository";

describe("ServiceRequestRepository Guest Session Scoping Tests (Task 7.5.15.A)", () => {
  it("Test 1 — create writes guestSessionId", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);
      const guestSessionRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Session Venue 1",
        slug: `req-session-venue-${Date.now()}-c1`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const roomResult = await roomRepo.create(venueId, { number: "R-101" });
      expect(roomResult.ok).toBe(true);
      if (!roomResult.ok) return;
      const roomId = roomResult.value.id;

      const sessionResultA = await guestSessionRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        placeId: roomId,
      });
      expect(sessionResultA.ok).toBe(true);
      if (!sessionResultA.ok) return;
      const sessionA = sessionResultA.value;

      const createResult = await requestRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        roomId,
        serviceType: HotelService.HOUSEKEEPING,
        guestSessionId: sessionA.id,
        details: { items: ["extra_towels"] },
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      expect(createResult.value.guestSessionId).toBe(sessionA.id);
    });
  });

  it("Test 2 — create with guestSessionId: null writes null", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Session Venue 2",
        slug: `req-session-venue-${Date.now()}-c2`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const roomResult = await roomRepo.create(venueId, { number: "R-102" });
      expect(roomResult.ok).toBe(true);
      if (!roomResult.ok) return;
      const roomId = roomResult.value.id;

      const createResult = await requestRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        roomId,
        serviceType: HotelService.MAINTENANCE,
        guestSessionId: null,
        details: { issue: "lightbulb" },
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      expect(createResult.value.guestSessionId).toBeNull();
    });
  });

  it("Test 3 — listForGuestSession returns only that session's requests", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);
      const guestSessionRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Session Venue 3",
        slug: `req-session-venue-${Date.now()}-c3`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const roomResult = await roomRepo.create(venueId, { number: "R-103" });
      expect(roomResult.ok).toBe(true);
      if (!roomResult.ok) return;
      const roomId = roomResult.value.id;

      const sessionResultA = await guestSessionRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        placeId: roomId,
      });
      expect(sessionResultA.ok).toBe(true);
      if (!sessionResultA.ok) return;
      const sessionA = sessionResultA.value;

      const sessionResultB = await guestSessionRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        placeId: roomId,
      });
      expect(sessionResultB.ok).toBe(true);
      if (!sessionResultB.ok) return;
      const sessionB = sessionResultB.value;

      // Create request for session A
      const reqA = await requestRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        roomId,
        serviceType: HotelService.HOUSEKEEPING,
        guestSessionId: sessionA.id,
      });
      expect(reqA.ok).toBe(true);

      // Create request for session B
      const reqB = await requestRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        roomId,
        serviceType: HotelService.LAUNDRY,
        guestSessionId: sessionB.id,
      });
      expect(reqB.ok).toBe(true);

      // List for session A
      expect(requestRepo.listForGuestSession).toBeDefined();
      const listA = await requestRepo.listForGuestSession!(venueId, sessionA.id);
      expect(listA.ok).toBe(true);
      if (!listA.ok) return;

      expect(listA.value).toHaveLength(1);
      expect(listA.value[0]?.guestSessionId).toBe(sessionA.id);
      expect(listA.value[0]?.serviceType).toBe(HotelService.HOUSEKEEPING);
    });
  });

  it("Test 4 — listForGuestSession returns empty when no requests", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);
      const guestSessionRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Session Venue 4",
        slug: `req-session-venue-${Date.now()}-c4`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const roomResult = await roomRepo.create(venueId, { number: "R-104" });
      expect(roomResult.ok).toBe(true);
      if (!roomResult.ok) return;
      const roomId = roomResult.value.id;

      const sessionResultA = await guestSessionRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        placeId: roomId,
      });
      expect(sessionResultA.ok).toBe(true);
      if (!sessionResultA.ok) return;
      const sessionA = sessionResultA.value;

      const sessionResultB = await guestSessionRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        placeId: roomId,
      });
      expect(sessionResultB.ok).toBe(true);
      if (!sessionResultB.ok) return;
      const sessionB = sessionResultB.value;

      // Create request for session A only
      await requestRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        roomId,
        serviceType: HotelService.CONCIERGE,
        guestSessionId: sessionA.id,
      });

      // List for session B before creating any for B
      expect(requestRepo.listForGuestSession).toBeDefined();
      const listB = await requestRepo.listForGuestSession!(venueId, sessionB.id);
      expect(listB.ok).toBe(true);
      if (!listB.ok) return;

      expect(listB.value).toHaveLength(0);
    });
  });

  it("Test 5 — listForRoom still returns both (audit read unchanged)", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);
      const guestSessionRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Session Venue 5",
        slug: `req-session-venue-${Date.now()}-c5`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const roomResult = await roomRepo.create(venueId, { number: "R-105" });
      expect(roomResult.ok).toBe(true);
      if (!roomResult.ok) return;
      const roomId = roomResult.value.id;

      const sessionResultA = await guestSessionRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        placeId: roomId,
      });
      expect(sessionResultA.ok).toBe(true);
      if (!sessionResultA.ok) return;
      const sessionA = sessionResultA.value;

      const sessionResultB = await guestSessionRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        placeId: roomId,
      });
      expect(sessionResultB.ok).toBe(true);
      if (!sessionResultB.ok) return;
      const sessionB = sessionResultB.value;

      // Create one request per session
      const reqA = await requestRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        roomId,
        serviceType: HotelService.SPA,
        guestSessionId: sessionA.id,
      });
      expect(reqA.ok).toBe(true);

      const reqB = await requestRepo.create({
        venueId,
        placeType: PlaceType.ROOM,
        roomId,
        serviceType: HotelService.WAKE_UP_CALL,
        guestSessionId: sessionB.id,
      });
      expect(reqB.ok).toBe(true);

      // Call listForRoom: should return both requests
      const roomList = await requestRepo.listForRoom(venueId, roomId);
      expect(roomList.ok).toBe(true);
      if (!roomList.ok) return;

      expect(roomList.value).toHaveLength(2);
      const returnedSessionIds = roomList.value.map((r) => r.guestSessionId);
      expect(returnedSessionIds).toContain(sessionA.id);
      expect(returnedSessionIds).toContain(sessionB.id);
    });
  });
});
