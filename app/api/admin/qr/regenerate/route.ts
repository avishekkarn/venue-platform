/**
 * POST /api/admin/qr/regenerate — atomically revoke current QR and issue fresh active QR
 *
 * Milestone 8.5.10b. Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), CSRF-protected (withCsrf).
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
import { StaffState } from "@/domain/auth/staff.repository";
import { PlaceType } from "@/domain/qr/qr-token.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import type { ActorResolvers } from "@/infrastructure/audit/logger";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveAdmin(db: DbClient) {
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
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return { ok: false as const, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  if (!canAccess(staffResult.value.roles, "admin")) {
    return { ok: false as const, status: 403, code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" };
  }

  return { ok: true as const, venue, staff: staffResult.value };
}

const postHandler: AuditedRouteHandler = async (request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const { placeType, placeId } = rawBody as { placeType?: unknown; placeId?: unknown };

  if (
    placeType !== PlaceType.TABLE &&
    placeType !== PlaceType.ROOM &&
    placeType !== PlaceType.COUNTER
  ) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid placeType" } },
      { status: 400 }
    );
  }

  if (typeof placeId !== "string" || !UUID_REGEX.test(placeId)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid placeId" } },
      { status: 400 }
    );
  }

  const auth = await resolveAdmin(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  // Verify place existence
  if (placeType === PlaceType.TABLE) {
    const table = await db.table.findFirst({
      where: { id: placeId, venueId: auth.venue.id },
    });
    if (!table) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.NOT_FOUND, message: `Table '${placeId}' not found` } },
        { status: 404 }
      );
    }
  } else if (placeType === PlaceType.ROOM) {
    const room = await db.room.findFirst({
      where: { id: placeId, venueId: auth.venue.id },
    });
    if (!room) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.NOT_FOUND, message: `Room '${placeId}' not found` } },
        { status: 404 }
      );
    }
  } else {
    const counter = await db.counter.findFirst({
      where: { id: placeId, venueId: auth.venue.id },
    });
    if (!counter) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.NOT_FOUND, message: `Counter '${placeId}' not found` } },
        { status: 404 }
      );
    }
  }

  // Atomic revoke + create
  const executeRegenerate = async (tx: PrismaClient | Prisma.TransactionClient) => {
    // 1. Revoke existing active tokens for this place
    const whereTarget: Prisma.QrTokenWhereInput = {
      venueId: auth.venue.id,
      state: "ACTIVE",
      ...(placeType === PlaceType.TABLE ? { tableId: placeId } : {}),
      ...(placeType === PlaceType.ROOM ? { roomId: placeId } : {}),
      ...(placeType === PlaceType.COUNTER ? { counterId: placeId } : {}),
    };

    await tx.qrToken.updateMany({
      where: whereTarget,
      data: {
        state: "REVOKED",
        revokedAt: new Date(),
      },
    });

    // 2. Create fresh active token
    const created = await tx.qrToken.create({
      data: {
        venueId: auth.venue.id,
        placeType: placeType,
        tableId: placeType === PlaceType.TABLE ? placeId : null,
        roomId: placeType === PlaceType.ROOM ? placeId : null,
        counterId: placeType === PlaceType.COUNTER ? placeId : null,
        state: "ACTIVE",
      },
    });

    return created;
  };

  const newToken =
    "$transaction" in db && typeof db.$transaction === "function"
      ? await db.$transaction(async (tx) => executeRegenerate(tx))
      : await executeRegenerate(db);

  return NextResponse.json(
    {
      data: {
        id: newToken.id,
        token: newToken.token,
        venueId: newToken.venueId,
        placeType: newToken.placeType,
        tableId: newToken.tableId,
        roomId: newToken.roomId,
        counterId: newToken.counterId,
        state: newToken.state,
        createdAt: newToken.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
};

const postMeta: AuditMeta = { route: "/api/admin/qr/regenerate", method: "POST" };

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

export const POST = withAudit(resolvers, postMeta, withCsrf(postHandler));
