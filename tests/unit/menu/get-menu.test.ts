import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMenu, type GetMenuDeps } from "@/domain/menu/get-menu";
import {
  type MenuRepository,
  type MenuCategoryView,
  MenuItemState,
} from "@/domain/menu/menu.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("getMenu domain function", () => {
  let mockRepo: MenuRepository;
  let deps: GetMenuDeps;

  const venueId = "venue-1";

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

  it("Happy path: returns full menu tree with categories, items, modifier groups, and options", async () => {
    const fullMenu: MenuCategoryView[] = [
      {
        id: "cat-1",
        name: "Starters",
        order: 1,
        items: [
          {
            id: "item-1",
            name: "Soup",
            description: "Warm soup",
            photoUrl: "https://example.com/soup.jpg",
            price: "8.50",
            state: MenuItemState.AVAILABLE,
            order: 1,
            modifierGroups: [
              {
                id: "mg-1",
                name: "Bread Choice",
                required: true,
                multiple: false,
                options: [
                  {
                    id: "opt-1",
                    name: "Sourdough",
                    additionalPrice: "1.50",
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
            name: "Steak",
            description: "Grilled sirloin",
            photoUrl: null,
            price: "28.00",
            state: MenuItemState.AVAILABLE,
            order: 1,
            modifierGroups: [
              {
                id: "mg-2",
                name: "Temperature",
                required: true,
                multiple: false,
                options: [
                  {
                    id: "opt-2",
                    name: "Medium Rare",
                    additionalPrice: "0.00",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok(fullMenu));

    const result = await getMenu(deps, venueId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual(fullMenu);
    const cat0 = result.value[0];
    const cat0Item0 = cat0?.items[0];
    const cat0Item0Mg0 = cat0Item0?.modifierGroups[0];
    const cat0Item0Mg0Opt0 = cat0Item0Mg0?.options[0];

    expect(cat0Item0?.price).toBe("8.50");
    expect(typeof cat0Item0?.price).toBe("string");
    expect(cat0Item0Mg0Opt0?.additionalPrice).toBe("1.50");
    expect(typeof cat0Item0Mg0Opt0?.additionalPrice).toBe("string");
  });

  it("HIDDEN excluded: drops items with state HIDDEN from category, and drops empty categories", async () => {
    const rawMenu: MenuCategoryView[] = [
      {
        id: "cat-1",
        name: "Drinks",
        order: 1,
        items: [
          {
            id: "item-available",
            name: "Lemonade",
            description: null,
            photoUrl: null,
            price: "4.00",
            state: MenuItemState.AVAILABLE,
            order: 1,
            modifierGroups: [],
          },
          {
            id: "item-hidden",
            name: "Secret Punch",
            description: null,
            photoUrl: null,
            price: "10.00",
            state: MenuItemState.HIDDEN,
            order: 2,
            modifierGroups: [],
          },
        ],
      },
      {
        id: "cat-all-hidden",
        name: "Seasonal Secret",
        order: 2,
        items: [
          {
            id: "item-hidden-2",
            name: "Pumpkin Latte",
            description: null,
            photoUrl: null,
            price: "6.00",
            state: MenuItemState.HIDDEN,
            order: 1,
            modifierGroups: [],
          },
        ],
      },
    ];

    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok(rawMenu));

    const result = await getMenu(deps, venueId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(1);
    const cat0 = result.value[0];
    expect(cat0?.id).toBe("cat-1");
    expect(cat0?.items).toHaveLength(1);
    expect(cat0?.items[0]?.id).toBe("item-available");

    const allItemIds = result.value.flatMap((c) => c.items.map((i) => i.id));
    expect(allItemIds).not.toContain("item-hidden");
    expect(allItemIds).not.toContain("item-hidden-2");
  });

  it("UNAVAILABLE included: preserves items with state UNAVAILABLE per D-4.2", async () => {
    const rawMenu: MenuCategoryView[] = [
      {
        id: "cat-1",
        name: "Desserts",
        order: 1,
        items: [
          {
            id: "item-sold-out",
            name: "Tiramisu",
            description: "Freshly made",
            photoUrl: null,
            price: "7.00",
            state: MenuItemState.UNAVAILABLE,
            order: 1,
            modifierGroups: [],
          },
        ],
      },
    ];

    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok(rawMenu));

    const result = await getMenu(deps, venueId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(1);
    const cat0 = result.value[0];
    expect(cat0?.items).toHaveLength(1);
    expect(cat0?.items[0]?.id).toBe("item-sold-out");
    expect(cat0?.items[0]?.state).toBe(MenuItemState.UNAVAILABLE);
  });

  it("Empty venue returns ok([]) without error", async () => {
    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(ok([]));

    const result = await getMenu(deps, venueId);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual([]);
  });

  it("Repository failure propagates unchanged", async () => {
    const repoError = fail(DomainErrorCode.INTERNAL, "Could not load menu");
    vi.mocked(mockRepo.getFullMenu).mockResolvedValueOnce(repoError);

    const result = await getMenu(deps, venueId);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
    expect(result.error.message).toBe("Could not load menu");
  });

  it("Negative path: empty venueId returns VALIDATION_FAILED and getFullMenu is not called", async () => {
    const result = await getMenu(deps, "");

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(result.error.message).toBe(
      "venueId is required and must be non-empty"
    );
    expect(mockRepo.getFullMenu).not.toHaveBeenCalled();
  });
});
