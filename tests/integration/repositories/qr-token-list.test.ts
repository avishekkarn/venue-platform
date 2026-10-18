import { describe, it, expect } from "vitest";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import {
  PlaceType,
  QrTokenState,
} from "@/domain/qr/qr-token.repository";
import { withTransaction } from "../setup";

describe("QrTokenRepository listForVenue Integration Tests", () => {
  it("enforces state filtering and cross-venue isolation on listForVenue", async () => {
    await withTransaction(async (tx) => {
      const venueRepo = createPrismaVenueRepository(tx);
      const tableRepo = createPrismaTableRepository(tx);
      const qrRepo = createPrismaQrTokenRepository(tx);

      // 1. Create venue A, table A1, token A1a (ACTIVE), token A1b (revoked)
      const venueAResult = await venueRepo.create({
        name: "Venue A",
        slug: `venue-a-${Date.now()}`,
        taxRate: "0.0825",
        modules: ["TABLE"],
      });
      expect(venueAResult.ok).toBe(true);
      if (!venueAResult.ok) return;
      const venueAId = venueAResult.value.id;

      const tableA1Result = await tableRepo.create(venueAId, {
        number: "T-100",
      });
      expect(tableA1Result.ok).toBe(true);
      if (!tableA1Result.ok) return;
      const tableA1Id = tableA1Result.value.id;

      const tokenA1aResult = await qrRepo.generate({
        venueId: venueAId,
        placeType: PlaceType.TABLE,
        tableId: tableA1Id,
      });
      expect(tokenA1aResult.ok).toBe(true);
      if (!tokenA1aResult.ok) return;
      const tokenA1a = tokenA1aResult.value;

      const tokenA1bResult = await qrRepo.generate({
        venueId: venueAId,
        placeType: PlaceType.TABLE,
        tableId: tableA1Id,
      });
      expect(tokenA1bResult.ok).toBe(true);
      if (!tokenA1bResult.ok) return;
      const tokenA1b = tokenA1bResult.value;

      const revokeResult = await qrRepo.revoke(tokenA1b.id);
      expect(revokeResult.ok).toBe(true);

      // 2. Create venue B, table B1, token B1a (ACTIVE)
      const venueBResult = await venueRepo.create({
        name: "Venue B",
        slug: `venue-b-${Date.now()}`,
        taxRate: "0.0825",
        modules: ["TABLE"],
      });
      expect(venueBResult.ok).toBe(true);
      if (!venueBResult.ok) return;
      const venueBId = venueBResult.value.id;

      const tableB1Result = await tableRepo.create(venueBId, {
        number: "T-200",
      });
      expect(tableB1Result.ok).toBe(true);
      if (!tableB1Result.ok) return;
      const tableB1Id = tableB1Result.value.id;

      const tokenB1aResult = await qrRepo.generate({
        venueId: venueBId,
        placeType: PlaceType.TABLE,
        tableId: tableB1Id,
      });
      expect(tokenB1aResult.ok).toBe(true);
      if (!tokenB1aResult.ok) return;
      const tokenB1a = tokenB1aResult.value;

      // 3. listForVenue(A) returns ok with value.length === 2; assert both A1a.token and A1b.token are present
      const listAResult = await qrRepo.listForVenue(venueAId);
      expect(listAResult.ok).toBe(true);
      if (listAResult.ok) {
        expect(listAResult.value).toHaveLength(2);
        const tokensA = listAResult.value.map((t) => t.token);
        expect(tokensA).toContain(tokenA1a.token);
        expect(tokensA).toContain(tokenA1b.token);
      }

      // 4. listForVenue(A, { state: QrTokenState.ACTIVE }) returns ok with length 1 and value[0].token === A1a.token
      const listAActiveResult = await qrRepo.listForVenue(venueAId, {
        state: QrTokenState.ACTIVE,
      });
      expect(listAActiveResult.ok).toBe(true);
      if (listAActiveResult.ok) {
        expect(listAActiveResult.value).toHaveLength(1);
        expect(listAActiveResult.value[0]?.token).toBe(tokenA1a.token);
      }

      // 5. listForVenue(A, { state: QrTokenState.REVOKED }) returns ok with length 1 and value[0].token === A1b.token
      const listARevokedResult = await qrRepo.listForVenue(venueAId, {
        state: QrTokenState.REVOKED,
      });
      expect(listARevokedResult.ok).toBe(true);
      if (listARevokedResult.ok) {
        expect(listARevokedResult.value).toHaveLength(1);
        expect(listARevokedResult.value[0]?.token).toBe(tokenA1b.token);
      }

      // 6. listForVenue(B) returns ok with length 1 and value[0].token === B1a.token
      const listBResult = await qrRepo.listForVenue(venueBId);
      expect(listBResult.ok).toBe(true);
      if (listBResult.ok) {
        expect(listBResult.value).toHaveLength(1);
        expect(listBResult.value[0]?.token).toBe(tokenB1a.token);
      }

      // 7. Cross-venue isolation: listForVenue(B) does not contain A1a.token nor A1b.token (string comparison)
      if (listBResult.ok) {
        const tokensB = listBResult.value.map((t) => t.token);
        expect(tokensB).not.toContain(tokenA1a.token);
        expect(tokensB).not.toContain(tokenA1b.token);
      }

      // 8. listForVenue(crypto.randomUUID()) returns ok with value.length === 0 (not NOT_FOUND)
      const unknownVenueId = crypto.randomUUID();
      const listUnknownResult = await qrRepo.listForVenue(unknownVenueId);
      expect(listUnknownResult.ok).toBe(true);
      if (listUnknownResult.ok) {
        expect(listUnknownResult.value).toHaveLength(0);
      }
    });
  });
});
