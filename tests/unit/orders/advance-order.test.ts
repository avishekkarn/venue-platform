import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  advanceOrder,
  type AdvanceOrderDeps,
} from "@/domain/orders/advance-order";
import {
  type Order,
  type OrderRepository,
  OrderState,
  PlaceType,
} from "@/domain/orders/order.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

interface MockOrderRepository extends OrderRepository {
  readonly findById: ReturnType<typeof vi.fn<OrderRepository["findById"]>>;
  readonly advanceState: ReturnType<typeof vi.fn<OrderRepository["advanceState"]>>;
}

describe("advanceOrder domain function", () => {
  const venueId = "venue-123";
  const orderId = "order-456";

  const baseOrder: Order = {
    id: orderId,
    venueId,
    guestSessionId: "session-1",
    placeType: PlaceType.TABLE,
    tableId: "table-1",
    roomId: null,
    counterId: null,
    pickupName: null,
    state: OrderState.PLACED,
    subtotal: "25.00",
    taxRate: "0.1000",
    taxAmount: "2.50",
    total: "27.50",
    notes: null,
    placedAt: new Date("2026-01-01T12:00:00Z"),
    updatedAt: new Date("2026-01-01T12:00:00Z"),
    items: [],
    stateChanges: [],
  };

  let mockOrderRepo: MockOrderRepository;
  let deps: AdvanceOrderDeps;

  beforeEach(() => {
    mockOrderRepo = {
      create: vi.fn().mockImplementation(() => {
        throw new Error("create is not used by advanceOrder");
      }),
      findById: vi.fn(),
      findByIdempotencyKey: vi.fn().mockImplementation(() => {
        throw new Error("findByIdempotencyKey is not used by advanceOrder");
      }),
      listForVenue: vi.fn().mockResolvedValue(ok([])),
      listForGuestSession: vi.fn().mockResolvedValue(ok([])),
      advanceState: vi.fn(),
      cancel: vi.fn().mockImplementation(() => {
        throw new Error("cancel is not used by advanceOrder");
      }),
    };

    deps = {
      orderRepo: mockOrderRepo,
    };
  });

  it("returns ok(order) for an allowed transition and calls advanceState once with the correct input", async () => {
    mockOrderRepo.findById.mockResolvedValueOnce(ok(baseOrder));
    const updatedOrder: Order = {
      ...baseOrder,
      state: OrderState.APPROVED,
    };
    mockOrderRepo.advanceState.mockResolvedValueOnce(ok(updatedOrder));

    const result = await advanceOrder(deps, {
      venueId,
      orderId,
      toState: OrderState.APPROVED,
      staffMemberId: "staff-123",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe(OrderState.APPROVED);

    expect(mockOrderRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.findById).toHaveBeenCalledWith(venueId, orderId);

    expect(mockOrderRepo.advanceState).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.advanceState).toHaveBeenCalledWith({
      venueId,
      orderId,
      toState: OrderState.APPROVED,
      staffMemberId: "staff-123",
    });
  });

  it("returns INVALID_STATE and does NOT call advanceState when the transition is forbidden", async () => {
    mockOrderRepo.findById.mockResolvedValueOnce(ok(baseOrder));

    const result = await advanceOrder(deps, {
      venueId,
      orderId,
      toState: OrderState.PREPARING,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
    expect(result.error.message).toBe(
      "Transition from 'PLACED' to 'PREPARING' is not allowed"
    );

    expect(mockOrderRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.advanceState).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND and does NOT call advanceState when the order does not exist", async () => {
    mockOrderRepo.findById.mockResolvedValueOnce(
      fail(
        DomainErrorCode.NOT_FOUND,
        `Order '${orderId}' not found for venue '${venueId}'`
      )
    );

    const result = await advanceOrder(deps, {
      venueId,
      orderId,
      toState: OrderState.APPROVED,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
    expect(result.error.message).toBe(
      `Order '${orderId}' not found for venue '${venueId}'`
    );

    expect(mockOrderRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.advanceState).not.toHaveBeenCalled();
  });

  it("forwards staffMemberId unchanged, including null and omission", async () => {
    const updatedOrder: Order = {
      ...baseOrder,
      state: OrderState.APPROVED,
    };

    // Sub-case 1: staffMemberId omitted
    mockOrderRepo.findById.mockResolvedValueOnce(ok(baseOrder));
    mockOrderRepo.advanceState.mockResolvedValueOnce(ok(updatedOrder));

    const r1 = await advanceOrder(deps, {
      venueId,
      orderId,
      toState: OrderState.APPROVED,
    });

    expect(r1.ok).toBe(true);
    expect(mockOrderRepo.advanceState).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.advanceState).toHaveBeenLastCalledWith({
      venueId,
      orderId,
      toState: OrderState.APPROVED,
      staffMemberId: null,
    });

    // Sub-case 2: staffMemberId explicitly null
    mockOrderRepo.findById.mockResolvedValueOnce(ok(baseOrder));
    mockOrderRepo.advanceState.mockResolvedValueOnce(ok(updatedOrder));

    const r2 = await advanceOrder(deps, {
      venueId,
      orderId,
      toState: OrderState.APPROVED,
      staffMemberId: null,
    });

    expect(r2.ok).toBe(true);
    expect(mockOrderRepo.advanceState).toHaveBeenCalledTimes(2);
    expect(mockOrderRepo.advanceState).toHaveBeenLastCalledWith({
      venueId,
      orderId,
      toState: OrderState.APPROVED,
      staffMemberId: null,
    });
  });

  it("propagates the advanceState failure unchanged", async () => {
    mockOrderRepo.findById.mockResolvedValueOnce(ok(baseOrder));
    mockOrderRepo.advanceState.mockResolvedValueOnce(
      fail(DomainErrorCode.INTERNAL, "Database update failed")
    );

    const result = await advanceOrder(deps, {
      venueId,
      orderId,
      toState: OrderState.APPROVED,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
    expect(result.error.message).toBe("Database update failed");
  });
});

