/**
 * Domain function: editRequest
 *
 * Rules:
 * - Pure domain function: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Enforces D-5.4: a request may be edited only while it is SUBMITTED. Once
 *   ACKNOWLEDGED or beyond, the guest must cancel and submit a new request.
 * - Delegates to requestRepo.updateDetails, which rewrites the detailsJson.
 * - Does not change the request's state (edit is not a transition).
 *
 * Reference: SYSTEM.md §10.1, §10.3, DECISIONS.md D-5.3, D-5.4, BUILD.md §5.
 */

import {
  type ServiceRequest,
  type ServiceRequestRepository,
  type ServiceRequestDetails,
  RequestState,
} from "./request.repository";
import { type Result, fail, DomainErrorCode } from "@/domain/shared/result";

export interface EditRequestDeps {
  readonly requestRepo: ServiceRequestRepository;
}

export interface EditRequestDomainInput {
  readonly venueId: string;
  readonly requestId: string;
  readonly details: ServiceRequestDetails;
}

/**
 * Edits a service request's details while it is still in the SUBMITTED state (D-5.4).
 */
export async function editRequest(
  deps: EditRequestDeps,
  input: EditRequestDomainInput
): Promise<Result<ServiceRequest>> {
  // 1. Fetch the current request
  const currentRequestResult = await deps.requestRepo.findById(
    input.venueId,
    input.requestId
  );
  if (!currentRequestResult.ok) {
    return currentRequestResult;
  }

  // 2. D-5.4: edit is allowed only while SUBMITTED
  if (currentRequestResult.value.state !== RequestState.SUBMITTED) {
    return fail(
      DomainErrorCode.INVALID_STATE,
      "A request can be edited only while it is Submitted"
    );
  }

  // 3. Delegate to the repository
  return deps.requestRepo.updateDetails(
    input.venueId,
    input.requestId,
    input.details
  );
}

