"use client";

import { useState, type JSX } from "react";
import { Search } from "lucide-react";
import type { MenuCategoryView } from "@/domain/menu/menu.repository";
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
  const [cart] = useState({
    itemCount: 3,
    total: "42.50",
  });

  const isCurrency = locale.length === 3 && locale === locale.toUpperCase();
  const safeCurrency = currency || (isCurrency ? locale : "USD");
  const safeLocale = isCurrency ? "en-US" : locale === "en" ? "en-US" : locale;

  return (
    <div className={cart.itemCount > 0 ? "pb-20" : undefined}>
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-guest-text-muted"
          aria-hidden="true"
        />
        <input
          id="menu-search-input"
          type="search"
          placeholder="Search menu..."
          className="block w-full rounded-md border border-guest-border-subtle bg-guest-surface-raised px-3 py-2 pl-9 text-[16px] leading-[24px] text-guest-text-primary placeholder:text-guest-text-muted outline-none focus:border-guest-brand focus:ring-0"
          aria-label="Search menu"
        />
      </div>

      {menu.length > 0 ? (
        <CategoryTabs
          categories={menu.map((c) => ({ id: c.id, name: c.name }))}
        />
      ) : null}

      <div
        id="menu-empty-state"
        style={{ display: "none" }}
        className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-6 text-center mt-4"
      >
        <p className="text-[14px] leading-[22px] text-guest-text-secondary">
          No items match your search.
        </p>
      </div>

      <div id="menu-list-container" className="mt-4 flex flex-col gap-3">
        {menu.map((category) => (
          <section
            key={category.id}
            id={`category-${category.id}`}
            data-category-section
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
              <div key={item.id} data-item-card>
                <MenuItemCard
                  item={item}
                  locale={locale}
                  currency={currency}
                />
              </div>
            ))}
          </section>
        ))}
      </div>

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

      <script
        dangerouslySetInnerHTML={{
          __html: `
  (function() {
    function init() {
      var input = document.getElementById('menu-search-input');
      var container = document.getElementById('menu-list-container');
      if (!input || !container) return;
      
      input.addEventListener('input', function(e) {
        var query = e.target.value.toLowerCase().trim();
        var sections = container.querySelectorAll('[data-category-section]');
        var hasVisible = false;
        
        sections.forEach(function(section) {
          var items = section.querySelectorAll('[data-item-card]');
          var sectionHasVisible = false;
          
          items.forEach(function(item) {
            var text = item.textContent.toLowerCase();
            if (query === '' || text.includes(query)) {
              item.style.display = 'flex';
              sectionHasVisible = true;
              hasVisible = true;
            } else {
              item.style.display = 'none';
            }
          });
          
          section.style.display = sectionHasVisible ? 'flex' : 'none';
        });
        
        var emptyState = document.getElementById('menu-empty-state');
        if (emptyState) {
          emptyState.style.display = hasVisible ? 'none' : 'block';
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
`,
        }}
      />
    </div>
  );
}
