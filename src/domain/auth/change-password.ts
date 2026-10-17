import { type StaffRepository } from "@/domain/auth/staff.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface ChangePasswordDependencies {
  staffRepo: StaffRepository;
  hashPassword: (plain: string) => Promise<string>;
  invalidateAllSessions: (staffMemberId: string) => Promise<number>;
}

export interface ChangePasswordInput {
  venueId: string;
  staffMemberId: string;
  newPlainPassword: string;
}

/**
 * Changes a staff member's password and invalidates all their existing sessions.
 * 
 * Enforces D-3.3: a password change invalidates all existing sessions immediately.
 * The sessions are invalidated *after* the new password hash is successfully saved.
 */
export async function changePassword(
  deps: ChangePasswordDependencies,
  input: ChangePasswordInput
): Promise<Result<void>> {
  // 1. Hash the new password
  let newHash: string;
  try {
    newHash = await deps.hashPassword(input.newPlainPassword);
  } catch {
    return fail(
      DomainErrorCode.INTERNAL,
      "Failed to hash password"
    );
  }

  // 2. Update the password hash in the database
  const updateResult = await deps.staffRepo.updatePasswordHash(
    input.venueId,
    input.staffMemberId,
    newHash
  );

  if (!updateResult.ok) {
    // If the staff member is not found, the repo returns NOT_FOUND.
    // Return the domain error as-is.
    return updateResult;
  }

  // 3. Invalidate all existing sessions (D-3.3)
  try {
    await deps.invalidateAllSessions(input.staffMemberId);
  } catch {
    // If session invalidation fails after the password was updated, this is an INTERNAL error.
    // The password change itself succeeded, but the security requirement (invalidation) failed.
    return fail(
      DomainErrorCode.INTERNAL,
      "Password changed but failed to invalidate sessions"
    );
  }

  return ok(undefined);
}
