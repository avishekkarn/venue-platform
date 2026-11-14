import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  declineRequest,
  type DeclineRequestDeps,
} from "@/domain/requests/decline-request";
import {
  type ServiceRequest,
  type ServiceRequestRepository,
  RequestState,
  HotelService,
  PlaceType,
} from "@/domain/requests/request.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

interface MockRequestRepository extends ServiceRequestRepository {
  readonly findById: ReturnType<typeof vi.fn<ServiceRequestRepository["findById"]>>;
  readonly decline: ReturnType<typeof vi.fn<ServiceRequestRepository["decline"]>>;
}

describe("declineRequest domain function", () => {
  const venueId = "venue-123";
  const requestId = "req-456";

  function createRequestFixture(state: RequestState): ServiceRequest {
    return {
      id: requestId,
      venueId,
      placeType: PlaceType.ROOM,
      roomId: "room-101",
      tableId: null,
      counterId: null,
      serviceType: HotelService.ROOM_SERVICE_FOOD,
      state,
      details: {},
      submittedAt: new Date("2026-01-01T12:00:00Z"),
      updatedAt: new Date("2026-01-01T12:00:00Z"),
      stateChanges: [],
    };
  }

  let mockRepo: MockRequestRepository;
  let deps: DeclineRequestDeps;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockImplementation(() => {
        throw new Error("create is not used by declineRequest");
      }),
      findById: vi.fn(),
      listForVenue: vi.fn().mockResolvedValue(ok([])),
      listOpenForVenue: vi.fn().mockResolvedValue(ok([])),
      listForRoom: vi.fn().mockResolvedValue(ok([])),
      listForTable: vi.fn().mockResolvedValue(ok([])),
      listForCounter: vi.fn().mockResolvedValue(ok([])),
      listForGuestSession: vi.fn().mockResolvedValue(ok([])),
      advanceState: vi.fn().mockImplementation(() => {
        throw new Error("advanceState is not used by declineRequest");
      }),
      cancel: vi.fn().mockImplementation(() => {
        throw new Error("cancel is not used by declineRequest");
      }),
      decline: vi.fn(),
      updateDetails: vi.fn().mockImplementation(() => {
        throw new Error("updateDetails is not used by declineRequest");
      }),
    };

    deps = {
      requestRepo: mockRepo,
    };
  });

  it("Case 1 — decline from SUBMITTED succeeds and calls decline once with expected input", async () => {
    const initial = createRequestFixture(RequestState.SUBMITTED);
    const declined = createRequestFixture(RequestState.DECLINED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.decline.mockResolvedValueOnce(ok(declined));

    const result = await declineRequest(deps, {
      venueId,
      requestId,
      reason: "cannot fulfil",
      staffMemberId: "staff-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(RequestState.DECLINED);

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.findById).toHaveBeenCalledWith(venueId, requestId);
    expect(mockRepo.decline).toHaveBeenCalledTimes(1);
    expect(mockRepo.decline).toHaveBeenCalledWith({
      venueId,
      requestId,
      reason: "cannot fulfil",
      staffMemberId: "staff-1",
    });
  });

  it("Case 2 — decline from ACKNOWLEDGED succeeds", async () => {
    const initial = createRequestFixture(RequestState.ACKNOWLEDGED);
    const declined = createRequestFixture(RequestState.DECLINED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.decline.mockResolvedValueOnce(ok(declined));

    const result = await declineRequest(deps, {
      venueId,
      requestId,
      reason: "Item out of stock",
      staffMemberId: "staff-2",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(RequestState.DECLINED);

    expect(mockRepo.decline).toHaveBeenCalledWith({
      venueId,
      requestId,
      reason: "Item out of stock",
      staffMemberId: "staff-2",
    });
  });

  it("Case 3 — decline from IN_PROGRESS fails with INVALID_STATE without repo call", async () => {
    const initial = createRequestFixture(RequestState.IN_PROGRESS);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await declineRequest(deps, {
      venueId,
      requestId,
      reason: "Cannot cancel work in progress",
      staffMemberId: "staff-1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "Transition from 'IN_PROGRESS' to 'DECLINED' is not allowed"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.decline).not.toHaveBeenCalled();
  });

  it("Case 4 — empty reason fails before any repo call", async () => {
    const result = await declineRequest(deps, {
      venueId,
      requestId,
      reason: " ",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result.error.message).toBe("Decline reason is required");
    }

    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.decline).not.toHaveBeenCalled();
  });

  it("Case 5 — findById failure propagates unchanged without decline call", async () => {
    mockRepo.findById.mockResolvedValueOnce(
      fail(
        DomainErrorCode.NOT_FOUND,
        `Request '${requestId}' not found for venue '${venueId}'`
      )
    );

    const result = await declineRequest(deps, {
      venueId,
      requestId,
      reason: "Not found test",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
    expect(result.error.message).toBe(
      `Request '${requestId}' not found for venue '${venueId}'`
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.decline).not.toHaveBeenCalled();
  });
});

