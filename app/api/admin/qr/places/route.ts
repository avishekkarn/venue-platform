/**
 * GET /api/admin/qr/places — returns live places with active QR tokens and active sessions
 *
 * Milestone 8.5.10d. Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), read-only (GET).
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
import { OrderState } from "@/domain/orders/order.repository";
import { RequestState } from "@/domain/requests/request.repository";
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

export interface PlaceItemView {
  id: string;
  type: "TABLE" | "ROOM" | "COUNTER";
  name: string;
  identifier: string;
  categoryName: string | null;
  isReserved?: boolean;
  state?: string;
  activeQr: {
    id: string;
    token: string;
    createdAt: string;
  } | null;
  activeSession: {
    id: string;
    startedAt: string;
    ordersCount: number;
    requestsCount: number;
    totalAmount: string;
  } | null;
}

export interface QrPlacesResponse {
  places: PlaceItemView[];
  totalPlaces: number;
  activeQrsCount: number;
  revokedOrMissingCount: number;
  activeSessionsCount: number;
  currency: string;
}

async function resolveAdmin(db: DbClient) {
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return { ok: false as const, status: 500, code: DomainErrorCode.INTERNAL, message: "Venue not configured" };
  }
  const venue = venueResult.value;

  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  if (!canAccess(staffResult.value.roles, "admin")) {
    return { ok: false as const, status: 403, code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" };
  }

  return { ok: true as const, venue, staff: staffResult.value };
}

const getHandler: AuditedRouteHandler = async (_request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const venueId = auth.venue.id;
  const currency = auth.venue.currency || "NPR";

  // Fetch all entities in parallel
  const [tables, rooms, counters, activeTokens, activeSessions] = await Promise.all([
    db.table.findMany({
      where: { venueId },
      include: { category: true },
      orderBy: { number: "asc" },
    }),
    db.room.findMany({
      where: { venueId },
      include: { category: true },
      orderBy: { number: "asc" },
    }),
    db.counter.findMany({
      where: { venueId },
      orderBy: { createdAt: "asc" },
    }),
    db.qrToken.findMany({
      where: { venueId, state: "ACTIVE" },
      select: {
        id: true,
        token: true,
        placeType: true,
        tableId: true,
        roomId: true,
        counterId: true,
        createdAt: true,
      },
    }),
    db.guestSession.findMany({
      where: { venueId, endedAt: null },
      include: {
        orders: {
          select: {
            state: true,
            total: true,
          },
        },
        serviceRequests: {
          select: {
            state: true,
            serviceItem: {
              select: {
                price: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // Index active QR tokens by placeId
  const activeQrByTableId = new Map<string, { id: string; token: string; createdAt: string }>();
  const activeQrByRoomId = new Map<string, { id: string; token: string; createdAt: string }>();
  const activeQrByCounterId = new Map<string, { id: string; token: string; createdAt: string }>();

  for (const t of activeTokens) {
    const payload = {
      id: t.id,
      token: t.token,
      createdAt: t.createdAt.toISOString(),
    };
    if (t.tableId) activeQrByTableId.set(t.tableId, payload);
    if (t.roomId) activeQrByRoomId.set(t.roomId, payload);
    if (t.counterId) activeQrByCounterId.set(t.counterId, payload);
  }

  // Room rate lookup
  const roomBasePriceByRoomId = new Map<string, number>();
  for (const r of rooms) {
    if (r.category?.basePrice) {
      roomBasePriceByRoomId.set(r.id, Number(r.category.basePrice));
    }
  }

  // Index active sessions by placeId
  const sessionByTableId = new Map<string, PlaceItemView["activeSession"]>();
  const sessionByRoomId = new Map<string, PlaceItemView["activeSession"]>();
  const sessionByCounterId = new Map<string, PlaceItemView["activeSession"]>();

  for (const sess of activeSessions) {
    let orderCount = 0;
    let requestCount = 0;
    let total = 0;

    if (sess.roomId) {
      total += roomBasePriceByRoomId.get(sess.roomId) ?? 0;
    }

    for (const ord of sess.orders) {
      if (ord.state !== OrderState.CANCELLED) {
        orderCount += 1;
        total += Number(ord.total);
      }
    }

    for (const req of sess.serviceRequests) {
      if (req.state !== RequestState.CANCELLED) {
        requestCount += 1;
        if (req.serviceItem?.price) {
          total += Number(req.serviceItem.price);
        }
      }
    }

    const sessionPayload: PlaceItemView["activeSession"] = {
      id: sess.id,
      startedAt: sess.createdAt.toISOString(),
      ordersCount: orderCount,
      requestsCount: requestCount,
      totalAmount: total.toFixed(2),
    };

    if (sess.tableId) sessionByTableId.set(sess.tableId, sessionPayload);
    if (sess.roomId) sessionByRoomId.set(sess.roomId, sessionPayload);
    if (sess.counterId) sessionByCounterId.set(sess.counterId, sessionPayload);
  }

  // Construct PlaceItemViews
  const places: PlaceItemView[] = [];

  // 1. Counters
  for (const c of counters) {
    places.push({
      id: c.id,
      type: "COUNTER",
      name: c.name || "Counter",
      identifier: c.name || "Counter",
      categoryName: "Service & Takeaway",
      activeQr: activeQrByCounterId.get(c.id) ?? null,
      activeSession: sessionByCounterId.get(c.id) ?? null,
    });
  }

  // 2. Tables
  for (const t of tables) {
    places.push({
      id: t.id,
      type: "TABLE",
      name: `Table ${t.number}`,
      identifier: t.number,
      categoryName: t.category?.name ?? "Unassigned",
      isReserved: t.category?.isReserved ?? false,
      state: t.state,
      activeQr: activeQrByTableId.get(t.id) ?? null,
      activeSession: sessionByTableId.get(t.id) ?? null,
    });
  }

  // 3. Rooms
  for (const r of rooms) {
    const rate = r.category?.basePrice ? ` (NPR ${Number(r.category.basePrice).toLocaleString()}/night)` : "";
    places.push({
      id: r.id,
      type: "ROOM",
      name: `Room ${r.number}`,
      identifier: r.number,
      categoryName: (r.category?.name ?? "Standard") + rate,
      state: r.state,
      activeQr: activeQrByRoomId.get(r.id) ?? null,
      activeSession: sessionByRoomId.get(r.id) ?? null,
    });
  }

  const activeQrsCount = places.filter((p) => p.activeQr !== null).length;
  const revokedOrMissingCount = places.length - activeQrsCount;
  const activeSessionsCount = places.filter((p) => p.activeSession !== null).length;

  const responseData: QrPlacesResponse = {
    places,
    totalPlaces: places.length,
    activeQrsCount,
    revokedOrMissingCount,
    activeSessionsCount,
    currency,
  };

  return NextResponse.json({ data: responseData }, { status: 200 });
};

const getMeta: AuditMeta = { route: "/api/admin/qr/places", method: "GET" };

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

export const GET = withAudit(resolvers, getMeta, getHandler);
