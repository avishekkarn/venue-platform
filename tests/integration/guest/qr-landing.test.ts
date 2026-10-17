import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { type Prisma } from "@prisma/client";
import { GET } from "../../../app/(guest)/qr/[token]/route";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import { revokeToken } from "@/domain/qr/revoke-token";
import { PlaceType } from "@/domain/qr/qr-token.repository";
import { withTransaction } from "../setup";

/**
 * Temporary delegation of Prisma model delegates to the active test transaction client (tx).
 * Ensures route handlers importing the global `prisma` client participate in the test transaction
 * and observe uncommitted fixture records before rollback.
 */
function withTxPrismaDelegation(
  tx: Prisma.TransactionClient,
  fn: () => Promise<void>
): Promise<void> {
  const originalQrToken = prisma.qrToken;
  const originalVenue = prisma.venue;
  const originalTable = prisma.table;
  const originalRoom = prisma.room;
  const originalCounter = prisma.counter;
  const originalGuestSession = prisma.guestSession;

  (prisma as any).qrToken = tx.qrToken;
  (prisma as any).venue = tx.venue;
  (prisma as any).table = tx.table;
  (prisma as any).room = tx.room;
  (prisma as any).counter = tx.counter;
  (prisma as any).guestSession = tx.guestSession;

  return fn().finally(() => {
    (prisma as any).qrToken = originalQrToken;
    (prisma as any).venue = originalVenue;
    (prisma as any).table = originalTable;
    (prisma as any).room = originalRoom;
    (prisma as any).counter = originalCounter;
    (prisma as any).guestSession = originalGuestSession;
  });
}

describe("QR Landing Route Handler Integration Tests", () => {
  it("valid token redirects to /menu and sets venue_guest cookie", async () => {
    await withTransaction(async (tx) => {
      await withTxPrismaDelegation(tx, async () => {
        const venueRepo = createPrismaVenueRepository(tx);
        const tableRepo = createPrismaTableRepository(tx);
        const qrRepo = createPrismaQrTokenRepository(tx);

        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
        let venueResult = await venueRepo.findBySlug(venueSlug);
        let venueId: string;
        if (!venueResult.ok) {
          const created = await venueRepo.create({
            name: "Juniper House",
            slug: venueSlug,
            taxRate: "0.1000",
            modules: ["TABLE"],
          });
          expect(created.ok).toBe(true);
          if (!created.ok) return;
          venueId = created.value.id;
        } else {
          venueId = venueResult.value.id;
        }

        const tableResult = await tableRepo.create(venueId, {
          number: `T-TEST-${Date.now()}`,
        });
        expect(tableResult.ok).toBe(true);
        if (!tableResult.ok) return;

        const tokenResult = await qrRepo.generate({
          venueId,
          placeType: PlaceType.TABLE,
          tableId: tableResult.value.id,
        });
        expect(tokenResult.ok).toBe(true);
        if (!tokenResult.ok) return;

        const token = tokenResult.value.token;
        const request = new NextRequest(`http://localhost:3000/qr/${token}`, {
          method: "GET",
        });

        const response = await GET(request, {
          params: Promise.resolve({ token }),
        });

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toMatch(/\/menu$/);

        const setCookieHeader = response.headers.get("set-cookie");
        expect(setCookieHeader).not.toBeNull();
        expect(setCookieHeader).toContain("venue_guest=");
      });
    });
  });

  it("revoked token redirects to /qr/inactive", async () => {
    await withTransaction(async (tx) => {
      await withTxPrismaDelegation(tx, async () => {
        const venueRepo = createPrismaVenueRepository(tx);
        const tableRepo = createPrismaTableRepository(tx);
        const qrRepo = createPrismaQrTokenRepository(tx);

        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
        let venueResult = await venueRepo.findBySlug(venueSlug);
        let venueId: string;
        if (!venueResult.ok) {
          const created = await venueRepo.create({
            name: "Juniper House",
            slug: venueSlug,
            taxRate: "0.1000",
            modules: ["TABLE"],
          });
          expect(created.ok).toBe(true);
          if (!created.ok) return;
          venueId = created.value.id;
        } else {
          venueId = venueResult.value.id;
        }

        const tableResult = await tableRepo.create(venueId, {
          number: `T-REVOKED-${Date.now()}`,
        });
        expect(tableResult.ok).toBe(true);
        if (!tableResult.ok) return;

        const tokenResult = await qrRepo.generate({
          venueId,
          placeType: PlaceType.TABLE,
          tableId: tableResult.value.id,
        });
        expect(tokenResult.ok).toBe(true);
        if (!tokenResult.ok) return;

        const token = tokenResult.value.token;
        const revokeResult = await revokeToken({ qrTokenRepo: qrRepo }, token);
        expect(revokeResult.ok).toBe(true);

        const request = new NextRequest(`http://localhost:3000/qr/${token}`, {
          method: "GET",
        });

        const response = await GET(request, {
          params: Promise.resolve({ token }),
        });

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toMatch(/\/qr\/inactive$/);
        expect(response.headers.get("set-cookie")).toBeNull();
      });
    });
  });

  it("malformed token redirects to /qr/inactive", async () => {
    await withTransaction(async (tx) => {
      await withTxPrismaDelegation(tx, async () => {
        const malformedToken = "not-a-uuid";
        const request = new NextRequest(
          `http://localhost:3000/qr/${malformedToken}`,
          {
            method: "GET",
          }
        );

        const response = await GET(request, {
          params: Promise.resolve({ token: malformedToken }),
        });

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toMatch(/\/qr\/inactive$/);
        expect(response.headers.get("set-cookie")).toBeNull();
      });
    });
  });
});
