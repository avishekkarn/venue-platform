import type { JSX } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { OrderState, PlaceType } from "@/domain/orders/order.repository";
import { RequestState, HotelService } from "@/domain/requests/request.repository";
import type { Order } from "@/domain/orders/order.repository";
import type { ServiceRequest } from "@/domain/requests/request.repository";
import type { Table } from "@/domain/organization/table.repository";
import type { Room } from "@/domain/organization/room.repository";
import { TableState } from "@/domain/organization/table.repository";
import { RoomState } from "@/domain/organization/room.repository";
import { MetricTile } from "@/components/staff/metric-tile";
import { OrderQueueRow } from "@/components/staff/order-queue-row";
import { RequestQueueRow } from "@/components/staff/request-queue-row";
import { TableMapCell } from "@/components/staff/table-map-cell";
import { RoomMapCell } from "@/components/staff/room-map-cell";

/**
 * The admin dashboard (DESIGN.md §4.10.5) — the venue's live state.
 *
 * Six sections:
 *   1. #dashboard-metrics         — six MetricTiles.
 *   2. #dashboard-table-orders    — 5 most-recent active table orders.
 *   3. #dashboard-room-orders     — 5 most-recent active room orders.
 *   4. #dashboard-room-requests   — 5 oldest open room requests (excluding
 *                                    CALL_WAITER and REQUEST_BILL, which are
 *                                    table/counter attention signals handled
 *                                    on /staff, not hotel-service requests).
 *   5. #dashboard-table-map       — every table, read-only.
 *   6. #dashboard-room-map        — every room, read-only.
 *
 * The six container IDs are the 8.1.4 polling seam: the polling script
 * will querySelector each ID and replace innerHTML from a single fetch to
 * GET /api/admin/dashboard (which 8.1.4 expands to return all six). No
 * polling in 8.1.3.B — the page renders once, server-side.
 *
 * The maps are read-only (canClose/canCheckout=false): the dashboard is a
 * read surface; the actions live on /staff. The map cells are the shared
 * components from 8.1.3.A.
 *
 * No menu toggle. The menu-availability toggle lives on /admin/menu (8.3.1).
 *
 * Elapsed times are short human formats (`< 1m`, `5m`, `1h 12m`, `2d`)
 * computed by the helpers below. 8.1.4's poll recomputes them from the
 * fresh data.
 *
 * Reference: DESIGN.md §4.10.5, §4.2.3 (status colors), D-9.2 (staff-only
 * neutral palette), D-19.1 (polling discipline), SYSTEM.md §15.4, D-10.2.
 */
export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  // --- Data reads (repositories, not the route) ---
  const orderRepo = createPrismaOrderRepository(prisma);
  const requestRepo = createPrismaServiceRequestRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const allOrdersResult = await orderRepo.listForVenue(staff.venueId);
  const todayOrdersResult = await orderRepo.listForVenueOnDate(
    staff.venueId,
    new Date()
  );
  const openRequestsResult = await requestRepo.listOpenForVenue(staff.venueId);
  const tablesResult = await tableRepo.listForVenue(staff.venueId);
  const roomsResult = await roomRepo.listForVenue(staff.venueId);

  const allOrders = allOrdersResult.ok ? allOrdersResult.value : [];
  const todayOrders = todayOrdersResult.ok ? todayOrdersResult.value : [];
  const openRequests = openRequestsResult.ok ? openRequestsResult.value : [];
  const tables = tablesResult.ok ? tablesResult.value : [];
  const rooms = roomsResult.ok ? roomsResult.value : [];

  // Sort tables and rooms by numeric value of `number` for the maps.
  // Table.number and Room.number are strings; the maps should read
  // 1, 2, 3, ..., 12 and 401, 402, ..., 414 — not the lexical order
  // 1, 10, 11, 12, 2, 3, ..., 9 that an unsorted array produces.
  const sortedTables = [...tables].sort((a, b) => {
    const an = Number(a.number);
    const bn = Number(b.number);
    if (Number.isNaN(an) || Number.isNaN(bn)) {
      return a.number.localeCompare(b.number);
    }
    return an - bn;
  });
  const sortedRooms = [...rooms].sort((a, b) => {
    const an = Number(a.number);
    const bn = Number(b.number);
    if (Number.isNaN(an) || Number.isNaN(bn)) {
      return a.number.localeCompare(b.number);
    }
    return an - bn;
  });

  // --- The six metrics (same arithmetic as the route) ---
  let ordersWaiting = 0;
  let inKitchen = 0;
  let ready = 0;
  for (const order of allOrders) {
    if (order.state === OrderState.PLACED) ordersWaiting += 1;
    if (
      order.state === OrderState.APPROVED ||
      order.state === OrderState.PREPARING ||
      order.state === OrderState.READY
    ) {
      inKitchen += 1;
    }
    if (order.state === OrderState.READY) ready += 1;
  }

  let revenueToday = 0;
  for (const order of todayOrders) {
    if (order.state === OrderState.COMPLETED) {
      revenueToday += Number(order.total);
    }
  }
  const revenueTodayString = revenueToday.toFixed(2);

  // --- Table / room number lookup (id → number) ---
  const tableNumberById = new Map<string, string>();
  for (const t of tables) tableNumberById.set(t.id, t.number);
  const roomNumberById = new Map<string, string>();
  for (const r of rooms) roomNumberById.set(r.id, r.number);

  // --- Active-state orders (for the two lists) ---
  const ACTIVE_STATES: readonly OrderState[] = [
    OrderState.PLACED,
    OrderState.APPROVED,
    OrderState.PREPARING,
    OrderState.READY,
  ];
  const activeOrders = allOrders.filter((o) =>
    ACTIVE_STATES.includes(o.state)
  );

  const recentTableOrders: Order[] = activeOrders
    .filter((o) => o.placeType === PlaceType.TABLE)
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .slice(0, 5);

  const recentRoomOrders: Order[] = activeOrders
    .filter((o) => o.placeType === PlaceType.ROOM)
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .slice(0, 5);

  // --- Room requests (excluding the attention-signal types) ---
  const EXCLUDED_REQUEST_TYPES: readonly HotelService[] = [
    HotelService.CALL_WAITER,
    HotelService.REQUEST_BILL,
  ];
  const recentRoomRequests: ServiceRequest[] = openRequests
    .filter(
      (r) =>
        r.placeType === PlaceType.ROOM &&
        !EXCLUDED_REQUEST_TYPES.includes(r.serviceType)
    )
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
    .slice(0, 5);

  // --- Occupancy sets (active order/session per place) ---
  const activeTableIds = new Set<string>();
  const activeRoomIds = new Set<string>();
  for (const t of tables) {
    if (t.state === TableState.OCCUPIED) activeTableIds.add(t.id);
  }
  for (const r of rooms) {
    if (r.state === RoomState.OCCUPIED) activeRoomIds.add(r.id);
  }

  // --- Elapsed-time helper (short human format) ---
  function elapsedLabel(from: Date): string {
    const ms = Date.now() - from.getTime();
    if (ms < 60_000) return "< 1m";
    const minutes = Math.floor(ms / 60_000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours < 24) return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }

  function placeLabelOfOrder(order: Order): string {
    if (order.placeType === PlaceType.TABLE) {
      return order.tableId ? tableNumberById.get(order.tableId) ?? "—" : "—";
    }
    if (order.placeType === PlaceType.ROOM) {
      return order.roomId ? roomNumberById.get(order.roomId) ?? "—" : "—";
    }
    return order.pickupName ?? "—";
  }

  function placeTypeLabelOfOrder(order: Order): string {
    if (order.placeType === PlaceType.TABLE) return "Table";
    if (order.placeType === PlaceType.ROOM) return "Room";
    return "Counter";
  }

  function placeLabelOfRequest(request: ServiceRequest): string {
    if (request.placeType === PlaceType.ROOM) {
      return request.roomId ? roomNumberById.get(request.roomId) ?? "—" : "—";
    }
    if (request.placeType === PlaceType.TABLE) {
      return request.tableId ? tableNumberById.get(request.tableId) ?? "—" : "—";
    }
    return "—";
  }

  function placeTypeLabelOfRequest(request: ServiceRequest): string {
    if (request.placeType === PlaceType.ROOM) return "Room";
    if (request.placeType === PlaceType.TABLE) return "Table";
    return "Counter";
  }

  return (
    <>
      <script
        async
        dangerouslySetInnerHTML={{
          __html: DASHBOARD_SCRIPT,
        }}
      />
      <section className="flex flex-col gap-6">
      {/* --- 1. Six metric tiles --- */}
      <section id="dashboard-metrics" aria-label="Live metrics">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricTile label="Orders Waiting" value={ordersWaiting} />
          <MetricTile label="In Kitchen" value={inKitchen} />
          <MetricTile label="Ready" value={ready} />
          <MetricTile label="Revenue Today" value={revenueTodayString} />
          <MetricTile label="Orders Today" value={todayOrders.length} />
          <MetricTile label="Requests Open" value={openRequests.length} />
        </div>
      </section>

      {/* --- 2 & 3. Table Orders (left) and Room Orders (right) --- */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium text-staff-text-primary mb-3">
            Table Orders
          </h2>
          <div
            id="dashboard-table-orders"
            className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-2"
          >
            {recentTableOrders.length === 0 ? (
              <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl">
                No active table orders.
              </p>
            ) : (
              recentTableOrders.map((order) => (
                <OrderQueueRow
                  key={order.id}
                  order={order}
                  placeLabel={placeLabelOfOrder(order)}
                  placeTypeLabel={placeTypeLabelOfOrder(order)}
                  elapsedLabel={elapsedLabel(order.placedAt)}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-staff-text-primary mb-3">
            Room Orders
          </h2>
          <div
            id="dashboard-room-orders"
            className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-2"
          >
            {recentRoomOrders.length === 0 ? (
              <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl">
                No active room orders.
              </p>
            ) : (
              recentRoomOrders.map((order) => (
                <OrderQueueRow
                  key={order.id}
                  order={order}
                  placeLabel={placeLabelOfOrder(order)}
                  placeTypeLabel={placeTypeLabelOfOrder(order)}
                  elapsedLabel={elapsedLabel(order.placedAt)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- 4. Room Requests --- */}
      <section>
        <h2 className="text-lg font-medium text-staff-text-primary mb-3">
          Room Requests
        </h2>
        <div
          id="dashboard-room-requests"
          className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-2"
        >
          {recentRoomRequests.length === 0 ? (
            <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl">
              No open room requests.
            </p>
          ) : (
            recentRoomRequests.map((request) => (
              <RequestQueueRow
                key={request.id}
                request={request}
                placeNumber={placeLabelOfRequest(request)}
                placeTypeLabel={placeTypeLabelOfRequest(request)}
                elapsedLabel={elapsedLabel(request.submittedAt)}
                readOnly={true}
              />
            ))
          )}
        </div>
      </section>

      {/* --- 5. Table Map (read-only) --- */}
      <section>
        <h2 className="text-lg font-medium text-staff-text-primary mb-3">
          Table Map
        </h2>
        <div
          id="dashboard-table-map"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          {sortedTables.map((t: Table) => (
            <TableMapCell
              key={t.id}
              table={t}
              isOccupied={activeTableIds.has(t.id)}
              canClose={false}
            />
          ))}
        </div>
      </section>

      {/* --- 6. Room Map (read-only) --- */}
      <section>
        <h2 className="text-lg font-medium text-staff-text-primary mb-3">
          Room Map
        </h2>
        <div
          id="dashboard-room-map"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          {sortedRooms.map((r: Room) => (
            <RoomMapCell
              key={r.id}
              room={r}
              isOccupied={activeRoomIds.has(r.id)}
              canCheckout={false}
            />
          ))}
        </div>
      </section>
    </section>
  </>
);
}

const DASHBOARD_SCRIPT = `
(function() {
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function elapsedLabel(iso) {
    var ms = Date.now() - new Date(iso).getTime();
    if (ms < 60000) return '< 1m';
    var minutes = Math.floor(ms / 60000);
    if (minutes < 60) return minutes + 'm';
    var hours = Math.floor(minutes / 60);
    var remMin = minutes % 60;
    if (hours < 24) return remMin > 0 ? hours + 'h ' + remMin + 'm' : hours + 'h';
    var days = Math.floor(hours / 24);
    var remHours = hours % 24;
    return remHours > 0 ? days + 'd ' + remHours + 'h' : days + 'd';
  }

  function serviceLabel(type) {
    var map = {
      ROOM_SERVICE_FOOD: 'Room Service', HOUSEKEEPING: 'Housekeeping', MAINTENANCE: 'Maintenance',
      CONCIERGE: 'Concierge', LAUNDRY: 'Laundry', SPA: 'Spa', LATE_CHECKOUT: 'Late Checkout',
      WAKE_UP_CALL: 'Wake-up Call', DO_NOT_DISTURB: 'Do Not Disturb',
      CALL_WAITER: 'Call Waiter', REQUEST_BILL: 'Request Bill'
    };
    return map[type] || type;
  }

  function readOnlyStatusLabel(state) {
    var map = { SUBMITTED:'Submitted', ACKNOWLEDGED:'Acknowledged', IN_PROGRESS:'In progress',
                COMPLETED:'Completed', CANCELLED:'Cancelled', DECLINED:'Declined' };
    return map[state] || '\\u2014';
  }

  function orderBadge(state) {
    var base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    if (state === 'PLACED') return base + ' bg-amber-100 text-amber-800';
    if (state === 'APPROVED') return base + ' bg-purple-100 text-purple-800';
    if (state === 'PREPARING') return base + ' bg-sky-100 text-sky-800';
    if (state === 'READY') return base + ' bg-status-ready-bg text-status-ready';
    if (state === 'DELIVERED' || state === 'COMPLETED') return base + ' bg-status-done-bg text-status-done';
    if (state === 'CANCELLED') return base + ' bg-status-cancelled-bg text-status-cancelled';
    return base;
  }

  function requestBadge(state) {
    var base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    if (state === 'SUBMITTED') return base + ' bg-amber-100 text-amber-800';
    if (state === 'ACKNOWLEDGED') return base + ' bg-purple-100 text-purple-800';
    if (state === 'IN_PROGRESS') return base + ' bg-sky-100 text-sky-800';
    if (state === 'COMPLETED') return base + ' bg-status-done-bg text-status-done';
    return base + ' bg-status-cancelled-bg text-status-cancelled';
  }

  function renderMetrics(d) {
    var el = document.getElementById('dashboard-metrics');
    if (!el) return;
    var items = [
      ['Orders Waiting', d.ordersWaiting], ['In Kitchen', d.inKitchen], ['Ready', d.ready],
      ['Revenue Today', d.revenueToday], ['Orders Today', d.ordersToday], ['Requests Open', d.requestsOpen]
    ];
    var html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">';
    for (var i = 0; i < items.length; i++) {
      html += '<div class="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-4 flex flex-col gap-1">' +
        '<span class="text-[12px] leading-[16px] font-medium text-staff-text-muted uppercase tracking-wide">' + escapeHtml(items[i][0]) + '</span>' +
        '<span class="text-[28px] leading-[36px] font-semibold text-staff-text-primary">' + escapeHtml(String(items[i][1])) + '</span>' +
      '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function renderOrderRow(o) {
    var placeLabel, placeTypeLabel;
    if (o.placeType === 'TABLE') { placeLabel = o.tableNumber || '\\u2014'; placeTypeLabel = 'Table'; }
    else if (o.placeType === 'ROOM') { placeLabel = o.roomNumber || '\\u2014'; placeTypeLabel = 'Room'; }
    else { placeLabel = o.pickupName || '\\u2014'; placeTypeLabel = 'Counter'; }
    var items = (o.items && o.items.length) ? o.items.map(function(it){ return it.quantity + '\\u00d7 ' + it.itemName; }).join(', ') : 'No items';
    var id = String(o.id).slice(0, 8).toUpperCase();
    return '<article data-order-id="' + escapeHtml(o.id) + '" data-order-state="' + escapeHtml(o.state) + '" data-place-label="' + escapeHtml(placeLabel) + '" class="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">' +
      '<div class="flex items-center gap-4 min-w-0">' +
        '<div class="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">' +
          '<span class="text-[11px] font-semibold text-staff-text-muted uppercase">' + escapeHtml(placeTypeLabel) + '</span>' +
          '<span class="text-[20px] font-bold text-staff-text-primary">' + escapeHtml(placeLabel) + '</span>' +
        '</div>' +
        '<div class="min-w-0">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<span class="font-semibold text-staff-text-primary">#' + escapeHtml(id) + '</span>' +
            '<span class="' + orderBadge(o.state) + '">' + escapeHtml(o.state) + '</span>' +
            '<span class="text-xs font-mono text-staff-text-muted">' + escapeHtml(elapsedLabel(o.placedAt)) + '</span>' +
          '</div>' +
          '<p class="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">' + escapeHtml(items) + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2 self-end md:self-auto shrink-0"><span class="text-sm text-staff-text-muted">\\u2014</span></div>' +
    '</article>';
  }

  function renderOrderList(orders, containerId, emptyMsg) {
    var el = document.getElementById(containerId);
    if (!el) return;
    if (!orders || orders.length === 0) {
      el.innerHTML = '<p class="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl">' + escapeHtml(emptyMsg) + '</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < orders.length; i++) html += renderOrderRow(orders[i]);
    el.innerHTML = html;
  }

  function renderRequestRow(r) {
    var placeNumber = r.roomNumber || '\\u2014';
    var placeTypeLabel = r.placeType === 'ROOM' ? 'Room' : (r.placeType === 'TABLE' ? 'Table' : 'Counter');
    var id = String(r.id).slice(0, 8).toUpperCase();
    var details = r.details && typeof r.details === 'object' ? (function(){
      var parts = [];
      for (var k in r.details) {
        var v = r.details[k];
        if (v === null || v === undefined || v === '') continue;
        parts.push(k + ': ' + (Array.isArray(v) ? v.join(', ') : v));
      }
      return parts.join(' \\u00b7 ');
    })() : '';
    return '<article data-request-id="' + escapeHtml(r.id) + '" data-request-state="' + escapeHtml(r.state) + '" data-place-number="' + escapeHtml(placeNumber) + '" class="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">' +
      '<div class="flex items-center gap-4">' +
        '<div class="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">' +
          '<span class="text-[11px] font-semibold text-staff-text-muted uppercase">' + escapeHtml(placeTypeLabel) + '</span>' +
          '<span class="text-[20px] font-bold text-staff-text-primary">' + escapeHtml(placeNumber) + '</span>' +
        '</div>' +
        '<div>' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<span class="font-semibold text-staff-text-primary">#' + escapeHtml(id) + '</span>' +
            '<span class="text-sm font-medium text-staff-text-secondary">' + escapeHtml(serviceLabel(r.serviceType)) + '</span>' +
            '<span class="' + requestBadge(r.state) + '">' + escapeHtml(r.state) + '</span>' +
            '<span class="text-xs font-mono text-staff-text-muted">' + escapeHtml(elapsedLabel(r.submittedAt)) + '</span>' +
          '</div>' +
          (details ? '<p class="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">' + escapeHtml(details) + '</p>' : '') +
        '</div>' +
      '</div>' +
      '<div class="flex items-center gap-2 self-end md:self-auto shrink-0"><span class="text-sm font-medium text-staff-text-muted">' + escapeHtml(readOnlyStatusLabel(r.state)) + '</span></div>' +
    '</article>';
  }

  function renderRequestList(requests) {
    var el = document.getElementById('dashboard-room-requests');
    if (!el) return;
    if (!requests || requests.length === 0) {
      el.innerHTML = '<p class="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl">No open room requests.</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < requests.length; i++) html += renderRequestRow(requests[i]);
    el.innerHTML = html;
  }

  function renderTableMap(tables, activeIds) {
    var el = document.getElementById('dashboard-table-map');
    if (!el) return;
    var html = '';
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      var occ = activeIds.indexOf(t.id) !== -1;
      var badge = occ
        ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Occupied</span>'
        : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Free</span>';
      html += '<article data-table-id="' + escapeHtml(t.id) + '" data-table-number="' + escapeHtml(t.number) + '" data-table-status="' + (occ ? 'OCCUPIED' : 'FREE') + '" class="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3">' +
        '<div class="flex items-center justify-between gap-2">' +
          '<div><div class="text-[28px] font-bold">' + escapeHtml(t.number) + '</div><div class="text-[11px] uppercase text-staff-text-muted">Table</div></div>' +
          badge +
        '</div>' +
        '<div class="pt-2 border-t border-staff-border-subtle"><span class="text-xs text-staff-text-muted">\\u2014</span></div>' +
      '</article>';
    }
    el.innerHTML = html;
  }

  function renderRoomMap(rooms, activeIds) {
    var el = document.getElementById('dashboard-room-map');
    if (!el) return;
    var html = '';
    for (var i = 0; i < rooms.length; i++) {
      var r = rooms[i];
      var occ = activeIds.indexOf(r.id) !== -1;
      var badge = occ
        ? '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Occupied</span>'
        : '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Vacant</span>';
      html += '<article data-room-id="' + escapeHtml(r.id) + '" data-room-number="' + escapeHtml(r.number) + '" data-room-status="' + (occ ? 'OCCUPIED' : 'FREE') + '" class="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3">' +
        '<div class="flex items-center justify-between gap-2">' +
          '<div><div class="text-[28px] font-bold">' + escapeHtml(r.number) + '</div><div class="text-[11px] uppercase text-staff-text-muted">Room</div></div>' +
          badge +
        '</div>' +
        '<div class="pt-2 border-t border-staff-border-subtle"><span class="text-xs text-staff-text-muted">\\u2014</span></div>' +
      '</article>';
    }
    el.innerHTML = html;
  }

  function sortByNumber(arr) {
    return arr.slice().sort(function(a, b) {
      var an = Number(a.number), bn = Number(b.number);
      if (isNaN(an) || isNaN(bn)) return String(a.number).localeCompare(String(b.number));
      return an - bn;
    });
  }

  function poll() {
    if (document.visibilityState !== 'visible') return;
    fetch('/api/admin/dashboard', { credentials: 'same-origin' })
      .then(function(res) { if (!res.ok) return null; return res.json(); })
      .then(function(json) {
        if (!json || !json.data) return;
        var d = json.data;
        var tById = {}; for (var i = 0; i < d.tables.length; i++) tById[d.tables[i].id] = d.tables[i].number;
        var rById = {}; for (var j = 0; j < d.rooms.length; j++) rById[d.rooms[j].id] = d.rooms[j].number;
        for (var a = 0; a < d.recentTableOrders.length; a++) d.recentTableOrders[a].tableNumber = tById[d.recentTableOrders[a].tableId] || null;
        for (var b = 0; b < d.recentRoomOrders.length; b++) d.recentRoomOrders[b].roomNumber = rById[d.recentRoomOrders[b].roomId] || null;
        for (var c = 0; c < d.recentRoomRequests.length; c++) d.recentRoomRequests[c].roomNumber = rById[d.recentRoomRequests[c].roomId] || null;

        renderMetrics(d);
        renderOrderList(d.recentTableOrders, 'dashboard-table-orders', 'No active table orders.');
        renderOrderList(d.recentRoomOrders, 'dashboard-room-orders', 'No active room orders.');
        renderRequestList(d.recentRoomRequests);
        renderTableMap(sortByNumber(d.tables), d.activeTableIds);
        renderRoomMap(sortByNumber(d.rooms), d.activeRoomIds);
      })
      .catch(function() {});
  }

  setInterval(poll, 5000);
  poll();
})();
`;
