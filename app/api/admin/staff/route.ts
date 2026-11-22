import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma, StaffRole as PrismaStaffRole, StaffState as PrismaStaffState } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withAudit, type AuditMeta, type AuditedRouteHandler } from "@/infrastructure/audit/with-audit";
import { type ActorResolvers } from "@/infrastructure/audit/logger";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import { hashPassword } from "@/infrastructure/auth/password";
import { getVenueSlug } from "@/infrastructure/config/venue";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

const ALL_STAFF_ROLES = new Set<string>(Object.values(StaffRole));

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
 * GET /api/admin/staff
 * Lists staff members with online presence, active duty hours, and summary statistics.
 */
const getHandler: AuditedRouteHandler = async (request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await authenticateAdmin(db);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { venue } = auth;

  const searchParams = request.nextUrl.searchParams;
  const roleFilter = searchParams.get("role");
  const stateFilter = searchParams.get("state");
  const onlineFilter = searchParams.get("online");
  const searchQuery = searchParams.get("search")?.toLowerCase().trim();

  // Fetch all staff members for the venue with sessions and activity counts
  const rawStaffList = await db.staffMember.findMany({
    where: { venueId: venue.id },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: {
        select: {
          orderChanges: true,
          requestChanges: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const roleCounts: Record<string, number> = {};
  for (const r of Object.values(StaffRole)) {
    roleCounts[r] = 0;
  }

  let totalStaff = 0;
  let activeStaff = 0;
  let deactivatedStaff = 0;
  let onlineStaff = 0;

  const staffItems = rawStaffList.map((m) => {
    totalStaff++;
    if (m.state === "ACTIVE") activeStaff++;
    if (m.state === "DEACTIVATED") deactivatedStaff++;

    for (const r of m.roles) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }

    // Determine online presence: has an un-ended session created within last 24h
    const activeSession = m.sessions.find(
      (s) => s.endedAt === null && new Date(s.createdAt).getTime() >= twentyFourHoursAgo.getTime()
    );
    const isOnline = !!activeSession && m.state === "ACTIVE";
    if (isOnline) onlineStaff++;

    const lastSession = m.sessions[0];
    const lastLoginAt = lastSession ? lastSession.createdAt.toISOString() : null;

    // Calculate active hours today and this week
    let activeMinutesToday = 0;
    let activeMinutesWeek = 0;
    let totalHistoricalMinutes = 0;

    for (const s of m.sessions) {
      const sStart = new Date(s.createdAt);
      const sEnd = s.endedAt ? new Date(s.endedAt) : now;
      const durationMs = Math.max(0, sEnd.getTime() - sStart.getTime());
      const durationMins = Math.round(durationMs / 60000);

      totalHistoricalMinutes += durationMins;

      // Overlap with today
      if (sEnd.getTime() >= startOfToday.getTime()) {
        const overlapStart = Math.max(sStart.getTime(), startOfToday.getTime());
        const overlapDuration = Math.max(0, sEnd.getTime() - overlapStart);
        activeMinutesToday += Math.round(overlapDuration / 60000);
      }

      // Overlap with 7-day window
      if (sEnd.getTime() >= sevenDaysAgo.getTime()) {
        const overlapStart = Math.max(sStart.getTime(), sevenDaysAgo.getTime());
        const overlapDuration = Math.max(0, sEnd.getTime() - overlapStart);
        activeMinutesWeek += Math.round(overlapDuration / 60000);
      }
    }

    return {
      id: m.id,
      venueId: m.venueId,
      name: m.name,
      username: m.username,
      roles: m.roles as StaffRole[],
      state: m.state as StaffState,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      isOnline,
      lastLoginAt,
      activeSessionId: activeSession ? activeSession.id : null,
      shiftStartedAt: activeSession ? activeSession.createdAt.toISOString() : null,
      activeHoursTodayMinutes: activeMinutesToday,
      activeHoursWeekMinutes: activeMinutesWeek,
      totalHistoricalHours: Number((totalHistoricalMinutes / 60).toFixed(1)),
      ordersHandledCount: m._count.orderChanges,
      requestsResolvedCount: m._count.requestChanges,
    };
  });

  // Apply filters
  let filteredStaff = staffItems;

  if (roleFilter && roleFilter !== "ALL") {
    filteredStaff = filteredStaff.filter((s) => s.roles.includes(roleFilter as StaffRole));
  }
  if (stateFilter && stateFilter !== "ALL") {
    filteredStaff = filteredStaff.filter((s) => s.state === stateFilter);
  }
  if (onlineFilter === "true") {
    filteredStaff = filteredStaff.filter((s) => s.isOnline);
  } else if (onlineFilter === "false") {
    filteredStaff = filteredStaff.filter((s) => !s.isOnline);
  }
  if (searchQuery) {
    filteredStaff = filteredStaff.filter(
      (s) => s.name.toLowerCase().includes(searchQuery) || s.username.toLowerCase().includes(searchQuery)
    );
  }

  return NextResponse.json(
    {
      data: {
        staff: filteredStaff,
        summary: {
          totalStaff,
          activeStaff,
          deactivatedStaff,
          onlineStaff,
          roleCounts,
        },
      },
    },
    { status: 200 }
  );
};

/**
 * POST /api/admin/staff
 * Creates a new staff member with hashed credentials and assigned roles.
 */
const postHandler: AuditedRouteHandler = async (request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await authenticateAdmin(db);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { venue } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Body must be an object" } },
      { status: 400 }
    );
  }

  const { name, username, password, roles } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Name must be between 2 and 60 characters" } },
      { status: 400 }
    );
  }

  const cleanUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
  if (!USERNAME_REGEX.test(cleanUsername)) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Username must be 3-30 characters with lowercase letters, numbers, and underscores only",
        },
      },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Password must be at least 8 characters" } },
      { status: 400 }
    );
  }

  if (!Array.isArray(roles) || roles.length === 0) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "At least one role must be assigned" } },
      { status: 400 }
    );
  }

  for (const r of roles) {
    if (typeof r !== "string" || !ALL_STAFF_ROLES.has(r)) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: `Invalid role: '${r}'` } },
        { status: 400 }
      );
    }
  }

  const staffRepo = createPrismaStaffRepository(db);
  const passwordHash = await hashPassword(password);

  const result = await staffRepo.create({
    venueId: venue.id,
    name: name.trim(),
    username: cleanUsername,
    passwordHash,
    roles: roles as StaffRole[],
  });

  if (!result.ok) {
    if (result.error.code === DomainErrorCode.CONFLICT) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.CONFLICT, message: `Username '${cleanUsername}' is already taken` } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      data: {
        id: result.value.id,
        venueId: result.value.venueId,
        name: result.value.name,
        username: result.value.username,
        roles: result.value.roles,
        state: result.value.state,
        createdAt: result.value.createdAt.toISOString(),
        updatedAt: result.value.updatedAt.toISOString(),
      },
    },
    { status: 201 }
  );
};

const getMeta: AuditMeta = { route: "/api/admin/staff", method: "GET" };
const postMeta: AuditMeta = { route: "/api/admin/staff", method: "POST" };

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
export const POST = withAudit(resolvers, postMeta, withCsrf(postHandler));
