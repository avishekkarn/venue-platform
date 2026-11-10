/**
 * Integration tests for the Guest Requests View data contract.
 *
 * Verifies that the repository queries backing app/(guest)/requests/page.tsx
 * correctly return active requests for a guest's place and reflect state
 * transitions (e.g., when advanced by staff to ACKNOWLEDGED).
 *
 * Reference: Task 7.5.8.A.2, PRODUCT.md §6.12, D-5.1.
 */

import { describe, it, expect } from "vitest";
import { withTransaction } from "../setup";
import {
  HotelService,
  PlaceType,
  RequestState,
} from "@/domain/requests/request.repository";
import { StaffRole } from "@/domain/auth/staff.repository";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { hashPassword } from "@/infrastructure/auth/password";

describe("Guest Requests View Integration Tests (Task 7.5.8.A.2)", () => {
  it("Case 1: Guest's active request appears via requestRepo.listForRoom (SUBMITTED, HOUSEKEEPING)", async () => {
    await withTransaction(async (tx) => {
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);

      // 1. Fixtures: venue and room
      const venue = await tx.venue.create({
        data: {
          name: "Guest Requests View Test Venue",
          slug: `req-view-venue-${Date.now()}-1`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-201",
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

      // 3. Seed one HOUSEKEEPING request with state = SUBMITTED
      const createReqResult = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
        details: { items: ["Extra towels"], when: "As soon as possible" },
      });
      expect(createReqResult.ok).toBe(true);
      if (!createReqResult.ok) return;

      // 4. Query listForRoom within the transaction
      const listResult = await requestRepo.listForRoom(venue.id, room.id);
      expect(listResult.ok).toBe(true);
      if (!listResult.ok) return;

      expect(listResult.value).toHaveLength(1);
      expect(listResult.value[0]?.serviceType).toBe("HOUSEKEEPING");
      expect(listResult.value[0]?.state).toBe("SUBMITTED");
      expect(listResult.value[0]?.roomId).toBe(room.id);
    });
  });

  it("Case 2: After staff advances the request, the next read reflects the new state (ACKNOWLEDGED with staffMemberId)", async () => {
    await withTransaction(async (tx) => {
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const requestRepo = createPrismaServiceRequestRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);

      // 1. Fixtures: venue, room, staff
      const venue = await tx.venue.create({
        data: {
          name: "Guest Requests View Advance Venue",
          slug: `req-view-venue-${Date.now()}-2`,
          taxRate: "0.1000",
        },
      });

      const room = await tx.room.create({
        data: {
          venueId: venue.id,
          number: "R-202",
        },
      });

      const passwordHash = await hashPassword("ValidPass123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Floor Attendant",
        username: `attendant-${Date.now()}@example.com`,
        passwordHash,
        roles: [StaffRole.FRONT_DESK],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      // 2. Fixture: guest session bound to room
      const sessionResult = await guestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        placeId: room.id,
      });
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      // 3. Seed one HOUSEKEEPING request with state = SUBMITTED
      const createReqResult = await requestRepo.create({
        venueId: venue.id,
        placeType: PlaceType.ROOM,
        roomId: room.id,
        serviceType: HotelService.HOUSEKEEPING,
        details: { items: ["Extra pillows"] },
      });
      expect(createReqResult.ok).toBe(true);
      if (!createReqResult.ok) return;
      const requestId = createReqResult.value.id;

      // 4. Staff advances request to ACKNOWLEDGED
      const advanceResult = await requestRepo.advanceState({
        venueId: venue.id,
        requestId,
        toState: RequestState.ACKNOWLEDGED,
        staffMemberId: staff.id,
      });
      expect(advanceResult.ok).toBe(true);
      if (!advanceResult.ok) return;

      // 5. Re-read via requestRepo.listForRoom
      const listResult = await requestRepo.listForRoom(venue.id, room.id);
      expect(listResult.ok).toBe(true);
      if (!listResult.ok) return;

      expect(listResult.value).toHaveLength(1);
      expect(listResult.value[0]?.state).toBe("ACKNOWLEDGED");

      const ackChange = listResult.value[0]?.stateChanges.find(
        (sc) => sc.state === "ACKNOWLEDGED"
      );
      expect(ackChange).toBeDefined();
      expect(ackChange?.staffMemberId).toBe(staff.id);
      expect(ackChange?.staffMemberId).not.toBeNull();
    });
  });
});

