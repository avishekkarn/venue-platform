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

  const tableIds = Array.from(
    new Set(orders.map((o) => o.tableId).filter((id): id is string => id !== null))
  );
  const roomIds = Array.from(
    new Set(orders.map((o) => o.roomId).filter((id): id is string => id !== null))
  );

  const [tableLookups, roomLookups] = await Promise.all([
    Promise.all(tableIds.map(async (id) => ({ id, res: await tableRepo.findById(venue.id, id) }))),
    Promise.all(roomIds.map(async (id) => ({ id, res: await roomRepo.findById(venue.id, id) }))),
  ]);

  const tableMap = new Map<string, string>();
  for (const item of tableLookups) {
    if (item.res.ok) {
      tableMap.set(item.id, item.res.value.number);
    }
  }

  const roomMap = new Map<string, string>();
  for (const item of roomLookups) {
    if (item.res.ok) {
      roomMap.set(item.id, item.res.value.number);
    }
  }

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
            className="inline-block size-2 rounded-full bg-staff-text-muted"
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
      <section className="flex-1 p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <p className="text-[18px] text-staff-text-muted">
              No active tickets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
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
        )}
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

  var CONNECTION_ID = 'connection-indicator';
  var CONNECTION_POLL_MS = 5000;
  var CONNECTED_CLASS = 'inline-block size-2 rounded-full bg-staff-text-muted';
  var RECONNECTING_CLASS = 'inline-block size-2 rounded-full bg-[var(--color-status-active)]';

  function setConnectionState(state) {
    var el = document.getElementById(CONNECTION_ID);
    if (!el) return;
    el.setAttribute('data-connection', state);
    el.className = state === 'connected' ? CONNECTED_CLASS : RECONNECTING_CLASS;
  }

  function pollConnection() {
    fetch('/api/kitchen/orders', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin'
    })
      .then(function(res) {
        setConnectionState(res.ok ? 'connected' : 'reconnecting');
      })
      .catch(function() {
        setConnectionState('reconnecting');
      });
  }

  pollConnection();
  setInterval(pollConnection, CONNECTION_POLL_MS);

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

    fetch('/api/kitchen/orders/' + encodeURIComponent(orderId) + '/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function(res) {
      if (res.ok) {
        return res.json().then(function(body) {
          var newState = body && body.data && body.data.state;
          btn.setAttribute('data-current-state', newState || '');
          if (newState === 'PREPARING') {
            btn.textContent = 'Ready';
            btn.setAttribute('data-action', 'ready');
            btn.disabled = false;
          } else if (newState === 'READY') {
            btn.textContent = 'Done';
            btn.removeAttribute('data-action');
            btn.disabled = true;
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
