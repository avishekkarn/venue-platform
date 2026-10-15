/**
 * Prisma adapter for the RoomRepository port.
 *
 * Requirements:
 * - Exports createPrismaRoomRepository().
 * - Only file in the organization module for rooms that imports @prisma/client.
 * - Enforces venue isolation on every operation (DECISIONS.md D-10.2).
 * - Wraps Prisma database errors into canonical DomainError values.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (organization module),
 * SYSTEM.md §11.1 (the Room entity), DECISIONS.md D-10.2.
 */

import { type PrismaClient, type Prisma, type Room as PrismaRoom, RoomState as PrismaRoomState } from "@prisma/client";
import { prisma as defaultPrisma } from "@/infrastructure/db/client";
import {
  type RoomRepository,
  type Room,
  type CreateRoomInput,
  RoomState,
} from "@/domain/organization/room.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapRoom(raw: PrismaRoom): Room {
  return {
    id: raw.id,
    venueId: raw.venueId,
    number: raw.number,
    state: raw.state as RoomState,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export function createPrismaRoomRepository(
  client: DbClient = defaultPrisma
): RoomRepository {
  return {
    async findById(venueId: string, id: string): Promise<Result<Room>> {
      try {
        const room = await client.room.findFirst({
          where: { id, venueId },
        });

        if (!room) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room with id '${id}' not found in venue '${venueId}'`
          );
        }

        return ok(mapRoom(room));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async findByNumber(venueId: string, number: string): Promise<Result<Room>> {
      try {
        const room = await client.room.findUnique({
          where: {
            venueId_number: {
              venueId,
              number,
            },
          },
        });

        if (!room) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room '${number}' not found in venue '${venueId}'`
          );
        }

        return ok(mapRoom(room));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async listForVenue(venueId: string): Promise<Result<Room[]>> {
      try {
        const rooms = await client.room.findMany({
          where: { venueId },
          orderBy: { number: "asc" },
        });

        return ok(rooms.map(mapRoom));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async create(venueId: string, input: CreateRoomInput): Promise<Result<Room>> {
      try {
        const room = await client.room.create({
          data: {
            venueId,
            number: input.number,
            state: input.state ? (input.state as unknown as PrismaRoomState) : undefined,
          },
        });

        return ok(mapRoom(room));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Room '${input.number}' already exists in venue '${venueId}'`
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
      state: RoomState
    ): Promise<Result<Room>> {
      try {
        const existing = await client.room.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room with id '${id}' not found in venue '${venueId}'`
          );
        }

        const updated = await client.room.update({
          where: { id },
          data: {
            state: state as unknown as PrismaRoomState,
          },
        });

        return ok(mapRoom(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}
