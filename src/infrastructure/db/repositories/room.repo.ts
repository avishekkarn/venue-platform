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

import {
  type PrismaClient,
  Prisma,
  type Room as PrismaRoom,
  type RoomCategory as PrismaRoomCategory,
  RoomState as PrismaRoomState,
} from "@prisma/client";
import { prisma as defaultPrisma } from "@/infrastructure/db/client";
import {
  type RoomRepository,
  type Room,
  type RoomCategory,
  type RoomView,
  type CreateRoomInput,
  type UpdateRoomInput,
  type CreateRoomCategoryInput,
  type UpdateRoomCategoryInput,
  RoomState,
} from "@/domain/organization/room.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapRoom(raw: PrismaRoom): Room {
  return {
    id: raw.id,
    venueId: raw.venueId,
    categoryId: raw.categoryId ?? null,
    number: raw.number,
    state: raw.state as RoomState,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapRoomCategory(raw: PrismaRoomCategory): RoomCategory {
  return {
    id: raw.id,
    venueId: raw.venueId,
    name: raw.name,
    description: raw.description,
    basePrice: raw.basePrice.toFixed(2),
    sortOrder: raw.sortOrder,
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

    async listRoomsWithDetails(venueId: string): Promise<Result<RoomView[]>> {
      try {
        const rooms = await client.room.findMany({
          where: { venueId },
          include: {
            category: true,
          },
          orderBy: { number: "asc" },
        });

        const activeSessions = await client.guestSession.findMany({
          where: {
            venueId,
            roomId: { in: rooms.map((r) => r.id) },
            endedAt: null,
          },
          include: {
            orders: {
              select: {
                total: true,
              },
            },
            serviceRequests: {
              select: {
                serviceType: true,
                state: true,
                serviceItem: {
                  select: {
                    price: true,
                  },
                },
              },
            },
          },
        });

        const activeSessionByRoomId = new Map(
          activeSessions.map((s) => {
            const ordersCount = s.orders.length;
            const requestsCount = s.serviceRequests.length;
            const ordersTotal = s.orders.reduce(
              (acc, o) => acc + Number(o.total),
              0
            );
            const requestsTotal = s.serviceRequests.reduce(
              (acc, r) =>
                acc + (r.serviceItem?.price ? Number(r.serviceItem.price) : 0),
              0
            );

            const matchedRoom = rooms.find((r) => r.id === s.roomId);
            const roomRateNum = matchedRoom?.category
              ? Number(matchedRoom.category.basePrice)
              : 0;

            const totalAmount = (ordersTotal + requestsTotal + roomRateNum).toFixed(2);

            const dndActive = s.serviceRequests.some(
              (r) =>
                r.serviceType === "DO_NOT_DISTURB" &&
                ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"].includes(r.state)
            );

            return [
              s.roomId!,
              {
                id: s.id,
                startedAt: s.createdAt,
                ordersCount,
                requestsCount,
                roomRate: roomRateNum.toFixed(2),
                totalAmount,
                dndActive,
              },
            ];
          })
        );

        const views: RoomView[] = rooms.map((r) => ({
          ...mapRoom(r),
          category: r.category ? mapRoomCategory(r.category) : null,
          activeSession: activeSessionByRoomId.get(r.id) ?? null,
        }));

        return ok(views);
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
            categoryId: input.categoryId ?? undefined,
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

    async update(
      venueId: string,
      id: string,
      input: UpdateRoomInput
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

        // If changing state away from OCCUPIED, check if there's an active session
        if (
          input.state !== undefined &&
          input.state !== RoomState.OCCUPIED &&
          existing.state === RoomState.OCCUPIED
        ) {
          const activeSession = await client.guestSession.findFirst({
            where: { venueId, roomId: id, endedAt: null },
          });
          if (activeSession) {
            return fail(
              DomainErrorCode.CONFLICT,
              "Cannot change state of room with an active session. Check out the guest session first."
            );
          }
        }

        const updated = await client.room.update({
          where: { id },
          data: {
            number: input.number,
            categoryId: input.categoryId,
            state: input.state ? (input.state as unknown as PrismaRoomState) : undefined,
          },
        });

        return ok(mapRoom(updated));
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

    async delete(venueId: string, id: string): Promise<Result<void>> {
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

        const activeSession = await client.guestSession.findFirst({
          where: { venueId, roomId: id, endedAt: null },
        });

        if (activeSession) {
          return fail(
            DomainErrorCode.CONFLICT,
            "Cannot delete room with an active session"
          );
        }

        await client.room.delete({
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
        const existing = await client.room.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room with id '${id}' not found in venue '${venueId}'`
          );
        }

        const activeSessions = await client.guestSession.findMany({
          where: { venueId, roomId: id, endedAt: null },
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
            roomId: id,
            state: { in: ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"] },
          },
          data: {
            state: "COMPLETED",
          },
        });

        await client.room.update({
          where: { id },
          data: {
            state: RoomState.VACANT as unknown as PrismaRoomState,
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

    async setStatus(
      venueId: string,
      roomId: string,
      status: RoomState
    ): Promise<Result<void>> {
      try {
        const existing = await client.room.findFirst({
          where: { id: roomId, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room with id '${roomId}' not found in venue '${venueId}'`
          );
        }

        await client.room.update({
          where: { id: roomId },
          data: {
            state: status as unknown as PrismaRoomState,
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
    async listCategories(venueId: string): Promise<Result<RoomCategory[]>> {
      try {
        const categories = await client.roomCategory.findMany({
          where: { venueId },
          orderBy: { sortOrder: "asc" },
        });

        return ok(categories.map(mapRoomCategory));
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
    ): Promise<Result<RoomCategory>> {
      try {
        const category = await client.roomCategory.findFirst({
          where: { id, venueId },
        });

        if (!category) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room category with id '${id}' not found in venue '${venueId}'`
          );
        }

        return ok(mapRoomCategory(category));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async createCategory(
      venueId: string,
      input: CreateRoomCategoryInput
    ): Promise<Result<RoomCategory>> {
      try {
        const category = await client.roomCategory.create({
          data: {
            venueId,
            name: input.name,
            description: input.description,
            basePrice:
              input.basePrice != null
                ? new Prisma.Decimal(input.basePrice)
                : new Prisma.Decimal(0),
            sortOrder: input.sortOrder ?? 0,
          },
        });

        return ok(mapRoomCategory(category));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Room category '${input.name}' already exists in venue '${venueId}'`
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
      input: UpdateRoomCategoryInput
    ): Promise<Result<RoomCategory>> {
      try {
        const existing = await client.roomCategory.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room category with id '${id}' not found in venue '${venueId}'`
          );
        }

        const updated = await client.roomCategory.update({
          where: { id },
          data: {
            name: input.name,
            description: input.description,
            basePrice:
              input.basePrice !== undefined
                ? new Prisma.Decimal(input.basePrice)
                : undefined,
            sortOrder: input.sortOrder,
          },
        });

        return ok(mapRoomCategory(updated));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Room category '${input.name}' already exists in venue '${venueId}'`
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
        const existing = await client.roomCategory.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Room category with id '${id}' not found in venue '${venueId}'`
          );
        }

        // Unlink rooms using this category
        await client.room.updateMany({
          where: { categoryId: id },
          data: { categoryId: null },
        });

        await client.roomCategory.delete({
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
