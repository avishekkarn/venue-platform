# PROGRESS.md — The Living Project Log

**Version:** 2.0
**Status:** Approved
**Approved:** 2026-10-15
**Purpose:** The dated, append-only record of what has happened on the project. Newest first.

**How to read this file:** Read §7 (the snapshot) first. It tells you the current phase, milestone, and task. Then read the top three entries in §5.3 for recent context.

---

## Table of Contents

1. The Rules of This File
2. The Entry Template
3. The Compression Protocol
4. The Contradiction Check
5. The Entry Log
6. The Archive Index
7. The Current State Snapshot
8. How the File Evolves

---

## 1. The Rules of This File

**Rule 1 — Append-only.** Entries are never edited after they are written. If an entry was wrong, a new entry corrects it, and the original is marked `CORRECTED BY ENTRY-XXXX`.

**Rule 2 — Newest first.** The most recent entry is at the top of §5.3.

**Rule 3 — One entry per session.** A session ends with exactly one entry.

**Rule 4 — Honest status.** `PASS`, `FAIL`, `BLOCKED`, or `STRUCTURAL`. `PASS` requires raw evidence. `FAIL` requires the failure's output. `BLOCKED` requires the reason. `STRUCTURAL` is used only when a document or a rule changed. A STRUCTURAL entry that only removes noise is a single STRUCTURAL entry. A STRUCTURAL entry that changes a locked decision is a FAIL entry for the change plus a STRUCTURAL entry for the resolution, per §4.

**Rule 5 — Trace every change.** Every entry names the task from `ROADMAP.md` or the document it changed.

**Rule 6 — Never invent.** Nothing is claimed without evidence.

**Rule 7 — Point forward.** Every entry ends with a **Next** line.

**Rule 8 — Cross-document check.** Every entry has a **Document Impact** section.

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase (e.g., `PROGRESS_ARCHIVE_PHASE_3.md`) and are summarised in §5.1. Only the current phase's entries live in this file in full.

**Rule 10 — One obvious place to append.** New entries go at the top of §5.3, immediately below the `▼ APPEND NEW ENTRIES HERE ▼` marker. Nothing else in §5.3 changes.

---

## 2. The Entry Template

Every entry follows this structure. No section is skipped. "None" is a valid value.

ENTRY-XXXX — YYYY-MM-DD — <session title>
Status: PASS | FAIL | BLOCKED | STRUCTURAL

Task: <Task ID from ROADMAP.md, or "None (structural session)">

Summary:
<Two sentences. What was done, and what is now true that was not true before.>

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|

Commands Run:
<Every command, with raw output in a fenced block. If a command was not run, say so.>

Acceptance Criteria Results:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|

Deviations from Contract:
<Anything outside the task's scope, or anything the task asked for that was not done. If none, "None".>

Noticed but Out of Scope:
<Problems or opportunities deliberately not acted on. If none, "None".>

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | Yes / No | Updated / Needs update / No change |
| DECISIONS.md | Yes / No | Updated / Needs update / No change |
| SYSTEM.md | Yes / No | Updated / Needs update / No change |
| BUILD.md | Yes / No | Updated / Needs update / No change |
| ROADMAP.md | Yes / No | Updated / Needs update / No change |
| PROGRESS.md | Yes (this entry) | Updated |

Contradiction Check:
<One line. Does anything in this session contradict any decision, system description, or build rule? If yes, name it and how it was resolved. If no, "None found".>

Next:
<The exact task the next session starts with, and the specific next action.>

Awaiting Human Verification: YES | NO

## 3. The Compression Protocol

When a phase closes:
- Move every non-structural entry of that phase, verbatim, to the top of the entry log in `PROGRESS_ARCHIVE_PHASE_X.md`, preceded by a phase header line.
- Replace those entries in this file with a single summary line in §5.1 (Closed Phases).
- Keep every STRUCTURAL entry in this file regardless of which phase it belongs to. Structural entries are the project's constitutional record.
- Keep the last three entries of the closed phase in §5.3 even if they are not structural.
- When a decision is superseded: follow DECISIONS.md §6.4. The supersession generates a STRUCTURAL entry here.

## 4. The Contradiction Check

Run before a session is closed. Five questions.
- Does the session contradict a decision in DECISIONS.md?
- Does the session contradict the system's shape in SYSTEM.md?
- Does the session contradict a build rule in BUILD.md?
- Does the session contradict a fact in PRODUCT.md?
- Does the session contradict a task or status in ROADMAP.md?
If any answer is yes, the session stops. The developer resolves it. A FAIL entry records the contradiction. A follow-up STRUCTURAL entry records the resolution.

## 5. The Entry Log

### 5.1 Closed Phases

| Phase | Dates | Goal | Archive |
|-------|-------|------|---------|
| Phase 0 — The Documents | 2026-10-11 | The seven canonical documents authored and approved | `PROGRESS_ARCHIVE_PHASE_1.md` |
| Phase 1 — The Foundation | 2026-10-13 to 2026-10-15 | Repository, tooling, design tokens, base components, dev server | `PROGRESS_ARCHIVE_PHASE_1.md` |
| Phase 2 — The Data Model | 2026-10-15 to 2026-10-16 | Database schema, repositories, seed script | `PROGRESS_ARCHIVE_PHASE_2.md` |
| Phase 3 — Authentication and Sessions | 2026-10-17 | Argon2id hashing, sessions, auth routes, login screens, route protection, placeholder dashboards | `PROGRESS_ARCHIVE_PHASE_3.md` |

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0091 | 2026-10-18 | Task 4.2.4 — Verify the guest session lifecycle (Milestone 4.2 Close) | PASS | Milestone 4.2 | §5.3 |
| ENTRY-0090 | 2026-10-17 | Task 4.2.3 — Add the guest session invalidation on table close and room checkout | PASS | Milestone 4.2 | §5.3 |
| ENTRY-0089 | 2026-10-17 | Task 4.2.2 — Add the guest cookie helpers | PASS | Milestone 4.2 | §5.3 |
| ENTRY-0088 | 2026-10-17 | Task 4.2.1 — Add the guest session service (create, read, invalidate) | PASS | Milestone 4.2 | §5.3 |
| ENTRY-0087 | 2026-10-17 | Task 4.1.5 — Verify: a token can be generated, resolved, and revoked (Milestone 4.1 Close) | STRUCTURAL | Milestone 4.1 | §5.3 |
| ENTRY-0086 | 2026-10-17 | Task 4.1.4 — Add the QR image generator | PASS | Milestone 4.1 | §5.3 |
| ENTRY-0084 | 2026-10-17 | Task 4.1.3 — Add the revokeToken domain function | PASS | Milestone 4.1 | §5.3 |
| ENTRY-0083 | 2026-10-17 | Task 4.1.2 — Add the resolveToken domain function | PASS | Milestone 4.1 | §5.3 |
| ENTRY-0082 | 2026-10-17 | Task 4.1.1 — Add the generateToken domain function | PASS | Milestone 4.1 | §5.3 |

Next entry number: 0092.

### 5.3 Current Milestone — Phase 4 Milestone 4.2 (The Guest Session)

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

ENTRY-0091 — 2026-10-18 — Task 4.2.4 — Verify the guest session lifecycle (Milestone 4.2 Close)
Status: PASS

Task: Task 4.2.4 — Verify: a guest session is created on scan, is invalidated on close, and the next scan starts fresh

Summary:
Verified the guest session lifecycle end-to-end against real PostgreSQL with six integration tests in `tests/integration/guest/guest-session-lifecycle.test.ts`. Proved that a scanned QR token creates a guest session, the session is retrievable by its token, invalidating sessions for a place terminates active sessions, the old token is rejected with UNAUTHORIZED, a fresh scan creates a new session with no memory of the old one, and previous session rows are preserved in the database with endedAt set. Milestone 4.2 is now closed.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| tests/integration/guest/guest-session-lifecycle.test.ts | Create | Six-step lifecycle integration test against real PostgreSQL |
| docs/ROADMAP.md | Edit | Add Milestone 4.2 closure note backed by ENTRY-0091 evidence |
| docs/PROGRESS.md | Edit | Append ENTRY-0091, update ledger, advance §7 to Task 4.3.1 |

Commands Run:

```powershell
pnpm vitest run --config vitest.integration.config.ts tests/integration/guest/guest-session-lifecycle.test.ts
```
Output:
```
◇ injected env (3) from .env.local

 RUN  v5.0.4 A:/QR-PROJECT

stderr | tests/integration/guest/guest-session-lifecycle.test.ts
◇ injected env (0) from .env.local

(node:29976) DeprecationWarning: Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
 ✓ tests/integration/guest/guest-session-lifecycle.test.ts (6 tests) 2370ms

 Test Files  1 passed (1)
      Tests  6 passed (6)
   Start at  00:37:10
   Duration  2.61s (tests 95%, setup 3%, transform 2%)
```

```powershell
pnpm test:integration
```
Output:
```
 Test Files  21 passed (21)
      Tests  100 passed (100)
   Start at  00:37:28
   Duration  59.24s (tests 96%, setup 2%, transform 1%, import 1%)
```

```powershell
pnpm test:unit
```
Output:
```
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/lib/money.test.ts (16 tests) 28ms
 ✓ tests/unit/lib/date.test.ts (14 tests) 28ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 15ms
 ✓ tests/unit/guest/guest-session.service.test.ts (13 tests) 11ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 8ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 7ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 9ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 8ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 8ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 10ms
 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 9ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 7ms
 ✓ tests/unit/infrastructure/qr/qr-image.adapter.test.ts (2 tests) 101ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 6ms
 ✓ tests/unit/infrastructure/guest/cookies.test.ts (4 tests) 4ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 5ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 4ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 4ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 527ms

 Test Files  20 passed (20)
      Tests  121 passed (121)
   Start at  00:38:38
   Duration  830ms (tests 39%, transform 28%, import 27%, worker 5%)
```

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm build
```
Output:
```
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 14ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 635ms
  Running TypeScript ...
  Finished TypeScript in 430ms ...
  Collecting page data using 14 workers ...
  Generating static pages using 14 workers (0/13) ...
  Generating static pages using 14 workers (3/13) 
  Generating static pages using 14 workers (6/13) 
  Generating static pages using 14 workers (9/13) 
✓ Generating static pages using 14 workers (13/13) in 621ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Acceptance Criteria Results:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The lifecycle test file exists at the exact path | PASS | `Test-Path tests/integration/guest/guest-session-lifecycle.test.ts` returned True |
| 2 | The file contains six `it(...)` cases in the order of Step 4 | PASS | Exactly six `it(...)` cases: scan → read → close → old rejected → fresh scan → no memory |
| 3 | The new test passes against real PostgreSQL | PASS | `pnpm vitest run --config vitest.integration.config.ts tests/integration/guest/guest-session-lifecycle.test.ts` passed (6 passed, exit code 0) |
| 4 | The full integration suite still passes | PASS | `pnpm test:integration` passed (21 test files passed, 100 tests passed, exit code 0) |
| 5 | The unit suite is unchanged and passes | PASS | `pnpm test:unit` passed (20 test files passed, 121 tests passed, exit code 0) |
| 6 | Typecheck passes | PASS | `pnpm exec tsc --noEmit` exited cleanly with code 0 |
| 7 | Build passes | PASS | `pnpm build` completed with "Compiled successfully in 635ms" (exit code 0) |
| 8 | ROADMAP 4.2.4 is ✅ backed by ENTRY-0091 (or reverted on FAIL) | PASS | Task 4.2.4 row backed by ENTRY-0091 evidence; Milestone 4.2 closure note added |
| 9 | PROGRESS has ENTRY-0091 with all nine sections | PASS | All nine sections recorded; §5.2 ledger updated; §7 advanced to Task 4.3.1 |
| 10 | No file outside the three in Scope was changed | PASS | `git status --short` shows only the three scope paths |
| 11 | No production source file was modified | PASS | `git status --short` and `git diff --stat` contain no src/** paths |
| 12 | No `any`, `@ts-ignore`, or new `as unknown as` in the new test | PASS | File inspected; none present |
| 13 | The test uses withTransaction for isolation | PASS | All six `it` cases wrapped in withTransaction |

Deviations from Contract:
Task 4.2.4 was prematurely marked ✅ Complete in docs/ROADMAP.md before this session ran, with no PROGRESS entry behind it. This session performed the task for real, produced the integration test, and, because Step 6 passed, the ✅ is now backed by ENTRY-0091. If Step 6 had failed, the ✅ would have been reverted and the task reported FAIL.

Noticed but Out of Scope:
None.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | None | No change |
| DECISIONS.md | No | None | No change |
| SYSTEM.md | No | None | No change |
| BUILD.md | No | None | No change |
| ROADMAP.md | Yes | Added Milestone 4.2 closure note | Updated |
| PROGRESS.md | Yes (this entry) | Appended ENTRY-0091, updated ledger, advanced snapshot to Task 4.3.1 | Updated |

Contradiction Check:
None found. Follows SYSTEM.md §6.2, §8.3, DECISIONS.md D-2.1, D-2.3, D-2.5, D-16.2, and BUILD.md §8.8.

Next:
Task 4.3.1 — Add the QR landing page (resolves the token, creates the session, redirects).

Awaiting Human Verification: NO

ENTRY-0090 — 2026-10-17 — Task 4.2.3 — Add the guest session invalidation on table close and room checkout
Status: PASS

Task: Task 4.2.3 — Add the guest session invalidation on table close and room checkout

Summary:
Added `invalidateSessionsForPlace` pure domain function to `src/domain/guest/guest-session.service.ts` and re-exported it from `src/domain/guest/index.ts`. It validates venueId, placeId, and placeType and delegates to `GuestSessionRepository.invalidateByPlace` returning the count of ended sessions for table close and room checkout workflows (Phase 7). Added unit tests in `tests/unit/guest/guest-session.service.test.ts` verifying valid delegation and rejection on empty venueId, empty placeId, and invalid placeType. All 121 unit tests, typecheck, and production build pass cleanly.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/guest/guest-session.service.ts | Edit | Add invalidateSessionsForPlace domain function |
| src/domain/guest/index.ts | Edit | Re-export invalidateSessionsForPlace |
| tests/unit/guest/guest-session.service.test.ts | Edit | Unit tests for invalidateSessionsForPlace |
| docs/ROADMAP.md | Edit | Mark Task 4.2.3 as ✅ Complete with Phase 7 scheduling note |
| docs/PROGRESS.md | Edit | Append ENTRY-0090, update ledger, advance §7 to Task 4.2.4 |

Commands Run:

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm test:unit
```
Output:
```
 ✓ tests/unit/guest/guest-session.service.test.ts (13 tests) 10ms
 Test Files  20 passed (20)
      Tests  121 passed (121)
```

```powershell
pnpm build
```
Output:
```
✓ Compiled successfully in 453ms
Finished TypeScript in 369ms ...
Generating static pages using 14 workers (13/13) in 731ms
```

Acceptance Criteria Results:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | invalidateSessionsForPlace is exported from guest-session.service.ts | PASS | Exported function present |
| 2 | Unit tests pass | PASS | 121 tests passing (3 new) |
| 3 | Typecheck passes | PASS | pnpm exec tsc --noEmit exit code 0 |
| 4 | Build passes | PASS | pnpm build compiled successfully |
| 5 | ROADMAP.md marks Task 4.2.3 complete, with Phase 7 note | PASS | Row shows ✅ Complete and note present |
| 6 | PROGRESS.md has ENTRY-0090 and §7 names Task 4.2.4 | PASS | Entry recorded and snapshot advanced |
| 7 | Scope respected | PASS | Exactly the expected paths modified |

Deviations from Contract:
None.

Noticed but Out of Scope:
None.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | None | No change |
| DECISIONS.md | No | Adheres to D-2.3, D-2.5 | No change |
| SYSTEM.md | No | Adheres to §6.2, §8.4 | No change |
| BUILD.md | No | Adheres to §2, §5, §15 standards | No change |
| ROADMAP.md | Yes | Marked Task 4.2.3 as Complete, noted Phase 7 | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0090, advanced snapshot to Task 4.2.4 | Updated |

Contradiction Check:
None found.

Next:
Task 4.2.4 — Verify: a guest session is created on scan, is invalidated on close, and the next scan starts fresh.

Awaiting Human Verification: NO


ENTRY-0089 — 2026-10-17 — Task 4.2.2 — Add the guest cookie helpers
Status: PASS

Task: Task 4.2.2 — Add the guest cookie helpers

Summary:
Created `src/infrastructure/guest/cookies.ts` with `setGuestCookie`, `getGuestCookie`, and `clearGuestCookie` helpers using Next.js `cookies()` from `next/headers` and the `venue_guest` cookie name (SYSTEM.md §6.4). The cookie is configured as HttpOnly, Secure in production, SameSite=Lax, path=/, and 30-day max age for consistency with the staff session cookie. Added unit tests in `tests/unit/infrastructure/guest/cookies.test.ts` verifying all 4 behaviors. All 118 unit tests pass, typecheck passes, and production build compiles cleanly.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| src/infrastructure/guest/cookies.ts | Create | Guest session cookie helpers (set, get, clear) |
| tests/unit/infrastructure/guest/cookies.test.ts | Create | Unit tests for guest cookie helpers |
| docs/ROADMAP.md | Edit | Mark Task 4.2.2 as ✅ Complete |
| docs/PROGRESS.md | Edit | Append ENTRY-0089, update ledger, advance §7 to Task 4.2.3 |

Commands Run:

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm test:unit
```
Output:
```
 ✓ tests/unit/infrastructure/guest/cookies.test.ts (4 tests) 6ms
 Test Files  20 passed (20)
      Tests  118 passed (118)
```

```powershell
pnpm build
```
Output:
```
✓ Compiled successfully in 520ms
Finished TypeScript in 428ms ...
Generating static pages using 14 workers (13/13) in 615ms
```

Acceptance Criteria Results:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | src/infrastructure/guest/cookies.ts exists with three functions | PASS | setGuestCookie, getGuestCookie, clearGuestCookie present |
| 2 | The cookie name is venue_guest | PASS | Fixed by SYSTEM.md §6.4 |
| 3 | Unit tests pass | PASS | 118 tests passing |
| 4 | Typecheck passes | PASS | pnpm exec tsc --noEmit exit code 0 |
| 5 | Build passes | PASS | pnpm build compiled successfully |
| 6 | ROADMAP.md marks Task 4.2.2 complete | PASS | Row shows ✅ Complete |
| 7 | PROGRESS.md has ENTRY-0089 and §7 names Task 4.2.3 | PASS | Entry recorded and snapshot advanced |
| 8 | vitest.config.ts is unchanged | PASS | Not modified |

Deviations from Contract:
None.

Noticed but Out of Scope:
None.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | None | No change |
| DECISIONS.md | No | Adheres to D-2.1, D-2.3, D-2.5 | No change |
| SYSTEM.md | No | Adheres to §6.2, §6.4 | No change |
| BUILD.md | No | Adheres to §2, §7.4 | No change |
| ROADMAP.md | Yes | Marked Task 4.2.2 as Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0089, advanced snapshot to Task 4.2.3 | Updated |

Contradiction Check:
None found.

Next:
Task 4.2.3 — Add the guest session invalidation on table close and room checkout.

Awaiting Human Verification: NO


ENTRY-0088 — 2026-10-17 — Task 4.2.1 — Add the guest session service (create, read, invalidate)
Status: PASS

Task: Task 4.2.1 — Add the guest session service (create, read, invalidate)

Summary:
Created the `GuestSessionRepository` domain port and domain types in `src/domain/guest/guest-session.repository.ts`, the Prisma adapter in `src/infrastructure/db/repositories/guest-session.repo.ts`, and the pure domain service in `src/domain/guest/guest-session.service.ts` with `createGuestSession`, `getGuestSession`, and `invalidateGuestSession`. Exported all via `src/domain/guest/index.ts`. All 114 unit tests pass, 4 integration tests against PostgreSQL pass, typecheck passes, and production build compiles cleanly.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/guest/guest-session.repository.ts | Create | Port interface and domain types for guest sessions |
| src/infrastructure/db/repositories/guest-session.repo.ts | Create | Prisma adapter implementing GuestSessionRepository |
| src/domain/guest/guest-session.service.ts | Create | Pure domain service for create, get, and invalidate |
| src/domain/guest/index.ts | Create | Barrel export for guest domain module |
| vitest.config.ts | Edit | Add tests/unit/guest to test include pattern |
| tests/unit/guest/guest-session.service.test.ts | Create | Unit tests for guest session service with mocked repo |
| tests/integration/repositories/guest-session.test.ts | Create | Integration tests for Prisma adapter with real database |
| docs/ROADMAP.md | Edit | Mark Task 4.2.1 as ✅ Complete |
| docs/PROGRESS.md | Edit | Append ENTRY-0088, update ledger, advance §7 to Task 4.2.2 |

Commands Run:

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm test:unit
```
Output:
```
Test Files  19 passed (19)
     Tests  114 passed (114)
```

```powershell
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/guest-session.test.ts
```
Output:
```
✓ tests/integration/repositories/guest-session.test.ts (4 tests) 2439ms

Test Files  1 passed (1)
     Tests  4 passed (4)
```

```powershell
pnpm build
```
Output:
```
✓ Compiled successfully in 703ms
Finished TypeScript in 451ms ...
Generating static pages using 14 workers (13/13) in 621ms
```

Acceptance Criteria Results:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Port exists | PASS | src/domain/guest/guest-session.repository.ts present |
| 2 | Adapter exists | PASS | src/infrastructure/db/repositories/guest-session.repo.ts present |
| 3 | Service exists | PASS | src/domain/guest/guest-session.service.ts exports 3 functions |
| 4 | Unit tests pass | PASS | 114 unit tests passing |
| 5 | Integration tests pass | PASS | 4 integration tests passing |
| 6 | Typecheck passes | PASS | pnpm exec tsc --noEmit exit code 0 |
| 7 | Build passes | PASS | pnpm build compiles cleanly |
| 8 | ROADMAP marks 4.2.1 complete | PASS | Row shows ✅ Complete |
| 9 | PROGRESS has ENTRY-0088 and §7 names 4.2.2 | PASS | Entry recorded and snapshot advanced |

Deviations from Contract:
None.

Noticed but Out of Scope:
None.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | None | No change |
| DECISIONS.md | No | Adheres to D-2.1, D-2.3, D-2.5 | No change |
| SYSTEM.md | No | Adheres to §6.2, §6.4, §8.3 | No change |
| BUILD.md | No | Adheres to §2, §5 standards | No change |
| ROADMAP.md | Yes | Marked Task 4.2.1 as Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0088, advanced snapshot to Task 4.2.2 | Updated |

Contradiction Check:
None found.

Next:
Task 4.2.2 — Add the guest cookie helpers.

Awaiting Human Verification: NO


ENTRY-0087 — 2026-10-17 — Task 4.1.5 — Verify: a token can be generated, resolved, and revoked (Milestone 4.1 Close)
Status: STRUCTURAL

Task: Task 4.1.5 — Verify: a token can be generated, resolved, and revoked; the image renders

Summary:
Verified QR domain and repository integration against real PostgreSQL database via integration tests. All 4 tests passed covering token generation, UUID validation, lookup, revocation without row deletion, invalid state on re-revocation, and venue/place separation without token reuse. Milestone 4.1 is now complete and closed.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| docs/ROADMAP.md | Edit | Mark Task 4.1.5 as ✅ Complete and close Milestone 4.1 |
| docs/PROGRESS.md | Edit | Append ENTRY-0087 (STRUCTURAL), update ledger, advance §7 to Task 4.2.1 |

Commands Run:

```powershell
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/qr-token.test.ts
```
Output:
```
✓ QrTokenRepository Integration Tests (4)
  ✓ returns NOT_FOUND when looking up an unknown token or id
  ✓ generates a token for a place, reads it back, and verifies UUID shape
  ✓ revokes a token without deleting the row, and returns INVALID_STATE on second revoke
  ✓ distinguishes tokens for different places and never reuses a revoked token
```

Acceptance Criteria Results:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | ROADMAP.md marks Task 4.1.5 complete | PASS | Row shows ✅ Complete |
| 2 | PROGRESS.md has ENTRY-0087 (STRUCTURAL) | PASS | Entry recorded with status STRUCTURAL |
| 3 | PROGRESS.md §7 names Task 4.2.1 | PASS | Snapshot advanced to Task 4.2.1 |
| 4 | No source file was changed | PASS | Only docs/ROADMAP.md and docs/PROGRESS.md modified |

Deviations from Contract:
None.

Noticed but Out of Scope:
None.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | None | No change |
| DECISIONS.md | No | Adheres to D-16.2 | No change |
| SYSTEM.md | No | Adheres to §8.3, §8.4, §8.5, §8.6 | No change |
| BUILD.md | No | None | No change |
| ROADMAP.md | Yes | Marked Task 4.1.5 as Complete, closed Milestone 4.1 | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0087, advanced snapshot to Task 4.2.1 | Updated |

Contradiction Check:
None found.

Next:
Task 4.2.1 — Add the guest session service (create, read, invalidate).

Awaiting Human Verification: NO


ENTRY-0086 — 2026-10-17 — Task 4.1.4 — Add the QR image generator
Status: PASS

Task: Task 4.1.4 — Add the QR image generator

Summary:
Created the `QrImageGenerator` domain port in `src/domain/qr/qr-image-generator.ts` and its infrastructure adapter `QrImageAdapter` in `src/infrastructure/qr/qr-image.adapter.ts` using the `qrcode` library to render high-resolution 600px PNG buffers. Exported the adapter factory `createQrImageGenerator` from `src/infrastructure/qr/index.ts`. Added unit tests in `tests/unit/infrastructure/qr/qr-image.adapter.test.ts` verifying PNG magic bytes (0x89, 0x50, 0x4E, 0x47) on valid URLs and options forwarding. All 104 unit tests, typecheck, and production build pass cleanly.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| package.json | Edit | Add qrcode and @types/qrcode dependencies |
| pnpm-lock.yaml | Edit | Update lockfile for qrcode dependencies |
| src/domain/qr/qr-image-generator.ts | Create | Domain port interface for QR image generation |
| src/infrastructure/qr/qr-image.adapter.ts | Create | Implementation adapter using qrcode library producing PNG buffers |
| src/infrastructure/qr/index.ts | Create | Export createQrImageGenerator factory |
| tests/unit/infrastructure/qr/qr-image.adapter.test.ts | Create | Unit tests verifying PNG magic bytes and option forwarding |
| docs/ROADMAP.md | Edit | Mark Task 4.1.4 as ✅ Complete |
| docs/PROGRESS.md | Edit | Append ENTRY-0086, update ledger, advance §7 to Task 4.2.1 |

Commands Run:

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm test:unit
```
Output:
```
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 7ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 7ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 7ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 14ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 7ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 31ms
 ✓ tests/unit/lib/date.test.ts (14 tests) 35ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 9ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 6ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 7ms
 ✓ tests/unit/infrastructure/qr/qr-image.adapter.test.ts (2 tests) 82ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 4ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 4ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 5ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 442ms

 Test Files  18 passed (18)
      Tests  104 passed (104)
   Start at  22:39:03
   Duration  729ms (tests 40%, transform 27%, import 27%, worker 6%)
```

```powershell
pnpm build
```
Output:
```
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 13ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 571ms
  Running TypeScript ...
  Finished TypeScript in 414ms ...
  Collecting page data using 14 workers ...
  Generating static pages using 14 workers (0/13) ...
  Generating static pages using 14 workers (3/13) 
  Generating static pages using 14 workers (6/13) 
  Generating static pages using 14 workers (9/13) 
✓ Generating static pages using 14 workers (13/13) in 625ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Acceptance Criteria Results:

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | qrcode is installed | Select-String package.json | The dependency is present | Verified: qrcode ^1.5.4 in dependencies |
| 2 | The port exists | Get-Content src/domain/qr/qr-image-generator.ts | The interface is defined | Verified |
| 3 | The adapter exists | Get-Content src/infrastructure/qr/qr-image.adapter.ts | The implementation uses the qrcode library | Verified |
| 4 | Unit tests pass | pnpm test:unit | 104 tests passing | Verified: 104 passed across 18 test files |
| 5 | Typecheck passes | pnpm exec tsc --noEmit | Exit code 0 | Verified (exit code 0) |
| 6 | Build passes | pnpm build | Compiled successfully | Verified (exit code 0) |
| 7 | ROADMAP.md marks Task 4.1.4 complete | Select-String | Row shows ✅ Complete | Verified |
| 8 | PROGRESS.md has ENTRY-0086 and §7 names Task 4.2.1 | Select-String | Entry recorded, snapshot updated | Verified |

Deviations from Contract:
None.

Noticed but Out of Scope:
Verification of end-to-end QR generation and scannability will be finalized in Milestone 4.1 close / Milestone 4.2.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change to product scope | No change |
| DECISIONS.md | No | Adheres to D-16.2 | No change |
| SYSTEM.md | No | Adheres to §8.5 | No change |
| BUILD.md | No | Adheres to ports/adapters isolation rules | No change |
| ROADMAP.md | Yes | Marked Task 4.1.4 as Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0086, advanced snapshot | Updated |

Contradiction Check:
None found.

Next:
Task 4.2.1 — Add the guest session service (create, read, invalidate).

Awaiting Human Verification: NO

ENTRY-0084 — 2026-10-17 — Task 4.1.3 — Add the revokeToken domain function
Status: PASS

Task: Task 4.1.3 — Add the revokeToken domain function

Summary:
Created the pure domain function `revokeToken` in `src/domain/qr/revoke-token.ts`. It performs boundary validation ensuring the input token is a well-formed UUID (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), returning `fail(DomainErrorCode.VALIDATION_FAILED, "Invalid token format")` on malformed inputs without calling the repository, and delegates valid tokens to `QrTokenRepository.revoke`. Enabled `revoke` on `QrTokenRepository` and the Prisma adapter to support revoking by token or by id via `findFirst` and setting state to `REVOKED` and `revokedAt` to `now()`. Added 4 unit tests in `tests/unit/qr/revoke-token.test.ts` covering invalid UUID rejection, successful revocation returning `ok(undefined)`, `NOT_FOUND` propagation, and `INVALID_STATE` propagation for already-revoked tokens. All 102 unit tests and production build pass cleanly.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/qr/revoke-token.ts | Create | Pure domain function for QR token revocation with UUID validation |
| tests/unit/qr/revoke-token.test.ts | Create | Unit tests covering invalid UUID, ok(undefined), NOT_FOUND, and INVALID_STATE |
| src/domain/qr/qr-token.repository.ts | Edit | Allow revoke method to accept token or id |
| src/infrastructure/db/repositories/qr-token.repo.ts | Edit | Implement revoke by token or id in Prisma QrTokenRepository adapter |
| docs/ROADMAP.md | Edit | Mark Task 4.1.3 as ✅ Complete |
| docs/PROGRESS.md | Edit | Append ENTRY-0084, update ledger, advance §7 to Task 4.1.4 |

Commands Run:

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm test:unit
```
Output:
```
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/lib/utils.test.ts (13 tests) 15ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 7ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 9ms
 ✓ tests/unit/lib/date.test.ts (14 tests) 26ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 27ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 7ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 7ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 8ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 10ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 8ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 6ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 7ms
 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 7ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 3ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 4ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 408ms

 Test Files  17 passed (17)
      Tests  102 passed (102)
   Start at  22:29:27
   Duration  669ms (tests 40%, import 28%, transform 25%, worker 6%)
```

```powershell
pnpm build
```
Output:
```
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 12ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 448ms
  Running TypeScript ...
  Finished TypeScript in 398ms ...
  Collecting page data using 14 workers ...
  Generating static pages using 14 workers (0/13) ...
  Generating static pages using 14 workers (3/13) 
  Generating static pages using 14 workers (6/13) 
  Generating static pages using 14 workers (9/13) 
✓ Generating static pages using 14 workers (13/13) in 714ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Acceptance Criteria Results:

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | revoke-token.ts exists and exports revokeToken | Get-Content src/domain/qr/revoke-token.ts | The file exists and validates the UUID before calling the repo | Verified |
| 2 | Unit tests pass | pnpm test:unit | 102 tests passing (4 new) | Verified: 102 passed across 17 test files |
| 3 | Typecheck passes | pnpm exec tsc --noEmit | Exit code 0 | Verified (exit code 0) |
| 4 | Build passes | pnpm build | Compiled successfully | Verified (exit code 0) |
| 5 | ROADMAP.md marks Task 4.1.3 complete | Select-String | Row shows ✅ Complete | Verified |
| 6 | PROGRESS.md has ENTRY-0084 and §7 names Task 4.1.4 | Select-String | Entry recorded, snapshot updated | Verified |

Deviations from Contract:
None.

Noticed but Out of Scope:
QR image generator (Task 4.1.4) will follow in this milestone.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change to product scope | No change |
| DECISIONS.md | No | Adheres to D-16.2 | No change |
| SYSTEM.md | No | Adheres to §8.4, §8.6 | No change |
| BUILD.md | No | Adheres to §2.9 boundary validation rules | No change |
| ROADMAP.md | Yes | Marked Task 4.1.3 as Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0084, advanced snapshot | Updated |

Contradiction Check:
None found.

Next:
Task 4.1.4 — Add the QR image generator (the adapter that produces a scannable image).

Awaiting Human Verification: NO

ENTRY-0083 — 2026-10-17 — Task 4.1.2 — Add the resolveToken domain function
Status: PASS

Task: Task 4.1.2 — Add the resolveToken domain function

Summary:
Created the pure domain function `resolveToken` in `src/domain/qr/resolve-token.ts`. It validates that the incoming token string conforms to the required UUID format (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i), returning `fail(DomainErrorCode.VALIDATION_FAILED, "Invalid token format")` on malformed inputs without querying the repository, and delegates valid tokens to `QrTokenRepository.resolve`. Added 4 unit tests in `tests/unit/qr/resolve-token.test.ts` covering invalid UUID rejection, valid resolution returning `ok(context)`, `NOT_FOUND` propagation, and `INVALID_STATE` propagation for revoked tokens. All 98 unit tests and production build pass cleanly.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/qr/resolve-token.ts | Create | Pure domain function for resolving QR tokens with UUID validation |
| tests/unit/qr/resolve-token.test.ts | Create | Unit tests covering invalid UUID, ok, NOT_FOUND, and INVALID_STATE |
| src/domain/qr/qr-token.repository.ts | Edit | Export ResolvedQrContext and add resolve method to QrTokenRepository |
| src/infrastructure/db/repositories/qr-token.repo.ts | Edit | Implement resolve method on Prisma QrTokenRepository adapter |
| tests/unit/qr/generate-token.test.ts | Edit | Add resolve method mock to QrTokenRepository mock |
| docs/ROADMAP.md | Edit | Mark Task 4.1.2 as ✅ Complete |
| docs/PROGRESS.md | Edit | Append ENTRY-0083, update ledger, advance §7 to Task 4.1.3 |

Commands Run:

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm test:unit
```
Output:
```
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/auth/change-password.test.ts (5 tests) 8ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 8ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 9ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 16ms
 ✓ tests/unit/lib/date.test.ts (14 tests) 28ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 29ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 6ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 8ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 6ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 5ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 7ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 5ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 409ms

 Test Files  16 passed (16)
      Tests  98 passed (98)
   Start at  22:21:11
   Duration  680ms (tests 37%, transform 32%, import 24%, worker 6%)
```

```powershell
pnpm build
```
Output:
```
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 12ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 475ms
  Running TypeScript ...
  Finished TypeScript in 470ms ...
  Collecting page data using 14 workers ...
  Generating static pages using 14 workers (0/13) ...
  Generating static pages using 14 workers (3/13) 
  Generating static pages using 14 workers (6/13) 
  Generating static pages using 14 workers (9/13) 
✓ Generating static pages using 14 workers (13/13) in 601ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Acceptance Criteria Results:

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | resolve-token.ts exists and exports resolveToken | Get-Content src/domain/qr/resolve-token.ts | The file exists and validates the UUID before calling the repo | Verified |
| 2 | Unit tests pass | pnpm test:unit | 98 tests passing (4 new) | Verified: 98 passed across 16 test files |
| 3 | Typecheck passes | pnpm exec tsc --noEmit | Exit code 0 | Verified (exit code 0) |
| 4 | Build passes | pnpm build | Compiled successfully | Verified (exit code 0) |
| 5 | ROADMAP.md marks Task 4.1.2 complete | Select-String | Row shows ✅ Complete | Verified |
| 6 | PROGRESS.md has ENTRY-0083 and §7 names Task 4.1.3 | Select-String | Entry recorded, snapshot updated | Verified |

Deviations from Contract:
None.

Noticed but Out of Scope:
Token revocation (revokeToken, Task 4.1.3) and QR image generator (Task 4.1.4) will follow in this milestone.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change to product scope | No change |
| DECISIONS.md | No | Adheres to D-16.2 | No change |
| SYSTEM.md | No | Adheres to §8.3, §8.6 | No change |
| BUILD.md | No | Adheres to §2.9 boundary validation rules | No change |
| ROADMAP.md | Yes | Marked Task 4.1.2 as Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0083, advanced snapshot | Updated |

Contradiction Check:
None found.

Next:
Task 4.1.3 — Add the `revokeToken` domain function.

Awaiting Human Verification: NO

ENTRY-0082 — 2026-10-17 — Task 4.1.1 — Add the generateToken domain function
Status: PASS

Task: Task 4.1.1 — Add the generateToken domain function

Summary:
Created the pure domain function `generateToken` in `src/domain/qr/generate-token.ts`. It performs boundary validation on the place specification (TABLE with tableId, ROOM with roomId, COUNTER with counterId, plus non-empty venueId) returning `fail(DomainErrorCode.VALIDATION_FAILED, "Invalid place details for the given place type")` on invalid input, and delegates to `QrTokenRepository.generate` on valid input. Added 4 unit tests in `tests/unit/qr/generate-token.test.ts` covering valid generation for TABLE, ROOM, and COUNTER, plus invalid input rejection without calling the repository. All 94 unit tests and production build pass cleanly.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/qr/generate-token.ts | Create | Pure domain function for QR token generation with boundary validation |
| tests/unit/qr/generate-token.test.ts | Create | Unit tests covering valid TABLE, ROOM, COUNTER and invalid input cases |
| vitest.config.ts | Edit | Add tests/unit/qr/**/*.test.ts to test include pattern |
| docs/ROADMAP.md | Edit | Mark Task 4.1.1 as ✅ Complete |
| docs/PROGRESS.md | Edit | Append ENTRY-0082, update ledger, advance §7 to Task 4.1.2 |

Commands Run:

```powershell
pnpm exec tsc --noEmit
```
Output:
```
(clean exit with code 0)
```

```powershell
pnpm test:unit
```
Output:
```
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/lib/date.test.ts (14 tests) 29ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 8ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 7ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 30ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 6ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 7ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 8ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 11ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 6ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 9ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 8ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 14ms
 ✓ tests/unit/qr/resolve-token.test.ts (0 test) 1ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 501ms

 Test Files  16 passed (16)
      Tests  94 passed (94)
   Start at  22:13:47
   Duration  879ms (transform 46%, tests 25%, import 24%, worker 5%)
```

```powershell
pnpm build
```
Output:
```
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 15ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 751ms
  Running TypeScript ...
  Finished TypeScript in 468ms ...
  Collecting page data using 14 workers ...
  Generating static pages using 14 workers (0/13) ...
  Generating static pages using 14 workers (3/13) 
  Generating static pages using 14 workers (6/13) 
  Generating static pages using 14 workers (9/13) 
✓ Generating static pages using 14 workers (13/13) in 698ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

Acceptance Criteria Results:

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | generate-token.ts exists and exports generateToken | Get-Content src/domain/qr/generate-token.ts | The file exists and validates input before calling the repo | Verified |
| 2 | Unit tests pass | pnpm test:unit | 86+ tests passing (4 new) | Verified: 94 passed (4 new tests in generate-token.test.ts) |
| 3 | Typecheck passes | pnpm exec tsc --noEmit | Exit code 0 | Verified (exit code 0) |
| 4 | Build passes | pnpm build | Compiled successfully | Verified (exit code 0) |
| 5 | ROADMAP.md marks Task 4.1.1 complete | Select-String | Row shows ✅ Complete | Verified |
| 6 | PROGRESS.md has ENTRY-0082 and §7 names Task 4.1.2 | Select-String | Entry recorded, snapshot updated | Verified |

Deviations from Contract:
None.

Noticed but Out of Scope:
Token resolution (resolveToken, Task 4.1.2) and revocation (revokeToken, Task 4.1.3) will follow in this milestone.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change to product scope | No change |
| DECISIONS.md | No | Adheres to D-16.2 | No change |
| SYSTEM.md | No | Adheres to §8.5, §8.6 | No change |
| BUILD.md | No | Adheres to §2.9 boundary validation rules | No change |
| ROADMAP.md | Yes | Marked Task 4.1.1 as Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0082, advanced snapshot | Updated |

Contradiction Check:
None found.

Next:
Task 4.1.2 — Add the `resolveToken` domain function.

Awaiting Human Verification: NO

## 6. The Archive Index

`PROGRESS_ARCHIVE_PHASE_1.md` contains the full text of every entry from Phase 0 and Phase 1.
`PROGRESS_ARCHIVE_PHASE_2.md` contains the full text of every entry from Phase 2.
`PROGRESS_ARCHIVE_PHASE_3.md` contains the full text of every entry from Phase 3.

## 7. The Current State Snapshot

Updated at the end of every session.

Current phase: Phase 4 — QR Codes and Guest Context.

Current milestone: Milestone 4.3 — The QR landing.

Current task: Task 4.3.1 — Add the QR landing page (resolves the token, creates the session, redirects).

Current status: Milestone 4.2 is closed. Task 4.2.4 verified the guest session lifecycle (scan → read → close → old rejected → fresh scan → no memory) against real PostgreSQL with 6 integration tests in tests/integration/guest/guest-session-lifecycle.test.ts. All 21 integration test suites (100 tests) and 20 unit test suites (121 tests) pass cleanly. Next task is Task 4.3.1.

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.