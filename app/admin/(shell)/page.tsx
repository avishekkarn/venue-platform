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
  for (const o of activeOrders) {
    if (o.tableId) activeTableIds.add(o.tableId);
    if (o.roomId) activeRoomIds.add(o.roomId);
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
  );
}
