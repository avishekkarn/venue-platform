/**
 * GET /api/admin/dashboard — the venue's six live dashboard metrics.
 *
 * Phase 8.1.1. The route is:
 *   - admin-only (MANAGER or OWNER; LEADER and every focused role -> 403),
 *   - audited (withAudit — every dashboard read is a line in the audit trail),
 *   - read-only (GET; no CSRF wrapper — D-20.1).
 *
 * Response (the six metrics, in the field order DESIGN.md §4.10.5 and
 * PHASE_TESTS.md §10 Step 2 name):
 *   { data: { ordersWaiting, inKitchen, ready, revenueToday, ordersToday, requestsOpen } }
 *
 * Metric sources:
 *   - ordersWaiting:  count of PLACED orders for the venue
 *   - inKitchen:      count of APPROVED + PREPARING + READY orders for the venue
 *   - ready:          count of READY orders for the venue
 *   - revenueToday:   sum of `total` on COMPLETED orders whose placedAt is today (UTC)
 *   - ordersToday:    count of orders whose placedAt is today (UTC), any state
 *   - requestsOpen:   count of SUBMITTED + ACKNOWLEDGED + IN_PROGRESS requests
 *
 * Money on the wire: revenueToday is a decimal string ("0.00" when no orders
 * have completed today), per BUILD.md §7.1. The four counts are numbers.
 *
 * Reference: ROADMAP.md §12 (Task 8.1.1), WIRING.md W-0021 + W-0027,
 * SYSTEM.md §12.5 (the dashboard row), SYSTEM.md §15.4, D-10.2, D-20.1.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
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
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const routeHandler: AuditedRouteHandler = async (_request: NextRequest) => {
  const db = testDbClient ?? prisma;

  // 1. Session check
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  const session = await validateSession(db, sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 2. Resolve venue
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Staff check and role check
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 4. Read the six metrics
  const orderRepo = createPrismaOrderRepository(db);
  const requestRepo = createPrismaServiceRequestRepository(db);

  const allOrdersResult = await orderRepo.listForVenue(venue.id);
  if (!allOrdersResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read orders" } },
      { status: 500 }
    );
  }

  const todayOrdersResult = await orderRepo.listForVenueOnDate(venue.id, new Date());
  if (!todayOrdersResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read today's orders" } },
      { status: 500 }
    );
  }

  const openRequestsResult = await requestRepo.listOpenForVenue(venue.id);
  if (!openRequestsResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read open requests" } },
      { status: 500 }
    );
  }

  const allOrders = allOrdersResult.value;
  const todayOrders = todayOrdersResult.value;
  const openRequests = openRequestsResult.value;

  // --- 8.1.4: the six sections' data (mirrors the page's server-side
  //     render at app/admin/(shell)/page.tsx so the poll's innerHTML
  //     replacement is visually identical). ---
  const tablesRepo = createPrismaTableRepository(db);
  const roomsRepo = createPrismaRoomRepository(db);
  const tablesResult = await tablesRepo.listForVenue(venue.id);
  const roomsResult = await roomsRepo.listForVenue(venue.id);
  if (!tablesResult.ok || !roomsResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read tables or rooms" } },
      { status: 500 }
    );
  }
  const tables = tablesResult.value;
  const rooms = roomsResult.value;

  const tableNumberById = new Map<string, string>();
  for (const t of tables) tableNumberById.set(t.id, t.number);
  const roomNumberById = new Map<string, string>();
  for (const r of rooms) roomNumberById.set(r.id, r.number);

  const ACTIVE_STATES: readonly OrderState[] = [
    OrderState.PLACED,
    OrderState.APPROVED,
    OrderState.PREPARING,
    OrderState.READY,
  ];
  const activeOrders = allOrders.filter((o) => ACTIVE_STATES.includes(o.state));

  const recentTableOrders = activeOrders
    .filter((o) => o.placeType === PlaceType.TABLE)
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .slice(0, 5);

  const recentRoomOrders = activeOrders
    .filter((o) => o.placeType === PlaceType.ROOM)
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime())
    .slice(0, 5);

  const EXCLUDED_REQUEST_TYPES: readonly HotelService[] = [
    HotelService.CALL_WAITER,
    HotelService.REQUEST_BILL,
  ];
  const recentRoomRequests = openRequests
    .filter(
      (r) =>
        r.placeType === PlaceType.ROOM &&
        !EXCLUDED_REQUEST_TYPES.includes(r.serviceType)
    )
    .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime())
    .slice(0, 5);

  const activeTableIds = new Set<string>();
  const activeRoomIds = new Set<string>();
  for (const t of tables) {
    if (t.state === TableState.OCCUPIED) activeTableIds.add(t.id);
  }
  for (const r of rooms) {
    if (r.state === RoomState.OCCUPIED) activeRoomIds.add(r.id);
  }

  let ordersWaiting = 0;
  let inKitchen = 0;
  let ready = 0;
  for (const order of allOrders) {
    if (order.state === "PLACED") ordersWaiting += 1;
    if (order.state === "APPROVED" || order.state === "PREPARING" || order.state === "READY") inKitchen += 1;
    if (order.state === "READY") ready += 1;
  }

  let revenueToday = 0;
  for (const order of todayOrders) {
    if (order.state === "COMPLETED") {
      revenueToday += Number(order.total);
    }
  }
  const revenueTodayString = revenueToday.toFixed(2);

  // Serialize each order/request to plain JSON. Dates → ISO strings;
  // enums → their string values (already strings); money → strings.
  // The poll's string builders read this shape.
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

  return NextResponse.json(
    {
      data: {
        // Existing six (unchanged)
        ordersWaiting,
        inKitchen,
        ready,
        revenueToday: revenueTodayString,
        ordersToday: todayOrders.length,
        requestsOpen: openRequests.length,
        // 8.1.4 — the six sections' data
        recentTableOrders: recentTableOrders.map(serializeOrder),
        recentRoomOrders: recentRoomOrders.map(serializeOrder),
        recentRoomRequests: recentRoomRequests.map(serializeRequest),
        tables: tables.map((t) => ({ id: t.id, number: t.number, state: t.state })),
        rooms: rooms.map((r) => ({ id: r.id, number: r.number, state: r.state })),
        activeTableIds: [...activeTableIds],
        activeRoomIds: [...activeRoomIds],
      },
    },
    { status: 200 }
  );
};

const meta: AuditMeta = {
  route: "/api/admin/dashboard",
  method: "GET",
};

const resolvers: ActorResolvers = {
  resolveStaff: async () => {
    const db = testDbClient ?? prisma;
    const token = await getSessionCookie();
    if (!token) return null;
    const session = await validateSession(db, token);
    if (!session) return null;
    const venueRepo = createPrismaVenueRepository(db);
    const venueResult = await venueRepo.findBySlug(getVenueSlug());
    if (!venueResult.ok) return null;
    const staffRepo = createPrismaStaffRepository(db);
    const staffResult = await staffRepo.findById(
      venueResult.value.id,
      session.staffMemberId
    );
    if (!staffResult.ok) return null;
    const staff = staffResult.value;
    if (staff.state === StaffState.DEACTIVATED) return null;
    return {
      actorId: staff.id,
      actorRole: staff.roles[0] ?? "UNKNOWN",
      venueId: venueResult.value.id,
    };
  },
  resolveGuest: async () => {
    return null;
  },
};

export const GET = withAudit(resolvers, meta, routeHandler);
