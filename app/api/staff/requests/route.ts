import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess, visibleAreasFor, type Area } from "@/domain/auth/can-access";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { RequestState, type HotelService } from "@/domain/requests/request.repository";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

/**
 * Any staff member with a hospitality area can call the requests queue.
 * The fine-grained filtering (which service types they see) happens in the
 * `visibleAreas.includes(serviceTypeToArea[r.serviceType])` filter below.
 *
 * - LEADER / MANAGER / OWNER: all services (via canAccess → true for all areas).
 * - FRONT_DESK: all services (front-desk canAccess grants the area; the
 *   filter narrows to room-facing services, plus table service via
 *   visibleAreasFor(FRONT_DESK) which includes "table-service" for
 *   call-waiter / request-bill).
 * - ROOM_SERVICE: all services (visibleAreasFor includes room-service,
 *   which is the area for ROOM_SERVICE_FOOD; the filter passes it).
 * - HOUSEKEEPING: only HOUSEKEEPING requests (visibleAreasFor returns
 *   ["housekeeping"]; the filter narrows to that service type).
 * - MAINTENANCE / CONCIERGE / LAUNDRY / SPA: their respective service.
 * - TABLE_SERVICE: call-waiter / request-bill (visibleAreasFor includes
 *   "table-service", mapped to those two service types).
 * - CHEF: not allowed (returns false; 403).
 */
function hasRequestAccess(roles: readonly StaffRole[]): boolean {
  return (
    canAccess(roles, "front-desk") ||
    canAccess(roles, "housekeeping") ||
    canAccess(roles, "maintenance") ||
    canAccess(roles, "concierge") ||
    canAccess(roles, "laundry") ||
    canAccess(roles, "spa") ||
    canAccess(roles, "room-service")
  );
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const db = testDbClient ?? prisma;

  // 1. Session check
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

  // 3. Resolve venue
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

  // 4. Staff lookup
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const staff = staffResult.value;

  // 5. Role check
  if (!hasRequestAccess(staff.roles)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 6. Read active requests — three states: SUBMITTED, ACKNOWLEDGED, IN_PROGRESS
  const requestRepo = createPrismaServiceRequestRepository(db);
  const [submittedRes, acknowledgedRes, inProgressRes] = await Promise.all([
    requestRepo.listForVenue(venue.id, { state: RequestState.SUBMITTED }),
    requestRepo.listForVenue(venue.id, { state: RequestState.ACKNOWLEDGED }),
    requestRepo.listForVenue(venue.id, { state: RequestState.IN_PROGRESS }),
  ]);

  if (!submittedRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: submittedRes.error.message } },
      { status: 500 }
    );
  }
  if (!acknowledgedRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: acknowledgedRes.error.message } },
      { status: 500 }
    );
  }
  if (!inProgressRes.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: inProgressRes.error.message } },
      { status: 500 }
    );
  }

  const visibleAreas = visibleAreasFor(staff.roles);
  const serviceTypeToArea: Record<HotelService, Area> = {
    ROOM_SERVICE_FOOD: "room-service",
    HOUSEKEEPING: "housekeeping",
    MAINTENANCE: "maintenance",
    CONCIERGE: "concierge",
    LAUNDRY: "laundry",
    SPA: "spa",
    LATE_CHECKOUT: "front-desk",
    WAKE_UP_CALL: "front-desk",
    DO_NOT_DISTURB: "front-desk",
    CALL_WAITER: "table-service",
    REQUEST_BILL: "table-service",
  };

  // Fetch active guest sessions for this venue. Requests whose guestSessionId
  // is not in this set are excluded from the active queue — they belong to a
  // session that has already been closed by staff (checkout or table close).
  // Legacy requests with guestSessionId = null (pre-7.5.15.A data) are also
  // excluded; they remain in the DB for audit and future dashboard filters.
  const activeSessions = await db.guestSession.findMany({
    where: { venueId: venue.id, endedAt: null },
    select: { id: true },
  });
  const activeSessionIds = new Set(activeSessions.map((s) => s.id));

  const combined = [
    ...submittedRes.value,
    ...acknowledgedRes.value,
    ...inProgressRes.value,
  ].filter(
    (r) =>
      r.guestSessionId !== null &&
      r.guestSessionId !== undefined &&
      activeSessionIds.has(r.guestSessionId) &&
      visibleAreas.includes(serviceTypeToArea[r.serviceType])
  );

  return NextResponse.json({ data: combined }, { status: 200 });
}

