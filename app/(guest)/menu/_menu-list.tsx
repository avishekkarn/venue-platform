"use client";

import type { JSX } from "react";
import { Search } from "lucide-react";
import type { MenuCategoryView } from "@/domain/menu/menu.repository";
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
  const isCurrency = locale.length === 3 && locale === locale.toUpperCase();
  const safeCurrency = currency || (isCurrency ? locale : "USD");
  const safeLocale = isCurrency ? "en-US" : locale === "en" ? "en-US" : locale;

  return (
    <div className="pb-20">
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

      <div id="floating-cart-bar" />

      <script
        dangerouslySetInnerHTML={{
          __html: `
  (function() {
    var currency = ${JSON.stringify(safeCurrency)};
    var locale = ${JSON.stringify(safeLocale)};

    function formatMoney(amount) {
      var num = parseFloat(String(amount)) || 0;
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(num);
      } catch (e) {
        return '$' + num.toFixed(2);
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

      var total = (basePrice + modifierTotal) * qty;
      priceEl.textContent = formatMoney(total.toFixed(2));
    }

    function updateCartBar() {
      var cartData = { items: [], itemCount: 0, total: '0.00' };
      try {
        var raw = localStorage.getItem('guest_cart');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') cartData = parsed;
        }
      } catch (e) {}

      var container = document.getElementById('floating-cart-bar');
      if (!container) return;

      var count = parseInt(cartData.itemCount, 10) || 0;
      if (count === 0) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
      }

      container.style.display = 'block';
      var itemWord = count === 1 ? 'item' : 'items';
      var formattedTotal = formatMoney(cartData.total || '0.00');

      container.innerHTML = 
        '<aside class="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40 h-14 px-4 flex items-center justify-between rounded-lg bg-guest-brand text-guest-brand-contrast shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 ease-guest-entrance">' +
          '<span class="text-[15px] font-medium tracking-tight text-guest-brand-contrast">' +
            escapeHtml(String(count)) + ' ' + itemWord + ' · ' + escapeHtml(formattedTotal) +
          '</span>' +
          '<a href="/cart" class="bg-guest-surface-raised text-guest-text-primary hover:bg-guest-surface-sunken inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3">' +
            'View cart' +
          '</a>' +
        '</aside>';
    }

    function init() {
      updateCartBar();
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
          var itemId = card.getAttribute('data-item-id') || '';
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
            sheet.setAttribute('data-item-id', itemId);
            sheet.setAttribute('data-item-name', name || '');
            sheet.setAttribute('data-base-price', String(basePrice));
            sheet.setAttribute('data-raw-price', rawPriceStr || String(basePrice));
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
              html += '<div class="modifier-group mb-4" data-group-id="' + escapeHtml(group.id) + '" data-group-name="' + escapeHtml(group.name) + '">';
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
                  html += '<input type="' + inputType + '" name="' + nameAttr + '" value="' + escapeHtml(opt.id) + '" data-option-id="' + escapeHtml(opt.id) + '" data-option-name="' + escapeHtml(opt.name) + '" data-price="' + escapeHtml(opt.additionalPrice || '0') + '" class="' + inputClass + '" />';
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

        var addToCartBtn = e.target.closest('#add-to-cart-btn');
        if (addToCartBtn) {
          var sheet = document.getElementById('modifier-sheet');
          if (sheet) {
            var itemId = sheet.getAttribute('data-item-id') || '';
            var itemName = sheet.getAttribute('data-item-name') || '';
            var rawPrice = sheet.getAttribute('data-raw-price') || sheet.getAttribute('data-base-price') || '0';
            var basePriceNum = parseFloat(sheet.getAttribute('data-base-price') || '0') || 0;

            var qtyEl = document.getElementById('qty-display');
            var quantity = 1;
            if (qtyEl) {
              quantity = parseInt(qtyEl.textContent || '1', 10) || 1;
            }

            var notesEl = document.getElementById('modifier-notes');
            var notes = notesEl ? notesEl.value.trim() : '';

            var selectedInputs = sheet.querySelectorAll('input:checked');
            var modifiers = [];
            var modifierTotal = 0;
            selectedInputs.forEach(function(input) {
              var optPrice = input.getAttribute('data-price') || '0';
              var optPriceNum = parseFloat(optPrice) || 0;
              modifierTotal += optPriceNum;

              var groupEl = input.closest('.modifier-group');
              var groupName = groupEl ? (groupEl.getAttribute('data-group-name') || '') : '';
              var optName = input.getAttribute('data-option-name') || '';

              modifiers.push({
                group: groupName,
                option: optName,
                price: optPrice
              });
            });

            var lineTotalNum = (basePriceNum + modifierTotal) * quantity;
            var lineTotal = lineTotalNum.toFixed(2);

            var itemIdRandom = 'cart-item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
              try {
                itemIdRandom = crypto.randomUUID();
              } catch (err) {
                // fallback
              }
            }

            var newItem = {
              id: itemIdRandom,
              itemId: itemId,
              name: itemName,
              price: rawPrice,
              quantity: quantity,
              modifiers: modifiers,
              notes: notes,
              lineTotal: lineTotal
            };

            var existingCart = { items: [], itemCount: 0, total: '0.00' };
            try {
              var rawCart = localStorage.getItem('guest_cart');
              if (rawCart) {
                var parsed = JSON.parse(rawCart);
                if (parsed && Array.isArray(parsed.items)) {
                  existingCart = parsed;
                }
              }
            } catch (err) {
              existingCart = { items: [], itemCount: 0, total: '0.00' };
            }

            existingCart.items.push(newItem);

            var totalCount = 0;
            var sumTotal = 0;
            existingCart.items.forEach(function(it) {
              totalCount += it.quantity;
              sumTotal += parseFloat(it.lineTotal || '0') || 0;
            });

            existingCart.itemCount = totalCount;
            existingCart.total = sumTotal.toFixed(2);

            try {
              localStorage.setItem('guest_cart', JSON.stringify(existingCart));
            } catch (err) {
              // ignore
            }

            updateCartBar();

            sheet.style.display = 'none';
            if (notesEl) notesEl.value = '';
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
