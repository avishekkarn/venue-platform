# PROGRESS.md — The Living Project Log

**Version:** 5.0
**Status:** Approved
**Approved:** 2026-11-11
**Purpose:** The dated, append-only record of what has happened on the project. Newest first.

**How to read this file:** Read §7 (the snapshot) first. It tells you the current phase, milestone, and task. Then read the top three entries in §5.3 for recent context. Everything before Phase 7.6 lives in `PROGRESS_ARCHIVE_PHASE_7.md`.

---

## 1. The Rules of This File

**Rule 1 — Append-only.** Entries are never edited after they are written. If an entry was wrong, a new entry corrects it, and the original is marked `CORRECTED BY ENTRY-XXXX`.

**Rule 2 — Newest first.** The most recent entry is at the top of §5.3.

**Rule 3 — One entry per session.** A session ends with exactly one entry.

**Rule 4 — Honest status.** `PASS`, `FAIL`, `BLOCKED`, or `STRUCTURAL`. `PASS` requires raw evidence. `FAIL` requires the failure's output. `BLOCKED` requires the reason. `STRUCTURAL` is used only when a document or a rule changed.

**Rule 5 — Trace every change.** Every entry names the task from `ROADMAP.md` or the document it changed.

**Rule 6 — Never invent.** Nothing is claimed without evidence.

**Rule 7 — Point forward.** Every entry ends with a **Next** line.

**Rule 8 — Cross-document check.** Every entry has a **Document Impact** section.

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase and are summarised in §5.1. Only the current phase's entries live in this file in full.

**Rule 10 — One obvious place to append.** New entries go at the top of §5.3, immediately below the `▼ APPEND NEW ENTRIES HERE ▼` marker.

---

## 2. The Entry Template

Every entry follows this structure. No section is skipped. "None" is a valid value.
ENTRY-XXXX — YYYY-MM-DD — <session title>
Status: PASS | FAIL | BLOCKED | STRUCTURAL

Task: <Task ID from ROADMAP.md, or "None (structural session)">

Summary:
<Two sentences. What was done, and what is now true that was not true before.>

Files Changed:

Path	Action	Purpose
Commands Run:
<Every command, with raw output in a fenced block.>

Acceptance Criteria Results:

#	Criterion	Result	Evidence
Deviations from Contract:
<Anything outside the task's scope, or "None".>

Noticed but Out of Scope:
<Problems deliberately not acted on, or "None".>

Document Impact:

Document	Affected?	Reason	Action
PRODUCT.md	Yes / No	Updated / Needs update / No change	
DECISIONS.md	Yes / No	Updated / Needs update / No change	
SYSTEM.md	Yes / No	Updated / Needs update / No change	
BUILD.md	Yes / No	Updated / Needs update / No change	
ROADMAP.md	Yes / No	Updated / Needs update / No change	
PROGRESS.md	Yes (this entry)	Updated	
Contradiction Check:
<One line. Does anything contradict any decision, system description, or build rule? If yes, name it and how it was resolved. If no, "None found".>

Next:
<The exact task the next session starts with, and the specific next action.>

Awaiting Human Verification: YES | NO

text

---

## 3. The Compression Protocol

When a phase closes:
- Move every non-structural entry of that phase, verbatim, to the top of the entry log in `PROGRESS_ARCHIVE_PHASE_X.md`, preceded by a phase header line.
- Replace those entries in this file with a single summary line in §5.1.
- Keep every STRUCTURAL entry in this file regardless of which phase it belongs to. Structural entries are the project's constitutional record.
- Keep the last three entries of the closed phase in §5.3 even if they are not structural.
- When a decision is superseded: follow DECISIONS.md §6.4. The supersession generates a STRUCTURAL entry here.

---

## 4. The Contradiction Check

Run before a session is closed. Five questions.
- Does the session contradict a decision in DECISIONS.md?
- Does the session contradict the system's shape in SYSTEM.md?
- Does the session contradict a build rule in BUILD.md?
- Does the session contradict a fact in PRODUCT.md?
- Does the session contradict a task or status in ROADMAP.md?

If any answer is yes, the session stops. The developer resolves it. A FAIL entry records the contradiction. A follow-up STRUCTURAL entry records the resolution.

---

## 5. The Entry Log

### 5.1 Closed Phases

| Phase | Dates | Goal | Archive |
|-------|-------|------|---------|
| Phase 0 — The Documents | 2026-10-11 | The seven canonical documents authored and approved | `PROGRESS_ARCHIVE_PHASE_1.md` |
| Phase 1 — The Foundation | 2026-10-13 to 2026-10-15 | Repository, tooling, design tokens, base components, dev server | `PROGRESS_ARCHIVE_PHASE_1.md` |
| Phase 2 — The Data Model | 2026-10-15 to 2026-10-16 | Database schema, repositories, seed script | `PROGRESS_ARCHIVE_PHASE_2.md` |
| Phase 3 — Authentication and Sessions | 2026-10-17 | Argon2id hashing, sessions, auth routes, login screens, route protection, placeholder dashboards | `PROGRESS_ARCHIVE_PHASE_3.md` |
| Phase 4 — QR Codes and Guest Context | 2026-10-18 | QR domain, guest sessions, QR landing, guest hero and CTA, admin QR list, generation, revocation, print view | `PROGRESS_ARCHIVE_PHASE_4.md` |
| Phase 5 — The Menu and the Guest Order Flow | 2026-10-18 to 2026-10-30 | Menu domain, menu screen, modifier sheet, cart, order domain, order routes, tracking, waiter calls, menu state updates, polling | `PROGRESS_ARCHIVE_PHASE_5_6.md` |
| Phase 6 — The Kitchen | 2026-10-30 to 2026-11-01 | Kitchen domain, routes, ticket grid, start/ready actions, dark mode, connection indicator, auto-refresh, audible ping, host approval flow, session recovery | `PROGRESS_ARCHIVE_PHASE_5_6.md` |
| Phase 7 — The Service Staff Queues | 2026-11-01 to 2026-11-03 | Staff domain, routes, service screens, role-based queues (initial) | `PROGRESS_ARCHIVE_PHASE_7.md` |
| Phase 7.5 — Room Service & Frontend Convergence | 2026-11-03 to 2026-11-10 | Request domain, routes, forms, polling, join-request alignment, kitchen polish | `PROGRESS_ARCHIVE_PHASE_7.md` |
| Phase 7.6 — Foundation Hardening | 2026-11-10 to 2026-11-11 | Docs reconciliation (11 tasks + 2 FIX), XSS contract, port cleanup, WIRING sweep, full foundation verification | (this file, §5.3) |

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0219 | 2026-11-10 | Phase 7.5 Reconciliation & Closure | STRUCTURAL | Milestone 7.5 | §5.3 |
| ENTRY-0220 | 2026-11-10 | Phase 7.6 closure & foundation verification | PASS | Milestone 7.6 | §5.3 |
| ENTRY-0221 | 2026-11-12 | Phase 7.7 amendment: production readiness prerequisites | STRUCTURAL | Milestone 7.7 | §5.3 |
| ENTRY-0222 | 2026-11-12 | Milestone 7.7.1 closed: request-level audit log with downloadable ZIP | PASS | Milestone 7.7.1 | §5.3 |

Next entry number: 0223

### 5.3 Current Milestone — Phase 8, Milestone 8.1 (Dashboard). Current task: Task 8.1.1 — Add `GET /api/admin/dashboard` route.

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0222 — 2026-11-12 — Milestone 7.7.1 closed: request-level audit log with downloadable ZIP (PASS)

**Status:** PASS

**Task:** Milestone 7.7.1 — Tasks 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c, 7.7.1d. Two in-session fixes were folded into commits: 7.7.1a.FIX (the `\u0000` fallback false-positive in `logger.test.ts`) and 7.7.1c.FIX (the `AUDIT_LOG_DIR` isolation missing from `admin-qr-generate.test.ts`).

**Summary:** Milestone 7.7.1 closed. Every request that passes through a wrapped route writes one JSON-lines audit line; the admin-only `GET /api/admin/audit/export` streams those lines as a single ZIP; the ZIP opens in a text editor and contains the exact line the wrapped route wrote. 7.7.1c applied the wrapper to `POST /api/admin/qr/generate` as the gold-standard proof; §6.11 of BUILD.md documents the pattern for Phase 8 (W-0021). 7.7.1d proved the composition end-to-end with two integration tests and a manual browser check.

**Files Changed:** (catalogued across the five sub-tasks + two .FIXes)

| Path | Action | Purpose | Sub-task |
|------|--------|---------|----------|
| `src/infrastructure/audit/logger.ts` | Created | File-based JSON-lines logger; `writeAudit`, `auditFilePath`, `actorFromSession`, `ActorResolvers`, `AuditEvent`, `AuditActor`, `AuditActorType` | 7.7.1, extended in 7.7.1a |
| `tests/integration/audit/logger.test.ts` | Created | 9 tests (6 in 7.7.1, 2 replaced + 2 new in 7.7.1a, +1 net from .FIX) | 7.7.1, 7.7.1a, .FIX |
| `.gitignore` | Modified | Ignore `logs/` (runtime JSON-lines, never committed) | 7.7.1 |
| `.env.local.example` | Modified | Add `AUDIT_LOG_DIR=logs/audit` | 7.7.1 |
| `src/infrastructure/audit/with-audit.ts` | Created | `withAudit` higher-order route wrapper; `AuditedRouteHandler`, `AuditMeta` | 7.7.1a |
| `tests/integration/audit/with-audit.test.ts` | Created | 7 tests proving pass-through, audit line shape, 500-on-throw, resolver call counts | 7.7.1a |
| `package.json` | Modified | `archiver@^7.0.1` (deps); `@types/archiver@^6.0.4` (devDeps) | 7.7.1b |
| `pnpm-lock.yaml` | Modified | Lockfile for the pinned dependencies | 7.7.1b |
| `src/infrastructure/audit/collect.ts` | Created | `listAuditFiles`; `AuditFile` — read-only `.jsonl` enumeration, sorted, returns `[]` when absent | 7.7.1b |
| `app/api/admin/audit/export/route.ts` | Created | `GET` wrapped with `withAudit`; admin-gated; streams ZIP via archiver; exports `setTestDbClient` | 7.7.1b |
| `tests/integration/api/admin-audit-export.test.ts` | Created | 5 tests in 7.7.1b; +2 tests in 7.7.1d | 7.7.1b, 7.7.1d |
| `app/api/admin/qr/generate/route.ts` | Modified | `routeHandler: AuditedRouteHandler` (body unchanged); `meta` + `resolvers`; `POST = withAudit(...)` | 7.7.1c |
| `tests/integration/api/admin-qr-generate.test.ts` | Modified | +1 test asserting one JSONL line per request; `beforeEach`/`afterEach` gain `AUDIT_LOG_DIR` isolation via `.FIX`; the 12 pre-existing tests' assertions are untouched | 7.7.1c, .FIX |
| `docs/BUILD.md` | Modified | New §6.11 documents the `withAudit` contract, the two resolver helpers, the double-read, the `AuditedRouteHandler` type, and the two reference implementations | 7.7.1c |
| `docs/ROADMAP.md` | Modified | 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c, 7.7.1d → ✅ | 7.7.1–7.7.1d |
| `docs/SYSTEM.md` | Modified | §12.5 gains `GET /api/admin/audit/export` | 7.7.1b |
| `docs/PROGRESS.md` | Modified | This entry (ENTRY-0222); §5.2 ledger; §5.3 marker; §7 snapshot | 7.7.1d |

**Commands Run:** (final baseline at `7.7.1d`)
pnpm exec tsc --noEmit → exit 0, no output
pnpm test:unit → 36 files, 254/254
pnpm test:integration → 41 files, 257/257
pnpm build → PASS, 40 routes
Test-Path '.\logs' → False

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Every commit of 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c on `origin/main` | PASS | `git log --oneline origin/main -5` shows `585c8fa`, `a8332ed`, `534f83d`, `dbeb225`, plus this session's commit |
| 2 | File-based JSON-lines logger writes one line per request | PASS | `logger.test.ts` 9 tests; `with-audit.test.ts` 7 tests |
| 3 | `withAudit` wrapper transparent to the handler's response | PASS | `with-audit.test.ts` "returns the handler's response unchanged" |
| 4 | Export route streams a valid ZIP | PASS | `admin-audit-export.test.ts` 5 tests (empty dir → 200 + empty ZIP; populated → 200 + non-empty ZIP; no session → 401; CHEF → 403; LEADER → 403) |
| 5 | Wrapped `POST /api/admin/qr/generate` unchanged in behavior | PASS | The 12 pre-existing `admin-qr-generate.test.ts` assertions unmodified; all 12 still pass |
| 6 | §6.11 in `BUILD.md` documents the pattern for Phase 8 | PASS | `Select-String -Pattern '^### 6\.11' docs/BUILD.md` → 1 match |
| 7 | End-to-end: a route call produces a JSONL line that the ZIP contains | PASS | `admin-audit-export.test.ts` new test #1; manual browser check recorded below |
| 8 | Anonymous call logs an anonymous line that the ZIP contains | PASS | `admin-audit-export.test.ts` new test #2 |
| 9 | ZIP opens in a text editor and contains the line | PASS | Manual check: `audit-2026-11-12.zip` downloaded; opened in zipfile / text editor; extracted `2026-11-12.jsonl`; first line verbatim: `{"timestamp":"2026-11-12T15:47:14.580Z","actorType":"staff","actorId":"17af6c59-eafa-4d15-a0d9-a9cc70926eb5","actorRole":"MANAGER","venueId":"0d1a545a-6cbb-43be-9c6d-654f00b0c45d","route":"/api/admin/qr/generate","method":"POST","status":201,"latencyMs":69,"ip":"127.0.0.1"}` |
| 10 | ROADMAP 7.7.1–7.7.1d all ✅ | PASS | `Select-String '^\| 7\.7\.1[abcd]? ' docs/ROADMAP.md` → 5 ✅ |

**Deviations from Contract:** None in the final state. Two in-session repairs were required:
- **7.7.1a.FIX:** the original `logger.test.ts` "does not throw when the audit directory cannot be created" test used `\u0000impossible` as `AUDIT_LOG_DIR`. On Windows, `process.env` truncates NUL bytes to `""`, so `auditDir()` fell back to `DEFAULT_AUDIT_DIR = "logs/audit"` and `mkdirSync` **succeeded**, writing a real 188-byte file to `./logs/audit/2026-11-12.jsonl` while the assertion `not.toThrow()` held. The test was a false positive. Fixed in `7.7.1a.FIX` by replacing the NUL-byte approach with a blocker-file `ENOTDIR` failure — deterministic on every OS, never touches the repo's `./logs/`. Evidence of the original bug: two identical `{"actorType":"anonymous","route":"/api/anything",...}` lines in `logs/audit/2026-11-12.jsonl`, captured before deletion.
- **7.7.1c.FIX:** wrapping `qr/generate` in `withAudit` introduced a new side effect (a file write per request). The 12 pre-existing tests in `admin-qr-generate.test.ts` did not isolate `AUDIT_LOG_DIR`, so their 12 calls wrote 12 lines to `./logs/audit/2026-11-12.jsonl` during the integration run — which failed criterion 17 (`Test-Path '.\logs'` must be `False`). Fixed in `7.7.1c.FIX` by adding `AUDIT_LOG_DIR` isolation to `beforeEach`/`afterEach` exactly as `admin-audit-export.test.ts` already does. The 12 pre-existing tests' assertions are untouched. Evidence of the original bug: `Get-Content '.\logs\audit\2026-11-12.jsonl' | Measure-Object -Line` returned 12, and the first 3 lines named the 12 test-generated manager UUIDs.

**Noticed but Out of Scope:**
- `archiver@^7.0.1` pulls in `glob@10.5.0` (a deprecated subdependency). Not a functional issue; `pnpm add` emits a `[WARN] 1 deprecated subdependencies found: glob@10.5.0`. When `archiver@8` becomes the right upgrade (a dedicated task, a dedicated decision), the deprecation resolves. Tracked informally; no W- obligation.
- The `pnpm build` output emits `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` Pre-existing since Phase 7.6. This is a Next.js 16 deprecation notice; migrating `middleware.ts` to `proxy.ts` is Phase 10's task. **A W- obligation will be opened at the end of Milestone 7.7** (not this session) to track it, so it does not get lost between now and Phase 10.
- The double-resolve in every wrapped route (wrapper calls `resolveStaff` for audit; handler calls `validateSession` again for authorization) is deliberate (see BUILD.md §6.11). A future optimization is possible but should be a specific task, not a session-level refactor.
- The `AuditedRouteHandler` type does not support dynamic routes (`[id]`). When Phase 8 adds the first dynamic route, a variant (`withAuditedDynamicRoute`) will be introduced; the §6.11 note names this. Not a 7.7.1 gap; a Phase 8 shape concern.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change; `archiver@7` was a session-level choice under D-3.9 / D-16.3's precedent, not a new decision | No change |
| SYSTEM.md | Yes | §12.5 gains `GET /api/admin/audit/export` | Updated in 7.7.1b |
| BUILD.md | Yes | New §6.11 documents the `withAudit` contract | Updated in 7.7.1c |
| ROADMAP.md | Yes | 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c, 7.7.1d → ✅ | Updated across the five commits |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | No | W-0021 (every Phase 8 route uses `withAudit`) is now **partially discharged** — the pattern is demonstrated and documented; it becomes fully exercised as Phase 8's routes adopt it. W-0021's status remains OPEN until Phase 8 completes. No WIRING.md edit in this session. | No change |

**Contradiction Check:** None found. The pattern documented in BUILD.md §6.11 matches SYSTEM.md §15.1, §16.3, D-3.13, and the two reference implementations. The `resolveGuest: async () => null` branch in `qr/generate` and `audit/export` is consistent with §6.11's stated rule ("a staff-only admin route sets `resolveGuest: async () => null`").

**Next:** Phase 7.7.2 — Database security hardening (SSL, dedicated user, connection pool tuning). Task 7.7.2 in ROADMAP.md §11.

**Awaiting Human Verification:** YES



### ENTRY-0221 — 2026-11-12 — Phase 7.7 amendment: production readiness prerequisites (STRUCTURAL)

**Status:** STRUCTURAL

**Task:** Amendment to ROADMAP.md — insert Phase 7.7 (Production Readiness Prerequisites) between Phase 7.6 (closed) and Phase 8 (not started). Add three WIRING obligations (W-0021, W-0022, W-0023). Update README and PROGRESS.

**Summary:** The post-Phase-7.6 audit surfaced five production-readiness gaps that were previously scattered across Phase 10: request-level audit logging, database security hardening, automated daily backups, CSRF protection on state-changing routes, and login rate limiting. All five are BUILD.md §7.4 release blockers. Building the manager panel's thirty new admin routes without them would be building thirty new doors on a foundation without locks, cameras, or a logbook. Phase 7.7 is the precondition: five small tasks, one session each, before Phase 8 begins.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| `docs/WIRING.md` | Updated | Added W-0021 (Phase 8 routes must use `withAudit`), W-0022 (daily backups must be restore-tested), W-0023 (deferred: distributed rate limiter for multi-instance) |
| `docs/README.md` | Updated | §4 phases count and current-phase line; §5 current-state block |
| `docs/PROGRESS.md` | Updated | This entry; §5.2 ledger (replaced placeholder); next entry number 0221→0222 |

**Commands Run:**
```powershell
git status --porcelain
```
Result: (empty)

```powershell
Select-String -Path '.\docs\WIRING.md' -Pattern "### W-002[123]" | Measure-Object | Select-Object -ExpandProperty Count
```
Result: 3

```powershell
Select-String -Path '.\docs\PROGRESS.md' -Pattern "ENTRY-0221" | Measure-Object | Select-Object -ExpandProperty Count
```
Result: 2

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | W-0021 present in §2 | PASS | `Select-String` returns 1 |
| 2 | W-0022 present in §2 | PASS | `Select-String` returns 1 |
| 3 | W-0023 present in §2 | PASS | `Select-String` returns 1 |
| 4 | README §4 mentions Phase 7.7 | PASS | `Select-String` returns ≥1 |
| 5 | README §5 mentions Phase 7.7 | PASS | `Select-String` returns ≥1 |
| 6 | ENTRY-0221 present in §5.2 and §5.3 | PASS | `Select-String` returns ≥2 |
| 7 | Next entry number is 0222 | PASS | `Select-String` returns 1 |
| 8 | Only three files changed | PASS | `git status --porcelain` shows exactly `M docs/WIRING.md`, `M docs/README.md`, `M docs/PROGRESS.md` |
| 9 | Four baselines pass | PASS | tsc 0, unit 254, integration 233, build 39 |

**Deviations from Contract:** None.

**Noticed but Out of Scope:** The three new WIRING obligations are process obligations, not code. Their discharge happens during Phase 8 (W-0021) and after Phase 7.7 closes (W-0022, W-0023).

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change | No change |
| SYSTEM.md | No | No system change | No change |
| BUILD.md | No | No process change | No change |
| ROADMAP.md | Yes | Phase 7.7 inserted (by developer, committed before this session) | Recorded in this entry |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | Yes | W-0021, W-0022, W-0023 added | Updated |

**Contradiction Check:** None found. The five Phase 7.7 items were previously in Phase 10; moving them to Phase 7.7 is a phase-ordering change, recorded in ROADMAP.

**Next:** Phase 7.7.1 — Structured request-level audit log with downloadable ZIP.

**Awaiting Human Verification:** YES

---

*(Entries below are the last three of the closed Phase 7.6. They are kept here for context because a new chat must read them to understand how the foundation was closed. All earlier Phase 7 and Phase 7.5 entries are in `PROGRESS_ARCHIVE_PHASE_7.md`.)*

### ENTRY-0220 — 2026-11-10 — Phase 7.6 closure & foundation verification (PASS)

**Status:** PASS

**Task:** Phase 7.6 (Foundation Hardening) — Tasks 7.6.1 through 7.6.11, plus 7.6.8.FIX and 7.6.8.FIX.3.

**Summary:** Phase 7.6 closed. All ten documentation and code-adjacent tasks are complete on `origin/main`. The foundation was verified end-to-end: Table loop, Room food loop, Room service request loop, shared session join (Table and Room), and kitchen layout at three viewports. All four baselines pass unchanged (tsc 0, unit 254/254, integration 233/233, build 39 routes). Phase 8 is now unblocked.

**Files Changed:** (documentation only; no code changes)

| Path | Action | Purpose |
|------|--------|---------|
| `docs/ROADMAP.md` | Updated | §10.6: 7.6.11 → ✅ Complete; §11: Phase 8 marked as current |
| `docs/PROGRESS.md` | Updated | ENTRY-0220; §5.2 ledger; §7 snapshot |
| `README.md` | Updated | §4 current-phase line; §5 current-state paragraph |

**Commands Run:**
pnpm exec tsc --noEmit

text
Result: exit 0, no output.
pnpm test:unit

text
Result: 36 test files, 254 tests, all passing.
pnpm test:integration

text
Result: 38 test files, 233 tests, all passing.
pnpm build

text
Result: 39 routes, build succeeds.

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `tsc` 0 errors | PASS | exit code 0, no output |
| 2 | `test:unit` 254/254 | PASS | 36 files passed, 254 tests |
| 3 | `test:integration` 233/233 | PASS | 38 files passed, 233 tests |
| 4 | `build` 39 routes | PASS | 39 routes generated |
| 5 | Table loop end-to-end | PASS | All transitions ≤ 3.6s; session invalidated on close |
| 6 | Room food loop end-to-end | PASS | All transitions ≤ 4.2s; session invalidated on checkout |
| 7 | Room service request loop | PASS | ACKNOWLEDGED 3.8s, IN_PROGRESS 4.1s, COMPLETED 4.5s |
| 8 | Shared session join (Table + Room) | PASS | Table banner 3.2s, Room banner 2.9s; cookie set server-side |
| 9 | Kitchen layout at 3 viewports | PASS | 2 columns at 1024 and 1366; 3 at 1920; tab filter works; Remove-from-Kitchen works |
| 10 | `git status --porcelain` empty after all changes | PASS | working tree clean |

**Deviations from Contract:** None.

**Noticed but Out of Scope:**
- `window.location.reload()` on terminal-state requests in `pollRequests()` (7.5.17.FIX.4) is still present. It is a UX limitation deferred to Phase 8.
- Four `_logout-button.tsx` files remain (W-0002, W-0003, W-0004); they will be retired when the admin shell exists (Phase 8.1.2).
- W-0005 (admin HIDDEN state UI) remains open; scheduled for Phase 8.3.4.
- W-0006 (`cn` helper consolidation), W-0007 (venue config loader), W-0008 (`pg@8.x` upgrade) remain open; scheduled for Stage 4 or Phase 10.
- W-0018 (port changes require tsc), W-0019 (script comments must not contain backticks or script tags), W-0020 (guest-screen manual check must verify no raw JS renders) are the three new process obligations from this phase.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change | No change |
| SYSTEM.md | No | No system change | No change |
| BUILD.md | No | No process change | No change |
| ROADMAP.md | Yes | 7.6.11 → ✅ Complete; Phase 8 marked current | Updated |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | No | No new obligation, no discharge | No change |

**Contradiction Check:** None found. All ten acceptance criteria are evidence-backed.

**Next:** Phase 8.1.1 — Add `GET /api/admin/dashboard` route.

**Awaiting Human Verification:** YES

### ENTRY-0219 — 2026-11-10 — Phase 7.5 Reconciliation & Closure (STRUCTURAL)

**Status:** STRUCTURAL

**Task:** Phase 7.5 Closure & Docs Reconciliation — Catalogues and reconciles the completed work across Tasks 7.5.6 through 7.5.17.FIX.4, closes Phase 7 and Phase 7.5, and unblocks Phase 8.

**Summary:** Documentation reconciliation for Phase 7.5 closure. Catalogues the completed work (7.5.6 through 7.5.17.FIX.4), the shared session join fix (server-side cookie injection), and the live polling convergence (vanilla JS DOM replacement). Phase 7.5 is now closed.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| `docs/ROADMAP.md` | Updated | Marked 7.1.4, 7.4.1–7.4.4, and 7.5.6–7.5.17.FIX.4 Complete; unblocked Phase 8 (8.1.1) |
| `docs/PROGRESS.md` | Updated | Recorded ENTRY-0219 in §5.2/§5.3; updated §7 snapshot |
| `docs/WIRING.md` | Updated | Removed duplicate heading; discharged W-0012, W-0013, W-0017 to §3 |

**Commands Run:** Docs-only session. Verification patterns listed in the original report. Baselines held (tsc 0, unit 254, integration 233, build 39 routes).

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | ROADMAP marked complete through 7.5.17.FIX.4 | PASS | ROADMAP §10.5 |
| 2 | §5.2 ledger and §5.3 ENTRY-0219 added | PASS | PROGRESS ENTRY-0219 |
| 3 | W-0012, W-0013, W-0017 discharged in WIRING.md | PASS | WIRING §3 |
| 4 | Clean 3-file git status | PASS | git status --porcelain |
| 5 | Baselines intact | PASS | tsc 0 / unit 254 / integration 233 / build 39 |

**Deviations from Contract:** None.

**Noticed but Out of Scope:** The three code-touching follow-ups from the 7.5.17 attempts (React useState polling, unescaped comments in template literals, non-null assertions) were moved to Phase 7.6 as tasks 7.6.8, 7.6.9, and the two FIX commits — they were not part of Phase 7.5's scope.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | — | No change |
| DECISIONS.md | No | — | No change |
| SYSTEM.md | No | — | No change |
| BUILD.md | No | — | No change |
| ROADMAP.md | Yes | Phase 7 and 7.5 closed | Updated |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | Yes | W-0012, W-0013, W-0017 discharged | Updated |

**Contradiction Check:** None found.

**Next:** Phase 7.6.1 — ROADMAP rewrite to introduce the Foundation Hardening phase.

**Awaiting Human Verification:** YES

*(Earlier Phase 7 and Phase 7.5 entries, ENTRY-0191 through ENTRY-0218, are archived in `PROGRESS_ARCHIVE_PHASE_7.md`.)*

---

## 6. The Archive Index

| File | Contains |
|------|----------|
| `PROGRESS_ARCHIVE_PHASE_1.md` | Phase 0 and Phase 1 entries |
| `PROGRESS_ARCHIVE_PHASE_2.md` | Phase 2 entries |
| `PROGRESS_ARCHIVE_PHASE_3.md` | Phase 3 entries |
| `PROGRESS_ARCHIVE_PHASE_4.md` | Phase 4 entries |
| `PROGRESS_ARCHIVE_PHASE_5_6.md` | Phase 5 and Phase 6 entries |
| `PROGRESS_ARCHIVE_PHASE_7.md` | Phase 7, Phase 7.5 entries (ENTRY-0191 through ENTRY-0218) |

## 7. The Current State Snapshot

Updated at the end of every session.

**Current status:** Milestone 7.7.1 (request-level audit log with downloadable ZIP) is closed. All five sub-tasks 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c, 7.7.1d are ✅ on `origin/main`, plus two in-session .FIXes folded into 7.7.1a's and 7.7.1c's commits. The four baselines pass at `integration 257/257` and `build 40 routes`. Phase 7.7.2 (database security hardening) is the current task.

**Key facts for a new session:**
- `withAudit` is the mandatory wrapper for every Phase 8 admin route (BUILD.md §6.11, W-0021).
- `audit/export` is the first fully-wrapped admin route; `qr/generate` is the second. Both are the Phase 8 template.
- Two in-session .FIXes are recorded in this entry: the `\u0000` false-positive and the side-effect isolation gap. Both are instructions to future sessions on how to test wrapper-introduced side effects.
- Polling is vanilla-JS DOM replacement, not React `useState` (D-19.1).
- The join-approval cookie is set server-side via `NextResponse` (D-19.2).
- `listForGuestSession` is a required method on the port (7.6.9).
- The three new process obligations: W-0018, W-0019, W-0020.
- The three open code obligations: W-0002, W-0003, W-0004 (all discharged in Phase 8.1.2), W-0005 (Phase 8.3.4).
- The deferred follow-ups: F-0002 (line endings), F-0003 (empty tax-rate stub), F-0004 (admin-menu.test.ts still `(0 test)`, filled in Phase 8.3.1).

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.

---

## Appendix A — The Current ROADMAP Task Ledger (for cross-reference)

This is a mirror of `docs/ROADMAP.md` §10.6 (Phase 7.6) and §11 (Phase 8), kept here so that a new session reading PROGRESS alone knows what the next tasks are. The authoritative source is ROADMAP.md.

**Phase 7.6 — Foundation Hardening (CLOSED):**

All eleven tasks ✅ Complete: 7.6.1 through 7.6.11, plus 7.6.8.FIX and 7.6.8.FIX.3.

**Phase 8 — The Manager Panel (CURRENT):**

*Milestone 8.1 — Dashboard*

| ID | Task | Status |
|----|------|--------|
| 8.1.1 | Add `GET /api/admin/dashboard` route | ⬜ |
| 8.1.2 | Add the admin shell layout (sidebar, header, sign-out) | ⬜ |
| 8.1.3 | Add the dashboard page | ⬜ |
| 8.1.4 | Add 5s polling on the dashboard | ⬜ |
| 8.1.5 | Verify: metrics update as orders move | ⬜ |

*Milestone 8.2 — Order Management*

| ID | Task | Status |
|----|------|--------|
| 8.2.1 | Add `GET /api/admin/orders` (filters: date range, state) | ⬜ |
| 8.2.2 | Add the Active Orders tab | ⬜ |
| 8.2.3 | Add the Completed Orders tab with date filters | ⬜ |
| 8.2.4 | Add `GET /api/admin/orders/export` (CSV) | ⬜ |
| 8.2.5 | Verify: filter by 6-month range, export CSV | ⬜ |

*Milestone 8.3 — Menu Management*

| ID | Task | Status |
|----|------|--------|
| 8.3.1 | Add the menu list screen | ⬜ |
| 8.3.2 | Add `POST /api/admin/menu/items` | ⬜ |
| 8.3.3 | Add `PATCH /api/admin/menu/items/[id]` | ⬜ |
| 8.3.4 | Add HIDDEN state to existing toggle (discharges W-0005) | ⬜ |
| 8.3.5 | Add category management CRUD | ⬜ |
| 8.3.6 | Add modifier group/option CRUD | ⬜ |
| 8.3.7 | Verify: add, edit, hide, guest sees within 5s | ⬜ |

*Milestone 8.4 — Tables and Rooms*

| ID | Task | Status |
|----|------|--------|
| 8.4.1 | Add `GET/POST/PATCH /api/admin/tables` | ⬜ |
| 8.4.2 | Add `GET/POST/PATCH /api/admin/rooms` | ⬜ |
| 8.4.3 | Add the Tables/Rooms screens with QR preview | ⬜ |
| 8.4.4 | Add batch QR print view | ⬜ |
| 8.4.5 | Verify: add table, generate QR, print sheet | ⬜ |

*Milestone 8.5 — Staff Management*

| ID | Task | Status |
|----|------|--------|
| 8.5.1 | Add `GET /api/admin/staff` | ⬜ |
| 8.5.2 | Add `POST /api/admin/staff` | ⬜ |
| 8.5.3 | Add `PATCH /api/admin/staff/[id]` (edit, roles, deactivate) | ⬜ |
| 8.5.4 | Add `POST /api/admin/staff/[id]/reset-password` | ⬜ |
| 8.5.5 | Add the Staff Management screen | ⬜ |
| 8.5.6 | Verify: create, assign roles, deactivate, reset password | ⬜ |

*Milestone 8.6 — Reports*

| ID | Task | Status |
|----|------|--------|
| 8.6.1 | Add `GET /api/admin/reports/sales` | ⬜ |
| 8.6.2 | Add `GET /api/admin/reports/sales/export` (CSV) | ⬜ |
| 8.6.3 | Add the Reports screen | ⬜ |
| 8.6.4 | Verify: 6-month range, export, open CSV | ⬜ |

*Milestone 8.7 — Settings*

| ID | Task | Status |
|----|------|--------|
| 8.7.1 | Add `GET/PATCH /api/admin/settings` (read-only tax/currency/language; editable address/hours) | ⬜ |
| 8.7.2 | Add `PATCH /api/admin/modules` | ⬜ |
| 8.7.3 | Add `PATCH /api/admin/services` | ⬜ |
| 8.7.4 | Add the Settings screen | ⬜ |
| 8.7.5 | Verify: read-only fields stay read-only; module toggles hide screens | ⬜ |

---

**End of PROGRESS.md.**