/**
 * QR token revocation domain function.
 *
 * Validates that the input token is a well-formed UUID and delegates to
 * QrTokenRepository.revoke to mark the token as revoked.
 *
 * Reference: SYSTEM.md §8.4 (The revocation flow), SYSTEM.md §8.6 (The implementation contract),
 * DECISIONS.md D-16.2 (The QR implementation contract), BUILD.md §2.9 (Boundary validation).
 */

import { type QrTokenRepository } from "./qr-token.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface RevokeTokenDeps {
  qrTokenRepo: QrTokenRepository;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Revokes an active QR token.
 *
 * Validates boundary input ensuring the token is a valid UUID before
 * querying the repository. Returns fail(VALIDATION_FAILED) if the format is invalid.
 */
export async function revokeToken(
  deps: RevokeTokenDeps,
  token: string
): Promise<Result<void>> {
  if (typeof token !== "string" || !UUID_REGEX.test(token)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Invalid token format");
  }

  const result = await deps.qrTokenRepo.revoke(token);
  if (!result.ok) {
    return result;
  }

  return ok(undefined);
}
