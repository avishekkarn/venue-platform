/**
 * Pure domain function to retrieve the guest-visible menu tree for a venue.
 *
 * Rules:
 * - Pure domain logic — depends only on the MenuRepository port and shared Result types.
 * - Validates venueId is a non-empty string.
 * - Calls getFullMenu(venueId).
 * - Filters items to AVAILABLE and UNAVAILABLE states, dropping HIDDEN items (D-4.2).
 * - Drops categories that have no visible items.
 * - Returns ok(filteredCategories).
 *
 * Reference: SYSTEM.md §4 (menu module), SYSTEM.md §5 (Result contract),
 * SYSTEM.md §11.1 (Menu entities), DECISIONS.md D-4.2 (item states).
 */

import {
  type MenuRepository,
  type MenuCategoryView,
  MenuItemState,
} from "./menu.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface GetMenuDeps {
  readonly menuRepo: MenuRepository;
}

export async function getMenu(
  deps: GetMenuDeps,
  venueId: string
): Promise<Result<MenuCategoryView[]>> {
  if (!venueId || typeof venueId !== "string" || venueId.trim() === "") {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "venueId is required and must be non-empty"
    );
  }

  const result = await deps.menuRepo.getFullMenu(venueId);
  if (!result.ok) {
    return result;
  }

  const visibleCategories: MenuCategoryView[] = [];

  for (const category of result.value) {
    const visibleItems = category.items.filter(
      (item) =>
        item.state === MenuItemState.AVAILABLE ||
        item.state === MenuItemState.UNAVAILABLE
    );

    if (visibleItems.length > 0) {
      visibleCategories.push({
        ...category,
        items: visibleItems,
      });
    }
  }

  return ok(visibleCategories);
}
