/**
 * Domain function: declineRequest
 *
 * Rules:
 * - Pure domain function: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Enforces the D-5.2 transition table via isTransitionAllowed: DECLINED is
 *   reachable only from SUBMITTED and ACKNOWLEDGED. Any other state fails with
 *   INVALID_STATE.
 * - Enforces that a decline reason is required (declines must be traceable).
 * - Carries acting staffMemberId through to the adapter.
 *
 * Reference: SYSTEM.md §10.1, §10.2, §10.3, DECISIONS.md D-5.2, D-5.6, BUILD.md §5.
 */

import {
  type ServiceRequest,
  type ServiceRequestRepository,
  RequestState,
} from "./request.repository";
import { isTransitionAllowed } from "./transitions";
import { type Result, fail, DomainErrorCode } from "@/domain/shared/result";

export interface DeclineRequestDeps {
  readonly requestRepo: ServiceRequestRepository;
}

export interface DeclineRequestDomainInput {
  readonly venueId: string;
  readonly requestId: string;
  readonly reason: string;
  readonly staffMemberId?: string | null;
}

/**
 * Declines a service request after validating the transition and the reason.
 */
export async function declineRequest(
  deps: DeclineRequestDeps,
  input: DeclineRequestDomainInput
): Promise<Result<ServiceRequest>> {
  // 1. Reason validation (D-5.6: declines must be traceable)
  if (
    !input.reason ||
    typeof input.reason !== "string" ||
    input.reason.trim() === ""
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Decline reason is required"
    );
  }

  // 2. Fetch the current request
  const currentRequestResult = await deps.requestRepo.findById(
    input.venueId,
    input.requestId
  );
  if (!currentRequestResult.ok) {
    return currentRequestResult;
  }

  // 3. Transition validation (DECLINED is reachable only from SUBMITTED, ACKNOWLEDGED)
  const transitionResult = isTransitionAllowed(
    currentRequestResult.value.state,
    RequestState.DECLINED
  );
  if (!transitionResult.ok) {
    return transitionResult;
  }

  // 4. Delegate to the repository
  return deps.requestRepo.decline({
    venueId: input.venueId,
    requestId: input.requestId,
    reason: input.reason.trim(),
    staffMemberId: input.staffMemberId ?? null,
  });
}

