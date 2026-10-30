/**
 * OrderState transition rules for orders.
 *
 * Rules:
 * - Pure domain module: zero dependencies on Prisma, React, HTTP, or database.
 * - Enforces the OrderState transition table from SYSTEM.md §9.2.
 * - Allowed transitions:
 *     PLACED    → APPROVED | CANCELLED
 *     APPROVED  → PREPARING | CANCELLED
 *     PREPARING → READY | CANCELLED
 *     READY     → DELIVERED | CANCELLED
 *     DELIVERED → COMPLETED
 * - CANCELLED and COMPLETED are terminal states (no transitions allowed out of them).
 * - Self-transitions are forbidden for all states.
 * - Forbidden transitions return fail(DomainErrorCode.INVALID_STATE, ...).
 *
 * Reference: SYSTEM.md §9.1, §9.2, §9.3, DECISIONS.md D-4.8, D-4.9.
 */

import { OrderState } from "./order.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

/**
 * The canonical nine allowed order transitions per SYSTEM.md §9.2.
 */
export const ALLOWED_TRANSITIONS: ReadonlyArray<{
  readonly from: OrderState;
  readonly to: OrderState;
}> = [
  { from: OrderState.PLACED, to: OrderState.APPROVED },
  { from: OrderState.PLACED, to: OrderState.CANCELLED },
  { from: OrderState.APPROVED, to: OrderState.PREPARING },
  { from: OrderState.APPROVED, to: OrderState.CANCELLED },
  { from: OrderState.PREPARING, to: OrderState.READY },
  { from: OrderState.PREPARING, to: OrderState.CANCELLED },
  { from: OrderState.READY, to: OrderState.DELIVERED },
  { from: OrderState.READY, to: OrderState.CANCELLED },
  { from: OrderState.DELIVERED, to: OrderState.COMPLETED },
] as const;

/**
 * Validates whether an OrderState transition from -> to is allowed.
 *
 * @param from The current order state.
 * @param to The target order state.
 * @returns Result<true> with ok(true) if allowed, or fail(DomainErrorCode.INVALID_STATE) if forbidden.
 */
export function isTransitionAllowed(
  from: OrderState,
  to: OrderState
): Result<true> {
  let allowed = false;

  switch (from) {
    case OrderState.PLACED:
      allowed = to === OrderState.APPROVED || to === OrderState.CANCELLED;
      break;
    case OrderState.APPROVED:
      allowed = to === OrderState.PREPARING || to === OrderState.CANCELLED;
      break;
    case OrderState.PREPARING:
      allowed = to === OrderState.READY || to === OrderState.CANCELLED;
      break;
    case OrderState.READY:
      allowed = to === OrderState.DELIVERED || to === OrderState.CANCELLED;
      break;
    case OrderState.DELIVERED:
      allowed = to === OrderState.COMPLETED;
      break;
    case OrderState.COMPLETED:
    case OrderState.CANCELLED:
      allowed = false;
      break;
  }

  if (allowed) {
    return ok(true);
  }

  return fail(
    DomainErrorCode.INVALID_STATE,
    `Transition from '${from}' to '${to}' is not allowed`
  );
}

