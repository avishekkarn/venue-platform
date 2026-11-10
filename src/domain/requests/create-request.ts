/**
 * Domain function: createRequest
 *
 * Implements authoritative service request creation for the QR-PROJECT hospitality platform:
 * 1. Validates the request inputs before any database or repository call.
 * 2. Enforces place validation:
 *    - Exactly one place must be specified: roomId, tableId, or counterId.
 *    - If placeType is provided, it must match the specified place ID:
 *      - PlaceType.TABLE requires tableId and no roomId or counterId.
 *      - PlaceType.ROOM requires roomId and no tableId or counterId.
 *      - PlaceType.COUNTER requires counterId and no tableId or roomId.
 *    - If placeType is omitted:
 *      - roomId -> inferred PlaceType.ROOM
 *      - tableId -> inferred PlaceType.TABLE
 *      - counterId -> inferred PlaceType.COUNTER
 * 3. The existing room-only call ({ venueId, roomId, serviceType, details }) remains fully valid.
 * 4. Assembles CreateServiceRequestInput and calls requestRepo.create.
 * 5. Propagates repository failures unchanged.
 *
 * Reference: SYSTEM.md §10, §11.1, DECISIONS.md D-5.1 to D-5.7, D-10.2.
 */

import {
  type ServiceRequest,
  type ServiceRequestRepository,
  type CreateServiceRequestInput,
  type ServiceRequestDetails,
  HotelService,
  PlaceType,
} from "./request.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface CreateRequestInput {
  readonly venueId: string;
  readonly placeType?: PlaceType | null;
  readonly roomId?: string | null;
  readonly tableId?: string | null;
  readonly counterId?: string | null;
  readonly guestSessionId?: string | null;
  readonly serviceType: HotelService;
  readonly details?: ServiceRequestDetails;
}

export interface CreateRequestDeps {
  readonly requestRepo: ServiceRequestRepository;
}

export async function createRequest(
  deps: CreateRequestDeps,
  input: CreateRequestInput
): Promise<Result<ServiceRequest>> {
  // 1. Validate venueId
  if (
    !input.venueId ||
    typeof input.venueId !== "string" ||
    input.venueId.trim() === ""
  ) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "venueId is required");
  }

  // 2. Validate serviceType
  if (
    !input.serviceType ||
    !Object.values(HotelService).includes(input.serviceType)
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Valid serviceType is required"
    );
  }

  // 3. Place validation: exactly one of roomId, tableId, counterId must be provided
  const hasRoom = Boolean(input.roomId && input.roomId.trim() !== "");
  const hasTable = Boolean(input.tableId && input.tableId.trim() !== "");
  const hasCounter = Boolean(input.counterId && input.counterId.trim() !== "");

  const placeCount =
    (hasRoom ? 1 : 0) + (hasTable ? 1 : 0) + (hasCounter ? 1 : 0);

  if (placeCount === 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Exactly one place (roomId, tableId, or counterId) must be specified"
    );
  }

  if (placeCount > 1) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Multiple places specified; exactly one of roomId, tableId, or counterId must be specified"
    );
  }

  // 4. Resolve placeType and validate consistency if specified
  let resolvedPlaceType: PlaceType;
  if (hasRoom) {
    if (input.placeType && input.placeType !== PlaceType.ROOM) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Mismatched placeType: expected ROOM for roomId, got ${input.placeType}`
      );
    }
    resolvedPlaceType = PlaceType.ROOM;
  } else if (hasTable) {
    if (input.placeType && input.placeType !== PlaceType.TABLE) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Mismatched placeType: expected TABLE for tableId, got ${input.placeType}`
      );
    }
    resolvedPlaceType = PlaceType.TABLE;
  } else {
    // hasCounter
    if (input.placeType && input.placeType !== PlaceType.COUNTER) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Mismatched placeType: expected COUNTER for counterId, got ${input.placeType}`
      );
    }
    resolvedPlaceType = PlaceType.COUNTER;
  }

  const repoInput: CreateServiceRequestInput = {
    venueId: input.venueId,
    placeType: resolvedPlaceType,
    roomId: hasRoom ? (input.roomId ?? null) : null,
    tableId: hasTable ? (input.tableId ?? null) : null,
    counterId: hasCounter ? (input.counterId ?? null) : null,
    guestSessionId: input.guestSessionId ?? null,
    serviceType: input.serviceType,
    details: input.details,
  };

  return deps.requestRepo.create(repoInput);
}

