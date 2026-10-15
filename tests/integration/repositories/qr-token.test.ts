import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import {
  QrTokenState,
  PlaceType,
} from "@/domain/qr/qr-token.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

describe("QrTokenRepository Integration Tests", () => {
  it("returns NOT_FOUND when looking up an unknown token or id", async () => {
    await withTransaction(async (tx) => {
      const qrRepo = createPrismaQrTokenRepository(tx);

      const byToken = await qrRepo.findByToken("00000000-0000-0000-0000-000000000000");
      expect(byToken.ok).toBe(false);
      if (!byToken.ok) {
        expect(byToken.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      const byId = await qrRepo.findById("00000000-0000-0000-0000-000000000000");
      expect(byId.ok).toBe(false);
      if (!byId.ok) {
        expect(byId.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("generates a token for a place, reads it back, and verifies UUID shape", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);
      const qrRepo = createPrismaQrTokenRepository(tx);

      const venueResult = await venueRepo.create({
        name: "QR Venue",
        slug: `venue-${Date.now()}-qr`,
        taxRate: "0.0825",
        modules: ["TABLE"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const tableResult = await tableRepo.create(venueId, {
        number: "T-1",
      });
      expect(tableResult.ok).toBe(true);
      if (!tableResult.ok) return;

      const tableId = tableResult.value.id;

      // Generate token for Table
      const genResult = await qrRepo.generate({
        venueId,
        placeType: PlaceType.TABLE,
        tableId,
      });
      expect(genResult.ok).toBe(true);
      if (!genResult.ok) return;

      const created = genResult.value;
      expect(created.id).toBeDefined();
      expect(created.venueId).toBe(venueId);
      expect(created.placeType).toBe(PlaceType.TABLE);
      expect(created.tableId).toBe(tableId);
      expect(created.roomId).toBeNull();
      expect(created.counterId).toBeNull();
      expect(created.state).toBe(QrTokenState.ACTIVE);
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.revokedAt).toBeNull();

      // Verify token is an opaque UUID (standard 8-4-4-4-12 hex pattern)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(created.token).toMatch(uuidRegex);

      // Verify findByToken
      const readResult = await qrRepo.findByToken(created.token);
      expect(readResult.ok).toBe(true);
      if (readResult.ok) {
        expect(readResult.value.id).toBe(created.id);
        expect(readResult.value.token).toBe(created.token);
        expect(readResult.value.tableId).toBe(tableId);
      }
    });
  });

  it("revokes a token without deleting the row, and returns INVALID_STATE on second revoke", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);
      const qrRepo = createPrismaQrTokenRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Revoke Venue",
        slug: `venue-${Date.now()}-revoke`,
        taxRate: "0.0500",
        modules: ["TABLE"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;
      const tableResult = await tableRepo.create(venueId, { number: "T-REVOKE" });
      expect(tableResult.ok).toBe(true);
      if (!tableResult.ok) return;

      const tokenResult = await qrRepo.generate({
        venueId,
        placeType: PlaceType.TABLE,
        tableId: tableResult.value.id,
      });
      expect(tokenResult.ok).toBe(true);
      if (!tokenResult.ok) return;

      const tokenId = tokenResult.value.id;

      // First revoke: sets state = REVOKED and revokedAt = now()
      const revokeResult = await qrRepo.revoke(tokenId);
      expect(revokeResult.ok).toBe(true);
      if (!revokeResult.ok) return;

      expect(revokeResult.value.state).toBe(QrTokenState.REVOKED);
      expect(revokeResult.value.revokedAt).toBeInstanceOf(Date);

      // Verify row is NOT deleted — findById still finds it
      const readAfterRevoke = await qrRepo.findById(tokenId);
      expect(readAfterRevoke.ok).toBe(true);
      if (readAfterRevoke.ok) {
        expect(readAfterRevoke.value.state).toBe(QrTokenState.REVOKED);
      }

      // Second revoke on already-revoked token returns INVALID_STATE
      const secondRevoke = await qrRepo.revoke(tokenId);
      expect(secondRevoke.ok).toBe(false);
      if (!secondRevoke.ok) {
        expect(secondRevoke.error.code).toBe(DomainErrorCode.INVALID_STATE);
      }
    });
  });

  it("distinguishes tokens for different places and never reuses a revoked token", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);
      const qrRepo = createPrismaQrTokenRepository(tx);

      const venueResult = await venueRepo.create({
        name: "Multi-Place Venue",
        slug: `venue-${Date.now()}-multi`,
        taxRate: "0.1000",
        modules: ["TABLE"],
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const venueId = venueResult.value.id;

      const table1Result = await tableRepo.create(venueId, { number: "T-10" });
      const table2Result = await tableRepo.create(venueId, { number: "T-20" });
      expect(table1Result.ok).toBe(true);
      expect(table2Result.ok).toBe(true);
      if (!table1Result.ok || !table2Result.ok) return;

      const token1Result = await qrRepo.generate({
        venueId,
        placeType: PlaceType.TABLE,
        tableId: table1Result.value.id,
      });
      const token2Result = await qrRepo.generate({
        venueId,
        placeType: PlaceType.TABLE,
        tableId: table2Result.value.id,
      });

      expect(token1Result.ok).toBe(true);
      expect(token2Result.ok).toBe(true);
      if (!token1Result.ok || !token2Result.ok) return;

      // Table 1's token resolves to Table 1, not Table 2
      const read1 = await qrRepo.findByToken(token1Result.value.token);
      expect(read1.ok).toBe(true);
      if (read1.ok) {
        expect(read1.value.tableId).toBe(table1Result.value.id);
        expect(read1.value.tableId).not.toBe(table2Result.value.id);
      }

      // Revoke Table 1's token and generate a replacement
      await qrRepo.revoke(token1Result.value.id);

      const replacementResult = await qrRepo.generate({
        venueId,
        placeType: PlaceType.TABLE,
        tableId: table1Result.value.id,
      });
      expect(replacementResult.ok).toBe(true);
      if (!replacementResult.ok) return;

      // A new token is created with a different UUID (revoked token is never reused)
      expect(replacementResult.value.id).not.toBe(token1Result.value.id);
      expect(replacementResult.value.token).not.toBe(token1Result.value.token);
      expect(replacementResult.value.state).toBe(QrTokenState.ACTIVE);

      // Venue listing filters by state
      const allTokens = await qrRepo.listForVenue(venueId);
      expect(allTokens.ok).toBe(true);
      if (allTokens.ok) {
        expect(allTokens.value).toHaveLength(3);
      }

      const activeTokens = await qrRepo.listForVenue(venueId, {
        state: QrTokenState.ACTIVE,
      });
      expect(activeTokens.ok).toBe(true);
      if (activeTokens.ok) {
        expect(activeTokens.value).toHaveLength(2);
      }
    });
  });
});
