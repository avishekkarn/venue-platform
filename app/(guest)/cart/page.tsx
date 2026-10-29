import type { Metadata } from "next";
import type { JSX } from "react";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";

export const metadata: Metadata = {
  title: "Your Order",
  robots: {
    index: false,
  },
};

export default async function CartPage(): Promise<JSX.Element> {
  const cookie = await getGuestCookie();
  if (!cookie) {
    redirect("/");
  }

  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const session = await getGuestSession({ repo: guestRepo }, cookie);
  if (!session.ok) {
    redirect("/");
  }

  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venue.ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 text-center">
        <p className="text-base text-guest-text-muted">
          We couldn't load the venue.
        </p>
      </div>
    );
  }

  const locale = venue.value.language;
  const currency = venue.value.currency;
  const isCurrency = locale.length === 3 && locale === locale.toUpperCase();
  const safeCurrency = currency || (isCurrency ? locale : "USD");
  const safeLocale = isCurrency ? "en-US" : locale === "en" ? "en-US" : locale;
  const taxRate = venue.value.taxRate;
  const hasCounterModule = venue.value.modules.includes("COUNTER");

  return (
    <div className="min-h-dvh bg-guest-surface">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-guest-border-subtle bg-guest-surface px-4">
        <a
          href="/menu"
          aria-label="Back to menu"
          className="inline-flex size-9 items-center justify-center rounded-md text-guest-text-primary hover:bg-guest-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </a>
        <h1 className="font-display text-[18px] font-semibold text-guest-text-primary">
          Your order
        </h1>
        <div className="size-9" aria-hidden="true" />
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-6 pb-32">
        <div id="cart-lines" className="flex flex-col gap-3" />

        <div
          id="cart-empty"
          role="status"
          style={{ display: "none" }}
          className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-8 text-center animate-in fade-in duration-300 motion-reduce:animate-none"
        >
          <p className="font-display text-[20px] leading-[26px] text-guest-text-primary">
            Your cart is empty.
          </p>
          <p className="mt-1 text-[14px] leading-[20px] text-guest-text-secondary">
            Explore the menu to add items to your order.
          </p>
          <a
            href="/menu"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-guest-brand px-4 py-2 text-[14px] font-medium text-guest-brand-contrast hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to menu
          </a>
        </div>

        <div id="cart-notes-container" className="mt-6" style={{ display: "none" }}>
          <label
            htmlFor="cart-notes"
            className="block text-[14px] font-medium text-guest-text-secondary mb-2"
          >
            Order notes
          </label>
          <textarea
            id="cart-notes"
            rows={2}
            placeholder="Anything else we should know?"
            aria-label="Order notes"
            className="w-full rounded-md border border-guest-border-subtle bg-guest-surface-raised px-3 py-2 text-[16px] leading-[24px] text-guest-text-primary placeholder:text-guest-text-muted outline-none focus:border-guest-brand focus:ring-0 transition-colors"
          />
        </div>

        <div id="cart-pickup-container" className="mt-6" style={{ display: "none" }}>
          <label
            htmlFor="cart-pickup-name"
            className="block text-[14px] font-medium text-guest-text-secondary mb-2"
          >
            Pickup name <span className="text-guest-brand" aria-hidden="true">*</span>
          </label>
          <input
            id="cart-pickup-name"
            type="text"
            required
            aria-required="true"
            aria-describedby="cart-pickup-helper"
            placeholder="Your name"
            className="w-full h-12 rounded-md border border-guest-border-subtle bg-guest-surface-raised px-3 text-[16px] leading-[24px] text-guest-text-primary placeholder:text-guest-text-muted outline-none focus:border-guest-brand focus:ring-0 transition-colors"
          />
          <p
            id="cart-pickup-helper"
            className="mt-1.5 text-[13px] leading-[18px] text-guest-text-muted"
          >
            So we can call you when your order is ready.
          </p>
        </div>

        <div
          id="cart-summary"
          style={{ display: "none" }}
          className="mt-6 border-t border-guest-border-subtle pt-4 flex flex-col items-end gap-1.5"
        >
          <div className="flex justify-between w-full max-w-xs text-[15px] text-guest-text-secondary">
            <span>Subtotal</span>
            <span id="cart-subtotal" className="font-medium text-guest-text-primary">
              $0.00
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs text-[15px] text-guest-text-secondary">
            <span>Tax</span>
            <span id="cart-tax" className="font-medium text-guest-text-primary">
              $0.00
            </span>
          </div>
          <div className="flex justify-between w-full max-w-xs pt-2 border-t border-guest-border-subtle text-[17px] font-semibold text-guest-text-primary">
            <span>Total</span>
            <span id="cart-total">$0.00</span>
          </div>
        </div>
      </main>

      <div
        id="cart-footer"
        style={{ display: "none" }}
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-guest-border-subtle bg-guest-surface/95 backdrop-blur-sm p-4"
      >
        <div className="mx-auto max-w-2xl flex flex-col items-center gap-2">
          <button
            id="place-order-btn"
            type="button"
            disabled
            aria-disabled="true"
            aria-describedby="place-order-status"
            className="w-full h-[52px] px-5 rounded-md bg-guest-brand text-guest-brand-contrast font-medium text-base inline-flex items-center justify-center opacity-40 cursor-not-allowed select-none outline-none"
          >
            Place order
          </button>
          <p
            id="place-order-status"
            className="text-[13px] leading-[18px] text-guest-text-secondary text-center"
          >
            Ordering opens soon.
          </p>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
  (function() {
    var currency = ${JSON.stringify(safeCurrency)};
    var locale = ${JSON.stringify(safeLocale)};
    var taxRate = ${JSON.stringify(taxRate)};
    var hasCounterModule = ${JSON.stringify(hasCounterModule)};
    var currentIdempotencyKey = null;
    var isSubmittingOrder = false;
    var orderPlacedMessage = null;

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

    function renderCart() {
      var cartData = { items: [], itemCount: 0, total: '0.00', orderNotes: '', pickupName: '' };
      try {
        var raw = localStorage.getItem('guest_cart');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') cartData = parsed;
        }
      } catch (e) {}

      var linesContainer = document.getElementById('cart-lines');
      var emptyContainer = document.getElementById('cart-empty');
      var notesContainer = document.getElementById('cart-notes-container');
      var notesInput = document.getElementById('cart-notes');
      var pickupContainer = document.getElementById('cart-pickup-container');
      var pickupInput = document.getElementById('cart-pickup-name');
      var summaryContainer = document.getElementById('cart-summary');
      var footerContainer = document.getElementById('cart-footer');
      if (!linesContainer || !emptyContainer) return;

      var items = Array.isArray(cartData.items) ? cartData.items : [];
      if (items.length === 0) {
        linesContainer.innerHTML = '';
        linesContainer.style.display = 'none';
        emptyContainer.style.display = 'block';
        if (notesContainer) notesContainer.style.display = 'none';
        if (pickupContainer) pickupContainer.style.display = 'none';
        if (summaryContainer) summaryContainer.style.display = 'none';
        if (footerContainer) footerContainer.style.display = 'none';
        return;
      }

      emptyContainer.style.display = 'none';
      linesContainer.style.display = 'flex';
      if (notesContainer) notesContainer.style.display = 'block';
      if (pickupContainer) pickupContainer.style.display = hasCounterModule ? 'block' : 'none';
      if (summaryContainer) summaryContainer.style.display = 'flex';
      if (footerContainer) footerContainer.style.display = 'block';
      if (notesInput && document.activeElement !== notesInput) {
        notesInput.value = cartData.orderNotes || '';
      }
      if (pickupInput && document.activeElement !== pickupInput) {
        pickupInput.value = cartData.pickupName || '';
      }

      var html = '';
      items.forEach(function(item, index) {
        var lineId = item.id || ('line-' + index);
        var name = escapeHtml(item.name || 'Item');
        var qty = parseInt(item.quantity, 10) || 1;
        var lineTotalFormatted = formatMoney(item.lineTotal || item.price || '0.00');

        var modifierLabels = [];
        if (Array.isArray(item.modifiers)) {
          item.modifiers.forEach(function(mod) {
            if (mod && mod.option) {
              modifierLabels.push(escapeHtml(mod.option));
            }
          });
        }
        var modSummary = modifierLabels.join(', ');
        var notesText = item.notes ? escapeHtml(item.notes.trim()) : '';

        var isMinQty = qty <= 1;
        var isMaxQty = qty >= 99;

        html += '<div class="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-4 flex flex-col gap-3 shadow-sm animate-in fade-in duration-200 motion-reduce:animate-none" data-line-card data-line-id="' + escapeHtml(lineId) + '">';
        html += '  <div class="flex items-start justify-between gap-3">';
        html += '    <div class="flex-1 min-w-0">';
        html += '      <h2 class="font-display text-[16px] leading-[22px] font-semibold text-guest-text-primary break-words">' + name + '</h2>';
        if (modSummary) {
          html += '      <p class="mt-1 text-[13px] leading-[18px] text-guest-text-secondary break-words">' + modSummary + '</p>';
        }
        if (notesText) {
          html += '      <p class="mt-1 text-[12px] leading-[16px] italic text-guest-text-muted break-words">&ldquo;' + notesText + '&rdquo;</p>';
        }
        html += '    </div>';
        html += '    <span class="text-[16px] font-semibold text-guest-text-primary shrink-0">' + lineTotalFormatted + '</span>';
        html += '  </div>';
        html += '  <div class="flex items-center justify-between pt-2 border-t border-guest-border-subtle">';
        html += '    <div class="flex items-center gap-1" role="group" aria-label="Quantity for ' + name + '">';
        html += '      <button type="button" data-action="qty-minus" data-line-id="' + escapeHtml(lineId) + '" aria-label="Decrease quantity" ' + (isMinQty ? 'disabled ' : '') + 'class="inline-flex size-11 items-center justify-center rounded-md border border-guest-border-subtle bg-guest-surface text-guest-text-primary hover:bg-guest-surface-sunken active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-transform motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">';
        html += '        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
        html += '      </button>';
        html += '      <span class="min-w-[36px] text-center text-[15px] font-semibold text-guest-text-primary select-none" aria-live="polite">' + qty + '</span>';
        html += '      <button type="button" data-action="qty-plus" data-line-id="' + escapeHtml(lineId) + '" aria-label="Increase quantity" ' + (isMaxQty ? 'disabled ' : '') + 'class="inline-flex size-11 items-center justify-center rounded-md border border-guest-border-subtle bg-guest-surface text-guest-text-primary hover:bg-guest-surface-sunken active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-transform motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">';
        html += '        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>';
        html += '      </button>';
        html += '    </div>';
        html += '    <button type="button" data-action="remove" data-line-id="' + escapeHtml(lineId) + '" aria-label="Remove item" class="inline-flex size-11 items-center justify-center rounded-md text-guest-text-muted hover:text-guest-text-primary hover:bg-guest-surface-sunken active:scale-95 transition-all motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">';
        html += '      <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
        html += '    </button>';
        html += '  </div>';
        html += '</div>';
      });

      linesContainer.innerHTML = html;

      // Client-side display preview only; authoritative price and tax are recomputed
      // and frozen server-side at order placement (Tasks 5.5.2 and 5.5.3, DECISIONS D-4.1 and D-4.4).
      var subtotal = 0;
      items.forEach(function(item) {
        subtotal += parseFloat(item.lineTotal || item.price || '0') || 0;
      });

      var rateNum = parseFloat(taxRate || '0') || 0;
      var tax = subtotal * rateNum;
      var total = subtotal + tax;

      var subtotalEl = document.getElementById('cart-subtotal');
      var taxEl = document.getElementById('cart-tax');
      var totalEl = document.getElementById('cart-total');

      if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal.toFixed(2));
      if (taxEl) taxEl.textContent = formatMoney(tax.toFixed(2));
      if (totalEl) totalEl.textContent = formatMoney(total.toFixed(2));

      var placeBtn = document.getElementById('place-order-btn');
      var placeStatus = document.getElementById('place-order-status');
      if (placeBtn && !isSubmittingOrder && !orderPlacedMessage) {
        placeBtn.removeAttribute('disabled');
        placeBtn.removeAttribute('aria-disabled');
        placeBtn.className = 'w-full h-[52px] px-5 rounded-md bg-guest-brand text-guest-brand-contrast font-medium text-base inline-flex items-center justify-center hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring';
      }
      if (placeStatus && !isSubmittingOrder && !orderPlacedMessage) {
        placeStatus.textContent = '';
      }
    }

    document.addEventListener('click', function(e) {
      if (e.target && (e.target.id === 'place-order-btn' || e.target.closest('#place-order-btn'))) {
        handlePlaceOrder();
        return;
      }
      var actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;
      var action = actionBtn.getAttribute('data-action');
      var lineId = actionBtn.getAttribute('data-line-id');
      if (!action || !lineId) return;

      var cartData = { items: [], itemCount: 0, total: '0.00', orderNotes: '', pickupName: '' };
      try {
        var raw = localStorage.getItem('guest_cart');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') cartData = parsed;
        }
      } catch (err) {}

      var items = Array.isArray(cartData.items) ? cartData.items : [];
      var targetIndex = -1;
      for (var i = 0; i < items.length; i++) {
        var currentId = items[i].id || ('line-' + i);
        if (String(currentId) === String(lineId)) {
          targetIndex = i;
          break;
        }
      }
      if (targetIndex === -1) return;

      var targetItem = items[targetIndex];

      if (action === 'qty-plus') {
        var curQty = parseInt(targetItem.quantity, 10) || 1;
        if (curQty < 99) {
          targetItem.quantity = curQty + 1;
          var basePrice = parseFloat(targetItem.price || '0') || 0;
          var modTotal = 0;
          if (Array.isArray(targetItem.modifiers)) {
            targetItem.modifiers.forEach(function(m) {
              modTotal += parseFloat(m.price || '0') || 0;
            });
          }
          var unitPrice = basePrice + modTotal;
          targetItem.lineTotal = (unitPrice * targetItem.quantity).toFixed(2);
        }
      } else if (action === 'qty-minus') {
        var curQty = parseInt(targetItem.quantity, 10) || 1;
        if (curQty > 1) {
          targetItem.quantity = curQty - 1;
          var basePrice = parseFloat(targetItem.price || '0') || 0;
          var modTotal = 0;
          if (Array.isArray(targetItem.modifiers)) {
            targetItem.modifiers.forEach(function(m) {
              modTotal += parseFloat(m.price || '0') || 0;
            });
          }
          var unitPrice = basePrice + modTotal;
          targetItem.lineTotal = (unitPrice * targetItem.quantity).toFixed(2);
        }
      } else if (action === 'remove') {
        items.splice(targetIndex, 1);
      } else {
        return;
      }

      var totalCount = 0;
      var sumTotal = 0;
      items.forEach(function(it) {
        totalCount += (parseInt(it.quantity, 10) || 1);
        sumTotal += parseFloat(it.lineTotal || '0') || 0;
      });

      cartData.items = items;
      cartData.itemCount = totalCount;
      cartData.total = sumTotal.toFixed(2);
      cartData.orderNotes = cartData.orderNotes || '';
      cartData.pickupName = cartData.pickupName || '';

      try {
        localStorage.setItem('guest_cart', JSON.stringify(cartData));
      } catch (err) {}

      renderCart();
    });

    // PLACE-ORDER SEAM (W-0001) DISCHARGED (Task 5.6.1, PROGRESS ENTRY-0148).
    // On click, generates or reuses the client idempotency key (D-4.12, SYSTEM.md §9.7),
    // POSTs { idempotencyKey, items, notes, pickupName } to /api/guest/orders (5.6.1),
    // which resolves venue/place from session and calls createOrder (5.5.2) with frozen
    // totals (5.5.1, D-4.1, D-4.4). On success, clears localStorage and shows confirmation;
    // on failure, preserves cart and idempotency key for retry.
    function generateUUID() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
          return crypto.randomUUID();
        } catch (e) {}
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0;
        var v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }

    async function handlePlaceOrder() {
      if (isSubmittingOrder) return;

      var cartData = { items: [], itemCount: 0, total: '0.00', orderNotes: '', pickupName: '' };
      try {
        var raw = localStorage.getItem('guest_cart');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') cartData = parsed;
        }
      } catch (e) {}

      var items = Array.isArray(cartData.items) ? cartData.items : [];
      if (items.length === 0) return;

      var placeBtn = document.getElementById('place-order-btn');
      var placeStatus = document.getElementById('place-order-status');

      if (hasCounterModule) {
        var pickupInput = document.getElementById('cart-pickup-name');
        var val = (pickupInput && pickupInput.value) ? pickupInput.value.trim() : (cartData.pickupName || '').trim();
        if (!val) {
          if (pickupInput) {
            pickupInput.focus();
          }
          if (placeStatus) {
            placeStatus.textContent = 'Please enter a pickup name.';
            placeStatus.className = 'text-[13px] leading-[18px] text-red-600 text-center';
          }
          return;
        }
      }

      if (!currentIdempotencyKey) {
        currentIdempotencyKey = generateUUID();
      }

      isSubmittingOrder = true;
      if (placeBtn) {
        placeBtn.setAttribute('disabled', 'true');
        placeBtn.setAttribute('aria-disabled', 'true');
        placeBtn.className = 'w-full h-[52px] px-5 rounded-md bg-guest-brand text-guest-brand-contrast font-medium text-base inline-flex items-center justify-center opacity-70 cursor-wait select-none outline-none';
        placeBtn.textContent = 'Sending\u2026';
      }
      if (placeStatus) {
        placeStatus.textContent = 'Submitting order\u2026';
        placeStatus.className = 'text-[13px] leading-[18px] text-guest-text-secondary text-center';
      }

      var payloadItems = items.map(function(item) {
        var selectedModifierIds = [];
        if (Array.isArray(item.modifiers)) {
          item.modifiers.forEach(function(mod) {
            if (mod && (mod.id || mod.optionId)) {
              selectedModifierIds.push(mod.id || mod.optionId);
            }
          });
        }
        return {
          menuItemId: item.itemId || item.menuItemId,
          quantity: parseInt(item.quantity, 10) || 1,
          selectedModifierIds: selectedModifierIds,
          notes: item.notes || null,
        };
      });

      var payload = {
        idempotencyKey: currentIdempotencyKey,
        items: payloadItems,
        notes: cartData.orderNotes || null,
        pickupName: cartData.pickupName || null,
      };

      try {
        var response = await fetch('/api/guest/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        var json = await response.json();

        if (response.ok && json.data && json.data.id) {
          try {
            localStorage.removeItem('guest_cart');
          } catch (e) {}
          currentIdempotencyKey = null;
          isSubmittingOrder = false;

          window.location.href = '/order/' + encodeURIComponent(json.data.id);
          return;
        } else {
          isSubmittingOrder = false;
          var errorMsg = (json && json.error && json.error.message) ? json.error.message : 'Unable to place order. Please try again.';
          if (placeBtn) {
            placeBtn.removeAttribute('disabled');
            placeBtn.removeAttribute('aria-disabled');
            placeBtn.className = 'w-full h-[52px] px-5 rounded-md bg-guest-brand text-guest-brand-contrast font-medium text-base inline-flex items-center justify-center hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring';
            placeBtn.textContent = 'Place order';
          }
          if (placeStatus) {
            placeStatus.textContent = errorMsg;
            placeStatus.className = 'text-[13px] leading-[18px] text-red-600 text-center';
          }
        }
      } catch (err) {
        isSubmittingOrder = false;
        if (placeBtn) {
          placeBtn.removeAttribute('disabled');
          placeBtn.removeAttribute('aria-disabled');
          placeBtn.className = 'w-full h-[52px] px-5 rounded-md bg-guest-brand text-guest-brand-contrast font-medium text-base inline-flex items-center justify-center hover:brightness-95 active:scale-[0.98] transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring';
          placeBtn.textContent = 'Place order';
        }
        if (placeStatus) {
          placeStatus.textContent = 'Network error. Please try again.';
          placeStatus.className = 'text-[13px] leading-[18px] text-red-600 text-center';
        }
      }
    }

    function handleNotesInput(e) {
      var target = e.target;
      if (!target || target.id !== 'cart-notes') return;

      var cartData = { items: [], itemCount: 0, total: '0.00', orderNotes: '', pickupName: '' };
      try {
        var raw = localStorage.getItem('guest_cart');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') cartData = parsed;
        }
      } catch (err) {}

      cartData.orderNotes = target.value;

      try {
        localStorage.setItem('guest_cart', JSON.stringify(cartData));
      } catch (err) {}
    }

    function handlePickupInput(e) {
      var target = e.target;
      if (!target || target.id !== 'cart-pickup-name') return;

      var cartData = { items: [], itemCount: 0, total: '0.00', orderNotes: '', pickupName: '' };
      try {
        var raw = localStorage.getItem('guest_cart');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') cartData = parsed;
        }
      } catch (err) {}

      cartData.pickupName = target.value;

      try {
        localStorage.setItem('guest_cart', JSON.stringify(cartData));
      } catch (err) {}
    }

    document.addEventListener('input', handleNotesInput);
    document.addEventListener('change', handleNotesInput);
    document.addEventListener('input', handlePickupInput);
    document.addEventListener('change', handlePickupInput);

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderCart);
    } else {
      renderCart();
    }
  })();
`,
        }}
      />
    </div>
  );
}
