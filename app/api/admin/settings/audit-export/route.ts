/**
 * GET /api/admin/settings/audit-export — stream filtered RFC 4180 audit log CSV
 *
 * Milestone 8.8 (D-9.17, D-12.1).
 * Admin-only (OWNER or MANAGER; LEADER -> 403).
 * Accepts:
 *   - from: YYYY-MM-DD
 *   - to: YYYY-MM-DD
 *   - audience: USER | STAFF | ADMIN | SYSTEM | ALL (optional, default: ALL)
 * Rejects date ranges > 180 days (D-12.1).
 * Records run in ReportRun table (reportType: "audit_export").
 */

import { NextResponse, type NextRequest } from "next/server";
import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { resolveAdminContext, adminResolvers, type DbClient } from "@/infrastructure/auth/admin-context";
import { DomainErrorCode } from "@/domain/shared/result";
import { listAuditFiles } from "@/infrastructure/audit/collect";
import { resolveAuditAudience, type AuditMeta, withAudit } from "@/infrastructure/audit/with-audit";
import { type AuditEvent, type AuditAudience } from "@/infrastructure/audit/logger";
import { readFileSync } from "node:fs";

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const getHandler = async (request: NextRequest): Promise<NextResponse> => {
  const db = testDbClient ?? prisma;
  const auth = await resolveAdminContext(db);
  if (!auth.ok) {
    return NextResponse.json({ error: { code: auth.code, message: auth.message } }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const audienceParam = searchParams.get("audience") ?? "ALL";

  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Missing required query parameters: from, to" } },
      { status: 400 }
    );
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fromParam) || !dateRegex.test(toParam)) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Dates must be in YYYY-MM-DD format" } },
      { status: 400 }
    );
  }

  const fromDate = new Date(`${fromParam}T00:00:00.000Z`);
  const toDate = new Date(`${toParam}T23:59:59.999Z`);

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Invalid date parameter values" } },
      { status: 400 }
    );
  }

  if (fromDate > toDate) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "'from' date cannot be after 'to' date" } },
      { status: 400 }
    );
  }

  // Range limit: 180 days (D-12.1)
  const diffDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 180) {
    return NextResponse.json(
      { error: { code: DomainErrorCode.VALIDATION_FAILED, message: "Date range cannot exceed 180 days (D-12.1)" } },
      { status: 400 }
    );
  }

  // Validate audience
  const validAudiences: AuditAudience[] = ["USER", "STAFF", "ADMIN", "SYSTEM"];
  let audienceFilter: AuditAudience | null = null;
  if (audienceParam !== "ALL") {
    if (!validAudiences.includes(audienceParam as AuditAudience)) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: `Invalid audience parameter. Allowed values: ALL, ${validAudiences.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }
    audienceFilter = audienceParam as AuditAudience;
  }

  // Read matching audit log files
  const files = listAuditFiles();
  const matchedEvents: AuditEvent[] = [];

  for (const file of files) {
    // Filename format: YYYY-MM-DD.jsonl
    const fileDateStr = file.name.replace(".jsonl", "");
    if (fileDateStr < fromParam || fileDateStr > toParam) {
      continue;
    }

    try {
      const content = readFileSync(file.path, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line) as AuditEvent;
          const evtTime = new Date(evt.timestamp).getTime();
          if (evtTime >= fromDate.getTime() && evtTime <= toDate.getTime()) {
            // Check venue scoping if present on event
            if (evt.venueId && evt.venueId !== auth.venue.id) {
              continue;
            }
            const evtAudience = evt.audience ?? resolveAuditAudience(evt.route, evt.actorType);
            if (!audienceFilter || evtAudience === audienceFilter) {
              matchedEvents.push({
                ...evt,
                audience: evtAudience,
              });
            }
          }
        } catch {
          // Ignore corrupt line
        }
      }
    } catch {
      // Ignore unreadable file
    }
  }

  // Sort events chronologically
  matchedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Record audit export run in ReportRun (D-9.17)
  try {
    await db.reportRun.create({
      data: {
        venueId: auth.venue.id,
        view: "audit_export",
        paramsJson: { from: fromParam, to: toParam, audience: audienceParam },
        rowCount: matchedEvents.length,
        ranByStaffId: auth.staff.id,
      },
    });
  } catch (err) {
    console.error("[AuditExport] Failed to record ReportRun:", err);
  }

  // Format RFC 4180 CSV
  const headers = ["Timestamp", "Audience", "ActorType", "ActorId", "ActorRole", "Route", "Method", "Status", "LatencyMs", "IP"];
  const rows: string[] = [headers.join(",")];

  for (const evt of matchedEvents) {
    const row = [
      escapeCsvCell(evt.timestamp),
      escapeCsvCell(evt.audience ?? "SYSTEM"),
      escapeCsvCell(evt.actorType),
      escapeCsvCell(evt.actorId),
      escapeCsvCell(evt.actorRole),
      escapeCsvCell(evt.route),
      escapeCsvCell(evt.method),
      escapeCsvCell(evt.status),
      escapeCsvCell(evt.latencyMs),
      escapeCsvCell(evt.ip),
    ];
    rows.push(row.join(","));
  }

  const csvContent = rows.join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit_export_${fromParam}_to_${toParam}.csv"`,
    },
  });
};

const getMeta: AuditMeta = {
  route: "/api/admin/settings/audit-export",
  method: "GET",
};

export const GET = withAudit(adminResolvers, getMeta, getHandler);
