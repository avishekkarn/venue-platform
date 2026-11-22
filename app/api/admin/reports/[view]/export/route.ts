/**
 * GET /api/admin/reports/[view]/export — Stream RFC 4180 CSV export of report views.
 *
 * Governed by:
 * - DECISIONS.md D-12.2, D-12.5 (CSV-only export in v1; UTF-8 BOM encoding).
 * - DECISIONS.md D-12.1 (date range <= 180 days).
 * - DECISIONS.md D-10.2 (strict venue scoping).
 * - DECISIONS.md D-11.5 (venue timezone localization).
 * - DECISIONS.md D-12.6 (snapshotted categoryName).
 * - DECISIONS.md D-12.7 (report run execution audit).
 * - DECISIONS.md D-12.8 (4-hour folio stay grouping rule).
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
import { StaffState } from "@/domain/auth/staff.repository";
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
  generateServiceRequests,
  generatePlaceUtilization,
  generateQrLifecycle,
  generateAuditExport,
  generateHourlyHeatmap,
  generateMenuMatrix,
  generateModifierAttachReport,
  generateTaxRemittance,
  generateCancellationRootCause,
  generateServiceSla,
  generateRoomFolio,
  generateOccupancyDwell,
  generateConversionReport,
  generatePaymentReconciliationStatus,
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

  // Special case: Payment Reconciliation in v1 per D-7.1 and D-7.7
  if (view === "payment") {
    const orders = await db.order.findMany({
      where: { venueId: venue.id, state: "COMPLETED" },
      select: { total: true },
    });
    const totalCash = orders.reduce((sum, o) => sum + parseFloat(o.total.toString()), 0);
    const status = generatePaymentReconciliationStatus({
      totalCashCollected: totalCash.toFixed(2),
      completedOrdersCount: orders.length,
      currency: venue.currency,
    });

    const headers = [
      "Payment Method",
      "Status",
      "Orders",
      "Amount Collected",
      "Discrepancies",
    ];
    const dataRows = [
      ["CASH", "ACTIVE", status.completedOrdersCount, status.totalCashCollected, "0.00"],
    ];
    const comments = [
      "# Payment Reconciliation inactive in v1 (cash-only, D-7.1, D-7.7). Cash collection summary above.",
    ];

    const csvContent = serializeCsv(headers, dataRows, comments);
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
  const comments: string[] = [];

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
        "Item Name",
        "Category",
        "Units Sold",
        "Avg Unit Price",
        "Modifier Revenue",
        "Line Revenue",
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
        comments.push(
          `# Uncategorized item percentage: ${res.value.uncategorizedItemPct.toFixed(1)}% (catalog category missing at order time)`
        );
        dataRows = res.value.rows.map((r) => [
          r.itemName,
          r.category,
          r.unitsSold,
          r.unitsSold > 0 ? (parseFloat(r.lineRevenue) / r.unitsSold).toFixed(2) : "0.00",
          r.modifierRevenue,
          r.lineRevenue,
        ]);
      }
      break;
    }

    case "funnel": {
      headers = [
        "Period",
        "Orders Placed",
        "Orders Completed",
        "Approval P50 (s)",
        "Approval P90 (s)",
        "Approval Max (s)",
        "Prep P50 (s)",
        "Prep P90 (s)",
        "Prep Max (s)",
        "Delivery P50 (s)",
        "Delivery P90 (s)",
        "Delivery Max (s)",
        "Close-Out P50 (s)",
        "Close-Out P90 (s)",
        "Close-Out Max (s)",
        "Cycle P50 (s)",
        "Cycle P90 (s)",
        "Cycle Max (s)",
      ];
      comments.push(
        "# Cycle Time = Approval + Prep + Delivery + Close-Out (|Cycle - sum| <= 1s per D-4.9)"
      );
      comments.push(
        "# Latency P50/P90/Max across completed orders. Outliers (> 3x P90) listed in anomalies panel."
      );

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
        dataRows = res.value.rows.map((r) => [
          r.date,
          r.ordersPlaced,
          r.completed,
          r.p50ApprovalSec,
          r.p90ApprovalSec,
          r.maxApprovalSec,
          r.p50PrepSec,
          r.p90PrepSec,
          r.maxPrepSec,
          r.p50DeliverySec,
          r.p90DeliverySec,
          r.maxDeliverySec,
          r.p50CloseOutSec,
          r.p90CloseOutSec,
          r.maxCloseOutSec,
          r.p50CycleSec,
          r.p90CycleSec,
          r.maxCycleSec,
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
        "Avg Resolution Min (completed only)",
      ];
      comments.push(
        '# Avg Resolution is computed over completed only. "—" when no completions.'
      );

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

      const res = generateServiceRequests(
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
          r.avgResolutionMin !== null ? r.avgResolutionMin : "—",
        ]);
      }
      break;
    }

    case "utilization": {
      headers = [
        "Place Type",
        "Place Number",
        "Category",
        "Sessions (closed)",
        "Active Sessions",
        "Avg Dwell Min",
        "Max Dwell Min",
        "Orders",
        "Revenue",
        "Conversion %",
      ];
      comments.push(
        "# Active sessions counted separately; excluded from Avg Dwell (D-12.8)."
      );

      const [tables, rooms, counters, sessions] = await Promise.all([
        db.table.findMany({
          where: { venueId: venue.id },
          include: { category: true },
        }),
        db.room.findMany({
          where: { venueId: venue.id },
          include: { category: true },
        }),
        db.counter.findMany({
          where: { venueId: venue.id },
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
          return {
            placeType: "TABLE",
            placeNumber: t.number,
            category: t.category?.name ?? "Standard",
            sessions: tableSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        }),
        ...rooms.map((r) => {
          const roomSessions = sessions.filter((s) => s.roomId === r.id);
          return {
            placeType: "ROOM",
            placeNumber: r.number,
            category: r.category?.name ?? "Standard",
            sessions: roomSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        }),
        ...counters.map((c) => {
          const counterSessions = sessions.filter((s) => s.counterId === c.id);
          return {
            placeType: "COUNTER",
            placeNumber: c.name,
            category: "Counter",
            sessions: counterSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        }),
      ];

      const res = generatePlaceUtilization(placesInput);
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.placeType,
          r.placeNumber,
          r.category,
          r.sessionsClosed,
          r.activeSessions,
          r.avgDwellMin,
          r.maxDwellMin,
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
        "Revoked By",
        "Revocation Reason",
        "Sessions Generated",
      ];
      comments.push(
        "# Sessions Generated is filtered by session createdAt within range."
      );

      const tokens = await db.qrToken.findMany({
        where: { venueId: venue.id },
        include: {
          table: true,
          room: true,
          counter: true,
          guestSessions: {
            include: {
              orders: {
                where: { state: "COMPLETED" },
                select: { total: true },
              },
            },
          },
        },
      });

      const staffMap = new Map<string, string>();
      const staffIds = tokens
        .map((t) => t.revokedByStaffId)
        .filter((id): id is string => !!id);
      if (staffIds.length > 0) {
        const staffMembers = await db.staffMember.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, name: true },
        });
        for (const sm of staffMembers) {
          staffMap.set(sm.id, sm.name);
        }
      }

      const res = generateQrLifecycle(
        tokens.map((t) => {
          let label = "Unassigned";
          if (t.table) label = t.table.number;
          else if (t.room) label = t.room.number;
          else if (t.counter) label = t.counter.name;

          return {
            tokenId: t.id,
            token: t.token,
            placeType: t.placeType,
            placeLabel: label,
            status: t.state as "ACTIVE" | "REVOKED",
            issuedAt: t.createdAt,
            revokedAt: t.revokedAt,
            revokedByStaffName: t.revokedByStaffId
              ? staffMap.get(t.revokedByStaffId) ?? null
              : null,
            revocationReason: t.revocationReason,
            sessions: t.guestSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        }),
        { dateFrom, dateTo }
      );

      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.tokenId,
          r.placeType,
          r.placeLabel,
          r.status,
          r.issued,
          r.revoked,
          r.revokedBy,
          r.revocationReason,
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
        "Staff Member",
        "Staff Username",
        "Note",
      ];
      comments.push(
        "# Chronological order of state transitions. Venue-scoped (D-10.2). Never aggregate staff surveillance (D-12.4)."
      );

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
      headers = ["Date", "Hour (Venue Time)", "Place Type", "Orders", "Revenue"];
      comments.push("# Hours in venue local time (Venue.timezone, D-11.5).");

      const orders = await db.order.findMany({
        where: {
          venueId: venue.id,
          state: "COMPLETED",
          placedAt: { gte: fromDate, lte: toDate },
        },
        select: {
          placedAt: true,
          placeType: true,
          total: true,
        },
      });

      const res = generateHourlyHeatmap(
        orders.map((o) => ({
          placedAt: o.placedAt,
          placeType: o.placeType,
          total: o.total.toFixed(2),
        })),
        venue.timezone ?? "Asia/Kathmandu"
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.date,
          r.hour,
          r.placeType,
          r.orders,
          r.revenue,
        ]);
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

      if (salesResult.ok) {
        const res = generateMenuMatrix(
          salesResult.value.rows.map((s) => ({
            itemName: s.itemName,
            categoryName: s.category,
            unitsSold: s.unitsSold,
            lineRevenue: s.lineRevenue,
          }))
        );
        if (res.ok) {
          comments.push(
            `# Median Volume = ${res.value.medianVolume}, Median Revenue = ${res.value.medianRevenue} ${venue.currency}, Items = ${res.value.itemCount}`
          );
          comments.push(
            "# Profitability axis = line revenue (item cost not tracked in v1 per D-4.1)"
          );
          dataRows = res.value.rows.map((r) => [
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
        "Option Name",
        "Attach Count",
        "Attach Rate",
        "Total Modifier Revenue",
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
          r.attachRatePct,
          r.revenue,
        ]);
      }
      break;
    }

    case "tax": {
      headers = ["Tax Rate", "Taxable Subtotal", "Tax Collected", "Effective Rate"];
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
          r.taxRate,
          r.taxableSubtotal,
          r.taxCollected,
          r.taxRatePct,
        ]);
      }
      break;
    }

    case "cancellations": {
      headers = ["Date", "Cancelled Orders", "Top Reason", "Reason Count"];

      const [events, ordersCount] = await Promise.all([
        db.orderStateChange.findMany({
          where: {
            order: { venueId: venue.id },
            state: "CANCELLED",
            occurredAt: { gte: fromDate, lte: toDate },
          },
          select: {
            occurredAt: true,
            note: true,
          },
        }),
        db.order.count({
          where: {
            venueId: venue.id,
            placedAt: { gte: fromDate, lte: toDate },
          },
        }),
      ]);

      const res = generateCancellationRootCause(events, ordersCount);
      if (res.ok) {
        if (res.value.isCleanOperations) {
          comments.push(
            `# Clean Operations: No cancellations in range. 0 of ${res.value.totalOrders} orders were cancelled (${res.value.cancellationRatePct} cancellation rate).`
          );
        }
        dataRows = res.value.rows.map((r) => [
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
        "N",
        "P50 Resolution Min",
        "P90 Resolution Min",
        "P99 Resolution Min",
        "Max Resolution Min",
        "Open at End of Period",
      ];
      comments.push(
        '# P90/P99 suppressed when N < 20; "P50 / max" shown instead.'
      );

      const requests = await db.serviceRequest.findMany({
        where: {
          venueId: venue.id,
          submittedAt: { gte: fromDate, lte: toDate },
        },
        include: {
          stateChanges: {
            where: { state: "COMPLETED" },
            orderBy: { occurredAt: "asc" },
            take: 1,
          },
        },
      });

      const res = generateServiceSla(
        requests.map((r) => ({
          id: r.id,
          serviceType: r.serviceType,
          submittedAt: r.submittedAt,
          state: r.state,
          stateChanges: r.stateChanges.map((sc) => ({
            state: sc.state,
            occurredAt: sc.occurredAt,
          })),
        }))
      );
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.serviceType,
          r.n,
          r.p50ResolutionMin,
          r.p90ResolutionMin !== null ? r.p90ResolutionMin : "P50 / max",
          r.p99ResolutionMin !== null ? r.p99ResolutionMin : "P50 / max",
          r.maxResolutionMin,
          r.openAtEndOfPeriod,
        ]);
      }
      break;
    }

    case "folio": {
      headers = [
        "Room",
        "Stay Start",
        "Stay End",
        "Status",
        "Orders",
        "Requests",
        "Order Revenue",
        "Request Count",
        "Stale Session",
      ];
      comments.push(
        "# Folio groups consecutive sessions at the same room with a gap <= 4 hours (D-12.8)."
      );
      comments.push("# Billable service charges not tracked in v1.");

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

      const folioInputs = sessions.map((s) => ({
        roomNumber: s.qrToken?.room?.number ?? "Unassigned",
        createdAt: s.createdAt,
        endedAt: s.endedAt,
        ordersCount: s.orders.length,
        requestsCount: s.serviceRequests.length,
        ordersRevenue: s.orders
          .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
          .toFixed(2),
      }));

      const res = generateRoomFolio(folioInputs);
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.room,
          r.stayStart,
          r.stayEnd ?? "—",
          r.status,
          r.orders,
          r.requests,
          r.orderRevenue,
          r.requestCount,
          r.staleSession ? "Yes" : "No",
        ]);
      }
      break;
    }

    case "occupancy": {
      headers = [
        "Place Type",
        "Place Number",
        "Period",
        "Total Sessions",
        "Avg Dwell Min",
        "Peak Concurrent",
        "Stale Sessions",
      ];
      comments.push(
        "# Rows grouped per place, not aggregated by place type. Stale sessions flagged."
      );

      const [tables, rooms, counters, sessions] = await Promise.all([
        db.table.findMany({
          where: { venueId: venue.id },
          include: { category: true },
        }),
        db.room.findMany({
          where: { venueId: venue.id },
          include: { category: true },
        }),
        db.counter.findMany({
          where: { venueId: venue.id },
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
          return {
            placeType: "TABLE",
            placeNumber: t.number,
            category: t.category?.name ?? "Standard",
            sessions: tableSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        }),
        ...rooms.map((r) => {
          const roomSessions = sessions.filter((s) => s.roomId === r.id);
          return {
            placeType: "ROOM",
            placeNumber: r.number,
            category: r.category?.name ?? "Standard",
            sessions: roomSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        }),
        ...counters.map((c) => {
          const counterSessions = sessions.filter((s) => s.counterId === c.id);
          return {
            placeType: "COUNTER",
            placeNumber: c.name,
            category: "Counter",
            sessions: counterSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              endedAt: s.endedAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        }),
      ];

      const res = generateOccupancyDwell(placesInput, `${dateFrom} to ${dateTo}`);
      if (res.ok) {
        dataRows = res.value.map((r) => [
          r.placeType,
          r.placeNumber,
          r.period,
          r.totalSessions,
          r.avgDwellMin,
          r.peakConcurrent,
          r.staleSessions,
        ]);
      }
      break;
    }

    case "conversion": {
      headers = [
        "Token",
        "Place Type",
        "Place Label",
        "Sessions",
        "Orders",
        "Conversion %",
        "Revenue Per Session",
      ];
      comments.push(
        "# Conversion = sessions with >= 1 order / total sessions. Zero-session tokens hidden by default."
      );

      const tokens = await db.qrToken.findMany({
        where: { venueId: venue.id },
        include: {
          table: true,
          room: true,
          counter: true,
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

      const res = generateConversionReport(
        tokens.map((t) => {
          let label = "Unassigned";
          if (t.table) label = t.table.number;
          else if (t.room) label = t.room.number;
          else if (t.counter) label = t.counter.name;

          return {
            tokenId: t.id,
            token: t.token,
            placeType: t.placeType,
            placeLabel: label,
            status: t.state as "ACTIVE" | "REVOKED",
            issuedAt: t.createdAt,
            sessions: t.guestSessions.map((s) => ({
              id: s.id,
              createdAt: s.createdAt,
              ordersCount: s.orders.length,
              revenue: s.orders
                .reduce((sum, o) => sum + parseFloat(o.total.toString()), 0)
                .toFixed(2),
            })),
          };
        })
      );

      if (res.ok) {
        // Zero-session tokens hidden by default per Part 2 spec
        dataRows = res.value
          .filter((r) => r.sessions > 0)
          .map((r) => [
            r.token,
            r.placeType,
            r.placeLabel,
            r.sessions,
            r.orders,
            r.conversionPct,
            r.revenuePerSession,
          ]);
      }
      break;
    }
  }

  // 10,000 row cap check per Part 2 spec
  let isTruncated = false;
  if (dataRows.length > 10000) {
    dataRows = dataRows.slice(0, 10000);
    isTruncated = true;
    comments.push("# Warning: Export truncated to 10,000 rows. Narrow your date range.");
  }

  const csvContent = serializeCsv(headers, dataRows, comments);

  const responseHeaders: Record<string, string> = {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  };

  if (isTruncated) {
    responseHeaders["X-Report-Truncated"] = "true";
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: responseHeaders,
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
