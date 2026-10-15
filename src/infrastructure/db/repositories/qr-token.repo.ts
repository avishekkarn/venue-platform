/**
 * Prisma adapter for the QrTokenRepository port.
 *
 * Requirements:
 * - Exports createPrismaQrTokenRepository(client: DbClient).
 * - Only file in the qr module that imports @prisma/client.
 * - Enforces the QR implementation contract (SYSTEM.md §8.6):
 *   - Tokens are opaque UUIDs generated per place.
 *   - Revocation sets state = REVOKED and revokedAt = now(), never deletes the row.
 *   - Revoking an already-revoked token returns INVALID_STATE.
 *   - Maps database rows to domain QrToken discriminated union on placeType.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (qr module),
 * SYSTEM.md §8.6 (the QR implementation contract), SYSTEM.md §11.1 (QrToken entity),
 * DECISIONS.md D-1.2, D-16.2.
 */

import {
  type PrismaClient,
  type Prisma,
  type QrToken as PrismaQrToken,
  QrTokenState as PrismaQrTokenState,
  PlaceType as PrismaPlaceType,
} from "@prisma/client";
import {
  type QrTokenRepository,
  type QrToken,
  type GenerateTokenInput,
  type ListQrTokensOptions,
  QrTokenState,
  PlaceType,
} from "@/domain/qr/qr-token.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapQrToken(raw: PrismaQrToken): QrToken {
  const base = {
    id: raw.id,
    token: raw.token,
    venueId: raw.venueId,
    state: raw.state as QrTokenState,
    createdAt: raw.createdAt,
    revokedAt: raw.revokedAt,
  };

  switch (raw.placeType) {
    case PrismaPlaceType.TABLE:
      return {
        ...base,
        placeType: PlaceType.TABLE,
        tableId: raw.tableId!,
        roomId: null,
        counterId: null,
      };
    case PrismaPlaceType.ROOM:
      return {
        ...base,
        placeType: PlaceType.ROOM,
        tableId: null,
        roomId: raw.roomId!,
        counterId: null,
      };
    case PrismaPlaceType.COUNTER:
      return {
        ...base,
        placeType: PlaceType.COUNTER,
        tableId: null,
        roomId: null,
        counterId: raw.counterId!,
      };
  }
}

export function createPrismaQrTokenRepository(
  client: DbClient
): QrTokenRepository {
  return {
    async findByToken(token: string): Promise<Result<QrToken>> {
      try {
        const qrToken = await client.qrToken.findUnique({
          where: { token },
        });

        if (!qrToken) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `QR token '${token}' not found`
          );
        }

        return ok(mapQrToken(qrToken));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async findById(id: string): Promise<Result<QrToken>> {
      try {
        const qrToken = await client.qrToken.findUnique({
          where: { id },
        });

        if (!qrToken) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `QR token with id '${id}' not found`
          );
        }

        return ok(mapQrToken(qrToken));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async generate(input: GenerateTokenInput): Promise<Result<QrToken>> {
      try {
        const created = await client.qrToken.create({
          data: {
            venueId: input.venueId,
            placeType: input.placeType as unknown as PrismaPlaceType,
            tableId: input.placeType === PlaceType.TABLE ? input.tableId : null,
            roomId: input.placeType === PlaceType.ROOM ? input.roomId : null,
            counterId: input.placeType === PlaceType.COUNTER ? input.counterId : null,
            state: PrismaQrTokenState.ACTIVE,
          },
        });

        return ok(mapQrToken(created));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async revoke(id: string): Promise<Result<QrToken>> {
      try {
        const existing = await client.qrToken.findUnique({
          where: { id },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `QR token with id '${id}' not found`
          );
        }

        if (existing.state === PrismaQrTokenState.REVOKED) {
          return fail(
            DomainErrorCode.INVALID_STATE,
            `QR token with id '${id}' is already revoked`
          );
        }

        const updated = await client.qrToken.update({
          where: { id },
          data: {
            state: PrismaQrTokenState.REVOKED,
            revokedAt: new Date(),
          },
        });

        return ok(mapQrToken(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async listForVenue(
      venueId: string,
      options?: ListQrTokensOptions
    ): Promise<Result<QrToken[]>> {
      try {
        const tokens = await client.qrToken.findMany({
          where: {
            venueId,
            state: options?.state
              ? (options.state as unknown as PrismaQrTokenState)
              : undefined,
          },
          orderBy: { createdAt: "desc" },
        });

        return ok(tokens.map(mapQrToken));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },
  };
}
