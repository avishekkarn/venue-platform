/**
 * Prisma adapter for the TableRepository port.
 *
 * Requirements:
 * - Exports createPrismaTableRepository().
 * - Only file in the organization module for tables that imports @prisma/client.
 * - Enforces venue isolation on every operation (DECISIONS.md D-10.2).
 * - Wraps Prisma database errors into canonical DomainError values.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (organization module),
 * SYSTEM.md §11.1 (the Table entity), DECISIONS.md D-10.2.
 */

import { type PrismaClient, type Prisma, type Table as PrismaTable, TableState as PrismaTableState } from "@prisma/client";
import { prisma as defaultPrisma } from "@/infrastructure/db/client";
import {
  type TableRepository,
  type Table,
  type CreateTableInput,
  TableState,
} from "@/domain/organization/table.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapTable(raw: PrismaTable): Table {
  return {
    id: raw.id,
    venueId: raw.venueId,
    number: raw.number,
    state: raw.state as TableState,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function createPrismaTableRepository(
  client: DbClient = defaultPrisma
): TableRepository {
  return {
    async findById(venueId: string, id: string): Promise<Result<Table>> {
      try {
        const table = await client.table.findFirst({
          where: { id, venueId },
        });

        if (!table) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Table with id '${id}' not found in venue '${venueId}'`
          );
        }

        return ok(mapTable(table));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async findByNumber(venueId: string, number: string): Promise<Result<Table>> {
      try {
        const table = await client.table.findUnique({
          where: {
            venueId_number: {
              venueId,
              number,
            },
          },
        });

        if (!table) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Table '${number}' not found in venue '${venueId}'`
          );
        }

        return ok(mapTable(table));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async listForVenue(venueId: string): Promise<Result<Table[]>> {
      try {
        const tables = await client.table.findMany({
          where: { venueId },
          orderBy: { number: "asc" },
        });

        return ok(tables.map(mapTable));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async create(venueId: string, input: CreateTableInput): Promise<Result<Table>> {
      try {
        const table = await client.table.create({
          data: {
            venueId,
            number: input.number,
            state: input.state ? (input.state as unknown as PrismaTableState) : undefined,
          },
        });

        return ok(mapTable(table));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Table '${input.number}' already exists in venue '${venueId}'`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async setState(
      venueId: string,
      id: string,
      state: TableState
    ): Promise<Result<Table>> {
      try {
        const existing = await client.table.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Table with id '${id}' not found in venue '${venueId}'`
          );
        }

        const updated = await client.table.update({
          where: { id },
          data: {
            state: state as unknown as PrismaTableState,
          },
        });

        return ok(mapTable(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}
