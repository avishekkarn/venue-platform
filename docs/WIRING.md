# WIRING.md — The Cross-Task Wiring Ledger

**Version:** 1.0
**Status:** Approved
**Approved:** 2026-10-28
**Purpose:** The dated, append-only index of every cross-task wiring obligation, deferred seam, and carry-forward reminder, so that no obligation is lost between the task that creates it and the task that must satisfy it. This file does not own the product (PRODUCT.md), the reasons (DECISIONS.md), the shape (SYSTEM.md), the method (BUILD.md), the plan (ROADMAP.md), the history (PROGRESS.md), the look (DESIGN.md), or the acceptance tests (PHASE_TESTS.md). It only points at them and tracks what must still be done across task boundaries.

**How to read this file:** Read §2 (the active obligations) first. Each obligation has an id (`W-XXXX`), the task and PROGRESS entry that created it, the exact file(s) and call site, the future task that must satisfy it, and its status. Then read §4 (the deferred follow-ups) for items that are not wiring but must not be lost. §1 states the rules. §3 holds the discharged obligations, kept forever for audit.

---

## 1. The Rules of This File

**Rule 1 — Append-only.** Entries are never edited after they are written. An obligation that is discharged moves from §2 to §3 with the PROGRESS entry that proves it; it is not deleted. A mistaken entry is corrected by a new entry that supersedes it, and the original is marked `SUPERSEDED BY W-XXXX`.

**Rule 2 — This file references, never duplicates.** Every entry cites the canonical section or decision it depends on (for example `D-4.12`, `SYSTEM.md §9.7`, `BUILD.md §6`, `ROADMAP.md` Task 5.6.1). The canonical document is the source of truth. If this file ever appears to contradict a canonical document, the canonical document wins and this file is corrected in a new version.

**Rule 3 — One entry per obligation.** An obligation is a thing that must be done in a named future task, in a named file, for a named reason. It is not a task in ROADMAP.md (ROADMAP.md owns tasks); it is the cross-task link that says "when task X is built, it must also satisfy Y in file Z."

**Rule 4 — Every entry has a discharge condition.** Each `W-` entry names the future task that satisfies it and the PROGRESS entry (or phase boundary) whose evidence proves it. An obligation with no discharge condition is not an obligation; it is a note, and notes belong in PROGRESS.md.

**Rule 5 — A seam-creating or seam-discharging task updates this file.** Any task that creates a cross-task seam, or discharges an obligation, appends the relevant entry here and records the update in its PROGRESS entry's Document Impact table (`WIRING.md | Yes | Added/Satisfied W-XXXX | Updated`). This is part of that task's Definition of Done per BUILD.md §15.

**Rule 6 — The deferred follow-ups are candidates, not scheduled tasks.** §4 lists items that must not be lost. Each names the trigger that will schedule it and the ROADMAP.md entry that will own it when scheduled. A follow-up leaves §4 only by being promoted to a ROADMAP.md task (and then a `W-` entry tracks its wiring) or by being discharged and moved to §3.

**Rule 7 — Newest first.** Within §2 and §3, the most recent entry is at the top.

---

## 2. The Active Obligations

*(Newest first. Each entry is appended by the task that creates it, per Rule 5.)*

### W-0027 — OPEN — `src/infrastructure/config/venue.ts` must exist and export `getVenueSlug()`

- **Originated:** Phase 8.0.0.4 pre-read (2026-11-14). The file `src/infrastructure/config/venue.ts` exists but is empty. Two admin routes — `app/api/admin/qr/generate/route.ts` and `app/api/admin/audit/export/route.ts` — read the venue's slug via `process.env["VENUE_SLUG"] ?? "juniper-house"` directly. The `?? "juniper-house"` fallback is a data-isolation footgun at production scale (D-10.2, SYSTEM.md §15.4): a mis-set `VENUE_SLUG` on a production deployment silently reads the seed venue's data. The dashboard route (8.1.1) will inherit the same pattern if the helper does not exist first.
- **Obligation:** Create `src/infrastructure/config/venue.ts` exporting `getVenueSlug(): string`, which reads `process.env["VENUE_SLUG"]` and **throws** if it is unset (no fallback). Update `app/api/admin/qr/generate/route.ts` and `app/api/admin/audit/export/route.ts` to call `getVenueSlug()` instead of `process.env["VENUE_SLUG"] ?? "juniper-house"`. The dashboard route (Task 8.1.1) calls `getVenueSlug()` from the start. Add a unit test at `tests/unit/infrastructure/config/venue.test.ts`: `getVenueSlug()` throws when `VENUE_SLUG` is unset; returns the value when it is set.
- **Files and call site:** `src/infrastructure/config/venue.ts` (new, ~15 lines). `app/api/admin/qr/generate/route.ts` (two `process.env["VENUE_SLUG"] ?? "juniper-house"` reads → `getVenueSlug()`). `app/api/admin/audit/export/route.ts` (same). `tests/unit/infrastructure/config/venue.test.ts` (new, two tests).
- **Satisfied by:** Task 8.1.1 (the first Phase 8 admin route after the 8.0.0 gate). The dashboard route is the natural first consumer.
- **Depends on:** W-0021, BUILD.md §6.11, D-10.2, SYSTEM.md §15.4.
- **Verification:** `Select-String -Path 'src/infrastructure/config/venue.ts' -Pattern 'export function getVenueSlug'` returns 1. `Select-String -Path 'app/api/admin/qr/generate/route.ts' -Pattern 'getVenueSlug'` returns ≥1. `Select-String -Path 'app/api/admin/audit/export/route.ts' -Pattern 'getVenueSlug'` returns ≥1. The unit test passes (2/2). The four baselines stay green.
- **Status:** DISCHARGED (2026-11-14, commit 4d2a45e)

### W-0026 — OPEN — Audit log rotation (30-day retention)

- **Originated:** Phase 7.7.5 closure (PROGRESS ENTRY-0227, 2026-11-14).
- **Obligation:** The `logs/audit/` directory grows by one `.jsonl` file per UTC day, forever. A production venue running for years accumulates thousands of files on the app server's disk. The Phase 10.7 deployment task must add a pruner that deletes `.jsonl` files older than 30 days, matching the backup retention (D-8.5). The pruner runs on the same OS scheduler as the backups (Task Scheduler on Windows, cron on Linux). Log files are excluded from `git status` via `.gitignore` (already the case; no change needed there).
- **Files and call site:** `scripts/rotate-audit.ps1` (new) and `scripts/rotate-audit.sh` (new), mirroring `scripts/backup-daily.*`. `scripts/README.md` gains a "Rotation" section. `docs/SYSTEM.md §18.5` gains a paragraph naming the rotation alongside the backup. `docs/DEPLOYMENT.md` (Phase 10.7) schedules both.
- **Satisfied by:** Task 10.7.6 (the W-0026 row indocs/ROADMAP.md§14 Milestone 10.7). The Phase 10.7 deployment task installs the rotation on the venue's server. It is not a Phase 8 deliverable — Phase 8 adds the audit log; Phase 10.7 keeps it bounded.
- **Depends on:** D-8.5, the backup scripts (`scripts/backup-daily.*`), `.gitignore` (logs/ already ignored).
- **Verification:** After 31 days of daily writes, `logs/audit/` holds exactly 30 files. A test on a throwaway directory proves the pruner.
- **Status:** OPEN

### W-0025 — DISCHARGED — `withAudit` must populate the `ip` field from request headers

- **Originated:** Phase 7.7.5 closure (PROGRESS ENTRY-0227, 2026-11-14).
- **Obligation:** The `withAudit` wrapper populates the audit `ip` field from `x-forwarded-for` (first segment, trimmed) → `x-real-ip` → `null`. It was implemented in Phase 7.7.1a (`src/infrastructure/audit/with-audit.ts`, `extractClientIp` at line 149, called at line 129). The audit log records `null` for the no-header case — an honest "we don't know" — not `"unknown"`. `"unknown"` is the rate limiter's bucket key for headerless requests (a rate-limit concern, not an audit concern). The audit log has no bucket; `null` is the correct value for the field. The two name the same header source; only their fallbacks differ, for the reason just stated.
- **Files and call site:** `src/infrastructure/audit/with-audit.ts` (the `withAudit` wrapper; add the header read and pass `ip` to `writeAudit`). `src/infrastructure/audit/logger.ts` (already accepts `ip: string | null`; no change). `tests/integration/audit/with-audit.test.ts` (add two tests: a request with `x-forwarded-for: 203.0.113.42, 10.0.0.1` produces `ip: "203.0.113.42"`; a request with no forwarded header produces `ip: null`).
- **Satisfied by:** Discharged by `src/infrastructure/audit/with-audit.ts` (`extractClientIp` reads `x-forwarded-for` first segment → `x-real-ip` → `null`; `writeAudit` receives the value as `ip`). Verified by the two new tests in `tests/integration/audit/with-audit.test.ts` (2026-11-14, Phase 8.0.0.1).
- **Depends on:** W-0021, BUILD.md §6.11, D-20.1, the login rate limiter's IP derivation (`src/infrastructure/auth/rate-limiter.ts`).
- **Verification:** A wrapped route's audit line carries `ip: "<real-IP>"` when a forwarded header is present, and `ip: null` otherwise. The `audit/export` ZIP contains the value. Two tests prove it (the `with-audit.test.ts` additions).
- **Status:** DISCHARGED (2026-11-14, commit 7d7bc2e)

### W-0021 — OPEN — Every Phase 8 API route must use `withAudit`

- **Originated:** Phase 7.7 amendment (PROGRESS ENTRY-0221).
- **Obligation:** Every API route added in Phase 8 (dashboard, orders, menu, tables, rooms, staff, reports, settings, audit viewer) must be wrapped with `withAudit` from `src/infrastructure/audit/logger.ts`. The wrapper is introduced in Task 7.7.1a. A route that does not use `withAudit` is `FAIL` — it is a blind spot in the audit trail.
- **Files and call site:** Every file under `app/api/admin/` that adds a route in Phase 8. The pattern is demonstrated in `app/api/admin/qr/generate/route.ts` (Task 7.7.1c).
- **Satisfied by:** Every Phase 8 task's acceptance criteria includes "the route uses `withAudit`". The obligation is discharged route-by-route as Phase 8 proceeds.
- **Depends on:** 7.7.1, BUILD.md §6.
- **Verification:** A route call produces a row in the audit log. The audit log is downloadable via `GET /api/admin/audit/export` (Task 7.7.1b).
- **Status:** OPEN

### W-0022 — OPEN — Daily backups must be automated and restore-tested

- **Originated:** Phase 7.7 amendment (PROGRESS ENTRY-0221).
- **Obligation:** Task 7.7.3 adds the `pg_dump`-based daily backup scripts. This obligation tracks the deployment-side step: the script must be scheduled by the OS's scheduler at the venue, and a restore test must succeed before the venue goes live. A backup that has never been restored is a backup that does not exist.
- **Files and call site:** `scripts/backup-daily.ps1`, `scripts/backup-daily.sh`, `scripts/restore-backup.ps1`, `scripts/restore-backup.sh`. Documented in `docs/DEPLOYMENT.md` (Task 10.7.1).
- **Satisfied by:** Task 7.7.3 (the scripts) + Task 10.6.1 (the real-venue dry run, which includes a restore). Discharge evidence is a successful `restore-backup` against a test database, documented in PROGRESS.
- **Depends on:** 7.7.3, D-8.5, BUILD.md §7.4.
- **Verification:** `pg_dump` produces a `.sql.gz` file daily; `restore-backup` restores it to a test database without errors. Documented in `docs/DEPLOYMENT.md`.
- **Status:** OPEN

### W-0023 — DEFERRED — Distributed rate limiter for multi-instance deployments

- **Originated:** Phase 7.7 amendment (PROGRESS ENTRY-0221).
- **Obligation:** Task 7.7.5 adds an **in-memory** rate limiter to `/api/auth/login`. This is sufficient for a single-venue deployment (D-10.1). When a venue grows large enough that the app runs on multiple processes behind a load balancer, the in-memory limiter will not enforce across instances. This obligation tracks the migration to a distributed limiter.
- **Files and call site:** `src/infrastructure/rate-limit/` (new directory, not yet created). `app/api/auth/login/route.ts` is the only consumer today; only the limiter's backing store changes.
- **Satisfied by:** A future task when the first venue runs on multi-instance hosting. Not scheduled. Trigger: a venue requests multi-instance deployment, or the developer moves to a load balancer.
- **Depends on:** 7.7.5, D-10.1, D-14.1.
- **Verification:** Login attempts from the same IP are counted across all instances. Tested with two app instances writing to the same rate-limit store.
- **Status:** DEFERRED

### W-0020 — OPEN — Guest-screen manual checks must verify that no injected script renders as raw text

- **Originated:** Tasks 7.6.8, 7.6.8.FIX, 7.6.8.FIX.3 (PROGRESS ENTRY-0220).
- **Obligation:** Every guest-facing screen manual check (BUILD.md §8.8, "Guest-facing screen") must include an observation that no raw JavaScript renders as visible text on the page. The failure mode — a broken `dangerouslySetInnerHTML` string — is invisible to `tsc`, invisible to `pnpm test:unit`, and invisible to `pnpm build`. It is only visible in a browser.
- **Files and call site:** Any guest screen that injects a script. Currently: `/services`, `/menu`, `/order/[id]/track`, `/requests`, `/qr/[token]`, `/qr/join/[token]`.
- **Satisfied by:** Process rule — applies to every future guest-screen manual check.
- **Depends on:** BUILD.md §8.8 (mandatory test layer), BUILD.md §11 (verification protocol).
- **Verification:** A guest screen renders normally (no raw JS text) on a real phone, and its injected script executes correctly (e.g., the join banner appears within 5 seconds).
- **Status:** OPEN

### W-0019 — OPEN — Comments inside `dangerouslySetInnerHTML` must not contain backticks or script tags

- **Originated:** Tasks 7.6.8, 7.6.8.FIX, 7.6.8.FIX.3 (PROGRESS ENTRY-0220).
- **Obligation:** Any comment placed inside a `dangerouslySetInnerHTML` template literal (or any string that is injected into the browser as HTML or JS) must contain no backtick (`` ` ``), no `<script>`, and no `</script>` literal. Task 7.6.8's first attempt broke the page because the comment contained an unescaped backtick. Task 7.6.8.FIX did not fully fix it because the comment contained `</script>`. Task 7.6.8.FIX.3 moved the comment outside the template literal entirely, which is the correct pattern.
- **Files and call site:** Any component that uses `<script dangerouslySetInnerHTML={{ __html: \`...\` }} />` under `src/components/`. Currently: `src/components/guest/join-request-script.tsx`, `src/components/guest/requests-client.tsx`, `app/(guest)/order/[id]/track/page.tsx`, `app/kitchen/page.tsx`, `app/staff/page.tsx`.
- **Satisfied by:** Process rule — applies to every future comment in an injected string.
- **Depends on:** BUILD.md §3 (React/Next.js standards), BUILD.md §14 (session hygiene).
- **Verification:** A guest-facing screen renders without raw JavaScript text visible on the page. Manual mobile check required.
- **Status:** OPEN

### W-0018 — OPEN — Port signature changes require `tsc` after the change, not just grep

- **Originated:** Task 7.6.9 (PROGRESS ENTRY-0220).
- **Obligation:** When a method on a domain port interface changes shape (made required, made optional, renamed, or its parameters changed), the task's audit must run `pnpm exec tsc --noEmit` **after** modifying the port. Grep (`Select-String`) is not sufficient because TypeScript mocks declare the method as a type property, not as a string literal. Task 7.6.9's initial audit missed four test mocks that grep could not find; `tsc` caught them.
- **Files and call site:** Any domain port under `src/domain/*/*.repository.ts`, and every mock that references the port's type in `tests/unit/` and `tests/integration/`.
- **Satisfied by:** Process rule — applies to every future port change.
- **Depends on:** BUILD.md §11 (verification protocol), BUILD.md §15 (definition of done).
- **Verification:** A port change that `tsc` passes is a completed port change; a port change that only grep-verifies has no proof the mocks were updated.
- **Status:** OPEN

### W-0009 — SUPERSEDED BY W-0013 — Charlie must be elevated to LEADER in seed

**SUPERSEDED BY W-0013** (2026-11-03, ENTRY-0208). W-0013 supersedes this entry with full file/call-site detail.
Originated: Task 7.5.0 (ENTRY-0205).
Obligation: Update the seed or database to make `charlie` a `LEADER` for testing.
Satisfied by: Task 7.5.9.
Depends on: D-18.1.
Status: SUPERSEDED.

### W-0008 — OPEN — pg@8.x query-during-execution deprecation

- **Originated:** Task 8.0.3 (PROGRESS ENTRY-0203).
- **Obligation:** @prisma/adapter-pg emits DeprecationWarning: Calling client.query() when the client is already executing a query under pg@8.x; pg@9.0 will reject the pattern. Verify the adapter still works and address the pattern if it surfaces as a hard error.
- **Files and call site:** src/infrastructure/db/client.ts and node_modules/@prisma/adapter-pg.
- **Satisfied by:** A future hygiene task when pg@9 is released or the adapter is upgraded.
- **Depends on:** D-16.3.
- **Status:** OPEN

### W-0007 — OPEN — Implement documented venue configuration loader

- **Originated:** Task 8.0.2 (PROGRESS ENTRY-0202).
- **Obligation:** `src/config/venue.config.ts` and `src/infrastructure/config/venue.ts` are 0-byte while 20 call sites use `process.env["VENUE_SLUG"]` directly. The documented config loader (DESIGN.md Part Three, SYSTEM.md §17.1) is unimplemented. Stage 4 foundation fix.
- **Files and call site:** `src/config/venue.config.ts`, `src/infrastructure/config/venue.ts`, and all 20 call sites accessing `process.env["VENUE_SLUG"]`.
- **Satisfied by:** Stage 4 Foundation Refactor.
- **Depends on:** DESIGN.md Part Three, SYSTEM.md §17.1.
- **Verification:** Canonical config loader implemented and adopted across all call sites; unit and integration tests pass.
- **Status:** OPEN

### W-0006 — OPEN — Consolidate 0-byte src/lib/cn.ts with working src/lib/utils.ts

- **Originated:** Task 8.0.2 (PROGRESS ENTRY-0202).
- **Obligation:** `src/lib/cn.ts` is 0-byte while `src/lib/utils.ts` contains the working `cn`. BUILD.md §4.3 names cn as the single helper. Rename/consolidate in Stage 4.
- **Files and call site:** `src/lib/cn.ts`, `src/lib/utils.ts`.
- **Satisfied by:** Stage 4 Foundation Refactor.
- **Depends on:** BUILD.md §4.3.
- **Verification:** Single canonical `cn` export location with clean imports across codebase; unit tests pass.
- **Status:** OPEN

### W-0005 — OPEN — Admin UI exposes only AVAILABLE↔UNAVAILABLE; add HIDDEN state action

- **Originated:** Task 8.0.2 (PROGRESS ENTRY-0202).
- **Obligation:** Admin UI exposes only AVAILABLE↔UNAVAILABLE for menu items; the HIDDEN action (D-4.2) has no UI. This task moves 8.3.4 from ⬜ to ✅ and opens W-0005 to track the missing third state action.
- **Files and call site:** `app/admin/page.tsx`, `app/api/admin/menu/items/[id]/state/route.ts`.
- **Satisfied by:** Task 8.3.1 / Task 8.3.4 (Menu Management).
- **Depends on:** DECISIONS.md D-4.2, SYSTEM.md §11.1.
- **Verification:** Admin UI exposes controls for AVAILABLE, UNAVAILABLE, and HIDDEN; integration tests verify all three states.
- **Status:** OPEN

### W-0004 — OPEN — Remove app/kitchen/_logout-button.tsx when the kitchen shell is built

- **Originated:** Task 8.0.2 (PROGRESS ENTRY-0202).
- **Obligation:** Remove `app/kitchen/_logout-button.tsx` and consolidate into the shared shell logout component when the kitchen shell is built.
- **Files and call site:** `app/kitchen/_logout-button.tsx`, `app/kitchen/page.tsx`.
- **Satisfied by:** Task 6.3.1 (Kitchen Screen Shell) / Stage 4 Foundation Refactor.
- **Depends on:** DESIGN.md §4.15.3, SYSTEM.md §3, BUILD.md §4.
- **Verification:** `app/kitchen/_logout-button.tsx` removed; kitchen page imports shared logout button; `tsc --noEmit` clean.
- **Status:** OPEN

### W-0003 — OPEN — Remove app/staff/_logout-button.tsx when the staff shell is built

- **Originated:** Task 8.0.2 (PROGRESS ENTRY-0202).
- **Obligation:** Remove `app/staff/_logout-button.tsx` and consolidate into the shared shell logout component when the staff shell is built.
- **Files and call site:** `app/staff/_logout-button.tsx`, `app/staff/page.tsx`.
- **Satisfied by:** Task 7.3.1 (Staff Dashboard Shell) / Stage 4 Foundation Refactor.
- **Depends on:** DESIGN.md §4.15.3, SYSTEM.md §3, BUILD.md §4.
- **Verification:** `app/staff/_logout-button.tsx` removed; staff page imports shared logout button; `tsc --noEmit` clean.
- **Status:** OPEN

### W-0002 — OPEN — Remove app/admin/_logout-button.tsx when the admin shell is built

- **Originated:** Task 8.0.2 (PROGRESS ENTRY-0202).
- **Obligation:** Remove `app/admin/_logout-button.tsx` and consolidate into the shared shell logout component when the admin shell is built.
- **Files and call site:** `app/admin/_logout-button.tsx`, `app/admin/page.tsx`, `app/admin/qr/page.tsx`.
- **Satisfied by:** Task 8.1.2 (Admin Shell Layout). The shell's header carries the single CSRF-safe sign-out; the two per-page buttons are deleted. Verified by the shell's presence on /admin and /admin/qr and the sign-out's 200 in the audit log.
- **Depends on:** DESIGN.md §4.15.3, SYSTEM.md §3, BUILD.md §4.
- **Verification:** `app/admin/_logout-button.tsx` removed; admin pages import shared logout button; `tsc --noEmit` clean.
- **Status:** DISCHARGED (2026-11-15, commit <8.1.2 SHA>)

---

## 3. The Discharged Obligations

*(Newest first. Each entry was moved here from §2 with the PROGRESS entry that proved it satisfied, per Rule 1.)*

### W-0024 — DISCHARGED — Login is CSRF-protected but not audited (D-20.1 exception)

- **Originated:** Phase 7.7.4 (PROGRESS ENTRY-0225 and ENTRY-0226).
- **Obligation:** `POST /api/auth/login` must be CSRF-protected (it establishes the session, which is state) but must **not** be wrapped with `withAudit`, because the request arrives before any session exists to resolve an audit actor. The handler is `withCsrf(loginHandler)`; the wrapper is `withCsrf` only. This is the one exception to W-0021's "every state-changing route uses withAudit".
- **Files and call site:** `app/api/auth/login/route.ts`, the `export const POST = withCsrf(loginHandler);` line.
- **Satisfied by:** Task 7.7.4b (the route was wrapped), verified in Task 7.7.4d (Part A: the 25-route audit includes the login route; Part B: the browser check confirmed a login without the header 403s, and a login with the header succeeds).
- **Depends on:** DECISIONS.md D-20.1, BUILD.md §7.4, SYSTEM.md §15.
- **Verification:** PROGRESS ENTRY-0226 (Part B verification) and `tests/integration/api/csrf-25-route.test.ts` (the login route's 403 test).
- **Status:** DISCHARGED
- **Discharged by:** PROGRESS ENTRY-0226.

### W-0017 — DISCHARGED — Staff request queue UI

- **Originated:** Task 7.5.14-pre (PROGRESS ENTRY-0218).
- **Obligation:** The staff dashboard (`/staff`) has three tabs — Orders, Table Map, Room Map — but no Requests tab. Task 7.5.14 adds the `/staff/requests` tab: a queue of SUBMITTED / ACKNOWLEDGED / IN_PROGRESS requests with per-row actions (Advance → Acknowledge → Start → Complete; Cancel; Decline).
- **Files and call site:** `app/staff/page.tsx`, `src/components/staff/request-queue-table.tsx`, `app/api/staff/requests/`.
- **Satisfied by:** Task 7.5.14.
- **Depends on:** D-18.1, D-18.2, SYSTEM.md §10, SYSTEM.md §7.1.
- **Status:** DISCHARGED
- **Discharged by:** Task 7.5.14.

### W-0013 — DISCHARGED — Charlie must be elevated to LEADER

- **Originated:** Task 7.5.0 (ENTRY-0205). Reconciled: Task 7.5.2 (ENTRY-0207).
- **Obligation:** `charlie` (currently `TABLE_SERVICE` only) must be elevated to `LEADER` for the full-loop verification to succeed. The elevation is a seed change (`prisma/seed.ts`) plus a `StaffRole` extension (`src/domain/auth/staff.repository.ts`). `canAccess` and the staff dashboard must honor the LEADER tier per D-18.1.
- **Files and call site:** `prisma/seed.ts`, `src/domain/auth/staff.repository.ts`, `src/domain/auth/can-access.ts`, `app/staff/page.tsx`.
- **Satisfied by:** Task 7.5.9.
- **Depends on:** D-18.1, SYSTEM.md §7.
- **Status:** DISCHARGED
- **Discharged by:** Task 7.5.9.

### W-0012 — DISCHARGED — Guest `/requests/page.tsx` and staff request queue

- **Originated:** Task 7.5.1 (ENTRY-0206).
- **Obligation:** The guest combined-requests view (`app/(guest)/requests/page.tsx`) does not exist; only `[id]/` subfolder is present. The staff request queue (`/api/staff/requests/`) and its UI queue also do not exist.
- **Files and call site:** `app/(guest)/requests/page.tsx`, `app/api/staff/requests/`, `app/staff/`.
- **Satisfied by:** Task 7.5.4, 7.5.5, 7.5.8, 7.5.14.
- **Depends on:** PRODUCT.md §6.12, SYSTEM.md §10.
- **Status:** DISCHARGED
- **Discharged by:** Task 7.5.8 and Task 7.5.14.

### W-0011 — DISCHARGED — `request-form-field.tsx` must be authored

- **Originated:** Task 7.5.1 (ENTRY-0206).
- **Obligation:** `src/components/guest/request-form-field.tsx` is 0-byte. The 8 non-food forms will reuse it for text, textarea, single-select chips, multi-select chips, time picker, and photo upload. It must be authored before Task 7.5.7 begins.
- **Files and call site:** `src/components/guest/request-form-field.tsx`, consumed by each of the 8 forms.
- **Satisfied by:** The first sub-task of Task 7.5.7.
- **Depends on:** DESIGN.md §4.6.17.7, DESIGN.md §4.13.
- **Status:** DISCHARGED
- **Discharged by:** Task 7.5.7 (Task 7.5.7.A, commit `b15a412`).

### W-0010 — DISCHARGED — Build the 8 non-food service forms

- **Originated:** Task 7.5.1 (ENTRY-0206).
- **Obligation:** The 9 service tiles on `/services` are inert. Task 7.5.6 wires "Room Service" to `/menu`; Task 7.5.7 wires the other 8 tiles to their dedicated forms. The 8 subfolders under `app/(guest)/services/` exist as empty directories and must gain a `page.tsx`.
- **Files and call site:** `app/(guest)/services/page.tsx` (tiles have no `<Link>`); the 8 empty folders under `app/(guest)/services/`.
- **Satisfied by:** Task 7.5.6 (Room Service tile) and Task 7.5.7 (8 non-food forms).
- **Depends on:** PRODUCT.md §6.4–§6.11, DESIGN.md §4.6.17.7, D-5.1.
- **Status:** DISCHARGED
- **Discharged by:** Task 7.5.6 (commit `9621c0f`) and Task 7.5.7 (commits `b15a412`, `9f9a097`, `f460bad`).

### W-0014 — DISCHARGED — `vitest.config.ts` include array missed `tests/unit/requests/`

- **Originated:** Task 7.5.2a (PROGRESS ENTRY-0208).
- **Obligation:** Task 7.5.2 wrote `tests/unit/requests/transitions.test.ts` but `vitest.config.ts`'s explicit `include` array did not list `tests/unit/requests/`, so the file was silently skipped (226 tests, not 232). Task 7.5.2a added the line.
- **Files and call site:** `vitest.config.ts`, `include` array.
- **Satisfied by:** Task 7.5.2a (commit `ba83f6d`).
- **Status:** DISCHARGED

### W-0001 — DISCHARGED — Cart "Place order" submission seam

- **Originated:** Task 5.4.5 (PROGRESS ENTRY-0141).
- **Obligation:** Replace the disabled placeholder in `app/(guest)/cart/page.tsx` with the real submission. The submission (5.6.1) must send both the place identifier and the pickup name (when present) so that Phase 7's staff screen can render "Table 12 — Ramesh".
- **Files and call site:** `app/(guest)/cart/page.tsx`, the PLACE-ORDER SEAM comment location.
- **Satisfied by:** Task 5.6.1 (`POST /api/guest/orders`), with 5.7.1 (confirmation) and 5.5.1–5.5.3 (domain/snapshot) as dependencies.
- **Depends on:** D-4.12, SYSTEM.md §9.7, BUILD.md §6, ROADMAP.md Task 5.6.1.
- **Related decision:** D-17.5.
- **Verification:** The PROGRESS entry at the close of 5.6, and the Phase 5/6 boundary per PHASE_TESTS.md §7.
- **Status:** DISCHARGED
- **Discharged by:** PROGRESS ENTRY-0148 (Task 5.6.1).

---

## 4. The Deferred Follow-Ups

*(Items that must not be lost. Each names its trigger and the ROADMAP.md entry that will own it when scheduled, per Rule 6.)*

### F-0001 — Next.js security advisory

**Status: DISCHARGED (2026-11-02) — resolved by `next@16.4.4` bump in commit `0da44ff`. See PROGRESS ENTRY-0203 and ENTRY-0204.**

Next.js emitted a security-advisory recommendation during the 5.4.x builds. A dependency upgrade is out of scope for Milestone 5.4 tasks and must not be folded into them.

- **Trigger to schedule:** the human decides; not tied to a phase.
- **Owns it when scheduled:** a new ROADMAP.md task (not yet created).
- **Constraint when it happens:** its own pre-condition check, its own four baselines, and — if the version change alters App Router, Turbopack, or middleware behaviour — a DECISIONS.md record.
- **Why it is here:** so it is not forgotten, and so it is never silently folded into a 5.4.x task.

### F-0002 — CRLF/LF line-ending artefact on docs

`git status` has repeatedly flagged `docs/PROGRESS.md` as modified with an empty `git diff`, caused by CRLF/LF normalisation on Windows. This has blocked two sessions (Task 5.4.3 and Task 5.4.4 pre-conditions), each time cleared with `git checkout -- docs/PROGRESS.md`.

- **Trigger to schedule:** before it blocks a third session.
- **Owns it when scheduled:** a new ROADMAP.md hygiene task (not yet created).
- **Fix:** a repository-root `.gitattributes` (`* text=auto eol=lf`) or a deliberate `core.autocrlf` setting, applied consistently to every editor in the workspace. If the setting becomes a locked choice, it gets a DECISIONS.md record.
- **Why it is here:** an environmental artefact that blocks sessions is a process defect, not a one-off.

### F-0003 — Empty `src/domain/organization/get-venue-tax-rate.ts` stub

The file is a 0-byte stub. Task 5.4.4 did not need it (the venue record already carries `taxRate` as a decimal string via `organization.repo.ts`), so it was not used and not changed. A 0-byte file in the domain tree is a latent inconsistency: the folder structure and the domain barrel expect a helper, and an empty stub could be mistaken for a working function.

- **Trigger to schedule:** before any task is tempted to import it.
- **Owns it when scheduled:** a new ROADMAP.md task (not yet created).
- **Resolution:** either implement it to return the venue's `taxRate` (and refactor the cart to call it in a later, deliberate change) or remove it from `src/domain/organization/index.ts` so no caller can reach an empty file.
- **Why it is here:** a stub that returns nothing is a trap for a later session.

### F-0004 — Six placeholder `(0 test)` integration suites

Five of the six (0 test) suites have been filled in; only tests/integration/api/admin-menu.test.ts remains.

- **Trigger to schedule:** when Phase 6 (kitchen), Phase 7 (staff queues), and Phase 8 (manager panel) fill those suites in; only admin-menu remains, filled by Task 8.3.1.
- **Owns them when scheduled:** the Phase 6/7/8 tasks that build the routes those suites test.
- **Why it is here:** so a future session does not mistake `(0 test)` for a passing suite or a regression.

---

## 5. The Entry Template

Every `W-` entry in §2 and §3 follows this structure. No section is skipped.
W-XXXX — <STATUS> — <short title>
Originated: Task <id> (PROGRESS ENTRY-XXXX).
Obligation: <one or two sentences: what must be done across the task boundary.>
Files and call site: <exact file(s) and the call site or symbol that must change.>
Satisfied by: Task <id> (<route/function/task name>).
Depends on: <the canonical citations this obligation rests on, e.g. D-4.12, SYSTEM.md §9.7, BUILD.md §6.>
Verification: <the PROGRESS entry and/or phase boundary whose evidence proves it.>
Status: OPEN | SATISFIED | SUPERSEDED.

text

A `SATISFIED` entry in §3 adds one line: `**Discharged by:** PROGRESS ENTRY-XXXX.`

---

## 6. How This File Evolves

It grows by one entry per cross-task obligation or discharged obligation. It is updated at the close of any task that creates a seam or discharges one (Rule 5). It is never rewritten wholesale. It does not replace PROGRESS.md (the history) or ROADMAP.md (the plan); it is the index that keeps the links between them from being forgotten.

---

## 7. What This File Does Not Define

- The product — that is PRODUCT.md.
- The reasons — those are DECISIONS.md.
- The shape — that is SYSTEM.md.
- The method — that is BUILD.md.
- The plan and the tasks — that is ROADMAP.md.
- The history — that is PROGRESS.md.
- The look — that is DESIGN.md.
- The acceptance tests — that is PHASE_TESTS.md.

If a fact about a cross-task obligation is not in this file, it is not tracked here; it belongs in the document that owns it, and this file cites it. If this file needs a rule the above does not have, the rule is added in a new version of this file.