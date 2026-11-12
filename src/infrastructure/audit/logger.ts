/**
 * Request-level audit logger — structured JSON-lines, one file per calendar day.
 *
 * Phase 7.7.1 (the file-based logger). 7.7.1a adds the `withAudit` wrapper;
 * 7.7.1b adds the export route; 7.7.1c applies the wrapper to the gold-standard
 * route; 7.7.1d verifies end-to-end.
 *
 * Design rules (each traced):
 * - One JSON object per line, one file per UTC calendar day. Grep-friendly,
 *   tail-friendly, and readable in Notepad (Phase 7.7's brief).
 * - Append-only. The logger never reads its own output (the export route in
 *   7.7.1b reads; the logger does not). This is why the logger has no `read`
 *   or `list` function.
 * - The logger never throws. A failing write is logged once to `console.error`
 *   and swallowed. A missing audit line must never break a live request
 *   (SYSTEM.md §16.3 — programming errors are caught, not propagated).
 * - The logger is the only file in `src/infrastructure/audit/` that imports
 *   `fs`. `with-audit.ts` (7.7.1a) is a caller, not a writer.
 * - `AUDIT_LOG_DIR` overrides the default so the integration tests can write
 *   to a temporary directory without ever touching `./logs/audit/`.
 *
 * Reference: ROADMAP.md §11 (Milestone 7.7.1), WIRING.md W-0021,
 * SYSTEM.md §15.1 (what is trusted), SYSTEM.md §16.3 (programming errors).
 */

import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The actor classification stored with every audit line.
 *
 * - "staff"     — a validated staff session (see `getSessionCookie` +
 *                 `validateSession` in `src/infrastructure/auth/`).
 * - "guest"     — a validated guest session cookie (see
 *                 `src/infrastructure/guest/cookies.ts`).
 * - "anonymous" — no session cookie, or a cookie that failed validation.
 *                 Anonymous requests are still logged; that is the point of
 *                 an audit trail.
 */
export type AuditActorType = "staff" | "guest" | "anonymous";

export interface AuditActor {
  readonly actorType: AuditActorType;
  readonly actorId: string | null;
  readonly actorRole: string | null;
  readonly venueId: string | null;
}

/**
 * One audit line, exactly as it is serialised to disk.
 *
 * Field order in the object literal is the field order on the wire. That
 * matters for grep — a future session greps for `"actorType":"staff"` and
 * expects the field to be near the top of the line, not scattered.
 */
export interface AuditEvent {
  readonly timestamp: string; // ISO 8601, UTC
  readonly actorType: AuditActorType;
  readonly actorId: string | null;
  readonly actorRole: string | null;
  readonly venueId: string | null;
  readonly route: string;
  readonly method: string;
  readonly status: number;
  readonly latencyMs: number;
  readonly ip: string | null;
}

const DEFAULT_AUDIT_DIR = "logs/audit";

/**
 * Returns the audit directory the process is configured to write to.
 * Read once at module load, so a test that sets `AUDIT_LOG_DIR` in
 * `beforeAll` gets a fresh directory and no cross-test interference.
 */
function auditDir(): string {
  const envDir = process.env["AUDIT_LOG_DIR"];
  return envDir && envDir.trim().length > 0 ? envDir.trim() : DEFAULT_AUDIT_DIR;
}

/**
 * The UTC calendar day, formatted YYYY-MM-DD. One file per UTC day, not
 * per local day, so the file boundary is deterministic across machines.
 */
function utcDateStamp(now: Date): string {
  const year = now.getUTCFullYear().toString().padStart(4, "0");
  const month = (now.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = now.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Absolute-or-relative path to today's JSON-lines file. Exported so 7.7.1b's
 * export route (and 7.7.1d's test) can compute it without re-implementing
 * the naming rule.
 */
export function auditFilePath(now: Date = new Date()): string {
  return join(auditDir(), `${utcDateStamp(now)}.jsonl`);
}

/**
 * Ensures the audit directory exists. Called by `writeAudit` on every write.
 * `mkdirSync` with `recursive: true` is idempotent — the second and every
 * subsequent call is a no-op.
 */
function ensureAuditDir(): void {
  mkdirSync(auditDir(), { recursive: true });
}

/**
 * Serialises one audit event to a single line of JSON (no pretty printing,
 * no trailing newline inside the string). Field order is preserved by the
 * `AuditEvent` construction in the caller.
 */
function serialiseEvent(event: AuditEvent): string {
  return JSON.stringify({
    timestamp: event.timestamp,
    actorType: event.actorType,
    actorId: event.actorId,
    actorRole: event.actorRole,
    venueId: event.venueId,
    route: event.route,
    method: event.method,
    status: event.status,
    latencyMs: event.latencyMs,
    ip: event.ip,
  });
}

/**
 * The one and only function that writes an audit line. Never throws.
 *
 * If `appendFileSync` fails (disk full, permissions), the error is logged to
 * `console.error` once and swallowed. The caller's HTTP response is
 * unaffected. A missing audit line is a smaller risk than a broken request.
 */
export function writeAudit(event: AuditEvent): void {
  try {
    ensureAuditDir();
    const line = serialiseEvent(event) + "\n";
    appendFileSync(auditFilePath(new Date(event.timestamp)), line, "utf8");
  } catch (err) {
    console.error("[audit] failed to write audit line", err);
  }
}

/**
 * Extracts the actor from whatever session the request carries.
 *
 * Resolution order (first match wins):
 *   1. staff session  — `getSessionCookie()` + `validateSession(db, token)`
 *   2. guest session  — the guest cookie (7.7.1 does NOT resolve guest sessions;
 *                       the guest cookie carries `venueId` and a session id in
 *                       the same JSON shape as staff sessions, so the wrapper
 *                       in 7.7.1a resolves both with one helper).
 *   3. anonymous      — no cookie, or a cookie that failed validation
 *
 * This session (7.7.1) ships `actorFromSession` with only the staff branch
 * and the anonymous fallback. The guest branch is added in 7.7.1a when the
 * `withAudit` wrapper exists to call it. `actorFromSession` is exported now
 * because `logger.ts` is the natural home for it and 7.7.1a will simply
 * extend the switch — not create a new helper.
 *
 * Phase 7.7.1 is a file-based logger. Phase 8's routes are all staff routes,
 * so the guest branch will not be exercised until guest endpoints are
 * wrapped (out of scope for Phase 7.7 and Phase 8). The branch is present
 * for symmetry with the audit line's `actorType` union.
 */
export async function actorFromSession(
  resolveStaff: () => Promise<{
    actorId: string;
    actorRole: string;
    venueId: string;
  } | null>
): Promise<AuditActor> {
  const staff = await resolveStaff();
  if (staff) {
    return {
      actorType: "staff",
      actorId: staff.actorId,
      actorRole: staff.actorRole,
      venueId: staff.venueId,
    };
  }
  return {
    actorType: "anonymous",
    actorId: null,
    actorRole: null,
    venueId: null,
  };
}

