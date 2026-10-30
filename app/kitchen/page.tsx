import type { JSX } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaTableRepository } from "@/infrastructure/db/repositories/table.repo";
import { createPrismaRoomRepository } from "@/infrastructure/db/repositories/room.repo";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import { canAccess } from "@/domain/auth/can-access";
import { OrderState, PlaceType, type Order } from "@/domain/orders/order.repository";
import { formatTime } from "@/lib/date";
import { KitchenTicket } from "@/components/staff/kitchen-ticket";
import { LogoutButton } from "./_logout-button";

interface PlaceDisplay {
  readonly number: string;
  readonly type: string;
}

function getPlaceInfo(
  order: Order,
  tableMap: Map<string, string>,
  roomMap: Map<string, string>
): PlaceDisplay {
  switch (order.placeType) {
    case PlaceType.TABLE: {
      const tableId = order.tableId;
      const num = tableId !== null ? tableMap.get(tableId) ?? tableId.slice(0, 4) : "—";
      return { number: num, type: "TABLE" };
    }
    case PlaceType.ROOM: {
      const roomId = order.roomId;
      const num = roomId !== null ? roomMap.get(roomId) ?? roomId.slice(0, 4) : "—";
      return { number: num, type: "ROOM" };
    }
    case PlaceType.COUNTER: {
      const name = order.pickupName ?? "Counter";
      return { number: name, type: "COUNTER" };
    }
    default:
      return { number: "—", type: "PLACE" };
  }
}

export default async function KitchenPage(): Promise<JSX.Element> {
  // 1. Session and role check
  const staff = await getAuthenticatedStaff();
  if (staff === null) {
    redirect("/kitchen/login");
  }
  if (!canAccess(staff.roles, "kitchen")) {
    redirect("/forbidden");
  }

  // 2. Venue resolution
  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venueResult.ok) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-staff-surface">
        <p className="text-status-cancelled text-[18px]">
          Venue configuration could not be loaded.
        </p>
      </main>
    );
  }
  const venue = venueResult.value;

  // 3. Read kitchen orders (APPROVED, PREPARING, READY)
  const orderRepo = createPrismaOrderRepository(prisma);
  const [approvedRes, preparingRes, readyRes] = await Promise.all([
    orderRepo.listForVenue(venue.id, { state: OrderState.APPROVED }),
    orderRepo.listForVenue(venue.id, { state: OrderState.PREPARING }),
    orderRepo.listForVenue(venue.id, { state: OrderState.READY }),
  ]);

  const orders = [
    ...(approvedRes.ok ? approvedRes.value : []),
    ...(preparingRes.ok ? preparingRes.value : []),
    ...(readyRes.ok ? readyRes.value : []),
  ].sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());

  // 4. Resolve places (tables and rooms)
  const tableRepo = createPrismaTableRepository(prisma);
  const roomRepo = createPrismaRoomRepository(prisma);

  const tableIds = Array.from(
    new Set(orders.map((o) => o.tableId).filter((id): id is string => id !== null))
  );
  const roomIds = Array.from(
    new Set(orders.map((o) => o.roomId).filter((id): id is string => id !== null))
  );

  const [tableLookups, roomLookups] = await Promise.all([
    Promise.all(tableIds.map(async (id) => ({ id, res: await tableRepo.findById(venue.id, id) }))),
    Promise.all(roomIds.map(async (id) => ({ id, res: await roomRepo.findById(venue.id, id) }))),
  ]);

  const tableMap = new Map<string, string>();
  for (const item of tableLookups) {
    if (item.res.ok) {
      tableMap.set(item.id, item.res.value.number);
    }
  }

  const roomMap = new Map<string, string>();
  for (const item of roomLookups) {
    if (item.res.ok) {
      roomMap.set(item.id, item.res.value.number);
    }
  }

  const now = Date.now();
  const currentTime = formatTime(new Date(now), "en-US");

  return (
    <main className="min-h-dvh flex flex-col bg-staff-surface text-staff-text-primary">
      {/* Status strip */}
      <header className="sticky top-0 z-10 h-12 bg-staff-surface border-b border-staff-border-subtle px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-staff-text-primary">
            {venue.name}
          </span>
          <span
            className="inline-block size-2 rounded-full bg-staff-text-muted"
            title="Connection status"
            aria-label="Connection indicator"
          />
        </div>
        <div className="flex items-center gap-4">
          <time className="font-mono text-sm text-staff-text-muted">
            {currentTime}
          </time>
        </div>
      </header>

      {/* Ticket Grid or Empty State */}
      <section className="flex-1 p-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <p className="text-[18px] text-staff-text-muted">
              No active tickets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {orders.map((order) => {
              const place = getPlaceInfo(order, tableMap, roomMap);
              return (
                <KitchenTicket
                  key={order.id}
                  order={order}
                  place={place}
                  now={now}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Fixed bottom-right logout button */}
      <aside className="fixed bottom-4 right-4 z-20">
        <LogoutButton />
      </aside>
    </main>
  );
}
