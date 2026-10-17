/**
 * QR token generation domain function.
 *
 * Validates the place specification according to placeType (TABLE, ROOM, COUNTER)
 * and delegates token generation to the QrTokenRepository.
 *
 * Reference: SYSTEM.md §8.5 (The generation), SYSTEM.md §8.6 (The implementation contract),
 * DECISIONS.md D-16.2 (The QR implementation contract), BUILD.md §2.9 (Boundary validation).
 */

import {
  type QrToken,
  type QrTokenRepository,
  type GenerateTokenInput,
  PlaceType,
} from "./qr-token.repository";
import { type Result, fail, DomainErrorCode } from "@/domain/shared/result";

export interface GenerateTokenDeps {
  qrTokenRepo: QrTokenRepository;
}

/**
 * Generates a new active QR token for a venue place.
 *
 * Validates boundary inputs for the corresponding placeType and ensures the
 * designated place ID exists before calling the repository port.
 */
export async function generateToken(
  deps: GenerateTokenDeps,
  input: GenerateTokenInput
): Promise<Result<QrToken>> {
  if (!input || typeof input !== "object") {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Invalid place details for the given place type"
    );
  }

  if (
    !("venueId" in input) ||
    typeof (input as { venueId?: unknown }).venueId !== "string" ||
    !(input as { venueId: string }).venueId.trim()
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Invalid place details for the given place type"
    );
  }

  if (input.placeType === PlaceType.TABLE) {
    if (
      !("tableId" in input) ||
      typeof (input as { tableId?: unknown }).tableId !== "string" ||
      !(input as { tableId: string }).tableId.trim()
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Invalid place details for the given place type"
      );
    }
  } else if (input.placeType === PlaceType.ROOM) {
    if (
      !("roomId" in input) ||
      typeof (input as { roomId?: unknown }).roomId !== "string" ||
      !(input as { roomId: string }).roomId.trim()
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Invalid place details for the given place type"
      );
    }
  } else if (input.placeType === PlaceType.COUNTER) {
    if (
      !("counterId" in input) ||
      typeof (input as { counterId?: unknown }).counterId !== "string" ||
      !(input as { counterId: string }).counterId.trim()
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Invalid place details for the given place type"
      );
    }
  } else {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Invalid place details for the given place type"
    );
  }

  return deps.qrTokenRepo.generate(input);
}
