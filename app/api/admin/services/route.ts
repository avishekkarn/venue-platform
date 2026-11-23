/**
 * GET /api/admin/services — list venue hotel service toggles (D-9.6)
 * PATCH /api/admin/services — update hotel service toggle state
 *
 * Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), CSRF-protected on PATCH (withCsrf).
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma, HotelService } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { resolveAdminContext, adminResolvers, type DbClient } from "@/infrastructure/auth/admin-context";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import { triggerDebouncedSeedSnapshot } from "@/domain/settings";

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const ALL_SERVICES: HotelService[] = [
  HotelService.ROOM_SERVICE_FOOD,
  HotelService.HOUSEKEEPING,
  HotelService.MAINTENANCE,
  HotelService.CONCIERGE,
  HotelService.LAUNDRY,
  HotelService.SPA,
  HotelService.LATE_CHECKOUT,
  HotelService.WAKE_UP_CALL,
  HotelService.DO_NOT_DISTURB,
  HotelService.CALL_WAITER,
  HotelService.REQUEST_BILL,
];

const getHandler: AuditedRouteHandler = async (_request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const existing = await db.venueServiceToggle.findMany({
    where: { venueId: auth.venue.id },
  });

  const toggleMap = new Map<HotelService, boolean>(existing.map((t) => [t.service, t.isEnabled]));

  const data = ALL_SERVICES.map((srv) => ({
    service: srv,
    isEnabled: toggleMap.get(srv) ?? false,
  }));

  return NextResponse.json({ data }, { status: 200 });
};

const patchHandler: AuditedRouteHandler = async (request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  let rawBody: Record<string, unknown>;
  try {
    rawBody = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Malformed JSON body" } },
      { status: 400 }
    );
  }

  const serviceName = rawBody.service as string;
  const isEnabled = rawBody.isEnabled;

  if (!serviceName || !ALL_SERVICES.includes(serviceName as HotelService)) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: `Invalid service. Allowed services: ${ALL_SERVICES.join(", ")}`,
        },
      },
      { status: 400 }
    );
  }

  if (typeof isEnabled !== "boolean") {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "isEnabled must be a boolean" } },
      { status: 400 }
    );
  }

  const updated = await db.venueServiceToggle.upsert({
    where: {
      venueId_service: {
        venueId: auth.venue.id,
        service: serviceName as HotelService,
      },
    },
    update: { isEnabled },
    create: {
      venueId: auth.venue.id,
      service: serviceName as HotelService,
      isEnabled,
    },
  });

  triggerDebouncedSeedSnapshot(db as any, auth.venue.id);

  return NextResponse.json(
    {
      data: {
        service: updated.service,
        isEnabled: updated.isEnabled,
      },
    },
    { status: 200 }
  );
};

const getMeta: AuditMeta = {
  route: "/api/admin/services",
  method: "GET",
};

const patchMeta: AuditMeta = {
  route: "/api/admin/services",
  method: "PATCH",
};

export const GET = withAudit(adminResolvers, getMeta, getHandler);
export const PATCH = withAudit(adminResolvers, patchMeta, withCsrf(patchHandler));
