/**
 * GET /api/admin/modules — list venue module toggles (D-9.6)
 * PATCH /api/admin/modules — update module toggle state
 *
 * Admin-only (OWNER or MANAGER; LEADER -> 403),
 * audited (withAudit), CSRF-protected on PATCH (withCsrf).
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma, VenueModule } from "@prisma/client";
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

const ALL_MODULES: VenueModule[] = [
  VenueModule.TABLE,
  VenueModule.ROOM,
  VenueModule.COUNTER,
  VenueModule.KITCHEN,
];

const getHandler: AuditedRouteHandler = async (_request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const existing = await db.venueModuleToggle.findMany({
    where: { venueId: auth.venue.id },
  });

  const toggleMap = new Map<VenueModule, boolean>(existing.map((t) => [t.module, t.isEnabled]));

  const data = ALL_MODULES.map((mod) => ({
    module: mod,
    isEnabled: toggleMap.get(mod) ?? false,
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

  const moduleName = rawBody.module as string;
  const isEnabled = rawBody.isEnabled;

  if (!moduleName || !ALL_MODULES.includes(moduleName as VenueModule)) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: `Invalid module. Allowed modules: ${ALL_MODULES.join(", ")}`,
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

  const updated = await db.venueModuleToggle.upsert({
    where: {
      venueId_module: {
        venueId: auth.venue.id,
        module: moduleName as VenueModule,
      },
    },
    update: { isEnabled },
    create: {
      venueId: auth.venue.id,
      module: moduleName as VenueModule,
      isEnabled,
    },
  });

  triggerDebouncedSeedSnapshot(db as any, auth.venue.id);

  return NextResponse.json(
    {
      data: {
        module: updated.module,
        isEnabled: updated.isEnabled,
      },
    },
    { status: 200 }
  );
};

const getMeta: AuditMeta = {
  route: "/api/admin/modules",
  method: "GET",
};

const patchMeta: AuditMeta = {
  route: "/api/admin/modules",
  method: "PATCH",
};

export const GET = withAudit(adminResolvers, getMeta, getHandler);
export const PATCH = withAudit(adminResolvers, patchMeta, withCsrf(patchHandler));
