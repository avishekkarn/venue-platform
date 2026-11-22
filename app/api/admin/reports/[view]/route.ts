/**
 * GET /api/admin/reports/[view] — Query and calculate reports across 17 views.
 *
 * Governed by:
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
import { buildReportMeta } from "@/lib/report-meta";
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

async function recordReportRun(
  db: DbClient,
  venueId: string,
  view: string,
  params: Record<string, unknown>,
  rowCount: number,
  staffId: string
): Promise<void> {
  try {
    await db.reportRun.create({
      data: {
        venueId,
        view,
        paramsJson: params as Prisma.InputJsonValue,
        rowCount,
        ranByStaffId: staffId,
      },
    });
  } catch {
    // Audit run logging is non-blocking
  }
}

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

  // 4. Validate date range params
  const { searchParams } = new URL(request.url);
  const dateFromParam = searchParams.get("dateFrom");
  const dateToParam = searchParams.get("dateTo");

  // Special case: Payment Reconciliation is an empty-state descriptor in v1 per D-7.1 and D-7.7
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

    return NextResponse.json({
      ok: true,
      data: {
        view: "payment",
        dateFrom: dateFromParam ?? "",
        dateTo: dateToParam ?? "",
        status: status.status,
        totalCashCollected: status.totalCashCollected,
        completedOrdersCount: status.completedOrdersCount,
        commentary: status.commentary,
        rows: [],
        meta: buildReportMeta({
          view: "payment",
          dateFrom: dateFromParam ?? "",
          dateTo: dateToParam ?? "",
        }),
      },
    });
  }

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

  let rows: unknown[] = [];
  let uncategorizedItemPct = 0;
  let outlierOrders = 0;
  let staleSessions = 0;
  const metaExtra: Record<string, unknown> = {};

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

      rows = rowsResult.value;
      break;
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

      rows = rowsResult.value.rows;
      uncategorizedItemPct = rowsResult.value.uncategorizedItemPct;
      break;
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

      rows = rowsResult.value.rows;
      outlierOrders = rowsResult.value.anomalies.length;
      metaExtra.anomalies = rowsResult.value.anomalies;
      break;
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

      const rowsResult = generateServiceRequests(
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

      rows = rowsResult.value;
      break;
    }

    case "utilization": {
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

      const rowsResult = generatePlaceUtilization(placesInput);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = rowsResult.value;
      break;
    }

    case "qr": {
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

      const rowsResult = generateQrLifecycle(
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

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = rowsResult.value;
      break;
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

      rows = rowsResult.value;
      break;
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
          placeType: true,
          total: true,
        },
      });

      const rowsResult = generateHourlyHeatmap(
        orders.map((o) => ({
          placedAt: o.placedAt,
          placeType: o.placeType,
          total: o.total.toFixed(2),
        })),
        venue.timezone ?? "Asia/Kathmandu"
      );

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = [...rowsResult.value];
      break;
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
        salesResult.value.rows.map((s) => ({
          itemName: s.itemName,
          categoryName: s.category,
          unitsSold: s.unitsSold,
          lineRevenue: s.lineRevenue,
        }))
      );

      if (!matrixResult.ok) {
        return NextResponse.json({ error: matrixResult.error }, { status: 400 });
      }

      rows = matrixResult.value.rows;
      metaExtra.medianVolume = matrixResult.value.medianVolume;
      metaExtra.medianRevenue = matrixResult.value.medianRevenue;
      metaExtra.itemCount = matrixResult.value.itemCount;
      break;
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

      rows = rowsResult.value;
      break;
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

      rows = rowsResult.value;
      break;
    }

    case "cancellations": {
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

      const rowsResult = generateCancellationRootCause(events, ordersCount);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = rowsResult.value.rows;
      metaExtra.totalOrders = rowsResult.value.totalOrders;
      metaExtra.totalCancelled = rowsResult.value.totalCancelled;
      metaExtra.cancellationRatePct = rowsResult.value.cancellationRatePct;
      metaExtra.isCleanOperations = rowsResult.value.isCleanOperations;
      break;
    }

    case "sla": {
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

      const rowsResult = generateServiceSla(
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

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = rowsResult.value;
      break;
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

      const rowsResult = generateRoomFolio(folioInputs);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = rowsResult.value;
      staleSessions = rowsResult.value.filter((r) => r.staleSession).length;
      break;
    }

    case "occupancy": {
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

      const rowsResult = generateOccupancyDwell(placesInput, `${dateFrom} to ${dateTo}`);
      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = rowsResult.value;
      staleSessions = rowsResult.value.reduce((sum, r) => sum + r.staleSessions, 0);
      break;
    }

    case "conversion": {
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

      const rowsResult = generateConversionReport(
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

      if (!rowsResult.ok) {
        return NextResponse.json({ error: rowsResult.error }, { status: 400 });
      }

      rows = rowsResult.value;
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

  await recordReportRun(
    db,
    venue.id,
    view,
    { dateFrom, dateTo },
    rows.length,
    staff.id
  );

  const meta = buildReportMeta({
    view,
    dateFrom,
    dateTo,
    uncategorizedItemPct,
    outlierOrders,
    staleSessions,
    extra: metaExtra,
  });

  return NextResponse.json({
    ok: true,
    data: { view, dateFrom, dateTo, rows, meta },
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
  route: "/api/admin/reports/[view]",
  method: "GET",
};

export const GET = withAuditedDynamicRoute<RouteParams>(
  resolvers,
  meta,
  dynamicHandler
);
