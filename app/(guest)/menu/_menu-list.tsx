"use client";

import { useMemo, useState, type JSX } from "react";
import { Search } from "lucide-react";
import type { MenuCategoryView } from "@/domain/menu/menu.repository";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { CategoryTabs } from "./_category-tabs";
import { MenuItemCard } from "./_menu-item-card";

interface MenuListProps {
  readonly menu: readonly MenuCategoryView[];
  readonly locale: string;
  readonly currency?: string;
}

export function MenuList({
  menu,
  locale,
  currency = "USD",
}: MenuListProps): JSX.Element {
  const [query, setQuery] = useState("");
  const [cart] = useState({
    itemCount: 3,
    total: "42.50",
  });

  const isCurrency = locale.length === 3 && locale === locale.toUpperCase();
  const safeCurrency = currency || (isCurrency ? locale : "USD");
  const safeLocale = isCurrency ? "en-US" : locale === "en" ? "en-US" : locale;

  const filteredMenu = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return menu;
    }

    return menu
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          const nameMatches = item.name.toLowerCase().includes(trimmed);
          const descMatches = item.description
            ? item.description.toLowerCase().includes(trimmed)
            : false;
          return nameMatches || descMatches;
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [menu, query]);

  return (
    <div className={cart.itemCount > 0 ? "pb-20" : undefined}>
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-guest-text-muted"
          aria-hidden="true"
        />
        <Input
          id="menu-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu..."
          className="pl-9"
          aria-label="Search menu"
        />
      </div>

      {filteredMenu.length > 0 ? (
        <CategoryTabs
          categories={filteredMenu.map((c) => ({ id: c.id, name: c.name }))}
        />
      ) : null}

      {filteredMenu.length === 0 ? (
        <div className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-6 text-center mt-4">
          <p className="text-[14px] leading-[22px] text-guest-text-secondary">
            No items match your search.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {filteredMenu.map((category) => (
            <section
              key={category.id}
              id={`category-${category.id}`}
              aria-labelledby={`category-heading-${category.id}`}
              className="scroll-mt-[64px] flex flex-col gap-3"
            >
              <h3
                id={`category-heading-${category.id}`}
                className="font-display text-[22px] leading-[28px] text-guest-text-primary mt-2"
              >
                {category.name}
              </h3>
              {category.items.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  locale={locale}
                  currency={currency}
                />
              ))}
            </section>
          ))}
        </div>
      )}

      {cart.itemCount > 0 ? (
        <aside
          aria-label="Current cart summary"
          className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 h-14 px-4 flex items-center justify-between rounded-lg bg-guest-brand text-guest-brand-contrast shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 ease-guest-entrance motion-reduce:animate-none"
        >
          <span className="text-[15px] font-medium tracking-tight text-guest-brand-contrast">
            {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} · {formatMoney(cart.total, safeCurrency, safeLocale)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="bg-guest-surface-raised text-guest-text-primary hover:bg-guest-surface-sunken"
          >
            View cart
          </Button>
        </aside>
      ) : null}
    </div>
  );
}
