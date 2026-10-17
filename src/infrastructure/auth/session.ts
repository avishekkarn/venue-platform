/**
 * Staff session service.
 *
 * Implements server-side session management primitives: creation, validation,
 * individual session termination (logout), and bulk invalidation (password change).
 *
 * Reference: SYSTEM.md §6.3, SYSTEM.md §15.3, DECISIONS.md D-3.2, D-3.3, D-3.4,
 * BUILD.md §5, §7.4, §8.8.
 */

import { randomUUID } from "crypto";
import { createPrismaStaffSessionRepository } from "@/infrastructure/db/repositories/staff-session.repo";
import { DomainErrorCode } from "@/domain/shared/result";
import { type StaffSession } from "@/domain/auth/staff-session.repository";

export type DbClient = Parameters<typeof createPrismaStaffSessionRepository>[0];

/**
 * Creates a new session for a staff member.
 * Generates a secure random token via crypto.randomUUID().
 * If expiresAt is provided, the session expires. If not, it lasts until explicitly ended.
 */
export async function createSession(
  client: DbClient,
  staffMemberId: string,
  expiresAt?: Date
): Promise<StaffSession> {
  const repo = createPrismaStaffSessionRepository(client);
  const token = randomUUID();

  const result = await repo.create({
    staffMemberId,
    token,
    expiresAt,
  });

  if (!result.ok) {
    throw new Error(`Failed to create session: ${result.error.message}`);
  }
  return result.value;
}

/**
 * Validates a session by its token.
 * Returns the session if valid and not expired, otherwise throws or returns null.
 */
export async function validateSession(
  client: DbClient,
  token: string
): Promise<StaffSession | null> {
  const repo = createPrismaStaffSessionRepository(client);
  const result = await repo.findByToken(token);

  if (!result.ok) {
    if (result.error.code === DomainErrorCode.NOT_FOUND) return null;
    throw new Error(`Failed to find session: ${result.error.message}`);
  }

  const session = result.value;

  // Check if expired
  if (session.expiresAt && session.expiresAt < new Date()) {
    return null; // expired
  }

  // Check if already ended
  if (session.endedAt) {
    return null; // already ended
  }

  return session;
}

/**
 * Deletes a session by its ID. (Used for logout).
 */
export async function deleteSession(
  client: DbClient,
  sessionId: string
): Promise<void> {
  const repo = createPrismaStaffSessionRepository(client);
  const result = await repo.endById(sessionId);

  if (!result.ok && result.error.code !== DomainErrorCode.NOT_FOUND) {
    throw new Error(`Failed to end session: ${result.error.message}`);
  }
}

/**
 * Invalidates all sessions for a staff member. (Used on password change).
 * Returns the number of sessions ended.
 */
export async function invalidateAllSessions(
  client: DbClient,
  staffMemberId: string
): Promise<number> {
  const repo = createPrismaStaffSessionRepository(client);
  const result = await repo.endAllForStaff(staffMemberId);

  if (!result.ok) {
    throw new Error(`Failed to invalidate sessions: ${result.error.message}`);
  }
  return result.value;
}
