/**
 * GET /api/admin/settings/seed-snapshot — download disaster-recovery reference seed snapshot JSON
 * POST /api/admin/settings/seed-snapshot — manually trigger immediate seed snapshot generation
 *
 * Milestone 8.8 (D-8.6).
 * Admin-only (OWNER or MANAGER; LEADER -> 403).
 * Zero guest PII, payment tokens, or order ledgers.
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { resolveAdminContext, adminResolvers, type DbClient } from "@/infrastructure/auth/admin-context";
import { DomainErrorCode } from "@/domain/shared/result";
import { withCsrf } from "@/infrastructure/csrf/with-csrf";
import {
  withAudit,
  type AuditedRouteHandler,
  type AuditMeta,
} from "@/infrastructure/audit/with-audit";
import {
  generateSeedSnapshot,
  writeSeedSnapshot,
  DEFAULT_SEED_SNAPSHOT_PATH,
} from "@/domain/settings";

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

const getHandler: AuditedRouteHandler = async (_request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  try {
    const snapshot = await generateSeedSnapshot(db as any, auth.venue.id);
    const jsonStr = JSON.stringify(snapshot, null, 2);

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="seed-snapshot-${auth.venue.slug}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: err?.message || "Failed to generate snapshot" } },
      { status: 500 }
    );
  }
};

const postHandler: AuditedRouteHandler = async (_request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  try {
    const savedPath = await writeSeedSnapshot(db as any, auth.venue.id);

    return NextResponse.json(
      {
        data: {
          success: true,
          exportedAt: new Date().toISOString(),
          path: DEFAULT_SEED_SNAPSHOT_PATH,
          absolutePath: savedPath,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.INTERNAL, message: err?.message || "Failed to write snapshot" } },
      { status: 500 }
    );
  }
};

const getMeta: AuditMeta = {
  route: "/api/admin/settings/seed-snapshot",
  method: "GET",
};

const postMeta: AuditMeta = {
  route: "/api/admin/settings/seed-snapshot",
  method: "POST",
};

export const GET = withAudit(adminResolvers, getMeta, getHandler);
export const POST = withAudit(adminResolvers, postMeta, withCsrf(postHandler));
