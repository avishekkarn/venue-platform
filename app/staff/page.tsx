import type { JSX } from "react";
import Script from "next/script";
import { redirect } from "next/navigation";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import { canAccess, visibleAreasFor } from "@/domain/auth/can-access";
import { OrderState, PlaceType, type Order } from "@/domain/orders/order.repository";
import { type Table } from "@/domain/organization/table.repository";
import { type Room } from "@/domain/organization/room.repository";
import { LogoutButton } from "./_logout-button";

interface EnrichedOrder extends Order {
  placeNumber: string;
}

function buttonClassForState(state: OrderState): string {
  if (state === OrderState.PLACED) {
    return "inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 cursor-pointer";
  }
  if (state === OrderState.APPROVED || state === OrderState.PREPARING) {
    return "inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-surface-raised text-staff-text-muted opacity-60 cursor-not-allowed";
  }
  if (state === OrderState.READY) {
    return "inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-emerald-600 text-white hover:brightness-95 cursor-pointer";
  }
  if (state === OrderState.DELIVERED) {
    return "inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-blue-600 text-white hover:brightness-95 cursor-pointer";
  }
  if (state === OrderState.COMPLETED) {
    return "inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-surface text-staff-text-primary border border-staff-border-strong hover:bg-staff-surface-raised cursor-pointer";
  }
  return "inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-surface text-staff-text-primary border border-staff-border-subtle";
}

function actionLabelForState(state: OrderState): string {
  if (state === OrderState.PLACED) return "Approve";
  if (state === OrderState.APPROVED || state === OrderState.PREPARING) return "Preparing…";
  if (state === OrderState.READY) return "Deliver";
  if (state === OrderState.DELIVERED) return "Complete";
  if (state === OrderState.COMPLETED) return "Close Table";
  return "";
}

function actionSlugForState(state: OrderState): string {
  if (state === OrderState.PLACED) return "approve";
  if (state === OrderState.READY) return "deliver";
  if (state === OrderState.DELIVERED) return "complete";
  if (state === OrderState.COMPLETED) return "close-table";
  return "";
}

function resolvePlace(
  order: Order,
  tableMap: Record<string, string>,
  roomMap: Record<string, string>
): { number: string; type: string } {
  if (order.placeType === PlaceType.TABLE) {
    return { number: (order.tableId && tableMap[order.tableId]) || "—", type: "Table" };
  }
  if (order.placeType === PlaceType.ROOM) {
    return { number: (order.roomId && roomMap[order.roomId]) || "—", type: "Room" };
  }
  return { number: order.pickupName || "Counter", type: "Counter" };
}

function OrderRow({ order }: { order: EnrichedOrder }): JSX.Element {
  const label = actionLabelForState(order.state);
  const slug = actionSlugForState(order.state);
  const cls = buttonClassForState(order.state);
  const disabled = order.state === OrderState.APPROVED || order.state === OrderState.PREPARING;
  const showAction = order.state !== OrderState.COMPLETED || order.tableId !== null;
  const showCancel = order.state === OrderState.PLACED || order.state === OrderState.READY;

  let badgeClass = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  if (order.state === OrderState.PLACED) badgeClass += " bg-amber-100 text-amber-800";
  else if (order.state === OrderState.READY) badgeClass += " bg-emerald-100 text-emerald-800";
  else if (order.state === OrderState.DELIVERED) badgeClass += " bg-sky-100 text-sky-800";
  else if (order.state === OrderState.COMPLETED) badgeClass += " bg-status-done-bg text-status-done";
  else badgeClass += " bg-purple-100 text-purple-800";

  const itemsSummary = order.items
    .map((itm) => itm.quantity + "x " + itm.itemName)
    .join(", ");

  return (
    <article
      data-order-id={order.id}
      data-order-state={order.state}
      data-place-number={order.placeNumber}
      data-table-id={order.tableId ?? ""}
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-staff-surface-raised rounded-xl border border-staff-border-subtle"
    >
      <div className="flex items-center gap-4">
        <span className="text-[32px] font-bold">{order.placeNumber}</span>
        <div className="flex flex-col">
          <span className="font-mono text-xs">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium">{itemsSummary}</div>
        {order.notes && (
          <div className="text-xs italic text-staff-text-muted">Note: {order.notes}</div>
        )}
        <span className={badgeClass}>{order.state}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showAction && (
          <button
            type="button"
            data-action={slug}
            data-order-id={order.id}
            className={cls}
            disabled={disabled}
          >
            {label}
          </button>
        )}
        {showCancel && (
          <button
            type="button"
            data-action="cancel"
            data-order-id={order.id}
            className="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50"
          >
            Cancel
          </button>
        )}
      </div>
    </article>
  );
}

function TableCard({
  table,
  isOccupied,
  canClose = true,
}: {
  table: Table;
  isOccupied: boolean;
  canClose?: boolean;
}): JSX.Element {
  return (
    <article
      data-table-id={table.id}
      data-table-number={table.number}
      data-table-status={isOccupied ? "OCCUPIED" : "FREE"}
      className="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[28px] font-bold">{table.number}</div>
          <div className="text-[11px] uppercase text-staff-text-muted">Table</div>
        </div>
        {isOccupied ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            Occupied
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Free
          </span>
        )}
      </div>
      <div className="pt-2 border-t border-staff-border-subtle">
        {isOccupied && canClose ? (
          <button
            type="button"
            data-action="close-table"
            data-table-id={table.id}
            data-table-number={table.number}
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-staff-text-muted border border-staff-border-subtle hover:bg-staff-surface-sunken w-full"
          >
            Close Table
          </button>
        ) : (
          <span className="text-xs text-staff-text-muted">—</span>
        )}
      </div>
    </article>
  );
}

function RoomCard({
  room,
  isOccupied,
  canCheckout = true,
}: {
  room: Room;
  isOccupied: boolean;
  canCheckout?: boolean;
}): JSX.Element {
  return (
    <article
      data-room-id={room.id}
      data-room-number={room.number}
      data-room-status={isOccupied ? "OCCUPIED" : "FREE"}
      className="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[28px] font-bold">{room.number}</div>
          <div className="text-[11px] uppercase text-staff-text-muted">Room</div>
        </div>
        {isOccupied ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
            Occupied
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
            Vacant
          </span>
        )}
      </div>
      <div className="pt-2 border-t border-staff-border-subtle">
        {isOccupied && canCheckout ? (
          <button
            type="button"
            data-action="checkout-room"
            data-room-id={room.id}
            data-room-number={room.number}
            className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-staff-text-muted border border-staff-border-subtle hover:bg-staff-surface-sunken w-full"
          >
            Checkout Room
          </button>
        ) : (
          <span className="text-xs text-staff-text-muted">—</span>
        )}
      </div>
    </article>
  );
}

export default async function StaffDashboardPage(): Promise<JSX.Element> {
  // 1. Session and role check
  const staff = await getAuthenticatedStaff();
  if (staff === null) {
    redirect("/staff/login");
  }

  const visibleAreas = visibleAreasFor(staff.roles);

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

  const canClose = visibleAreas.includes("table-service");
  const canCheckout = visibleAreas.includes("room-service") || visibleAreas.includes("front-desk");

  const enrichedOrders: EnrichedOrder[] = orders.map((o) => ({
    ...o,
    placeNumber: resolvePlace(o, tableMap, roomMap).number,
  }));

  const filteredOrders = enrichedOrders.filter((o) => {
    if (o.placeType === PlaceType.TABLE) return visibleAreas.includes("table-service");
    if (o.placeType === PlaceType.ROOM) return visibleAreas.includes("room-service") || visibleAreas.includes("front-desk");
    if (o.placeType === PlaceType.COUNTER) return visibleAreas.includes("front-desk");
    return false;
  });

  const activeOrdersCount = filteredOrders.filter(
    (o) => o.state !== OrderState.COMPLETED && o.state !== OrderState.CANCELLED
  ).length;

  const SCRIPT = `
(function() {
  var TABLE_MAP = ` + JSON.stringify(tableMap) + `;
  var ROOM_MAP = ` + JSON.stringify(roomMap) + `;
  var TABLES = ` + JSON.stringify(tables.map((t) => ({ id: t.id, number: t.number }))) + `;
  var ROOMS = ` + JSON.stringify(rooms.map((r) => ({ id: r.id, number: r.number }))) + `;
  var CAN_CLOSE = ` + JSON.stringify(canClose) + `;
  var CAN_CHECKOUT = ` + JSON.stringify(canCheckout) + `;
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
    if (order.placeType === 'TABLE') {
      return { number: TABLE_MAP[order.tableId] || '—', type: 'Table' };
    }
    if (order.placeType === 'ROOM') {
      return { number: ROOM_MAP[order.roomId] || '—', type: 'Room' };
    }
    return { number: order.pickupName || 'Counter', type: 'Counter' };
  }

  function formatItemsSummary(items) {
    if (!items || !items.length) return '';
    var parts = [];
    for (var i = 0; i < items.length; i++) {
      parts.push(items[i].quantity + 'x ' + items[i].itemName);
    }
    return parts.join(', ');
  }

  function buttonClass(state) {
    if (state === 'PLACED') return 'inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 cursor-pointer';
    if (state === 'APPROVED' || state === 'PREPARING') return 'inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-surface-raised text-staff-text-muted opacity-60 cursor-not-allowed';
    if (state === 'READY') return 'inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-emerald-600 text-white hover:brightness-95 cursor-pointer';
    if (state === 'DELIVERED') return 'inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-blue-600 text-white hover:brightness-95 cursor-pointer';
    if (state === 'COMPLETED') return 'inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-surface text-staff-text-primary border border-staff-border-strong hover:bg-staff-surface-raised cursor-pointer';
    return '';
  }

  function actionLabel(state) {
    if (state === 'PLACED') return 'Approve';
    if (state === 'APPROVED' || state === 'PREPARING') return 'Preparing…';
    if (state === 'READY') return 'Deliver';
    if (state === 'DELIVERED') return 'Complete';
    if (state === 'COMPLETED') return 'Close Table';
    return '';
  }

  function actionSlug(state) {
    if (state === 'PLACED') return 'approve';
    if (state === 'READY') return 'deliver';
    if (state === 'DELIVERED') return 'complete';
    if (state === 'COMPLETED') return 'close-table';
    return '';
  }

  function orderRowHtml(order) {
    var place = resolvePlace(order);
    var items = formatItemsSummary(order.items);
    var label = actionLabel(order.state);
    var slug = actionSlug(order.state);
    var cls = buttonClass(order.state);
    var disabled = (order.state === 'APPROVED' || order.state === 'PREPARING') ? ' disabled' : '';
    var cancelBtn = (order.state === 'PLACED' || order.state === 'READY') ? '<button type="button" data-action="cancel" data-order-id="' + escapeHtml(order.id) + '" class="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50">Cancel</button>' : '';
    var actionBtn = (order.state !== 'COMPLETED' || order.tableId) ? '<button type="button" data-action="' + escapeHtml(slug) + '" data-order-id="' + escapeHtml(order.id) + '" class="' + cls + '"' + disabled + '>' + escapeHtml(label) + '</button>' : '';

    var badgeClass = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    if (order.state === 'PLACED') badgeClass += ' bg-amber-100 text-amber-800';
    else if (order.state === 'READY') badgeClass += ' bg-emerald-100 text-emerald-800';
    else if (order.state === 'DELIVERED') badgeClass += ' bg-sky-100 text-sky-800';
    else if (order.state === 'COMPLETED') badgeClass += ' bg-status-done-bg text-status-done';
    else badgeClass += ' bg-purple-100 text-purple-800';

    return '<article data-order-id="' + escapeHtml(order.id) + '" data-order-state="' + escapeHtml(order.state) + '" data-place-number="' + escapeHtml(place.number) + '" data-table-id="' + escapeHtml(order.tableId || '') + '" class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 bg-staff-surface-raised rounded-xl border border-staff-border-subtle">' +
      '<div class="flex items-center gap-4">' +
        '<span class="text-[32px] font-bold">' + escapeHtml(place.number) + '</span>' +
        '<div class="flex flex-col"><span class="font-mono text-xs">#' + escapeHtml(order.id.slice(0, 8).toUpperCase()) + '</span></div>' +
      '</div>' +
      '<div class="flex-1"><div class="text-sm font-medium">' + escapeHtml(items) + '</div>' +
        '<span class="' + badgeClass + '">' + escapeHtml(order.state) + '</span>' +
      '</div>' +
      '<div class="flex flex-wrap items-center gap-2">' +
        actionBtn +
        cancelBtn +
      '</div>' +
    '</article>';
  }

  function tableCardHtml(table, isOccupied) {
    var badge = isOccupied ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Occupied</span>' : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Free</span>';
    var action = (isOccupied && CAN_CLOSE) ? '<button type="button" data-action="close-table" data-table-id="' + escapeHtml(table.id) + '" data-table-number="' + escapeHtml(table.number) + '" class="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-staff-text-muted border border-staff-border-subtle hover:bg-staff-surface-sunken w-full">Close Table</button>' : '<span class="text-xs text-staff-text-muted">—</span>';
    return '<article data-table-id="' + escapeHtml(table.id) + '" data-table-number="' + escapeHtml(table.number) + '" data-table-status="' + (isOccupied ? 'OCCUPIED' : 'FREE') + '" class="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3">' +
      '<div class="flex items-center justify-between gap-2">' +
        '<div><div class="text-[28px] font-bold">' + escapeHtml(table.number) + '</div><div class="text-[11px] uppercase text-staff-text-muted">Table</div></div>' +
        badge +
      '</div>' +
      '<div class="pt-2 border-t border-staff-border-subtle">' + action + '</div>' +
    '</article>';
  }

  function roomCardHtml(room, isOccupied) {
    var badge = isOccupied ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Occupied</span>' : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Vacant</span>';
    var action = (isOccupied && CAN_CHECKOUT) ? '<button type="button" data-action="checkout-room" data-room-id="' + escapeHtml(room.id) + '" data-room-number="' + escapeHtml(room.number) + '" class="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium text-staff-text-muted border border-staff-border-subtle hover:bg-staff-surface-sunken w-full">Checkout Room</button>' : '<span class="text-xs text-staff-text-muted">—</span>';
    return '<article data-room-id="' + escapeHtml(room.id) + '" data-room-number="' + escapeHtml(room.number) + '" data-room-status="' + (isOccupied ? 'OCCUPIED' : 'FREE') + '" class="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3">' +
      '<div class="flex items-center justify-between gap-2">' +
        '<div><div class="text-[28px] font-bold">' + escapeHtml(room.number) + '</div><div class="text-[11px] uppercase text-staff-text-muted">Room</div></div>' +
        badge +
      '</div>' +
      '<div class="pt-2 border-t border-staff-border-subtle">' + action + '</div>' +
    '</article>';
  }

  function renderOrderQueue(orders) {
    var container = document.getElementById('orders-container');
    if (!container) return;
    if (orders.length === 0) {
      container.innerHTML = '<div id="order-empty" class="text-center p-8 bg-staff-surface-raised rounded-xl border border-dashed border-staff-border-subtle"><p class="text-[18px] font-medium">No active orders.</p></div>';
      return;
    }
    container.innerHTML = '<div id="order-queue" class="flex flex-col gap-3"></div>';
    var queue = document.getElementById('order-queue');
    for (var i = 0; i < orders.length; i++) {
      queue.insertAdjacentHTML('beforeend', orderRowHtml(orders[i]));
    }
  }

  function renderTableMap() {
    var container = document.getElementById('table-map');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < TABLES.length; i++) {
      var t = TABLES[i];
      var occ = currentActiveTableIds.indexOf(t.id) !== -1;
      container.insertAdjacentHTML('beforeend', tableCardHtml(t, occ));
    }
  }

  function renderRoomMap() {
    var container = document.getElementById('room-map');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < ROOMS.length; i++) {
      var r = ROOMS[i];
      var occ = currentActiveRoomIds.indexOf(r.id) !== -1;
      container.insertAdjacentHTML('beforeend', roomCardHtml(r, occ));
    }
  }

  function poll() {
    fetch('/api/staff/orders', { credentials: 'same-origin' })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(body) {
        var orders = body.data || [];
        if (body.activeTableIds) {
          currentActiveTableIds = body.activeTableIds;
        } else {
          var activeFromOrders = [];
          for (var k = 0; k < orders.length; k++) {
            var ord = orders[k];
            if (ord.state !== 'COMPLETED' && ord.state !== 'CANCELLED' && ord.tableId) {
              if (activeFromOrders.indexOf(ord.tableId) === -1) {
                activeFromOrders.push(ord.tableId);
              }
            }
          }
          currentActiveTableIds = activeFromOrders;
        }
        renderOrderQueue(orders);
        renderTableMap();
        renderRoomMap();
      })
      .catch(function() {});
  }

  function handleOrderAction(action, orderId, btn) {
    var row = btn.closest('[data-order-id]');
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    var url, body = null;
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
      .then(function() { showToast('Done'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
  }

  function handleCloseTable(tableId, tableNum) {
    if (!window.confirm('Close Table ' + tableNum + '?')) return;
    fetch('/api/staff/tables/' + encodeURIComponent(tableId) + '/close', { method: 'POST', credentials: 'same-origin' })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Table closed'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); });
  }

  function handleCheckoutRoom(roomId, roomNum) {
    if (!window.confirm('Checkout Room ' + roomNum + '?')) return;
    fetch('/api/staff/rooms/' + encodeURIComponent(roomId) + '/checkout', { method: 'POST', credentials: 'same-origin' })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Room checked out'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); });
  }

  // === INITIALIZATION — delegation FIRST, polling SECOND ===
  // The two addEventListener calls must run on the very first synchronous
  // tick of this script. If they run after any fetch() or setInterval(),
  // a slow HMR WebSocket storm on mobile can starve the event loop and
  // prevent the listeners from binding. Binding first guarantees that
  // every click is caught, regardless of HMR state.

  document.getElementById('staff-tab-nav').addEventListener('click', function(e) {
    var tab = e.target.closest('[data-tab]');
    if (!tab) return;
    var name = tab.getAttribute('data-tab');
    var tabEls = document.querySelectorAll('[data-tab]');
    for (var i = 0; i < tabEls.length; i++) {
      tabEls[i].className = 'pb-3 text-sm font-medium text-staff-text-muted';
    }
    tab.className = 'pb-3 text-sm font-semibold text-staff-text-primary border-b-2 border-staff-brand';
    document.getElementById('orders-container').style.display = name === 'orders' ? 'flex' : 'none';
    document.getElementById('table-map').style.display = name === 'map' ? 'grid' : 'none';
    document.getElementById('room-map').style.display = name === 'rooms' ? 'grid' : 'none';
  });

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.hasAttribute('data-order-id')) {
      handleOrderAction(btn.getAttribute('data-action'), btn.getAttribute('data-order-id'), btn);
    } else if (btn.getAttribute('data-action') === 'close-table' && btn.hasAttribute('data-table-id')) {
      handleCloseTable(btn.getAttribute('data-table-id'), btn.getAttribute('data-table-number'));
    } else if (btn.getAttribute('data-action') === 'checkout-room' && btn.hasAttribute('data-room-id')) {
      handleCheckoutRoom(btn.getAttribute('data-room-id'), btn.getAttribute('data-room-number'));
    }
  });

  // === POLLING — runs AFTER listeners are attached ===
  poll();
  setInterval(poll, 5000);
})();
`;

  return (
    <main data-world="staff" className="min-h-dvh bg-staff-surface flex flex-col text-staff-text-primary">
      <header className="bg-staff-surface-raised border-b border-staff-border-subtle px-4 md:px-6 py-3 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-bold">{venue?.name ?? "Hospitality"} — Staff Operations</h1>
          <p className="text-xs text-staff-text-muted">Logged in as {staff.name} ({staff.roles.join(", ")})</p>
        </div>
        <LogoutButton />
      </header>

      <nav id="staff-tab-nav" className="flex items-center gap-6 border-b border-staff-border-subtle px-6 pt-3 bg-staff-surface-raised">
        <button data-tab="orders" className="pb-3 text-sm font-semibold text-staff-text-primary border-b-2 border-staff-brand cursor-pointer">
          Orders ({activeOrdersCount})
        </button>
        {visibleAreas.includes("table-service") && (
          <button data-tab="map" className="pb-3 text-sm font-medium text-staff-text-muted hover:text-staff-text-primary cursor-pointer">
            Table Map ({tables.length})
          </button>
        )}
        {(visibleAreas.includes("room-service") || visibleAreas.includes("front-desk")) && (
          <button data-tab="rooms" className="pb-3 text-sm font-medium text-staff-text-muted hover:text-staff-text-primary cursor-pointer">
            Room Map ({rooms.length})
          </button>
        )}
      </nav>

      <section className="flex-1 p-4 md:p-6 max-w-5xl w-full mx-auto">
        <div id="orders-container" className="flex flex-col gap-3">
          {filteredOrders.length === 0 ? (
            <div id="order-empty" className="text-center p-8 bg-staff-surface-raised rounded-xl border border-dashed border-staff-border-subtle">
              <p className="text-[18px] font-medium">No active orders.</p>
            </div>
          ) : (
            <div id="order-queue" className="flex flex-col gap-3">
              {filteredOrders.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>

        <div id="table-map" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" style={{ display: "none" }}>
          {tables.map((t) => (
            <TableCard key={t.id} table={t} isOccupied={activeTableIds.has(t.id)} canClose={canClose} />
          ))}
        </div>

        <div id="room-map" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" style={{ display: "none" }}>
          {rooms.map((r) => (
            <RoomCard key={r.id} room={r} isOccupied={activeRoomIds.has(r.id)} canCheckout={canCheckout} />
          ))}
        </div>
      </section>

      <div
        id="staff-toast"
        role="status"
        aria-live="polite"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm shadow-xl"
        style={{ display: "none" }}
      />

      <Script id="staff-controller" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </main>
  );
}
