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
  type MenuCollection as PrismaMenuCollection,
  type MenuItem as PrismaMenuItem,
  type ModifierGroup as PrismaModifierGroup,
  type ModifierOption as PrismaModifierOption,
  MenuItemState as PrismaMenuItemState,
  ModifierChoiceType as PrismaModifierChoiceType,
} from "@prisma/client";
import {
  type MenuRepository,
  type MenuCategory,
  type MenuCollection,
  type MenuCollectionView,
  type CreateCollectionInput,
  type UpdateCollectionInput,
  type AddItemToCollectionInput,
  type MenuCollectionItem,
  type MenuItem,
  type ModifierGroup,
  type ModifierOption,
  type MenuItemWithModifiers,
  type MenuCategoryView,
  type MenuItemView,
  type ModifierGroupView,
  type ModifierOptionView,
  type CreateCategoryInput,
  type UpdateCategoryInput,
  type CreateItemInput,
  type UpdateItemInput,
  type CreateModifierGroupInput,
  type CreateModifierOptionInput,
  type UpdateModifierGroupInput,
  type UpdateModifierOptionInput,
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

function mapMenuItem(
  raw: PrismaMenuItem & { categories?: { categoryId: string }[] }
): MenuItem {
  return {
    id: raw.id,
    venueId: raw.venueId,
    categoryIds: raw.categories ? raw.categories.map((c) => c.categoryId) : [],
    name: raw.name,
    description: raw.description,
    photoUrl: raw.photoUrl,
    photoBlurData: raw.photoBlurData ?? null,
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
  categories?: { categoryId: string }[];
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

function mapModifierOptionView(raw: PrismaModifierOption): ModifierOptionView {
  return {
    id: raw.id,
    name: raw.name,
    additionalPrice: raw.additionalPrice.toFixed(2),
  };
}

function mapModifierGroupView(
  raw: PrismaModifierGroup & { options: PrismaModifierOption[] }
): ModifierGroupView {
  return {
    id: raw.id,
    name: raw.name,
    required: raw.isRequired,
    multiple: raw.choiceType === PrismaModifierChoiceType.MULTIPLE,
    options: raw.options.map(mapModifierOptionView),
  };
}

function mapMenuItemView(
  raw: PrismaMenuItem & {
    categories?: { categoryId: string }[];
    modifierGroups: (PrismaModifierGroup & { options: PrismaModifierOption[] })[];
  }
): MenuItemView {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? null,
    photoUrl: raw.photoUrl ?? null,
    photoBlurData: raw.photoBlurData ?? null,
    categoryIds: raw.categories ? raw.categories.map((c) => c.categoryId) : [],
    price: raw.price.toFixed(2),
    state: PRISMA_TO_DOMAIN_MENU_ITEM_STATE[raw.state],
    order: raw.sortOrder,
    modifierGroups: raw.modifierGroups.map(mapModifierGroupView),
  };
}

function mapMenuCategoryView(
  raw: PrismaMenuCategory & {
    menuItemCategories: {
      sortOrder: number;
      menuItem: PrismaMenuItem & {
        categories?: { categoryId: string }[];
        modifierGroups: (PrismaModifierGroup & { options: PrismaModifierOption[] })[];
      };
    }[];
  }
): MenuCategoryView {
  return {
    id: raw.id,
    name: raw.name,
    order: raw.sortOrder,
    items: raw.menuItemCategories.map((mic) => ({
      ...mapMenuItemView(mic.menuItem),
      order: mic.sortOrder,
    })),
  };
}

function mapMenuCollection(raw: PrismaMenuCollection): MenuCollection {
  return {
    id: raw.id,
    venueId: raw.venueId,
    name: raw.name,
    featuredFrom: raw.featuredFrom ?? null,
    featuredTo: raw.featuredTo ?? null,
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapMenuCollectionView(
  raw: PrismaMenuCollection & {
    items: Array<{
      sortOrder: number;
      menuItem: PrismaMenuItem & {
        categories?: { categoryId: string }[];
        modifierGroups: (PrismaModifierGroup & { options: PrismaModifierOption[] })[];
      };
    }>;
  }
): MenuCollectionView {
  return {
    id: raw.id,
    name: raw.name,
    featuredFrom: raw.featuredFrom ?? null,
    featuredTo: raw.featuredTo ?? null,
    sortOrder: raw.sortOrder,
    items: raw.items.map((it) => ({
      ...mapMenuItemView(it.menuItem),
      order: it.sortOrder,
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

    async listCollections(
      venueId: string,
      at: Date
    ): Promise<Result<MenuCollectionView[]>> {
      try {
        const collections = await client.menuCollection.findMany({
          where: {
            venueId,
            AND: [
              { OR: [{ featuredFrom: null }, { featuredFrom: { lte: at } }] },
              { OR: [{ featuredTo: null }, { featuredTo: { gte: at } }] },
            ],
          },
          orderBy: { sortOrder: "asc" },
          include: {
            items: {
              orderBy: { sortOrder: "asc" },
              include: {
                menuItem: {
                  include: {
                    categories: true,
                    modifierGroups: {
                      orderBy: { sortOrder: "asc" },
                      include: {
                        options: { orderBy: { sortOrder: "asc" } },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return ok(collections.map(mapMenuCollectionView));
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Database read operation failed");
      }
    },

    async createCollection(
      input: CreateCollectionInput
    ): Promise<Result<MenuCollection>> {
      try {
        const collection = await client.menuCollection.create({
          data: {
            venueId: input.venueId,
            name: input.name,
            featuredFrom: input.featuredFrom ?? null,
            featuredTo: input.featuredTo ?? null,
            sortOrder: input.sortOrder ?? 0,
          },
        });
        return ok(mapMenuCollection(collection));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Collection '${input.name}' violates unique constraint`
          );
        }
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async updateCollection(
      venueId: string,
      collectionId: string,
      input: UpdateCollectionInput
    ): Promise<Result<MenuCollection>> {
      try {
        const existing = await client.menuCollection.findFirst({
          where: { id: collectionId, venueId },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Menu collection with id '${collectionId}' not found in venue '${venueId}'`
          );
        }
        const data: {
          name?: string;
          featuredFrom?: Date | null;
          featuredTo?: Date | null;
          sortOrder?: number;
        } = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.featuredFrom !== undefined) data.featuredFrom = input.featuredFrom;
        if (input.featuredTo !== undefined) data.featuredTo = input.featuredTo;
        if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

        const updated = await client.menuCollection.update({
          where: { id: collectionId },
          data,
        });
        return ok(mapMenuCollection(updated));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Collection '${input.name ?? collectionId}' violates unique constraint`
          );
        }
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async deleteCollection(
      venueId: string,
      collectionId: string
    ): Promise<Result<void>> {
      try {
        const existing = await client.menuCollection.findFirst({
          where: { id: collectionId, venueId },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Menu collection with id '${collectionId}' not found in venue '${venueId}'`
          );
        }
        await client.menuCollection.delete({ where: { id: collectionId } });
        return ok(undefined);
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async addItemToCollection(
      input: AddItemToCollectionInput
    ): Promise<Result<MenuCollectionItem>> {
      try {
        const item = await client.menuCollectionItem.create({
          data: {
            venueId: input.venueId,
            collectionId: input.collectionId,
            menuItemId: input.menuItemId,
            sortOrder: input.sortOrder ?? 0,
          },
        });
        return ok({
          id: item.id,
          venueId: item.venueId,
          collectionId: item.collectionId,
          menuItemId: item.menuItemId,
          sortOrder: item.sortOrder,
        });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Item is already in this collection`
          );
        }
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async removeItemFromCollection(
      venueId: string,
      collectionId: string,
      menuItemId: string
    ): Promise<Result<void>> {
      try {
        const existing = await client.menuCollectionItem.findFirst({
          where: { venueId, collectionId, menuItemId },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Collection item not found`
          );
        }
        await client.menuCollectionItem.delete({ where: { id: existing.id } });
        return ok(undefined);
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async listItemsForCategory(
      venueId: string,
      categoryId: string
    ): Promise<Result<MenuItem[]>> {
      try {
        const items = await client.menuItem.findMany({
          where: {
            venueId,
            categories: {
              some: { categoryId },
            },
          },
          include: {
            categories: true,
          },
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

    async listItems(venueId: string): Promise<Result<MenuItem[]>> {
      try {
        const items = await client.menuItem.findMany({
          where: { venueId },
          include: {
            categories: true,
          },
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
            categories: true,
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

    async updateCategory(
      venueId: string,
      categoryId: string,
      input: UpdateCategoryInput
    ): Promise<Result<MenuCategory>> {
      try {
        const existing = await client.menuCategory.findFirst({
          where: { id: categoryId, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Menu category with id '${categoryId}' not found in venue '${venueId}'`
          );
        }

        const data: { name?: string; sortOrder?: number } = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

        const updated = await client.menuCategory.update({
          where: { id: categoryId },
          data,
        });

        return ok(mapMenuCategory(updated));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Category '${input.name ?? categoryId}' violates unique constraint`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async deleteCategory(
      venueId: string,
      categoryId: string
    ): Promise<Result<void>> {
      try {
        const existing = await client.menuCategory.findFirst({
          where: { id: categoryId, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Menu category with id '${categoryId}' not found in venue '${venueId}'`
          );
        }

        // Join-aware delete (DESIGN.md §4.10.8): refuse if any item is
        // assigned. The DB FK is ON DELETE CASCADE, so a bare delete would
        // silently orphan the category from items; the application count is
        // the contract.
        const assignedCount = await client.menuItemCategory.count({
          where: { categoryId, venueId },
        });

        if (assignedCount > 0) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Category '${existing.name}' has ${assignedCount} item(s); reassign or delete them first`
          );
        }

        await client.menuCategory.delete({ where: { id: categoryId } });
        return ok(undefined);
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async createItem(input: CreateItemInput): Promise<Result<MenuItem>> {
      try {
        const createInTx = async (tx: DbClient): Promise<MenuItem> => {
          let itemSortOrder = input.sortOrder;
          if (itemSortOrder === undefined) {
            const lastItem = await tx.menuItem.findFirst({
              where: { venueId: input.venueId },
              orderBy: { sortOrder: "desc" },
              select: { sortOrder: true },
            });
            itemSortOrder = lastItem ? lastItem.sortOrder + 1 : 0;
          }

          const categoryCreates = await Promise.all(
            input.categoryIds.map(async (categoryId) => {
              if (input.sortOrder !== undefined) {
                return {
                  venueId: input.venueId,
                  categoryId,
                  sortOrder: input.sortOrder,
                };
              }
              const lastCatItem = await tx.menuItemCategory.findFirst({
                where: { venueId: input.venueId, categoryId },
                orderBy: { sortOrder: "desc" },
                select: { sortOrder: true },
              });
              const nextCatOrder = lastCatItem ? lastCatItem.sortOrder + 1 : 0;
              return {
                venueId: input.venueId,
                categoryId,
                sortOrder: nextCatOrder,
              };
            })
          );

          const item = await tx.menuItem.create({
            data: {
              venueId: input.venueId,
              name: input.name,
              description: input.description ?? null,
              photoUrl: input.photoUrl ?? null,
              photoBlurData: input.photoBlurData ?? null,
              price: input.price,
              sortOrder: itemSortOrder,
              state: input.state
                ? DOMAIN_TO_PRISMA_MENU_ITEM_STATE[input.state]
                : PrismaMenuItemState.AVAILABLE,
              categories: {
                create: categoryCreates,
              },
            },
            include: {
              categories: true,
            },
          });

          return mapMenuItem(item);
        };

        const result =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => createInTx(tx))
            : await createInTx(client);

        return ok(result);
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

    async updateItem(
      venueId: string,
      itemId: string,
      input: UpdateItemInput
    ): Promise<Result<MenuItem>> {
      try {
        const updateInTx = async (tx: DbClient): Promise<MenuItem | null> => {
          const existing = await tx.menuItem.findFirst({
            where: { id: itemId, venueId },
            include: { categories: true },
          });

          if (!existing) {
            return null;
          }

          const data: {
            name?: string;
            description?: string | null;
            photoUrl?: string | null;
            photoBlurData?: string | null;
            price?: string;
            state?: PrismaMenuItemState;
            sortOrder?: number;
          } = {};

          if (input.name !== undefined) data.name = input.name;
          if (input.description !== undefined) data.description = input.description;
          if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl;
          if (input.photoBlurData !== undefined) data.photoBlurData = input.photoBlurData;
          if (input.price !== undefined) data.price = input.price;
          if (input.state !== undefined) {
            data.state = DOMAIN_TO_PRISMA_MENU_ITEM_STATE[input.state];
          }
          if (input.sortOrder !== undefined) {
            data.sortOrder = input.sortOrder;
          }

          if (input.categoryIds !== undefined) {
            const existingMics = await tx.menuItemCategory.findMany({
              where: { menuItemId: itemId },
            });
            const existingOrderMap = new Map(
              existingMics.map((m) => [m.categoryId, m.sortOrder])
            );

            // Remove categories that are no longer assigned to this item
            await tx.menuItemCategory.deleteMany({
              where: {
                menuItemId: itemId,
                categoryId: { notIn: [...input.categoryIds] },
              },
            });

            // Add newly assigned categories, placing them sequentially at the end
            for (const categoryId of input.categoryIds) {
              if (!existingOrderMap.has(categoryId)) {
                const lastCatItem = await tx.menuItemCategory.findFirst({
                  where: { venueId, categoryId },
                  orderBy: { sortOrder: "desc" },
                  select: { sortOrder: true },
                });
                const nextCatOrder = lastCatItem ? lastCatItem.sortOrder + 1 : 0;
                await tx.menuItemCategory.create({
                  data: {
                    venueId,
                    menuItemId: itemId,
                    categoryId,
                    sortOrder: nextCatOrder,
                  },
                });
              }
            }
          }

          const updated = await tx.menuItem.update({
            where: { id: itemId },
            data,
            include: {
              categories: true,
            },
          });

          return mapMenuItem(updated);
        };

        const result =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => updateInTx(tx))
            : await updateInTx(client);

        if (!result) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Menu item with id '${itemId}' not found in venue '${venueId}'`
          );
        }

        return ok(result);
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Menu item '${input.name ?? itemId}' violates unique constraint`
          );
        }
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async deleteItem(venueId: string, itemId: string): Promise<Result<void>> {
      try {
        const existing = await client.menuItem.findFirst({
          where: { id: itemId, venueId },
        });
        if (!existing) {
          return fail(DomainErrorCode.NOT_FOUND, "Item not found");
        }
        await client.menuItem.delete({
          where: { id: itemId },
        });
        return ok(undefined);
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async reorderItemInCategory(
      venueId: string,
      itemId: string,
      categoryId: string,
      direction: "up" | "down"
    ): Promise<Result<void>> {
      try {
        const mics = await client.menuItemCategory.findMany({
          where: { venueId, categoryId },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        });

        const idx = mics.findIndex((m) => m.menuItemId === itemId);
        if (idx === -1) {
          return fail(DomainErrorCode.NOT_FOUND, "Item not in category");
        }

        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= mics.length) {
          return ok(undefined);
        }

        const temp = mics[idx]!;
        mics[idx] = mics[targetIdx]!;
        mics[targetIdx] = temp;

        for (let i = 0; i < mics.length; i++) {
          const row = mics[i]!;
          if (row.sortOrder !== i) {
            await client.menuItemCategory.update({
              where: { id: row.id },
              data: { sortOrder: i },
            });
          }
        }

        return ok(undefined);
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Could not reorder item");
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
          include: {
            categories: true,
          },
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
          include: {
            categories: true,
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

    async updateModifierGroup(
      venueId: string,
      groupId: string,
      input: UpdateModifierGroupInput
    ): Promise<Result<ModifierGroup>> {
      try {
        const existing = await client.modifierGroup.findFirst({
          where: {
            id: groupId,
            menuItem: { venueId },
          },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Modifier group with id '${groupId}' not found in venue '${venueId}'`
          );
        }
        const data: {
          name?: string;
          choiceType?: PrismaModifierChoiceType;
          isRequired?: boolean;
          sortOrder?: number;
        } = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.choiceType !== undefined)
          data.choiceType = DOMAIN_TO_PRISMA_CHOICE_TYPE[input.choiceType];
        if (input.isRequired !== undefined) data.isRequired = input.isRequired;
        if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
        const updated = await client.modifierGroup.update({
          where: { id: groupId },
          data,
        });
        return ok(mapModifierGroup(updated));
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async deleteModifierGroup(
      venueId: string,
      groupId: string
    ): Promise<Result<void>> {
      try {
        const existing = await client.modifierGroup.findFirst({
          where: { id: groupId, menuItem: { venueId } },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Modifier group with id '${groupId}' not found in venue '${venueId}'`
          );
        }
        await client.modifierGroup.delete({ where: { id: groupId } });
        return ok(undefined);
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async updateModifierOption(
      venueId: string,
      optionId: string,
      input: UpdateModifierOptionInput
    ): Promise<Result<ModifierOption>> {
      try {
        const existing = await client.modifierOption.findFirst({
          where: {
            id: optionId,
            modifierGroup: { menuItem: { venueId } },
          },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Modifier option with id '${optionId}' not found in venue '${venueId}'`
          );
        }
        const data: {
          name?: string;
          additionalPrice?: string;
          sortOrder?: number;
        } = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.additionalPrice !== undefined)
          data.additionalPrice = input.additionalPrice;
        if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
        const updated = await client.modifierOption.update({
          where: { id: optionId },
          data,
        });
        return ok(mapModifierOption(updated));
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async deleteModifierOption(
      venueId: string,
      optionId: string
    ): Promise<Result<void>> {
      try {
        const existing = await client.modifierOption.findFirst({
          where: { id: optionId, modifierGroup: { menuItem: { venueId } } },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Modifier option with id '${optionId}' not found in venue '${venueId}'`
          );
        }
        await client.modifierOption.delete({ where: { id: optionId } });
        return ok(undefined);
      } catch {
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async getFullMenu(
      venueId: string
    ): Promise<Result<MenuCategoryView[]>> {
      try {
        const categories = await client.menuCategory.findMany({
          where: { venueId },
          orderBy: { sortOrder: "asc" },
          include: {
            menuItemCategories: {
              orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
              include: {
                menuItem: {
                  include: {
                    categories: true,
                    modifierGroups: {
                      orderBy: { sortOrder: "asc" },
                      include: {
                        options: {
                          orderBy: { sortOrder: "asc" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return ok(categories.map(mapMenuCategoryView));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Could not load menu"
        );
      }
    },
  };
}
