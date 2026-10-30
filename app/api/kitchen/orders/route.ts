import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { OrderState } from "@/domain/orders/order.repository";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
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

  // 5. Role check: kitchen area access
  if (!canAccess(staff.roles, "kitchen")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 6. Read kitchen-visible orders (APPROVED, PREPARING, READY)
  const orderRepo = createPrismaOrderRepository(db);
  const [approvedRes, preparingRes, readyRes] = await Promise.all([
    orderRepo.listForVenue(venue.id, { state: OrderState.APPROVED }),
    orderRepo.listForVenue(venue.id, { state: OrderState.PREPARING }),
    orderRepo.listForVenue(venue.id, { state: OrderState.READY }),
  ]);

  if (!approvedRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: approvedRes.error.message } },
      { status: 500 }
    );
  }
  if (!preparingRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: preparingRes.error.message } },
      { status: 500 }
    );
  }
  if (!readyRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: readyRes.error.message } },
      { status: 500 }
    );
  }

  const combinedOrders = [
    ...approvedRes.value,
    ...preparingRes.value,
    ...readyRes.value,
  ];

  return NextResponse.json({ data: combinedOrders }, { status: 200 });
}

