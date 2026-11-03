import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  editRequest,
  type EditRequestDeps,
} from "@/domain/requests/edit-request";
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
  readonly updateDetails: ReturnType<
    typeof vi.fn<ServiceRequestRepository["updateDetails"]>
  >;
}

describe("editRequest domain function", () => {
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
  let deps: EditRequestDeps;

  beforeEach(() => {
    mockRepo = {
      create: vi.fn().mockImplementation(() => {
        throw new Error("create is not used by editRequest");
      }),
      findById: vi.fn(),
      listForVenue: vi.fn().mockResolvedValue(ok([])),
      listForRoom: vi.fn().mockResolvedValue(ok([])),
      listForTable: vi.fn().mockResolvedValue(ok([])),
      listForCounter: vi.fn().mockResolvedValue(ok([])),
      advanceState: vi.fn().mockImplementation(() => {
        throw new Error("advanceState is not used by editRequest");
      }),
      cancel: vi.fn().mockImplementation(() => {
        throw new Error("cancel is not used by editRequest");
      }),
      decline: vi.fn().mockImplementation(() => {
        throw new Error("decline is not used by editRequest");
      }),
      updateDetails: vi.fn(),
    };

    deps = {
      requestRepo: mockRepo,
    };
  });

  it("Case 1 — edit while SUBMITTED succeeds and calls updateDetails once with positional arguments", async () => {
    const initial = createRequestFixture(RequestState.SUBMITTED);
    const updated: ServiceRequest = {
      ...initial,
      details: { towels: 2 },
    };
    mockRepo.findById.mockResolvedValueOnce(ok(initial));
    mockRepo.updateDetails.mockResolvedValueOnce(ok(updated));

    const result = await editRequest(deps, {
      venueId,
      requestId,
      details: { towels: 2 },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.details).toEqual({ towels: 2 });

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.findById).toHaveBeenCalledWith(venueId, requestId);
    expect(mockRepo.updateDetails).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateDetails).toHaveBeenCalledWith(venueId, requestId, {
      towels: 2,
    });
  });

  it("Case 2 — edit while ACKNOWLEDGED fails with INVALID_STATE without updateDetails call", async () => {
    const initial = createRequestFixture(RequestState.ACKNOWLEDGED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await editRequest(deps, {
      venueId,
      requestId,
      details: { towels: 3 },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "A request can be edited only while it is Submitted"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateDetails).not.toHaveBeenCalled();
  });

  it("Case 3 — edit while IN_PROGRESS fails with INVALID_STATE without updateDetails call", async () => {
    const initial = createRequestFixture(RequestState.IN_PROGRESS);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await editRequest(deps, {
      venueId,
      requestId,
      details: { towels: 4 },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "A request can be edited only while it is Submitted"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateDetails).not.toHaveBeenCalled();
  });

  it("Case 4 — edit while COMPLETED fails with INVALID_STATE without updateDetails call", async () => {
    const initial = createRequestFixture(RequestState.COMPLETED);
    mockRepo.findById.mockResolvedValueOnce(ok(initial));

    const result = await editRequest(deps, {
      venueId,
      requestId,
      details: { towels: 5 },
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "A request can be edited only while it is Submitted"
    );

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.updateDetails).not.toHaveBeenCalled();
  });
});

