/**
 * Prisma adapter for the ServiceRepository port (D-21.1).
 *
 * Requirements:
 * - Exports createPrismaServiceRepository(client: DbClient): ServiceRepository (no default value).
 * - Only file in the services module that imports @prisma/client.
 * - Enforces venue isolation on every query (DECISIONS.md D-10.2).
 * - Money rule: Decimal(10, 2) columns are read and converted via .toFixed(2). Never calls Number(...).
 * - Enums are mapped via explicit bidirectional lookup tables, not type casts.
 * - Wraps Prisma database errors into canonical DomainError values.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), DECISIONS.md D-21.1, D-10.2.
 */

import {
  type PrismaClient,
  type Prisma,
  type ServiceCategory as PrismaServiceCategory,
  type ServiceItem as PrismaServiceItem,
  MenuItemState as PrismaMenuItemState,
} from "@prisma/client";
import {
  type ServiceRepository,
  type ServiceCategory,
  type ServiceItem,
  type ServiceCategoryView,
  type ServiceItemView,
  type CreateServiceItemInput,
  type UpdateServiceItemInput,
} from "@/domain/services/service.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
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

function mapServiceCategory(raw: PrismaServiceCategory): ServiceCategory {
  return {
    id: raw.id,
    venueId: raw.venueId,
    name: raw.name,
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapServiceItem(raw: PrismaServiceItem): ServiceItem {
  return {
    id: raw.id,
    venueId: raw.venueId,
    categoryId: raw.categoryId,
    name: raw.name,
    description: raw.description,
    photoUrl: raw.photoUrl,
    photoBlurData: raw.photoBlurData,
    price: raw.price.toFixed(2),
    estimatedMinutes: raw.estimatedMinutes,
    state: PRISMA_TO_DOMAIN_MENU_ITEM_STATE[raw.state],
    sortOrder: raw.sortOrder,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function mapServiceItemView(raw: PrismaServiceItem): ServiceItemView {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    photoUrl: raw.photoUrl,
    photoBlurData: raw.photoBlurData,
    price: raw.price.toFixed(2),
    estimatedMinutes: raw.estimatedMinutes,
    state: PRISMA_TO_DOMAIN_MENU_ITEM_STATE[raw.state],
    order: raw.sortOrder,
  };
}

export function createPrismaServiceRepository(
  client: DbClient
): ServiceRepository {
  return {
    async listCategories(venueId: string): Promise<Result<ServiceCategory[]>> {
      try {
        const categories = await client.serviceCategory.findMany({
          where: { venueId },
          orderBy: { sortOrder: "asc" },
        });
        return ok(categories.map(mapServiceCategory));
      } catch (err) {
        return fail(
          DomainErrorCode.INTERNAL,
          `Failed to list service categories: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },

    async listItems(venueId: string): Promise<Result<ServiceItem[]>> {
      try {
        const items = await client.serviceItem.findMany({
          where: { venueId },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        });
        return ok(items.map(mapServiceItem));
      } catch (err) {
        return fail(
          DomainErrorCode.INTERNAL,
          `Failed to list service items: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },

    async listItemsForCategory(
      venueId: string,
      categoryId: string
    ): Promise<Result<ServiceItem[]>> {
      try {
        const items = await client.serviceItem.findMany({
          where: { venueId, categoryId },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        });
        return ok(items.map(mapServiceItem));
      } catch (err) {
        return fail(
          DomainErrorCode.INTERNAL,
          `Failed to list service items for category: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },

    async getFullServiceCatalog(
      venueId: string
    ): Promise<Result<ServiceCategoryView[]>> {
      try {
        const categories = await client.serviceCategory.findMany({
          where: { venueId },
          orderBy: { sortOrder: "asc" },
          include: {
            serviceItems: {
              orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            },
          },
        });
        return ok(
          categories.map((c) => ({
            id: c.id,
            name: c.name,
            order: c.sortOrder,
            items: c.serviceItems.map(mapServiceItemView),
          }))
        );
      } catch (err) {
        return fail(
          DomainErrorCode.INTERNAL,
          `Failed to get full service catalog: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },

    async getItemById(
      venueId: string,
      itemId: string
    ): Promise<Result<ServiceItem>> {
      try {
        const item = await client.serviceItem.findFirst({
          where: { venueId, id: itemId },
        });
        if (!item) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Service item ${itemId} not found in venue ${venueId}`
          );
        }
        return ok(mapServiceItem(item));
      } catch (err) {
        return fail(
          DomainErrorCode.INTERNAL,
          `Failed to get service item by id: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    },

    async createServiceItem(
      input: CreateServiceItemInput
    ): Promise<Result<ServiceItem>> {
      try {
        const item = await client.serviceItem.create({
          data: {
            venueId: input.venueId,
            categoryId: input.categoryId,
            name: input.name,
            description: input.description ?? null,
            photoUrl: input.photoUrl ?? null,
            photoBlurData: input.photoBlurData ?? null,
            price: input.price,
            estimatedMinutes: input.estimatedMinutes ?? null,
            sortOrder: input.sortOrder ?? 0,
            state: input.state
              ? DOMAIN_TO_PRISMA_MENU_ITEM_STATE[input.state]
              : PrismaMenuItemState.AVAILABLE,
          },
        });
        return ok(mapServiceItem(item));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Service item '${input.name}' violates unique constraint`
          );
        }
        return fail(DomainErrorCode.INTERNAL, "Database write operation failed");
      }
    },

    async updateServiceItem(
      venueId: string,
      itemId: string,
      input: UpdateServiceItemInput
    ): Promise<Result<ServiceItem>> {
      try {
        const existing = await client.serviceItem.findFirst({
          where: { id: itemId, venueId },
        });
        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Service item ${itemId} not found in venue ${venueId}`
          );
        }

        if (input.categoryId !== undefined) {
          const category = await client.serviceCategory.findFirst({
            where: { id: input.categoryId, venueId },
          });
          if (!category) {
            return fail(
              DomainErrorCode.VALIDATION_FAILED,
              "Category not found for this venue"
            );
          }
        }

        const data: Prisma.ServiceItemUpdateInput = {};
        if (input.name !== undefined) data.name = input.name;
        if (input.description !== undefined) data.description = input.description;
        if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl;
        if (input.photoBlurData !== undefined) data.photoBlurData = input.photoBlurData;
        if (input.price !== undefined) data.price = input.price;
        if (input.estimatedMinutes !== undefined) data.estimatedMinutes = input.estimatedMinutes;
        if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
        if (input.state !== undefined) {
          data.state = DOMAIN_TO_PRISMA_MENU_ITEM_STATE[input.state];
        }
        if (input.categoryId !== undefined) {
          data.category = { connect: { id: input.categoryId } };
        }

        const updated = await client.serviceItem.update({
          where: { id: itemId },
          data,
        });
        return ok(mapServiceItem(updated));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Service item '${input.name ?? itemId}' violates unique constraint`
          );
        }
        return fail(DomainErrorCode.INTERNAL, "Database update operation failed");
      }
    },
  };
}
