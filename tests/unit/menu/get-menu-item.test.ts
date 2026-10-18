import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMenuItem, type GetMenuItemDeps } from "@/domain/menu/get-menu-item";
import {
  type MenuRepository,
  type MenuCategoryView,
  MenuItemState,
} from "@/domain/menu/menu.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("getMenuItem domain function", () => {
  let mockRepo: MenuRepository;
  let deps: GetMenuItemDeps;

  const venueId = "venue-123";

  const twoCategoryTree: MenuCategoryView[] = [
    {
      id: "cat-1",
      name: "Starters",
      order: 1,
      items: [
        {
          id: "item-1",
          name: "Bruschetta",
          description: "Toasted bread with tomatoes",
          photoUrl: "https://example.com/bruschetta.jpg",
          price: "9.50",
          state: MenuItemState.AVAILABLE,
          order: 1,
          modifierGroups: [
            {
              id: "mg-1",
              name: "Add Cheese",
              required: false,
              multiple: true,
              options: [
                {
                  id: "opt-1",
                  name: "Mozzarella",
                  additionalPrice: "2.00",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "cat-2",
      name: "Mains",
      order: 2,
      items: [
        {
          id: "item-2",
          name: "Pasta Carbonara",
          description: "Creamy egg and pancetta",
          photoUrl: null,
          price: "18.00",
          state: MenuItemState.AVAILABLE,
          order: 1,
          modifierGroups: [
            {
              id: "mg-2",
              name: "Pasta Type",
              required: true,
              multiple: false,
              options: [
                {
                  id: "opt-2",
                  name: "Fettuccine",
                  additionalPrice: "0.00",
                },
              ],
            },
          ],
        },
      ],
    },
  ];

  beforeEach(() => {
    mockRepo = {
      listCategories: vi.fn(),
      listItemsForCategory: vi.fn(),
      listItems: vi.fn(),
      getItemWithModifiers: vi.fn(),
      createCategory: vi.fn(),
      createItem: vi.fn(),
      setItemState: vi.fn(),
      createModifierGroup: vi.fn(),
      createModifierOption: vi.fn(),
      getFullMenu: vi.fn(),
    };
    deps = { menuRepo: mockRepo };
  });

  it("Happy path — item in the first category: returns ok(item) with full tree details", async () => {
    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok(twoCategoryTree));

    const result = await getMenuItem(deps, venueId, "item-1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cat0 = twoCategoryTree[0];
    const expectedItem = cat0?.items[0];
    expect(expectedItem).toBeDefined();
    if (!expectedItem) return;

    expect(result.value).toEqual(expectedItem);
    expect(result.value.id).toBe("item-1");
    expect(result.value.price).toBe("9.50");
    expect(typeof result.value.price).toBe("string");
    expect(result.value.modifierGroups).toHaveLength(1);

    const mg = result.value.modifierGroups[0];
    expect(mg).toBeDefined();
    if (!mg) return;
    expect(mg.options).toHaveLength(1);
    const opt = mg.options[0];
    expect(opt).toBeDefined();
    if (!opt) return;
    expect(opt.additionalPrice).toBe("2.00");
    expect(typeof opt.additionalPrice).toBe("string");
  });

  it("Happy path — item in a later category: searches all categories without short-circuiting", async () => {
    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok(twoCategoryTree));

    const result = await getMenuItem(deps, venueId, "item-2");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const cat1 = twoCategoryTree[1];
    const expectedItem = cat1?.items[0];
    expect(expectedItem).toBeDefined();
    if (!expectedItem) return;

    expect(result.value).toEqual(expectedItem);
    expect(result.value.id).toBe("item-2");
    expect(result.value.name).toBe("Pasta Carbonara");
  });

  it("HIDDEN item returns NOT_FOUND: item excluded from guest-visible tree", async () => {
    // getFullMenu filters out HIDDEN items at the source
    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok(twoCategoryTree));

    const result = await getMenuItem(deps, venueId, "hidden-item-id");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
    expect(result.error.message).toBe("Menu item not found");
  });

  it("Nonexistent ID returns NOT_FOUND with 'Menu item not found' message", async () => {
    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok(twoCategoryTree));

    const result = await getMenuItem(
      deps,
      venueId,
      "00000000-0000-0000-0000-000000000000"
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
    expect(result.error.message).toBe("Menu item not found");
  });

  it("Repository failure propagates unchanged", async () => {
    const failure = fail(DomainErrorCode.INTERNAL, "Could not load menu");
    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(failure);

    const result = await getMenuItem(deps, venueId, "item-1");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
    expect(result.error.message).toBe("Could not load menu");
  });

  it("Empty itemId returns VALIDATION_FAILED and repository is not called", async () => {
    const result = await getMenuItem(deps, venueId, "");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(result.error.message).toBe("itemId is required and must be non-empty");
    expect(mockRepo.getFullMenu).not.toHaveBeenCalled();
  });
});
