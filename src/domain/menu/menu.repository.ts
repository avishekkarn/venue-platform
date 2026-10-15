/**
 * Menu repository port.
 *
 * Defines the contract for reading and writing the menu aggregate tree:
 * - MenuCategory
 * - MenuItem
 * - ModifierGroup
 * - ModifierOption
 * - MenuItemWithModifiers (nested item tree for ordering and detail views)
 *
 * Pure domain interface — uses domain types only, never imports @prisma/client,
 * never names the database or SQL.
 *
 * Money rule (BUILD.md §7.1):
 * - MenuItem.price and ModifierOption.additionalPrice are decimal strings, never numbers.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §4 (menu module),
 * SYSTEM.md §11.1 (Menu entities), SYSTEM.md §11.3 (menu-item and money rules),
 * DECISIONS.md D-4.1, D-4.2, D-10.2.
 */

import { type Result } from "@/domain/shared/result";

export enum MenuItemState {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
  HIDDEN = "HIDDEN",
}

export enum ModifierChoiceType {
  SINGLE = "SINGLE",
  MULTIPLE = "MULTIPLE",
}

export interface MenuCategory {
  readonly id: string;
  readonly venueId: string;
  readonly name: string;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MenuItem {
  readonly id: string;
  readonly venueId: string;
  readonly categoryId: string;
  readonly name: string;
  readonly description: string | null;
  readonly photoUrl: string | null;
  readonly price: string;
  readonly state: MenuItemState;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ModifierOption {
  readonly id: string;
  readonly modifierGroupId: string;
  readonly name: string;
  readonly additionalPrice: string;
  readonly sortOrder: number;
  readonly createdAt: Date;
}

export interface ModifierGroup {
  readonly id: string;
  readonly menuItemId: string;
  readonly name: string;
  readonly choiceType: ModifierChoiceType;
  readonly isRequired: boolean;
  readonly sortOrder: number;
  readonly createdAt: Date;
}

export interface ModifierGroupWithOptions extends ModifierGroup {
  readonly options: readonly ModifierOption[];
}

export interface MenuItemWithModifiers extends MenuItem {
  readonly modifierGroups: readonly ModifierGroupWithOptions[];
}

export interface CreateCategoryInput {
  readonly venueId: string;
  readonly name: string;
  readonly sortOrder?: number;
}

export interface CreateItemInput {
  readonly venueId: string;
  readonly categoryId: string;
  readonly name: string;
  readonly description?: string | null;
  readonly photoUrl?: string | null;
  readonly price: string;
  readonly sortOrder?: number;
}

export interface CreateModifierGroupInput {
  readonly menuItemId: string;
  readonly name: string;
  readonly choiceType?: ModifierChoiceType;
  readonly isRequired?: boolean;
  readonly sortOrder?: number;
}

export interface CreateModifierOptionInput {
  readonly modifierGroupId: string;
  readonly name: string;
  readonly additionalPrice: string;
  readonly sortOrder?: number;
}

export interface MenuRepository {
  listCategories(venueId: string): Promise<Result<MenuCategory[]>>;
  listItemsForCategory(
    venueId: string,
    categoryId: string
  ): Promise<Result<MenuItem[]>>;
  getItemWithModifiers(
    venueId: string,
    itemId: string
  ): Promise<Result<MenuItemWithModifiers>>;
  createCategory(input: CreateCategoryInput): Promise<Result<MenuCategory>>;
  createItem(input: CreateItemInput): Promise<Result<MenuItem>>;
  setItemState(
    venueId: string,
    itemId: string,
    state: MenuItemState
  ): Promise<Result<MenuItem>>;
  createModifierGroup(
    input: CreateModifierGroupInput
  ): Promise<Result<ModifierGroup>>;
  createModifierOption(
    input: CreateModifierOptionInput
  ): Promise<Result<ModifierOption>>;
}
