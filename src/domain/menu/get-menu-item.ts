/**
 * Pure domain function to retrieve a single guest-visible menu item by ID.
 *
 * Rules:
 * - Pure domain logic — depends only on the MenuRepository port and shared Result types.
 * - Validates venueId is a non-empty string.
 * - Validates itemId is a non-empty string.
 * - Calls getFullMenu(venueId).
 * - Walks categories to find the item with id === itemId.
 * - If not found or if the item's state is HIDDEN, returns NOT_FOUND (D-4.2).
 * - Returns ok(item) if found and visible.
 *
 * Reference: SYSTEM.md §4 (menu module), SYSTEM.md §5 (Result contract),
 * SYSTEM.md §11.3 (item states), DECISIONS.md D-4.2.
 */

import {
  type MenuRepository,
  type MenuItemView,
  MenuItemState,
} from "./menu.repository";
import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";

export interface GetMenuItemDeps {
  readonly menuRepo: MenuRepository;
}

export async function getMenuItem(
  deps: GetMenuItemDeps,
  venueId: string,
  itemId: string
): Promise<Result<MenuItemView>> {
  if (!venueId || typeof venueId !== "string" || venueId.trim() === "") {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "venueId is required and must be non-empty"
    );
  }

  if (!itemId || typeof itemId !== "string" || itemId.trim() === "") {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "itemId is required and must be non-empty"
    );
  }

  const menuResult = await deps.menuRepo.getFullMenu(venueId);
  if (!menuResult.ok) {
    return menuResult;
  }

  for (const category of menuResult.value) {
    for (const item of category.items) {
      if (item.id === itemId) {
        if (item.state === MenuItemState.HIDDEN) {
          return fail(DomainErrorCode.NOT_FOUND, "Menu item not found");
        }
        return ok(item);
      }
    }
  }

  return fail(DomainErrorCode.NOT_FOUND, "Menu item not found");
}
