"use client";

import { useState, useEffect, useCallback, useMemo, type JSX } from "react";
import Link from "next/link";
import { MetricTile } from "@/components/staff/metric-tile";
import { formatMoney } from "@/lib/money";
import { OrderState, PlaceType } from "@/domain/orders/order.repository";
import { RequestState, HotelService, type ServiceRequestDetails } from "@/domain/requests/request.repository";
import { TableState } from "@/domain/organization/table.repository";
import { RoomState } from "@/domain/organization/room.repository";

export interface SerializedOrder {
  id: string;
  state: OrderState;
  placeType: PlaceType;
  tableId: string | null;
  roomId: string | null;
  pickupName: string | null;
  placedAt: string;
  items: Array<{ itemName: string; quantity: number }>;
  tableNumber?: string | null;
  roomNumber?: string | null;
}

export interface SerializedRequest {
  id: string;
  state: RequestState;
  serviceType: HotelService;
  placeType: PlaceType | null;
  roomId: string | null;
  tableId: string | null;
  submittedAt: string;
  details?: ServiceRequestDetails;
  roomNumber?: string | null;
  tableNumber?: string | null;
}

export interface SerializedTable {
  id: string;
  number: string;
  state: TableState;
}

export interface SerializedRoom {
  id: string;
  number: string;
  state: RoomState;
}

export interface DashboardData {
  ordersWaiting: number;
  inKitchen: number;
  ready: number;
  revenueToday: string;
  ordersRevenue?: string;
  servicesRevenue?: string;
  roomsRevenue?: string;
  ordersToday: number;
  requestsOpen: number;
  activeSessionsCount?: number;
  activeTableSessionsCount?: number;
  activeRoomSessionsCount?: number;
  recentTableOrders: SerializedOrder[];
  recentRoomOrders: SerializedOrder[];
  recentRoomRequests: SerializedRequest[];
  recentAttentionRequests?: SerializedRequest[];
  recentTableRequests?: SerializedRequest[];
  tables: SerializedTable[];
  rooms: SerializedRoom[];
  activeTableIds: string[];
  activeRoomIds: string[];
  dndRoomIds: string[];
}

interface DashboardViewProps {
  readonly initialData: DashboardData;
  readonly venueCurrency?: string;
}

const SERVICE_LABELS: Record<string, string> = {
  ROOM_SERVICE_FOOD: "Room Service",
  HOUSEKEEPING: "Housekeeping",
  MAINTENANCE: "Maintenance",
  CONCIERGE: "Concierge",
  LAUNDRY: "Laundry",
  SPA: "Spa",
  LATE_CHECKOUT: "Late Checkout",
  WAKE_UP_CALL: "Wake-up Call",
  DO_NOT_DISTURB: "Do Not Disturb",
  CALL_WAITER: "Call Waiter",
  REQUEST_BILL: "Request Bill",
};

function formatElapsed(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
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

function orderBadge(state: OrderState): string {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (state) {
    case OrderState.PLACED:
      return `${base} bg-amber-100 text-amber-800`;
    case OrderState.APPROVED:
      return `${base} bg-purple-100 text-purple-800`;
    case OrderState.PREPARING:
      return `${base} bg-sky-100 text-sky-800`;
    case OrderState.READY:
      return `${base} bg-emerald-100 text-emerald-800`;
    case OrderState.DELIVERED:
    case OrderState.COMPLETED:
      return `${base} bg-stone-100 text-stone-800`;
    case OrderState.CANCELLED:
      return `${base} bg-red-100 text-red-800`;
    default:
      return base;
  }
}

function requestBadge(state: RequestState): string {
  const base = "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium";
  switch (state) {
    case RequestState.SUBMITTED:
      return `${base} bg-amber-100 text-amber-800`;
    case RequestState.ACKNOWLEDGED:
      return `${base} bg-purple-100 text-purple-800`;
    case RequestState.IN_PROGRESS:
      return `${base} bg-sky-100 text-sky-800`;
    case RequestState.COMPLETED:
      return `${base} bg-emerald-100 text-emerald-800`;
    default:
      return `${base} bg-stone-100 text-stone-800`;
  }
}

function formatDetailsSummary(details?: ServiceRequestDetails): string {
  if (!details || typeof details !== "object") return "";
  const parts: string[] = [];
  for (const [key, val] of Object.entries(details)) {
    if (val === null || val === undefined || val === "") continue;
    if (Array.isArray(val)) {
      parts.push(`${key}: ${val.join(", ")}`);
    } else {
      parts.push(`${key}: ${val}`);
    }
  }
  return parts.join(" · ");
}

export function DashboardView({
  initialData,
  venueCurrency = "NPR",
}: DashboardViewProps): JSX.Element {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [mapView, setMapView] = useState<"ALL" | "ROOMS" | "TABLES">("ALL");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lookup maps for table and room numbers
  const tableNumberById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of data.tables) map.set(t.id, t.number);
    return map;
  }, [data.tables]);

  const roomNumberById = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of data.rooms) map.set(r.id, r.number);
    return map;
  }, [data.rooms]);

  // Sort tables and rooms by natural numeric order
  const sortedTables = useMemo(() => {
    return [...data.tables].sort((a, b) => {
      const an = Number(a.number);
      const bn = Number(b.number);
      if (Number.isNaN(an) || Number.isNaN(bn)) return a.number.localeCompare(b.number);
      return an - bn;
    });
  }, [data.tables]);

  const sortedRooms = useMemo(() => {
    return [...data.rooms].sort((a, b) => {
      const an = Number(a.number);
      const bn = Number(b.number);
      if (Number.isNaN(an) || Number.isNaN(bn)) return a.number.localeCompare(b.number);
      return an - bn;
    });
  }, [data.rooms]);

  const poll = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "same-origin" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.data) {
        setData(json.data);
        setLastRefreshedAt(new Date());
      }
    } catch {
      // Network jitter or silent retry
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && mounted) {
        poll(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [poll]);

  // Derived occupancy metrics
  const occupiedRoomCount = data.activeRoomIds.length;
  const totalRoomCount = data.rooms.length;
  const occupiedTableCount = data.activeTableIds.length;
  const totalTableCount = data.tables.length;
  const totalActiveSessions = data.activeSessionsCount ?? (occupiedRoomCount + occupiedTableCount);

  // Revenue display
  const fnbRev = data.ordersRevenue ?? "0.00";
  const srvRev = data.servicesRevenue ?? "0.00";
  const roomRev = data.roomsRevenue ?? "0.00";
  const revSubtext = `F&B: ${formatMoney(fnbRev, venueCurrency)} · Services: ${formatMoney(srvRev, venueCurrency)} · Rooms: ${formatMoney(roomRev, venueCurrency)}`;

  // Attention requests (Call Waiter / Request Bill)
  const attentionRequests = data.recentAttentionRequests ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Live Header & Sync Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-staff-border-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Operations
          </div>
          <span className="text-xs text-staff-text-muted" suppressHydrationWarning>
            Auto-refreshing every 5s{mounted ? ` · Last synced at ${lastRefreshedAt.toLocaleTimeString()}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => poll(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-raised text-staff-text-primary transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>↻</span>
            {isRefreshing ? "Syncing..." : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* Six Metric Tiles */}
      <section id="dashboard-metrics" aria-label="Live metrics">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricTile label="Orders Waiting" value={data.ordersWaiting} />
          <MetricTile label="In Kitchen" value={data.inKitchen} />
          <MetricTile label="Ready" value={data.ready} />
          <MetricTile
            label="Revenue Today"
            value={formatMoney(data.revenueToday, venueCurrency)}
            subtext={revSubtext}
          />
          <MetricTile label="Orders Today" value={data.ordersToday} />
          <MetricTile label="Requests Open" value={data.requestsOpen} />
        </div>
      </section>

      {/* Real-time Occupancy & Folio Status Strip */}
      <div className="p-4 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-staff-text-muted uppercase tracking-wider">
              Active Guest Sessions
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-staff-text-primary">
                {totalActiveSessions}
              </span>
              <span className="text-xs text-staff-text-secondary">
                ({occupiedRoomCount} Room Stay{occupiedRoomCount === 1 ? "" : "s"} · {occupiedTableCount} Table Dine-in)
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-staff-border-subtle hidden sm:block" />

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-staff-text-muted uppercase tracking-wider">
              Room Occupancy
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-staff-text-primary">
                {occupiedRoomCount} / {totalRoomCount}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {totalRoomCount > 0 ? ((occupiedRoomCount / totalRoomCount) * 100).toFixed(0) : 0}% Occupied
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-staff-border-subtle hidden sm:block" />

          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold text-staff-text-muted uppercase tracking-wider">
              Table Occupancy
            </span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-staff-text-primary">
                {occupiedTableCount} / {totalTableCount}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                {totalTableCount - occupiedTableCount} Available
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <Link
            href="/admin/orders/active"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors inline-flex items-center gap-1"
          >
            Active Sessions Hub →
          </Link>
          <Link
            href="/admin/orders/completed"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors inline-flex items-center gap-1"
          >
            Closed Folios Ledger →
          </Link>
        </div>
      </div>

      {/* Urgent Attention Requests Alert (Call Waiter / Request Bill) */}
      {attentionRequests.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h3 className="text-sm font-bold text-amber-900">
                Attention Signals Awaiting Staff ({attentionRequests.length})
              </h3>
            </div>
            <Link
              href="/admin/orders/active"
              className="text-xs font-semibold text-amber-900 hover:underline"
            >
              Manage in Active Hub →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1">
            {attentionRequests.map((req) => {
              const placeNumber = req.roomId
                ? `Room ${roomNumberById.get(req.roomId) ?? "—"}`
                : req.tableId
                ? `Table ${tableNumberById.get(req.tableId) ?? "—"}`
                : "Counter";
              const label = SERVICE_LABELS[req.serviceType] ?? req.serviceType;
              return (
                <div
                  key={req.id}
                  className="p-2.5 rounded-lg bg-white border border-amber-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-staff-text-primary shrink-0">{placeNumber}</span>
                    <span className="font-medium text-amber-800 truncate">{label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-staff-text-muted shrink-0" suppressHydrationWarning>
                    {formatElapsed(req.submittedAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders Quadrants: Table Orders & Room Orders */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-staff-text-primary">
              Active Table Orders ({data.recentTableOrders.length})
            </h2>
            <Link href="/admin/orders/active" className="text-xs text-staff-text-muted hover:text-staff-text-primary">
              View all →
            </Link>
          </div>
          <div
            id="dashboard-table-orders"
            className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-2"
          >
            {data.recentTableOrders.length === 0 ? (
              <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl bg-staff-surface">
                No active table orders.
              </p>
            ) : (
              data.recentTableOrders.map((order) => {
                const placeLabel = order.tableId ? tableNumberById.get(order.tableId) ?? "—" : "—";
                const itemsSummary = order.items.length
                  ? order.items.map((it) => `${it.quantity}× ${it.itemName}`).join(", ")
                  : "No items";
                return (
                  <article
                    key={order.id}
                    data-order-id={order.id}
                    data-order-state={order.state}
                    data-place-label={placeLabel}
                    className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">
                        <span className="text-[11px] font-semibold text-staff-text-muted uppercase">Table</span>
                        <span className="text-[20px] font-bold text-staff-text-primary">{placeLabel}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-staff-text-primary">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={orderBadge(order.state)}>{order.state}</span>
                          <span className="text-xs font-mono text-staff-text-muted" suppressHydrationWarning>
                            {formatElapsed(order.placedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">
                          {itemsSummary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <span className="text-sm text-staff-text-muted">—</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Room Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-staff-text-primary">
              Active Room Orders ({data.recentRoomOrders.length})
            </h2>
            <Link href="/admin/orders/active" className="text-xs text-staff-text-muted hover:text-staff-text-primary">
              View all →
            </Link>
          </div>
          <div
            id="dashboard-room-orders"
            className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-2"
          >
            {data.recentRoomOrders.length === 0 ? (
              <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl bg-staff-surface">
                No active room orders.
              </p>
            ) : (
              data.recentRoomOrders.map((order) => {
                const placeLabel = order.roomId ? roomNumberById.get(order.roomId) ?? "—" : "—";
                const itemsSummary = order.items.length
                  ? order.items.map((it) => `${it.quantity}× ${it.itemName}`).join(", ")
                  : "No items";
                return (
                  <article
                    key={order.id}
                    data-order-id={order.id}
                    data-order-state={order.state}
                    data-place-label={placeLabel}
                    className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">
                        <span className="text-[11px] font-semibold text-staff-text-muted uppercase">Room</span>
                        <span className="text-[20px] font-bold text-staff-text-primary">{placeLabel}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-staff-text-primary">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={orderBadge(order.state)}>{order.state}</span>
                          <span className="text-xs font-mono text-staff-text-muted" suppressHydrationWarning>
                            {formatElapsed(order.placedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">
                          {itemsSummary}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <span className="text-sm text-staff-text-muted">—</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Hotel Room Services Queue */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-staff-text-primary">
            Open Hotel Room Services ({data.recentRoomRequests.length})
          </h2>
          <Link href="/admin/services" className="text-xs text-staff-text-muted hover:text-staff-text-primary">
            Services Catalog →
          </Link>
        </div>
        <div
          id="dashboard-room-requests"
          className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-2"
        >
          {data.recentRoomRequests.length === 0 ? (
            <p className="text-sm text-staff-text-muted py-6 text-center border border-staff-border-subtle rounded-xl bg-staff-surface">
              No open room requests.
            </p>
          ) : (
            data.recentRoomRequests.map((request) => {
              const placeNumber = request.roomId ? roomNumberById.get(request.roomId) ?? "—" : "—";
              const label = SERVICE_LABELS[request.serviceType] ?? request.serviceType;
              const detailsText = formatDetailsSummary(request.details);
              return (
                <article
                  key={request.id}
                  data-request-id={request.id}
                  data-request-state={request.state}
                  data-place-number={placeNumber}
                  className="bg-staff-surface-raised border border-staff-border-subtle rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-staff-surface flex flex-col items-center justify-center border border-staff-border-subtle shrink-0">
                      <span className="text-[11px] font-semibold text-staff-text-muted uppercase">Room</span>
                      <span className="text-[20px] font-bold text-staff-text-primary">{placeNumber}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-staff-text-primary">
                          #{request.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-staff-text-secondary">{label}</span>
                        <span className={requestBadge(request.state)}>{request.state}</span>
                        <span className="text-xs font-mono text-staff-text-muted" suppressHydrationWarning>
                          {formatElapsed(request.submittedAt)}
                        </span>
                      </div>
                      {detailsText && (
                        <p className="text-sm text-staff-text-secondary mt-0.5 max-w-md line-clamp-2">
                          {detailsText}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                    <span className="text-sm font-medium text-staff-text-muted">
                      {request.state}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Live Venue Maps: Dual Mode with Tab Switcher */}
      <section className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-staff-text-primary">Live Venue Maps</h2>
            <span className="text-xs text-staff-text-muted">
              Real-time room occupancy and table availability
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-stone-100 border border-staff-border-subtle">
            <button
              type="button"
              onClick={() => setMapView("ALL")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mapView === "ALL"
                  ? "bg-[#344b3c] text-white shadow-xs font-semibold"
                  : "text-stone-700 hover:text-stone-900"
              }`}
              style={mapView === "ALL" ? { backgroundColor: "#344b3c", color: "#ffffff" } : undefined}
            >
              All Maps ({sortedRooms.length + sortedTables.length})
            </button>
            <button
              type="button"
              onClick={() => setMapView("ROOMS")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mapView === "ROOMS"
                  ? "bg-[#344b3c] text-white shadow-xs font-semibold"
                  : "text-stone-700 hover:text-stone-900"
              }`}
              style={mapView === "ROOMS" ? { backgroundColor: "#344b3c", color: "#ffffff" } : undefined}
            >
              Rooms ({sortedRooms.length}) {occupiedRoomCount > 0 && `· ${occupiedRoomCount} Occ`}
            </button>
            <button
              type="button"
              onClick={() => setMapView("TABLES")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                mapView === "TABLES"
                  ? "bg-[#344b3c] text-white shadow-xs font-semibold"
                  : "text-stone-700 hover:text-stone-900"
              }`}
              style={mapView === "TABLES" ? { backgroundColor: "#344b3c", color: "#ffffff" } : undefined}
            >
              Tables ({sortedTables.length})
            </button>
          </div>
        </div>

        {/* Room Map (Prioritized when showing Rooms or All) */}
        {(mapView === "ALL" || mapView === "ROOMS") && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-staff-text-secondary uppercase tracking-wider">
                Hotel Room Map ({sortedRooms.length} Rooms · {occupiedRoomCount} Occupied)
              </span>
              <Link href="/admin/rooms" className="text-xs text-staff-text-muted hover:text-staff-text-primary">
                Manage Rooms →
              </Link>
            </div>
            <div
              id="dashboard-room-map"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            >
              {sortedRooms.map((r) => {
                const isOcc = data.activeRoomIds.includes(r.id);
                const isDnd = isOcc && data.dndRoomIds.includes(r.id);
                return (
                  <article
                    key={r.id}
                    data-room-id={r.id}
                    data-room-number={r.number}
                    data-room-status={isOcc ? "OCCUPIED" : "FREE"}
                    data-room-dnd={isDnd ? "true" : "false"}
                    className="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3 shadow-2xs hover:border-staff-border-strong transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[28px] font-bold text-staff-text-primary">{r.number}</div>
                        <div className="text-[11px] uppercase text-staff-text-muted">Room</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {isDnd && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                            DND
                          </span>
                        )}
                        {isOcc ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Occupied
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Vacant
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-staff-border-subtle flex items-center justify-between text-xs text-staff-text-muted">
                      <span>{r.state}</span>
                      <Link href={`/admin/rooms`} className="hover:text-staff-brand text-[11px]">
                        Inspect →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Table Map */}
        {(mapView === "ALL" || mapView === "TABLES") && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-staff-text-secondary uppercase tracking-wider">
                Dining Table Map ({sortedTables.length} Tables · {occupiedTableCount} Occupied)
              </span>
              <Link href="/admin/tables" className="text-xs text-staff-text-muted hover:text-staff-text-primary">
                Manage Tables →
              </Link>
            </div>
            <div
              id="dashboard-table-map"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
            >
              {sortedTables.map((t) => {
                const isOcc = data.activeTableIds.includes(t.id);
                return (
                  <article
                    key={t.id}
                    data-table-id={t.id}
                    data-table-number={t.number}
                    data-table-status={isOcc ? "OCCUPIED" : "FREE"}
                    className="bg-staff-surface-raised rounded-xl p-4 border border-staff-border-subtle flex flex-col gap-3 shadow-2xs hover:border-staff-border-strong transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[28px] font-bold text-staff-text-primary">{t.number}</div>
                        <div className="text-[11px] uppercase text-staff-text-muted">Table</div>
                      </div>
                      <div>
                        {isOcc ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Occupied
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Free
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-staff-border-subtle flex items-center justify-between text-xs text-staff-text-muted">
                      <span>{t.state}</span>
                      <Link href={`/admin/tables`} className="hover:text-staff-brand text-[11px]">
                        Inspect →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
