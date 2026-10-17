import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface EnforceSingleSessionDependencies {
  invalidateAllSessions: (staffMemberId: string) => Promise<number>;
}

/**
 * Enforces D-3.4: a staff member can only have one active session.
 * Invalidates all existing sessions for the given staff member.
 * 
 * This is called before creating a new session during login.
 */
export async function enforceSingleSession(
  deps: EnforceSingleSessionDependencies,
  staffMemberId: string
): Promise<Result<void>> {
  try {
    await deps.invalidateAllSessions(staffMemberId);
    return ok(undefined);
  } catch (error) {
    return fail(
      DomainErrorCode.INTERNAL,
      error instanceof Error ? error.message : "Failed to enforce single session"
    );
  }
}
