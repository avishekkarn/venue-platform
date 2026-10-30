/**
 * Domain function: advanceOrder
 *
 * Rules:
 * - Pure domain function: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Receives an OrderRepository port as a dependency and never imports the adapter.
 * - Enforces the OrderState transition table from SYSTEM.md §9.2 by calling isTransitionAllowed.
 * - Reads current order via orderRepo.findById; propagates failure unchanged.
 * - If transition is forbidden, returns fail(INVALID_STATE, ...) and never calls advanceState.
 * - Carries acting staffMemberId through to the adapter, which writes the OrderStateChange record.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §9.1, §9.2, §9.3,
 * DECISIONS.md D-4.8, D-4.9, BUILD.md §5.
 */

import {
  type Order,
  type OrderRepository,
  OrderState,
} from "./order.repository";
import { isTransitionAllowed } from "./transitions";
import { type Result } from "@/domain/shared/result";

export interface AdvanceOrderDeps {
  readonly orderRepo: OrderRepository;
}

export interface AdvanceOrderRequest {
  readonly venueId: string;
  readonly orderId: string;
  readonly toState: OrderState;
  readonly staffMemberId?: string | null;
}

/**
 * Advances an order to a new state after validating that the transition is allowed.
 *
 * @param deps Injected dependencies containing the OrderRepository port.
 * @param input AdvanceOrderRequest specifying venue, order, target state, and acting staff member.
 * @returns Promise<Result<Order>> with the updated order or an appropriate DomainError.
 */
export async function advanceOrder(
  deps: AdvanceOrderDeps,
  input: AdvanceOrderRequest
): Promise<Result<Order>> {
  const currentOrderResult = await deps.orderRepo.findById(
    input.venueId,
    input.orderId
  );
  if (!currentOrderResult.ok) {
    return currentOrderResult;
  }

  const transitionResult = isTransitionAllowed(
    currentOrderResult.value.state,
    input.toState
  );
  if (!transitionResult.ok) {
    return transitionResult;
  }

  return deps.orderRepo.advanceState({
    venueId: input.venueId,
    orderId: input.orderId,
    toState: input.toState,
    staffMemberId: input.staffMemberId ?? null,
  });
}

