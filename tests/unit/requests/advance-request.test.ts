import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  advanceRequest,
  type AdvanceRequestDeps,
} from "@/domain/requests/advance-request";
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
  readonly advanceState: ReturnType<
    typeof vi.fn<ServiceRequestRepository["advanceState"]>
  >;
}

describe("advanceRequest domain function", () => {
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
  let deps: AdvanceRequestDeps;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockImplementation(() => {
        throw new Error("create is not used by advanceRequest");
      }),
      findById: vi.fn(),
      listForVenue: vi.fn().mockResolvedValue(ok([])),
      listForRoom: vi.fn().mockResolvedValue(ok([])),
      listForTable: vi.fn().mockResolvedValue(ok([])),
      listForCounter: vi.fn().mockResolvedValue(ok([])),
      listForGuestSession: vi.fn().mockResolvedValue(ok([])),
      advanceState: vi.fn(),
      cancel: vi.fn().mockImplementation(() => {
        throw new Error("cancel is not used by advanceRequest");
      }),
      decline: vi.fn().mockImplementation(() => {
        throw new Error("decline is not used by advanceRequest");
      }),
      updateDetails: vi.fn().mockImplementation(() => {
        throw new Error("updateDetails is not used by advanceRequest");
      }),
    };

    deps = {
      requestRepo: mockRepo,
    };
  });

  it("Case 1 — happy path SUBMITTED -> ACKNOWLEDGED advances state and calls advanceState once", async () => {
    const initial = createRequestFixture(RequestState.SUBMITTED);
    const updated = createRequestFixture(RequestState.ACKNOWLEDGED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.advanceState.mockResolvedValueOnce(ok(updated));

    const result = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
      staffMemberId: "staff-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(RequestState.ACKNOWLEDGED);

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.findById).toHaveBeenCalledWith(venueId, requestId);
    expect(mockRepo.advanceState).toHaveBeenCalledTimes(1);
    expect(mockRepo.advanceState).toHaveBeenCalledWith({
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
      staffMemberId: "staff-1",
    });
  });

  it("Case 2 — happy path ACKNOWLEDGED -> IN_PROGRESS advances state", async () => {
    const initial = createRequestFixture(RequestState.ACKNOWLEDGED);
    const updated = createRequestFixture(RequestState.IN_PROGRESS);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.advanceState.mockResolvedValueOnce(ok(updated));

    const result = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.IN_PROGRESS,
      staffMemberId: "staff-1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(RequestState.IN_PROGRESS);

    expect(mockRepo.advanceState).toHaveBeenCalledWith({
      venueId,
      requestId,
      toState: RequestState.IN_PROGRESS,
      staffMemberId: "staff-1",
    });
  });

  it("Case 3 — forbidden transition SUBMITTED -> COMPLETED fails with INVALID_STATE without repo call", async () => {
    const initial = createRequestFixture(RequestState.SUBMITTED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.COMPLETED,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "Transition from 'SUBMITTED' to 'COMPLETED' is not allowed"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.advanceState).not.toHaveBeenCalled();
  });

  it("Case 4 — terminal state COMPLETED rejects all transitions without repo call", async () => {
    const initial = createRequestFixture(RequestState.COMPLETED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.IN_PROGRESS,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(mockRepo.advanceState).not.toHaveBeenCalled();
  });

  it("Case 5 — findById failure propagates unchanged without repo call", async () => {
    mockRepo.findById.mockResolvedValueOnce(
      fail(
        DomainErrorCode.NOT_FOUND,
        `Request '${requestId}' not found for venue '${venueId}'`
      )
    );

    const result = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
    expect(result.error.message).toBe(
      `Request '${requestId}' not found for venue '${venueId}'`
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.advanceState).not.toHaveBeenCalled();
  });

  it("Case 6 — staffMemberId passthrough forwards provided id, null, and handles omission", async () => {
    const initial = createRequestFixture(RequestState.SUBMITTED);
    const updated = createRequestFixture(RequestState.ACKNOWLEDGED);

    // Sub-case A: provided staffMemberId: "staff-1"
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.advanceState.mockResolvedValueOnce(ok(updated));
    const r1 = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
      staffMemberId: "staff-1",
    });
    expect(r1.ok).toBe(true);
    expect(mockRepo.advanceState).toHaveBeenLastCalledWith({
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
      staffMemberId: "staff-1",
    });

    // Sub-case B: explicit null staffMemberId
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.advanceState.mockResolvedValueOnce(ok(updated));
    const r2 = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
      staffMemberId: null,
    });
    expect(r2.ok).toBe(true);
    expect(mockRepo.advanceState).toHaveBeenLastCalledWith({
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
      staffMemberId: null,
    });

    // Sub-case C: omitted staffMemberId
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.advanceState.mockResolvedValueOnce(ok(updated));
    const r3 = await advanceRequest(deps, {
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
    });
    expect(r3.ok).toBe(true);
    expect(mockRepo.advanceState).toHaveBeenLastCalledWith({
      venueId,
      requestId,
      toState: RequestState.ACKNOWLEDGED,
      staffMemberId: null,
    });
  });
});

