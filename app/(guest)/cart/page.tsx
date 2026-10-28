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

      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div id="cart-lines" className="flex flex-col gap-3" />

        <div
          id="cart-empty"
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
      </main>

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

    function renderCart() {
      var cartData = { items: [], itemCount: 0, total: '0.00' };
      try {
        var raw = localStorage.getItem('guest_cart');
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') cartData = parsed;
        }
      } catch (e) {}

      var linesContainer = document.getElementById('cart-lines');
      var emptyContainer = document.getElementById('cart-empty');
      if (!linesContainer || !emptyContainer) return;

      var items = Array.isArray(cartData.items) ? cartData.items : [];
      if (items.length === 0) {
        linesContainer.innerHTML = '';
        linesContainer.style.display = 'none';
        emptyContainer.style.display = 'block';
        return;
      }

      emptyContainer.style.display = 'none';
      linesContainer.style.display = 'flex';

      var html = '';
      items.forEach(function(item) {
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

        html += '<div class="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-4 flex flex-col gap-2 shadow-sm animate-in fade-in duration-200 motion-reduce:animate-none">';
        html += '  <div class="flex items-start justify-between gap-3">';
        html += '    <div class="flex-1 min-w-0">';
        html += '      <div class="flex items-baseline gap-2">';
        html += '        <span class="text-[14px] font-semibold text-guest-text-secondary shrink-0">' + qty + '&times;</span>';
        html += '        <h2 class="font-display text-[16px] leading-[22px] font-semibold text-guest-text-primary break-words">' + name + '</h2>';
        html += '      </div>';
        if (modSummary) {
          html += '      <p class="mt-1 text-[13px] leading-[18px] text-guest-text-secondary break-words">' + modSummary + '</p>';
        }
        if (notesText) {
          html += '      <p class="mt-1 text-[12px] leading-[16px] italic text-guest-text-muted break-words">&ldquo;' + notesText + '&rdquo;</p>';
        }
        html += '    </div>';
        html += '    <span class="text-[15px] font-semibold text-guest-text-primary shrink-0">' + lineTotalFormatted + '</span>';
        html += '  </div>';
        html += '</div>';
      });

      linesContainer.innerHTML = html;
    }

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

