/**
 * Guest session pure domain service.
 *
 * Implements creation, retrieval, and invalidation of guest sessions.
 * Pure domain logic — depends only on the GuestSessionRepository port and shared Result types.
 * No database, HTTP, or framework imports.
 *
 * Reference: SYSTEM.md §6.2 (The guest session), §8.3 (The resolution flow),
 * DECISIONS.md D-2.3, D-2.5, BUILD.md §2.9 (Boundary validation).
 */

import {
  type GuestSessionRepository,
  type GuestSession,
  type CreateGuestSessionInput,
  PlaceType,
} from "./guest-session.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GuestSessionDeps {
  readonly repo: GuestSessionRepository;
}

/**
 * Creates a new guest session for a resolved venue and place.
 *
 * Validates that venueId and placeId are non-empty strings and that placeType
 * is one of the valid PlaceType enum values before calling the repository.
 */
export async function createGuestSession(
  deps: GuestSessionDeps,
  input: CreateGuestSessionInput
): Promise<Result<GuestSession>> {
  if (
    !input.venueId ||
    typeof input.venueId !== "string" ||
    input.venueId.trim() === ""
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "venueId is required and must be non-empty"
    );
  }

  if (
    !input.placeId ||
    typeof input.placeId !== "string" ||
    input.placeId.trim() === ""
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "placeId is required and must be non-empty"
    );
  }

  if (
    input.placeType !== PlaceType.TABLE &&
    input.placeType !== PlaceType.ROOM &&
    input.placeType !== PlaceType.COUNTER
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Invalid placeType: '${String(input.placeType)}'`
    );
  }

  return deps.repo.create(input);
}

/**
 * Retrieves an active guest session by its opaque token.
 *
 * Validates that the token is a well-formed UUID.
 * Returns fail(UNAUTHORIZED) if the token is unknown or if the session has ended.
 */
export async function getGuestSession(
  deps: GuestSessionDeps,
  token: string
): Promise<Result<GuestSession>> {
  if (typeof token !== "string" || !UUID_REGEX.test(token)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Invalid token format");
  }

  const result = await deps.repo.findByToken(token);
  if (!result.ok) {
    return result;
  }

  const session = result.value;
  if (!session) {
    return fail(
      DomainErrorCode.UNAUTHORIZED,
      "Invalid or expired guest session"
    );
  }

  if (session.endedAt !== null) {
    return fail(DomainErrorCode.UNAUTHORIZED, "Guest session has ended");
  }

  return ok(session);
}

/**
 * Invalidates a guest session by its opaque token.
 *
 * Validates that the token is a well-formed UUID before delegating to the repository.
 */
export async function invalidateGuestSession(
  deps: GuestSessionDeps,
  token: string
): Promise<Result<void>> {
  if (typeof token !== "string" || !UUID_REGEX.test(token)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Invalid token format");
  }

  return deps.repo.invalidateByToken(token);
}
