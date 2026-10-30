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
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./_logout-button";

interface PlaceDisplay {
  readonly number: string;
  readonly type: string;
}

function parseModifiers(modifiersJson: unknown): string[] {
  if (!Array.isArray(modifiersJson)) {
    return [];
  }
  const result: string[] = [];
  for (const item of modifiersJson) {
    if (typeof item === "object" && item !== null) {
      const record = item as Record<string, unknown>;
      if (typeof record["option"] === "string") {
        result.push(record["option"]);
      } else if (typeof record["name"] === "string") {
        result.push(record["name"]);
      }
    }
  }
  return result;
}

function getActionButtonLabel(state: OrderState): string {
  switch (state) {
    case OrderState.APPROVED:
    case OrderState.PLACED:
      return "Start";
    case OrderState.PREPARING:
      return "Ready";
    case OrderState.READY:
      return "Done";
    default:
      return "View";
  }
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
              const elapsedMinutes = Math.max(
                0,
                Math.floor((now - new Date(order.placedAt).getTime()) / 60000)
              );
              const isStale = elapsedMinutes >= 15;

              return (
                <article
                  key={order.id}
                  className={`bg-staff-surface-raised rounded-lg p-5 flex flex-col justify-between gap-4 ${
                    isStale
                      ? "border-2 border-[var(--color-status-active)]"
                      : "border border-staff-border-subtle"
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Header Row: Order ID & Elapsed Time */}
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[20px] font-semibold text-staff-text-primary tracking-tight">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="font-mono text-[14px] text-staff-text-muted">
                        {elapsedMinutes} min
                      </span>
                    </div>

                    {/* Place Row: Table/Room number in 40px (The Place) */}
                    <div className="flex flex-col">
                      <span className="text-[40px] leading-[44px] font-semibold text-staff-text-primary tracking-tight">
                        {place.number}
                      </span>
                      <span className="text-[12px] uppercase tracking-wider text-staff-text-muted font-medium">
                        {place.type}
                      </span>
                    </div>

                    {/* Divider */}
                    <hr className="border-t border-staff-border-subtle" />

                    {/* Items List */}
                    <ul className="flex flex-col gap-3">
                      {order.items.map((item) => {
                        const modifiers = parseModifiers(item.modifiersJson);
                        return (
                          <li key={item.id} className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                              {item.quantity > 1 && (
                                <span className="font-mono text-[16px] font-medium text-staff-text-muted">
                                  {item.quantity}×
                                </span>
                              )}
                              <span className="text-[18px] font-medium text-staff-text-primary leading-snug">
                                {item.itemName}
                              </span>
                            </div>
                            {modifiers.length > 0 && (
                              <p className="text-[14px] text-staff-text-muted pl-3">
                                {modifiers.join(", ")}
                              </p>
                            )}
                            {item.notes !== null && item.notes.trim() !== "" && (
                              <p className="text-[14px] text-staff-text-primary pl-2 border-l-2 border-[var(--color-status-active)] italic">
                                {item.notes}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {/* Order-level notes */}
                    {order.notes !== null && order.notes.trim() !== "" && (
                      <div className="pt-2 border-t border-staff-border-subtle">
                        <p className="text-[14px] text-staff-text-primary pl-2 border-l-2 border-[var(--color-status-active)] italic">
                          <span className="font-medium not-italic text-staff-text-muted mr-1">
                            Note:
                          </span>
                          {order.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer Action Button (Disabled Placeholder) */}
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="lg"
                      disabled
                      className="w-full"
                    >
                      {getActionButtonLabel(order.state)}
                    </Button>
                  </div>
                </article>
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
