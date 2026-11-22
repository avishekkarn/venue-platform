/**
 * GET /api/admin/reports/[view] — The venue's operational reports.
 *
 * Supports all 17 report views:
 *   - revenue, sales, funnel, requests, utilization, qr, payment, audit,
 *     heatmap, matrix, modifiers, tax, cancellations, sla, folio, occupancy, conversion.
 *
 * Security & Governance:
 *   - Admin-only (MANAGER or OWNER; D-3.1, canAccess).
 *   - Audited with withAuditedDynamicRoute (D-3.7, D-24.1).
 *   - Strict venue scoping from session (D-10.2).
 *   - Date range validation (dateTo - dateFrom <= 180 days per D-12.1).
 *   - Zero guest PII (D-2.1).
 *   - No aggregate staff surveillance (D-12.4).
 *   - Money values formatted as decimal strings (BUILD.md §7.1).
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { canAccess } from "@/domain/auth/can-access";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import {
  withAuditedDynamicRoute,
  type AuditedDynamicRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";
import {
  validateReportDateRange,
  generateRevenueSummary,
  generateItemSales,
  generateOrderFunnel,
  generateServiceRequestsReport,
  generatePlaceUtilization,
  generateQrLifecycleReport,
  generateAuditExport,
  generateHourlyHeatmap,
  generateMenuMatrix,
  generateModifierAttachReport,
  generateTaxRemittance,
  generateCancellationRootCause,
  generateServiceSla,
  generateRoomFolioReport,
  generateOccupancyDwell,
  generateQrConversionReport,
  PAYMENT_RECONCILIATION_V1_STATUS,
} from "@/domain/reports";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const SUPPORTED_VIEWS = new Set<string>([
  "revenue",
  "sales",
  "funnel",
  "requests",
  "utilization",
  "qr",
  "payment",
  "audit",
  "heatmap",
  "matrix",
  "modifiers",
  "tax",
  "cancellations",
  "sla",
  "folio",
  "occupancy",
  "conversion",
]);

type RouteParams = { view: string };

const dynamicHandler: AuditedDynamicRouteHandler<RouteParams> = async (
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) => {
  const db = testDbClient ?? prisma;
  const { view } = await context.params;

  if (!SUPPORTED_VIEWS.has(view)) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: `Unknown report view: '${view}'`,
        },
      },
      { status: 400 }
    );
  }

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

  // 2. Venue check
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Staff & role check (admin: MANAGER or OWNER)
  // Cross-venue isolation: findById with venue.id returns NOT_FOUND if staff is from another venue (D-10.2).
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
    if (staffResult.error.code === DomainErrorCode.NOT_FOUND) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.NOT_FOUND, message: "Staff not found in venue" } },
        { status: 404 }
      );
    }
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
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Admin role required" } },
      { status: 403 }
    );
  }

  // Special case: Payment Reconciliation is an empty-state descriptor in v1 per D-7.1 and D-7.7
  if (view === "payment") {
    return NextResponse.json({
      ok: true,
      data: {
        view: "payment",
        status: PAYMENT_RECONCILIATION_V1_STATUS.status,
        commentary: PAYMENT_RECONCILIATION_V1_STATUS.commentary,
        rows: [],
      },
    });
  }

  // 4. Validate date range params
  const { searchParams } = new URL(request.url);
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  const rangeResult = validateReportDateRange(dateFromParam, dateToParam);
  if (!rangeResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: rangeResult.error.message,
        },
      },
      { status: 400 }
    );
  }
  const { fromDate, toDate, dateFrom, dateTo } = rangeResult.value;

  // 5. Query DB within venue scope and run pure domain calculator
  switch (view) {
    case "revenue": {
      const orders = await db.order.findMany({
        where: {
          venueId: venue.id,
          state: "COMPLETED",
          placedAt: { gte: fromDate, lte: toDate },
        },
        select: {
          placedAt: true,
          placeType: true,
          subtotal: true,
          taxAmount: true,
          total: true,
        },
      });

      const rowsResult = generateRevenueSummary(
        orders.map((o) => ({
          placedAt: o.placedAt,
          placeType: o.placeType,
          subtotal: o.subtotal.toFixed(2),
          taxAmount: o.taxAmount.toFixed(2),
          total: o.total.toFixed(2),
        })),
        venue.currency
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "sales": {
      const items = await db.orderItem.findMany({
        where: {
          order: {
            venueId: venue.id,
            state: "COMPLETED",
            placedAt: { gte: fromDate, lte: toDate },
          },
        },
        select: {
          itemName: true,
          categoryName: true,
          quantity: true,
          itemPrice: true,
          modifierPrice: true,
          lineTotal: true,
          modifiersJson: true,
        },
      });

      const rowsResult = generateItemSales(
        items.map((i) => ({
          itemName: i.itemName,
          categoryName: i.categoryName,
          quantity: i.quantity,
          itemPrice: i.itemPrice.toFixed(2),
          modifierPrice: i.modifierPrice.toFixed(2),
          lineTotal: i.lineTotal.toFixed(2),
          modifiersJson: i.modifiersJson,
        }))
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "funnel": {
      const orders = await db.order.findMany({
        where: {
          venueId: venue.id,
          placedAt: { gte: fromDate, lte: toDate },
        },
        include: {
          stateChanges: {
            orderBy: { occurredAt: "asc" },
          },
        },
      });

      const rowsResult = generateOrderFunnel(
        orders.map((o) => ({
          id: o.id,
          placedAt: o.placedAt,
          state: o.state,
          stateChanges: o.stateChanges.map((sc) => ({
            state: sc.state,
            occurredAt: sc.occurredAt,
          })),
        }))
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "requests": {
      const requests = await db.serviceRequest.findMany({
        where: {
          venueId: venue.id,
          submittedAt: { gte: fromDate, lte: toDate },
        },
        include: {
          stateChanges: {
            orderBy: { occurredAt: "asc" },
          },
        },
      });

      const rowsResult = generateServiceRequestsReport(
        requests.map((r) => ({
          id: r.id,
          serviceType: r.serviceType,
          state: r.state,
          submittedAt: r.submittedAt,
          stateChanges: r.stateChanges.map((sc) => ({
            state: sc.state,
            occurredAt: sc.occurredAt,
          })),
        }))
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "utilization": {
      const [tables, rooms, sessions] = await Promise.all([
        db.table.findMany({
          where: { venueId: venue.id },
          include: { category: true },
        }),
        db.room.findMany({
          where: { venueId: venue.id },
          include: { category: true },
        }),
        db.guestSession.findMany({
          where: {
            venueId: venue.id,
            createdAt: { gte: fromDate, lte: toDate },
          },
          include: {
            orders: {
              where: { state: "COMPLETED" },
              select: { total: true },
            },
          },
        }),
      ]);

      const placesInput = [
        ...tables.map((t) => {
          const tableSessions = sessions.filter((s) => s.tableId === t.id);
          const totals = tableSessions.flatMap((s) => s.orders.map((o) => o.total.toFixed(2)));
          return {
            placeType: "TABLE",
            placeNumber: t.number,
            category: t.category?.name ?? null,
            sessions: tableSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              hasOrders: s.orders.length > 0,
            })),
            orderTotals: totals,
          };
        }),
        ...rooms.map((r) => {
          const roomSessions = sessions.filter((s) => s.roomId === r.id);
          const totals = roomSessions.flatMap((s) => s.orders.map((o) => o.total.toFixed(2)));
          return {
            placeType: "ROOM",
            placeNumber: r.number,
            category: r.category?.name ?? null,
            sessions: roomSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              hasOrders: s.orders.length > 0,
            })),
            orderTotals: totals,
          };
        }),
      ];

      const rowsResult = generatePlaceUtilization(placesInput);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "qr": {
      const tokens = await db.qrToken.findMany({
        where: { venueId: venue.id },
        include: {
          table: true,
          room: true,
          counter: true,
          guestSessions: {
            where: { createdAt: { gte: fromDate, lte: toDate } },
            select: { id: true },
          },
        },
      });

      const rowsResult = generateQrLifecycleReport(
        tokens.map((t) => {
          let label = "Unassigned";
          if (t.table) label = t.table.number;
          else if (t.room) label = t.room.number;
          else if (t.counter) label = t.counter.name;

          return {
            tokenId: t.id,
            placeType: t.placeType,
            placeLabel: label,
            isRevoked: t.state === "REVOKED",
            createdAt: t.createdAt,
            revokedAt: t.revokedAt,
            sessionsCount: t.guestSessions.length,
          };
        })
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "audit": {
      const [orderChanges, requestChanges] = await Promise.all([
        db.orderStateChange.findMany({
          where: {
            order: { venueId: venue.id },
            occurredAt: { gte: fromDate, lte: toDate },
          },
          include: { staffMember: true },
        }),
        db.requestStateChange.findMany({
          where: {
            request: { venueId: venue.id },
            occurredAt: { gte: fromDate, lte: toDate },
          },
          include: { staffMember: true },
        }),
      ]);

      const events = [
        ...orderChanges.map((oc) => ({
          timestamp: oc.occurredAt,
          recordType: "ORDER" as const,
          entityId: oc.orderId,
          targetState: oc.state,
          staffName: oc.staffMember?.name ?? null,
          staffUsername: oc.staffMember?.username ?? null,
          note: oc.note,
        })),
        ...requestChanges.map((rc) => ({
          timestamp: rc.occurredAt,
          recordType: "SERVICE_REQUEST" as const,
          entityId: rc.requestId,
          targetState: rc.state,
          staffName: rc.staffMember?.name ?? null,
          staffUsername: rc.staffMember?.username ?? null,
          note: rc.note,
        })),
      ];

      const rowsResult = generateAuditExport(events);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "heatmap": {
      const orders = await db.order.findMany({
        where: {
          venueId: venue.id,
          state: "COMPLETED",
          placedAt: { gte: fromDate, lte: toDate },
        },
        select: {
          placedAt: true,
          total: true,
        },
      });

      const rowsResult = generateHourlyHeatmap(
        orders.map((o) => ({
          placedAt: o.placedAt,
          total: o.total.toFixed(2),
        })),
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "matrix": {
      const items = await db.orderItem.findMany({
        where: {
          order: {
            venueId: venue.id,
            state: "COMPLETED",
            placedAt: { gte: fromDate, lte: toDate },
          },
        },
        select: {
          itemName: true,
          categoryName: true,
          quantity: true,
          itemPrice: true,
          modifierPrice: true,
          lineTotal: true,
        },
      });

      const salesResult = generateItemSales(
        items.map((i) => ({
          itemName: i.itemName,
          categoryName: i.categoryName,
          quantity: i.quantity,
          itemPrice: i.itemPrice.toFixed(2),
          modifierPrice: i.modifierPrice.toFixed(2),
          lineTotal: i.lineTotal.toFixed(2),
        }))
      );

      if (!salesResult.ok) {
        return NextResponse.json({ error: salesResult.error }, { status: 400 });
      }

      const matrixResult = generateMenuMatrix(
        salesResult.value.map((s) => ({
          itemName: s.itemName,
          unitsSold: s.unitsSold,
          lineRevenue: s.lineRevenue,
        }))
      );

      if (!matrixResult.ok) {
        return NextResponse.json({ error: matrixResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: matrixResult.value },
      });
    }

    case "modifiers": {
      const items = await db.orderItem.findMany({
        where: {
          order: {
            venueId: venue.id,
            state: "COMPLETED",
            placedAt: { gte: fromDate, lte: toDate },
          },
        },
        select: {
          quantity: true,
          modifiersJson: true,
        },
      });

      const totalParentUnits = items.reduce((sum, it) => sum + it.quantity, 0);
      const rowsResult = generateModifierAttachReport(
        items.map((i) => ({
          quantity: i.quantity,
          modifiersJson: i.modifiersJson,
        })),
        totalParentUnits
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "tax": {
      const orders = await db.order.findMany({
        where: {
          venueId: venue.id,
          state: "COMPLETED",
          placedAt: { gte: fromDate, lte: toDate },
        },
        select: {
          placedAt: true,
          taxRate: true,
          subtotal: true,
          taxAmount: true,
        },
      });

      const rowsResult = generateTaxRemittance(
        orders.map((o) => ({
          placedAt: o.placedAt,
          taxRate: o.taxRate.toFixed(4),
          subtotal: o.subtotal.toFixed(2),
          taxAmount: o.taxAmount.toFixed(2),
        }))
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "cancellations": {
      const events = await db.orderStateChange.findMany({
        where: {
          order: { venueId: venue.id },
          state: "CANCELLED",
          occurredAt: { gte: fromDate, lte: toDate },
        },
        select: {
          occurredAt: true,
          note: true,
        },
      });

      const rowsResult = generateCancellationRootCause(events);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "sla": {
      const requests = await db.serviceRequest.findMany({
        where: {
          venueId: venue.id,
          submittedAt: { gte: fromDate, lte: toDate },
        },
        include: {
          stateChanges: {
            where: { state: { in: ["COMPLETED", "DECLINED"] } },
            orderBy: { occurredAt: "asc" },
            take: 1,
          },
        },
      });

      const rowsResult = generateServiceSla(
        requests.map((r) => ({
          serviceType: r.serviceType,
          state: r.state,
          submittedAt: r.submittedAt,
          resolvedAt: r.stateChanges[0]?.occurredAt ?? null,
        }))
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "folio": {
      const sessions = await db.guestSession.findMany({
        where: {
          venueId: venue.id,
          placeType: "ROOM",
          createdAt: { gte: fromDate, lte: toDate },
        },
        include: {
          qrToken: {
            include: {
              room: true,
            },
          },
          orders: {
            where: { state: "COMPLETED" },
            select: { total: true },
          },
          serviceRequests: {
            select: { id: true },
          },
        },
      });

      const rowsResult = generateRoomFolioReport(
        sessions.map((s) => ({
          roomNumber: s.qrToken?.room?.number ?? "Unassigned",
          stayStart: s.createdAt,
          stayEnd: s.endedAt,
          orderTotals: s.orders.map((o) => o.total.toFixed(2)),
          serviceRequestsCount: s.serviceRequests.length,
        }))
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "occupancy": {
      const sessions = await db.guestSession.findMany({
        where: {
          venueId: venue.id,
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: {
          placeType: true,
          createdAt: true,
          endedAt: true,
        },
      });

      const rowsResult = generateOccupancyDwell(sessions);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    case "conversion": {
      const tokens = await db.qrToken.findMany({
        where: { venueId: venue.id },
        include: {
          guestSessions: {
            where: { createdAt: { gte: fromDate, lte: toDate } },
            include: {
              orders: {
                where: { state: "COMPLETED" },
                select: { total: true },
              },
            },
          },
        },
      });

      const rowsResult = generateQrConversionReport(
        tokens.map((t) => {
          const sessions = t.guestSessions;
          const convertedSessions = sessions.filter((s) => s.orders.length > 0);
          const allOrders = sessions.flatMap((s) => s.orders);
          return {
            tokenId: t.id,
            placeType: t.placeType,
            sessionsCount: sessions.length,
            convertedSessionsCount: convertedSessions.length,
            ordersCount: allOrders.length,
            orderTotals: allOrders.map((o) => o.total.toFixed(2)),
          };
        })
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      return NextResponse.json({
        ok: true,
        data: { view, dateFrom, dateTo, rows: rowsResult.value },
      });
    }

    default:
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: `Unsupported view: '${view}'`,
          },
        },
        { status: 400 }
      );
  }
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
  resolveGuest: async () => null,
};

const meta: AuditMeta = {
  route: "/api/admin/reports/[view]",
  method: "GET",
};

export const GET = withAuditedDynamicRoute<RouteParams>(
  resolvers,
  meta,
  dynamicHandler
);
