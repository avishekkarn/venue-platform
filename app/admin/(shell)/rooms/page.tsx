import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { RoomsView, type RoomItemView } from "./_rooms-view";
import { OrderState } from "@/domain/orders/order.repository";
import { RequestState } from "@/domain/requests/request.repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminRoomsPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);
  const venueRepo = createPrismaVenueRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const now = new Date();
  const localTodayStart = new Date();
  localTodayStart.setHours(0, 0, 0, 0);
  const utcTodayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const todayStart = localTodayStart < utcTodayStart ? localTodayStart : utcTodayStart;

  const [
    venueResult,
    categoriesResult,
    roomsResult,
    activeTokens,
    todaySessions,
    todayRoomOrders,
    todayRoomRequests,
  ] = await Promise.all([
    venueRepo.findById(staff.venueId),
    roomRepo.listCategories(staff.venueId),
    roomRepo.listRoomsWithDetails(staff.venueId),
    prisma.qrToken.findMany({
      where: {
        venueId: staff.venueId,
        placeType: "ROOM",
        state: "ACTIVE",
      },
      select: {
        id: true,
        roomId: true,
      },
    }),
    prisma.guestSession.findMany({
      where: {
        venueId: staff.venueId,
        roomId: { not: null },
        OR: [
          { endedAt: null },
          { createdAt: { gte: todayStart } },
          { endedAt: { gte: todayStart } },
        ],
      },
      include: {
        orders: {
          select: {
            id: true,
            state: true,
            total: true,
          },
        },
        serviceRequests: {
          select: {
            id: true,
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
    prisma.order.findMany({
      where: {
        venueId: staff.venueId,
        roomId: { not: null },
        placedAt: { gte: todayStart },
        state: { not: OrderState.CANCELLED },
      },
      select: {
        id: true,
        roomId: true,
        total: true,
      },
    }),
    prisma.serviceRequest.findMany({
      where: {
        venueId: staff.venueId,
        roomId: { not: null },
        submittedAt: { gte: todayStart },
        state: { not: RequestState.CANCELLED },
      },
      select: {
        id: true,
        roomId: true,
        serviceItem: {
          select: {
            price: true,
          },
        },
      },
    }),
  ]);

  const currency = venueResult.ok ? venueResult.value.currency || "NPR" : "NPR";
  const categories = categoriesResult.ok ? categoriesResult.value : [];
  const rooms = roomsResult.ok ? roomsResult.value : [];

  // Map QR token IDs by roomId
  const qrTokenByRoomId = new Map<string, string>();
  for (const token of activeTokens) {
    if (token.roomId) {
      qrTokenByRoomId.set(token.roomId, token.id);
    }
  }

  // Map room base price by roomId
  const roomBasePriceByRoomId = new Map<string, number>();
  for (const r of rooms) {
    if (r.category && Number(r.category.basePrice) > 0) {
      roomBasePriceByRoomId.set(r.id, Number(r.category.basePrice));
    }
  }

  // Aggregate today's metrics by roomId
  const todayMetricsByRoomId = new Map<
    string,
    { sessionsCount: number; ordersCount: number; requestsCount: number; revenue: number }
  >();
  const countedOrderIds = new Set<string>();
  const countedRequestIds = new Set<string>();

  for (const sess of todaySessions) {
    if (!sess.roomId) continue;
    const existing = todayMetricsByRoomId.get(sess.roomId) ?? {
      sessionsCount: 0,
      ordersCount: 0,
      requestsCount: 0,
      revenue: 0,
    };

    existing.sessionsCount += 1;

    // Room stay charge
    const roomRate = roomBasePriceByRoomId.get(sess.roomId) ?? 0;
    existing.revenue += roomRate;

    // Food & Beverage orders
    for (const ord of sess.orders) {
      if (ord.state !== OrderState.CANCELLED && !countedOrderIds.has(ord.id)) {
        countedOrderIds.add(ord.id);
        existing.ordersCount += 1;
        existing.revenue += Number(ord.total);
      }
    }

    // Service requests
    for (const req of sess.serviceRequests) {
      if (req.state !== RequestState.CANCELLED && !countedRequestIds.has(req.id)) {
        countedRequestIds.add(req.id);
        existing.requestsCount += 1;
        if (req.serviceItem && Number(req.serviceItem.price) > 0) {
          existing.revenue += Number(req.serviceItem.price);
        }
      }
    }

    todayMetricsByRoomId.set(sess.roomId, existing);
  }

  // Also include any standalone orders placed today on rooms
  for (const ord of todayRoomOrders) {
    if (!ord.roomId || countedOrderIds.has(ord.id)) continue;
    countedOrderIds.add(ord.id);
    const existing = todayMetricsByRoomId.get(ord.roomId) ?? {
      sessionsCount: 0,
      ordersCount: 0,
      requestsCount: 0,
      revenue: 0,
    };
    existing.ordersCount += 1;
    existing.revenue += Number(ord.total);
    todayMetricsByRoomId.set(ord.roomId, existing);
  }

  // Also include any standalone service requests submitted today on rooms
  for (const req of todayRoomRequests) {
    if (!req.roomId || countedRequestIds.has(req.id)) continue;
    countedRequestIds.add(req.id);
    const existing = todayMetricsByRoomId.get(req.roomId) ?? {
      sessionsCount: 0,
      ordersCount: 0,
      requestsCount: 0,
      revenue: 0,
    };
    existing.requestsCount += 1;
    if (req.serviceItem && Number(req.serviceItem.price) > 0) {
      existing.revenue += Number(req.serviceItem.price);
    }
    todayMetricsByRoomId.set(req.roomId, existing);
  }

  // Prepare views
  const roomViews: RoomItemView[] = rooms.map((r) => {
    const metrics = todayMetricsByRoomId.get(r.id) ?? {
      sessionsCount: 0,
      ordersCount: 0,
      requestsCount: 0,
      revenue: 0,
    };

    return {
      id: r.id,
      number: r.number,
      state: r.state,
      categoryId: r.categoryId ?? null,
      category: r.category
        ? {
            id: r.category.id,
            name: r.category.name,
            basePrice: r.category.basePrice,
          }
        : null,
      activeSession: r.activeSession
        ? {
            id: r.activeSession.id,
            startedAt: r.activeSession.startedAt.toISOString(),
            ordersCount: r.activeSession.ordersCount,
            requestsCount: r.activeSession.requestsCount,
            roomRate: r.activeSession.roomRate,
            totalAmount: r.activeSession.totalAmount,
            dndActive: r.activeSession.dndActive,
          }
        : null,
      todaySessionsCount: metrics.sessionsCount,
      todayOrdersCount: metrics.ordersCount,
      todayRequestsCount: metrics.requestsCount,
      todayRevenue: metrics.revenue,
      qrTokenId: qrTokenByRoomId.get(r.id) ?? null,
    };
  });

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-staff-text-muted hover:text-staff-text-primary transition-colors mb-1.5"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
            Rooms Management
          </h1>
          <p className="text-xs text-staff-text-secondary mt-1">
            Manage hotel rooms, categories, nightly pricing, housekeeping states, and active folios.
          </p>
        </div>
      </header>

      <RoomsView
        initialRooms={roomViews}
        categories={categories}
        currency={currency}
      />
    </section>
  );
}
