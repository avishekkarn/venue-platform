import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { revokeToken } from "@/domain/qr/revoke-token";
import { invalidateSessionsForPlace } from "@/domain/guest/guest-session.service";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  // 4. Validate id param
  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid token format" } },
      { status: 400 }
    );
  }

  // 5. Cross-venue guard & token lookup
  // Read token row directly with the scoped db client to ensure venue scoping
  const tokenRow = await db.qrToken.findUnique({
    where: { id },
  });

  if (!tokenRow || tokenRow.venueId !== venue.id) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.NOT_FOUND, message: "QR token not found" } },
      { status: 404 }
    );
  }

  // 6. Call revokeToken domain function
  const qrTokenRepo = createPrismaQrTokenRepository(db);
  const revokeResult = await revokeToken({ qrTokenRepo }, id);

  if (!revokeResult.ok) {
    if (revokeResult.error.code === DomainErrorCode.NOT_FOUND) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.NOT_FOUND, message: "QR token not found" } },
        { status: 404 }
      );
    }
    if (revokeResult.error.code === DomainErrorCode.INVALID_STATE) {
      return NextResponse.json(
        { error: { code: DomainErrorCode.INVALID_STATE, message: "QR token is already revoked" } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: revokeResult.error.code, message: revokeResult.error.message } },
      { status: 500 }
    );
  }

  // 7. Compose invalidateSessionsForPlace best-effort
  const guestSessionRepo = createPrismaGuestSessionRepository(db);
  const placeId =
    tokenRow.placeType === "TABLE"
      ? tokenRow.tableId
      : tokenRow.placeType === "ROOM"
      ? tokenRow.roomId
      : tokenRow.counterId;

  if (placeId) {
    try {
      const invalidateResult = await invalidateSessionsForPlace(
        { repo: guestSessionRepo },
        venue.id,
        tokenRow.placeType as PlaceType,
        placeId
      );
      if (!invalidateResult.ok) {
        console.error(
          `[revoke] invalidateSessionsForPlace returned ${invalidateResult.error.code}: ${invalidateResult.error.message}`
        );
      }
    } catch (err: unknown) {
      console.error("[revoke] Failed to invalidate guest sessions for place:", err);
    }
  }

  // Fetch updated row to get revokedAt timestamp
  const updatedRow = await db.qrToken.findUnique({
    where: { id },
  });

  return NextResponse.json(
    {
      data: {
        id,
        state: "REVOKED",
        revokedAt: updatedRow?.revokedAt ? updatedRow.revokedAt.toISOString() : new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}
