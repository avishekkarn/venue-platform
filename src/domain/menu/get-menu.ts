/**
 * Pure domain function to retrieve the combined menu (categories and items) for a venue.
 *
 * Requirements:
 * - Pure domain logic — depends only on the MenuRepository port and shared Result types.
 * - Calls listCategories(venueId) and listItems(venueId).
 * - Combines them into a Menu value and returns ok(menu).
 * - If either repository call fails, returns that error immediately.
 *
 * Reference: SYSTEM.md §4 (the menu module), SYSTEM.md §11.1 (MenuCategory, MenuItem).
 */

import {
  type MenuRepository,
  type MenuCategory,
  type MenuItem,
} from "./menu.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface Menu {
  readonly categories: readonly MenuCategory[];
  readonly items: readonly MenuItem[];
}

export interface GetMenuDeps {
  readonly menuRepo: MenuRepository;
}

export async function getMenu(
  deps: GetMenuDeps,
  venueId: string
): Promise<Result<Menu>> {
  if (!venueId || typeof venueId !== "string" || venueId.trim() === "") {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "venueId is required and must be non-empty"
    );
  }

  const categoriesResult = await deps.menuRepo.listCategories(venueId);
  if (!categoriesResult.ok) {
    return categoriesResult;
  }

  const itemsResult = await deps.menuRepo.listItems(venueId);
  if (!itemsResult.ok) {
    return itemsResult;
  }

  return ok({
    categories: categoriesResult.value,
    items: itemsResult.value,
  });
}
