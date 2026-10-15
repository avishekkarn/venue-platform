import { describe, it, expect } from "vitest";
import { withTransaction } from "../setup";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import {
  RequestState,
  HotelService,
  type CreateServiceRequestInput,
} from "@/domain/requests/request.repository";
import { DomainErrorCode } from "@/domain/shared/result";

describe("ServiceRequestRepository Integration Tests", () => {
  it("Case 1: create writes the request and its first RequestStateChange (SUBMITTED)", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 1",
        slug: `req-venue-${Date.now()}-c1`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const createResult = await requestRepo.create({
        venueId,
        serviceType: HotelService.HOUSEKEEPING,
        details: { items: ["extra_towels", "pillow"], urgent: true },
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const request = createResult.value;
      expect(request.id).toBeDefined();
      expect(request.venueId).toBe(venueId);
      expect(request.serviceType).toBe(HotelService.HOUSEKEEPING);
      expect(request.state).toBe(RequestState.SUBMITTED);
      expect(request.details).toEqual({
        items: ["extra_towels", "pillow"],
        urgent: true,
      });

      // Verify domain state changes
      expect(request.stateChanges).toHaveLength(1);
      expect(request.stateChanges[0]?.state).toBe(RequestState.SUBMITTED);
      expect(request.stateChanges[0]?.note).toBeNull();
      expect(request.stateChanges[0]?.occurredAt).toBeInstanceOf(Date);

      // Verify direct database persistence for both rows
      const dbRequest = await tx.serviceRequest.findUnique({
        where: { id: request.id },
        include: { stateChanges: true },
      });
      expect(dbRequest).not.toBeNull();
      expect(dbRequest?.stateChanges).toHaveLength(1);
      expect(dbRequest?.stateChanges[0]?.state).toBe("SUBMITTED");
    });
  });

  it("Case 2: findById returns request with its details deserialized correctly", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 2",
        slug: `req-venue-${Date.now()}-c2`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const createResult = await requestRepo.create({
        venueId,
        serviceType: HotelService.MAINTENANCE,
        details: { issue: "air_conditioning", roomTemperature: 28 },
      });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const found = await requestRepo.findById(venueId, createResult.value.id);
      expect(found.ok).toBe(true);
      if (!found.ok) return;

      expect(found.value.id).toBe(createResult.value.id);
      expect(found.value.serviceType).toBe(HotelService.MAINTENANCE);
      expect(found.value.details).toEqual({
        issue: "air_conditioning",
        roomTemperature: 28,
      });
    });
  });

  it("Case 3: listForVenue returns the request", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 3",
        slug: `req-venue-${Date.now()}-c3`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const created = await requestRepo.create({
        venueId,
        serviceType: HotelService.CONCIERGE,
        details: { note: "taxi_reservation", time: "18:00" },
      });
      expect(created.ok).toBe(true);

      const listResult = await requestRepo.listForVenue(venueId);
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toHaveLength(1);
        expect(listResult.value[0]?.id).toBe(created.ok ? created.value.id : "");
      }
    });
  });

  it("Case 4: listForVenue with serviceType: HOUSEKEEPING returns only housekeeping requests", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 4",
        slug: `req-venue-${Date.now()}-c4`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      await requestRepo.create({
        venueId,
        serviceType: HotelService.HOUSEKEEPING,
        details: { task: "clean_room" },
      });
      await requestRepo.create({
        venueId,
        serviceType: HotelService.SPA,
        details: { treatment: "massage" },
      });

      const housekeepingList = await requestRepo.listForVenue(venueId, {
        serviceType: HotelService.HOUSEKEEPING,
      });
      expect(housekeepingList.ok).toBe(true);
      if (housekeepingList.ok) {
        expect(housekeepingList.value).toHaveLength(1);
        expect(housekeepingList.value[0]?.serviceType).toBe(
          HotelService.HOUSEKEEPING
        );
      }
    });
  });

  it("Case 5: listForVenue with state: SUBMITTED returns only submitted requests", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 5",
        slug: `req-venue-${Date.now()}-c5`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const r1 = await requestRepo.create({
        venueId,
        serviceType: HotelService.LAUNDRY,
      });
      const r2 = await requestRepo.create({
        venueId,
        serviceType: HotelService.WAKE_UP_CALL,
      });
      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      if (!r1.ok || !r2.ok) return;

      // Advance r2 to ACKNOWLEDGED
      await requestRepo.advanceState({
        venueId,
        requestId: r2.value.id,
        toState: RequestState.ACKNOWLEDGED,
      });

      const submittedList = await requestRepo.listForVenue(venueId, {
        state: RequestState.SUBMITTED,
      });
      expect(submittedList.ok).toBe(true);
      if (submittedList.ok) {
        expect(submittedList.value).toHaveLength(1);
        expect(submittedList.value[0]?.id).toBe(r1.value.id);
        expect(submittedList.value[0]?.state).toBe(RequestState.SUBMITTED);
      }
    });
  });

  it("Case 6: listForVenue returns ok([]) for venue with no requests", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Empty Request Venue",
        slug: `req-venue-${Date.now()}-c6`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const listResult = await requestRepo.listForVenue(venueResult.value.id);
      expect(listResult.ok).toBe(true);
      if (listResult.ok) {
        expect(listResult.value).toEqual([]);
      }
    });
  });

  it("Case 7: listForRoom returns only requests for that room", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const roomRepo = createPrismaRoomRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 7",
        slug: `req-venue-${Date.now()}-c7`,
        taxRate: "0.1000",
        modules: ["ROOM"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const room1 = await roomRepo.create(venueId, { number: "R-101" });
      const room2 = await roomRepo.create(venueId, { number: "R-102" });
      expect(room1.ok).toBe(true);
      expect(room2.ok).toBe(true);
      if (!room1.ok || !room2.ok) return;

      await requestRepo.create({
        venueId,
        roomId: room1.value.id,
        serviceType: HotelService.DO_NOT_DISTURB,
      });
      await requestRepo.create({
        venueId,
        roomId: room2.value.id,
        serviceType: HotelService.LATE_CHECKOUT,
      });

      const room1List = await requestRepo.listForRoom(venueId, room1.value.id);
      expect(room1List.ok).toBe(true);
      if (room1List.ok) {
        expect(room1List.value).toHaveLength(1);
        expect(room1List.value[0]?.roomId).toBe(room1.value.id);
        expect(room1List.value[0]?.serviceType).toBe(
          HotelService.DO_NOT_DISTURB
        );
      }
    });
  });

  it("Case 8: advanceState writes new state and a new RequestStateChange", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 8",
        slug: `req-venue-${Date.now()}-c8`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const created = await requestRepo.create({
        venueId,
        serviceType: HotelService.ROOM_SERVICE_FOOD,
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const advanced = await requestRepo.advanceState({
        venueId,
        requestId: created.value.id,
        toState: RequestState.IN_PROGRESS,
        staffMemberId: null,
      });
      expect(advanced.ok).toBe(true);
      if (!advanced.ok) return;

      expect(advanced.value.state).toBe(RequestState.IN_PROGRESS);
      expect(advanced.value.stateChanges).toHaveLength(2);
      expect(advanced.value.stateChanges[0]?.state).toBe(RequestState.SUBMITTED);
      expect(advanced.value.stateChanges[1]?.state).toBe(
        RequestState.IN_PROGRESS
      );
      expect(advanced.value.stateChanges[1]?.note).toBeNull();
    });
  });

  it("Case 9: cancel writes CANCELLED and a RequestStateChange with reason in note", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 9",
        slug: `req-venue-${Date.now()}-c9`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const created = await requestRepo.create({
        venueId,
        serviceType: HotelService.HOUSEKEEPING,
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const reason = "Guest cancelled request from reception";
      const cancelled = await requestRepo.cancel({
        venueId,
        requestId: created.value.id,
        reason,
        staffMemberId: null,
      });
      expect(cancelled.ok).toBe(true);
      if (!cancelled.ok) return;

      expect(cancelled.value.state).toBe(RequestState.CANCELLED);
      expect(cancelled.value.stateChanges).toHaveLength(2);
      expect(cancelled.value.stateChanges[1]?.state).toBe(
        RequestState.CANCELLED
      );
      expect(cancelled.value.stateChanges[1]?.note).toBe(reason);

      // Verify in DB directly
      const dbChanges = await tx.requestStateChange.findMany({
        where: { requestId: created.value.id },
        orderBy: { occurredAt: "asc" },
      });
      expect(dbChanges).toHaveLength(2);
      expect(dbChanges[1]?.note).toBe(reason);
    });
  });

  it("Case 10: decline writes DECLINED and a RequestStateChange with reason in note", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 10",
        slug: `req-venue-${Date.now()}-c10`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const created = await requestRepo.create({
        venueId,
        serviceType: HotelService.SPA,
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const reason = "Spa fully booked for the evening";
      const declined = await requestRepo.decline({
        venueId,
        requestId: created.value.id,
        reason,
        staffMemberId: null,
      });
      expect(declined.ok).toBe(true);
      if (!declined.ok) return;

      expect(declined.value.state).toBe(RequestState.DECLINED);
      expect(declined.value.stateChanges).toHaveLength(2);
      expect(declined.value.stateChanges[1]?.state).toBe(RequestState.DECLINED);
      expect(declined.value.stateChanges[1]?.note).toBe(reason);

      // Verify in DB directly
      const dbChanges = await tx.requestStateChange.findMany({
        where: { requestId: created.value.id },
        orderBy: { occurredAt: "asc" },
      });
      expect(dbChanges).toHaveLength(2);
      expect(dbChanges[1]?.note).toBe(reason);
    });
  });

  it("Case 11: updateDetails writes new detailsJson and subsequent findById returns it", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Request Venue 11",
        slug: `req-venue-${Date.now()}-c11`,
        taxRate: "0.1000",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const created = await requestRepo.create({
        venueId,
        serviceType: HotelService.MAINTENANCE,
        details: { issue: "lightbulb_broken" },
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const updated = await requestRepo.updateDetails(
        venueId,
        created.value.id,
        { issue: "lightbulb_broken", location: "bathroom", fixture: "ceiling" }
      );
      expect(updated.ok).toBe(true);
      if (!updated.ok) return;

      expect(updated.value.details).toEqual({
        issue: "lightbulb_broken",
        location: "bathroom",
        fixture: "ceiling",
      });

      const found = await requestRepo.findById(venueId, created.value.id);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value.details).toEqual({
          issue: "lightbulb_broken",
          location: "bathroom",
          fixture: "ceiling",
        });
      }
    });
  });

  it("Case 12: cross-venue read returns NOT_FOUND, never FORBIDDEN", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueA = await venueRepo.create({
        name: "Venue 12A",
        slug: `req-venue-${Date.now()}-c12a`,
        taxRate: "0.1000",
      });
      const venueB = await venueRepo.create({
        name: "Venue 12B",
        slug: `req-venue-${Date.now()}-c12b`,
        taxRate: "0.1000",
      });
      expect(venueA.ok).toBe(true);
      expect(venueB.ok).toBe(true);
      if (!venueA.ok || !venueB.ok) return;

      const createdA = await requestRepo.create({
        venueId: venueA.value.id,
        serviceType: HotelService.CONCIERGE,
      });
      expect(createdA.ok).toBe(true);
      if (!createdA.ok) return;

      // Venue B attempts to read Venue A's request
      const crossRead = await requestRepo.findById(
        venueB.value.id,
        createdA.value.id
      );
      expect(crossRead.ok).toBe(false);
      if (!crossRead.ok) {
        expect(crossRead.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("Case 13: advanceState, cancel, decline, updateDetails return NOT_FOUND on non-existent or cross-venue requests", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      const venueA = await venueRepo.create({
        name: "Venue 13A",
        slug: `req-venue-${Date.now()}-c13a`,
        taxRate: "0.1000",
      });
      const venueB = await venueRepo.create({
        name: "Venue 13B",
        slug: `req-venue-${Date.now()}-c13b`,
        taxRate: "0.1000",
      });
      expect(venueA.ok).toBe(true);
      expect(venueB.ok).toBe(true);
      if (!venueA.ok || !venueB.ok) return;

      const createdA = await requestRepo.create({
        venueId: venueA.value.id,
        serviceType: HotelService.HOUSEKEEPING,
      });
      expect(createdA.ok).toBe(true);
      if (!createdA.ok) return;

      const reqId = createdA.value.id;
      const fakeId = "00000000-0000-0000-0000-000000000000";

      // Non-existent request operations
      const advanceNonExistent = await requestRepo.advanceState({
        venueId: venueA.value.id,
        requestId: fakeId,
        toState: RequestState.IN_PROGRESS,
      });
      expect(advanceNonExistent.ok).toBe(false);
      if (!advanceNonExistent.ok) {
        expect(advanceNonExistent.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      // Cross-venue cancel
      const crossCancel = await requestRepo.cancel({
        venueId: venueB.value.id,
        requestId: reqId,
        reason: "Cross venue",
      });
      expect(crossCancel.ok).toBe(false);
      if (!crossCancel.ok) {
        expect(crossCancel.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      // Cross-venue decline
      const crossDecline = await requestRepo.decline({
        venueId: venueB.value.id,
        requestId: reqId,
        reason: "Cross venue",
      });
      expect(crossDecline.ok).toBe(false);
      if (!crossDecline.ok) {
        expect(crossDecline.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      // Cross-venue updateDetails
      const crossUpdate = await requestRepo.updateDetails(
        venueB.value.id,
        reqId,
        { item: "forbidden" }
      );
      expect(crossUpdate.ok).toBe(false);
      if (!crossUpdate.ok) {
        expect(crossUpdate.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });
});
