/**
 * Audit log collection — reads the JSON-lines files from the audit directory
 * and prepares them for ZIP streaming.
 *
 * Phase 7.7.1b. The export route (`app/api/admin/audit/export/route.ts`)
 * calls `listAuditFiles()` to enumerate the files, and then streams each
 * one's contents into the `archiver` instance it constructs.
 *
 * Design rules:
 * - Read-only. This module never writes to the audit directory; writes are
 *   `logger.ts`'s job (`writeAudit`).
 * - No `archiver` import. The stream assembly lives in the route, not here.
 *   This module returns `{ name: string; path: string }[]` — plain data — so
 *   it is trivially testable and trivially mockable.
 * - Reads only `.jsonl` files (the audit format's contract). A stray
 *   `.DS_Store` or a partial `.tmp` is ignored. The ZIP an admin downloads
 *   is the audit record; a non-audit file would be a liability.
 * - Sorts by filename (which sorts by date, because the format is
 *   `YYYY-MM-DD.jsonl`). Oldest first.
 *
 * Reference: ROADMAP.md §11 (Milestone 7.7.1b), WIRING.md W-0021.
 */

import { readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * The audit directory the process is configured to read from. Mirrors
 * `logger.ts`'s `auditDir()` rule exactly — same env var, same default.
 */
function auditDir(): string {
  const envDir = process.env["AUDIT_LOG_DIR"];
  return envDir && envDir.trim().length > 0 ? envDir.trim() : "logs/audit";
}

/**
 * One audit file: its display name inside the ZIP, and its path on disk.
 */
export interface AuditFile {
  readonly name: string;
  readonly path: string;
}

/**
 * Lists the audit files in the audit directory. Returns an empty array if
 * the directory does not exist. Sorted by filename (chronological).
 */
export function listAuditFiles(): readonly AuditFile[] {
  const dir = auditDir();
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter((name) => name.endsWith(".jsonl"))
    .sort()
    .map((name) => ({ name, path: join(dir, name) }));
}

