/**
 * Domain functions: approveOrder, startPreparingOrder, markOrderReady, deliverOrder, completeOrder
 *
 * Rules:
 * - Pure domain functions: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Receives AdvanceOrderDeps containing the OrderRepository port and never imports adapters.
 * - Delegates directly to advanceOrder with the fixed target OrderState for each action.
 * - Enforces the OrderState transition table from SYSTEM.md §9.2 via advanceOrder -> isTransitionAllowed.
 * - Carries acting staffMemberId through to the adapter for audit trail recording.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §9.1, §9.2, §9.3,
 * DECISIONS.md D-4.8, D-4.9, BUILD.md §5.
 */

import { type Order, OrderState } from "./order.repository";
import { advanceOrder, type AdvanceOrderDeps } from "./advance-order";
import { isTransitionAllowed } from "./transitions";
import { type Result, fail, DomainErrorCode } from "@/domain/shared/result";

export interface AdvanceActionRequest {
  readonly venueId: string;
  readonly orderId: string;
  readonly staffMemberId?: string | null;
}

export interface CancelOrderActionRequest {
  readonly venueId: string;
  readonly orderId: string;
  readonly reason: string;
  readonly staffMemberId?: string | null;
}

/**
 * Advances an order from PLACED to APPROVED.
 * Used by staff/manager to approve a newly placed guest order.
 */
export async function approveOrder(
  deps: AdvanceOrderDeps,
  input: AdvanceActionRequest
): Promise<Result<Order>> {
  return advanceOrder(deps, {
    venueId: input.venueId,
    orderId: input.orderId,
    toState: OrderState.APPROVED,
    staffMemberId: input.staffMemberId,
  });
}

/**
 * Advances an order from APPROVED to PREPARING.
 * Used by kitchen staff to indicate that preparation of the order has begun.
 */
export async function startPreparingOrder(
  deps: AdvanceOrderDeps,
  input: AdvanceActionRequest
): Promise<Result<Order>> {
  return advanceOrder(deps, {
    venueId: input.venueId,
    orderId: input.orderId,
    toState: OrderState.PREPARING,
    staffMemberId: input.staffMemberId,
  });
}

/**
 * Advances an order from PREPARING to READY.
 * Used by kitchen staff to indicate that the order is ready for pickup or delivery.
 */
export async function markOrderReady(
  deps: AdvanceOrderDeps,
  input: AdvanceActionRequest
): Promise<Result<Order>> {
  return advanceOrder(deps, {
    venueId: input.venueId,
    orderId: input.orderId,
    toState: OrderState.READY,
    staffMemberId: input.staffMemberId,
  });
}

/**
 * Advances an order from READY to DELIVERED.
 * Used by service staff to indicate that the order has been delivered to the table or room.
 */
export async function deliverOrder(
  deps: AdvanceOrderDeps,
  input: AdvanceActionRequest
): Promise<Result<Order>> {
  return advanceOrder(deps, {
    venueId: input.venueId,
    orderId: input.orderId,
    toState: OrderState.DELIVERED,
    staffMemberId: input.staffMemberId,
  });
}

/**
 * Advances an order from DELIVERED to COMPLETED.
 * Used by staff/manager to mark an order completed/settled.
 */
export async function completeOrder(
  deps: AdvanceOrderDeps,
  input: AdvanceActionRequest
): Promise<Result<Order>> {
  return advanceOrder(deps, {
    venueId: input.venueId,
    orderId: input.orderId,
    toState: OrderState.COMPLETED,
    staffMemberId: input.staffMemberId,
  });
}

/**
 * Cancels an order with a reason after validating that the transition is allowed.
 * Used by staff/manager to cancel an order.
 */
export async function cancelOrder(
  deps: AdvanceOrderDeps,
  input: CancelOrderActionRequest
): Promise<Result<Order>> {
  if (
    !input.reason ||
    typeof input.reason !== "string" ||
    input.reason.trim() === ""
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Cancellation reason is required"
    );
  }

  const currentOrderResult = await deps.orderRepo.findById(
    input.venueId,
    input.orderId
  );
  if (!currentOrderResult.ok) {
    return currentOrderResult;
  }

  const transitionResult = isTransitionAllowed(
    currentOrderResult.value.state,
    OrderState.CANCELLED
  );
  if (!transitionResult.ok) {
    return transitionResult;
  }

  return deps.orderRepo.cancel({
    venueId: input.venueId,
    orderId: input.orderId,
    reason: input.reason.trim(),
    staffMemberId: input.staffMemberId ?? null,
  });
}



