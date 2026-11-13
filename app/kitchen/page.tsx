import type { JSX } from "react";
import Script from "next/script";
import { redirect } from "next/navigation";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import { canAccess } from "@/domain/auth/can-access";
import { OrderState, PlaceType, type Order } from "@/domain/orders/order.repository";
import { formatTime } from "@/lib/date";
import { KitchenTicket } from "@/components/staff/kitchen-ticket";
import { LogoutButton } from "./_logout-button";

interface PlaceDisplay {
  readonly number: string;
  readonly type: string;
}

function getPlaceInfo(
  order: Order,
  tableMap: Map<string, string>,
  roomMap: Map<string, string>
): PlaceDisplay {
  switch (order.placeType) {
    case PlaceType.TABLE: {
      const tableId = order.tableId;
      const num = tableId !== null ? tableMap.get(tableId) ?? tableId.slice(0, 4) : "—";
      return { number: num, type: "TABLE" };
    }
    case PlaceType.ROOM: {
      const roomId = order.roomId;
      const num = roomId !== null ? roomMap.get(roomId) ?? roomId.slice(0, 4) : "—";
      return { number: num, type: "ROOM" };
    }
    case PlaceType.COUNTER: {
      const name = order.pickupName ?? "Counter";
      return { number: name, type: "COUNTER" };
    }
    default:
      return { number: "—", type: "PLACE" };
  }
}

export default async function KitchenPage(): Promise<JSX.Element> {
  // 1. Session and role check
  const staff = await getAuthenticatedStaff();
  if (staff === null) {
    redirect("/kitchen/login");
  }
  if (!canAccess(staff.roles, "kitchen")) {
    redirect("/forbidden");
  }

  // 2. Venue resolution
  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venueResult.ok) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-staff-surface">
        <p className="text-status-cancelled text-[18px]">
          Venue configuration could not be loaded.
        </p>
      </main>
    );
  }
  const venue = venueResult.value;

  // 3. Read kitchen orders (APPROVED, PREPARING, READY)
  const orderRepo = createPrismaOrderRepository(prisma);
  const [approvedRes, preparingRes, readyRes] = await Promise.all([
    orderRepo.listForVenue(venue.id, { state: OrderState.APPROVED }),
    orderRepo.listForVenue(venue.id, { state: OrderState.PREPARING }),
    orderRepo.listForVenue(venue.id, { state: OrderState.READY }),
  ]);

  const orders = [
    ...(approvedRes.ok ? approvedRes.value : []),
    ...(preparingRes.ok ? preparingRes.value : []),
    ...(readyRes.ok ? readyRes.value : []),
  ].sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());

  // 4. Resolve places (tables and rooms)
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const [tablesRes, roomsRes] = await Promise.all([
    tableRepo.listForVenue(venue.id),
    roomRepo.listForVenue(venue.id),
  ]);

  const tableMap = new Map<string, string>();
  if (tablesRes.ok) {
    for (const item of tablesRes.value) {
      tableMap.set(item.id, item.number);
    }
  }

  const roomMap = new Map<string, string>();
  if (roomsRes.ok) {
    for (const item of roomsRes.value) {
      roomMap.set(item.id, item.number);
    }
  }

  const tablesObj = Object.fromEntries(tableMap);
  const roomsObj = Object.fromEntries(roomMap);

  const now = Date.now();
  const currentTime = formatTime(new Date(now), "en-US");

  return (
    <main className="min-h-dvh flex flex-col bg-staff-surface text-staff-text-primary">
      {/* Status strip */}
      <header className="sticky top-0 z-10 h-12 bg-staff-surface border-b border-staff-border-subtle px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-staff-text-primary">
            {venue.name}
          </span>
          <span
            id="connection-indicator"
            data-connection="connected"
            className="inline-block size-2 rounded-full bg-[var(--color-status-ready)]"
            title="Connection status"
            aria-label="Connection indicator"
          />
        </div>
        <div className="flex items-center gap-4">
          <time className="font-mono text-sm text-staff-text-muted">
            {currentTime}
          </time>
          <button
            type="button"
            id="theme-toggle"
            aria-label="Switch to light mode"
            className="inline-flex items-center justify-center size-8 rounded-full text-staff-text-muted hover:bg-staff-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-brand focus-visible:ring-offset-2 focus-visible:ring-offset-staff-surface transition-colors duration-staff-fast ease-staff-out"
          >
            <svg
              data-theme-icon="sun"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
              style={{ display: "none" }}
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
            <svg
              data-theme-icon="moon"
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Ticket Grid or Empty State */}
      <section className="flex-1 p-4 pt-16">
        <div className="flex items-center gap-2 mb-4 sticky top-12 z-10 bg-staff-surface py-2 -mx-4 px-4">
          <button data-filter="all" className="px-3 py-1.5 rounded-md text-sm font-medium bg-staff-brand text-staff-brand-contrast">All</button>
          <button data-filter="active" className="px-3 py-1.5 rounded-md text-sm font-medium text-staff-text-secondary hover:bg-staff-surface-sunken">Preparing</button>
          <button data-filter="ready" className="px-3 py-1.5 rounded-md text-sm font-medium text-staff-text-secondary hover:bg-staff-surface-sunken">Ready</button>
        </div>
        <div
          id="ticket-empty"
          className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8"
          style={{ display: orders.length === 0 ? "" : "none" }}
        >
          <p className="text-[18px] text-staff-text-muted">
            No active tickets.
          </p>
        </div>
        <div
          id="ticket-grid"
          className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4"
          style={{ display: orders.length === 0 ? "none" : "" }}
        >
          {orders.map((order) => {
            const place = getPlaceInfo(order, tableMap, roomMap);
            return (
              <KitchenTicket
                key={order.id}
                order={order}
                place={place}
                now={now}
              />
            );
          })}
        </div>
      </section>

      {/* Fixed bottom-right logout button */}
      <aside className="fixed bottom-4 right-4 z-20">
        <LogoutButton />
      </aside>

      {/* Toast notification */}
      <div
        id="kitchen-toast"
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm shadow-lg pointer-events-none"
        style={{ display: "none" }}
      />

      <Script
        id="kitchen-actions"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var currentFilter = 'all';

  function getCsrfToken() {
    // The CSRF cookie (D-20.1) is NOT HttpOnly, so the client can read it.
    // Server source of truth: src/infrastructure/csrf/cookies.ts
    // Cookie name is 'csrf_token'; header name is 'X-CSRF-Token'.
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  document.addEventListener('click', function(event) {
    var el = event.target;
    if (el.hasAttribute && el.hasAttribute('data-filter')) {
      currentFilter = el.getAttribute('data-filter');
      var buttons = document.querySelectorAll('[data-filter]');
      for (var b = 0; b < buttons.length; b++) {
        buttons[b].className = buttons[b].getAttribute('data-filter') === currentFilter
          ? 'px-3 py-1.5 rounded-md text-sm font-medium bg-staff-brand text-staff-brand-contrast'
          : 'px-3 py-1.5 rounded-md text-sm font-medium text-staff-text-secondary hover:bg-staff-surface-sunken';
      }
      applyFilter();
    }
  });

  function applyFilter() {
    var grid = document.getElementById('ticket-grid');
    if (!grid) return;
    var articles = grid.querySelectorAll('[data-ticket-id]');
    for (var i = 0; i < articles.length; i++) {
      var art = articles[i];
      var state = art.getAttribute('data-order-state');
      var show = false;
      if (currentFilter === 'all') show = true;
      else if (currentFilter === 'active' && (state === 'PREPARING' || state === 'APPROVED')) show = true;
      else if (currentFilter === 'ready' && state === 'READY') show = true;
      art.style.display = show ? '' : 'none';
    }
  }

  var THEME_KEY = 'kitchen_theme';
  var THEME_ELEMENT_SELECTOR = '[data-world="staff"]';

  function getThemeElement() {
    return document.querySelector(THEME_ELEMENT_SELECTOR);
  }

  function readStoredTheme() {
    try {
      var v = window.localStorage.getItem(THEME_KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }

  function applyTheme(theme) {
    var el = getThemeElement();
    if (!el) return;
    el.setAttribute('data-theme', theme);
    var sun = document.querySelector('[data-theme-icon="sun"]');
    var moon = document.querySelector('[data-theme-icon="moon"]');
    var btn = document.getElementById('theme-toggle');
    if (sun) sun.style.display = theme === 'dark' ? 'none' : 'inline-block';
    if (moon) moon.style.display = theme === 'dark' ? 'inline-block' : 'none';
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function currentTheme() {
    var el = getThemeElement();
    var v = el ? el.getAttribute('data-theme') : null;
    return v === 'light' || v === 'dark' ? v : 'dark';
  }

  function flipTheme() {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    writeStoredTheme(next);
  }

  var stored = readStoredTheme();
  applyTheme(stored || 'dark');

  document.addEventListener('click', function(event) {
    var el = event.target;
    for (var i = 0; i < 4 && el; i++) {
      if (el.id === 'theme-toggle') {
        event.preventDefault();
        flipTheme();
        return;
      }
      el = el.parentElement;
    }
  });

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;
  if (AudioContextClass) {
    try {
      audioCtx = new AudioContextClass();
    } catch (e) {}
  }

  function unlockAudio() {
    if (!audioCtx && AudioContextClass) {
      try {
        audioCtx = new AudioContextClass();
      } catch (e) {}
    }
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    try {
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      var now = audioCtx.currentTime;
      osc.start(now);
      osc.stop(now + 0.001);
    } catch (e) {}
  }

  document.addEventListener('click', unlockAudio, { once: true });
  document.addEventListener('touchstart', unlockAudio, { once: true });
  document.addEventListener('keydown', unlockAudio, { once: true });

  var CONNECTION_ID = 'connection-indicator';
  var CONNECTION_POLL_MS = 5000;
  var CONNECTED_CLASS = 'inline-block size-2 rounded-full bg-[var(--color-status-ready)]';
  var RECONNECTING_CLASS = 'inline-block size-2 rounded-full bg-[var(--color-status-active)]';

  var TABLE_MAP = ${JSON.stringify(tablesObj)};
  var ROOM_MAP = ${JSON.stringify(roomsObj)};

  function playPing() {
    try {
      if (!audioCtx && AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
      if (!audioCtx) return;

      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      var now = audioCtx.currentTime;

      var osc1 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);

      var osc2 = audioCtx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);

      var gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.30);
      osc2.stop(now + 0.30);
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function parseModifiers(modifiersJson) {
    if (!Array.isArray(modifiersJson)) return [];
    var result = [];
    for (var i = 0; i < modifiersJson.length; i++) {
      var item = modifiersJson[i];
      if (item && typeof item === 'object') {
        if (typeof item.option === 'string') {
          result.push(item.option);
        } else if (typeof item.name === 'string') {
          result.push(item.name);
        }
      }
    }
    return result;
  }

  function getPlaceInfo(order) {
    if (order.placeType === 'TABLE') {
      var tid = order.tableId;
      var num = tid ? (TABLE_MAP[tid] || tid.slice(0, 4)) : '—';
      return { number: num, type: 'TABLE' };
    } else if (order.placeType === 'ROOM') {
      var rid = order.roomId;
      var num = rid ? (ROOM_MAP[rid] || rid.slice(0, 4)) : '—';
      return { number: num, type: 'ROOM' };
    } else if (order.placeType === 'COUNTER') {
      var name = order.pickupName || 'Counter';
      return { number: name, type: 'COUNTER' };
    }
    return { number: '—', type: 'PLACE' };
  }

  function renderTicketHtml(order, place, now) {
    var elapsedMinutes = Math.max(0, Math.floor((now - new Date(order.placedAt).getTime()) / 60000));
    var isStale = elapsedMinutes >= 15;
    var borderClass = isStale ? 'border-2 border-[var(--color-status-active)]' : 'border border-staff-border-subtle';

    var itemsHtml = '';
    if (Array.isArray(order.items)) {
      for (var i = 0; i < order.items.length; i++) {
        var it = order.items[i];
        var qtyHtml = it.quantity > 1 ? '<span class="font-mono text-[16px] font-medium text-staff-text-muted">' + it.quantity + '×</span>' : '';
        var modArray = parseModifiers(it.modifiersJson);
        var modHtml = modArray.length > 0 ? '<p class="text-[14px] text-staff-text-muted pl-3">' + escapeHtml(modArray.join(', ')) + '</p>' : '';
        var itemNote = (it.notes && it.notes.trim()) ? '<p class="text-[14px] text-staff-text-primary pl-2 border-l-2 border-[var(--color-status-active)] italic">' + escapeHtml(it.notes) + '</p>' : '';
        itemsHtml += '<li class="flex flex-col gap-1">' +
          '<div class="flex items-baseline gap-2">' +
          qtyHtml +
          '<span class="text-[18px] font-medium text-staff-text-primary leading-snug">' + escapeHtml(it.itemName) + '</span>' +
          '</div>' +
          modHtml +
          itemNote +
          '</li>';
      }
    }

    var orderNotesHtml = (order.notes && order.notes.trim()) ?
      '<div class="pt-2 border-t border-staff-border-subtle">' +
      '<p class="text-[14px] text-staff-text-primary pl-2 border-l-2 border-[var(--color-status-active)] italic">' +
      '<span class="font-medium not-italic text-staff-text-muted mr-1">Note:</span>' +
      escapeHtml(order.notes) +
      '</p>' +
      '</div>' : '';

    var isReady = order.state === 'READY';
    var action = (order.state === 'APPROVED' || order.state === 'PLACED') ? 'start' : (order.state === 'PREPARING' ? 'ready' : '');
    var actionAttr = action ? ' data-action="' + action + '"' : '';
    var disabledAttr = isReady ? ' disabled' : '';
    var btnText = (order.state === 'APPROVED' || order.state === 'PLACED') ? 'Start' : (order.state === 'PREPARING' ? 'Ready' : (order.state === 'READY' ? 'Done' : 'View'));
    var btnClass = "group/button inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent bg-clip-padding font-medium whitespace-nowrap select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4 bg-guest-brand text-guest-brand-contrast hover:brightness-95 [data-world=staff]_&:bg-staff-brand [data-world=staff]_&:text-staff-brand-contrast h-[52px] px-5 text-base w-full";
    var removeBtnHtml = isReady ? '<button type="button" data-order-id="' + escapeHtml(order.id) + '" data-action="complete" class="w-full h-10 rounded-md bg-guest-brand text-guest-brand-contrast text-sm font-medium hover:brightness-95 transition-all">Remove from Kitchen</button>' : '';

    return '<article data-ticket-id="' + escapeHtml(order.id) + '" data-order-state="' + escapeHtml(order.state) + '" data-placed-at="' + escapeHtml(new Date(order.placedAt).toISOString()) + '" class="bg-staff-surface-raised rounded-lg p-5 flex flex-col justify-between gap-4 ' + borderClass + '">' +
      '<div class="flex flex-col gap-4">' +
        '<div class="flex items-baseline justify-between gap-2">' +
          '<span class="font-mono text-[20px] font-semibold text-staff-text-primary tracking-tight">#' + escapeHtml(order.id.slice(0, 8).toUpperCase()) + '</span>' +
          '<span data-elapsed-time="" class="font-mono text-[14px] text-staff-text-muted">' + elapsedMinutes + ' min</span>' +
        '</div>' +
        '<div class="flex flex-col">' +
          '<span class="text-[40px] leading-[44px] font-semibold text-staff-text-primary tracking-tight">' + escapeHtml(place.number) + '</span>' +
          '<span class="text-[12px] uppercase tracking-wider text-staff-text-muted font-medium">' + escapeHtml(place.type) + '</span>' +
        '</div>' +
        '<hr class="border-t border-staff-border-subtle" />' +
        '<ul class="flex flex-col gap-3">' + itemsHtml + '</ul>' +
        orderNotesHtml +
      '</div>' +
      '<div class="pt-2 flex flex-col gap-2">' +
        '<button type="button" data-slot="button"' + disabledAttr + ' data-order-id="' + escapeHtml(order.id) + '"' + actionAttr + ' data-current-state="' + escapeHtml(order.state) + '" class="' + btnClass + '">' +
          btnText +
        '</button>' +
        removeBtnHtml +
      '</div>' +
    '</article>';
  }

  function updateElapsedTimers() {
    var grid = document.getElementById('ticket-grid');
    if (!grid) return;
    var articles = grid.querySelectorAll('[data-ticket-id]');
    var now = Date.now();
    for (var i = 0; i < articles.length; i++) {
      var art = articles[i];
      var placedAtStr = art.getAttribute('data-placed-at');
      if (!placedAtStr) continue;
      var elapsed = Math.max(0, Math.floor((now - new Date(placedAtStr).getTime()) / 60000));
      var timeEl = art.querySelector('[data-elapsed-time]');
      if (timeEl) {
        timeEl.textContent = elapsed + ' min';
      }
      if (elapsed >= 15) {
        art.classList.remove('border-staff-border-subtle');
        art.classList.add('border-2', 'border-[var(--color-status-active)]');
      }
    }
  }

  function setConnectionState(state) {
    var el = document.getElementById(CONNECTION_ID);
    if (!el) return;
    el.setAttribute('data-connection', state);
    el.className = state === 'connected' ? CONNECTED_CLASS : RECONNECTING_CLASS;
  }

  function pollKitchen() {
    var grid = document.getElementById('ticket-grid');
    var empty = document.getElementById('ticket-empty');
    if (!grid) return;

    var busyTickets = {};
    var currentArticles = grid.querySelectorAll('[data-ticket-id]');
    for (var b = 0; b < currentArticles.length; b++) {
      var cart = currentArticles[b];
      var cbtn = cart.querySelector('[data-order-id]');
      if (cbtn && cbtn.disabled && (cbtn.textContent === 'Sending…' || cbtn.getAttribute('data-action') !== null)) {
        var ctid = cart.getAttribute('data-ticket-id');
        if (ctid) busyTickets[ctid] = true;
      }
    }

    function isTicketBusy(art, tid) {
      if (tid && busyTickets[tid]) return true;
      if (!art) return false;
      var btn = art.querySelector('[data-order-id]');
      if (!btn) return false;
      return btn.disabled && (btn.textContent === 'Sending…' || btn.getAttribute('data-action') !== null);
    }

    fetch('/api/kitchen/orders', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(function(res) {
        if (!res.ok) {
          setConnectionState('reconnecting');
          return;
        }
        setConnectionState('connected');
        return res.json().then(function(body) {
          var orders = (body && body.data) || [];
          orders.sort(function(a, b) {
            return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
          });

          var existingArticles = grid.querySelectorAll('[data-ticket-id]');
          var domTickets = {};
          for (var i = 0; i < existingArticles.length; i++) {
            var art = existingArticles[i];
            domTickets[art.getAttribute('data-ticket-id')] = art;
          }

          var incomingIds = {};
          var hasNewTicket = false;
          var now = Date.now();

          for (var j = 0; j < orders.length; j++) {
            var order = orders[j];
            incomingIds[order.id] = true;
            var existingEl = domTickets[order.id];

            if (!existingEl) {
              hasNewTicket = true;
              var place = getPlaceInfo(order);
              var html = renderTicketHtml(order, place, now);
              var temp = document.createElement('div');
              temp.innerHTML = html.trim();
              if (temp.firstElementChild) {
                grid.appendChild(temp.firstElementChild);
              }
            } else {
              if (isTicketBusy(existingEl, order.id)) {
                continue;
              }

              var currentState = existingEl.getAttribute('data-order-state');
              var btn = existingEl.querySelector('[data-order-id]');

              if (currentState !== order.state) {
                existingEl.setAttribute('data-order-state', order.state);
                if (btn) {
                  btn.setAttribute('data-current-state', order.state);
                  if (order.state === 'PREPARING') {
                    btn.textContent = 'Ready';
                    btn.setAttribute('data-action', 'ready');
                    btn.disabled = false;
                  } else if (order.state === 'READY') {
                    btn.textContent = 'Done';
                    btn.removeAttribute('data-action');
                    btn.disabled = true;
                    var footer = btn.parentElement;
                    if (footer && !footer.querySelector('[data-action="complete"]')) {
                      footer.className = 'pt-2 flex flex-col gap-2';
                      var completeBtn = document.createElement('button');
                      completeBtn.type = 'button';
                      completeBtn.setAttribute('data-order-id', order.id);
                      completeBtn.setAttribute('data-action', 'complete');
                      completeBtn.className = 'w-full h-10 rounded-md bg-guest-brand text-guest-brand-contrast text-sm font-medium hover:brightness-95 transition-all';
                      completeBtn.textContent = 'Remove from Kitchen';
                      footer.appendChild(completeBtn);
                    }
                  }
                }
              }
            }
          }

          for (var tid in domTickets) {
            if (Object.prototype.hasOwnProperty.call(domTickets, tid)) {
              if (!incomingIds[tid]) {
                var toRemove = domTickets[tid];
                if (!isTicketBusy(toRemove, tid) && toRemove && toRemove.parentNode) {
                  toRemove.parentNode.removeChild(toRemove);
                }
              }
            }
          }

          var remaining = grid.querySelectorAll('[data-ticket-id]');
          if (remaining.length === 0) {
            if (empty) empty.style.display = '';
            grid.style.display = 'none';
          } else {
            if (empty) empty.style.display = 'none';
            grid.style.display = '';
          }

          if (hasNewTicket) {
            playPing();
          }

          updateElapsedTimers();
          applyFilter();
        });
      })
      .catch(function() {
        setConnectionState('reconnecting');
      });
  }

  pollKitchen();
  setInterval(pollKitchen, CONNECTION_POLL_MS);

  var toastTimer = null;
  function showToast(msg) {
    var toast = document.getElementById('kitchen-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(function() {
      toast.style.display = 'none';
      toastTimer = null;
    }, 4000);
  }

  document.addEventListener('click', function(event) {
    var el = event.target;
    var btn = null;
    for (var i = 0; i < 4 && el; i++) {
      if (el.hasAttribute && el.hasAttribute('data-order-id')) {
        btn = el;
        break;
      }
      el = el.parentElement;
    }
    if (!btn) return;

    var action = btn.getAttribute('data-action');
    if (!action) return;

    var orderId = btn.getAttribute('data-order-id');
    var previousState = btn.getAttribute('data-current-state');
    var originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = 'Sending…';

    var fetchPromise;
    if (action === 'complete') {
      fetchPromise = fetch('/api/staff/orders/' + encodeURIComponent(orderId) + '/deliver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        }
      }).then(function(delivRes) {
        if (delivRes.ok || delivRes.status === 409) {
          return fetch('/api/staff/orders/' + encodeURIComponent(orderId) + '/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': getCsrfToken(),
            }
          });
        }
        return delivRes;
      });
    } else {
      fetchPromise = fetch('/api/kitchen/orders/' + encodeURIComponent(orderId) + '/' + action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfToken(),
        }
      });
    }

    fetchPromise
    .then(function(res) {
      if (res.ok) {
        return res.json().then(function(body) {
          var newState = body && body.data && body.data.state;
          if (newState === 'COMPLETED') {
            var art = btn.closest ? btn.closest('article') : null;
            if (art && art.parentNode) art.parentNode.removeChild(art);
            var grid = document.getElementById('ticket-grid');
            var empty = document.getElementById('ticket-empty');
            if (grid && empty) {
              var remaining = grid.querySelectorAll('[data-ticket-id]');
              if (remaining.length === 0) {
                empty.style.display = '';
                grid.style.display = 'none';
              }
            }
            return;
          }

          btn.setAttribute('data-current-state', newState || '');
          var art = btn.closest ? btn.closest('article') : null;
          if (art && newState) {
            art.setAttribute('data-order-state', newState);
          }
          if (newState === 'PREPARING') {
            btn.textContent = 'Ready';
            btn.setAttribute('data-action', 'ready');
            btn.disabled = false;
          } else if (newState === 'READY') {
            btn.textContent = 'Done';
            btn.removeAttribute('data-action');
            btn.disabled = true;
            var footer = btn.parentElement;
            if (footer && !footer.querySelector('[data-action="complete"]')) {
              footer.className = 'pt-2 flex flex-col gap-2';
              var completeBtn = document.createElement('button');
              completeBtn.type = 'button';
              completeBtn.setAttribute('data-order-id', orderId);
              completeBtn.setAttribute('data-action', 'complete');
              completeBtn.className = 'w-full h-10 rounded-md bg-guest-brand text-guest-brand-contrast text-sm font-medium hover:brightness-95 transition-all';
              completeBtn.textContent = 'Remove from Kitchen';
              footer.appendChild(completeBtn);
            }
          } else {
            if (previousState === 'APPROVED' || previousState === 'PLACED') {
              btn.textContent = 'Ready';
              btn.setAttribute('data-action', 'ready');
              btn.disabled = false;
            } else {
              btn.textContent = 'Done';
              btn.removeAttribute('data-action');
              btn.disabled = true;
            }
          }
          applyFilter();
        });
      }

      btn.disabled = false;
      btn.textContent = originalText;

      if (res.status === 409) {
        showToast('This ticket was already advanced. Refresh the screen.');
      } else if (res.status === 401 || res.status === 403) {
        return res.json().then(function(body) {
          var msg = (body && body.error && body.error.message) || 'Not authorized';
          showToast(msg);
        }).catch(function() {
          showToast('Not authorized');
        });
      } else if (res.status === 404) {
        showToast('Order not found.');
      } else {
        showToast('Could not update ticket. Please try again.');
      }
    })
    .catch(function() {
      btn.disabled = false;
      btn.textContent = originalText;
      showToast('Network error. Please try again.');
    });
  });
})();
`,
        }}
      />
    </main>
  );
}
