import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { generateToken } from "@/domain/qr/generate-token";
import { PlaceType, type GenerateTokenInput } from "@/domain/qr/qr-token.repository";
import { DomainErrorCode } from "@/domain/shared/result";
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

const routeHandler: AuditedRouteHandler = async (request: NextRequest) => {
  const db = testDbClient ?? prisma;

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

  // 2. Resolve venue
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

  // 3. Staff check and role check
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok) {
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
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 4. Body parsing and validation
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid place details" } },
      { status: 400 }
    );
  }

  const bodyRecord = rawBody as Record<string, unknown>;
  const placeType = bodyRecord["placeType"];

  if (
    placeType !== PlaceType.TABLE &&
    placeType !== PlaceType.ROOM &&
    placeType !== PlaceType.COUNTER
  ) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid place details" } },
      { status: 400 }
    );
  }

  let tokenInput: GenerateTokenInput;

  if (placeType === PlaceType.TABLE) {
    const tableId = bodyRecord["tableId"];
    if (
      typeof tableId !== "string" ||
      !tableId.trim() ||
      "roomId" in bodyRecord ||
      "counterId" in bodyRecord
    ) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid place details" } },
        { status: 400 }
      );
    }
    tokenInput = {
      venueId: venue.id,
      placeType: PlaceType.TABLE,
      tableId: tableId.trim(),
    };
  } else if (placeType === PlaceType.ROOM) {
    const roomId = bodyRecord["roomId"];
    if (
      typeof roomId !== "string" ||
      !roomId.trim() ||
      "tableId" in bodyRecord ||
      "counterId" in bodyRecord
    ) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid place details" } },
        { status: 400 }
      );
    }
    tokenInput = {
      venueId: venue.id,
      placeType: PlaceType.ROOM,
      roomId: roomId.trim(),
    };
  } else {
    const counterId = bodyRecord["counterId"];
    if (
      typeof counterId !== "string" ||
      !counterId.trim() ||
      "tableId" in bodyRecord ||
      "roomId" in bodyRecord
    ) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid place details" } },
        { status: 400 }
      );
    }
    tokenInput = {
      venueId: venue.id,
      placeType: PlaceType.COUNTER,
      counterId: counterId.trim(),
    };
  }

  // 5. Domain call
  const qrTokenRepo = createPrismaQrTokenRepository(db);
  const result = await generateToken({ qrTokenRepo }, tokenInput);

  if (!result.ok) {
    const status =
      result.error.code === DomainErrorCode.VALIDATION_FAILED
        ? 400
        : 500;
    return NextResponse.json(
      { error: { code: result.error.code, message: result.error.message } },
      { status }
    );
  }

  const token = result.value;

  // 6. Return success envelope
  return NextResponse.json(
    {
      data: {
        id: token.id,
        token: token.token,
        venueId: token.venueId,
        placeType: token.placeType,
        state: token.state,
        createdAt: token.createdAt.toISOString(),
      },
    },
    { status: 201 }
  );
};

const meta: AuditMeta = {
  route: "/api/admin/qr/generate",
  method: "POST",
};

const resolvers: ActorResolvers = {
  resolveStaff: async () => {
    const db = testDbClient ?? prisma;
    const token = await getSessionCookie();
    if (!token) return null;
    const session = await validateSession(db, token);
    if (!session) return null;
    const venueRepo = createPrismaVenueRepository(db);
    const venueResult = await venueRepo.findBySlug(
      process.env["VENUE_SLUG"] ?? "juniper-house"
    );
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
  resolveGuest: async () => {
    // The admin QR generate route is staff-only; a guest cookie is not
    // meaningful here. Return null — the wrapper logs `anonymous` if no
    // staff actor is resolved. If a future session ever needs a guest
    // actor for a route like this, it will add the guest session repo
    // lookup here.
    return null;
  },
};

export const POST = withAudit(resolvers, meta, routeHandler);
