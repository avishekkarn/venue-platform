import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { OrderState, PlaceType } from "@/domain/orders/order.repository";
import type { Order, OrderItem } from "@/domain/orders/order.repository";
import {
  HotelService,
  RequestState,
  type ServiceRequest,
} from "@/domain/requests/request.repository";
import { OrderQueueRow } from "@/components/staff/order-queue-row";
import {
  RequestQueueRow,
  SERVICE_LABELS,
} from "@/components/staff/request-queue-row";
import { formatMoney } from "@/lib/money";
import { formatElapsed } from "@/lib/date";
import { cn } from "@/lib/utils";

/**
 * The Active Orders & Sessions Hub (Milestone 8.4.9c).
 *
 * Provides a unified overview across all active hospitality sessions:
 *   - Active Sessions: each active table/room session with orders, open requests, and running folio.
 *   - Active Orders: itemized list of orders in PLACED, APPROVED, PREPARING, READY, DELIVERED.
 *   - Open Requests: itemized list of requests in SUBMITTED, ACKNOWLEDGED, IN_PROGRESS.
 *
 * Includes an interactive detail panel on the right for inspecting selected sessions,
 * orders, or requests.
 */

const ACTIVE_ORDER_STATES: readonly OrderState[] = [
  OrderState.PLACED,
  OrderState.APPROVED,
  OrderState.PREPARING,
  OrderState.READY,
  OrderState.DELIVERED,
];

const OPEN_REQUEST_STATES: readonly RequestState[] = [
  RequestState.SUBMITTED,
  RequestState.ACKNOWLEDGED,
  RequestState.IN_PROGRESS,
];

function badgeClass(state: OrderState): string {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (state) {
    case OrderState.PLACED:
      return `${base} bg-amber-100 text-amber-800`;
    case OrderState.APPROVED:
      return `${base} bg-purple-100 text-purple-800`;
    case OrderState.PREPARING:
      return `${base} bg-sky-100 text-sky-800`;
    case OrderState.READY:
      return `${base} bg-status-ready-bg text-status-ready`;
    case OrderState.DELIVERED:
    case OrderState.COMPLETED:
      return `${base} bg-status-done-bg text-status-done`;
    case OrderState.CANCELLED:
      return `${base} bg-status-cancelled-bg text-status-cancelled`;
    default:
      return base;
  }
}

function requestBadgeClass(state: RequestState): string {
  const base =
    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (state) {
    case RequestState.SUBMITTED:
      return `${base} bg-amber-100 text-amber-800`;
    case RequestState.ACKNOWLEDGED:
      return `${base} bg-purple-100 text-purple-800`;
    case RequestState.IN_PROGRESS:
      return `${base} bg-sky-100 text-sky-800`;
    case RequestState.COMPLETED:
      return `${base} bg-status-done-bg text-status-done`;
    case RequestState.CANCELLED:
      return `${base} bg-status-cancelled-bg text-status-cancelled`;
    default:
      return base;
  }
}

interface ActiveOrdersPageProps {
  readonly searchParams: Promise<{
    id?: string;
    view?: string;
    sessionId?: string;
    requestId?: string;
  }>;
}

export default async function ActiveOrdersPage({
  searchParams,
}: ActiveOrdersPageProps): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const orderRepo = createPrismaOrderRepository(prisma);
  const requestRepo = createPrismaServiceRequestRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const [
    venueResult,
    ordersResult,
    openRequestsResult,
    tablesResult,
    roomsResult,
    activeSessionsRaw,
  ] = await Promise.all([
    venueRepo.findById(staff.venueId),
    orderRepo.listForVenue(staff.venueId),
    requestRepo.listOpenForVenue(staff.venueId),
    tableRepo.listForVenue(staff.venueId),
    roomRepo.listForVenue(staff.venueId),
    prisma.guestSession.findMany({
      where: { venueId: staff.venueId, endedAt: null },
      include: {
        orders: {
          include: { items: true, stateChanges: true },
        },
        serviceRequests: {
          include: { serviceItem: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "USD" : "USD";
  const allOrders = ordersResult.ok ? ordersResult.value : [];
  const openRequests = openRequestsResult.ok ? openRequestsResult.value : [];
  const tables = tablesResult.ok ? tablesResult.value : [];
  const rooms = roomsResult.ok ? roomsResult.value : [];

  const tableNumberById = new Map<string, string>();
  for (const t of tables) tableNumberById.set(t.id, t.number);
  const roomNumberById = new Map<string, string>();
  for (const r of rooms) roomNumberById.set(r.id, r.number);

  const activeOrders = allOrders
    .filter((o) => ACTIVE_ORDER_STATES.includes(o.state))
    .sort((a, b) => a.placedAt.getTime() - b.placedAt.getTime());

  function placeLabel(order: { placeType: PlaceType; tableId?: string | null; roomId?: string | null; pickupName?: string | null }): string {
    if (order.placeType === PlaceType.TABLE) {
      return order.tableId ? tableNumberById.get(order.tableId) ?? "—" : "—";
    }
    if (order.placeType === PlaceType.ROOM) {
      return order.roomId ? roomNumberById.get(order.roomId) ?? "—" : "—";
    }
    return order.pickupName ?? "—";
  }

  function placeTypeLabel(order: { placeType: PlaceType }): string {
    if (order.placeType === PlaceType.TABLE) return "Table";
    if (order.placeType === PlaceType.ROOM) return "Room";
    return "Counter";
  }

  function sessionPlaceLabel(session: { placeType: string; tableId?: string | null; roomId?: string | null }): { type: string; number: string } {
    if (session.placeType === "TABLE" && session.tableId) {
      return { type: "Table", number: tableNumberById.get(session.tableId) ?? "—" };
    }
    if (session.placeType === "ROOM" && session.roomId) {
      return { type: "Room", number: roomNumberById.get(session.roomId) ?? "—" };
    }
    return { type: "Counter", number: "—" };
  }

  const params = await searchParams;
  const currentView = params.view || "sessions";
  const selectedOrderId = params.id;
  const selectedSessionId = params.sessionId;
  const selectedRequestId = params.requestId;

  const selectedOrder: Order | null = selectedOrderId
    ? activeOrders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  const selectedSession = selectedSessionId
    ? activeSessionsRaw.find((s) => s.id === selectedSessionId) ?? null
    : null;

  const selectedRequest: ServiceRequest | null = selectedRequestId
    ? openRequests.find((r) => r.id === selectedRequestId) ?? null
    : null;

  const now = new Date();

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-staff-text-muted hover:text-staff-text-primary transition-colors mb-1.5"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
              Active Sessions & Orders
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-staff-surface-raised border border-staff-border-subtle text-staff-text-secondary">
              {activeSessionsRaw.length} Active Sessions
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-staff-surface-raised border border-staff-border-subtle text-staff-text-secondary">
              {activeOrders.length} Orders
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-staff-surface-raised border border-staff-border-subtle text-staff-text-secondary">
              {openRequests.length} Requests
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-staff-border-subtle pb-px">
          <Link
            href="/admin/orders/active?view=sessions"
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
              currentView === "sessions"
                ? "border-staff-brand text-staff-text-primary"
                : "border-transparent text-staff-text-muted hover:text-staff-text-primary"
            )}
          >
            Active Sessions ({activeSessionsRaw.length})
          </Link>
          <Link
            href="/admin/orders/active?view=orders"
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
              currentView === "orders"
                ? "border-staff-brand text-staff-text-primary"
                : "border-transparent text-staff-text-muted hover:text-staff-text-primary"
            )}
          >
            Active Orders ({activeOrders.length})
          </Link>
          <Link
            href="/admin/orders/active?view=requests"
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
              currentView === "requests"
                ? "border-staff-brand text-staff-text-primary"
                : "border-transparent text-staff-text-muted hover:text-staff-text-primary"
            )}
          >
            Open Requests ({openRequests.length})
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="flex flex-col gap-4">
          {/* VIEW: SESSIONS */}
          {currentView === "sessions" && (
            <div className="flex flex-col gap-3">
              {activeSessionsRaw.length === 0 ? (
                <p className="text-sm text-staff-text-muted py-8 text-center border border-staff-border-subtle rounded-xl bg-staff-surface-raised">
                  No active guest sessions.
                </p>
              ) : (
                activeSessionsRaw.map((sess) => {
                  const place = sessionPlaceLabel(sess);
                  const activeSessionOrders = sess.orders.filter((o) =>
                    ACTIVE_ORDER_STATES.includes(o.state as OrderState)
                  );
                  const activeSessionRequests = sess.serviceRequests.filter((r) =>
                    OPEN_REQUEST_STATES.includes(r.state as RequestState)
                  );

                  let sessionOrderTotal = 0;
                  for (const ord of sess.orders) {
                    if (ord.state !== OrderState.CANCELLED) {
                      sessionOrderTotal += Number(ord.total);
                    }
                  }

                  let sessionServiceTotal = 0;
                  for (const req of sess.serviceRequests) {
                    if (req.state !== RequestState.CANCELLED && req.serviceItem) {
                      sessionServiceTotal += Number(req.serviceItem.price);
                    }
                  }

                  const hasWaiterCall = sess.serviceRequests.some(
                    (r) =>
                      r.state === RequestState.SUBMITTED &&
                      r.serviceType === HotelService.CALL_WAITER
                  );
                  const hasBillRequest = sess.serviceRequests.some(
                    (r) =>
                      r.state === RequestState.SUBMITTED &&
                      r.serviceType === HotelService.REQUEST_BILL
                  );
                  const hasDnd = sess.serviceRequests.some(
                    (r) =>
                      r.state !== RequestState.CANCELLED &&
                      r.serviceType === HotelService.DO_NOT_DISTURB &&
                      (r.detailsJson as Record<string, unknown>)?.["state"] !== "Off"
                  );

                  const isSelected = selectedSessionId === sess.id;

                  return (
                    <Link
                      key={sess.id}
                      href={`/admin/orders/active?view=sessions&sessionId=${sess.id}`}
                      className={cn(
                        "block p-5 bg-staff-surface-raised border border-staff-border-subtle rounded-xl transition-all shadow-2xs hover:border-staff-border",
                        isSelected && "ring-2 ring-staff-brand"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-staff-text-primary">
                              {place.type} {place.number}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-800">
                              Occupied · {formatElapsed(sess.createdAt, now)}
                            </span>
                            {hasDnd && (
                              <span className="text-xs px-2 py-0.5 rounded font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                                Do Not Disturb
                              </span>
                            )}
                            {hasWaiterCall && (
                              <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-500 text-white animate-pulse">
                                🔔 Waiter Call
                              </span>
                            )}
                            {hasBillRequest && (
                              <span className="text-xs px-2 py-0.5 rounded font-bold bg-sky-600 text-white animate-pulse">
                                🧾 Bill Requested
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-staff-text-secondary">
                            Session ID: #{sess.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-staff-text-primary block font-mono">
                            {formatMoney((sessionOrderTotal + sessionServiceTotal).toFixed(2), currency)}
                          </span>
                          <span className="text-[11px] text-staff-text-muted">
                            {sess.orders.length} order{sess.orders.length === 1 ? "" : "s"} · {sess.serviceRequests.length} request{sess.serviceRequests.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-staff-border-subtle/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-staff-text-muted">Active Pipeline:</span>
                          {activeSessionOrders.length > 0 ? (
                            <span className="font-medium text-staff-text-primary">
                              {activeSessionOrders.length} order{activeSessionOrders.length === 1 ? "" : "s"} ({activeSessionOrders.map((o) => o.state).join(", ")})
                            </span>
                          ) : (
                            <span className="text-staff-text-muted italic">No orders in prep</span>
                          )}
                          {activeSessionRequests.length > 0 && (
                            <span className="font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              {activeSessionRequests.length} open service request{activeSessionRequests.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        <span className="text-staff-brand font-medium hover:underline">
                          Inspect Folio →
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW: ORDERS */}
          {currentView === "orders" && (
            <div id="active-orders-list" className="flex flex-col gap-3">
              {activeOrders.length === 0 ? (
                <p className="text-sm text-staff-text-muted py-8 text-center border border-staff-border-subtle rounded-xl bg-staff-surface-raised">
                  No active orders in pipeline.
                </p>
              ) : (
                activeOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/active?view=orders&id=${order.id}`}
                    className={cn(
                      "block rounded-xl transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-brand",
                      selectedOrderId === order.id && "ring-2 ring-staff-brand"
                    )}
                  >
                    <OrderQueueRow
                      order={order}
                      placeLabel={placeLabel(order)}
                      placeTypeLabel={placeTypeLabel(order)}
                      elapsedLabel={formatElapsed(order.placedAt, now)}
                    />
                  </Link>
                ))
              )}
            </div>
          )}

          {/* VIEW: REQUESTS */}
          {currentView === "requests" && (
            <div id="open-requests-list" className="flex flex-col gap-3">
              {openRequests.length === 0 ? (
                <p className="text-sm text-staff-text-muted py-8 text-center border border-staff-border-subtle rounded-xl bg-staff-surface-raised">
                  No open service requests.
                </p>
              ) : (
                openRequests.map((req) => {
                  const placeNumber =
                    req.placeType === PlaceType.ROOM && req.roomId
                      ? roomNumberById.get(req.roomId) ?? "—"
                      : req.placeType === PlaceType.TABLE && req.tableId
                        ? tableNumberById.get(req.tableId) ?? "—"
                        : "Counter";
                  const placeType =
                    req.placeType === PlaceType.ROOM
                      ? "Room"
                      : req.placeType === PlaceType.TABLE
                        ? "Table"
                        : "Counter";

                  return (
                    <Link
                      key={req.id}
                      href={`/admin/orders/active?view=requests&requestId=${req.id}`}
                      className={cn(
                        "block rounded-xl transition-colors",
                        selectedRequestId === req.id && "ring-2 ring-staff-brand"
                      )}
                    >
                      <RequestQueueRow
                        request={req}
                        placeNumber={placeNumber}
                        placeTypeLabel={placeType}
                        elapsedLabel={formatElapsed(req.submittedAt, now)}
                        readOnly={true}
                      />
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT DETAIL INSPECTOR */}
        <aside className="self-start sticky top-4 flex flex-col gap-4">
          {/* SESSION INSPECTOR */}
          {selectedSession ? (
            <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-5 flex flex-col gap-4">
              <header className="flex items-center justify-between gap-2 border-b border-staff-border-subtle pb-3">
                <div>
                  <h2 className="text-lg font-bold text-staff-text-primary">
                    {sessionPlaceLabel(selectedSession).type} {sessionPlaceLabel(selectedSession).number} Folio
                  </h2>
                  <p className="text-xs text-staff-text-secondary">
                    Active Session #{selectedSession.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-amber-100 text-amber-800">
                  {formatElapsed(selectedSession.createdAt, now)}
                </span>
              </header>

              {/* Food & Drink Orders */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                  Food & Beverage Orders ({selectedSession.orders.length})
                </h3>
                {selectedSession.orders.length === 0 ? (
                  <p className="text-xs text-staff-text-muted italic">No orders yet</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedSession.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2.5 rounded-lg border border-staff-border-subtle bg-staff-surface text-xs flex flex-col gap-1.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-staff-text-primary">
                            #{ord.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={badgeClass(ord.state as OrderState)}>
                            {ord.state}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-staff-text-secondary">
                          {ord.items.map((it) => (
                            <div key={it.id} className="flex justify-between">
                              <span>{it.quantity}× {it.itemName}</span>
                              <span className="font-mono">{formatMoney(it.lineTotal.toString(), currency)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between font-medium pt-1 border-t border-staff-border-subtle/60 text-staff-text-primary">
                          <span>Order Total</span>
                          <span className="font-mono">{formatMoney(ord.total.toString(), currency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hotel Service Requests */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                  Hotel Services ({selectedSession.serviceRequests.length})
                </h3>
                {selectedSession.serviceRequests.length === 0 ? (
                  <p className="text-xs text-staff-text-muted italic">No service requests yet</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedSession.serviceRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-2.5 rounded-lg border border-staff-border-subtle bg-staff-surface text-xs flex flex-col gap-1"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-staff-text-primary">
                            {SERVICE_LABELS[req.serviceType as HotelService] || req.serviceType}
                          </span>
                          <span className={requestBadgeClass(req.state as RequestState)}>
                            {req.state}
                          </span>
                        </div>
                        {req.serviceItem && Number(req.serviceItem.price) > 0 ? (
                          <div className="flex justify-between text-staff-text-secondary pt-0.5">
                            <span>Service Charge</span>
                            <span className="font-mono font-medium text-staff-text-primary">
                              {formatMoney(req.serviceItem.price.toString(), currency)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-staff-text-muted italic">Complimentary service</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : selectedOrder ? (
            /* ORDER INSPECTOR */
            <div
              id="order-detail-panel"
              className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-5 flex flex-col gap-4"
              aria-label="Order detail"
            >
              <header className="flex items-center justify-between gap-2 border-b border-staff-border-subtle pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-staff-text-primary">
                    #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </h2>
                  <div className="text-xs text-staff-text-secondary">
                    {placeTypeLabel(selectedOrder)} {placeLabel(selectedOrder)}
                  </div>
                </div>
                <span className={badgeClass(selectedOrder.state)}>
                  {selectedOrder.state}
                </span>
              </header>

              {selectedOrder.notes ? (
                <p className="text-xs italic text-staff-text-muted bg-staff-surface p-2 rounded">
                  Note: {selectedOrder.notes}
                </p>
              ) : null}

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                  Items
                </h3>
                <ul className="flex flex-col gap-2">
                  {selectedOrder.items.map((it: OrderItem) => (
                    <li key={it.id} className="flex items-start justify-between gap-3 text-xs">
                      <span className="text-staff-text-primary">
                        {it.quantity}× {it.itemName}
                        {it.notes ? (
                          <span className="block text-[11px] italic text-staff-text-muted">
                            {it.notes}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono text-staff-text-primary">
                        {formatMoney(it.lineTotal, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-staff-border-subtle pt-3 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-staff-text-muted">Subtotal</span>
                  <span className="font-mono text-staff-text-primary">
                    {formatMoney(selectedOrder.subtotal, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-staff-text-muted">Tax</span>
                  <span className="font-mono text-staff-text-primary">
                    {formatMoney(selectedOrder.taxAmount, currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold pt-1 border-t border-staff-border-subtle/60 text-sm">
                  <span>Total</span>
                  <span className="font-mono text-staff-text-primary">
                    {formatMoney(selectedOrder.total, currency)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                  History
                </h3>
                <ul className="flex flex-col gap-1.5 text-xs text-staff-text-secondary">
                  {selectedOrder.stateChanges.map((sc) => (
                    <li key={sc.id} className="flex items-center justify-between gap-3">
                      <span>{sc.state}</span>
                      <span className="font-mono text-staff-text-muted text-[11px]">
                        {sc.occurredAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : selectedRequest ? (
            /* REQUEST INSPECTOR */
            <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-5 flex flex-col gap-4">
              <header className="flex items-center justify-between gap-2 border-b border-staff-border-subtle pb-3">
                <div>
                  <h2 className="text-lg font-bold text-staff-text-primary">
                    {SERVICE_LABELS[selectedRequest.serviceType] || selectedRequest.serviceType}
                  </h2>
                  <p className="text-xs text-staff-text-secondary">
                    Request #{selectedRequest.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <span className={requestBadgeClass(selectedRequest.state)}>
                  {selectedRequest.state}
                </span>
              </header>

              <div className="text-xs text-staff-text-secondary flex flex-col gap-1">
                <div>
                  <span className="text-staff-text-muted">Place: </span>
                  <span className="font-medium text-staff-text-primary">
                    {selectedRequest.placeType} {selectedRequest.roomId ? roomNumberById.get(selectedRequest.roomId) : selectedRequest.tableId ? tableNumberById.get(selectedRequest.tableId) : "Counter"}
                  </span>
                </div>
                <div>
                  <span className="text-staff-text-muted">Submitted: </span>
                  <span>{formatElapsed(selectedRequest.submittedAt, now)} ({selectedRequest.submittedAt.toLocaleTimeString()})</span>
                </div>
              </div>

              {selectedRequest.details && Object.keys(selectedRequest.details).length > 0 && (
                <div className="bg-staff-surface rounded p-3 text-xs border border-staff-border-subtle">
                  <h4 className="font-semibold text-staff-text-muted uppercase text-[10px] tracking-wide mb-1.5">Intake Details</h4>
                  <pre className="text-staff-text-primary font-mono text-[11px] whitespace-pre-wrap">
                    {JSON.stringify(selectedRequest.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:block bg-staff-surface-raised border border-dashed border-staff-border-subtle rounded-xl p-6 text-center">
              <p className="text-xs text-staff-text-muted">
                Select a session, order, or service request to inspect full operational details.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
