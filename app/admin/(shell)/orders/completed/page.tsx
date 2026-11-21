import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { OrderState, PlaceType, type OrderFilter } from "@/domain/orders/order.repository";
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
 * The Completed Orders & Closed Folios Ledger (Milestone 8.4.9d).
 *
 * A comprehensive ledger of closed business:
 *   - Completed Orders: F&B orders in COMPLETED or CANCELLED state.
 *   - Completed Requests: Hotel service requests in COMPLETED or CANCELLED state.
 *   - Closed Session Folios: Closed guest sessions with itemized bills (Orders + Hotel Services + Tax = Total).
 *
 * Supports time presets (Today, Yesterday, This Week, This Month, Custom) and CSV export.
 */

const TERMINAL_ORDER_STATES: readonly OrderState[] = [
  OrderState.COMPLETED,
  OrderState.CANCELLED,
];

type RangeKey = "today" | "yesterday" | "week" | "month" | "custom";

interface CompletedOrdersPageProps {
  readonly searchParams: Promise<{
    id?: string;
    range?: string;
    from?: string;
    to?: string;
    view?: string;
    sessionId?: string;
    requestId?: string;
  }>;
}

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

function isDateString(s: string | undefined): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function startOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}

function endOfUtcDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)
  );
}

function computeRange(
  key: RangeKey,
  from?: string,
  to?: string
): { dateFrom?: Date; dateTo?: Date; label: string } {
  const now = new Date();
  if (key === "today") {
    return {
      dateFrom: startOfUtcDay(now),
      dateTo: endOfUtcDay(now),
      label: "Today",
    };
  }
  if (key === "yesterday") {
    const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      dateFrom: startOfUtcDay(y),
      dateTo: endOfUtcDay(y),
      label: "Yesterday",
    };
  }
  if (key === "week") {
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(now.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
    return {
      dateFrom: startOfUtcDay(monday),
      dateTo: endOfUtcDay(now),
      label: "This Week",
    };
  }
  if (key === "month") {
    const firstOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
    );
    return {
      dateFrom: firstOfMonth,
      dateTo: endOfUtcDay(now),
      label: "This Month",
    };
  }
  if (key === "custom" && isDateString(from) && isDateString(to)) {
    const fromD = new Date(`${from}T00:00:00.000Z`);
    const toD = new Date(`${to}T23:59:59.999Z`);
    if (fromD && toD) {
      return {
        dateFrom: startOfUtcDay(fromD),
        dateTo: endOfUtcDay(toD),
        label: `${from} → ${to}`,
      };
    }
  }
  return { label: "Custom (pick a range)" };
}

export default async function CompletedOrdersPage({
  searchParams,
}: CompletedOrdersPageProps): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const orderRepo = createPrismaOrderRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const params = await searchParams;
  const currentView = params.view || "orders";
  const rangeKey: RangeKey =
    params.range === "yesterday" ||
    params.range === "week" ||
    params.range === "month" ||
    params.range === "custom"
      ? params.range
      : "today";

  const range = computeRange(rangeKey, params.from, params.to);

  const orderFilter: OrderFilter = {
    ...(range.dateFrom ? { dateFrom: range.dateFrom, dateTo: range.dateTo } : {}),
  };

  const [
    venueResult,
    ordersResult,
    tablesResult,
    roomsResult,
    completedRequestsRaw,
    closedSessionsRaw,
  ] = await Promise.all([
    venueRepo.findById(staff.venueId),
    orderRepo.listForVenue(staff.venueId, orderFilter),
    tableRepo.listForVenue(staff.venueId),
    roomRepo.listRoomsWithDetails(staff.venueId),
    prisma.serviceRequest.findMany({
      where: {
        venueId: staff.venueId,
        state: { in: [RequestState.COMPLETED, RequestState.CANCELLED] },
        ...(range.dateFrom ? { submittedAt: { gte: range.dateFrom, lte: range.dateTo } } : {}),
      },
      include: { serviceItem: true },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.guestSession.findMany({
      where: {
        venueId: staff.venueId,
        endedAt: range.dateFrom ? { gte: range.dateFrom, lte: range.dateTo } : { not: null },
      },
      include: {
        orders: {
          include: { items: true, stateChanges: true },
        },
        serviceRequests: {
          include: { serviceItem: true },
        },
      },
      orderBy: { endedAt: "desc" },
    }),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "USD" : "USD";
  const tables = tablesResult.ok ? tablesResult.value : [];
  const rooms = roomsResult.ok ? roomsResult.value : [];

  const tableNumberById = new Map<string, string>();
  for (const t of tables) tableNumberById.set(t.id, t.number);
  const roomNumberById = new Map<string, string>();
  for (const r of rooms) roomNumberById.set(r.id, r.number);
  const roomCategoryByRoomId = new Map<string, { name: string; basePrice: number }>();
  for (const r of rooms) {
    if (r.category && Number(r.category.basePrice) > 0) {
      roomCategoryByRoomId.set(r.id, {
        name: r.category.name,
        basePrice: Number(r.category.basePrice),
      });
    }
  }

  const completedOrders = (ordersResult.ok ? ordersResult.value : [])
    .filter((o) => TERMINAL_ORDER_STATES.includes(o.state))
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());

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

  const selectedOrderId = params.id;
  const selectedSessionId = params.sessionId;
  const selectedRequestId = params.requestId;

  const selectedOrder: Order | null = selectedOrderId
    ? completedOrders.find((o) => o.id === selectedOrderId) ?? null
    : null;

  const selectedSession = selectedSessionId
    ? closedSessionsRaw.find((s) => s.id === selectedSessionId) ?? null
    : null;

  const selectedRequest = selectedRequestId
    ? completedRequestsRaw.find((r) => r.id === selectedRequestId) ?? null
    : null;

  const now = new Date();

  const exportParams = new URLSearchParams();
  if (range.dateFrom) {
    exportParams.set("from", range.dateFrom.toISOString().slice(0, 10));
  }
  if (range.dateTo) {
    exportParams.set("to", range.dateTo.toISOString().slice(0, 10));
  }
  const exportHref = `/api/admin/orders/export?${exportParams.toString()}`;

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
              Completed Orders & Closed Folios
            </h1>
          </div>
          <a
            href={exportHref}
            className="inline-flex items-center justify-center rounded-md px-4 h-10 text-sm font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-brand"
          >
            Export CSV
          </a>
        </div>

        {/* Date-range filter */}
        <nav
          aria-label="Date range"
          className="flex flex-wrap items-center gap-2"
        >
          {(["today", "yesterday", "week", "month"] as const).map((key) => {
            const labelMap = {
              today: "Today",
              yesterday: "Yesterday",
              week: "This Week",
              month: "This Month",
            };
            const isActive = rangeKey === key;
            return (
              <Link
                key={key}
                href={`/admin/orders/completed?range=${key}&view=${currentView}`}
                className={cn(
                  "inline-flex items-center justify-center rounded-md px-3 h-9 text-sm font-medium border",
                  isActive
                    ? "bg-staff-brand text-staff-brand-contrast border-staff-brand"
                    : "bg-staff-surface-raised text-staff-text-primary border-staff-border-subtle hover:bg-staff-surface-sunken"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {labelMap[key]}
              </Link>
            );
          })}

          <form
            action="/admin/orders/completed"
            method="GET"
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-2 py-1 border",
              rangeKey === "custom"
                ? "bg-staff-brand text-staff-brand-contrast border-staff-brand"
                : "bg-staff-surface-raised text-staff-text-primary border-staff-border-subtle"
            )}
          >
            <input type="hidden" name="range" value="custom" />
            <input type="hidden" name="view" value={currentView} />
            <label className="text-xs font-medium whitespace-nowrap" htmlFor="from">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={isDateString(params.from) ? params.from : ""}
              className="h-8 rounded-sm border border-staff-border-subtle bg-staff-surface px-2 text-xs text-staff-text-primary"
            />
            <label className="text-xs font-medium whitespace-nowrap" htmlFor="to">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={isDateString(params.to) ? params.to : ""}
              className="h-8 rounded-sm border border-staff-border-subtle bg-staff-surface px-2 text-xs text-staff-text-primary"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-sm px-2 h-8 text-xs font-medium bg-staff-brand text-staff-brand-contrast hover:brightness-95"
            >
              Apply
            </button>
          </form>
        </nav>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-staff-border-subtle pb-px">
          <Link
            href={`/admin/orders/completed?range=${rangeKey}&view=orders${params.from ? `&from=${params.from}&to=${params.to}` : ""}`}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
              currentView === "orders"
                ? "border-staff-brand text-staff-text-primary"
                : "border-transparent text-staff-text-muted hover:text-staff-text-primary"
            )}
          >
            Completed Orders ({completedOrders.length})
          </Link>
          <Link
            href={`/admin/orders/completed?range=${rangeKey}&view=requests${params.from ? `&from=${params.from}&to=${params.to}` : ""}`}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
              currentView === "requests"
                ? "border-staff-brand text-staff-text-primary"
                : "border-transparent text-staff-text-muted hover:text-staff-text-primary"
            )}
          >
            Completed Requests ({completedRequestsRaw.length})
          </Link>
          <Link
            href={`/admin/orders/completed?range=${rangeKey}&view=folios${params.from ? `&from=${params.from}&to=${params.to}` : ""}`}
            className={cn(
              "px-4 py-2 text-sm font-semibold border-b-2 transition-colors",
              currentView === "folios"
                ? "border-staff-brand text-staff-text-primary"
                : "border-transparent text-staff-text-muted hover:text-staff-text-primary"
            )}
          >
            Closed Session Folios ({closedSessionsRaw.length})
          </Link>
        </div>

        <p className="text-sm text-staff-text-muted">
          {range.label} · {currentView === "orders" ? `${completedOrders.length} orders` : currentView === "requests" ? `${completedRequestsRaw.length} requests` : `${closedSessionsRaw.length} closed sessions`}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="flex flex-col gap-4">
          {/* VIEW: COMPLETED ORDERS */}
          {currentView === "orders" && (
            <div id="completed-orders-list" className="flex flex-col gap-3">
              {completedOrders.length === 0 ? (
                <p className="text-sm text-staff-text-muted py-8 text-center border border-staff-border-subtle rounded-xl bg-staff-surface-raised">
                  No completed orders in this date range.
                </p>
              ) : (
                completedOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/completed?range=${rangeKey}&view=orders&id=${order.id}${params.from ? `&from=${params.from}&to=${params.to}` : ""}`}
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

          {/* VIEW: COMPLETED REQUESTS */}
          {currentView === "requests" && (
            <div id="completed-requests-list" className="flex flex-col gap-3">
              {completedRequestsRaw.length === 0 ? (
                <p className="text-sm text-staff-text-muted py-8 text-center border border-staff-border-subtle rounded-xl bg-staff-surface-raised">
                  No completed requests in this date range.
                </p>
              ) : (
                completedRequestsRaw.map((req) => {
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
                      href={`/admin/orders/completed?range=${rangeKey}&view=requests&requestId=${req.id}${params.from ? `&from=${params.from}&to=${params.to}` : ""}`}
                      className={cn(
                        "block rounded-xl transition-colors",
                        selectedRequestId === req.id && "ring-2 ring-staff-brand"
                      )}
                    >
                      <RequestQueueRow
                        request={req as unknown as ServiceRequest}
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

          {/* VIEW: CLOSED SESSION FOLIOS */}
          {currentView === "folios" && (
            <div id="closed-folios-list" className="flex flex-col gap-3">
              {closedSessionsRaw.length === 0 ? (
                <p className="text-sm text-staff-text-muted py-8 text-center border border-staff-border-subtle rounded-xl bg-staff-surface-raised">
                  No closed session folios in this date range.
                </p>
              ) : (
                closedSessionsRaw.map((sess) => {
                  const place = sessionPlaceLabel(sess);
                  let ordersTotal = 0;
                  for (const ord of sess.orders) {
                    if (ord.state !== OrderState.CANCELLED) {
                      ordersTotal += Number(ord.total);
                    }
                  }

                  let servicesTotal = 0;
                  for (const srv of sess.serviceRequests) {
                    if (srv.state !== RequestState.CANCELLED && srv.serviceItem) {
                      servicesTotal += Number(srv.serviceItem.price);
                    }
                  }

                  const roomRateInfo = sess.roomId ? roomCategoryByRoomId.get(sess.roomId) : null;
                  const roomRate = roomRateInfo ? roomRateInfo.basePrice : 0;
                  const grandTotal = ordersTotal + servicesTotal + roomRate;
                  const isSelected = selectedSessionId === sess.id;

                  return (
                    <Link
                      key={sess.id}
                      href={`/admin/orders/completed?range=${rangeKey}&view=folios&sessionId=${sess.id}${params.from ? `&from=${params.from}&to=${params.to}` : ""}`}
                      className={cn(
                        "block p-5 bg-staff-surface-raised border border-staff-border-subtle rounded-xl transition-all shadow-2xs hover:border-staff-border",
                        isSelected && "ring-2 ring-staff-brand"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-staff-text-primary">
                              {place.type} {place.number}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800">
                              Closed · {sess.endedAt ? sess.endedAt.toLocaleDateString() : ""}
                            </span>
                          </div>
                          <p className="text-xs text-staff-text-secondary mt-0.5">
                            Duration: {formatElapsed(sess.createdAt, sess.endedAt || now)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold text-staff-text-primary block font-mono">
                            {formatMoney(grandTotal.toFixed(2), currency)}
                          </span>
                          <span className="text-[11px] text-staff-text-muted">
                            F&B: {formatMoney(ordersTotal.toFixed(2), currency)} · Services: {formatMoney(servicesTotal.toFixed(2), currency)}
                            {roomRate > 0 ? ` · Room: ${formatMoney(roomRate.toFixed(2), currency)}` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-staff-border-subtle/80 flex items-center justify-between text-xs">
                        <span className="text-staff-text-muted">
                          {sess.orders.length} order{sess.orders.length === 1 ? "" : "s"} · {sess.serviceRequests.length} service request{sess.serviceRequests.length === 1 ? "" : "s"}
                        </span>
                        <span className="text-staff-brand font-medium hover:underline">
                          View Itemized Folio →
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT DETAIL INSPECTOR */}
        <aside className="self-start sticky top-4 flex flex-col gap-4">
          {selectedSession ? (() => {
            const selOrdersTotal = selectedSession.orders.reduce(
              (acc, o) => acc + (o.state !== OrderState.CANCELLED ? Number(o.total) : 0),
              0
            );
            const selServicesTotal = selectedSession.serviceRequests.reduce(
              (acc, r) => acc + (r.state !== RequestState.CANCELLED && r.serviceItem ? Number(r.serviceItem.price) : 0),
              0
            );
            const selRoomRateInfo = selectedSession.roomId ? roomCategoryByRoomId.get(selectedSession.roomId) : null;
            const selRoomRate = selRoomRateInfo ? selRoomRateInfo.basePrice : 0;
            const selGrandTotal = selOrdersTotal + selServicesTotal + selRoomRate;

            return (
              /* SESSION FOLIO DETAIL */
              <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-5 flex flex-col gap-4">
                <header className="flex items-center justify-between gap-2 border-b border-staff-border-subtle pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-staff-text-primary">
                      {sessionPlaceLabel(selectedSession).type} {sessionPlaceLabel(selectedSession).number} Folio
                    </h2>
                    <p className="text-xs text-staff-text-secondary">
                      Closed Session #{selectedSession.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-100 text-emerald-800">
                    Closed
                  </span>
                </header>

                {/* Food & Drink Orders */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                    Food & Beverage Orders ({selectedSession.orders.length})
                  </h3>
                  {selectedSession.orders.length === 0 ? (
                    <p className="text-xs text-staff-text-muted italic">No orders recorded</p>
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

                {/* Hotel Services */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                    Hotel Services ({selectedSession.serviceRequests.length})
                  </h3>
                  {selectedSession.serviceRequests.length === 0 ? (
                    <p className="text-xs text-staff-text-muted italic">No hotel services recorded</p>
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

                {/* Room Accommodation */}
                {selRoomRateInfo ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-staff-text-muted mb-2">
                      Room Accommodation
                    </h3>
                    <div className="p-2.5 rounded-lg border border-staff-border-subtle bg-staff-surface text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-staff-text-primary block">
                          {selRoomRateInfo.name} Room Stay
                        </span>
                        <span className="text-[11px] text-staff-text-secondary">Base nightly rate</span>
                      </div>
                      <span className="font-mono font-medium text-staff-text-primary">
                        {formatMoney(selRoomRate.toFixed(2), currency)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Consolidated Folio Financial Summary */}
                <div className="pt-3 border-t border-staff-border-subtle flex flex-col gap-1.5 text-xs">
                  <div className="flex justify-between text-staff-text-secondary">
                    <span>Food & Beverage Total</span>
                    <span className="font-mono font-medium text-staff-text-primary">
                      {formatMoney(selOrdersTotal.toFixed(2), currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-staff-text-secondary">
                    <span>Hotel Services Total</span>
                    <span className="font-mono font-medium text-staff-text-primary">
                      {formatMoney(selServicesTotal.toFixed(2), currency)}
                    </span>
                  </div>
                  {selRoomRate > 0 ? (
                    <div className="flex justify-between text-staff-text-secondary">
                      <span>Room Accommodation</span>
                      <span className="font-mono font-medium text-staff-text-primary">
                        {formatMoney(selRoomRate.toFixed(2), currency)}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-sm font-bold text-staff-text-primary pt-2 border-t border-staff-border-subtle/80">
                    <span>Consolidated Folio Total</span>
                    <span className="font-mono text-staff-brand">
                      {formatMoney(selGrandTotal.toFixed(2), currency)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })() : selectedOrder ? (
            /* ORDER DETAIL */
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
            /* REQUEST DETAIL */
            <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-5 flex flex-col gap-4">
              <header className="flex items-center justify-between gap-2 border-b border-staff-border-subtle pb-3">
                <div>
                  <h2 className="text-lg font-bold text-staff-text-primary">
                    {SERVICE_LABELS[selectedRequest.serviceType as HotelService] || selectedRequest.serviceType}
                  </h2>
                  <p className="text-xs text-staff-text-secondary">
                    Request #{selectedRequest.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <span className={requestBadgeClass(selectedRequest.state as RequestState)}>
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
                {selectedRequest.serviceItem && (
                  <div>
                    <span className="text-staff-text-muted">Fee: </span>
                    <span className="font-mono font-medium text-staff-text-primary">
                      {formatMoney(selectedRequest.serviceItem.price.toString(), currency)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden lg:block bg-staff-surface-raised border border-dashed border-staff-border-subtle rounded-xl p-6 text-center">
              <p className="text-xs text-staff-text-muted">
                Select an order, request, or closed session folio to view itemized records.
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
