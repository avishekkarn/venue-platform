/**
 * Prisma adapter for the GuestSessionRepository port.
 *
 * Requirements:
 * - Exports createPrismaGuestSessionRepository(client: DbClient).
 * - Maps raw Prisma rows to domain GuestSession entities.
 * - Generates UUID token via crypto.randomUUID().
 * - Wraps database errors in canonical DomainError values.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (guest module),
 * SYSTEM.md §6.2 (the guest session), SYSTEM.md §11.1 (GuestSession entity),
 * DECISIONS.md D-2.1, D-2.3, D-2.5.
 */

import {
  type PrismaClient,
  type Prisma,
  type GuestSession as PrismaGuestSession,
} from "@prisma/client";
import {
  type GuestSessionRepository,
  type GuestSession,
  type CreateGuestSessionInput,
  PlaceType,
} from "@/domain/guest/guest-session.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

function resolvePlaceId(raw: PrismaGuestSession): string {
  switch (raw.placeType) {
    case "TABLE":
      return raw.tableId ?? "";
    case "ROOM":
      return raw.roomId ?? "";
    case "COUNTER":
      return raw.counterId ?? "";
    default:
      return raw.tableId ?? raw.roomId ?? raw.counterId ?? "";
  }
}

function mapGuestSession(raw: PrismaGuestSession): GuestSession {
  return {
    id: raw.id,
    token: raw.token,
    venueId: raw.venueId,
    placeType: raw.placeType as PlaceType,
    placeId: resolvePlaceId(raw),
    createdAt: raw.createdAt,
    endedAt: raw.endedAt,
  };
}

export function createPrismaGuestSessionRepository(
  client: DbClient
): GuestSessionRepository {
  return {
    async create(
      input: CreateGuestSessionInput
    ): Promise<Result<GuestSession>> {
      try {
        const token = crypto.randomUUID();
        const tableId =
          input.placeType === PlaceType.TABLE ? input.placeId : null;
        const roomId =
          input.placeType === PlaceType.ROOM ? input.placeId : null;
        const counterId =
          input.placeType === PlaceType.COUNTER ? input.placeId : null;

        // Ensure foreign key qrTokenId is resolved or established
        let qrTokenId = input.qrTokenId;
        if (!qrTokenId) {
          const existingQr = await client.qrToken.findFirst({
            where: {
              venueId: input.venueId,
              ...(input.placeType === PlaceType.TABLE ? { tableId: input.placeId } : {}),
              ...(input.placeType === PlaceType.ROOM ? { roomId: input.placeId } : {}),
              ...(input.placeType === PlaceType.COUNTER ? { counterId: input.placeId } : {}),
            },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          });

          if (existingQr) {
            qrTokenId = existingQr.id;
          } else {
            const createdQr = await client.qrToken.create({
              data: {
                venueId: input.venueId,
                placeType: input.placeType,
                tableId,
                roomId,
                counterId,
                state: "ACTIVE",
              },
              select: { id: true },
            });
            qrTokenId = createdQr.id;
          }
        }

        const created = await client.guestSession.create({
          data: {
            token,
            venueId: input.venueId,
            placeType: input.placeType,
            tableId,
            roomId,
            counterId,
            qrTokenId,
            endedAt: null,
          },
        });

        return ok(mapGuestSession(created));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async findByToken(token: string): Promise<Result<GuestSession | null>> {
      try {
        const session = await client.guestSession.findUnique({
          where: { token },
        });

        if (!session) {
          return ok(null);
        }

        return ok(mapGuestSession(session));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async invalidateByToken(token: string): Promise<Result<void>> {
      try {
        await client.guestSession.updateMany({
          where: {
            token,
            endedAt: null,
          },
          data: {
            endedAt: new Date(),
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

    async invalidateByPlace(
      venueId: string,
      placeType: PlaceType,
      placeId: string
    ): Promise<Result<number>> {
      try {
        const placeFilter =
          placeType === PlaceType.TABLE
            ? { tableId: placeId }
            : placeType === PlaceType.ROOM
            ? { roomId: placeId }
            : { counterId: placeId };

        const result = await client.guestSession.updateMany({
          where: {
            venueId,
            ...placeFilter,
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
