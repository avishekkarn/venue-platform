/**
 * Pure domain calculator: Per-Record Audit Export (View 8).
 *
 * Headers: Timestamp,Record Type,Entity ID,Target State,Staff Name,Staff Username,Note
 * Governed by D-4.9, D-3.7, and D-12.4 (strictly per-record audit only; no aggregate staff surveillance).
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type AuditExportRow } from "./types";

export interface AuditEventInput {
  readonly timestamp: Date | string;
  readonly recordType: "ORDER" | "SERVICE_REQUEST";
  readonly entityId: string;
  readonly targetState: string;
  readonly staffName?: string | null;
  readonly staffUsername?: string | null;
  readonly note?: string | null;
}

export function generateAuditExport(
  events: readonly AuditEventInput[]
): Result<AuditExportRow[]> {
  if (!Array.isArray(events)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Events must be an array");
  }

  const rows: AuditExportRow[] = events.map((e) => {
    const t = e.timestamp instanceof Date ? e.timestamp : new Date(e.timestamp);
    const iso = isNaN(t.getTime()) ? "-" : t.toISOString();

    return {
      timestamp: iso,
      recordType: e.recordType,
      entityId: e.entityId,
      targetState: e.targetState,
      staffName: e.staffName?.trim() || "System",
      staffUsername: e.staffUsername?.trim() ? `@${e.staffUsername.trim().replace(/^@/, "")}` : "system",
      note: e.note?.trim() || "-",
    };
  });

  rows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return ok(rows);
}
