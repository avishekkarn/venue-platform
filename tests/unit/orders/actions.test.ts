import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  approveOrder,
  startPreparingOrder,
  markOrderReady,
} from "@/domain/orders/actions";
import { type AdvanceOrderDeps } from "@/domain/orders/advance-order";
import {
  type Order,
  type OrderRepository,
  OrderState,
  PlaceType,
} from "@/domain/orders/order.repository";
import { ok, DomainErrorCode } from "@/domain/shared/result";

interface MockOrderRepository extends OrderRepository {
  readonly findById: ReturnType<typeof vi.fn<OrderRepository["findById"]>>;
  readonly advanceState: ReturnType<typeof vi.fn<OrderRepository["advanceState"]>>;
}

describe("kitchen order actions (approveOrder, startPreparingOrder, markOrderReady)", () => {
  const venueId = "venue-test";
  const orderId = "order-test";

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
    subtotal: "40.00",
    taxRate: "0.1000",
    taxAmount: "4.00",
    total: "44.00",
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
        throw new Error("create is not used by action functions");
      }),
      findById: vi.fn(),
      findByIdempotencyKey: vi.fn().mockImplementation(() => {
        throw new Error("findByIdempotencyKey is not used by action functions");
      }),
      listForVenue: vi.fn().mockResolvedValue(ok([])),
      listForGuestSession: vi.fn().mockResolvedValue(ok([])),
      advanceState: vi.fn(),
      cancel: vi.fn().mockImplementation(() => {
        throw new Error("cancel is not used by action functions");
      }),
    };

    deps = {
      orderRepo: mockOrderRepo,
    };
  });

  describe("approveOrder", () => {
    it("successfully advances an order from PLACED to APPROVED and calls advanceState once", async () => {
      const placedOrder: Order = { ...baseOrder, state: OrderState.PLACED };
      const approvedOrder: Order = { ...baseOrder, state: OrderState.APPROVED };

      mockOrderRepo.findById.mockResolvedValueOnce(ok(placedOrder));
      mockOrderRepo.advanceState.mockResolvedValueOnce(ok(approvedOrder));

      const result = await approveOrder(deps, {
        venueId,
        orderId,
        staffMemberId: "staff-mgr-1",
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
        staffMemberId: "staff-mgr-1",
      });
    });

    it("returns INVALID_STATE and does NOT call advanceState when order is already APPROVED", async () => {
      const alreadyApprovedOrder: Order = {
        ...baseOrder,
        state: OrderState.APPROVED,
      };

      mockOrderRepo.findById.mockResolvedValueOnce(ok(alreadyApprovedOrder));

      const result = await approveOrder(deps, {
        venueId,
        orderId,
        staffMemberId: "staff-mgr-1",
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
      expect(result.error.message).toBe(
        "Transition from 'APPROVED' to 'APPROVED' is not allowed"
      );

      expect(mockOrderRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.advanceState).not.toHaveBeenCalled();
    });
  });

  describe("startPreparingOrder", () => {
    it("successfully advances an order from APPROVED to PREPARING and calls advanceState once", async () => {
      const approvedOrder: Order = {
        ...baseOrder,
        state: OrderState.APPROVED,
      };
      const preparingOrder: Order = {
        ...baseOrder,
        state: OrderState.PREPARING,
      };

      mockOrderRepo.findById.mockResolvedValueOnce(ok(approvedOrder));
      mockOrderRepo.advanceState.mockResolvedValueOnce(ok(preparingOrder));

      const result = await startPreparingOrder(deps, {
        venueId,
        orderId,
        staffMemberId: "chef-1",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.state).toBe(OrderState.PREPARING);

      expect(mockOrderRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.findById).toHaveBeenCalledWith(venueId, orderId);

      expect(mockOrderRepo.advanceState).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.advanceState).toHaveBeenCalledWith({
        venueId,
        orderId,
        toState: OrderState.PREPARING,
        staffMemberId: "chef-1",
      });
    });

    it("returns INVALID_STATE and does NOT call advanceState when order is in PLACED state", async () => {
      const placedOrder: Order = {
        ...baseOrder,
        state: OrderState.PLACED,
      };

      mockOrderRepo.findById.mockResolvedValueOnce(ok(placedOrder));

      const result = await startPreparingOrder(deps, {
        venueId,
        orderId,
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
  });

  describe("markOrderReady", () => {
    it("successfully advances an order from PREPARING to READY and calls advanceState once", async () => {
      const preparingOrder: Order = {
        ...baseOrder,
        state: OrderState.PREPARING,
      };
      const readyOrder: Order = {
        ...baseOrder,
        state: OrderState.READY,
      };

      mockOrderRepo.findById.mockResolvedValueOnce(ok(preparingOrder));
      mockOrderRepo.advanceState.mockResolvedValueOnce(ok(readyOrder));

      const result = await markOrderReady(deps, {
        venueId,
        orderId,
        staffMemberId: "chef-1",
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.state).toBe(OrderState.READY);

      expect(mockOrderRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.findById).toHaveBeenCalledWith(venueId, orderId);

      expect(mockOrderRepo.advanceState).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.advanceState).toHaveBeenCalledWith({
        venueId,
        orderId,
        toState: OrderState.READY,
        staffMemberId: "chef-1",
      });
    });

    it("returns INVALID_STATE and does NOT call advanceState when order is in APPROVED state", async () => {
      const approvedOrder: Order = {
        ...baseOrder,
        state: OrderState.APPROVED,
      };

      mockOrderRepo.findById.mockResolvedValueOnce(ok(approvedOrder));

      const result = await markOrderReady(deps, {
        venueId,
        orderId,
      });

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
      expect(result.error.message).toBe(
        "Transition from 'APPROVED' to 'READY' is not allowed"
      );

      expect(mockOrderRepo.findById).toHaveBeenCalledTimes(1);
      expect(mockOrderRepo.advanceState).not.toHaveBeenCalled();
    });
  });
});

