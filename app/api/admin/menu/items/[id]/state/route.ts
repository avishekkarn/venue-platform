import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState } from "@/domain/auth/staff.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function domainErrorToStatus(code: DomainErrorCode): number {
  switch (code) {
    case DomainErrorCode.NOT_FOUND:
      return 404;
    case DomainErrorCode.UNAUTHORIZED:
      return 401;
    case DomainErrorCode.FORBIDDEN:
      return 403;
    case DomainErrorCode.VALIDATION_FAILED:
      return 400;
    case DomainErrorCode.CONFLICT:
    case DomainErrorCode.INVALID_STATE:
      return 409;
    case DomainErrorCode.RATE_LIMITED:
      return 429;
    case DomainErrorCode.INTERNAL:
    default:
      return 500;
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const db = testDbClient ?? prisma;

  // 1. Session check: active staff session
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

  // 3. Staff check and admin role verification
  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.UNAUTHORIZED, message: "No active session" } },
      { status: 401 }
    );
  }

  const staff = staffResult.value;
  if (!canAccess(staff.roles, "admin")) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" } },
      { status: 403 }
    );
  }

  // 4. Validate item ID from route params
  const { id } = await context.params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid menu item id format" } },
      { status: 400 }
    );
  }
  const itemId = id.trim();

  // 5. Parse and validate target state (supports JSON and form-urlencoded submissions)
  let targetStateRaw: unknown;
  const contentType = request.headers.get("content-type") ?? "";
  const isFormSubmit =
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data");

  if (isFormSubmit) {
    try {
      const formData = await request.formData();
      targetStateRaw = formData.get("state");
    } catch {
      return NextResponse.json(
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Failed to parse form data" } },
        { status: 400 }
      );
    }
  } else {
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
        { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Request body must be a JSON object" } },
        { status: 400 }
      );
    }

    const body = rawBody as Record<string, unknown>;
    targetStateRaw = body["state"];
  }

  if (
    typeof targetStateRaw !== "string" ||
    (targetStateRaw !== MenuItemState.AVAILABLE &&
      targetStateRaw !== MenuItemState.UNAVAILABLE &&
      targetStateRaw !== MenuItemState.HIDDEN)
  ) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Invalid menu item state. Must be AVAILABLE, UNAVAILABLE, or HIDDEN",
        },
      },
      { status: 400 }
    );
  }

  const targetState = targetStateRaw as MenuItemState;

  // 6. Update item state via MenuRepository
  const menuRepo = createPrismaMenuRepository(db);
  const result = await menuRepo.setItemState(venue.id, itemId, targetState);

  if (!result.ok) {
    const status = domainErrorToStatus(result.error.code);
    return NextResponse.json(
      {
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      },
      { status }
    );
  }

  if (isFormSubmit) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.json({ data: result.value }, { status: 200 });
}

