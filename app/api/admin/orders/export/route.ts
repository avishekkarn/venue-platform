/**
 * GET /api/admin/orders/export — download the venue's terminal orders
 * (COMPLETED + CANCELLED) in the given date range as a CSV.
 *
 * Phase 8.2.4. The route is:
 *   - admin-only (MANAGER or OWNER; LEADER and every focused role -> 403),
 *   - audited (withAudit),
 *   - read-only (GET; no CSRF — D-20.1),
 *   - a file download (Content-Disposition: attachment).
 *
 * Query params (all optional):
 *   - from: an ISO date (YYYY-MM-DD). Start of that UTC day.
 *   - to:   an ISO date (YYYY-MM-DD). End of that UTC day.
 *   Both absent = all terminal orders (no date filter).
 *
 * Response: text/csv with a header row and one row per terminal order.
 * Money cells are quoted strings ("10.99") to preserve the decimal
 * precision (BUILD.md §7.1). The CSV respects the same date range the
 * completed-orders page shows.
 *
 * Reference: ROADMAP.md §12 (Task 8.2.4), WIRING.md W-0021, SYSTEM.md
 * §12.5, §15.4, D-10.2, D-20.1, DESIGN.md §4.10.7.
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

const TERMINAL_STATES: readonly OrderState[] = [
  OrderState.COMPLETED,
  OrderState.CANCELLED,
];

function parseDateBoundary(value: string | null, endOfDay: boolean): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(endOfDay ? `${value}T23:59:59.999Z` : `${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

/**
 * Escape a CSV cell: wrap in double quotes and double any internal quote.
 * The values are order fields (itemName, notes) and money strings. The
 * cell is quoted so a spreadsheet treats the money as a string, not a
 * number (BUILD.md §7.1).
 */
function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsvRow(cells: readonly string[]): string {
  return cells.map(csvCell).join(",");
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

  // 4. Parse the date range
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  let dateFrom: Date | undefined;
  let dateTo: Date | undefined;

  if (fromParam !== null) {
    const parsed = parseDateBoundary(fromParam, false);
    if (!parsed) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid from" } },
        { status: 400 }
      );
    }
    dateFrom = parsed;
  }

  if (toParam !== null) {
    const parsed = parseDateBoundary(toParam, true);
    if (!parsed) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid to" } },
        { status: 400 }
      );
    }
    dateTo = parsed;
  }

  const filter: OrderFilter = {
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

  // 6. Filter to terminal states (COMPLETED + CANCELLED) — the same set
  //    the completed-orders page shows. The list is sorted newest first.
  const terminalOrders = result.value
    .filter((o) => TERMINAL_STATES.includes(o.state))
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());

  // 7. Build the CSV. The header row, then one row per order.
  const header = toCsvRow([
    "Order ID",
    "Place",
    "Place Type",
    "Status",
    "Placed At (UTC)",
    "Subtotal",
    "Tax",
    "Total",
    "Notes",
  ]);

  const lines: string[] = [header];
  for (const o of terminalOrders) {
    const place =
      o.placeType === "TABLE"
        ? o.tableId ?? "—"
        : o.placeType === "ROOM"
          ? o.roomId ?? "—"
          : o.pickupName ?? "Counter";
    lines.push(
      toCsvRow([
        o.id,
        place,
        o.placeType,
        o.state,
        o.placedAt.toISOString(),
        o.subtotal,
        o.taxAmount,
        o.total,
        o.notes ?? "",
      ])
    );
  }
  const csv = lines.join("\n") + "\n";

  // 8. Response — a file download, not a JSON envelope.
  const stamp = new Date().toISOString().slice(0, 10);
  const rangeLabel = `${fromParam ?? "all"}-${toParam ?? "all"}`;
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${rangeLabel}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
};

const meta: AuditMeta = {
  route: "/api/admin/orders/export",
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
