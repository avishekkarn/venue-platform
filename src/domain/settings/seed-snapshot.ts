import fs from "node:fs/promises";
import path from "node:path";
import { type PrismaClient } from "@prisma/client";

export interface SeedSnapshotData {
  readonly version: "1.0.0";
  readonly exportedAt: string;
  readonly venue: {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
    readonly brandColor: string | null;
    readonly welcomeMessage: string | null;
    readonly language: string;
    readonly currency: string;
    readonly currencyLockedAt: string | null;
    readonly timezone: string;
    readonly timeFormat: string;
    readonly taxRateFallback: string;
    readonly taxRateId: string | null;
    readonly contactName: string | null;
    readonly contactPhone: string | null;
    readonly contactEmail: string | null;
    readonly counterPhone: string | null;
    readonly receiptHeader: string | null;
    readonly receiptFooter: string | null;
    readonly isActive: boolean;
    readonly modules: Array<{ readonly module: string; readonly isEnabled: boolean }>;
    readonly services: Array<{ readonly service: string; readonly isEnabled: boolean }>;
  };
  readonly taxRates: Array<{
    readonly id: string;
    readonly name: string;
    readonly rate: string;
    readonly isDefault: boolean;
    readonly isActive: boolean;
    readonly isInclusive: boolean;
  }>;
  readonly placeCategories: {
    readonly tableCategories: Array<{
      readonly id: string;
      readonly name: string;
      readonly description: string | null;
      readonly isReserved: boolean;
      readonly sortOrder: number;
    }>;
    readonly roomCategories: Array<{
      readonly id: string;
      readonly name: string;
      readonly description: string | null;
      readonly basePrice: string;
      readonly sortOrder: number;
    }>;
  };
  readonly places: {
    readonly tables: Array<{
      readonly id: string;
      readonly number: string;
      readonly categoryId: string | null;
      readonly state: string;
      readonly qrTokens: Array<{
        readonly id: string;
        readonly token: string;
        readonly state: string;
      }>;
    }>;
    readonly rooms: Array<{
      readonly id: string;
      readonly number: string;
      readonly categoryId: string | null;
      readonly state: string;
      readonly qrTokens: Array<{
        readonly id: string;
        readonly token: string;
        readonly state: string;
      }>;
    }>;
    readonly counter: {
      readonly id: string;
      readonly name: string;
      readonly qrTokens: Array<{
        readonly id: string;
        readonly token: string;
        readonly state: string;
      }>;
    } | null;
  };
  readonly menu: {
    readonly categories: Array<{
      readonly id: string;
      readonly name: string;
      readonly sortOrder: number;
      readonly taxRateId: string | null;
    }>;
    readonly items: Array<{
      readonly id: string;
      readonly name: string;
      readonly description: string | null;
      readonly price: string;
      readonly state: string;
      readonly sortOrder: number;
      readonly taxRateId: string | null;
      readonly categoryIds: string[];
      readonly modifierGroups: Array<{
        readonly id: string;
        readonly name: string;
        readonly choiceType: string;
        readonly isRequired: boolean;
        readonly sortOrder: number;
        readonly options: Array<{
          readonly id: string;
          readonly name: string;
          readonly additionalPrice: string;
          readonly sortOrder: number;
        }>;
      }>;
    }>;
  };
  readonly staff: Array<{
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly roles: string[];
    readonly state: string;
    readonly passwordHash: string;
  }>;
}

/**
 * Generate a complete disaster-recovery reference snapshot for a venue.
 * Strictly free of guest PII, order ledgers, and transient sessions (D-2.1, D-8.6).
 */
export async function generateSeedSnapshot(
  db: PrismaClient,
  venueId: string
): Promise<SeedSnapshotData> {
  const [venue, menuItems] = await Promise.all([
    db.venue.findUnique({
      where: { id: venueId },
      include: {
        modules: true,
        services: true,
        taxRates: {
          orderBy: [{ isDefault: "desc" }, { name: "asc" }],
        },
        tableCategories: {
          orderBy: { sortOrder: "asc" },
        },
        roomCategories: {
          orderBy: { sortOrder: "asc" },
        },
        tables: {
          include: {
            qrTokens: {
              where: { state: "ACTIVE" },
              select: { id: true, token: true, state: true },
            },
          },
          orderBy: { number: "asc" },
        },
        rooms: {
          include: {
            qrTokens: {
              where: { state: "ACTIVE" },
              select: { id: true, token: true, state: true },
            },
          },
          orderBy: { number: "asc" },
        },
        counter: {
          include: {
            qrTokens: {
              where: { state: "ACTIVE" },
              select: { id: true, token: true, state: true },
            },
          },
        },
        menuCategories: {
          orderBy: { sortOrder: "asc" },
        },
        staffMembers: {
          where: { state: "ACTIVE" },
          select: {
            id: true,
            name: true,
            username: true,
            roles: true,
            state: true,
            passwordHash: true,
          },
          orderBy: { username: "asc" },
        },
      },
    }),
    db.menuItem.findMany({
      where: { venueId },
      include: {
        categories: { select: { categoryId: true } },
        modifierGroups: {
          include: {
            options: {
              orderBy: { sortOrder: "asc" },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  if (!venue) {
    throw new Error(`Venue not found: ${venueId}`);
  }

  const snapshot: SeedSnapshotData = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    venue: {
      id: venue.id,
      name: venue.name,
      slug: venue.slug,
      brandColor: venue.brandColor,
      welcomeMessage: venue.welcomeMessage,
      language: venue.language,
      currency: venue.currency,
      currencyLockedAt: venue.currencyLockedAt ? venue.currencyLockedAt.toISOString() : null,
      timezone: venue.timezone,
      timeFormat: venue.timeFormat,
      taxRateFallback: venue.taxRate.toFixed(4),
      taxRateId: venue.taxRateId,
      contactName: venue.contactName,
      contactPhone: venue.contactPhone,
      contactEmail: venue.contactEmail,
      counterPhone: venue.counterPhone,
      receiptHeader: venue.receiptHeader,
      receiptFooter: venue.receiptFooter,
      isActive: venue.isActive,
      modules: venue.modules.map((m) => ({ module: m.module, isEnabled: m.isEnabled })),
      services: venue.services.map((s) => ({ service: s.service, isEnabled: s.isEnabled })),
    },
    taxRates: venue.taxRates.map((tr) => ({
      id: tr.id,
      name: tr.name,
      rate: tr.rate.toFixed(4),
      isDefault: tr.isDefault,
      isActive: tr.isActive,
      isInclusive: tr.isInclusive,
    })),
    placeCategories: {
      tableCategories: venue.tableCategories.map((tc) => ({
        id: tc.id,
        name: tc.name,
        description: tc.description,
        isReserved: tc.isReserved,
        sortOrder: tc.sortOrder,
      })),
      roomCategories: venue.roomCategories.map((rc) => ({
        id: rc.id,
        name: rc.name,
        description: rc.description,
        basePrice: rc.basePrice.toFixed(2),
        sortOrder: rc.sortOrder,
      })),
    },
    places: {
      tables: venue.tables.map((t) => ({
        id: t.id,
        number: t.number,
        categoryId: t.categoryId,
        state: t.state,
        qrTokens: t.qrTokens.map((qt) => ({
          id: qt.id,
          token: qt.token,
          state: qt.state,
        })),
      })),
      rooms: venue.rooms.map((r) => ({
        id: r.id,
        number: r.number,
        categoryId: r.categoryId,
        state: r.state,
        qrTokens: r.qrTokens.map((qt) => ({
          id: qt.id,
          token: qt.token,
          state: qt.state,
        })),
      })),
      counter: venue.counter
        ? {
            id: venue.counter.id,
            name: venue.counter.name,
            qrTokens: venue.counter.qrTokens.map((qt) => ({
              id: qt.id,
              token: qt.token,
              state: qt.state,
            })),
          }
        : null,
    },
    menu: {
      categories: venue.menuCategories.map((mc) => ({
        id: mc.id,
        name: mc.name,
        sortOrder: mc.sortOrder,
        taxRateId: mc.taxRateId,
      })),
      items: menuItems.map((mi) => ({
        id: mi.id,
        name: mi.name,
        description: mi.description,
        price: mi.price.toFixed(2),
        state: mi.state,
        sortOrder: mi.sortOrder,
        taxRateId: mi.taxRateId,
        categoryIds: mi.categories.map((c) => c.categoryId),
        modifierGroups: mi.modifierGroups.map((mg) => ({
          id: mg.id,
          name: mg.name,
          choiceType: mg.choiceType,
          isRequired: mg.isRequired,
          sortOrder: mg.sortOrder,
          options: mg.options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            additionalPrice: opt.additionalPrice.toFixed(2),
            sortOrder: opt.sortOrder,
          })),
        })),
      })),
    },
    staff: venue.staffMembers.map((sm) => ({
      id: sm.id,
      name: sm.name,
      username: sm.username,
      roles: sm.roles,
      state: sm.state,
      passwordHash: sm.passwordHash,
    })),
  };

  return snapshot;
}

/**
 * Default location per D-8.6: backups/seed/seed-snapshot.json
 */
export const DEFAULT_SEED_SNAPSHOT_PATH = "backups/seed/seed-snapshot.json";

/**
 * Write snapshot JSON to filesystem atomically.
 */
export async function writeSeedSnapshot(
  db: PrismaClient,
  venueId: string,
  targetPath: string = DEFAULT_SEED_SNAPSHOT_PATH
): Promise<string> {
  const snapshot = await generateSeedSnapshot(db, venueId);
  const resolvedPath = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), targetPath);

  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, JSON.stringify(snapshot, null, 2), "utf8");
  return resolvedPath;
}

// In-memory debouncer map for D-8.6 (debounced to at most once per minute)
const debounceTimers = new Map<string, NodeJS.Timeout>();

export function triggerDebouncedSeedSnapshot(
  db: PrismaClient,
  venueId: string,
  delayMs = 2000
): void {
  const existing = debounceTimers.get(venueId);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    debounceTimers.delete(venueId);
    writeSeedSnapshot(db, venueId).catch((err) => {
      // Non-fatal background write failure: log error
      console.error(`[SeedSnapshot] Failed to write debounced seed snapshot for venue ${venueId}:`, err);
    });
  }, delayMs);

  debounceTimers.set(venueId, timer);
}
