/**
 * GET /api/admin/orders — the venue's orders, filterable.
 *
 * Phase 8.2.1. The route is:
 *   - admin-only (MANAGER or OWNER; LEADER and every focused role -> 403),
 *   - audited (withAudit),
 *   - read-only (GET; no CSRF — D-20.1).
 *
 * Query params (all optional):
 *   - state:    one of PLACED, APPROVED, PREPARING, READY, DELIVERED,
 *               COMPLETED, CANCELLED. A malformed value returns 400
 *               VALIDATION_FAILED.
 *   - dateFrom: an ISO date (YYYY-MM-DD). Start of that UTC day.
 *   - dateTo:   an ISO date (YYYY-MM-DD). End of that UTC day.
 *
 * Response: { data: Order[] } with money as decimal strings and
 * placedAt/updatedAt as ISO strings (Date -> ISO on JSON serialization).
 *
 * Reference: ROADMAP.md §12 (Task 8.2.1), WIRING.md W-0021, SYSTEM.md §12.5,
 * SYSTEM.md §15.4, D-10.2, D-20.1.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import {
  OrderState,
  type Order,
  type OrderFilter,
} from "@/domain/orders/order.repository";
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

const ORDER_STATES = new Set<string>([
  OrderState.PLACED,
  OrderState.APPROVED,
  OrderState.PREPARING,
  OrderState.READY,
  OrderState.DELIVERED,
  OrderState.COMPLETED,
  OrderState.CANCELLED,
]);

function parseDateBoundary(value: string | null, endOfDay: boolean): Date | null {
  if (!value) return null;
  // Expect YYYY-MM-DD. Reject anything else with null so the route can 400.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const routeHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;

  // 1. Session
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

  // 2. Venue
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Staff + role
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

  // 4. Parse the filters
  const { searchParams } = new URL(request.url);
  const stateParam = searchParams.get("state");
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  let state: OrderState | undefined;
  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (stateParam !== null) {
    if (!ORDER_STATES.has(stateParam)) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid state" } },
        { status: 400 }
      );
    }
    state = stateParam as OrderState;
  }

  if (dateFromParam !== null) {
    const parsed = parseDateBoundary(dateFromParam, false);
    if (!parsed) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid dateFrom" } },
        { status: 400 }
      );
    }
    dateFrom = parsed;
  }

  if (dateToParam !== null) {
    const parsed = parseDateBoundary(dateToParam, true);
    if (!parsed) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid dateTo" } },
        { status: 400 }
      );
    }
    dateTo = parsed;
  }

  const filter: OrderFilter = {
    ...(state !== undefined ? { state } : {}),
    ...(dateFrom !== undefined ? { dateFrom } : {}),
    ...(dateTo !== undefined ? { dateTo } : {}),
  };

  // 5. Read
  const orderRepo = createPrismaOrderRepository(db);
  const result = await orderRepo.listForVenue(venue.id, filter);
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Failed to read orders" } },
      { status: 500 }
    );
  }

  // 6. Serialize (Date -> ISO; enums -> strings; money stays strings)
  const serialize = (o: Order) => ({
    id: o.id,
    state: o.state,
    placeType: o.placeType,
    tableId: o.tableId,
    roomId: o.roomId,
    counterId: o.counterId,
    pickupName: o.pickupName,
    subtotal: o.subtotal,
    taxRate: o.taxRate,
    taxAmount: o.taxAmount,
    total: o.total,
    notes: o.notes,
    placedAt: o.placedAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  });

  return NextResponse.json(
    { data: result.value.map(serialize) },
    { status: 200 }
  );
};

const meta: AuditMeta = {
  route: "/api/admin/orders",
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
    const staffResult = await staffRepo.findById(venueResult.value.id, session.staffMemberId);
    if (!staffResult.ok) return null;
    const staff = staffResult.value;
    if (staff.state === StaffState.DEACTIVATED) return null;
    return {
      actorId: staff.id,
      actorRole: staff.roles[0] ?? "UNKNOWN",
      venueId: venueResult.value.id,
    };
  },
  resolveGuest: async () => null,
};

export const GET = withAudit(resolvers, meta, routeHandler);
