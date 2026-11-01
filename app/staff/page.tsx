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
import { LogoutButton } from "./_logout-button";

export default async function StaffDashboardPage(): Promise<JSX.Element> {
  // 1. Session and role check
  const staff = await getAuthenticatedStaff();
  if (staff === null) {
    redirect("/staff/login");
  }

  const hasAccess =
    canAccess(staff.roles, "table-service") ||
    canAccess(staff.roles, "room-service") ||
    canAccess(staff.roles, "front-desk");

  if (!hasAccess) {
    redirect("/forbidden");
  }

  // 2. Resolve venue
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

  // 3. Schema-correct data fetching
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);
  const orderRepo = createPrismaOrderRepository(prisma);

  const [tablesRes, roomsRes, activeSessions, placedRes, readyRes, deliveredRes, completedRes] = await Promise.all([
    tableRepo.listForVenue(venue.id),
    roomRepo.listForVenue(venue.id),
    prisma.guestSession.findMany({
      where: { venueId: venue.id, endedAt: null },
      select: { tableId: true, roomId: true },
    }),
    orderRepo.listForVenue(venue.id, { state: OrderState.PLACED }),
    orderRepo.listForVenue(venue.id, { state: OrderState.READY }),
    orderRepo.listForVenue(venue.id, { state: OrderState.DELIVERED }),
    orderRepo.listForVenue(venue.id, { state: OrderState.COMPLETED }),
  ]);

  const activeTableIds = new Set<string>();
  const activeRoomIds = new Set<string>();
  for (const s of activeSessions) {
    if (s.tableId) activeTableIds.add(s.tableId);
    if (s.roomId) activeRoomIds.add(s.roomId);
  }

  // Filter completed orders to the last 4 hours
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const recentCompleted = (completedRes.ok ? completedRes.value : []).filter(
    (o) => new Date(o.placedAt).getTime() >= fourHoursAgo.getTime()
  );

  const rawOrders: Order[] = [
    ...(placedRes.ok ? placedRes.value : []),
    ...(readyRes.ok ? readyRes.value : []),
    ...(deliveredRes.ok ? deliveredRes.value : []),
    ...recentCompleted,
  ];

  // Enrich missing tableId on orders by joining through guestSession
  const missingSessionIds = rawOrders
    .filter((o) => o.tableId === null && o.guestSessionId !== null)
    .map((o) => o.guestSessionId as string);

  const sessionTableMap: Record<string, string> = {};
  if (missingSessionIds.length > 0) {
    const sessions = await prisma.guestSession.findMany({
      where: { id: { in: missingSessionIds } },
      select: { id: true, tableId: true },
    });
    for (const s of sessions) {
      if (s.tableId) {
        sessionTableMap[s.id] = s.tableId;
      }
    }
  }

  const orders: Order[] = rawOrders
    .map((o) => {
      if (o.tableId === null && o.guestSessionId && sessionTableMap[o.guestSessionId]) {
        return { ...o, tableId: sessionTableMap[o.guestSessionId] ?? null };
      }
      return o;
    })
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  // Also include tables from active orders in activeTableIds
  for (const o of orders) {
    if (o.state !== OrderState.COMPLETED && o.state !== OrderState.CANCELLED) {
      if (o.tableId) activeTableIds.add(o.tableId);
      if (o.roomId) activeRoomIds.add(o.roomId);
    }
  }

  const tables = tablesRes.ok ? tablesRes.value : [];
  const rooms = roomsRes.ok ? roomsRes.value : [];

  const tableMap: Record<string, string> = {};
  for (const t of tables) {
    tableMap[t.id] = t.number;
  }

  const roomMap: Record<string, string> = {};
  for (const r of rooms) {
    roomMap[r.id] = r.number;
  }

  const SCRIPT = `
(function() {
  var TABLE_MAP = ` + JSON.stringify(tableMap) + `;
  var ROOM_MAP = ` + JSON.stringify(roomMap) + `;
  var currentActiveTableIds = ` + JSON.stringify(Array.from(activeTableIds)) + `;
  var currentActiveRoomIds = ` + JSON.stringify(Array.from(activeRoomIds)) + `;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showToast(msg) {
    var t = document.getElementById('staff-toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    if (window._staffToastTimer) clearTimeout(window._staffToastTimer);
    window._staffToastTimer = setTimeout(function() { t.style.display = 'none'; }, 3000);
  }

  function resolvePlace(order) {
    if (order.placeType === 'TABLE' || order.tableId) {
      var num = order.tableId ? (TABLE_MAP[order.tableId] || order.tableId.slice(0, 4)) : '—';
      return { type: 'TABLE', number: 'T' + num };
    }
    if (order.placeType === 'ROOM' || order.roomId) {
      var rnum = order.roomId ? (ROOM_MAP[order.roomId] || order.roomId.slice(0, 4)) : '—';
      return { type: 'ROOM', number: 'R' + rnum };
    }
    if (order.placeType === 'COUNTER') {
      return { type: 'COUNTER', number: order.pickupName || 'Counter' };
    }
    return { type: 'UNKNOWN', number: '—' };
  }

  function formatItemsSummary(items) {
    if (!items || !items.length) return '';
    var parts = [];
    for (var i = 0; i < items.length; i++) {
      parts.push(items[i].quantity + 'x ' + items[i].itemName);
    }
    return parts.join(', ');
  }

  function orderRowHtml(order) {
    var place = resolvePlace(order);
    var badgeText = order.state === 'PLACED' ? 'Placed' : (order.state === 'READY' ? 'Ready' : (order.state === 'DELIVERED' ? 'Delivered' : 'Completed'));
    var badgeClass = order.state === 'PLACED' ? 'bg-amber-100 text-amber-800' : (order.state === 'READY' ? 'bg-emerald-100 text-emerald-800' : (order.state === 'DELIVERED' ? 'bg-sky-100 text-sky-800' : 'bg-status-done-bg text-status-done'));
    var action = order.state === 'PLACED' ? 'approve' : (order.state === 'READY' ? 'deliver' : (order.state === 'DELIVERED' ? 'complete' : 'close-table'));
    var actionLabel = order.state === 'PLACED' ? 'Approve' : (order.state === 'READY' ? 'Deliver' : (order.state === 'DELIVERED' ? 'Complete' : 'Close Table'));
    var cancelBtn = (order.state === 'PLACED' || order.state === 'READY') ? '<button type="button" data-action="cancel" data-order-id="' + escapeHtml(order.id) + '" class="px-3 py-1.5 rounded text-xs font-semibold bg-staff-surface border border-staff-border-subtle text-status-cancelled hover:bg-staff-surface-raised">Cancel</button>' : '';
    var actionBtn = (order.state !== 'COMPLETED' || order.tableId) ? '<button type="button" data-action="' + action + '" data-order-id="' + escapeHtml(order.id) + '" class="px-3 py-1.5 rounded text-xs font-semibold bg-staff-primary text-white hover:opacity-90">' + actionLabel + '</button>' : '';

    return '<article data-order-id="' + escapeHtml(order.id) + '" data-order-state="' + escapeHtml(order.state) + '" data-place-number="' + escapeHtml(place.number) + '" data-table-id="' + escapeHtml(order.tableId || '') + '" class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-staff-surface-raised rounded-xl border border-staff-border-subtle shadow-sm">' +
      '<div class="flex items-center gap-4">' +
        '<span class="text-[32px] font-bold text-staff-text-primary">' + escapeHtml(place.number) + '</span>' +
        '<span class="font-mono text-xs text-staff-text-muted">#' + escapeHtml(order.id.slice(0, 8).toUpperCase()) + '</span>' +
      '</div>' +
      '<div class="flex-1">' +
        '<div class="text-sm font-medium text-staff-text-primary">' + escapeHtml(formatItemsSummary(order.items)) + '</div>' +
        (order.notes ? '<div class="text-xs italic text-staff-text-muted">Note: ' + escapeHtml(order.notes) + '</div>' : '') +
        '<span class="' + badgeClass + ' text-xs px-2 py-0.5 rounded font-medium inline-block mt-1">' + badgeText + '</span>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-2">' +
        actionBtn +
        cancelBtn +
      '</div>' +
    '</article>';
  }

  function tableCardHtml(table, isOccupied) {
    var statusText = isOccupied ? 'Occupied' : 'Free';
    var badgeClass = isOccupied ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300';
    var closeBtn = isOccupied ? '<button type="button" data-action="close-table" data-table-id="' + escapeHtml(table.id) + '" class="mt-2 w-full py-1.5 px-3 rounded text-xs font-medium bg-staff-surface border border-status-cancelled text-status-cancelled hover:bg-status-cancelled hover:text-white transition-colors">Close Table</button>' : '';
    return '<div data-table-id="' + escapeHtml(table.id) + '" data-table-number="' + escapeHtml(table.number) + '" data-table-status="' + (isOccupied ? 'OCCUPIED' : 'FREE') + '" class="p-4 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col justify-between gap-3 shadow-sm">' +
      '<div class="flex items-center justify-between">' +
        '<span class="font-bold text-base text-staff-text-primary">Table ' + escapeHtml(table.number) + '</span>' +
        '<span data-table-status-badge="true" class="px-2 py-0.5 rounded text-xs font-medium border ' + badgeClass + '">' + statusText + '</span>' +
      '</div>' +
      closeBtn +
    '</div>';
  }

  function roomCardHtml(room, isOccupied) {
    var statusText = isOccupied ? 'Occupied' : 'Vacant';
    var badgeClass = isOccupied ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300';
    var checkoutBtn = isOccupied ? '<button type="button" data-action="checkout-room" data-room-id="' + escapeHtml(room.id) + '" class="mt-2 w-full py-1.5 px-3 rounded text-xs font-medium bg-staff-surface border border-status-cancelled text-status-cancelled hover:bg-status-cancelled hover:text-white transition-colors">Checkout Room</button>' : '';
    return '<div data-room-id="' + escapeHtml(room.id) + '" data-room-number="' + escapeHtml(room.number) + '" data-room-status="' + (isOccupied ? 'OCCUPIED' : 'VACANT') + '" class="p-4 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col justify-between gap-3 shadow-sm">' +
      '<div class="flex items-center justify-between">' +
        '<span class="font-bold text-base text-staff-text-primary">Room ' + escapeHtml(room.number) + '</span>' +
        '<span data-room-status-badge="true" class="px-2 py-0.5 rounded text-xs font-medium border ' + badgeClass + '">' + statusText + '</span>' +
      '</div>' +
      checkoutBtn +
    '</div>';
  }

  function updateTableMap() {
    var cards = document.querySelectorAll('#table-map [data-table-id]');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var tid = c.getAttribute('data-table-id');
      var occ = currentActiveTableIds.indexOf(tid) !== -1;
      c.setAttribute('data-table-status', occ ? 'OCCUPIED' : 'FREE');
      var badge = c.querySelector('[data-table-status-badge]');
      if (badge) {
        badge.textContent = occ ? 'Occupied' : 'Free';
        badge.className = 'px-2 py-0.5 rounded text-xs font-medium border ' + (occ ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300');
      }
      var existingBtn = c.querySelector('button[data-action="close-table"]');
      if (occ && !existingBtn) {
        c.insertAdjacentHTML('beforeend', '<button type="button" data-action="close-table" data-table-id="' + escapeHtml(tid) + '" class="mt-2 w-full py-1.5 px-3 rounded text-xs font-medium bg-staff-surface border border-status-cancelled text-status-cancelled hover:bg-status-cancelled hover:text-white transition-colors">Close Table</button>');
      } else if (!occ && existingBtn) {
        existingBtn.remove();
      }
    }
  }

  function updateRoomMap() {
    var cards = document.querySelectorAll('#room-map [data-room-id]');
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var rid = c.getAttribute('data-room-id');
      var occ = currentActiveRoomIds.indexOf(rid) !== -1;
      c.setAttribute('data-room-status', occ ? 'OCCUPIED' : 'VACANT');
      var badge = c.querySelector('[data-room-status-badge]');
      if (badge) {
        badge.textContent = occ ? 'Occupied' : 'Vacant';
        badge.className = 'px-2 py-0.5 rounded text-xs font-medium border ' + (occ ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300');
      }
      var existingBtn = c.querySelector('button[data-action="checkout-room"]');
      if (occ && !existingBtn) {
        c.insertAdjacentHTML('beforeend', '<button type="button" data-action="checkout-room" data-room-id="' + escapeHtml(rid) + '" class="mt-2 w-full py-1.5 px-3 rounded text-xs font-medium bg-staff-surface border border-status-cancelled text-status-cancelled hover:bg-status-cancelled hover:text-white transition-colors">Checkout Room</button>');
      } else if (!occ && existingBtn) {
        existingBtn.remove();
      }
    }
  }

  function updateEmpty() {
    var queue = document.getElementById('order-queue');
    var empty = document.getElementById('order-empty');
    if (!queue || !empty) return;
    var rows = queue.querySelectorAll('[data-order-id]');
    if (rows.length === 0) {
      empty.style.display = 'flex';
      queue.style.display = 'none';
    } else {
      empty.style.display = 'none';
      queue.style.display = 'flex';
    }
  }

  function pollOrders() {
    fetch('/api/staff/orders', { credentials: 'same-origin' })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(body) {
        if (body.activeTableIds) {
          currentActiveTableIds = body.activeTableIds;
        }
        var orders = body.data || [];
        var queue = document.getElementById('order-queue');
        if (!queue) return;
        var domById = {};
        var rows = queue.querySelectorAll('[data-order-id]');
        for (var i = 0; i < rows.length; i++) {
          domById[rows[i].getAttribute('data-order-id')] = rows[i];
        }
        var serverIds = {};
        for (var j = 0; j < orders.length; j++) {
          var o = orders[j];
          serverIds[o.id] = true;
          var ex = domById[o.id];
          if (!ex) {
            queue.insertAdjacentHTML('beforeend', orderRowHtml(o));
          } else if (ex.getAttribute('data-order-state') !== o.state) {
            ex.remove();
            queue.insertAdjacentHTML('beforeend', orderRowHtml(o));
          }
        }
        for (var id in domById) {
          if (!serverIds[id]) {
            domById[id].remove();
          }
        }
        updateEmpty();
        updateTableMap();
      })
      .catch(function() {});
  }

  function handleOrderAction(action, orderId, btn) {
    var row = btn.closest('[data-order-id]');
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    var url;
    var body = null;
    if (action === 'close-table') {
      var tid = row ? row.getAttribute('data-table-id') : null;
      if (!tid) { showToast('No table'); btn.disabled = false; btn.textContent = original; return; }
      if (!window.confirm('Close this table?')) { btn.disabled = false; btn.textContent = original; return; }
      url = '/api/staff/tables/' + encodeURIComponent(tid) + '/close';
    } else if (action === 'cancel') {
      var reason = window.prompt('Cancellation reason:');
      if (!reason) { btn.disabled = false; btn.textContent = original; return; }
      url = '/api/staff/orders/' + encodeURIComponent(orderId) + '/cancel';
      body = JSON.stringify({ reason: reason });
    } else {
      url = '/api/staff/orders/' + encodeURIComponent(orderId) + '/' + encodeURIComponent(action);
    }
    var opts = { method: 'POST', credentials: 'same-origin' };
    if (body) { opts.headers = { 'Content-Type': 'application/json' }; opts.body = body; }
    fetch(url, opts)
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Done'); pollOrders(); })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
  }

  function handleCloseTable(tableId, btn) {
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Closing…';
    fetch('/api/staff/tables/' + encodeURIComponent(tableId) + '/close', {
      method: 'POST',
      credentials: 'same-origin'
    })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() {
        showToast('Table closed');
        var idx = currentActiveTableIds.indexOf(tableId);
        if (idx !== -1) currentActiveTableIds.splice(idx, 1);
        updateTableMap();
        pollOrders();
      })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
  }

  function handleCheckoutRoom(roomId, btn) {
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Checking out…';
    fetch('/api/staff/rooms/' + encodeURIComponent(roomId) + '/checkout', {
      method: 'POST',
      credentials: 'same-origin'
    })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() {
        showToast('Room checked out');
        var idx = currentActiveRoomIds.indexOf(roomId);
        if (idx !== -1) currentActiveRoomIds.splice(idx, 1);
        updateRoomMap();
      })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
  }

  function setupDelegation() {
    document.getElementById('staff-tab-nav').addEventListener('click', function(e) {
      var tab = e.target.closest('[data-tab]');
      if (!tab) return;
      var name = tab.getAttribute('data-tab');
      var containers = { orders: 'orders-container', map: 'table-map', rooms: 'room-map' };
      var tabEls = document.querySelectorAll('[data-tab]');
      for (var i = 0; i < tabEls.length; i++) {
        tabEls[i].className = 'pb-3 text-sm font-medium text-staff-text-muted';
      }
      tab.className = 'pb-3 text-sm font-semibold text-staff-text-primary border-b-2 border-staff-brand';
      for (var key in containers) {
        var el = document.getElementById(containers[key]);
        if (el) {
          el.style.display = key === name ? (key === 'orders' ? 'flex' : 'grid') : 'none';
        }
      }
    });
    document.getElementById('order-queue').addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      handleOrderAction(btn.getAttribute('data-action'), btn.getAttribute('data-order-id'), btn);
    });
    document.getElementById('table-map').addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action="close-table"]');
      if (!btn) return;
      handleCloseTable(btn.getAttribute('data-table-id'), btn);
    });
    document.getElementById('room-map').addEventListener('click', function(e) {
      var btn = e.target.closest('[data-action="checkout-room"]');
      if (!btn) return;
      handleCheckoutRoom(btn.getAttribute('data-room-id'), btn);
    });
  }

  setupDelegation();
  pollOrders();
  setInterval(pollOrders, 5000);
})();
`;

  return (
    <main className="min-h-dvh bg-staff-surface flex flex-col text-staff-text-primary">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-staff-border-subtle bg-staff-surface-raised">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              id="staff-connection-indicator"
              aria-label="System status: Connected"
              className="inline-block size-2.5 rounded-full bg-status-ready"
            />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              {venue.name} — Staff Operations
            </h1>
          </div>
          <p className="text-xs md:text-sm text-staff-text-muted">
            Logged in as <span className="font-semibold text-staff-text-primary">{staff.name}</span> ({staff.roles.join(", ")})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LogoutButton />
        </div>
      </header>

      {/* Nav Tabs */}
      <nav
        id="staff-tab-nav"
        className="px-4 md:px-6 bg-staff-surface-raised border-b border-staff-border-subtle flex items-center gap-6 overflow-x-auto pt-3"
        aria-label="Staff Sections"
      >
        <button
          type="button"
          data-tab="orders"
          id="tab-orders"
          className="pb-3 text-sm font-semibold text-staff-text-primary border-b-2 border-staff-brand whitespace-nowrap cursor-pointer"
        >
          Orders ({orders.length})
        </button>
        <button
          type="button"
          data-tab="map"
          id="tab-map"
          className="pb-3 text-sm font-medium text-staff-text-muted hover:text-staff-text-primary whitespace-nowrap cursor-pointer"
        >
          Table Map ({tables.length})
        </button>
        <button
          type="button"
          data-tab="rooms"
          id="tab-rooms"
          className="pb-3 text-sm font-medium text-staff-text-muted hover:text-staff-text-primary whitespace-nowrap cursor-pointer"
        >
          Room Map ({rooms.length})
        </button>
      </nav>

      {/* Content Container */}
      <section className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
        {/* Orders Queue */}
        <div id="orders-container" className="flex flex-col gap-4">
          <div
            id="order-empty"
            className="flex-col items-center justify-center min-h-[30vh] text-center p-8 border border-dashed border-staff-border-subtle rounded-xl"
            style={{ display: orders.length === 0 ? "flex" : "none" }}
          >
            <p className="text-sm md:text-base text-staff-text-muted">
              No active orders in queue.
            </p>
          </div>
          <div
            id="order-queue"
            className="flex flex-col gap-4"
            style={{ display: orders.length === 0 ? "none" : "flex" }}
          >
            {orders.map((order) => {
              const placeNumber =
                order.placeType === PlaceType.TABLE && order.tableId
                  ? "T" + (tableMap[order.tableId] ?? order.tableId.slice(0, 4))
                  : order.placeType === PlaceType.ROOM && order.roomId
                  ? "R" + (roomMap[order.roomId] ?? order.roomId.slice(0, 4))
                  : order.placeType === PlaceType.COUNTER
                  ? order.pickupName ?? "Counter"
                  : "—";

              const badgeText =
                order.state === OrderState.PLACED
                  ? "Placed"
                  : order.state === OrderState.READY
                  ? "Ready"
                  : order.state === OrderState.DELIVERED
                  ? "Delivered"
                  : "Completed";

              const badgeClass =
                order.state === OrderState.PLACED
                  ? "bg-amber-100 text-amber-800"
                  : order.state === OrderState.READY
                  ? "bg-emerald-100 text-emerald-800"
                  : order.state === OrderState.DELIVERED
                  ? "bg-sky-100 text-sky-800"
                  : "bg-status-done-bg text-status-done";

              const action =
                order.state === OrderState.PLACED
                  ? "approve"
                  : order.state === OrderState.READY
                  ? "deliver"
                  : order.state === OrderState.DELIVERED
                  ? "complete"
                  : "close-table";

              const actionLabel =
                order.state === OrderState.PLACED
                  ? "Approve"
                  : order.state === OrderState.READY
                  ? "Deliver"
                  : order.state === OrderState.DELIVERED
                  ? "Complete"
                  : "Close Table";

              const itemsSummary = order.items
                .map((itm) => itm.quantity + "x " + itm.itemName)
                .join(", ");

              return (
                <article
                  key={order.id}
                  data-order-id={order.id}
                  data-order-state={order.state}
                  data-place-number={placeNumber}
                  data-table-id={order.tableId ?? ""}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-staff-surface-raised rounded-xl border border-staff-border-subtle shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[32px] font-bold text-staff-text-primary">
                      {placeNumber}
                    </span>
                    <span className="font-mono text-xs text-staff-text-muted">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-staff-text-primary">
                      {itemsSummary}
                    </div>
                    {order.notes && (
                      <div className="text-xs italic text-staff-text-muted">
                        Note: {order.notes}
                      </div>
                    )}
                    <span className={`${badgeClass} text-xs px-2 py-0.5 rounded font-medium inline-block mt-1`}>
                      {badgeText}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(order.state !== OrderState.COMPLETED || order.tableId) && (
                      <button
                        type="button"
                        data-action={action}
                        data-order-id={order.id}
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-staff-primary text-white hover:opacity-90"
                      >
                        {actionLabel}
                      </button>
                    )}
                    {(order.state === OrderState.PLACED || order.state === OrderState.READY) && (
                      <button
                        type="button"
                        data-action="cancel"
                        data-order-id={order.id}
                        className="px-3 py-1.5 rounded text-xs font-semibold bg-staff-surface border border-staff-border-subtle text-status-cancelled hover:bg-staff-surface-raised"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Table Map */}
        <div
          id="table-map"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          style={{ display: "none" }}
        >
          {tables.map((table) => {
            const isOccupied = activeTableIds.has(table.id) || table.state === "OCCUPIED";
            const statusText = isOccupied ? "Occupied" : "Free";
            const badgeClass = isOccupied
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-emerald-100 text-emerald-800 border-emerald-300";

            return (
              <div
                key={table.id}
                data-table-id={table.id}
                data-table-number={table.number}
                data-table-status={isOccupied ? "OCCUPIED" : "FREE"}
                className="p-4 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-staff-text-primary">
                    Table {table.number}
                  </span>
                  <span
                    data-table-status-badge="true"
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}
                  >
                    {statusText}
                  </span>
                </div>
                {isOccupied && (
                  <button
                    type="button"
                    data-action="close-table"
                    data-table-id={table.id}
                    className="mt-2 w-full py-1.5 px-3 rounded text-xs font-medium bg-staff-surface border border-status-cancelled text-status-cancelled hover:bg-status-cancelled hover:text-white transition-colors"
                  >
                    Close Table
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Room Map */}
        <div
          id="room-map"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          style={{ display: "none" }}
        >
          {rooms.map((room) => {
            const isOccupied = activeRoomIds.has(room.id) || room.state === "OCCUPIED";
            const statusText = isOccupied ? "Occupied" : "Vacant";
            const badgeClass = isOccupied
              ? "bg-amber-100 text-amber-800 border-amber-300"
              : "bg-emerald-100 text-emerald-800 border-emerald-300";

            return (
              <div
                key={room.id}
                data-room-id={room.id}
                data-room-number={room.number}
                data-room-status={isOccupied ? "OCCUPIED" : "VACANT"}
                className="p-4 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-staff-text-primary">
                    Room {room.number}
                  </span>
                  <span
                    data-room-status-badge="true"
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}`}
                  >
                    {statusText}
                  </span>
                </div>
                {isOccupied && (
                  <button
                    type="button"
                    data-action="checkout-room"
                    data-room-id={room.id}
                    className="mt-2 w-full py-1.5 px-3 rounded text-xs font-medium bg-staff-surface border border-status-cancelled text-status-cancelled hover:bg-status-cancelled hover:text-white transition-colors"
                  >
                    Checkout Room
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Toast Notification Element */}
      <div
        id="staff-toast"
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm shadow-lg pointer-events-none"
        style={{ display: "none" }}
      />

      {/* Controller Script */}
      <Script
        id="staff-controller"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: SCRIPT,
        }}
      />
    </main>
  );
}
