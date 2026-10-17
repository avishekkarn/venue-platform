/**
 * Staff session retrieval domain function.
 *
 * Validates a staff session token by delegating to the injected session service.
 *
 * Reference: SYSTEM.md §6.3 (Staff session — validated on every request),
 * SYSTEM.md §15.3, DECISIONS.md D-3.2, BUILD.md §5, §8.8.
 */

import { type StaffSession } from "@/domain/auth/staff-session.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface GetSessionDependencies {
  validateSession: (token: string) => Promise<StaffSession | null>;
}

/**
 * Validates a staff session by its token.
 *
 * Takes the raw token from the HTTP cookie, delegates validation to the
 * injected session service, and returns the StaffSession if valid.
 * Returns a generic UNAUTHORIZED failure if the token is invalid,
 * expired, or not found (SYSTEM.md §6.3).
 */
export async function getSession(
  deps: GetSessionDependencies,
  token: string
): Promise<Result<StaffSession>> {
  const session = await deps.validateSession(token);

  if (!session) {
    return fail(DomainErrorCode.UNAUTHORIZED, "Invalid or expired session");
  }

  return ok(session);
}
