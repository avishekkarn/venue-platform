/**
 * Guest session repository port.
 *
 * Defines the contract for creating, reading, and invalidating guest sessions.
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (guest module),
 * SYSTEM.md §6.2 (the guest session), SYSTEM.md §11.1 (the GuestSession entity),
 * DECISIONS.md D-2.1, D-2.3, D-2.5.
 */

import { type Result } from "@/domain/shared/result";
import { PlaceType } from "@/domain/qr/qr-token.repository";

export { PlaceType };

export interface GuestSession {
  readonly id: string;
  readonly token: string;
  readonly venueId: string;
  readonly placeType: PlaceType;
  readonly placeId: string;
  readonly createdAt: Date;
  readonly endedAt: Date | null;
}

export interface CreateGuestSessionInput {
  readonly venueId: string;
  readonly placeType: PlaceType;
  readonly placeId: string;
  readonly qrTokenId?: string;
}

export interface GuestSessionRepository {
  create(input: CreateGuestSessionInput): Promise<Result<GuestSession>>;
  findByToken(token: string): Promise<Result<GuestSession | null>>;
  invalidateByToken(token: string): Promise<Result<void>>;
  invalidateByPlace(
    venueId: string,
    placeType: PlaceType,
    placeId: string
  ): Promise<Result<number>>;
}
