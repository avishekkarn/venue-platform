import type { JSX } from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { OrderState } from "@/domain/orders/order.repository";
import { RequestState } from "@/domain/requests/request.repository";
import { QrManagementView } from "./_qr-management-view";
import type { PlaceItemView, QrPlacesResponse } from "./_types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Admin QR Codes & Places Management Hub
 *
 * Milestone 8.5.10. Re-architects the QR Codes section into an interactive,
 * place-centric operations hub allowing operators to manage physical places
 * (Counters, Tables, Rooms), monitor live in-house sessions, force-end sessions,
 * atomically regenerate QR codes, and batch print scannable placards.
 */
export default async function AdminQrPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const [
    venueResult,
    tables,
    rooms,
    counters,
    activeTokens,
    activeSessions,
    tableCategoriesResult,
    roomCategoriesResult,
  ] = await Promise.all([
    venueRepo.findById(staff.venueId),
    prisma.table.findMany({
      where: { venueId: staff.venueId },
      include: { category: true },
      orderBy: { number: "asc" },
    }),
    prisma.room.findMany({
      where: { venueId: staff.venueId },
      include: { category: true },
      orderBy: { number: "asc" },
    }),
    prisma.counter.findMany({
      where: { venueId: staff.venueId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.qrToken.findMany({
      where: { venueId: staff.venueId, state: "ACTIVE" },
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
    prisma.guestSession.findMany({
      where: { venueId: staff.venueId, endedAt: null },
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
    tableRepo.listCategories(staff.venueId),
    roomRepo.listCategories(staff.venueId),
  ]);

  if (!venueResult.ok) {
    return (
      <section className="p-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs text-staff-text-muted hover:text-staff-text-primary transition-colors mb-2"
        >
          ← Back to Dashboard
        </Link>
        <p className="text-sm text-staff-text-muted">Could not load venue details.</p>
      </section>
    );
  }

  const currency = venueResult.value.currency || "NPR";
  const tableCategories = tableCategoriesResult.ok
    ? tableCategoriesResult.value.map((c) => ({ id: c.id, name: c.name }))
    : [];
  const roomCategories = roomCategoriesResult.ok
    ? roomCategoriesResult.value.map((c) => ({ id: c.id, name: c.name }))
    : [];

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

  const initialData: QrPlacesResponse = {
    places,
    totalPlaces: places.length,
    activeQrsCount,
    revokedOrMissingCount,
    activeSessionsCount,
    currency,
  };

  return (
    <section>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-staff-text-muted hover:text-staff-text-primary transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </header>

        <QrManagementView
          initialData={initialData}
          tableCategories={tableCategories}
          roomCategories={roomCategories}
        />
      </div>
    </section>
  );
}
