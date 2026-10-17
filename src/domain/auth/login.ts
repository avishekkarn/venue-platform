/**
 * Staff login domain function.
 *
 * Authenticates a staff member against their venue-scoped username and password,
 * ensures they are active, terminates all previous sessions to enforce the
 * single-session-per-staff policy, and issues a new session token.
 *
 * Reference: SYSTEM.md §6.2, §6.3, §7, DECISIONS.md D-3.1, D-3.4, D-3.7,
 * BUILD.md §5, §7.4, §8.8.
 */

import {
  type StaffRepository,
  type StaffMember,
  StaffState,
} from "@/domain/auth/staff.repository";
import { type StaffSession } from "@/domain/auth/staff-session.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface LoginDependencies {
  staffRepo: StaffRepository;
  verifyPassword: (plain: string, hash: string) => Promise<boolean>;
  createSession: (staffMemberId: string) => Promise<StaffSession>;
  invalidateAllSessions: (staffMemberId: string) => Promise<number>;
}

export interface LoginInput {
  venueId: string;
  username: string;
  password: string;
}

export interface LoginSuccess {
  staff: StaffMember;
  sessionToken: string;
}

/**
 * Authenticates a staff member and creates a new session.
 *
 * Performs the following steps:
 * 1. Looks up the staff member by username.
 * 2. Verifies the password against the stored hash.
 * 3. Ensures the staff member is ACTIVE (D-3.7).
 * 4. Invalidates all existing sessions to enforce single-session policy (D-3.4).
 * 5. Creates a new session and returns the token.
 *
 * Returns a generic UNAUTHORIZED failure if the username doesn't exist,
 * the password is incorrect, or the staff member is deactivated (BUILD.md §7.4).
 */
export async function login(
  deps: LoginDependencies,
  input: LoginInput
): Promise<Result<LoginSuccess>> {
  // 1. Find staff member
  const staffResult = await deps.staffRepo.findByUsername(
    input.venueId,
    input.username
  );

  if (!staffResult.ok) {
    // If it's NOT_FOUND, return a generic UNAUTHORIZED to prevent enumeration.
    if (staffResult.error.code === DomainErrorCode.NOT_FOUND) {
      return fail(
        DomainErrorCode.UNAUTHORIZED,
        "Incorrect username or password"
      );
    }
    return staffResult; // Return other DB errors as-is
  }

  const staff = staffResult.value;

  // 2. Verify password
  const isPasswordValid = await deps.verifyPassword(
    input.password,
    staff.passwordHash
  );

  if (!isPasswordValid) {
    return fail(
      DomainErrorCode.UNAUTHORIZED,
      "Incorrect username or password"
    );
  }

  // 3. Check active state
  if (staff.state === StaffState.DEACTIVATED) {
    return fail(
      DomainErrorCode.UNAUTHORIZED,
      "Incorrect username or password"
    ); // Same message to prevent enumeration
  }

  // 4. Invalidate existing sessions
  await deps.invalidateAllSessions(staff.id);

  // 5. Create new session
  const session = await deps.createSession(staff.id);

  return ok({
    staff: {
      id: staff.id,
      venueId: staff.venueId,
      name: staff.name,
      username: staff.username,
      roles: staff.roles,
      state: staff.state,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    },
    sessionToken: session.token,
  });
}
