import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelRequest,
  type CancelRequestDeps,
} from "@/domain/requests/cancel-request";
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
  readonly cancel: ReturnType<typeof vi.fn<ServiceRequestRepository["cancel"]>>;
}

describe("cancelRequest domain function", () => {
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
  let deps: CancelRequestDeps;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockImplementation(() => {
        throw new Error("create is not used by cancelRequest");
      }),
      findById: vi.fn(),
      listForVenue: vi.fn().mockResolvedValue(ok([])),
      listOpenForVenue: vi.fn().mockResolvedValue(ok([])),
      listForRoom: vi.fn().mockResolvedValue(ok([])),
      listForTable: vi.fn().mockResolvedValue(ok([])),
      listForCounter: vi.fn().mockResolvedValue(ok([])),
      listForGuestSession: vi.fn().mockResolvedValue(ok([])),
      advanceState: vi.fn().mockImplementation(() => {
        throw new Error("advanceState is not used by cancelRequest");
      }),
      cancel: vi.fn(),
      decline: vi.fn().mockImplementation(() => {
        throw new Error("decline is not used by cancelRequest");
      }),
      updateDetails: vi.fn().mockImplementation(() => {
        throw new Error("updateDetails is not used by cancelRequest");
      }),
    };

    deps = {
      requestRepo: mockRepo,
    };
  });

  it("Case 1 — guest cancel while SUBMITTED succeeds and passes staffMemberId: null", async () => {
    const initial = createRequestFixture(RequestState.SUBMITTED);
    const cancelled = createRequestFixture(RequestState.CANCELLED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.cancel.mockResolvedValueOnce(ok(cancelled));

    const result = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "changed mind",
      by: "guest",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(RequestState.CANCELLED);

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.findById).toHaveBeenCalledWith(venueId, requestId);
    expect(mockRepo.cancel).toHaveBeenCalledTimes(1);
    expect(mockRepo.cancel).toHaveBeenCalledWith({
      venueId,
      requestId,
      reason: "changed mind",
      staffMemberId: null,
    });
  });

  it("Case 2 — guest cancel while ACKNOWLEDGED fails with INVALID_STATE", async () => {
    const initial = createRequestFixture(RequestState.ACKNOWLEDGED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "changed mind",
      by: "guest",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "A guest may cancel a request only while it is Submitted"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.cancel).not.toHaveBeenCalled();
  });

  it("Case 3 — guest cancel while IN_PROGRESS fails with INVALID_STATE", async () => {
    const initial = createRequestFixture(RequestState.IN_PROGRESS);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "no longer needed",
      by: "guest",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "A guest may cancel a request only while it is Submitted"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.cancel).not.toHaveBeenCalled();
  });

  it("Case 4 — staff cancel while ACKNOWLEDGED succeeds with staffMemberId", async () => {
    const initial = createRequestFixture(RequestState.ACKNOWLEDGED);
    const cancelled = createRequestFixture(RequestState.CANCELLED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.cancel.mockResolvedValueOnce(ok(cancelled));

    const result = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "Item unavailable",
      by: "staff",
      staffMemberId: "staff-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(RequestState.CANCELLED);

    expect(mockRepo.cancel).toHaveBeenCalledWith({
      venueId,
      requestId,
      reason: "Item unavailable",
      staffMemberId: "staff-1",
    });
  });

  it("Case 5 — staff cancel while IN_PROGRESS succeeds", async () => {
    const initial = createRequestFixture(RequestState.IN_PROGRESS);
    const cancelled = createRequestFixture(RequestState.CANCELLED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.cancel.mockResolvedValueOnce(ok(cancelled));

    const result = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "Guest requested cancellation in person",
      by: "staff",
      staffMemberId: "staff-2",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(RequestState.CANCELLED);

    expect(mockRepo.cancel).toHaveBeenCalledWith({
      venueId,
      requestId,
      reason: "Guest requested cancellation in person",
      staffMemberId: "staff-2",
    });
  });

  it("Case 6 — staff cancel from terminal state COMPLETED fails with INVALID_STATE", async () => {
    const initial = createRequestFixture(RequestState.COMPLETED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "Try to cancel finished request",
      by: "staff",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "Transition from 'COMPLETED' to 'CANCELLED' is not allowed"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.cancel).not.toHaveBeenCalled();
  });

  it("Case 7 — empty reason fails before any repo call", async () => {
    const result1 = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "",
      by: "staff",
    });

    expect(result1.ok).toBe(false);
    if (!result1.ok) {
      expect(result1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result1.error.message).toBe("Cancellation reason is required");
    }

    const result2 = await cancelRequest(deps, {
      venueId,
      requestId,
      reason: "   ",
      by: "guest",
    });

    expect(result2.ok).toBe(false);
    if (!result2.ok) {
      expect(result2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result2.error.message).toBe("Cancellation reason is required");
    }

    expect(mockRepo.findById).not.toHaveBeenCalled();
    expect(mockRepo.cancel).not.toHaveBeenCalled();
  });
});

