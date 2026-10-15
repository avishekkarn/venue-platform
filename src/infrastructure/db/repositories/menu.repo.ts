/**
 * Prisma adapter for the MenuRepository port.
 *
 * Requirements:
 * - Exports createPrismaMenuRepository(client: DbClient): MenuRepository (no default value).
 * - Only file in the menu module that imports @prisma/client.
 * - Enforces venue isolation on every query (DECISIONS.md D-10.2).
 * - Money rule: Decimal(10, 2) columns are read and converted via .toString(). Never calls Number(...).
 * - Enums are mapped via explicit bidirectional lookup tables, not type casts.
 * - setItemState updates the state column and never deletes the row (D-4.2).
 * - Wraps Prisma database errors into canonical DomainError values.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (menu module),
 * SYSTEM.md §11.1 (Menu entities), SYSTEM.md §11.3 (menu-item and money rules),
 * DECISIONS.md D-4.1, D-4.2, D-10.2.
 */

import {
  type PrismaClient,
  type Prisma,
  type MenuCategory as PrismaMenuCategory,
  type MenuItem as PrismaMenuItem,
  type ModifierGroup as PrismaModifierGroup,
  type ModifierOption as PrismaModifierOption,
  MenuItemState as PrismaMenuItemState,
  ModifierChoiceType as PrismaModifierChoiceType,
} from "@prisma/client";
import {
  type MenuRepository,
  type MenuCategory,
  type MenuItem,
  type ModifierGroup,
  type ModifierOption,
  type MenuItemWithModifiers,
  type CreateCategoryInput,
  type CreateItemInput,
  type CreateModifierGroupInput,
  type CreateModifierOptionInput,
  MenuItemState,
  ModifierChoiceType,
} from "@/domain/menu/menu.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

const PRISMA_TO_DOMAIN_MENU_ITEM_STATE: Record<
  PrismaMenuItemState,
  MenuItemState
> = {
  [PrismaMenuItemState.AVAILABLE]: MenuItemState.AVAILABLE,
  [PrismaMenuItemState.UNAVAILABLE]: MenuItemState.UNAVAILABLE,
  [PrismaMenuItemState.HIDDEN]: MenuItemState.HIDDEN,
};

const DOMAIN_TO_PRISMA_MENU_ITEM_STATE: Record<
  MenuItemState,
  PrismaMenuItemState
> = {
  [MenuItemState.AVAILABLE]: PrismaMenuItemState.AVAILABLE,
  [MenuItemState.UNAVAILABLE]: PrismaMenuItemState.UNAVAILABLE,
  [MenuItemState.HIDDEN]: PrismaMenuItemState.HIDDEN,
};

const PRISMA_TO_DOMAIN_CHOICE_TYPE: Record<
  PrismaModifierChoiceType,
  ModifierChoiceType
> = {
  [PrismaModifierChoiceType.SINGLE]: ModifierChoiceType.SINGLE,
  [PrismaModifierChoiceType.MULTIPLE]: ModifierChoiceType.MULTIPLE,
};

const DOMAIN_TO_PRISMA_CHOICE_TYPE: Record<
  ModifierChoiceType,
  PrismaModifierChoiceType
> = {
  [ModifierChoiceType.SINGLE]: PrismaModifierChoiceType.SINGLE,
  [ModifierChoiceType.MULTIPLE]: PrismaModifierChoiceType.MULTIPLE,
};

function mapMenuCategory(raw: PrismaMenuCategory): MenuCategory {
  return {
    id: raw.id,
    venueId: raw.venueId,
    name: raw.name,
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapMenuItem(raw: PrismaMenuItem): MenuItem {
  return {
    id: raw.id,
    venueId: raw.venueId,
    categoryId: raw.categoryId,
    name: raw.name,
    description: raw.description,
    photoUrl: raw.photoUrl,
    price: raw.price.toFixed(2),
    state: PRISMA_TO_DOMAIN_MENU_ITEM_STATE[raw.state],
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapModifierOption(raw: PrismaModifierOption): ModifierOption {
  return {
    id: raw.id,
    modifierGroupId: raw.modifierGroupId,
    name: raw.name,
    additionalPrice: raw.additionalPrice.toFixed(2),
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
  };
}

function mapModifierGroup(raw: PrismaModifierGroup): ModifierGroup {
  return {
    id: raw.id,
    menuItemId: raw.menuItemId,
    name: raw.name,
    choiceType: PRISMA_TO_DOMAIN_CHOICE_TYPE[raw.choiceType],
    isRequired: raw.isRequired,
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
  };
}

type RawMenuItemWithModifiers = PrismaMenuItem & {
  modifierGroups: Array<
    PrismaModifierGroup & {
      options: PrismaModifierOption[];
    }
  >;
};

function mapMenuItemWithModifiers(
  raw: RawMenuItemWithModifiers
): MenuItemWithModifiers {
  return {
    ...mapMenuItem(raw),
    modifierGroups: raw.modifierGroups.map((group) => ({
      ...mapModifierGroup(group),
      options: group.options.map(mapModifierOption),
    })),
  };
}

export function createPrismaMenuRepository(
  client: DbClient
): MenuRepository {
  return {
    async listCategories(venueId: string): Promise<Result<MenuCategory[]>> {
      try {
        const categories = await client.menuCategory.findMany({
          where: { venueId },
          orderBy: { sortOrder: "asc" },
        });

        return ok(categories.map(mapMenuCategory));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async listItemsForCategory(
      venueId: string,
      categoryId: string
    ): Promise<Result<MenuItem[]>> {
      try {
        const items = await client.menuItem.findMany({
          where: { venueId, categoryId },
          orderBy: { sortOrder: "asc" },
        });

        return ok(items.map(mapMenuItem));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async getItemWithModifiers(
      venueId: string,
      itemId: string
    ): Promise<Result<MenuItemWithModifiers>> {
      try {
        const item = await client.menuItem.findFirst({
          where: { id: itemId, venueId },
          include: {
            modifierGroups: {
              include: {
                options: {
                  orderBy: { sortOrder: "asc" },
                },
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        });

        if (!item) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Menu item with id '${itemId}' not found in venue '${venueId}'`
          );
        }

        return ok(mapMenuItemWithModifiers(item));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async createCategory(
      input: CreateCategoryInput
    ): Promise<Result<MenuCategory>> {
      try {
        const category = await client.menuCategory.create({
          data: {
            venueId: input.venueId,
            name: input.name,
            sortOrder: input.sortOrder ?? 0,
          },
        });

        return ok(mapMenuCategory(category));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Category '${input.name}' violates unique constraint`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async createItem(input: CreateItemInput): Promise<Result<MenuItem>> {
      try {
        const item = await client.menuItem.create({
          data: {
            venueId: input.venueId,
            categoryId: input.categoryId,
            name: input.name,
            description: input.description ?? null,
            photoUrl: input.photoUrl ?? null,
            price: input.price,
            sortOrder: input.sortOrder ?? 0,
            state: PrismaMenuItemState.AVAILABLE,
          },
        });

        return ok(mapMenuItem(item));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Menu item '${input.name}' violates unique constraint`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async setItemState(
      venueId: string,
      itemId: string,
      state: MenuItemState
    ): Promise<Result<MenuItem>> {
      try {
        const existing = await client.menuItem.findFirst({
          where: { id: itemId, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Menu item with id '${itemId}' not found in venue '${venueId}'`
          );
        }

        const prismaTargetState = DOMAIN_TO_PRISMA_MENU_ITEM_STATE[state];

        // Idempotent: return existing item if already in target state
        if (existing.state === prismaTargetState) {
          return ok(mapMenuItem(existing));
        }

        const updated = await client.menuItem.update({
          where: { id: itemId },
          data: {
            state: prismaTargetState,
          },
        });

        return ok(mapMenuItem(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async createModifierGroup(
      input: CreateModifierGroupInput
    ): Promise<Result<ModifierGroup>> {
      try {
        const group = await client.modifierGroup.create({
          data: {
            menuItemId: input.menuItemId,
            name: input.name,
            choiceType: input.choiceType
              ? DOMAIN_TO_PRISMA_CHOICE_TYPE[input.choiceType]
              : PrismaModifierChoiceType.SINGLE,
            isRequired: input.isRequired ?? false,
            sortOrder: input.sortOrder ?? 0,
          },
        });

        return ok(mapModifierGroup(group));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async createModifierOption(
      input: CreateModifierOptionInput
    ): Promise<Result<ModifierOption>> {
      try {
        const option = await client.modifierOption.create({
          data: {
            modifierGroupId: input.modifierGroupId,
            name: input.name,
            additionalPrice: input.additionalPrice,
            sortOrder: input.sortOrder ?? 0,
          },
        });

        return ok(mapModifierOption(option));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}
