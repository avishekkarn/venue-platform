import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { OrderState } from "@/domain/orders/order.repository";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

function hasOrderAccess(roles: readonly StaffRole[]): boolean {
  return (
    canAccess(roles, "table-service") ||
    canAccess(roles, "room-service") ||
    canAccess(roles, "front-desk")
  );
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const db = testDbClient ?? prisma;

  // 1. Session check: active staff session cookie
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 2. Session validation
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 3. Resolve venue by slug
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 4. Staff lookup and active check
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const staff = staffResult.value;

  // 5. Role check: table-service, room-service, or front-desk
  if (!hasOrderAccess(staff.roles)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 6. Read staff-visible orders (PLACED, READY, DELIVERED)
  const orderRepo = createPrismaOrderRepository(db);
  const [placedRes, readyRes, deliveredRes] = await Promise.all([
    orderRepo.listForVenue(venue.id, { state: OrderState.PLACED }),
    orderRepo.listForVenue(venue.id, { state: OrderState.READY }),
    orderRepo.listForVenue(venue.id, { state: OrderState.DELIVERED }),
  ]);

  if (!placedRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: placedRes.error.message } },
      { status: 500 }
    );
  }
  if (!readyRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: readyRes.error.message } },
      { status: 500 }
    );
  }
  if (!deliveredRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: deliveredRes.error.message } },
      { status: 500 }
    );
  }

  const combinedOrders = [
    ...placedRes.value,
    ...readyRes.value,
    ...deliveredRes.value,
  ];

  // Query all active guest sessions for this venue to derive occupied places
  const activeSessions = await db.guestSession.findMany({
    where: {
      venueId: venue.id,
      endedAt: null,
    },
    select: { tableId: true, roomId: true },
  });

  const activeTableIds: string[] = [];
  const activeRoomIds: string[] = [];
  for (const s of activeSessions) {
    if (s.tableId) activeTableIds.push(s.tableId);
    if (s.roomId) activeRoomIds.push(s.roomId);
  }

  return NextResponse.json(
    { data: combinedOrders, activeTableIds, activeRoomIds },
    { status: 200 }
  );
}

