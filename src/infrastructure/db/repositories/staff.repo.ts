/**
 * Prisma adapter for the StaffRepository port.
 *
 * Requirements:
 * - Exports createPrismaStaffRepository(client: DbClient).
 * - Only file in the auth module for staff that imports @prisma/client.
 * - Enforces venue isolation on every query (DECISIONS.md D-10.2).
 * - Maps roles via an explicit bidirectional lookup table, not a type cast.
 * - findById and general reads return the public StaffMember shape (omitting passwordHash).
 * - findByUsername returns StaffMemberWithCredentials (including passwordHash).
 * - Wraps Prisma errors into canonical DomainError values (NOT_FOUND, CONFLICT, INTERNAL).
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (auth module),
 * SYSTEM.md §7 (role model), SYSTEM.md §11.1 (StaffMember entity),
 * SYSTEM.md §15.3 (least privilege for secrets), DECISIONS.md D-3.1 through D-3.8.
 */

import {
  type PrismaClient,
  type Prisma,
  type StaffMember as PrismaStaffMember,
  StaffRole as PrismaStaffRole,
  StaffState as PrismaStaffState,
} from "@prisma/client";
import {
  type StaffRepository,
  type StaffMember,
  type StaffMemberWithCredentials,
  type CreateStaffInput,
  type ListStaffFilter,
  StaffRole,
  StaffState,
} from "@/domain/auth/staff.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

const PRISMA_TO_DOMAIN_ROLE: Record<PrismaStaffRole, StaffRole> = {
  [PrismaStaffRole.OWNER]: StaffRole.OWNER,
  [PrismaStaffRole.MANAGER]: StaffRole.MANAGER,
  [PrismaStaffRole.CHEF]: StaffRole.CHEF,
  [PrismaStaffRole.TABLE_SERVICE]: StaffRole.TABLE_SERVICE,
  [PrismaStaffRole.ROOM_SERVICE]: StaffRole.ROOM_SERVICE,
  [PrismaStaffRole.HOUSEKEEPING]: StaffRole.HOUSEKEEPING,
  [PrismaStaffRole.MAINTENANCE]: StaffRole.MAINTENANCE,
  [PrismaStaffRole.CONCIERGE]: StaffRole.CONCIERGE,
  [PrismaStaffRole.LAUNDRY]: StaffRole.LAUNDRY,
  [PrismaStaffRole.SPA]: StaffRole.SPA,
  [PrismaStaffRole.FRONT_DESK]: StaffRole.FRONT_DESK,
};

const DOMAIN_TO_PRISMA_ROLE: Record<StaffRole, PrismaStaffRole> = {
  [StaffRole.OWNER]: PrismaStaffRole.OWNER,
  [StaffRole.MANAGER]: PrismaStaffRole.MANAGER,
  [StaffRole.CHEF]: PrismaStaffRole.CHEF,
  [StaffRole.TABLE_SERVICE]: PrismaStaffRole.TABLE_SERVICE,
  [StaffRole.ROOM_SERVICE]: PrismaStaffRole.ROOM_SERVICE,
  [StaffRole.HOUSEKEEPING]: PrismaStaffRole.HOUSEKEEPING,
  [StaffRole.MAINTENANCE]: PrismaStaffRole.MAINTENANCE,
  [StaffRole.CONCIERGE]: PrismaStaffRole.CONCIERGE,
  [StaffRole.LAUNDRY]: PrismaStaffRole.LAUNDRY,
  [StaffRole.SPA]: PrismaStaffRole.SPA,
  [StaffRole.FRONT_DESK]: PrismaStaffRole.FRONT_DESK,
};

function mapStaffMember(raw: PrismaStaffMember): StaffMember {
  return {
    id: raw.id,
    venueId: raw.venueId,
    name: raw.name,
    username: raw.username,
    roles: raw.roles.map((r) => PRISMA_TO_DOMAIN_ROLE[r]),
    state: raw.state as StaffState,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapStaffMemberWithCredentials(
  raw: PrismaStaffMember
): StaffMemberWithCredentials {
  return {
    ...mapStaffMember(raw),
    passwordHash: raw.passwordHash,
  };
}

export function createPrismaStaffRepository(
  client: DbClient
): StaffRepository {
  return {
    async findById(venueId: string, id: string): Promise<Result<StaffMember>> {
      try {
        const staff = await client.staffMember.findFirst({
          where: { id, venueId },
        });

        if (!staff) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Staff member with id '${id}' not found in venue '${venueId}'`
          );
        }

        return ok(mapStaffMember(staff));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async findByUsername(
      venueId: string,
      username: string
    ): Promise<Result<StaffMemberWithCredentials>> {
      try {
        const staff = await client.staffMember.findUnique({
          where: {
            venueId_username: {
              venueId,
              username,
            },
          },
        });

        if (!staff) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Staff member '${username}' not found in venue '${venueId}'`
          );
        }

        return ok(mapStaffMemberWithCredentials(staff));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async listForVenue(
      venueId: string,
      filter?: ListStaffFilter
    ): Promise<Result<StaffMember[]>> {
      try {
        const staffList = await client.staffMember.findMany({
          where: {
            venueId,
            state: filter?.state
              ? (filter.state as unknown as PrismaStaffState)
              : undefined,
          },
          orderBy: { name: "asc" },
        });

        return ok(staffList.map(mapStaffMember));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async create(input: CreateStaffInput): Promise<Result<StaffMember>> {
      try {
        const created = await client.staffMember.create({
          data: {
            venueId: input.venueId,
            name: input.name,
            username: input.username,
            passwordHash: input.passwordHash,
            roles: input.roles.map((r) => DOMAIN_TO_PRISMA_ROLE[r]),
            state: PrismaStaffState.ACTIVE,
          },
        });

        return ok(mapStaffMember(created));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Staff member with username '${input.username}' already exists in venue '${input.venueId}'`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async updatePasswordHash(
      venueId: string,
      id: string,
      hash: string
    ): Promise<Result<StaffMember>> {
      try {
        const existing = await client.staffMember.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Staff member with id '${id}' not found in venue '${venueId}'`
          );
        }

        const updated = await client.staffMember.update({
          where: { id },
          data: {
            passwordHash: hash,
          },
        });

        return ok(mapStaffMember(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async setState(
      venueId: string,
      id: string,
      state: StaffState
    ): Promise<Result<StaffMember>> {
      try {
        const existing = await client.staffMember.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Staff member with id '${id}' not found in venue '${venueId}'`
          );
        }

        const updated = await client.staffMember.update({
          where: { id },
          data: {
            state: state as unknown as PrismaStaffState,
          },
        });

        return ok(mapStaffMember(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}
