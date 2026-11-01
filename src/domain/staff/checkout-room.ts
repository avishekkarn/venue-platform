/**
 * Domain function: checkoutRoom
 *
 * Rules:
 * - Pure domain function: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Receives RoomRepository and GuestSessionRepository ports as dependencies.
 * - Enforces validation of inputs (venueId, roomId).
 * - Invalidates all active guest sessions for the given room.
 * - Sets the room status to RoomStatus.VACANT.
 * - Returns Result<void>.
 *
 * Reference: SYSTEM.md §2, SYSTEM.md §4 (staff / organization module),
 * SYSTEM.md §6.2, SYSTEM.md §11.1, BUILD.md §5.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type RoomRepository, RoomStatus } from "@/domain/organization/room.repository";
import { type GuestSessionRepository, PlaceType } from "@/domain/guest/guest-session.repository";
import { invalidateSessionsForPlace } from "@/domain/guest/guest-session.service";

export interface CheckoutRoomDeps {
  readonly roomRepo: RoomRepository;
  readonly guestRepo?: GuestSessionRepository;
  readonly guestSessionRepo?: GuestSessionRepository;
}

export interface CheckoutRoomRequest {
  readonly venueId: string;
  readonly roomId: string;
  readonly staffMemberId?: string | null;
}

export async function checkoutRoom(
  deps: CheckoutRoomDeps,
  input: CheckoutRoomRequest
): Promise<Result<void>>;
export async function checkoutRoom(
  params: CheckoutRoomDeps & CheckoutRoomRequest
): Promise<Result<void>>;
export async function checkoutRoom(
  depsOrParams: CheckoutRoomDeps | (CheckoutRoomDeps & CheckoutRoomRequest),
  maybeInput?: CheckoutRoomRequest
): Promise<Result<void>> {
  const deps: CheckoutRoomDeps = depsOrParams;
  const input: CheckoutRoomRequest = maybeInput ?? (depsOrParams as CheckoutRoomRequest);

  if (
    !input.venueId ||
    typeof input.venueId !== "string" ||
    input.venueId.trim() === ""
  ) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Venue ID is required");
  }

  if (
    !input.roomId ||
    typeof input.roomId !== "string" ||
    input.roomId.trim() === ""
  ) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Room ID is required");
  }

  const guestRepo = deps.guestRepo ?? deps.guestSessionRepo;
  if (!guestRepo) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Guest repository is required");
  }

  const invalidateResult = await invalidateSessionsForPlace(
    { repo: guestRepo },
    input.venueId,
    PlaceType.ROOM,
    input.roomId
  );
  if (!invalidateResult.ok) {
    return invalidateResult;
  }

  const statusResult = await deps.roomRepo.setStatus(
    input.venueId,
    input.roomId,
    RoomStatus.VACANT
  );
  if (!statusResult.ok) {
    return statusResult;
  }

  return ok(undefined);
}

