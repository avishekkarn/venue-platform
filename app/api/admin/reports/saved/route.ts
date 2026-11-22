/**
 * GET & POST /api/admin/reports/saved — Manage anytime-access saved report configurations.
 *
 * Governed by:
 * - DECISIONS.md D-12.7 (venue-scoped saved reports, params only, audit trail).
 * - DECISIONS.md D-10.2 (strict venue scoping).
 * - DECISIONS.md D-20.1 (POST protected by withCsrf).
 * - BUILD.md §6.11 (withAudit logging).
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
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import type { ActorResolvers } from "@/infrastructure/audit/logger";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const SUPPORTED_VIEWS = new Set<string>([
  "revenue",
  "sales",
  "funnel",
  "requests",
  "utilization",
  "qr",
  "payment",
  "audit",
  "heatmap",
  "matrix",
  "modifiers",
  "tax",
  "cancellations",
  "sla",
  "folio",
  "occupancy",
  "conversion",
]);

async function resolveStaffAndVenue(db: DbClient) {
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
  if (!staffResult.ok) {
    if (staffResult.error.code === DomainErrorCode.NOT_FOUND) {
      return { ok: false as const, status: 404, code: DomainErrorCode.NOT_FOUND, message: "Staff not found in venue" };
    }
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  if (!canAccess(staff.roles, "admin")) {
    return { ok: false as const, status: 403, code: DomainErrorCode.FORBIDDEN, message: "Admin role required" };
  }

  return { ok: true as const, venue, staff };
}

const getHandler: AuditedRouteHandler = async (_request: NextRequest) => {
  const db = testDbClient ?? prisma;
  const auth = await resolveStaffAndVenue(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const reports = await db.savedReport.findMany({
    where: { venueId: auth.venue.id },
    include: {
      createdByStaff: {
        select: { id: true, name: true, username: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    data: reports.map((r) => ({
      id: r.id,
      name: r.name,
      view: r.view,
      params: r.paramsJson,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      createdBy: r.createdByStaff
        ? { id: r.createdByStaff.id, name: r.createdByStaff.name, username: r.createdByStaff.username }
        : null,
    })),
  });
};

const postHandler = async (request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveStaffAndVenue(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Request body required" } },
      { status: 400 }
    );
  }

  const { name, view, params } = body as {
    name?: unknown;
    view?: unknown;
    params?: unknown;
  };

  if (typeof name !== "string" || name.trim() === "") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Report name is required" } },
      { status: 400 }
    );
  }

  if (typeof view !== "string" || !SUPPORTED_VIEWS.has(view)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: `Unsupported report view: '${String(view)}'` } },
      { status: 400 }
    );
  }

  // Check unique name per venue
  const existing = await db.savedReport.findFirst({
    where: { venueId: auth.venue.id, name: name.trim() },
  });
  if (existing) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.CONFLICT, message: `A saved report named '${name.trim()}' already exists` } },
      { status: 409 }
    );
  }

  const saved = await db.savedReport.create({
    data: {
      venueId: auth.venue.id,
      name: name.trim(),
      view: view.trim(),
      paramsJson: (params ?? {}) as Prisma.InputJsonValue,
      createdByStaffId: auth.staff.id,
    },
    include: {
      createdByStaff: {
        select: { id: true, name: true, username: true },
      },
    },
  });

  return NextResponse.json(
    {
      ok: true,
      data: {
        id: saved.id,
        name: saved.name,
        view: saved.view,
        params: saved.paramsJson,
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString(),
        createdBy: saved.createdByStaff
          ? { id: saved.createdByStaff.id, name: saved.createdByStaff.name, username: saved.createdByStaff.username }
          : null,
      },
    },
    { status: 201 }
  );
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
    const staffResult = await staffRepo.findById(venueResult.value.id, session.staffMemberId);
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

const getMeta: AuditMeta = {
  route: "/api/admin/reports/saved",
  method: "GET",
};

const postMeta: AuditMeta = {
  route: "/api/admin/reports/saved",
  method: "POST",
};

export const GET = withAudit(resolvers, getMeta, getHandler);
export const POST = withAudit(resolvers, postMeta, withCsrf(postHandler));
