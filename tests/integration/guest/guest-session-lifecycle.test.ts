import { describe, it, expect } from "vitest";
import { type Prisma } from "@prisma/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { resolveToken } from "@/domain/qr/resolve-token";
import { revokeToken } from "@/domain/qr/revoke-token";
import {
  createGuestSession,
  getGuestSession,
  invalidateSessionsForPlace,
} from "@/domain/guest/guest-session.service";
import {
  PlaceType,
  QrTokenState,
} from "@/domain/qr/qr-token.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

// Keep revokeToken and QrTokenState available for test suite completeness
export { revokeToken, QrTokenState };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TestFixture {
  readonly venueId: string;
  readonly tableId: string;
  readonly qrTokenId: string;
  readonly qrTokenString: string;
}

async function createTestVenueAndTableQr(
  tx: Prisma.TransactionClient
): Promise<TestFixture> {
  const venueRepo = createPrismaVenueRepository(tx);
  const tableRepo = createPrismaTableRepository(tx);
  const qrRepo = createPrismaQrTokenRepository(tx);

  const venueResult = await venueRepo.create({
    name: "Lifecycle Test Venue",
    slug: `lifecycle-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    taxRate: "0.1000",
    modules: ["TABLE"],
  });
  if (!venueResult.ok) {
    throw new Error(`Venue creation failed: ${venueResult.error.message}`);
  }
  const venueId = venueResult.value.id;

  const tableResult = await tableRepo.create(venueId, {
    number: `T-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  });
  if (!tableResult.ok) {
    throw new Error(`Table creation failed: ${tableResult.error.message}`);
  }
  const tableId = tableResult.value.id;

  const qrResult = await qrRepo.generate({
    venueId,
    placeType: PlaceType.TABLE,
    tableId,
  });
  if (!qrResult.ok) {
    throw new Error(`QR generation failed: ${qrResult.error.message}`);
  }

  return {
    venueId,
    tableId,
    qrTokenId: qrResult.value.id,
    qrTokenString: qrResult.value.token,
  };
}

describe("Guest Session Lifecycle Integration Tests", () => {
  it("scan: a valid QR token creates a guest session", async () => {
    await withTransaction(async (tx) => {
      const qrRepo = createPrismaQrTokenRepository(tx);
      const guestRepo = createPrismaGuestSessionRepository(tx);

      const fixture = await createTestVenueAndTableQr(tx);

      // Resolve the token to place context
      const resolveResult = await resolveToken(
        { qrTokenRepo: qrRepo },
        fixture.qrTokenString
      );
      expect(resolveResult.ok).toBe(true);
      if (!resolveResult.ok) return;

      const resolvedToken = resolveResult.value;

      // Create guest session for resolved context
      const sessionResult = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: resolvedToken.id,
        }
      );

      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      const session = sessionResult.value;
      expect(session.token).toMatch(UUID_REGEX);
      expect(session.venueId).toBe(fixture.venueId);
      expect(session.placeType).toBe(PlaceType.TABLE);
      expect(session.placeId).toBe(fixture.tableId);
      expect(session.endedAt).toBeNull();
    });
  });

  it("read: the guest session is retrievable by its token", async () => {
    await withTransaction(async (tx) => {
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const fixture = await createTestVenueAndTableQr(tx);

      const createdResult = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      expect(createdResult.ok).toBe(true);
      if (!createdResult.ok) return;

      const session = createdResult.value;

      const readResult = await getGuestSession(
        { repo: guestRepo },
        session.token
      );
      expect(readResult.ok).toBe(true);
      if (!readResult.ok) return;

      expect(readResult.value.id).toBe(session.id);
      expect(readResult.value.token).toBe(session.token);
    });
  });

  it("close: invalidating all sessions for a place invalidates every active session on that place", async () => {
    await withTransaction(async (tx) => {
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const fixture = await createTestVenueAndTableQr(tx);

      // Create two guest sessions for the same table (two scans)
      const session1Result = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      const session2Result = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      expect(session1Result.ok).toBe(true);
      expect(session2Result.ok).toBe(true);
      if (!session1Result.ok || !session2Result.ok) return;

      // Invalidate all sessions for the place (table close)
      const closeResult = await invalidateSessionsForPlace(
        { repo: guestRepo },
        fixture.venueId,
        PlaceType.TABLE,
        fixture.tableId
      );
      expect(closeResult.ok).toBe(true);
      if (closeResult.ok) {
        expect(closeResult.value).toBe(2);
      }

      // Read back both sessions by their tokens; assert endedAt is a Date on both
      const read1 = await guestRepo.findByToken(session1Result.value.token);
      const read2 = await guestRepo.findByToken(session2Result.value.token);

      expect(read1.ok).toBe(true);
      expect(read2.ok).toBe(true);
      if (read1.ok && read1.value) {
        expect(read1.value.endedAt).toBeInstanceOf(Date);
      }
      if (read2.ok && read2.value) {
        expect(read2.value.endedAt).toBeInstanceOf(Date);
      }
    });
  });

  it("old rejected: after close, the old session token no longer reads as an active session", async () => {
    await withTransaction(async (tx) => {
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const fixture = await createTestVenueAndTableQr(tx);

      const sessionResult = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      expect(sessionResult.ok).toBe(true);
      if (!sessionResult.ok) return;

      const oldSession = sessionResult.value;

      // Invalidate by place (close)
      const closeResult = await invalidateSessionsForPlace(
        { repo: guestRepo },
        fixture.venueId,
        PlaceType.TABLE,
        fixture.tableId
      );
      expect(closeResult.ok).toBe(true);

      // Attempt to read the old session token
      const getResult = await getGuestSession(
        { repo: guestRepo },
        oldSession.token
      );
      expect(getResult.ok).toBe(false);
      if (!getResult.ok) {
        expect(getResult.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
      }
    });
  });

  it("fresh scan: scanning the same token again creates a new session with a new token", async () => {
    await withTransaction(async (tx) => {
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const fixture = await createTestVenueAndTableQr(tx);

      // Session A
      const sessionAResult = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      expect(sessionAResult.ok).toBe(true);
      if (!sessionAResult.ok) return;
      const sessionA = sessionAResult.value;

      // Invalidate by place (simulating close)
      const closeResult = await invalidateSessionsForPlace(
        { repo: guestRepo },
        fixture.venueId,
        PlaceType.TABLE,
        fixture.tableId
      );
      expect(closeResult.ok).toBe(true);

      // Session B via createGuestSession with the SAME qrTokenId and same place
      const sessionBResult = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      expect(sessionBResult.ok).toBe(true);
      if (!sessionBResult.ok) return;
      const sessionB = sessionBResult.value;

      expect(sessionB.id).not.toBe(sessionA.id);
      expect(sessionB.token).not.toBe(sessionA.token);
      expect(sessionB.endedAt).toBeNull();
    });
  });

  it("no memory: the fresh session does not see the previous session's identifiers", async () => {
    await withTransaction(async (tx) => {
      const guestRepo = createPrismaGuestSessionRepository(tx);
      const fixture = await createTestVenueAndTableQr(tx);

      // Session A
      const sessionAResult = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      expect(sessionAResult.ok).toBe(true);
      if (!sessionAResult.ok) return;
      const sessionA = sessionAResult.value;

      // Invalidate by place (simulating close)
      const closeResult = await invalidateSessionsForPlace(
        { repo: guestRepo },
        fixture.venueId,
        PlaceType.TABLE,
        fixture.tableId
      );
      expect(closeResult.ok).toBe(true);

      // Session B
      const sessionBResult = await createGuestSession(
        { repo: guestRepo },
        {
          venueId: fixture.venueId,
          placeType: PlaceType.TABLE,
          placeId: fixture.tableId,
          qrTokenId: fixture.qrTokenId,
        }
      );
      expect(sessionBResult.ok).toBe(true);
      if (!sessionBResult.ok) return;
      const sessionB = sessionBResult.value;

      // Old session token is rejected
      const getOldResult = await getGuestSession(
        { repo: guestRepo },
        sessionA.token
      );
      expect(getOldResult.ok).toBe(false);
      if (!getOldResult.ok) {
        expect(getOldResult.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
      }

      // New session token is active and returns sessionB's id, not sessionA's id
      const getNewResult = await getGuestSession(
        { repo: guestRepo },
        sessionB.token
      );
      expect(getNewResult.ok).toBe(true);
      if (getNewResult.ok) {
        expect(getNewResult.value.id).toBe(sessionB.id);
        expect(getNewResult.value.id).not.toBe(sessionA.id);
      }

      // Assert previous session row still exists in database and has endedAt set (D-2.3)
      const rowA = await tx.guestSession.findUnique({
        where: { token: sessionA.token },
      });
      expect(rowA).not.toBeNull();
      if (rowA) {
        expect(rowA.endedAt).not.toBeNull();
        expect(rowA.endedAt).toBeInstanceOf(Date);
      }
    });
  });
});
