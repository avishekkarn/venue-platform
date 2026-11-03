/**
 * Domain: Request state transition table (SYSTEM.md §10.2).
 *
 * The single source of truth for which RequestState → RequestState moves are
 * permitted. Every domain function that advances, cancels, or declines a request
 * MUST call isTransitionAllowed before touching the repository.
 *
 * Mirrors the pattern of src/domain/orders/transitions.ts.
 *
 * Reference: SYSTEM.md §10.2 (allowed transitions), SYSTEM.md §5 (the Result
 * contract), DECISIONS.md D-5.2 (states), D-5.3 (guest cancel window),
 * D-5.4 (guest edit window), BUILD.md §5 (domain rules).
 */

import { RequestState } from "./request.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

/**
 * The canonical allowed request transitions per SYSTEM.md §10.2.
 */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<RequestState, readonly RequestState[]>
> = {
  [RequestState.SUBMITTED]: [
    RequestState.ACKNOWLEDGED,
    RequestState.CANCELLED,
    RequestState.DECLINED,
  ],
  [RequestState.ACKNOWLEDGED]: [
    RequestState.IN_PROGRESS,
    RequestState.CANCELLED,
    RequestState.DECLINED,
  ],
  [RequestState.IN_PROGRESS]: [
    RequestState.COMPLETED,
    RequestState.CANCELLED,
  ],
  [RequestState.COMPLETED]: [],
  [RequestState.CANCELLED]: [],
  [RequestState.DECLINED]: [],
};

/**
 * Validates whether a RequestState transition from -> to is allowed.
 *
 * @param from The current request state.
 * @param to The target request state.
 * @returns Result<true> with ok(true) if allowed, or fail(DomainErrorCode.INVALID_STATE) if forbidden.
 */
export function isTransitionAllowed(
  from: RequestState,
  to: RequestState
): Result<true> {
  const allowed = ALLOWED_TRANSITIONS[from];
  if (allowed && allowed.includes(to)) {
    return ok(true);
  }

  return fail(
    DomainErrorCode.INVALID_STATE,
    `Transition from '${from}' to '${to}' is not allowed`
  );
}

