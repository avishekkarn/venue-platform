"use client";

import { useState, type JSX } from "react";
import { Search } from "lucide-react";
import type { MenuCategoryView } from "@/domain/menu/menu.repository";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { CategoryTabs } from "./_category-tabs";
import { MenuItemCard } from "./_menu-item-card";
import { ModifierSheet } from "./_modifier-sheet";

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

      <ModifierSheet />

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
    var currency = ${JSON.stringify(safeCurrency)};
    var locale = ${JSON.stringify(safeLocale)};

    function formatMoney(amount) {
      try {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: currency }).format(amount);
      } catch (e) {
        return '$' + Number(amount).toFixed(2);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function updateModifierPrice() {
      var sheet = document.getElementById('modifier-sheet');
      var priceEl = document.getElementById('modifier-sheet-price');
      var qtyEl = document.getElementById('qty-display');
      if (!sheet || !priceEl) return;

      var qty = 1;
      if (qtyEl) {
        qty = parseInt(qtyEl.textContent || '1', 10) || 1;
      }

      var basePrice = parseFloat(sheet.getAttribute('data-base-price') || '0') || 0;
      var selectedInputs = sheet.querySelectorAll('input:checked');
      var modifierTotal = 0;
      selectedInputs.forEach(function(input) {
        var p = parseFloat(input.getAttribute('data-price') || '0') || 0;
        modifierTotal += p;
      });

      var total = Math.round((basePrice + modifierTotal) * qty * 100) / 100;
      priceEl.textContent = formatMoney(total);
    }

    function init() {
      var input = document.getElementById('menu-search-input');
      var container = document.getElementById('menu-list-container');
      if (input && container) {
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
                item.style.display = '';
                sectionHasVisible = true;
                hasVisible = true;
              } else {
                item.style.display = 'none';
              }
            });
            
            section.style.display = sectionHasVisible ? '' : 'none';
          });
          
          var emptyState = document.getElementById('menu-empty-state');
          if (emptyState) {
            emptyState.style.display = hasVisible ? 'none' : 'block';
          }
        });
      }

      document.addEventListener('click', function(e) {
        var card = e.target.closest('[data-orderable="true"]');
        if (card) {
          var name = card.getAttribute('data-item-name');
          var price = card.getAttribute('data-item-price');
          var rawPriceStr = card.getAttribute('data-item-raw-price');
          var desc = card.getAttribute('data-item-description');
          var optionsStr = card.getAttribute('data-item-options');
          
          var titleEl = document.getElementById('modifier-sheet-title');
          var descEl = document.getElementById('modifier-sheet-desc');
          var sheet = document.getElementById('modifier-sheet');
          var groupsContainer = document.getElementById('modifier-groups-container');
          var qtyEl = document.getElementById('qty-display');
          var notesEl = document.getElementById('modifier-notes');
          
          if (titleEl) titleEl.textContent = name;
          if (descEl) descEl.textContent = desc || '';
          if (qtyEl) qtyEl.textContent = '1';
          if (notesEl) notesEl.value = '';
          
          var basePrice = 0;
          if (rawPriceStr) {
            basePrice = parseFloat(rawPriceStr) || 0;
          } else if (price) {
            basePrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
          }
          
          if (sheet) {
            sheet.setAttribute('data-base-price', String(basePrice));
            sheet.style.display = 'flex';
          }
          
          if (groupsContainer) {
            var options = [];
            try {
              options = JSON.parse(optionsStr || '[]');
            } catch (err) {
              options = [];
            }
            
            var html = '';
            options.forEach(function(group) {
              var isMultiple = Boolean(group.multiple);
              var inputType = isMultiple ? 'checkbox' : 'radio';
              html += '<div class="modifier-group mb-4" data-group-id="' + escapeHtml(group.id) + '">';
              html += '<p class="font-semibold text-[16px] mb-2 text-guest-text-primary">' + escapeHtml(group.name) + '</p>';
              if (group.options && group.options.length > 0) {
                group.options.forEach(function(opt) {
                  var optPriceNum = parseFloat(opt.additionalPrice || '0') || 0;
                  var priceLabel = '';
                  if (optPriceNum > 0) {
                    priceLabel = ' (+' + formatMoney(optPriceNum) + ')';
                  }
                  var nameAttr = isMultiple
                    ? 'group-' + escapeHtml(group.id) + '-option-' + escapeHtml(opt.id)
                    : 'group-' + escapeHtml(group.id);
                  var inputClass = isMultiple ? 'size-4 rounded accent-guest-brand' : 'size-4 accent-guest-brand';

                  html += '<label class="flex items-center gap-2 mb-2 cursor-pointer text-[15px] text-guest-text-secondary select-none">';
                  html += '<input type="' + inputType + '" name="' + nameAttr + '" value="' + escapeHtml(opt.id) + '" data-price="' + escapeHtml(opt.additionalPrice || '0') + '" class="' + inputClass + '" />';
                  html += '<span>' + escapeHtml(opt.name) + priceLabel + '</span>';
                  html += '</label>';
                });
              }
              html += '</div>';
            });
            groupsContainer.innerHTML = html;
          }
          
          updateModifierPrice();
        }
        
        var plusBtn = e.target.closest('#qty-plus');
        if (plusBtn) {
          var qtyEl = document.getElementById('qty-display');
          if (qtyEl) {
            var currentQty = parseInt(qtyEl.textContent || '1', 10) || 1;
            if (currentQty < 99) {
              qtyEl.textContent = String(currentQty + 1);
              updateModifierPrice();
            }
          }
        }

        var minusBtn = e.target.closest('#qty-minus');
        if (minusBtn) {
          var qtyEl = document.getElementById('qty-display');
          if (qtyEl) {
            var currentQty = parseInt(qtyEl.textContent || '1', 10) || 1;
            if (currentQty > 1) {
              qtyEl.textContent = String(currentQty - 1);
              updateModifierPrice();
            }
          }
        }

        var closeBtn = e.target.closest('#modifier-sheet-close');
        var overlay = e.target.closest('[data-sheet-overlay]');
        if (closeBtn || overlay) {
          var sheet = document.getElementById('modifier-sheet');
          if (sheet) sheet.style.display = 'none';
          var notesEl = document.getElementById('modifier-notes');
          if (notesEl) notesEl.value = '';
        }
      });

      document.addEventListener('change', function(e) {
        var sheet = document.getElementById('modifier-sheet');
        if (!sheet) return;
        if (e.target && e.target.closest('#modifier-sheet') && (e.target.type === 'radio' || e.target.type === 'checkbox')) {
          updateModifierPrice();
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
