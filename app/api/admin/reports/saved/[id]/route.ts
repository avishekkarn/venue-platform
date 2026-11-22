/**
 * DELETE /api/admin/reports/saved/[id] — Delete a saved report configuration.
 *
 * Governed by:
 * - DECISIONS.md D-12.7 (venue-scoped saved reports).
 * - DECISIONS.md D-10.2 (strict venue scoping).
 * - DECISIONS.md D-20.1 (DELETE protected by withCsrf).
 * - BUILD.md §6.11 (withAuditedDynamicRoute audit trail).
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
  withAuditedDynamicRoute,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import type { ActorResolvers } from "@/infrastructure/audit/logger";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteParams = { id: string };

const deleteHandler = async (
  _request: NextRequest,
  context: { params: Promise<RouteParams> }
): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const { id } = await context.params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid saved report ID" } },
      { status: 400 }
    );
  }

  // 1. Session check
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  // 2. Venue check
  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: "Venue not configured" } },
      { status: 500 }
    );
  }
  const venue = venueResult.value;

  // 3. Staff check
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
    if (staffResult.error.code === DomainErrorCode.NOT_FOUND) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.NOT_FOUND, message: "Staff not found in venue" } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  const staff = staffResult.value;
  if (staff.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }
  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Admin role required" } },
      { status: 403 }
    );
  }

  // 4. Verify existence within venue
  const existing = await db.savedReport.findFirst({
    where: { id, venueId: venue.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: `Saved report '${id}' not found` } },
      { status: 404 }
    );
  }

  await db.savedReport.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true, data: { id } }, { status: 200 });
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

const deleteMeta: AuditMeta = {
  route: "/api/admin/reports/saved/[id]",
  method: "DELETE",
};

export const DELETE = withAuditedDynamicRoute<RouteParams>(
  resolvers,
  deleteMeta,
  withCsrf(deleteHandler)
);
