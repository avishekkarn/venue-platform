/**
 * GET /api/admin/reports/[view]/export — Stream RFC 4180 CSV export of report views.
 *
 * Governed by:
 * - DECISIONS.md D-12.2, D-12.5 (CSV-only export in v1; UTF-8 BOM encoding).
 * - DECISIONS.md D-12.1 (date range <= 180 days).
 * - DECISIONS.md D-10.2 (strict venue scoping).
 * - BUILD.md §7.1 (decimal money precision preserved).
 * - BUILD.md §6.11 (withAuditedDynamicRoute audit trail).
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
import { serializeCsv } from "@/lib/csv";
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

  // Special case: Payment Reconciliation empty CSV in v1 per D-7.1 and D-7.7
  if (view === "payment") {
    const headers = [
      "Ticket ID",
      "Order ID",
      "Amount",
      "Currency",
      "Method",
      "Provider",
      "Status",
      "Verified At",
    ];
    const csvContent = serializeCsv(headers, []);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${venue.slug}-report-payment.csv"`,
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
  const filename = `${venue.slug}-report-${view}-${dateFrom}-to-${dateTo}.csv`;

  let headers: readonly string[] = [];
  let dataRows: (readonly unknown[])[] = [];

  switch (view) {
    case "revenue": {
      headers = [
        "Date",
        "Place Type",
        "Completed Orders",
        "Subtotal",
        "Tax Collected",
        "Total Revenue",
        "Currency",
      ];
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

      const res = generateRevenueSummary(
        orders.map((o) => ({
          placedAt: o.placedAt,
          placeType: o.placeType,
          subtotal: o.subtotal.toFixed(2),
          taxAmount: o.taxAmount.toFixed(2),
          total: o.total.toFixed(2),
        })),
        venue.currency
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.date,
          r.placeType,
          r.completedOrders,
          r.subtotal,
          r.taxCollected,
          r.totalRevenue,
          r.currency,
        ]);
      }
      break;
    }

    case "sales": {
      headers = [
        "Category",
        "Item Name",
        "Units Sold",
        "Base Revenue",
        "Modifier Revenue",
        "Line Revenue",
        "Modifier Attach Rate %",
      ];
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

      const res = generateItemSales(
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
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.category,
          r.itemName,
          r.unitsSold,
          r.baseRevenue,
          r.modifierRevenue,
          r.lineRevenue,
          r.modifierAttachRate,
        ]);
      }
      break;
    }

    case "funnel": {
      headers = [
        "Date",
        "Orders Placed",
        "Approved",
        "Preparing",
        "Ready",
        "Delivered",
        "Completed",
        "Cancelled",
        "Avg Approval (s)",
        "Avg Prep (s)",
        "Avg Delivery (s)",
        "Avg Cycle (s)",
      ];
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

      const res = generateOrderFunnel(
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
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.date,
          r.ordersPlaced,
          r.approved,
          r.preparing,
          r.ready,
          r.delivered,
          r.completed,
          r.cancelled,
          r.avgApprovalSec,
          r.avgPrepSec,
          r.avgDeliverySec,
          r.avgCycleSec,
        ]);
      }
      break;
    }

    case "requests": {
      headers = [
        "Service Type",
        "Submitted",
        "Completed",
        "Declined",
        "Cancelled",
        "Avg Resolution (min)",
      ];
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

      const res = generateServiceRequestsReport(
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
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.serviceType,
          r.submitted,
          r.completed,
          r.declined,
          r.cancelled,
          r.avgResolutionMin,
        ]);
      }
      break;
    }

    case "utilization": {
      headers = [
        "Place Type",
        "Place Number",
        "Category",
        "Sessions",
        "Avg Dwell (min)",
        "Orders",
        "Revenue",
        "Conversion %",
      ];
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

      const res = generatePlaceUtilization(placesInput);
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.placeType,
          r.placeNumber,
          r.category,
          r.sessions,
          r.avgDwellMin,
          r.orders,
          r.revenue,
          r.conversionPct,
        ]);
      }
      break;
    }

    case "qr": {
      headers = [
        "Token ID",
        "Place Type",
        "Place Label",
        "Status",
        "Issued",
        "Revoked",
        "Sessions Generated",
      ];
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

      const res = generateQrLifecycleReport(
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
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.tokenId,
          r.placeType,
          r.placeLabel,
          r.status,
          r.issued,
          r.revoked,
          r.sessionsGenerated,
        ]);
      }
      break;
    }

    case "audit": {
      headers = [
        "Timestamp",
        "Record Type",
        "Entity ID",
        "Target State",
        "Staff Name",
        "Staff Username",
        "Note",
      ];
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

      const res = generateAuditExport(events);
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.timestamp,
          r.recordType,
          r.entityId,
          r.targetState,
          r.staffName,
          r.staffUsername,
          r.note,
        ]);
      }
      break;
    }

    case "heatmap": {
      headers = ["Date", "Hour", "Orders", "Revenue"];
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

      const res = generateHourlyHeatmap(
        orders.map((o) => ({
          placedAt: o.placedAt,
          total: o.total.toFixed(2),
        }))
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [r.date, r.hour, r.orders, r.revenue]);
      }
      break;
    }

    case "matrix": {
      headers = ["Item Name", "Units Sold", "Line Revenue", "Quadrant"];
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

      const salesRes = generateItemSales(
        items.map((i) => ({
          itemName: i.itemName,
          categoryName: i.categoryName,
          quantity: i.quantity,
          itemPrice: i.itemPrice.toFixed(2),
          modifierPrice: i.modifierPrice.toFixed(2),
          lineTotal: i.lineTotal.toFixed(2),
        }))
      );

      if (salesRes.ok) {
        const matrixRes = generateMenuMatrix(
          salesRes.value.map((s) => ({
            itemName: s.itemName,
            unitsSold: s.unitsSold,
            lineRevenue: s.lineRevenue,
          }))
        );
        if (matrixRes.ok) {
          dataRows = matrixRes.value.map((r) => [
            r.itemName,
            r.unitsSold,
            r.lineRevenue,
            r.quadrant,
          ]);
        }
      }
      break;
    }

    case "modifiers": {
      headers = [
        "Modifier Group",
        "Modifier Option",
        "Times Selected",
        "Revenue",
        "Attach Rate %",
      ];
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
      const res = generateModifierAttachReport(
        items.map((i) => ({
          quantity: i.quantity,
          modifiersJson: i.modifiersJson,
        })),
        totalParentUnits
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.modifierGroup,
          r.modifierOption,
          r.timesSelected,
          r.revenue,
          r.attachRatePct,
        ]);
      }
      break;
    }

    case "tax": {
      headers = ["Period", "Tax Rate", "Taxable Subtotal", "Tax Collected", "Orders"];
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

      const res = generateTaxRemittance(
        orders.map((o) => ({
          placedAt: o.placedAt,
          taxRate: o.taxRate.toFixed(4),
          subtotal: o.subtotal.toFixed(2),
          taxAmount: o.taxAmount.toFixed(2),
        }))
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.period,
          r.taxRate,
          r.taxableSubtotal,
          r.taxCollected,
          r.orders,
        ]);
      }
      break;
    }

    case "cancellations": {
      headers = ["Date", "Cancelled Orders", "Top Reason", "Reason Count"];
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

      const res = generateCancellationRootCause(events);
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.date,
          r.cancelledOrders,
          r.topReason,
          r.reasonCount,
        ]);
      }
      break;
    }

    case "sla": {
      headers = [
        "Service Type",
        "P50 Resolution (min)",
        "P90 Resolution (min)",
        "P99 Resolution (min)",
        "Open Now",
      ];
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

      const res = generateServiceSla(
        requests.map((r) => ({
          serviceType: r.serviceType,
          state: r.state,
          submittedAt: r.submittedAt,
          resolvedAt: r.stateChanges[0]?.occurredAt ?? null,
        }))
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.serviceType,
          r.p50ResolutionMin,
          r.p90ResolutionMin,
          r.p99ResolutionMin,
          r.openNow,
        ]);
      }
      break;
    }

    case "folio": {
      headers = [
        "Room",
        "Stay Start",
        "Stay End",
        "Orders",
        "Requests",
        "Order Revenue",
        "Request Count",
      ];
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

      const res = generateRoomFolioReport(
        sessions.map((s) => ({
          roomNumber: s.qrToken?.room?.number ?? "Unassigned",
          stayStart: s.createdAt,
          stayEnd: s.endedAt,
          orderTotals: s.orders.map((o) => o.total.toFixed(2)),
          serviceRequestsCount: s.serviceRequests.length,
        }))
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.room,
          r.stayStart,
          r.stayEnd,
          r.orders,
          r.requests,
          r.orderRevenue,
          r.requestCount,
        ]);
      }
      break;
    }

    case "occupancy": {
      headers = [
        "Place Type",
        "Period",
        "Total Sessions",
        "Avg Dwell (min)",
        "Peak Concurrent",
      ];
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

      const res = generateOccupancyDwell(sessions);
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.placeType,
          r.period,
          r.totalSessions,
          r.avgDwellMin,
          r.peakConcurrent,
        ]);
      }
      break;
    }

    case "conversion": {
      headers = [
        "Token",
        "Place Type",
        "Sessions",
        "Orders",
        "Conversion %",
        "Revenue per Session",
      ];
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

      const res = generateQrConversionReport(
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
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.token,
          r.placeType,
          r.sessions,
          r.orders,
          r.conversionPct,
          r.revenuePerSession,
        ]);
      }
      break;
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

  const csvContent = serializeCsv(headers, dataRows);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
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
  route: "/api/admin/reports/[view]/export",
  method: "GET",
};

export const GET = withAuditedDynamicRoute<RouteParams>(
  resolvers,
  meta,
  dynamicHandler
);
