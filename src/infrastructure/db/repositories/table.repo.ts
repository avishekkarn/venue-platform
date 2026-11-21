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

import {
  type PrismaClient,
  type Prisma,
  type Table as PrismaTable,
  type TableCategory as PrismaTableCategory,
  TableState as PrismaTableState,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/infrastructure/db/client";
import {
  type TableRepository,
  type Table,
  type TableView,
  type TableCategory,
  type CreateTableInput,
  type UpdateTableInput,
  type CreateTableCategoryInput,
  type UpdateTableCategoryInput,
  TableState,
} from "@/domain/organization/table.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapTableCategory(raw: PrismaTableCategory): TableCategory {
  return {
    id: raw.id,
    venueId: raw.venueId,
    name: raw.name,
    description: raw.description,
    isReserved: raw.isReserved,
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapTable(raw: PrismaTable): Table {
  return {
    id: raw.id,
    venueId: raw.venueId,
    categoryId: raw.categoryId ?? null,
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

    async listTablesWithDetails(venueId: string): Promise<Result<TableView[]>> {
      try {
        const tables = await client.table.findMany({
          where: { venueId },
          include: {
            category: true,
          },
          orderBy: { number: "asc" },
        });

        const activeSessions = await client.guestSession.findMany({
          where: {
            venueId,
            tableId: { in: tables.map((t) => t.id) },
            endedAt: null,
          },
          include: {
            orders: {
              select: {
                total: true,
              },
            },
          },
        });

        const activeSessionByTableId = new Map(
          activeSessions.map((s) => {
            const ordersCount = s.orders.length;
            const totalAmount = s.orders
              .reduce((acc, o) => acc + Number(o.total), 0)
              .toFixed(2);
            return [
              s.tableId!,
              {
                id: s.id,
                startedAt: s.createdAt,
                ordersCount,
                totalAmount,
              },
            ];
          })
        );

        const views: TableView[] = tables.map((t) => ({
          ...mapTable(t),
          category: t.category ? mapTableCategory(t.category) : null,
          activeSession: activeSessionByTableId.get(t.id) ?? null,
        }));

        return ok(views);
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
            categoryId: input.categoryId ?? undefined,
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

    async update(
      venueId: string,
      id: string,
      input: UpdateTableInput
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

        // If changing state away from OCCUPIED, check if there's an active session
        if (
          input.state !== undefined &&
          input.state !== TableState.OCCUPIED &&
          existing.state === TableState.OCCUPIED
        ) {
          const activeSession = await client.guestSession.findFirst({
            where: { venueId, tableId: id, endedAt: null },
          });
          if (activeSession) {
            return fail(
              DomainErrorCode.CONFLICT,
              "Cannot change state of table with an active session. End the session first."
            );
          }
        }

        const updated = await client.table.update({
          where: { id },
          data: {
            number: input.number,
            categoryId: input.categoryId,
            state: input.state ? (input.state as unknown as PrismaTableState) : undefined,
          },
        });

        return ok(mapTable(updated));
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

    async delete(venueId: string, id: string): Promise<Result<void>> {
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

        const activeSession = await client.guestSession.findFirst({
          where: { venueId, tableId: id, endedAt: null },
        });

        if (activeSession) {
          return fail(
            DomainErrorCode.CONFLICT,
            "Cannot delete table with an active session"
          );
        }

        await client.table.delete({
          where: { id },
        });

        return ok(undefined);
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async endSession(venueId: string, id: string): Promise<Result<void>> {
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

        const activeSessions = await client.guestSession.findMany({
          where: { venueId, tableId: id, endedAt: null },
        });

        for (const s of activeSessions) {
          await client.guestSession.update({
            where: { id: s.id },
            data: { endedAt: new Date() },
          });
        }

        await client.serviceRequest.updateMany({
          where: {
            venueId,
            tableId: id,
            state: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] },
          },
          data: { state: "CANCELLED" },
        });

        await client.table.update({
          where: { id },
          data: { state: PrismaTableState.FREE },
        });

        return ok(undefined);
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

    async setStatus(
      venueId: string,
      tableId: string,
      status: TableState
    ): Promise<Result<void>> {
      try {
        const existing = await client.table.findFirst({
          where: { id: tableId, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Table with id '${tableId}' not found in venue '${venueId}'`
          );
        }

        await client.table.update({
          where: { id: tableId },
          data: {
            state: status as unknown as PrismaTableState,
          },
        });

        return ok(undefined);
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    // Categories
    async listCategories(venueId: string): Promise<Result<TableCategory[]>> {
      try {
        const categories = await client.tableCategory.findMany({
          where: { venueId },
          orderBy: { sortOrder: "asc" },
        });

        return ok(categories.map(mapTableCategory));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async findCategoryById(
      venueId: string,
      id: string
    ): Promise<Result<TableCategory>> {
      try {
        const category = await client.tableCategory.findFirst({
          where: { id, venueId },
        });

        if (!category) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Table category with id '${id}' not found in venue '${venueId}'`
          );
        }

        return ok(mapTableCategory(category));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async createCategory(
      venueId: string,
      input: CreateTableCategoryInput
    ): Promise<Result<TableCategory>> {
      try {
        const category = await client.tableCategory.create({
          data: {
            venueId,
            name: input.name,
            description: input.description,
            isReserved: input.isReserved ?? false,
            sortOrder: input.sortOrder ?? 0,
          },
        });

        return ok(mapTableCategory(category));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Table category '${input.name}' already exists in venue '${venueId}'`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async updateCategory(
      venueId: string,
      id: string,
      input: UpdateTableCategoryInput
    ): Promise<Result<TableCategory>> {
      try {
        const existing = await client.tableCategory.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Table category with id '${id}' not found in venue '${venueId}'`
          );
        }

        const updated = await client.tableCategory.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
            isReserved: input.isReserved,
            sortOrder: input.sortOrder,
          },
        });

        return ok(mapTableCategory(updated));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Table category '${input.name}' already exists in venue '${venueId}'`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async deleteCategory(venueId: string, id: string): Promise<Result<void>> {
      try {
        const existing = await client.tableCategory.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Table category with id '${id}' not found in venue '${venueId}'`
          );
        }

        await client.tableCategory.delete({
          where: { id },
        });

        return ok(undefined);
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}
