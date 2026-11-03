/**
 * Domain function: advanceRequest
 *
 * Rules:
 * - Pure domain function: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Receives a ServiceRequestRepository port as a dependency and never imports the adapter.
 * - Enforces the RequestState transition table from SYSTEM.md §10.2 by calling
 *   isTransitionAllowed (authored in Task 7.5.2).
 * - Reads current request via requestRepo.findById; propagates failure unchanged.
 * - If transition is forbidden, returns fail(INVALID_STATE, ...) and never calls advanceState.
 * - Carries acting staffMemberId through to the adapter, which writes the RequestStateChange.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §10.1, §10.2, §10.3,
 * DECISIONS.md D-5.2, BUILD.md §5.
 */

import {
  type ServiceRequest,
  type ServiceRequestRepository,
  RequestState,
} from "./request.repository";
import { isTransitionAllowed } from "./transitions";
import { type Result } from "@/domain/shared/result";

export interface AdvanceRequestDeps {
  readonly requestRepo: ServiceRequestRepository;
}

export interface AdvanceRequestDomainInput {
  readonly venueId: string;
  readonly requestId: string;
  readonly toState: RequestState;
  readonly staffMemberId?: string | null;
}

/**
 * Advances a service request to a new state after validating that the transition is allowed.
 */
export async function advanceRequest(
  deps: AdvanceRequestDeps,
  input: AdvanceRequestDomainInput
): Promise<Result<ServiceRequest>> {
  const currentRequestResult = await deps.requestRepo.findById(
    input.venueId,
    input.requestId
  );
  if (!currentRequestResult.ok) {
    return currentRequestResult;
  }

  const transitionResult = isTransitionAllowed(
    currentRequestResult.value.state,
    input.toState
  );
  if (!transitionResult.ok) {
    return transitionResult;
  }

  return deps.requestRepo.advanceState({
    venueId: input.venueId,
    requestId: input.requestId,
    toState: input.toState,
    staffMemberId: input.staffMemberId ?? null,
  });
}

