import { describe, expect, it } from "vitest";
import { isOrderable } from "@/domain/menu/is-orderable";
import { MenuItemState, type MenuItemView } from "@/domain/menu/menu.repository";

describe("isOrderable domain function", () => {
  const createItem = (state: MenuItemState): MenuItemView => ({
    id: "item-1",
    name: "Bruschetta",
    description: "Toasted bread with tomatoes",
    photoUrl: "https://example.com/bruschetta.jpg",
    price: "9.50",
    state,
    order: 1,
    modifierGroups: [],
  });

  it("returns true when item state is AVAILABLE", () => {
    const item = createItem(MenuItemState.AVAILABLE);
    expect(isOrderable(item)).toBe(true);
  });

  it("returns false when item state is UNAVAILABLE", () => {
    const item = createItem(MenuItemState.UNAVAILABLE);
    expect(isOrderable(item)).toBe(false);
  });

  it("returns false when item state is HIDDEN", () => {
    const item = createItem(MenuItemState.HIDDEN);
    expect(isOrderable(item)).toBe(false);
  });

  it("is deterministic when called multiple times on the same item", () => {
    const item = createItem(MenuItemState.AVAILABLE);
    expect(isOrderable(item)).toBe(true);
    expect(isOrderable(item)).toBe(true);
  });
});
