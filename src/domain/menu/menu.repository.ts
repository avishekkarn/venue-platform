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
  readonly categoryIds: readonly string[];
  readonly name: string;
  readonly description: string | null;
  readonly photoUrl: string | null;
  readonly photoBlurData: string | null;
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

export interface ModifierOptionView {
  readonly id: string;
  readonly name: string;
  readonly additionalPrice: string;
}

export interface ModifierGroupView {
  readonly id: string;
  readonly name: string;
  readonly required: boolean;
  readonly multiple: boolean;
  readonly options: readonly ModifierOptionView[];
}

export interface MenuItemView {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly photoUrl: string | null;
  readonly photoBlurData: string | null;
  readonly categoryIds: readonly string[];
  readonly price: string;
  readonly state: MenuItemState;
  readonly order: number;
  readonly modifierGroups: readonly ModifierGroupView[];
}

export interface MenuCategoryView {
  readonly id: string;
  readonly name: string;
  readonly order: number;
  readonly items: readonly MenuItemView[];
}

export interface CreateCategoryInput {
  readonly venueId: string;
  readonly name: string;
  readonly sortOrder?: number;
}

export interface UpdateCategoryInput {
  readonly name?: string;
  readonly sortOrder?: number;
}

export interface MenuCollection {
  readonly id: string;
  readonly venueId: string;
  readonly name: string;
  readonly featuredFrom: Date | null;
  readonly featuredTo: Date | null;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface MenuCollectionView {
  readonly id: string;
  readonly name: string;
  readonly featuredFrom: Date | null;
  readonly featuredTo: Date | null;
  readonly sortOrder: number;
  readonly items: readonly MenuItemView[];
}

export interface CreateCollectionInput {
  readonly venueId: string;
  readonly name: string;
  readonly featuredFrom?: Date | null;
  readonly featuredTo?: Date | null;
  readonly sortOrder?: number;
}

export interface UpdateCollectionInput {
  readonly name?: string;
  readonly featuredFrom?: Date | null;
  readonly featuredTo?: Date | null;
  readonly sortOrder?: number;
}

export interface AddItemToCollectionInput {
  readonly venueId: string;
  readonly collectionId: string;
  readonly menuItemId: string;
  readonly sortOrder?: number;
}

export interface MenuCollectionItem {
  readonly id: string;
  readonly venueId: string;
  readonly collectionId: string;
  readonly menuItemId: string;
  readonly sortOrder: number;
}

export interface CreateItemInput {
  readonly venueId: string;
  readonly categoryIds: readonly string[];
  readonly name: string;
  readonly description?: string | null;
  readonly photoUrl?: string | null;
  readonly photoBlurData?: string | null;
  readonly price: string;
  readonly state?: MenuItemState;
  readonly sortOrder?: number;
}

export interface UpdateItemInput {
  readonly name?: string;
  readonly description?: string | null;
  readonly photoUrl?: string | null;
  readonly photoBlurData?: string | null;
  readonly price?: string;
  readonly categoryIds?: readonly string[];
  readonly state?: MenuItemState;
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

export interface UpdateModifierGroupInput {
  readonly name?: string;
  readonly choiceType?: ModifierChoiceType;
  readonly isRequired?: boolean;
  readonly sortOrder?: number;
}

export interface UpdateModifierOptionInput {
  readonly name?: string;
  readonly additionalPrice?: string;
  readonly sortOrder?: number;
}

export interface MenuRepository {
  listCategories(venueId: string): Promise<Result<MenuCategory[]>>;
  listCollections(venueId: string, at: Date): Promise<Result<MenuCollectionView[]>>;
  createCollection(input: CreateCollectionInput): Promise<Result<MenuCollection>>;
  updateCollection(
    venueId: string,
    collectionId: string,
    input: UpdateCollectionInput
  ): Promise<Result<MenuCollection>>;
  deleteCollection(venueId: string, collectionId: string): Promise<Result<void>>;
  addItemToCollection(input: AddItemToCollectionInput): Promise<Result<MenuCollectionItem>>;
  removeItemFromCollection(
    venueId: string,
    collectionId: string,
    menuItemId: string
  ): Promise<Result<void>>;
  listItemsForCategory(
    venueId: string,
    categoryId: string
  ): Promise<Result<MenuItem[]>>;
  listItems(venueId: string): Promise<Result<MenuItem[]>>;
  getItemWithModifiers(
    venueId: string,
    itemId: string
  ): Promise<Result<MenuItemWithModifiers>>;
  createCategory(input: CreateCategoryInput): Promise<Result<MenuCategory>>;
  updateCategory(
    venueId: string,
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<Result<MenuCategory>>;
  deleteCategory(
    venueId: string,
    categoryId: string
  ): Promise<Result<void>>;
  createItem(input: CreateItemInput): Promise<Result<MenuItem>>;
  updateItem(
    venueId: string,
    itemId: string,
    input: UpdateItemInput
  ): Promise<Result<MenuItem>>;
  deleteItem(
    venueId: string,
    itemId: string
  ): Promise<Result<void>>;
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
  updateModifierGroup(
    venueId: string,
    groupId: string,
    input: UpdateModifierGroupInput
  ): Promise<Result<ModifierGroup>>;
  deleteModifierGroup(venueId: string, groupId: string): Promise<Result<void>>;
  updateModifierOption(
    venueId: string,
    optionId: string,
    input: UpdateModifierOptionInput
  ): Promise<Result<ModifierOption>>;
  deleteModifierOption(venueId: string, optionId: string): Promise<Result<void>>;
  getFullMenu(venueId: string): Promise<Result<MenuCategoryView[]>>;
}
