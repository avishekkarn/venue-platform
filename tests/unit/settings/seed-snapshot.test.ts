import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateSeedSnapshot, writeSeedSnapshot, triggerDebouncedSeedSnapshot } from "@/domain/settings/seed-snapshot";
import { Prisma } from "@prisma/client";

describe("Seed Snapshot Service", () => {
  const mockVenueId = "venue-uuid-123";

  const mockDb: any = {
    venue: {
      findUnique: vi.fn(),
    },
    menuItem: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates a seed snapshot free of guest PII, payment tokens, and order ledgers", async () => {
    mockDb.venue.findUnique.mockResolvedValue({
      id: mockVenueId,
      name: "Juniper House",
      slug: "juniper-house",
      brandColor: "#626542",
      welcomeMessage: "Welcome",
      language: "en",
      currency: "NPR",
      currencyLockedAt: new Date("2026-11-20T10:00:00Z"),
      timezone: "Asia/Kathmandu",
      timeFormat: "24h",
      taxRate: new Prisma.Decimal("0.1300"),
      taxRateId: "tax-1",
      contactName: "Manager Dave",
      contactPhone: "+977-1-4444444",
      contactEmail: "info@juniper.com",
      counterPhone: "+977-1-4444445",
      receiptHeader: "Juniper House Ltd",
      receiptFooter: "Thank you for dining",
      isActive: true,
      modules: [{ module: "TABLE", isEnabled: true }, { module: "ROOM", isEnabled: true }],
      services: [{ service: "HOUSEKEEPING", isEnabled: true }],
      taxRates: [
        {
          id: "tax-1",
          name: "Standard VAT",
          rate: new Prisma.Decimal("0.1300"),
          isDefault: true,
          isActive: true,
          isInclusive: false,
        },
      ],
      tableCategories: [{ id: "tc-1", name: "Main Dining", description: null, isReserved: false, sortOrder: 0 }],
      roomCategories: [{ id: "rc-1", name: "Deluxe Suite", description: null, basePrice: new Prisma.Decimal("100.00"), sortOrder: 0 }],
      tables: [
        {
          id: "t-1",
          number: "T1",
          categoryId: "tc-1",
          state: "FREE",
          qrTokens: [{ id: "qr-1", token: "tok-abc", state: "ACTIVE" }],
        },
      ],
      rooms: [
        {
          id: "r-1",
          number: "101",
          categoryId: "rc-1",
          state: "VACANT",
          qrTokens: [{ id: "qr-2", token: "tok-def", state: "ACTIVE" }],
        },
      ],
      counter: {
        id: "c-1",
        name: "Counter",
        qrTokens: [{ id: "qr-3", token: "tok-ghi", state: "ACTIVE" }],
      },
      menuCategories: [{ id: "mc-1", name: "Food", sortOrder: 0, taxRateId: null }],
      staffMembers: [
        {
          id: "sm-1",
          name: "Alice",
          username: "alice",
          roles: ["MANAGER"],
          state: "ACTIVE",
          passwordHash: "$argon2id$mockhash",
        },
      ],
    });

    mockDb.menuItem.findMany.mockResolvedValue([
      {
        id: "mi-1",
        name: "Burger",
        description: "Juicy",
        price: new Prisma.Decimal("12.50"),
        state: "AVAILABLE",
        sortOrder: 0,
        taxRateId: null,
        categories: [{ categoryId: "mc-1" }],
        modifierGroups: [
          {
            id: "mg-1",
            name: "Cheese",
            choiceType: "SINGLE",
            isRequired: false,
            sortOrder: 0,
            options: [
              {
                id: "opt-1",
                name: "Cheddar",
                additionalPrice: new Prisma.Decimal("1.50"),
                sortOrder: 0,
              },
            ],
          },
        ],
      },
    ]);

    const snapshot = await generateSeedSnapshot(mockDb, mockVenueId);

    expect(snapshot.version).toBe("1.0.0");
    expect(snapshot.venue.id).toBe(mockVenueId);
    expect(snapshot.venue.name).toBe("Juniper House");
    expect(snapshot.venue.taxRateFallback).toBe("0.1300");
    expect(snapshot.taxRates[0]!.rate).toBe("0.1300");
    expect(snapshot.places.tables[0]!.number).toBe("T1");
    expect(snapshot.places.tables[0]!.qrTokens[0]!.token).toBe("tok-abc");
    expect(snapshot.menu.items[0]!.name).toBe("Burger");
    expect(snapshot.menu.items[0]!.price).toBe("12.50");
    expect(snapshot.staff[0]!.username).toBe("alice");

    // Strictly assert NO guest PII or orders
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain("guestEmail");
    expect(json).not.toContain("guestSession");
    expect(json).not.toContain("paymentTicket");
  });

  it("throws if venue is not found", async () => {
    mockDb.venue.findUnique.mockResolvedValue(null);
    mockDb.menuItem.findMany.mockResolvedValue([]);
    await expect(generateSeedSnapshot(mockDb, "non-existent")).rejects.toThrow("Venue not found");
  });
});
