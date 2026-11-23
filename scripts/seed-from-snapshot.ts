/**
 * Seed from disaster-recovery snapshot script (D-8.6).
 *
 * Restores an operational venue configuration from a JSON snapshot in under 60s.
 * Usage: pnpm seed:from-snapshot [path/to/snapshot.json]
 */

import fs from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

import { type SeedSnapshotData, DEFAULT_SEED_SNAPSHOT_PATH } from "../src/domain/settings/seed-snapshot";
import { Prisma } from "@prisma/client";

async function main() {
  const { prisma } = await import("../src/infrastructure/db/client");
  const targetPath = process.argv[2] || DEFAULT_SEED_SNAPSHOT_PATH;
  const resolvedPath = path.isAbsolute(targetPath)
    ? targetPath
    : path.resolve(process.cwd(), targetPath);

  console.log(`[SeedRestore] Reading snapshot from: ${resolvedPath}`);

  let content: string;
  try {
    content = await fs.readFile(resolvedPath, "utf8");
  } catch (err: any) {
    console.error(`[SeedRestore] Error: Could not read snapshot file at ${resolvedPath}:`, err.message);
    process.exit(1);
  }

  const snapshot: SeedSnapshotData = JSON.parse(content);
  console.log(`[SeedRestore] Restoring venue '${snapshot.venue.name}' (${snapshot.venue.slug})...`);

  // Restore Venue
  const venue = await prisma.venue.upsert({
    where: { id: snapshot.venue.id },
    create: {
      id: snapshot.venue.id,
      name: snapshot.venue.name,
      slug: snapshot.venue.slug,
      brandColor: snapshot.venue.brandColor ?? "#1a1a1a",
      welcomeMessage: snapshot.venue.welcomeMessage ?? "Welcome",
      language: snapshot.venue.language ?? "en",
      currency: snapshot.venue.currency ?? "NPR",
      timezone: snapshot.venue.timezone ?? "Asia/Kathmandu",
      timeFormat: snapshot.venue.timeFormat ?? "12h",
      taxRate: new Prisma.Decimal(snapshot.venue.taxRateFallback ?? "0.1300"),
      contactName: snapshot.venue.contactName,
      contactPhone: snapshot.venue.contactPhone,
      contactEmail: snapshot.venue.contactEmail,
      counterPhone: snapshot.venue.counterPhone,
      receiptHeader: snapshot.venue.receiptHeader,
      receiptFooter: snapshot.venue.receiptFooter,
      currencyLockedAt: snapshot.venue.currencyLockedAt ? new Date(snapshot.venue.currencyLockedAt) : null,
      isActive: snapshot.venue.isActive,
    },
    update: {
      name: snapshot.venue.name,
      slug: snapshot.venue.slug,
      brandColor: snapshot.venue.brandColor ?? "#1a1a1a",
      welcomeMessage: snapshot.venue.welcomeMessage ?? "Welcome",
      language: snapshot.venue.language ?? "en",
      currency: snapshot.venue.currency ?? "NPR",
      timezone: snapshot.venue.timezone ?? "Asia/Kathmandu",
      timeFormat: snapshot.venue.timeFormat ?? "12h",
      taxRate: new Prisma.Decimal(snapshot.venue.taxRateFallback ?? "0.1300"),
      contactName: snapshot.venue.contactName,
      contactPhone: snapshot.venue.contactPhone,
      contactEmail: snapshot.venue.contactEmail,
      counterPhone: snapshot.venue.counterPhone,
      receiptHeader: snapshot.venue.receiptHeader,
      receiptFooter: snapshot.venue.receiptFooter,
      currencyLockedAt: snapshot.venue.currencyLockedAt ? new Date(snapshot.venue.currencyLockedAt) : null,
      isActive: snapshot.venue.isActive,
    },
  });

  // Restore Tax Rates
  for (const tr of snapshot.taxRates) {
    await prisma.taxRate.upsert({
      where: { id: tr.id },
      create: {
        id: tr.id,
        venueId: venue.id,
        name: tr.name,
        rate: new Prisma.Decimal(tr.rate),
        isDefault: tr.isDefault,
        isActive: tr.isActive,
        isInclusive: tr.isInclusive,
      },
      update: {
        name: tr.name,
        rate: new Prisma.Decimal(tr.rate),
        isDefault: tr.isDefault,
        isActive: tr.isActive,
        isInclusive: tr.isInclusive,
      },
    });
  }

  if (snapshot.venue.taxRateId) {
    await prisma.venue.update({
      where: { id: venue.id },
      data: { defaultTaxRate: { connect: { id: snapshot.venue.taxRateId } } },
    });
  }

  // Restore Module and Service Toggles
  for (const m of snapshot.venue.modules) {
    await prisma.venueModuleToggle.upsert({
      where: { venueId_module: { venueId: venue.id, module: m.module as any } },
      create: { venueId: venue.id, module: m.module as any, isEnabled: m.isEnabled },
      update: { isEnabled: m.isEnabled },
    });
  }

  for (const s of snapshot.venue.services) {
    await prisma.venueServiceToggle.upsert({
      where: { venueId_service: { venueId: venue.id, service: s.service as any } },
      create: { venueId: venue.id, service: s.service as any, isEnabled: s.isEnabled },
      update: { isEnabled: s.isEnabled },
    });
  }

  // Restore Place Categories
  for (const tc of snapshot.placeCategories.tableCategories) {
    await prisma.tableCategory.upsert({
      where: { id: tc.id },
      create: {
        id: tc.id,
        venueId: venue.id,
        name: tc.name,
        description: tc.description,
        isReserved: tc.isReserved,
        sortOrder: tc.sortOrder,
      },
      update: {
        name: tc.name,
        description: tc.description,
        isReserved: tc.isReserved,
        sortOrder: tc.sortOrder,
      },
    });
  }

  for (const rc of snapshot.placeCategories.roomCategories) {
    await prisma.roomCategory.upsert({
      where: { id: rc.id },
      create: {
        id: rc.id,
        venueId: venue.id,
        name: rc.name,
        description: rc.description,
        basePrice: new Prisma.Decimal(rc.basePrice),
        sortOrder: rc.sortOrder,
      },
      update: {
        name: rc.name,
        description: rc.description,
        basePrice: new Prisma.Decimal(rc.basePrice),
        sortOrder: rc.sortOrder,
      },
    });
  }

  // Restore Tables & Tokens
  for (const t of snapshot.places.tables) {
    await prisma.table.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        venueId: venue.id,
        number: t.number,
        categoryId: t.categoryId,
        state: t.state as any,
      },
      update: {
        number: t.number,
        categoryId: t.categoryId,
        state: t.state as any,
      },
    });
    for (const qt of t.qrTokens) {
      await prisma.qrToken.upsert({
        where: { id: qt.id },
        create: {
          id: qt.id,
          venueId: venue.id,
          token: qt.token,
          placeType: "TABLE",
          tableId: t.id,
          state: qt.state as any,
        },
        update: {
          token: qt.token,
          state: qt.state as any,
        },
      });
    }
  }

  // Restore Rooms & Tokens
  for (const r of snapshot.places.rooms) {
    await prisma.room.upsert({
      where: { id: r.id },
      create: {
        id: r.id,
        venueId: venue.id,
        number: r.number,
        categoryId: r.categoryId,
        state: r.state as any,
      },
      update: {
        number: r.number,
        categoryId: r.categoryId,
        state: r.state as any,
      },
    });
    for (const qt of r.qrTokens) {
      await prisma.qrToken.upsert({
        where: { id: qt.id },
        create: {
          id: qt.id,
          venueId: venue.id,
          token: qt.token,
          placeType: "ROOM",
          roomId: r.id,
          state: qt.state as any,
        },
        update: {
          token: qt.token,
          state: qt.state as any,
        },
      });
    }
  }

  // Restore Counter & Tokens
  if (snapshot.places.counter) {
    const c = snapshot.places.counter;
    await prisma.counter.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        venueId: venue.id,
        name: c.name,
      },
      update: {
        name: c.name,
      },
    });
    for (const qt of c.qrTokens) {
      await prisma.qrToken.upsert({
        where: { id: qt.id },
        create: {
          id: qt.id,
          venueId: venue.id,
          token: qt.token,
          placeType: "COUNTER",
          counterId: c.id,
          state: qt.state as any,
        },
        update: {
          token: qt.token,
          state: qt.state as any,
        },
      });
    }
  }

  // Restore Menu Categories
  for (const mc of snapshot.menu.categories) {
    await prisma.menuCategory.upsert({
      where: { id: mc.id },
      create: {
        id: mc.id,
        venueId: venue.id,
        name: mc.name,
        sortOrder: mc.sortOrder,
        taxRateId: mc.taxRateId,
      },
      update: {
        name: mc.name,
        sortOrder: mc.sortOrder,
        taxRateId: mc.taxRateId,
      },
    });
  }

  // Restore Menu Items, Modifiers
  for (const mi of snapshot.menu.items) {
    await prisma.menuItem.upsert({
      where: { id: mi.id },
      create: {
        id: mi.id,
        venueId: venue.id,
        name: mi.name,
        description: mi.description,
        price: new Prisma.Decimal(mi.price),
        state: mi.state as any,
        sortOrder: mi.sortOrder,
        taxRateId: mi.taxRateId,
      },
      update: {
        name: mi.name,
        description: mi.description,
        price: new Prisma.Decimal(mi.price),
        state: mi.state as any,
        sortOrder: mi.sortOrder,
        taxRateId: mi.taxRateId,
      },
    });

    for (const catId of mi.categoryIds) {
      await prisma.menuItemCategory.upsert({
        where: {
          menuItemId_categoryId: {
            menuItemId: mi.id,
            categoryId: catId,
          },
        },
        create: {
          venueId: venue.id,
          menuItemId: mi.id,
          categoryId: catId,
        },
        update: {},
      });
    }

    for (const mg of mi.modifierGroups) {
      await prisma.modifierGroup.upsert({
        where: { id: mg.id },
        create: {
          id: mg.id,
          menuItemId: mi.id,
          name: mg.name,
          choiceType: mg.choiceType as any,
          isRequired: mg.isRequired,
          sortOrder: mg.sortOrder,
        },
        update: {
          name: mg.name,
          choiceType: mg.choiceType as any,
          isRequired: mg.isRequired,
          sortOrder: mg.sortOrder,
        },
      });

      for (const opt of mg.options) {
        await prisma.modifierOption.upsert({
          where: { id: opt.id },
          create: {
            id: opt.id,
            modifierGroupId: mg.id,
            name: opt.name,
            additionalPrice: new Prisma.Decimal(opt.additionalPrice),
            sortOrder: opt.sortOrder,
          },
          update: {
            name: opt.name,
            additionalPrice: new Prisma.Decimal(opt.additionalPrice),
            sortOrder: opt.sortOrder,
          },
        });
      }
    }
  }

  // Restore Staff
  for (const sm of snapshot.staff) {
    await prisma.staffMember.upsert({
      where: { id: sm.id },
      create: {
        id: sm.id,
        venueId: venue.id,
        name: sm.name,
        username: sm.username,
        roles: sm.roles as any,
        state: sm.state as any,
        passwordHash: sm.passwordHash,
      },
      update: {
        name: sm.name,
        username: sm.username,
        roles: sm.roles as any,
        state: sm.state as any,
        passwordHash: sm.passwordHash,
      },
    });
  }

  console.log(`[SeedRestore] Success! Restored:`);
  console.log(` - 1 venue: ${venue.name}`);
  console.log(` - ${snapshot.taxRates.length} tax rates`);
  console.log(` - ${snapshot.places.tables.length} tables, ${snapshot.places.rooms.length} rooms`);
  console.log(` - ${snapshot.menu.categories.length} menu categories, ${snapshot.menu.items.length} items`);
  console.log(` - ${snapshot.staff.length} staff accounts`);
}

main()
  .catch((e) => {
    console.error("[SeedRestore] Fatal error during restore:", e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/infrastructure/db/client");
    await prisma.$disconnect();
  });
