import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Receipt, History, X } from "lucide-react";
import { redirect } from "next/navigation";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { OrderState } from "@/domain/orders/order.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { getMenu } from "@/domain/menu/get-menu";
import { GuestHero } from "@/components/guest/hero";
import { JoinRequestScript } from "@/components/guest/join-request-script";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { MenuList } from "./_menu-list";
import { SpecialEventsStrip } from "./_special-events-strip";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Menu",
  robots: {
    index: false,
  },
};

export default async function MenuPage(): Promise<JSX.Element> {
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

  let placeContext: string | null = null;
  if (session.value.placeType === PlaceType.TABLE) {
    const table = await prisma.table.findUnique({
      where: { id: session.value.placeId },
    });
    if (table) {
      placeContext = `Table ${table.number}`;
    }
  } else if (session.value.placeType === PlaceType.ROOM) {
    const room = await prisma.room.findUnique({
      where: { id: session.value.placeId },
    });
    if (room) {
      placeContext = `Room ${room.number}`;
    }
  }

  const menuRepo = createPrismaMenuRepository(prisma);
  const menuResult = await getMenu({ menuRepo }, venue.value.id);
  const collectionsResult = await menuRepo.listCollections(
    venue.value.id,
    new Date()
  );
  const collections = collectionsResult.ok ? collectionsResult.value : [];
  const itemsResult = await menuRepo.listItems(venue.value.id);

  const orderRepo = createPrismaOrderRepository(prisma);
  const ordersResult = await orderRepo.listForGuestSession(
    venue.value.id,
    session.value.id
  );
  const activeOrder = ordersResult.ok
    ? ordersResult.value
        .filter(
          (o) =>
            o.state !== OrderState.COMPLETED &&
            o.state !== OrderState.CANCELLED
        )
        .sort(
          (a, b) =>
            new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
        )[0]
    : undefined;

  const currentItemStates: Record<string, string> = {};
  if (itemsResult.ok) {
    for (const item of itemsResult.value) {
      currentItemStates[item.id] = item.state;
    }
  } else if (menuResult.ok) {
    for (const category of menuResult.value) {
      for (const item of category.items) {
        currentItemStates[item.id] = item.state;
      }
    }
  }

  const initialSignature = menuResult.ok
    ? menuResult.value
        .map(
          (cat) =>
            `${cat.id}:${cat.items.map((it) => `${it.id}:${it.state}`).join(",")}`
        )
        .join("|")
    : "";

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)]">
      {session.value.placeType === PlaceType.ROOM && (
        <div className="w-full max-w-2xl mx-auto px-4 pt-3">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-guest-text-secondary hover:text-guest-text-primary transition-colors w-fit focus-visible:outline-none"
            aria-label="Back to services"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Services</span>
          </Link>
        </div>
      )}
      <GuestHero venue={venue.value} placeContext={placeContext} />
      <div className="mt-4 flex flex-col items-center justify-center gap-2.5 animate-in fade-in duration-700 delay-500 ease-guest-entrance">
        <a href="#menu-heading">
          <Button size="xl" variant="primary">
            View Menu
          </Button>
        </a>
        {activeOrder ? (
          <Link href={`/order/${activeOrder.id}/track`}>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-guest-brand text-guest-brand-contrast shadow-sm hover:brightness-95 transition-all">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Track Active Order ({activeOrder.state.toLowerCase()}) →
            </span>
          </Link>
        ) : null}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap px-4 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <button
          type="button"
          id="btn-call-waiter"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <Bell className="w-3.5 h-3.5 text-guest-brand" />
          <span>Call Waiter</span>
        </button>

        <button
          type="button"
          id="btn-request-bill"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <Receipt className="w-3.5 h-3.5 text-guest-brand" />
          <span>Request Bill</span>
        </button>

        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <History className="w-3.5 h-3.5 text-guest-brand" />
          <span>View Orders</span>
        </Link>
      </div>
      <SpecialEventsStrip
        collections={collections}
        currency={venue.value.currency}
      />
      <div className="mt-8 max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
        <div className="flex flex-row items-start justify-center gap-4 md:gap-8 text-center">
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              1.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Browse the menu.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              2.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Order from your phone.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              3.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              We bring it to your table.
            </span>
          </div>
        </div>
      </div>
      <section aria-labelledby="menu-heading" className="mt-8 px-4 max-w-2xl mx-auto w-full">
        <h2 id="menu-heading" className="font-display text-[28px] leading-[34px] text-guest-text-primary mb-4">
          Menu
        </h2>
        {!menuResult.ok ? (
          <div className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-6 text-center">
            <p className="text-[14px] leading-[22px] text-guest-text-secondary">
              We couldn't load the menu. Please try again.
            </p>
            <a
              href="/menu"
              className="mt-3 inline-block text-[14px] font-medium text-guest-brand hover:underline"
            >
              Retry
            </a>
          </div>
        ) : menuResult.value.length === 0 ? (
          <div className="rounded-lg border border-guest-border-subtle bg-guest-surface-raised p-6 text-center">
            <p className="text-[14px] leading-[22px] text-guest-text-secondary">
              The menu is being updated. Please check back in a moment.
            </p>
            <a
              href="/menu"
              className="mt-3 inline-block text-[14px] font-medium text-guest-brand hover:underline"
            >
              Retry
            </a>
          </div>
        ) : (
          <MenuList
            menu={menuResult.value}
            locale={venue.value.language}
            currency={venue.value.currency}
          />
        )}
      </section>
      {/* Notification Toast */}
      <div
        id="guest-notification-toast"
        style={{ display: "none" }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] rounded-xl bg-guest-brand text-guest-brand-contrast px-4 py-3 text-xs sm:text-sm font-semibold shadow-lg text-center animate-in fade-in slide-in-from-top-4 duration-300"
      />

      {/* Bill Folio Modal */}
      <div
        id="bill-folio-modal"
        style={{ display: "none" }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bill-folio-title"
      >
        <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-guest-surface-raised border border-guest-border-subtle p-5 sm:p-6 shadow-xl flex flex-col gap-4 max-h-[85dvh] overflow-y-auto">
          <button
            type="button"
            id="close-bill-modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-guest-text-muted hover:text-guest-text-primary hover:bg-guest-surface-sunken transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-guest-brand/10 text-guest-brand flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 id="bill-folio-title" className="font-display text-lg font-semibold text-guest-text-primary">
                Current Bill Summary
              </h3>
              <p id="bill-folio-place" className="text-xs text-guest-text-secondary">
                {venue.value.name}
              </p>
            </div>
          </div>

          <div
            id="bill-status-banner"
            className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-medium text-center"
          >
            ✓ Bill requested! A staff member is preparing your printed receipt.
          </div>

          <div id="bill-folio-content" className="flex flex-col gap-3 divide-y divide-guest-border-subtle/60 text-sm">
            <div className="text-center py-4 text-xs text-guest-text-muted">
              Loading bill details…
            </div>
          </div>

          <div className="pt-2 border-t border-guest-border-subtle flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-guest-text-secondary">
              <span>Subtotal</span>
              <span id="bill-subtotal" className="font-medium text-guest-text-primary">0.00</span>
            </div>
            <div className="flex justify-between text-xs text-guest-text-secondary">
              <span>Tax</span>
              <span id="bill-tax" className="font-medium text-guest-text-primary">0.00</span>
            </div>
            <div className="flex justify-between text-base font-bold text-guest-text-primary pt-1 border-t border-guest-border-subtle/60">
              <span>Grand Total</span>
              <span id="bill-grand-total" className="text-guest-brand">0.00</span>
            </div>
          </div>

          <button
            type="button"
            id="dismiss-bill-btn"
            className="w-full mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold bg-guest-surface-sunken border border-guest-border-subtle text-guest-text-primary hover:bg-guest-surface-raised transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <footer className="mt-6 mb-4 text-center text-xs text-guest-text-muted">
        <p className="font-display text-guest-text-secondary">{venue.value.name}</p>
        <p className="mt-1 text-[10px]">Open daily. Powered by IronMan.</p>
      </footer>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var STORAGE_KEY = 'guest_menu_states';
  var initialStates = ${JSON.stringify(currentItemStates)};
  var currentSignature = ${JSON.stringify(initialSignature)};
  var lastReloadTime = 0;

  // Store host_token in localStorage for session recovery
  try {
    var sId = ${JSON.stringify(session.value.id)};
    var sTok = ${JSON.stringify(session.value.token)};
    if (sId && sTok) {
      localStorage.setItem('host_token_' + sId, sTok);
      localStorage.setItem('host_token_' + sTok, 'claimed');
    }
  } catch (e) {}

  // Seed sessionStorage on initial load if empty
  try {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialStates));
    }
  } catch (e) {}

  function playPing() {
    try {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      var ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function updateItemDOM(itemId, newState) {
    var cards = document.querySelectorAll('[data-item-id="' + itemId + '"]');
    cards.forEach(function(card) {
      var img = card.querySelector('img');
      var h3 = card.querySelector('h3');

      if (newState === 'UNAVAILABLE') {
        card.classList.add('opacity-60');
        card.classList.remove('cursor-pointer');
        card.setAttribute('data-orderable', 'false');
        if (img) img.classList.add('grayscale');
        if (h3) {
          h3.classList.remove('text-guest-text-primary');
          h3.classList.add('text-guest-text-muted');
        }

        var existingBadge = card.querySelector('[data-status="cancelled"], [data-unavailable-badge]');
        if (!existingBadge) {
          var badge = document.createElement('span');
          badge.setAttribute('data-unavailable-badge', 'true');
          badge.setAttribute('data-status', 'cancelled');
          badge.className = 'inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[12px] font-medium leading-[16px] whitespace-nowrap select-none bg-status-cancelled-bg text-status-cancelled';
          badge.textContent = 'Unavailable';
          var titleContainer = h3 ? h3.parentElement : card;
          if (titleContainer) {
            titleContainer.appendChild(badge);
          }
        }
      } else if (newState === 'AVAILABLE') {
        card.classList.remove('opacity-60');
        card.classList.add('cursor-pointer');
        card.setAttribute('data-orderable', 'true');
        card.style.display = '';
        if (img) img.classList.remove('grayscale');
        if (h3) {
          h3.classList.add('text-guest-text-primary');
          h3.classList.remove('text-guest-text-muted');
        }

        var badges = card.querySelectorAll('[data-status="cancelled"], [data-unavailable-badge]');
        badges.forEach(function(b) {
          b.remove();
        });
      } else if (newState === 'HIDDEN') {
        card.style.display = 'none';
      }
    });
  }

  function checkStates() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/menu/states')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(json) {
        if (!json || !Array.isArray(json.data)) return;

        var newItems = json.data;
        var storedRaw = null;
        try {
          storedRaw = sessionStorage.getItem(STORAGE_KEY);
        } catch (e) {}

        var prevStates = storedRaw ? JSON.parse(storedRaw) : initialStates;
        var newStatesMap = {};
        var anyChanged = false;

        for (var i = 0; i < newItems.length; i++) {
          var item = newItems[i];
          newStatesMap[item.id] = item.state;
          if (prevStates[item.id] && prevStates[item.id] !== item.state) {
            anyChanged = true;
            updateItemDOM(item.id, item.state);
          }
        }

        // Check if item order or structure changed via signature
        var now = Date.now();
        if (json.signature && json.signature !== currentSignature) {
          if (now - lastReloadTime > 2000) {
            lastReloadTime = now;
            currentSignature = json.signature;
            try {
              sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newStatesMap));
            } catch (e) {}
            window.location.reload();
            return;
          }
        }

        // Check if items were added or deleted from the roster as fallback
        var cards = document.querySelectorAll('[data-item-id]');
        var domItemIds = {};
        for (var c = 0; c < cards.length; c++) {
          var cid = cards[c].getAttribute('data-item-id');
          if (cid) domItemIds[cid] = true;
        }

        var rosterChanged = false;
        // Check if any non-hidden item in API is missing from the DOM
        for (var k = 0; k < newItems.length; k++) {
          var itm = newItems[k];
          if (itm.state !== 'HIDDEN' && !domItemIds[itm.id]) {
            rosterChanged = true;
            break;
          }
        }

        // Check if any item in the DOM is no longer present in the API response
        if (!rosterChanged) {
          for (var domId in domItemIds) {
            if (!newStatesMap[domId]) {
              rosterChanged = true;
              break;
            }
          }
        }

        if (rosterChanged && (now - lastReloadTime > 2000)) {
          lastReloadTime = now;
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newStatesMap));
          } catch (e) {}
          window.location.reload();
          return;
        }

        if (anyChanged) {
          playPing();
        }

        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newStatesMap));
        } catch (e) {}
      })
      .catch(function() {
        // Network error during poll, retry next tick
      });
  }

  setInterval(checkStates, 5000);

  function getCsrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function showToast(msg) {
    var toast = document.getElementById('guest-notification-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(function() {
      toast.style.display = 'none';
    }, 4000);
  }

  var waiterBtn = document.getElementById('btn-call-waiter');
  if (waiterBtn) {
    waiterBtn.addEventListener('click', function() {
      waiterBtn.disabled = true;
      var originalText = waiterBtn.innerHTML;
      waiterBtn.innerHTML = '<span>Calling…</span>';

      fetch('/api/guest/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ type: 'WAITER' }),
      })
      .then(function(res) {
        if (!res.ok) throw new Error('Failed');
        showToast('✓ Waiter requested. A staff member is on their way!');
        waiterBtn.innerHTML = '<span>Waiter Called ✓</span>';
        setTimeout(function() {
          waiterBtn.disabled = false;
          waiterBtn.innerHTML = originalText;
        }, 15000);
      })
      .catch(function() {
        showToast('Could not notify staff. Please try again.');
        waiterBtn.disabled = false;
        waiterBtn.innerHTML = originalText;
      });
    });
  }

  var billBtn = document.getElementById('btn-request-bill');
  var billModal = document.getElementById('bill-folio-modal');
  var closeBillBtn = document.getElementById('close-bill-modal');
  var dismissBillBtn = document.getElementById('dismiss-bill-btn');

  function closeBillModal() {
    if (billModal) billModal.style.display = 'none';
  }
  if (closeBillBtn) closeBillBtn.addEventListener('click', closeBillModal);
  if (dismissBillBtn) dismissBillBtn.addEventListener('click', closeBillModal);
  if (billModal) {
    billModal.addEventListener('click', function(e) {
      if (e.target === billModal) closeBillModal();
    });
  }

  function loadAndRenderBill() {
    var contentEl = document.getElementById('bill-folio-content');
    var subtotalEl = document.getElementById('bill-subtotal');
    var taxEl = document.getElementById('bill-tax');
    var totalEl = document.getElementById('bill-grand-total');
    var placeEl = document.getElementById('bill-folio-place');

    fetch('/api/guest/bill')
      .then(function(res) { return res.json(); })
      .then(function(json) {
        if (!json || !json.data) return;
        var d = json.data;
        if (placeEl && d.placeLabel) placeEl.textContent = d.placeLabel;
        if (subtotalEl) subtotalEl.textContent = (d.currency || '') + ' ' + (d.summary.subtotal || '0.00');
        if (taxEl) taxEl.textContent = (d.currency || '') + ' ' + (d.summary.tax || '0.00');
        if (totalEl) totalEl.textContent = (d.currency || '') + ' ' + (d.summary.total || '0.00');

        if (!contentEl) return;
        var html = '';

        if (d.orders && d.orders.length > 0) {
          html += '<div class="pt-2"><h4 class="font-semibold text-xs text-guest-text-secondary uppercase tracking-wider mb-2">Food & Beverages</h4><div class="flex flex-col gap-1.5">';
          d.orders.forEach(function(ord) {
            ord.items.forEach(function(it) {
              html += '<div class="flex justify-between text-xs text-guest-text-primary"><span>' + it.quantity + '× ' + it.name + '</span><span class="font-medium">' + (d.currency || '') + ' ' + it.lineTotal + '</span></div>';
            });
          });
          html += '</div></div>';
        }

        if (d.payableServices && d.payableServices.length > 0) {
          html += '<div class="pt-2"><h4 class="font-semibold text-xs text-guest-text-secondary uppercase tracking-wider mb-2">Hotel Services</h4><div class="flex flex-col gap-1.5">';
          d.payableServices.forEach(function(srv) {
            html += '<div class="flex justify-between text-xs text-guest-text-primary"><span>' + srv.serviceName + '</span><span class="font-medium">' + (d.currency || '') + ' ' + srv.price + '</span></div>';
          });
          html += '</div></div>';
        }

        if (d.summary && d.summary.roomStayCharge) {
          html += '<div class="pt-2"><h4 class="font-semibold text-xs text-guest-text-secondary uppercase tracking-wider mb-2">Room Accommodation</h4><div class="flex flex-col gap-1.5"><div class="flex justify-between text-xs text-guest-text-primary"><span>' + d.summary.roomStayCharge.categoryName + ' Room Rate</span><span class="font-medium">' + (d.currency || '') + ' ' + d.summary.roomStayCharge.basePrice + '</span></div></div></div>';
        }

        if (!d.orders.length && !d.payableServices.length && (!d.summary || !d.summary.roomStayCharge)) {
          html = '<div class="text-center py-4 text-xs text-guest-text-muted">No billable items on your folio yet.</div>';
        }

        contentEl.innerHTML = html;
      })
      .catch(function() {
        if (contentEl) contentEl.innerHTML = '<div class="text-center py-4 text-xs text-status-cancelled">Failed to load bill items.</div>';
      });
  }

  if (billBtn) {
    billBtn.addEventListener('click', function() {
      fetch('/api/guest/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        },
        body: JSON.stringify({ type: 'BILL' }),
      }).catch(function() {});

      if (billModal) billModal.style.display = 'flex';
      loadAndRenderBill();
    });
  }
})();
`,
        }}
      />
      <JoinRequestScript />
    </div>
  );
}

