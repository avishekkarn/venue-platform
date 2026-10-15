/**
 * QR token repository port.
 *
 * Defines the contract for reading, writing, and revoking QR tokens.
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Expresses place as a discriminated union on placeType (TABLE, ROOM, COUNTER).
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (qr module),
 * SYSTEM.md §8.6 (the QR implementation contract), SYSTEM.md §11.1 (the QrToken entity),
 * DECISIONS.md D-1.2, D-16.2.
 */

import { type Result } from "@/domain/shared/result";

export enum QrTokenState {
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
}

export enum PlaceType {
  TABLE = "TABLE",
  ROOM = "ROOM",
  COUNTER = "COUNTER",
}

export type GenerateTokenInput =
  | {
      readonly venueId: string;
      readonly placeType: PlaceType.TABLE;
      readonly tableId: string;
    }
  | {
      readonly venueId: string;
      readonly placeType: PlaceType.ROOM;
      readonly roomId: string;
    }
  | {
      readonly venueId: string;
      readonly placeType: PlaceType.COUNTER;
      readonly counterId: string;
    };

export type QrTokenPlace =
  | {
      readonly placeType: PlaceType.TABLE;
      readonly tableId: string;
      readonly roomId: null;
      readonly counterId: null;
    }
  | {
      readonly placeType: PlaceType.ROOM;
      readonly tableId: null;
      readonly roomId: string;
      readonly counterId: null;
    }
  | {
      readonly placeType: PlaceType.COUNTER;
      readonly tableId: null;
      readonly roomId: null;
      readonly counterId: string;
    };

export type QrToken = {
  readonly id: string;
  readonly token: string;
  readonly venueId: string;
  readonly state: QrTokenState;
  readonly createdAt: Date;
  readonly revokedAt: Date | null;
} & QrTokenPlace;

export interface ListQrTokensOptions {
  readonly state?: QrTokenState;
}

export interface QrTokenRepository {
  findByToken(token: string): Promise<Result<QrToken>>;
  findById(id: string): Promise<Result<QrToken>>;
  generate(input: GenerateTokenInput): Promise<Result<QrToken>>;
  revoke(id: string): Promise<Result<QrToken>>;
  listForVenue(
    venueId: string,
    options?: ListQrTokensOptions
  ): Promise<Result<QrToken[]>>;
}
