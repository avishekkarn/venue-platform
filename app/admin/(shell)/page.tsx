import type { JSX } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { OrderState, PlaceType } from "@/domain/orders/order.repository";
import { HotelService } from "@/domain/requests/request.repository";
import { TableState } from "@/domain/organization/table.repository";
import { RoomState } from "@/domain/organization/room.repository";
import type { Order } from "@/domain/orders/order.repository";
import type { ServiceRequest } from "@/domain/requests/request.repository";
import { DashboardView, type DashboardData } from "./_dashboard-view";

export const dynamic = "force-dynamic";

/**
 * The admin dashboard (DESIGN.md §4.10.5) — the venue's live state.
 *
 * Provides real-time live operations overview with automatic polling:
 *   1. Metric Tiles: Orders Waiting, In Kitchen, Ready, Revenue Today (F&B + Services + Rooms), Orders Today, Requests Open.
 *   2. Active Occupancy Ribbon: Guest Sessions, Room Occupancy, Table Availability.
 *   3. Urgent Attention Alert: Call Waiter & Request Bill signals across tables and rooms.
 *   4. Active Orders Quadrants: Table Orders & Room Orders.
 *   5. Hotel Room Services: Housekeeping, Laundry, Concierge, Maintenance requests.
 *   6. Live Venue Maps: Filterable dual Room Map & Table Map with live state indicators.
 *
 * Automatically refreshes every 5 seconds via client polling with manual on-demand sync.
 */
export default async function AdminDashboardPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  // --- Data reads (repositories, not the route) ---
  const venueRepo = createPrismaVenueRepository(prisma);
  const orderRepo = createPrismaOrderRepository(prisma);
  const requestRepo = createPrismaServiceRequestRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const [
    venueResult,
    allOrdersResult,
    todayOrdersResult,
    openRequestsResult,
    tablesResult,
    roomsResult,
  ] = await Promise.all([
    venueRepo.findById(staff.venueId),
    orderRepo.listForVenue(staff.venueId),
    orderRepo.listForVenueOnDate(staff.venueId, new Date()),
    requestRepo.listOpenForVenue(staff.venueId),
    tableRepo.listForVenue(staff.venueId),
    roomRepo.listForVenue(staff.venueId),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "NPR" : "NPR";
  const allOrders = allOrdersResult.ok ? allOrdersResult.value : [];
  const todayOrders = todayOrdersResult.ok ? todayOrdersResult.value : [];
  const openRequests = openRequestsResult.ok ? openRequestsResult.value : [];
  const tables = tablesResult.ok ? tablesResult.value : [];
  const rooms = roomsResult.ok ? roomsResult.value : [];

  // Metrics counting
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

  const now = new Date();
  const localTodayStart = new Date();
  localTodayStart.setHours(0, 0, 0, 0);
  const utcTodayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const todayStart = localTodayStart < utcTodayStart ? localTodayStart : utcTodayStart;
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  const [completedServicesToday, rawRoomsWithCategory, roomSessionsToday, activeSessions] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: {
        venueId: staff.venueId,
        state: "COMPLETED",
        submittedAt: { gte: todayStart, lte: todayEnd },
      },
      include: { serviceItem: true },
    }),
    prisma.room.findMany({
      where: { venueId: staff.venueId },
      include: { category: true },
    }),
    prisma.guestSession.findMany({
      where: {
        venueId: staff.venueId,
        placeType: "ROOM",
        roomId: { not: null },
        OR: [
          { endedAt: null },
          { endedAt: { gte: todayStart } },
        ],
      },
      select: { roomId: true },
    }),
    prisma.guestSession.findMany({
      where: { venueId: staff.venueId, endedAt: null },
      select: { id: true, placeType: true, tableId: true, roomId: true },
    }),
  ]);

  let ordersRevenue = 0;
  for (const order of todayOrders) {
    if (order.state === OrderState.COMPLETED) {
      ordersRevenue += Number(order.total);
    }
  }

  let servicesRevenue = 0;
  for (const srv of completedServicesToday) {
    if (srv.serviceItem && Number(srv.serviceItem.price) > 0) {
      servicesRevenue += Number(srv.serviceItem.price);
    }
  }

  const roomBasePriceByRoomId = new Map<string, number>();
  for (const r of rawRoomsWithCategory) {
    if (r.category?.basePrice) {
      roomBasePriceByRoomId.set(r.id, Number(r.category.basePrice));
    }
  }

  let roomsRevenue = 0;
  for (const sess of roomSessionsToday) {
    if (sess.roomId) {
      roomsRevenue += roomBasePriceByRoomId.get(sess.roomId) ?? 0;
    }
  }

  const revenueToday = ordersRevenue + servicesRevenue + roomsRevenue;
  const revenueTodayString = revenueToday.toFixed(2);
  const ordersRevenueString = ordersRevenue.toFixed(2);
  const servicesRevenueString = servicesRevenue.toFixed(2);
  const roomsRevenueString = roomsRevenue.toFixed(2);

  // Active orders filtering
  const ACTIVE_STATES: readonly OrderState[] = [
    OrderState.PLACED,
    OrderState.APPROVED,
    OrderState.PREPARING,
    OrderState.READY,
  ];
  const activeOrders = allOrders.filter((o) => ACTIVE_STATES.includes(o.state));

  const recentTableOrders: Order[] = activeOrders
    .filter((o) => o.placeType === PlaceType.TABLE)
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .slice(0, 5);

  const recentRoomOrders: Order[] = activeOrders
    .filter((o) => o.placeType === PlaceType.ROOM)
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .slice(0, 5);

  // Occupancy sets
  const activeTableIds = new Set<string>();
  const activeRoomIds = new Set<string>();
  for (const t of tables) {
    if (t.state === TableState.OCCUPIED) activeTableIds.add(t.id);
  }
  for (const r of rooms) {
    if (r.state === RoomState.OCCUPIED) activeRoomIds.add(r.id);
  }

  const activeSessionIds = new Set(activeSessions.map((s) => s.id));

  // Active open requests must belong to an active guest session if session-bound
  const activeOpenRequests = openRequests.filter((r) => {
    if (r.guestSessionId && !activeSessionIds.has(r.guestSessionId)) return false;
    return true;
  });

  // Attention requests (Call Waiter / Request Bill)
  const ATTENTION_TYPES: readonly HotelService[] = [
    HotelService.CALL_WAITER,
    HotelService.REQUEST_BILL,
  ];
  const recentAttentionRequests = activeOpenRequests
    .filter((r) => ATTENTION_TYPES.includes(r.serviceType))
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
    .slice(0, 5);

  // Room requests (excluding attention signals)
  const recentRoomRequests = activeOpenRequests
    .filter(
      (r) =>
        r.placeType === PlaceType.ROOM &&
        !ATTENTION_TYPES.includes(r.serviceType)
    )
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
    .slice(0, 5);

  const recentTableRequests = activeOpenRequests
    .filter((r) => r.placeType === PlaceType.TABLE)
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
    .slice(0, 5);

  const dndRoomIds = new Set<string>();
  for (const r of activeOpenRequests) {
    if (r.serviceType === HotelService.DO_NOT_DISTURB && r.roomId && activeRoomIds.has(r.roomId)) {
      if ((r.details as Record<string, unknown>)?.["state"] !== "Off") {
        dndRoomIds.add(r.roomId);
      }
    }
  }

  const activeSessionsCount = activeSessions.length;
  const activeTableSessionsCount = activeSessions.filter((s) => s.placeType === "TABLE").length;
  const activeRoomSessionsCount = activeSessions.filter((s) => s.placeType === "ROOM").length;

  const serializeOrder = (o: Order) => ({
    id: o.id,
    state: o.state,
    placeType: o.placeType,
    tableId: o.tableId,
    roomId: o.roomId,
    pickupName: o.pickupName,
    placedAt: o.placedAt.toISOString(),
    items: o.items.map((it) => ({
      itemName: it.itemName,
      quantity: it.quantity,
    })),
  });

  const serializeRequest = (r: ServiceRequest) => ({
    id: r.id,
    state: r.state,
    serviceType: r.serviceType,
    placeType: r.placeType ?? null,
    roomId: r.roomId,
    tableId: r.tableId ?? null,
    submittedAt: r.submittedAt.toISOString(),
    details: r.details,
  });

  const initialData: DashboardData = {
    ordersWaiting,
    inKitchen,
    ready,
    revenueToday: revenueTodayString,
    ordersRevenue: ordersRevenueString,
    servicesRevenue: servicesRevenueString,
    roomsRevenue: roomsRevenueString,
    ordersToday: todayOrders.length,
    requestsOpen: activeOpenRequests.length,
    activeSessionsCount,
    activeTableSessionsCount,
    activeRoomSessionsCount,
    recentTableOrders: recentTableOrders.map(serializeOrder),
    recentRoomOrders: recentRoomOrders.map(serializeOrder),
    recentRoomRequests: recentRoomRequests.map(serializeRequest),
    recentAttentionRequests: recentAttentionRequests.map(serializeRequest),
    recentTableRequests: recentTableRequests.map(serializeRequest),
    tables: tables.map((t) => ({ id: t.id, number: t.number, state: t.state })),
    rooms: rooms.map((r) => ({ id: r.id, number: r.number, state: r.state })),
    activeTableIds: [...activeTableIds],
    activeRoomIds: [...activeRoomIds],
    dndRoomIds: [...dndRoomIds],
  };

  return <DashboardView initialData={initialData} venueCurrency={currency} />;
}
