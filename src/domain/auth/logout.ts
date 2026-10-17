/**
 * Staff logout domain function.
 *
 * Ends a staff session by delegating deletion to the session service.
 * Per DECISIONS.md D-3.2, staff sessions stay active until explicitly logged out.
 *
 * Reference: SYSTEM.md §6.3, DECISIONS.md D-3.2, BUILD.md §5, §8.8.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface LogoutDependencies {
  deleteSession: (sessionId: string) => Promise<void>;
}

/**
 * Ends a staff session.
 *
 * Per D-3.2, the session stays active until explicitly logged out.
 * This function delegates the deletion to the session service.
 *
 * @returns Result<void> indicating success or failure.
 */
export async function logout(
  deps: LogoutDependencies,
  sessionId: string
): Promise<Result<void>> {
  try {
    await deps.deleteSession(sessionId);
    return ok(undefined);
  } catch (error) {
    // If the underlying service throws (e.g., DB error), wrap it in an INTERNAL failure.
    // Note: The session service's deleteSession already ignores NOT_FOUND for idempotency,
    // so a throw here indicates a genuine infrastructure failure.
    return fail(
      DomainErrorCode.INTERNAL,
      error instanceof Error ? error.message : "Failed to log out"
    );
  }
}
