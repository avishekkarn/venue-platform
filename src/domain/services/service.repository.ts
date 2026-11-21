/**
 * Service repository port (D-21.1).
 *
 * Defines the contract for reading and writing the service aggregate tree:
 * - ServiceCategory
 * - ServiceItem
 * - ServiceCategoryView
 * - ServiceItemView
 *
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Money rule (BUILD.md §7.1):
 * - ServiceItem.price is a decimal string, never a number.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), DECISIONS.md D-21.1.
 */

import { type Result } from "@/domain/shared/result";
import { type MenuItemState } from "@/domain/menu/menu.repository";

export interface ServiceCategory {
  readonly id: string;
  readonly venueId: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ServiceItem {
  readonly id: string;
  readonly venueId: string;
  readonly categoryId: string;
  readonly name: string;
  readonly description: string | null;
  readonly photoUrl: string | null;
  readonly photoBlurData: string | null;
  readonly price: string;
  readonly estimatedMinutes: number | null;
  readonly state: MenuItemState;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ServiceCategoryView {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly items: readonly ServiceItemView[];
}

export interface ServiceItemView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly photoUrl: string | null;
  readonly photoBlurData: string | null;
  readonly price: string;
  readonly estimatedMinutes: number | null;
  readonly state: MenuItemState;
  readonly order: number;
}

export interface ServiceRepository {
  listCategories(venueId: string): Promise<Result<ServiceCategory[]>>;
  listItems(venueId: string): Promise<Result<ServiceItem[]>>;
  listItemsForCategory(
    venueId: string,
    categoryId: string
  ): Promise<Result<ServiceItem[]>>;
  getFullServiceCatalog(venueId: string): Promise<Result<ServiceCategoryView[]>>;
  getItemById(venueId: string, itemId: string): Promise<Result<ServiceItem>>;
}
