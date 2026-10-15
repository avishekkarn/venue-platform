import { describe, it, expect } from "vitest";
import { prisma } from "@/infrastructure/db/client";
import { withTransaction } from "./setup";

describe("Integration Test Harness", () => {
  it("connects to the test database and executes a query", async () => {
    const result = await prisma.$queryRaw<Array<{ current_database: string }>>`
      SELECT current_database();
    `;
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.current_database).toBe("qrproject_test");
  });

  it("rolls back transactions cleanly with withTransaction", async () => {
    const uniqueSlug = `test-harness-${Date.now()}`;

    await withTransaction(async (tx) => {
      await tx.venue.create({
        data: {
          name: "Temporary Test Venue",
          slug: uniqueSlug,
          taxRate: "0.1000",
        },
      });

      const foundInside = await tx.venue.findUnique({
        where: { slug: uniqueSlug },
      });
      expect(foundInside).not.toBeNull();
      expect(foundInside?.slug).toBe(uniqueSlug);
    });

    // Check outside transaction: the record must have been rolled back
    const foundOutside = await prisma.venue.findUnique({
      where: { slug: uniqueSlug },
    });
    expect(foundOutside).toBeNull();
  });
});
