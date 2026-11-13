import type { JSX } from "react";
import Script from "next/script";
import { redirect } from "next/navigation";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import { canAccess, visibleAreasFor, type Area } from "@/domain/auth/can-access";
import { OrderState, PlaceType, type Order } from "@/domain/orders/order.repository";
import {
  RequestState,
  type ServiceRequest,
  type HotelService,
} from "@/domain/requests/request.repository";
import { type Table } from "@/domain/organization/table.repository";
import { type Room } from "@/domain/organization/room.repository";
import { RequestQueueRow, SERVICE_LABELS } from "@/components/staff/request-queue-row";
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

function resolveRequestPlace(
  request: ServiceRequest,
  roomMap: Record<string, string>,
  tableMap: Record<string, string>
): { number: string; type: string } {
  if (request.placeType === "ROOM" && request.roomId) {
    return { number: roomMap[request.roomId] ?? "—", type: "Room" };
  }
  if (request.placeType === "TABLE" && request.tableId) {
    return { number: tableMap[request.tableId] ?? "—", type: "Table" };
  }
  return { number: "Counter", type: "Counter" };
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
  const requestRepo = createPrismaServiceRequestRepository(prisma);

  const [
    tablesRes,
    roomsRes,
    activeSessions,
    placedRes,
    readyRes,
    deliveredRes,
    completedRes,
    submittedReqs,
    acknowledgedReqs,
    inProgressReqs,
  ] = await Promise.all([
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
    requestRepo.listForVenue(venue.id, { state: RequestState.SUBMITTED }),
    requestRepo.listForVenue(venue.id, { state: RequestState.ACKNOWLEDGED }),
    requestRepo.listForVenue(venue.id, { state: RequestState.IN_PROGRESS }),
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

  const requests: ServiceRequest[] = [
    ...(submittedReqs.ok ? submittedReqs.value : []),
    ...(acknowledgedReqs.ok ? acknowledgedReqs.value : []),
    ...(inProgressReqs.ok ? inProgressReqs.value : []),
  ].filter((r) => {
    const serviceToArea: Record<HotelService, Area> = {
      ROOM_SERVICE_FOOD: "room-service",
      HOUSEKEEPING: "housekeeping",
      MAINTENANCE: "maintenance",
      CONCIERGE: "concierge",
      LAUNDRY: "laundry",
      SPA: "spa",
      LATE_CHECKOUT: "front-desk",
      WAKE_UP_CALL: "front-desk",
      DO_NOT_DISTURB: "front-desk",
      CALL_WAITER: "table-service",
      REQUEST_BILL: "table-service",
    };
    return visibleAreas.includes(serviceToArea[r.serviceType]);
  });

  const SCRIPT = `
(function() {
  var TABLE_MAP = ` + JSON.stringify(tableMap) + `;
  var ROOM_MAP = ` + JSON.stringify(roomMap) + `;
  var TABLES = ` + JSON.stringify(tables.map((t) => ({ id: t.id, number: t.number }))) + `;
  var ROOMS = ` + JSON.stringify(rooms.map((r) => ({ id: r.id, number: r.number }))) + `;
  var CAN_CLOSE = ` + JSON.stringify(canClose) + `;
  var CAN_CHECKOUT = ` + JSON.stringify(canCheckout) + `;
  var CAN_REQUESTS = ` + JSON.stringify(visibleAreas.includes("front-desk")) + `;
  var SERVICE_LABELS = ` + JSON.stringify(SERVICE_LABELS) + `;
  var currentActiveTableIds = ` + JSON.stringify(Array.from(activeTableIds)) + `;
  var currentActiveRoomIds = ` + JSON.stringify(Array.from(activeRoomIds)) + `;

  function getCsrfToken() {
    // The CSRF cookie (D-20.1) is NOT HttpOnly, so the client can read it.
    // Server source of truth: src/infrastructure/csrf/cookies.ts
    // Cookie name is 'csrf_token'; header name is 'X-CSRF-Token'.
    var match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

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

  function formatDetailsSummary(details) {
    if (!details || typeof details !== 'object') return '';
    var parts = [];
    for (var k in details) {
      if (details[k] === null || details[k] === undefined || details[k] === '') continue;
      if (Array.isArray(details[k])) {
        parts.push(k + ': ' + details[k].join(', '));
      } else {
        parts.push(k + ': ' + details[k]);
      }
    }
    return parts.join(' · ');
  }

  function requestRowHtml(req) {
    var placeNumber = req.placeNumber;
    var placeTypeLabel = req.placeTypeLabel;
    if (!placeNumber || !placeTypeLabel) {
      if (req.placeType === 'ROOM' && req.roomId) {
        placeNumber = ROOM_MAP[req.roomId] || '—';
        placeTypeLabel = 'Room';
      } else if (req.placeType === 'TABLE' && req.tableId) {
        placeNumber = TABLE_MAP[req.tableId] || '—';
        placeTypeLabel = 'Table';
      } else {
        placeNumber = 'Counter';
        placeTypeLabel = 'Counter';
      }
    }
    var serviceLabel = SERVICE_LABELS[req.serviceType] || req.serviceType;

    var badgeClass = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    if (req.state === 'SUBMITTED') badgeClass += ' bg-amber-100 text-amber-800';
    else if (req.state === 'ACKNOWLEDGED') badgeClass += ' bg-purple-100 text-purple-800';
    else if (req.state === 'IN_PROGRESS') badgeClass += ' bg-sky-100 text-sky-800';
    else if (req.state === 'COMPLETED') badgeClass += ' bg-status-done-bg text-status-done';
    else badgeClass += ' bg-status-cancelled-bg text-status-cancelled';

    var detailsSummary = formatDetailsSummary(req.details);
    var detailsHtml = detailsSummary ? '<p class="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">' + escapeHtml(detailsSummary) + '</p>' : '';

    var actionsHtml = '';
    if (req.state === 'SUBMITTED') {
      actionsHtml = '<button type="button" data-action="request-decline" data-request-id="' + escapeHtml(req.id) + '" data-request-service="' + escapeHtml(req.serviceType) + '" class="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 cursor-pointer">Decline</button>' +
        '<button type="button" data-action="request-cancel" data-request-id="' + escapeHtml(req.id) + '" data-request-service="' + escapeHtml(req.serviceType) + '" class="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-status-cancelled hover:bg-red-50 border border-status-cancelled/30 cursor-pointer">Cancel</button>' +
        '<button type="button" data-action="request-advance" data-request-id="' + escapeHtml(req.id) + '" data-to-state="ACKNOWLEDGED" class="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 cursor-pointer">Acknowledge</button>';
    } else if (req.state === 'ACKNOWLEDGED') {
      actionsHtml = '<button type="button" data-action="request-decline" data-request-id="' + escapeHtml(req.id) + '" data-request-service="' + escapeHtml(req.serviceType) + '" class="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 cursor-pointer">Decline</button>' +
        '<button type="button" data-action="request-cancel" data-request-id="' + escapeHtml(req.id) + '" data-request-service="' + escapeHtml(req.serviceType) + '" class="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-status-cancelled hover:bg-red-50 border border-status-cancelled/30 cursor-pointer">Cancel</button>' +
        '<button type="button" data-action="request-advance" data-request-id="' + escapeHtml(req.id) + '" data-to-state="IN_PROGRESS" class="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 cursor-pointer">Start</button>';
    } else if (req.state === 'IN_PROGRESS') {
      actionsHtml = '<button type="button" data-action="request-cancel" data-request-id="' + escapeHtml(req.id) + '" data-request-service="' + escapeHtml(req.serviceType) + '" class="inline-flex items-center justify-center rounded-md px-3 h-10 text-sm font-medium text-status-cancelled hover:bg-red-50 border border-status-cancelled/30 cursor-pointer">Cancel</button>' +
        '<button type="button" data-action="request-advance" data-request-id="' + escapeHtml(req.id) + '" data-to-state="COMPLETED" class="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-emerald-600 text-white hover:brightness-95 cursor-pointer">Complete</button>';
    } else {
      actionsHtml = '<span class="text-sm text-staff-text-muted">—</span>';
    }

    return '<article data-request-id="' + escapeHtml(req.id) + '" data-request-state="' + escapeHtml(req.state) + '" data-place-number="' + escapeHtml(placeNumber) + '" class="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">' +
      '<div class="flex items-center gap-4">' +
        '<div class="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">' +
          '<span class="text-[11px] font-semibold text-staff-text-muted uppercase">' + escapeHtml(placeTypeLabel) + '</span>' +
          '<span class="text-[20px] font-bold text-staff-text-primary">' + escapeHtml(placeNumber) + '</span>' +
        '</div>' +
        '<div>' +
          '<div class="flex items-center gap-2">' +
            '<span class="font-semibold text-staff-text-primary">#' + escapeHtml(req.id.slice(0, 8).toUpperCase()) + '</span>' +
            '<span class="text-sm font-medium text-staff-text-secondary">' + escapeHtml(serviceLabel) + '</span>' +
            '<span class="' + badgeClass + '">' + escapeHtml(req.state) + '</span>' +
          '</div>' +
          detailsHtml +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2 self-end md:self-auto shrink-0">' +
        actionsHtml +
      '</div>' +
    '</article>';
  }

  function renderRequests(requests) {
    var container = document.getElementById('requests-container');
    if (!container) return;
    if (requests.length === 0) {
      container.innerHTML = '<div id="request-empty" class="text-center p-8 bg-staff-surface-raised rounded-xl border border-dashed border-staff-border-subtle"><p class="text-[18px] font-medium">No active requests.</p></div>';
      return;
    }
    container.innerHTML = '<div id="request-queue" class="flex flex-col gap-3"></div>';
    var queue = document.getElementById('request-queue');
    for (var i = 0; i < requests.length; i++) {
      queue.insertAdjacentHTML('beforeend', requestRowHtml(requests[i]));
    }
  }

  function poll() {
    var orderFetch = fetch('/api/staff/orders', { credentials: 'same-origin' })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });

    var requestFetch = CAN_REQUESTS
      ? fetch('/api/staff/requests', { credentials: 'same-origin' })
          .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
          .catch(function() { return { data: [] }; })
      : Promise.resolve({ data: [] });

    Promise.all([orderFetch, requestFetch])
      .then(function(responses) {
        var ordersBody = responses[0];
        var requestsBody = responses[1];
        var orders = ordersBody.data || [];
        if (ordersBody.activeTableIds) {
          currentActiveTableIds = ordersBody.activeTableIds;
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
        var requests = requestsBody.data || [];
        renderRequests(requests);
        var reqTab = document.querySelector('[data-tab="requests"]');
        if (reqTab) {
          reqTab.textContent = 'Requests (' + requests.length + ')';
        }
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
    var opts = {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = body;
    }
    fetch(url, opts)
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Done'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
  }

  function handleCloseTable(tableId, tableNum) {
    if (!window.confirm('Close Table ' + tableNum + '?')) return;
    fetch('/api/staff/tables/' + encodeURIComponent(tableId) + '/close', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Table closed'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); });
  }

  function handleCheckoutRoom(roomId, roomNum) {
    if (!window.confirm('Checkout Room ' + roomNum + '?')) return;
    fetch('/api/staff/rooms/' + encodeURIComponent(roomId) + '/checkout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Room checked out'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); });
  }

  function handleRequestAdvance(requestId, toState, btn) {
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    fetch('/api/staff/requests/' + encodeURIComponent(requestId) + '/advance', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify({ toState: toState }),
    })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Request updated'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
  }

  function handleRequestCancel(requestId, btn) {
    var reason = window.prompt('Reason for cancellation:');
    if (!reason) return;
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    fetch('/api/staff/requests/' + encodeURIComponent(requestId) + '/cancel', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify({ reason: reason }),
    })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Request cancelled'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
  }

  function handleRequestDecline(requestId, btn) {
    var reason = window.prompt('Reason for declining:');
    if (!reason) return;
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';
    fetch('/api/staff/requests/' + encodeURIComponent(requestId) + '/decline', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify({ reason: reason }),
    })
      .then(function(r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function() { showToast('Request declined'); poll(); })
      .catch(function(err) { showToast('Error: ' + err.message); btn.disabled = false; btn.textContent = original; });
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
      tabEls[i].className = 'pb-3 text-sm font-medium text-staff-text-muted hover:text-staff-text-primary cursor-pointer';
    }
    tab.className = 'pb-3 text-sm font-semibold text-staff-text-primary border-b-2 border-staff-brand cursor-pointer';
    var ordersEl = document.getElementById('orders-container');
    if (ordersEl) ordersEl.style.display = name === 'orders' ? 'flex' : 'none';
    var tableMapEl = document.getElementById('table-map');
    if (tableMapEl) tableMapEl.style.display = name === 'map' ? 'grid' : 'none';
    var roomMapEl = document.getElementById('room-map');
    if (roomMapEl) roomMapEl.style.display = name === 'rooms' ? 'grid' : 'none';
    var requestsEl = document.getElementById('requests-container');
    if (requestsEl) requestsEl.style.display = name === 'requests' ? 'flex' : 'none';
  });

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    if (action === 'close-table' && btn.hasAttribute('data-table-id')) {
      handleCloseTable(btn.getAttribute('data-table-id'), btn.getAttribute('data-table-number'));
    } else if (action === 'checkout-room' && btn.hasAttribute('data-room-id')) {
      handleCheckoutRoom(btn.getAttribute('data-room-id'), btn.getAttribute('data-room-number'));
    } else if (action === 'request-advance' && btn.hasAttribute('data-request-id')) {
      handleRequestAdvance(btn.getAttribute('data-request-id'), btn.getAttribute('data-to-state'), btn);
    } else if (action === 'request-cancel' && btn.hasAttribute('data-request-id')) {
      handleRequestCancel(btn.getAttribute('data-request-id'), btn);
    } else if (action === 'request-decline' && btn.hasAttribute('data-request-id')) {
      handleRequestDecline(btn.getAttribute('data-request-id'), btn);
    } else if (btn.hasAttribute('data-order-id')) {
      handleOrderAction(action, btn.getAttribute('data-order-id'), btn);
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
        {visibleAreas.includes("front-desk") && (
          <button data-tab="requests" className="pb-3 text-sm font-medium text-staff-text-muted hover:text-staff-text-primary cursor-pointer">
            Requests ({requests.length})
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

        {visibleAreas.includes("front-desk") && (
          <div id="requests-container" className="flex flex-col gap-3" style={{ display: "none" }}>
            {requests.length === 0 ? (
              <div id="request-empty" className="text-center p-8 bg-staff-surface-raised rounded-xl border border-dashed border-staff-border-subtle">
                <p className="text-[18px] font-medium">No active requests.</p>
              </div>
            ) : (
              <div id="request-queue" className="flex flex-col gap-3">
                {requests.map((r) => {
                  const place = resolveRequestPlace(r, roomMap, tableMap);
                  return (
                    <RequestQueueRow
                      key={r.id}
                      request={r}
                      placeNumber={place.number}
                      placeTypeLabel={place.type}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
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
