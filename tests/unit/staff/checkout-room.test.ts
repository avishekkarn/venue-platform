import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkoutRoom, type CheckoutRoomDeps } from "@/domain/staff/checkout-room";
import { RoomStatus, type RoomRepository } from "@/domain/organization/room.repository";
import { PlaceType, type GuestSessionRepository } from "@/domain/guest/guest-session.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

interface MockRoomRepository extends RoomRepository {
  readonly setStatus: ReturnType<typeof vi.fn<RoomRepository["setStatus"]>>;
}

interface MockGuestSessionRepository extends GuestSessionRepository {
  readonly invalidateByPlace: ReturnType<typeof vi.fn<GuestSessionRepository["invalidateByPlace"]>>;
}

describe("checkoutRoom domain action", () => {
  const venueId = "venue-alpha";
  const roomId = "room-404";

  let mockRoomRepo: MockRoomRepository;
  let mockGuestRepo: MockGuestSessionRepository;
  let deps: CheckoutRoomDeps;

  beforeEach(() => {
    mockRoomRepo = {
      findById: vi.fn(),
      findByNumber: vi.fn(),
      listForVenue: vi.fn(),
      create: vi.fn(),
      setState: vi.fn(),
      setStatus: vi.fn().mockResolvedValue(ok(undefined)),
    };

    mockGuestRepo = {
      create: vi.fn(),
      findByToken: vi.fn(),
      invalidateByToken: vi.fn(),
      invalidateByPlace: vi.fn().mockResolvedValue(ok(1)),
    };

    deps = {
      roomRepo: mockRoomRepo,
      guestRepo: mockGuestRepo,
    };
  });

  it("successfully invalidates guest sessions and vacates the room", async () => {
    const result = await checkoutRoom(deps, {
      venueId,
      roomId,
      staffMemberId: "staff-01",
    });

    expect(result.ok).toBe(true);
    expect(mockGuestRepo.invalidateByPlace).toHaveBeenCalledTimes(1);
    expect(mockGuestRepo.invalidateByPlace).toHaveBeenCalledWith(
      venueId,
      PlaceType.ROOM,
      roomId
    );
    expect(mockRoomRepo.setStatus).toHaveBeenCalledTimes(1);
    expect(mockRoomRepo.setStatus).toHaveBeenCalledWith(
      venueId,
      roomId,
      RoomStatus.VACANT
    );
  });

  it("supports guestSessionRepo property name in deps", async () => {
    const result = await checkoutRoom(
      { roomRepo: mockRoomRepo, guestSessionRepo: mockGuestRepo },
      { venueId, roomId }
    );

    expect(result.ok).toBe(true);
    expect(mockGuestRepo.invalidateByPlace).toHaveBeenCalledWith(
      venueId,
      PlaceType.ROOM,
      roomId
    );
    expect(mockRoomRepo.setStatus).toHaveBeenCalledWith(
      venueId,
      roomId,
      RoomStatus.VACANT
    );
  });

  it("fails with VALIDATION_FAILED if venueId is missing or empty", async () => {
    const result = await checkoutRoom(deps, {
      venueId: "",
      roomId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(mockGuestRepo.invalidateByPlace).not.toHaveBeenCalled();
    expect(mockRoomRepo.setStatus).not.toHaveBeenCalled();
  });

  it("fails with VALIDATION_FAILED if roomId is missing or empty", async () => {
    const result = await checkoutRoom(deps, {
      venueId,
      roomId: "   ",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(mockGuestRepo.invalidateByPlace).not.toHaveBeenCalled();
    expect(mockRoomRepo.setStatus).not.toHaveBeenCalled();
  });

  it("propagates error when invalidateSessionsForPlace fails", async () => {
    mockGuestRepo.invalidateByPlace.mockResolvedValueOnce(
      fail(DomainErrorCode.INTERNAL, "Session db error")
    );

    const result = await checkoutRoom(deps, {
      venueId,
      roomId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
    expect(mockRoomRepo.setStatus).not.toHaveBeenCalled();
  });

  it("propagates error when roomRepo.setStatus fails", async () => {
    mockRoomRepo.setStatus.mockResolvedValueOnce(
      fail(DomainErrorCode.NOT_FOUND, "Room not found")
    );

    const result = await checkoutRoom(deps, {
      venueId,
      roomId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
  });
});

