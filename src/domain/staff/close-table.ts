/**
 * Domain function: closeTable
 *
 * Rules:
 * - Pure domain function: zero dependencies on Prisma, React, HTTP, or Next.js.
 * - Receives TableRepository and GuestSessionRepository ports as dependencies.
 * - Enforces validation of inputs (venueId, tableId).
 * - Invalidates all active guest sessions for the given table.
 * - Sets the table status to TableStatus.FREE.
 * - Returns Result<void>.
 *
 * Reference: SYSTEM.md §2, SYSTEM.md §4 (staff / organization module),
 * SYSTEM.md §6.2, SYSTEM.md §11.1, BUILD.md §5.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type TableRepository, TableStatus } from "@/domain/organization/table.repository";
import { type GuestSessionRepository, PlaceType } from "@/domain/guest/guest-session.repository";
import { invalidateSessionsForPlace } from "@/domain/guest/guest-session.service";

export interface CloseTableDeps {
  readonly tableRepo: TableRepository;
  readonly guestRepo?: GuestSessionRepository;
  readonly guestSessionRepo?: GuestSessionRepository;
}

export interface CloseTableRequest {
  readonly venueId: string;
  readonly tableId: string;
  readonly staffMemberId?: string | null;
}

export async function closeTable(
  deps: CloseTableDeps,
  input: CloseTableRequest
): Promise<Result<void>>;
export async function closeTable(
  params: CloseTableDeps & CloseTableRequest
): Promise<Result<void>>;
export async function closeTable(
  depsOrParams: CloseTableDeps | (CloseTableDeps & CloseTableRequest),
  maybeInput?: CloseTableRequest
): Promise<Result<void>> {
  const deps: CloseTableDeps = depsOrParams;
  const input: CloseTableRequest = maybeInput ?? (depsOrParams as CloseTableRequest);

  if (
    !input.venueId ||
    typeof input.venueId !== "string" ||
    input.venueId.trim() === ""
  ) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Venue ID is required");
  }

  if (
    !input.tableId ||
    typeof input.tableId !== "string" ||
    input.tableId.trim() === ""
  ) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Table ID is required");
  }

  const guestRepo = deps.guestRepo ?? deps.guestSessionRepo;
  if (!guestRepo) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Guest repository is required");
  }

  const invalidateResult = await invalidateSessionsForPlace(
    { repo: guestRepo },
    input.venueId,
    PlaceType.TABLE,
    input.tableId
  );
  if (!invalidateResult.ok) {
    return invalidateResult;
  }

  const statusResult = await deps.tableRepo.setStatus(
    input.venueId,
    input.tableId,
    TableStatus.FREE
  );
  if (!statusResult.ok) {
    return statusResult;
  }

  return ok(undefined);
}

