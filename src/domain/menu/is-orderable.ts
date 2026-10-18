import { type MenuItemView, MenuItemState } from "./menu.repository";

/**
 * Pure predicate answering "can this menu item be added to the cart right now?"
 *
 * The item's `state` is the sole input. AVAILABLE is orderable. UNAVAILABLE and
 * HIDDEN are not. This function does not query the repository; it answers a
 * question about a value the caller already holds.
 *
 * Reference: DECISIONS.md D-4.2 (the three item states), PRODUCT.md §5.3
 * (the unavailable item's greyed-out card), DESIGN.md §4.6.17.1 (the
 * MenuItemCard's unavailable state).
 */
export function isOrderable(item: MenuItemView): boolean {
  return item.state === MenuItemState.AVAILABLE;
}
