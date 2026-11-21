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
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";

// Environment variables from .env.local are loaded via ./seed-env above

export const SEED_VENUE: CreateVenueInput = {
  name: "Juniper House",
  slug: "juniper-house",
  brandColor: "#626542",
  welcomeMessage: "Everything you need is on this page.",
  language: "en",
  currency: "NPR",
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
  counter: { name: "Counter" },
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
 * Resolves the seed venue by slug. If it exists, returns its ID and counter ID.
 * If not, creates it via the venue repository and returns the newly generated IDs.
 */
export async function seedVenue(): Promise<{
  venueId: string;
  counterId: string;
}> {
  const venueRepo = createPrismaVenueRepository(prisma);

  const existingResult = await venueRepo.findBySlug(SEED_VENUE.slug);
  if (existingResult.ok) {
    console.log(
      `Venue already exists: ${existingResult.value.slug} (id: ${existingResult.value.id})`
    );

    // Re-sync the developer-managed venue configuration. The seed is the
    // source of truth for the venue's configuration (D-9.6); the currency
    // is one of those fields. When the seed's SEED_VENUE.currency changes
    // (e.g., "USD" -> "NPR"), the existing row must be updated on the
    // next seed run. Without this, the row keeps its original value.
    //
    // The direct prisma.venue.update is deliberate: the seed is the
    // only writer of the venue's configuration today. When Phase 8.7
    // adds the runtime update path (PATCH /api/admin/settings ->
    // venueRepo.update), this call is refactored to use the port.
    // See DECISIONS.md D-9.6, BUILD.md §9.4 (the seed is idempotent).
    try {
      await prisma.venue.update({
        where: { slug: SEED_VENUE.slug },
        data: { currency: SEED_VENUE.currency },
      });
      console.log(
        `Venue currency re-synced: ${SEED_VENUE.slug} -> ${SEED_VENUE.currency}`
      );
    } catch (error) {
      console.error(
        `Failed to re-sync venue currency: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }

    const counterId = existingResult.value.counter?.id;
    if (!counterId) {
      throw new Error(`Venue ${existingResult.value.slug} has no counter`);
    }
    return { venueId: existingResult.value.id, counterId };
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
    const counterId = createResult.value.counter?.id;
    if (!counterId) {
      throw new Error(
        `Created venue ${createResult.value.slug} has no counter`
      );
    }
    return { venueId: createResult.value.id, counterId };
  }

  console.error(
    `Failed to resolve venue: [${existingResult.error.code}] ${existingResult.error.message}`
  );
  throw new Error(existingResult.error.message);
}

const SEED_TABLE_CATEGORIES = [
  {
    name: "Indoor Dining",
    description: "Main indoor dining hall",
    isReserved: false,
    sortOrder: 0,
  },
  {
    name: "Patio & Garden",
    description: "Open-air patio and garden seating",
    isReserved: false,
    sortOrder: 1,
  },
  {
    name: "VIP Lounge",
    description: "Exclusive private VIP dining section",
    isReserved: false,
    sortOrder: 2,
  },
  {
    name: "Reserved",
    description: "Designated reserved tables for bookings and VIP guests",
    isReserved: true,
    sortOrder: 3,
  },
];

const SEED_ROOM_CATEGORIES = [
  {
    name: "NON AC",
    description: "Standard comfort room with fresh mountain ventilation",
    basePrice: "1200.00",
    sortOrder: 0,
  },
  {
    name: "AC",
    description: "Climate-controlled room with modern air conditioning",
    basePrice: "1800.00",
    sortOrder: 1,
  },
  {
    name: "DELUXE",
    description: "Spacious deluxe room with premium furnishings",
    basePrice: "2500.00",
    sortOrder: 2,
  },
  {
    name: "SUPER DELUXE",
    description: "Luxury super deluxe room with private balcony view",
    basePrice: "3500.00",
    sortOrder: 3,
  },
  {
    name: "DOUBLE BED ROOM NON AC",
    description: "Two double beds room with scenic window",
    basePrice: "2000.00",
    sortOrder: 4,
  },
  {
    name: "DOUBLE BED ROOM AC",
    description: "Two double beds room with central air conditioning",
    basePrice: "2800.00",
    sortOrder: 5,
  },
  {
    name: "ROOM FOR GROUP",
    description: "Spacious multi-guest suite ideal for families and touring groups",
    basePrice: "4500.00",
    sortOrder: 6,
  },
  {
    name: "NIGHT SUITES",
    description: "Executive honeymoon and luxury suite with private lounge",
    basePrice: "6000.00",
    sortOrder: 7,
  },
];

/**
 * Seeds tables, rooms, and their categories for the specified venue.
 * Idempotent: checks for existence before creating, updates categories.
 */
export async function seedTablesAndRooms(venueId: string): Promise<void> {
  console.log("Seeding table and room categories...");

  const tableCategoryMap = new Map<string, string>();
  for (const cat of SEED_TABLE_CATEGORIES) {
    const tableCat = await prisma.tableCategory.upsert({
      where: {
        venueId_name: {
          venueId,
          name: cat.name,
        },
      },
      update: {
        description: cat.description,
        isReserved: cat.isReserved,
        sortOrder: cat.sortOrder,
      },
      create: {
        venueId,
        name: cat.name,
        description: cat.description,
        isReserved: cat.isReserved,
        sortOrder: cat.sortOrder,
      },
    });
    tableCategoryMap.set(cat.name, tableCat.id);
  }

  const roomCategoryMap = new Map<string, string>();
  for (const cat of SEED_ROOM_CATEGORIES) {
    const roomCat = await prisma.roomCategory.upsert({
      where: {
        venueId_name: {
          venueId,
          name: cat.name,
        },
      },
      update: {
        description: cat.description,
        basePrice: cat.basePrice,
        sortOrder: cat.sortOrder,
      },
      create: {
        venueId,
        name: cat.name,
        description: cat.description,
        basePrice: cat.basePrice,
        sortOrder: cat.sortOrder,
      },
    });
    roomCategoryMap.set(cat.name, roomCat.id);
  }

  console.log("Seeding tables and rooms...");
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  // Table category assignments
  const getTableCategoryName = (num: string): string => {
    const n = parseInt(num, 10);
    if (n >= 1 && n <= 6) return "Indoor Dining";
    if (n >= 7 && n <= 10) return "Patio & Garden";
    if (n === 11) return "VIP Lounge";
    return "Reserved"; // Table 12
  };

  for (const number of TABLE_NUMBERS) {
    const categoryName = getTableCategoryName(number);
    const categoryId = tableCategoryMap.get(categoryName);

    const existing = await tableRepo.findByNumber(venueId, number);
    if (existing.ok) {
      if (categoryId && existing.value.categoryId !== categoryId) {
        await prisma.table.update({
          where: { id: existing.value.id },
          data: { categoryId },
        });
      }
      console.log(`Table ${number} already exists (category: ${categoryName}).`);
      continue;
    }

    if (existing.error.code === DomainErrorCode.NOT_FOUND) {
      const created = await tableRepo.create(venueId, {
        number,
        categoryId,
        state: TableState.FREE,
      });
      if (!created.ok) {
        console.error(
          `Failed to create table ${number}: [${created.error.code}] ${created.error.message}`
        );
        throw new Error(created.error.message);
      }
      console.log(`Created table ${number} (id: ${created.value.id}, category: ${categoryName}).`);
      continue;
    }

    console.error(
      `Failed to query table ${number}: [${existing.error.code}] ${existing.error.message}`
    );
    throw new Error(existing.error.message);
  }

  // Room category assignments
  const getRoomCategoryName = (num: string): string => {
    switch (num) {
      case "401": return "SUPER DELUXE";
      case "402": return "DELUXE";
      case "403": return "AC";
      case "404": return "NON AC";
      case "411": return "DOUBLE BED ROOM AC";
      case "412": return "DOUBLE BED ROOM NON AC";
      case "413": return "ROOM FOR GROUP";
      case "414": return "NIGHT SUITES";
      default: return "DELUXE";
    }
  };

  for (const number of ROOM_NUMBERS) {
    const categoryName = getRoomCategoryName(number);
    const categoryId = roomCategoryMap.get(categoryName);

    const existing = await roomRepo.findByNumber(venueId, number);
    if (existing.ok) {
      if (categoryId && existing.value.categoryId !== categoryId) {
        await prisma.room.update({
          where: { id: existing.value.id },
          data: { categoryId },
        });
      }
      console.log(`Room ${number} already exists (category: ${categoryName}).`);
      continue;
    }

    if (existing.error.code === DomainErrorCode.NOT_FOUND) {
      const created = await roomRepo.create(venueId, {
        number,
        categoryId,
        state: RoomState.VACANT,
      });
      if (!created.ok) {
        console.error(
          `Failed to create room ${number}: [${created.error.code}] ${created.error.message}`
        );
        throw new Error(created.error.message);
      }
      console.log(`Created room ${number} (id: ${created.value.id}, category: ${categoryName}).`);
      continue;
    }

    console.error(
      `Failed to query room ${number}: [${existing.error.code}] ${existing.error.message}`
    );
    throw new Error(existing.error.message);
  }

  console.log(
    `Seeded ${TABLE_NUMBERS.length} tables and ${ROOM_NUMBERS.length} rooms with categories.`
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

/**
 * Seeds a QR token for the counter.
 * Idempotent: checks for active counter token via listForVenue before generating.
 */
export async function seedCounter(
  venueId: string,
  counterId: string
): Promise<void> {
  const qrRepo = createPrismaQrTokenRepository(prisma);

  const activeTokensResult = await qrRepo.listForVenue(venueId, {
    state: QrTokenState.ACTIVE,
  });
  if (!activeTokensResult.ok) {
    console.error(
      `Failed to list QR tokens: [${activeTokensResult.error.code}] ${activeTokensResult.error.message}`
    );
    return;
  }

  const hasActiveCounterToken = activeTokensResult.value.some(
    (token) =>
      token.placeType === PlaceType.COUNTER && token.counterId === counterId
  );

  if (hasActiveCounterToken) {
    console.log("Counter already has an active token.");
    return;
  }

  const generateResult = await qrRepo.generate({
    venueId,
    placeType: PlaceType.COUNTER,
    counterId,
  });

  if (!generateResult.ok) {
    console.error(
      `Failed to generate token for counter: [${generateResult.error.code}] ${generateResult.error.message}`
    );
    return;
  }

  console.log(`Created token for counter: ${generateResult.value.token}.`);
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
    { name: "Breakfast", sortOrder: 4 },
    { name: "Chinese", sortOrder: 5 },
    { name: "Tihar Special", sortOrder: 6 },
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
  // Read existing items for the venue once.

  const itemDefs = [
    // Starters — Steam Momo is multi-category (Starters + Chinese + Tihar Special)
    {
      name: "Steam Momo",
      description: "Ten pieces, chicken or veg, with the tomato achar.",
      price: "8.00",
      categories: ["Starters", "Chinese", "Tihar Special"],
    },
    {
      name: "Chicken Sekuwa",
      description: "Grilled chicken skewers, the timur pepper, the lemon.",
      price: "9.50",
      categories: ["Starters"],
    },
    {
      name: "Aloo Tama",
      description: "The bamboo shoot, the potato, the black-eyed pea, the tangy soup.",
      price: "7.00",
      categories: ["Starters"],
    },
    // Mains
    {
      name: "Dal Bhat",
      description: "The lentil soup, the steamed rice, the seasonal tarkari, the achar.",
      price: "12.00",
      categories: ["Mains", "Tihar Special"],
    },
    {
      name: "Chicken Chowmein",
      description: "The stir-fried noodles, the seasonal vegetables, the soy.",
      price: "10.00",
      categories: ["Mains", "Chinese"],
    },
    {
      name: "Thukpa",
      description: "The Tibetan noodle soup, the chicken broth, the greens.",
      price: "11.00",
      categories: ["Mains", "Chinese"],
    },
    {
      name: "Gundruk Ko Jhol",
      description: "The fermented greens, the tomato, the dried chili.",
      price: "8.50",
      categories: ["Mains"],
    },
    // Breakfast
    {
      name: "Sel Roti",
      description: "The ring-shaped rice bread, the sesame, the ghee.",
      price: "4.00",
      categories: ["Breakfast", "Tihar Special"],
    },
    {
      name: "Aloo Paratha",
      description: "The spiced potato flatbread, the curd, the pickle.",
      price: "5.50",
      categories: ["Breakfast"],
    },
    // Desserts
    {
      name: "Kheer",
      description: "The rice pudding, the cardamom, the almond.",
      price: "5.00",
      categories: ["Desserts", "Tihar Special"],
    },
    {
      name: "Juju Dhau",
      description: "The king curd, the honey, the pistachio.",
      price: "6.00",
      categories: ["Desserts"],
    },
    {
      name: "Lassi",
      description: "The sweet yogurt drink, the cardamom.",
      price: "4.50",
      categories: ["Desserts", "Breakfast"],
    },
  ];

  const itemIds: Record<string, string> = {};

  const existingItemsResult = await menuRepo.listItems(venueId);
  if (!existingItemsResult.ok) {
    console.error(
      `Failed to list items for venue: ${existingItemsResult.error.code} — ${existingItemsResult.error.message}`,
    );
    throw new Error("Item listing failed for venue");
  }

  const existingItemsByName = new Map<string, { id: string }>();
  for (const it of existingItemsResult.value) {
    existingItemsByName.set(it.name, { id: it.id });
  }

  for (const def of itemDefs) {
    const existing = existingItemsByName.get(def.name);

    if (existing) {
      console.log(`Item ${def.name} already exists.`);
      itemIds[def.name] = existing.id;
      continue;
    }

    const targetCategoryIds = def.categories.map((cName) => {
      const id = categoryIds[cName];
      if (!id) {
        throw new Error(`Category ${cName} not found in categoryIds map`);
      }
      return id;
    });

    const created = await menuRepo.createItem({
      venueId,
      categoryIds: targetCategoryIds,
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

  // --- Modifier groups and their options ---
  // Read once per item via getItemWithModifiers, filter in memory.

  const groupDefs = [
    {
      item: "Steam Momo",
      name: "Style",
      choiceType: ModifierChoiceType.SINGLE,
      isRequired: true,
      options: [
        { name: "Steam", additionalPrice: "0.00" },
        { name: "Fried", additionalPrice: "1.00" },
        { name: "Jhol", additionalPrice: "1.50" },
      ],
    },
    {
      item: "Chicken Chowmein",
      name: "Spice",
      choiceType: ModifierChoiceType.SINGLE,
      isRequired: true,
      options: [
        { name: "Mild", additionalPrice: "0.00" },
        { name: "Medium", additionalPrice: "0.00" },
        { name: "Hot", additionalPrice: "0.00" },
      ],
    },
    {
      item: "Dal Bhat",
      name: "Extras",
      choiceType: ModifierChoiceType.MULTIPLE,
      isRequired: false,
      options: [
        { name: "Extra Achar", additionalPrice: "1.00" },
        { name: "Extra Tarkari", additionalPrice: "2.00" },
        { name: "Papad", additionalPrice: "0.50" },
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

  // --- Collections (8.3.5c.A, D-25.2) ---
  console.log("Seeding collections...");
  const existingCollections = await prisma.menuCollection.findMany({
    where: { venueId },
  });
  const existingCollectionsByName = new Map<string, { id: string }>();
  for (const c of existingCollections) {
    existingCollectionsByName.set(c.name, { id: c.id });
  }

  const collectionDefs = [
    {
      name: "Chef Recommendation",
      featuredFrom: null,
      featuredTo: null,
      sortOrder: 1,
      itemNames: ["Steam Momo", "Dal Bhat", "Kheer"],
    },
    {
      name: "Tihar Special",
      featuredFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      featuredTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sortOrder: 2,
      itemNames: ["Steam Momo", "Dal Bhat", "Sel Roti", "Kheer"],
    },
  ];

  for (const cDef of collectionDefs) {
    let collectionId = existingCollectionsByName.get(cDef.name)?.id;
    if (!collectionId) {
      const createdCol = await prisma.menuCollection.create({
        data: {
          venueId,
          name: cDef.name,
          featuredFrom: cDef.featuredFrom,
          featuredTo: cDef.featuredTo,
          sortOrder: cDef.sortOrder,
        },
      });
      collectionId = createdCol.id;
      console.log(`Created collection "${cDef.name}" (id: ${collectionId}).`);
    } else {
      console.log(`Collection "${cDef.name}" already exists.`);
    }

    const existingColItems = await prisma.menuCollectionItem.findMany({
      where: { collectionId },
    });
    const existingColItemIds = new Set(existingColItems.map((ci) => ci.menuItemId));

    for (let i = 0; i < cDef.itemNames.length; i++) {
      const itName = cDef.itemNames[i];
      if (!itName) continue;
      const menuItemId = itemIds[itName];
      if (!menuItemId) {
        console.warn(`Item ${itName} not found in itemIds map for collection ${cDef.name}`);
        continue;
      }
      if (existingColItemIds.has(menuItemId)) {
        continue;
      }
      await prisma.menuCollectionItem.create({
        data: {
          venueId,
          collectionId,
          menuItemId,
          sortOrder: i + 1,
        },
      });
      console.log(`Added "${itName}" to collection "${cDef.name}".`);
    }
  }

  console.log(
    `Seeded ${categoryDefs.length} categories, ${itemDefs.length} items, ${groupDefs.length} modifier groups, ${collectionDefs.length} collections.`,
  );
}

export async function seedStaff(venueId: string): Promise<void> {
  console.log("Seeding staff...");
  const staffRepo = createPrismaStaffRepository(prisma);

  const staffDefs: Array<{ name: string; username: string; roles: StaffRole[] }> = [
    { name: "Alice Manager", username: "alice", roles: [StaffRole.MANAGER] },
    { name: "Bob Chef", username: "bob", roles: [StaffRole.CHEF] },
    { name: "Charlie Server", username: "charlie", roles: [StaffRole.LEADER] },
    { name: "Diana Housekeeper", username: "diana", roles: [StaffRole.HOUSEKEEPING] },
    { name: "Eve Front Desk", username: "eve", roles: [StaffRole.FRONT_DESK] },
    { name: "Frank Room Service", username: "frank", roles: [StaffRole.ROOM_SERVICE] },
    { name: "Grace Table Service", username: "grace", roles: [StaffRole.TABLE_SERVICE] },
  ];

  for (const def of staffDefs) {
    // Check if staff member already exists to ensure idempotency
    const existingResult = await staffRepo.findByUsername(venueId, def.username);
    if (existingResult.ok) {
      console.log(`Staff ${def.username} already exists.`);
      continue;
    }

    // Check if the failure was actually NOT_FOUND. If not, it's a real DB error.
    if (existingResult.error.code !== DomainErrorCode.NOT_FOUND) {
      console.error(
        `Failed to check staff ${def.username}: [${existingResult.error.code}] ${existingResult.error.message}`
      );
      throw new Error(existingResult.error.message);
    }

    // Hash the default password
    const defaultPassword = "password123";
    const passwordHash = await hashPassword(defaultPassword);

    // Create the staff member
    const created = await staffRepo.create({
      venueId,
      name: def.name,
      username: def.username,
      passwordHash,
      roles: def.roles,
    });

    if (!created.ok) {
      console.error(
        `Failed to create staff ${def.username}: [${created.error.code}] ${created.error.message}`
      );
      throw new Error(created.error.message);
    }
    console.log(`Created staff ${def.username} (roles: ${def.roles.join(", ")}).`);
  }
}

interface SeedServiceDef {
  name: string;
  description: string;
  estimatedMinutes: number | null;
  sortOrder: number;
}

const SEED_SERVICES: SeedServiceDef[] = [
  {
    name: "Room Service",
    description: "Order food and beverages directly to your room.",
    estimatedMinutes: 30,
    sortOrder: 0,
  },
  {
    name: "Housekeeping",
    description: "Request room cleaning, fresh towels, or extra amenities.",
    estimatedMinutes: 20,
    sortOrder: 1,
  },
  {
    name: "Maintenance",
    description: "Report an issue with room facilities or request technical assistance.",
    estimatedMinutes: 30,
    sortOrder: 2,
  },
  {
    name: "Concierge",
    description: "Assistance with luggage, reservations, local tours, or travel advice.",
    estimatedMinutes: 15,
    sortOrder: 3,
  },
  {
    name: "Laundry",
    description: "Professional washing, dry cleaning, and garment pressing services.",
    estimatedMinutes: 120,
    sortOrder: 4,
  },
  {
    name: "Spa",
    description: "Relax with massages, wellness treatments, and personalized care.",
    estimatedMinutes: 60,
    sortOrder: 5,
  },
  {
    name: "Late Checkout",
    description: "Request extended room departure time beyond standard checkout hours.",
    estimatedMinutes: null,
    sortOrder: 6,
  },
  {
    name: "Wake-up Call",
    description: "Schedule a morning wake-up call with front desk assistance.",
    estimatedMinutes: null,
    sortOrder: 7,
  },
  {
    name: "Do Not Disturb",
    description: "Request privacy and silence for your room.",
    estimatedMinutes: null,
    sortOrder: 8,
  },
];

export async function seedServices(venueId: string): Promise<void> {
  console.log("Seeding services catalog (D-21.1)...");

  let category = await prisma.serviceCategory.findFirst({
    where: { venueId, name: "Hotel Services" },
  });

  if (!category) {
    category = await prisma.serviceCategory.create({
      data: {
        venueId,
        name: "Hotel Services",
        sortOrder: 0,
      },
    });
    console.log(`Created service category 'Hotel Services' (${category.id})`);
  } else {
    console.log(`Service category 'Hotel Services' already exists (${category.id})`);
  }

  for (const def of SEED_SERVICES) {
    const existing = await prisma.serviceItem.findFirst({
      where: { venueId, categoryId: category.id, name: def.name },
    });

    if (!existing) {
      await prisma.serviceItem.create({
        data: {
          venueId,
          categoryId: category.id,
          name: def.name,
          description: def.description,
          price: "0.00",
          estimatedMinutes: def.estimatedMinutes,
          state: MenuItemState.AVAILABLE,
          sortOrder: def.sortOrder,
        },
      });
      console.log(`Created service item: ${def.name}`);
    } else {
      console.log(`Service item '${def.name}' already exists.`);
    }
  }
}

async function main(): Promise<void> {
  console.log("Seed starting.");
  const { venueId, counterId } = await seedVenue();
  await seedStaff(venueId);
  await seedTablesAndRooms(venueId);
  await seedQrTokens(venueId);
  await seedCounter(venueId, counterId);
  await seedServices(venueId);
  await seedMenu(venueId);
  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
