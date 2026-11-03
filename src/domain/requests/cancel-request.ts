/**
 * Domain function: cancelRequest
 *
 * Rules:
 * - Pure domain function: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Enforces the D-5.3 rule: a guest can cancel only while the request is SUBMITTED;
 *   staff can cancel from any non-terminal state.
 * - Enforces the D-5.4-adjacent rule that a reason is required.
 * - Enforces the RequestState transition table via isTransitionAllowed.
 * - Carries acting staffMemberId through to the adapter when the actor is staff.
 *
 * Reference: SYSTEM.md §2, §10.1, §10.2, §10.3, DECISIONS.md D-5.2, D-5.3, D-5.4,
 * BUILD.md §5.
 */

import {
  type ServiceRequest,
  type ServiceRequestRepository,
  RequestState,
} from "./request.repository";
import { isTransitionAllowed } from "./transitions";
import { type Result, fail, DomainErrorCode } from "@/domain/shared/result";

export interface CancelRequestDeps {
  readonly requestRepo: ServiceRequestRepository;
}

export interface CancelRequestDomainInput {
  readonly venueId: string;
  readonly requestId: string;
  readonly reason: string;
  readonly by: "guest" | "staff";
  readonly staffMemberId?: string | null;
}

/**
 * Cancels a service request after validating the transition and the actor's authority.
 */
export async function cancelRequest(
  deps: CancelRequestDeps,
  input: CancelRequestDomainInput
): Promise<Result<ServiceRequest>> {
  // 1. Reason validation (D-5.3: cancellation must be traceable)
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

  // 2. Fetch the current request
  const currentRequestResult = await deps.requestRepo.findById(
    input.venueId,
    input.requestId
  );
  if (!currentRequestResult.ok) {
    return currentRequestResult;
  }

  // 3. D-5.3: guest can cancel only while SUBMITTED
  if (input.by === "guest" && currentRequestResult.value.state !== RequestState.SUBMITTED) {
    return fail(
      DomainErrorCode.INVALID_STATE,
      "A guest may cancel a request only while it is Submitted"
    );
  }

  // 4. Transition validation (covers staff path and terminal states)
  const transitionResult = isTransitionAllowed(
    currentRequestResult.value.state,
    RequestState.CANCELLED
  );
  if (!transitionResult.ok) {
    return transitionResult;
  }

  // 5. Delegate to the repository
  return deps.requestRepo.cancel({
    venueId: input.venueId,
    requestId: input.requestId,
    reason: input.reason.trim(),
    staffMemberId:
      input.by === "staff" ? (input.staffMemberId ?? null) : null,
  });
}

