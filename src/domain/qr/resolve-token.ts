/**
 * QR token resolution domain function.
 *
 * Validates that the input token is a well-formed UUID and delegates to
 * QrTokenRepository.resolve to retrieve the active place context.
 *
 * Reference: SYSTEM.md §8.3 (The resolution flow), SYSTEM.md §8.6 (The implementation contract),
 * DECISIONS.md D-16.2 (The QR implementation contract), BUILD.md §2.9 (Boundary validation).
 */

import {
  type QrTokenRepository,
  type ResolvedQrContext,
} from "./qr-token.repository";
import { type Result, fail, DomainErrorCode } from "@/domain/shared/result";

export interface ResolveTokenDeps {
  qrTokenRepo: QrTokenRepository;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves an opaque QR token string into a place context.
 *
 * Validates boundary input ensuring the token is a valid UUID before
 * querying the repository. Returns fail(VALIDATION_FAILED) if the format is invalid.
 */
export async function resolveToken(
  deps: ResolveTokenDeps,
  token: string
): Promise<Result<ResolvedQrContext>> {
  if (typeof token !== "string" || !UUID_REGEX.test(token)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Invalid token format");
  }

  return deps.qrTokenRepo.resolve(token);
}
