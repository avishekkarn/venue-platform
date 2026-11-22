import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withAuditedDynamicRoute, type AuditMeta } from "@/infrastructure/audit/with-audit";
import { type ActorResolvers } from "@/infrastructure/audit/logger";
import { getVenueSlug } from "@/infrastructure/config/venue";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authenticateAdmin(db: DbClient) {
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  const session = await validateSession(db, sessionToken);
  if (!session) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(process.env["VENUE_SLUG"] ?? "juniper-house");
  if (!venueResult.ok) {
    return { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" }, status: 500 };
  }
  const venue = venueResult.value;

  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" }, status: 401 };
  }

  if (!canAccess(staff.roles, "admin")) {
    return { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" }, status: 403 };
  }

  return { venue, staff };
}

/**
 * GET /api/admin/staff/[id]/activity
 * Returns detailed shift session history, duty hours breakdown, and operational contributions.
 */
const getHandler = async (
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await authenticateAdmin(db);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { venue } = auth;

  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid staff ID format" } },
      { status: 400 }
    );
  }

  const staffMember = await db.staffMember.findFirst({
    where: { id, venueId: venue.id },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      orderChanges: {
        orderBy: { occurredAt: "desc" },
        take: 15,
        include: {
          order: {
            select: {
              id: true,
              total: true,
              placeType: true,
            },
          },
        },
      },
      requestChanges: {
        orderBy: { occurredAt: "desc" },
        take: 15,
        include: {
          request: {
            select: {
              id: true,
              serviceType: true,
              placeType: true,
            },
          },
        },
      },
      _count: {
        select: {
          orderChanges: true,
          requestChanges: true,
        },
      },
    },
  });

  if (!staffMember) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: "Staff member not found" } },
      { status: 404 }
    );
  }

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Determine online presence: has an un-ended session that is not expired (D-3.2)
  const activeSession = staffMember.sessions.find(
    (s) => s.endedAt === null && (!s.expiresAt || new Date(s.expiresAt).getTime() > now.getTime())
  );
  const isOnline = !!activeSession && staffMember.state === "ACTIVE";

  let activeMinutesToday = 0;
  let activeMinutesWeek = 0;
  let totalHistoricalMinutes = 0;

  const sessionRecords = staffMember.sessions.map((s) => {
    const sStart = new Date(s.createdAt);
    const sEnd = s.endedAt ? new Date(s.endedAt) : now;
    const isLive = s.endedAt === null && (!s.expiresAt || new Date(s.expiresAt).getTime() > now.getTime());
    const durationMs = Math.max(0, sEnd.getTime() - sStart.getTime());
    const durationMinutes = Math.round(durationMs / 60000);

    totalHistoricalMinutes += durationMinutes;

    if (sEnd.getTime() >= startOfToday.getTime()) {
      const overlapStart = Math.max(sStart.getTime(), startOfToday.getTime());
      activeMinutesToday += Math.round(Math.max(0, sEnd.getTime() - overlapStart) / 60000);
    }

    if (sEnd.getTime() >= sevenDaysAgo.getTime()) {
      const overlapStart = Math.max(sStart.getTime(), sevenDaysAgo.getTime());
      activeMinutesWeek += Math.round(Math.max(0, sEnd.getTime() - overlapStart) / 60000);
    }

    return {
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      endedAt: s.endedAt ? s.endedAt.toISOString() : null,
      durationMinutes,
      isLive,
    };
  });

  return NextResponse.json(
    {
      data: {
        staffMember: {
          id: staffMember.id,
          venueId: staffMember.venueId,
          name: staffMember.name,
          username: staffMember.username,
          roles: staffMember.roles as StaffRole[],
          state: staffMember.state as StaffState,
          createdAt: staffMember.createdAt.toISOString(),
          updatedAt: staffMember.updatedAt.toISOString(),
        },
        activity: {
          isOnline,
          shiftStartedAt: activeSession ? activeSession.createdAt.toISOString() : null,
          lastLoginAt: staffMember.sessions[0] ? staffMember.sessions[0].createdAt.toISOString() : null,
          activeHoursTodayMinutes: activeMinutesToday,
          activeHoursWeekMinutes: activeMinutesWeek,
          totalHistoricalHours: Number((totalHistoricalMinutes / 60).toFixed(1)),
          ordersHandledCount: staffMember._count.orderChanges,
          requestsResolvedCount: staffMember._count.requestChanges,
          recentSessions: sessionRecords,
          recentOrderActions: staffMember.orderChanges.map((oc) => ({
            id: oc.id,
            orderId: oc.orderId,
            state: oc.state,
            occurredAt: oc.occurredAt.toISOString(),
            orderTotal: oc.order.total.toString(),
            placeType: oc.order.placeType,
          })),
          recentRequestActions: staffMember.requestChanges.map((rc) => ({
            id: rc.id,
            requestId: rc.requestId,
            state: rc.state,
            occurredAt: rc.occurredAt.toISOString(),
            serviceType: rc.request.serviceType,
            placeType: rc.request.placeType,
          })),
        },
      },
    },
    { status: 200 }
  );
};

const getMeta: AuditMeta = {
  route: "/api/admin/staff/[id]/activity",
  method: "GET",
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

export const GET = withAuditedDynamicRoute<{ id: string }>(
  resolvers,
  getMeta,
  getHandler
);
