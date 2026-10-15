/**
 * Prisma adapter for the StaffSessionRepository port.
 *
 * Requirements:
 * - Exports createPrismaStaffSessionRepository(client: DbClient).
 * - Only file in the auth module for sessions that imports @prisma/client.
 * - listActiveForStaff filters by endedAt: null at the database level.
 * - endById sets endedAt = now(); returns INVALID_STATE if already ended, NOT_FOUND if missing.
 * - endAllForStaff updates all active sessions for a staff member in one updateMany and returns count.
 * - Wraps Prisma errors into canonical DomainError values.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (auth module),
 * SYSTEM.md §6.3 (the staff session), SYSTEM.md §11.1 (Staff session entity),
 * DECISIONS.md D-3.2, D-3.3, D-3.4.
 */

import {
  type PrismaClient,
  type Prisma,
  type StaffSession as PrismaStaffSession,
} from "@prisma/client";
import {
  type StaffSessionRepository,
  type StaffSession,
  type CreateStaffSessionInput,
} from "@/domain/auth/staff-session.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapStaffSession(raw: PrismaStaffSession): StaffSession {
  return {
    id: raw.id,
    staffMemberId: raw.staffMemberId,
    token: raw.token,
    createdAt: raw.createdAt,
    expiresAt: raw.expiresAt,
    endedAt: raw.endedAt,
  };
}

export function createPrismaStaffSessionRepository(
  client: DbClient
): StaffSessionRepository {
  return {
    async findByToken(token: string): Promise<Result<StaffSession>> {
      try {
        const session = await client.staffSession.findUnique({
          where: { token },
        });

        if (!session) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Staff session with token '${token}' not found`
          );
        }

        return ok(mapStaffSession(session));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async listActiveForStaff(
      staffMemberId: string
    ): Promise<Result<StaffSession[]>> {
      try {
        const sessions = await client.staffSession.findMany({
          where: {
            staffMemberId,
            endedAt: null,
          },
          orderBy: { createdAt: "desc" },
        });

        return ok(sessions.map(mapStaffSession));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async create(
      input: CreateStaffSessionInput
    ): Promise<Result<StaffSession>> {
      try {
        const created = await client.staffSession.create({
          data: {
            staffMemberId: input.staffMemberId,
            token: input.token,
            expiresAt: input.expiresAt,
          },
        });

        return ok(mapStaffSession(created));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async endById(id: string): Promise<Result<StaffSession>> {
      try {
        const existing = await client.staffSession.findUnique({
          where: { id },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Staff session with id '${id}' not found`
          );
        }

        if (existing.endedAt !== null) {
          return fail(
            DomainErrorCode.INVALID_STATE,
            `Staff session with id '${id}' is already ended`
          );
        }

        const updated = await client.staffSession.update({
          where: { id },
          data: {
            endedAt: new Date(),
          },
        });

        return ok(mapStaffSession(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async endAllForStaff(staffMemberId: string): Promise<Result<number>> {
      try {
        const result = await client.staffSession.updateMany({
          where: {
            staffMemberId,
            endedAt: null,
          },
          data: {
            endedAt: new Date(),
          },
        });

        return ok(result.count);
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}
