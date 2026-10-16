/**
 * Database Seed Script — Task 2.3.1 (Milestone 2.3)
 *
 * Seeds the initial development venue (Juniper House) through the venue repository adapter.
 * Uses the production database client and pure domain interfaces; never imports the database client directly.
 *
 * Rules:
 * - Idempotent: safe to run multiple times without duplicating data or failing.
 * - Multi-tenant foundation: every subsequent entity in later seed tasks attaches to this venueId.
 * - Module configuration: Table, Room, and Counter enabled; Kitchen disabled.
 *
 * Reference: BUILD.md §9.4 (seed contents), BUILD.md §10.5 (running the seed), SYSTEM.md §11.1, D-10.1.
 */

import * as dotenv from "dotenv";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import { DomainErrorCode } from "@/domain/shared/result";
import { type CreateVenueInput } from "@/domain/organization/venue.repository";
import { TableState } from "@/domain/organization/table.repository";
import { RoomState } from "@/domain/organization/room.repository";
import { PlaceType, QrTokenState } from "@/domain/qr/qr-token.repository";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import {
  ModifierChoiceType,
  MenuItemState,
} from "@/domain/menu/menu.repository";

// Load environment variables from .env.local for standalone seed execution
dotenv.config({ path: ".env.local" });

export const SEED_VENUE: CreateVenueInput = {
  name: "Juniper House",
  slug: "juniper-house",
  brandColor: "#626542",
  welcomeMessage: "Everything you need is on this page.",
  language: "en",
  currency: "USD",
  taxRate: "0.1300",
  isActive: true,
  modules: ["TABLE", "ROOM", "COUNTER"],
  services: [
    "ROOM_SERVICE_FOOD",
    "HOUSEKEEPING",
    "MAINTENANCE",
    "CONCIERGE",
    "LAUNDRY",
    "SPA",
    "LATE_CHECKOUT",
    "WAKE_UP_CALL",
    "DO_NOT_DISTURB",
  ],
};

export const TABLE_NUMBERS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
];

export const ROOM_NUMBERS = [
  "401",
  "402",
  "403",
  "404",
  "411",
  "412",
  "413",
  "414",
];

/**
 * Resolves the seed venue by slug. If it exists, returns its ID.
 * If not, creates it via the venue repository and returns the newly generated ID.
 */
export async function seedVenue(): Promise<string> {
  const venueRepo = createPrismaVenueRepository(prisma);

  const existingResult = await venueRepo.findBySlug(SEED_VENUE.slug);
  if (existingResult.ok) {
    console.log(
      `Venue already exists: ${existingResult.value.slug} (id: ${existingResult.value.id})`
    );
    return existingResult.value.id;
  }

  if (existingResult.error.code === DomainErrorCode.NOT_FOUND) {
    const createResult = await venueRepo.create(SEED_VENUE);
    if (!createResult.ok) {
      console.error(
        `Failed to create venue: [${createResult.error.code}] ${createResult.error.message}`
      );
      throw new Error(createResult.error.message);
    }
    console.log(
      `Created venue: ${createResult.value.slug} (id: ${createResult.value.id})`
    );
    return createResult.value.id;
  }

  console.error(
    `Failed to resolve venue: [${existingResult.error.code}] ${existingResult.error.message}`
  );
  throw new Error(existingResult.error.message);
}

/**
 * Seeds tables and rooms for the specified venue.
 * Idempotent: checks for existence by (venueId, number) before creating.
 */
export async function seedTablesAndRooms(venueId: string): Promise<void> {
  console.log("Seeding tables and rooms...");
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  for (const number of TABLE_NUMBERS) {
    const existing = await tableRepo.findByNumber(venueId, number);
    if (existing.ok) {
      console.log(`Table ${number} already exists.`);
      continue;
    }

    if (existing.error.code === DomainErrorCode.NOT_FOUND) {
      const created = await tableRepo.create(venueId, {
        number,
        state: TableState.FREE,
      });
      if (!created.ok) {
        console.error(
          `Failed to create table ${number}: [${created.error.code}] ${created.error.message}`
        );
        throw new Error(created.error.message);
      }
      console.log(`Created table ${number} (id: ${created.value.id}).`);
      continue;
    }

    console.error(
      `Failed to query table ${number}: [${existing.error.code}] ${existing.error.message}`
    );
    throw new Error(existing.error.message);
  }

  for (const number of ROOM_NUMBERS) {
    const existing = await roomRepo.findByNumber(venueId, number);
    if (existing.ok) {
      console.log(`Room ${number} already exists.`);
      continue;
    }

    if (existing.error.code === DomainErrorCode.NOT_FOUND) {
      const created = await roomRepo.create(venueId, {
        number,
        state: RoomState.VACANT,
      });
      if (!created.ok) {
        console.error(
          `Failed to create room ${number}: [${created.error.code}] ${created.error.message}`
        );
        throw new Error(created.error.message);
      }
      console.log(`Created room ${number} (id: ${created.value.id}).`);
      continue;
    }

    console.error(
      `Failed to query room ${number}: [${existing.error.code}] ${existing.error.message}`
    );
    throw new Error(existing.error.message);
  }

  console.log(
    `Seeded ${TABLE_NUMBERS.length} tables and ${ROOM_NUMBERS.length} rooms.`
  );
}

/**
 * Seeds QR tokens for tables and rooms.
 * Idempotent: checks active tokens via listForVenue before generating.
 */
export async function seedQrTokens(venueId: string): Promise<void> {
  console.log("Seeding QR tokens...");
  const qrRepo = createPrismaQrTokenRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const activeTokensResult = await qrRepo.listForVenue(venueId, {
    state: QrTokenState.ACTIVE,
  });
  if (!activeTokensResult.ok) {
    console.error(
      `Failed to list QR tokens: [${activeTokensResult.error.code}] ${activeTokensResult.error.message}`
    );
    throw new Error(activeTokensResult.error.message);
  }

  const activePlaceIds = new Set<string>();
  for (const token of activeTokensResult.value) {
    if (token.placeType === PlaceType.TABLE && token.tableId) {
      activePlaceIds.add(token.tableId);
    } else if (token.placeType === PlaceType.ROOM && token.roomId) {
      activePlaceIds.add(token.roomId);
    }
  }

  let createdTablesCount = 0;
  for (const number of TABLE_NUMBERS) {
    const tableResult = await tableRepo.findByNumber(venueId, number);
    if (!tableResult.ok) {
      console.error(
        `Failed to resolve table ${number}: [${tableResult.error.code}] ${tableResult.error.message}`
      );
      throw new Error(tableResult.error.message);
    }

    const table = tableResult.value;
    if (activePlaceIds.has(table.id)) {
      console.log(`Table ${number} already has an active token.`);
      continue;
    }

    const generateResult = await qrRepo.generate({
      venueId,
      placeType: PlaceType.TABLE,
      tableId: table.id,
    });
    if (!generateResult.ok) {
      console.error(
        `Failed to generate token for table ${number}: [${generateResult.error.code}] ${generateResult.error.message}`
      );
      throw new Error(generateResult.error.message);
    }
    console.log(
      `Created token for table ${number}: ${generateResult.value.token}.`
    );
    createdTablesCount++;
  }

  let createdRoomsCount = 0;
  for (const number of ROOM_NUMBERS) {
    const roomResult = await roomRepo.findByNumber(venueId, number);
    if (!roomResult.ok) {
      console.error(
        `Failed to resolve room ${number}: [${roomResult.error.code}] ${roomResult.error.message}`
      );
      throw new Error(roomResult.error.message);
    }

    const room = roomResult.value;
    if (activePlaceIds.has(room.id)) {
      console.log(`Room ${number} already has an active token.`);
      continue;
    }

    const generateResult = await qrRepo.generate({
      venueId,
      placeType: PlaceType.ROOM,
      roomId: room.id,
    });
    if (!generateResult.ok) {
      console.error(
        `Failed to generate token for room ${number}: [${generateResult.error.code}] ${generateResult.error.message}`
      );
      throw new Error(generateResult.error.message);
    }
    console.log(
      `Created token for room ${number}: ${generateResult.value.token}.`
    );
    createdRoomsCount++;
  }

  if (createdTablesCount === 0 && createdRoomsCount === 0) {
    console.log(
      "Seeded 0 table tokens and 0 room tokens; all places already have active tokens."
    );
  } else {
    console.log(
      `Seeded ${createdTablesCount} table tokens and ${createdRoomsCount} room tokens.`
    );
  }
}

async function seedMenu(venueId: string): Promise<void> {
  console.log("Seeding menu...");

  const menuRepo = createPrismaMenuRepository(prisma);

  // --- Categories ---
  // Read once, filter in memory. Do not query per category.

  const categoryDefs = [
    { name: "Starters", sortOrder: 1 },
    { name: "Mains", sortOrder: 2 },
    { name: "Desserts", sortOrder: 3 },
  ];

  const categoryIds: Record<string, string> = {};

  const existingCategoriesResult = await menuRepo.listCategories(venueId);

  if (!existingCategoriesResult.ok) {
    console.error(
      `Failed to list categories: ${existingCategoriesResult.error.code} — ${existingCategoriesResult.error.message}`,
    );
    throw new Error("Category listing failed");
  }

  const existingCategoriesByName = new Map<string, { id: string }>();
  for (const c of existingCategoriesResult.value) {
    existingCategoriesByName.set(c.name, { id: c.id });
  }

  for (const def of categoryDefs) {
    const existing = existingCategoriesByName.get(def.name);

    if (existing) {
      console.log(`Category ${def.name} already exists.`);
      categoryIds[def.name] = existing.id;
      continue;
    }

    const created = await menuRepo.createCategory({
      venueId,
      name: def.name,
      sortOrder: def.sortOrder,
    });

    if (!created.ok) {
      console.error(
        `Failed to create category ${def.name}: ${created.error.code} — ${created.error.message}`,
      );
      throw new Error(`Category creation failed: ${def.name}`);
    }

    console.log(`Created category ${def.name} (id: ${created.value.id}).`);
    categoryIds[def.name] = created.value.id;
  }

  // --- Menu items ---
  // Read once per category, filter in memory. Do not query per item.

  const itemDefs = [
    // Starters
    {
      name: "Soup of the Day",
      description: "Chef's daily soup, served with warm bread.",
      price: "6.50",
      category: "Starters",
    },
    {
      name: "Garden Salad",
      description: "Mixed greens, cherry tomatoes, cucumber, house vinaigrette.",
      price: "7.00",
      category: "Starters",
    },
    {
      name: "Bruschetta",
      description: "Toasted sourdough, marinated tomatoes, basil, olive oil.",
      price: "8.00",
      category: "Starters",
    },
    // Mains
    {
      name: "Grilled Salmon",
      description: "Atlantic salmon, seasonal vegetables, lemon butter.",
      price: "24.00",
      category: "Mains",
    },
    {
      name: "Ribeye Steak",
      description: "300g ribeye, roasted potatoes, red wine jus.",
      price: "32.00",
      category: "Mains",
    },
    {
      name: "Mushroom Risotto",
      description: "Arborio rice, wild mushrooms, parmesan, truffle oil.",
      price: "19.00",
      category: "Mains",
    },
    {
      name: "Roast Chicken",
      description: "Half chicken, herb butter, root vegetables.",
      price: "22.00",
      category: "Mains",
    },
    // Desserts
    {
      name: "Chocolate Cake",
      description: "Warm flourless chocolate cake, vanilla ice cream.",
      price: "9.00",
      category: "Desserts",
    },
    {
      name: "Crème Brûlée",
      description: "Vanilla bean custard, caramelized sugar crust.",
      price: "8.50",
      category: "Desserts",
    },
    {
      name: "Seasonal Fruit Plate",
      description: "Fresh fruit, mint, lime.",
      price: "7.50",
      category: "Desserts",
    },
  ];

  const itemIds: Record<string, string> = {};

  // Group the item definitions by category name so we query each category once.
  const itemsByCategory = new Map<string, typeof itemDefs>();
  for (const def of itemDefs) {
    const list = itemsByCategory.get(def.category) ?? [];
    list.push(def);
    itemsByCategory.set(def.category, list);
  }

  for (const [categoryName, defs] of itemsByCategory) {
    const categoryId = categoryIds[categoryName];
    if (!categoryId) {
      console.error(`Category ${categoryName} not resolved before item seeding.`);
      throw new Error(`Category missing: ${categoryName}`);
    }

    const existingItemsResult = await menuRepo.listItemsForCategory(
      venueId,
      categoryId,
    );

    if (!existingItemsResult.ok) {
      console.error(
        `Failed to list items for category ${categoryName}: ${existingItemsResult.error.code} — ${existingItemsResult.error.message}`,
      );
      throw new Error(`Item listing failed for category ${categoryName}`);
    }

    const existingItemsByName = new Map<string, { id: string }>();
    for (const it of existingItemsResult.value) {
      existingItemsByName.set(it.name, { id: it.id });
    }

    for (const def of defs) {
      const existing = existingItemsByName.get(def.name);

      if (existing) {
        console.log(`Item ${def.name} already exists.`);
        itemIds[def.name] = existing.id;
        continue;
      }

      const created = await menuRepo.createItem({
        venueId,
        categoryId,
        name: def.name,
        description: def.description,
        price: def.price,
      });

      if (!created.ok) {
        console.error(
          `Failed to create item ${def.name}: ${created.error.code} — ${created.error.message}`,
        );
        throw new Error(`Item creation failed: ${def.name}`);
      }

      console.log(`Created item ${def.name} (id: ${created.value.id}).`);
      itemIds[def.name] = created.value.id;
    }
  }

  // --- Modifier groups and their options ---
  // Read once per item via getItemWithModifiers, filter in memory.

  const groupDefs = [
    {
      item: "Ribeye Steak",
      name: "Doneness",
      choiceType: ModifierChoiceType.SINGLE,
      isRequired: true,
      options: [
        { name: "Rare", additionalPrice: "0.00" },
        { name: "Medium", additionalPrice: "0.00" },
        { name: "Well", additionalPrice: "0.00" },
      ],
    },
    {
      item: "Grilled Salmon",
      name: "Extras",
      choiceType: ModifierChoiceType.MULTIPLE,
      isRequired: false,
      options: [
        { name: "Extra cheese", additionalPrice: "1.50" },
        { name: "Bacon", additionalPrice: "2.00" },
        { name: "Avocado", additionalPrice: "1.75" },
      ],
    },
  ];

  for (const groupDef of groupDefs) {
    const itemId = itemIds[groupDef.item];
    if (!itemId) {
      console.error(
        `Item ${groupDef.item} not resolved before modifier group seeding.`,
      );
      throw new Error(`Item missing: ${groupDef.item}`);
    }

    const itemWithModifiers = await menuRepo.getItemWithModifiers(
      venueId,
      itemId,
    );

    if (!itemWithModifiers.ok) {
      console.error(
        `Failed to read item ${groupDef.item} with modifiers: ${itemWithModifiers.error.code} — ${itemWithModifiers.error.message}`,
      );
      throw new Error(`Item modifier read failed: ${groupDef.item}`);
    }

    const existingGroupsByName = new Map<
      string,
      { id: string; options: { name: string }[] }
    >();
    for (const g of itemWithModifiers.value.modifierGroups ?? []) {
      existingGroupsByName.set(g.name, {
        id: g.id,
        options: (g.options ?? []).map((o) => ({ name: o.name })),
      });
    }

    const existingGroup = existingGroupsByName.get(groupDef.name);

    let groupId: string;

    if (existingGroup) {
      console.log(`Modifier group ${groupDef.name} already exists.`);
      groupId = existingGroup.id;
    } else {
      const createdGroup = await menuRepo.createModifierGroup({
        menuItemId: itemId,
        name: groupDef.name,
        choiceType: groupDef.choiceType,
        isRequired: groupDef.isRequired,
      });

      if (!createdGroup.ok) {
        console.error(
          `Failed to create modifier group ${groupDef.name}: ${createdGroup.error.code} — ${createdGroup.error.message}`,
        );
        throw new Error(`Modifier group creation failed: ${groupDef.name}`);
      }

      console.log(
        `Created modifier group ${groupDef.name} (id: ${createdGroup.value.id}).`,
      );
      groupId = createdGroup.value.id;
    }

    const existingOptionsForGroup =
      existingGroup?.options?.map((o) => o.name) ?? [];
    const existingOptionsSet = new Set(existingOptionsForGroup);

    for (const optDef of groupDef.options) {
      if (existingOptionsSet.has(optDef.name)) {
        console.log(
          `Modifier option ${groupDef.name}/${optDef.name} already exists.`,
        );
        continue;
      }

      const createdOption = await menuRepo.createModifierOption({
        modifierGroupId: groupId,
        name: optDef.name,
        additionalPrice: optDef.additionalPrice,
      });

      if (!createdOption.ok) {
        console.error(
          `Failed to create modifier option ${optDef.name}: ${createdOption.error.code} — ${createdOption.error.message}`,
        );
        throw new Error(`Modifier option creation failed: ${optDef.name}`);
      }

      console.log(`Created modifier option ${groupDef.name}/${optDef.name}.`);
    }
  }

  console.log(
    `Seeded ${categoryDefs.length} categories, ${itemDefs.length} items, ${groupDefs.length} modifier groups.`,
  );
}

async function main(): Promise<void> {
  console.log("Seed starting.");
  const venueId = await seedVenue();
  await seedTablesAndRooms(venueId);
  await seedQrTokens(venueId);
  await seedMenu(venueId);
  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
