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

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase (e.g., `PROGRESS_ARCHIVE_PHASE_2.md`) and are summarised in §5.1. Only the current phase's entries live in this file in full.

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

Path Action Purpose
Commands Run:
<Every command, with raw output in a fenced block. If a command was not run, say so.>

Acceptance Criteria Results:

# Criterion Result Evidence

Deviations from Contract:
<Anything outside the task's scope, or anything the task asked for that was not done. If none, "None".>

Noticed but Out of Scope:
<Problems or opportunities deliberately not acted on. If none, "None".>

Document Impact:

Document Affected? Reason Action
PRODUCT.md Yes / No Updated / Needs update / No change
DECISIONS.md Yes / No Updated / Needs update / No change
SYSTEM.md Yes / No Updated / Needs update / No change
BUILD.md Yes / No Updated / Needs update / No change
ROADMAP.md Yes / No Updated / Needs update / No change
PROGRESS.md Yes (this entry) Updated
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

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0053 | 2026-10-17 | Task 3.1.1 — Add the password hashing service (hash and verify) | PASS | Milestone 3.1 | §5.3 |

Next entry number: 0054.

### 5.3 Current Milestone — Phase 3 Milestone 3.1 (Session infrastructure)

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

ENTRY-0053 — 2026-10-17 — Task 3.1.1 — Add the password hashing service (hash and verify)
Status: PASS

Task: Task 3.1.1 — Add the password hashing service (hash and verify)

Summary:
Implemented the Argon2id password hashing and verification service in `src/infrastructure/auth/password.ts` exporting `hashPassword` and `verifyPassword`. Added unit tests covering hashing, verification, wrong password rejection, salting divergence, and malformed hash rejection in `tests/unit/infrastructure/auth/password.test.ts`.

Files Changed:

| Path | Action | Purpose |
|------|--------|---------|
| package.json | Edit | Registered argon2 dependency |
| pnpm-lock.yaml | Edit | Updated lockfile for argon2 |
| pnpm-workspace.yaml | Edit | Added argon2 to allowBuilds |
| src/infrastructure/auth/password.ts | Edit | Implemented hashPassword and verifyPassword using Argon2id |
| tests/unit/infrastructure/auth/password.test.ts | Create | Added 5 unit tests for password hashing service |
| vitest.config.ts | Edit | Widened include pattern to include tests/unit/infrastructure/**/*.test.ts per user authorization |
| docs/ROADMAP.md | Edit | Marked Task 3.1.1 as ✅ Complete |
| docs/PROGRESS.md | Edit | Appended ENTRY-0053, updated ledger, advanced §7 to Task 3.1.2 |

Commands Run:

```powershell
Select-String -Path package.json -Pattern "argon2"
```
Output:
```
package.json:28:    "argon2": "^0.45.1",
```

```powershell
pnpm vitest run --config vitest.config.ts tests/unit/infrastructure/auth/password.test.ts
```
Output:
```
 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 389ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  14:31:59
   Duration  549ms (tests 90%, transform 5%, import 4%, worker 1%)
```

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

 ✓ tests/unit/lib/money.test.ts (16 tests) 22ms
 ✓ tests/unit/lib/date.test.ts (14 tests) 20ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 13ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 391ms

 Test Files  4 passed (4)
      Tests  48 passed (48)
   Start at  14:32:11
   Duration  562ms (tests 71%, transform 17%, import 9%, worker 3%)
```

```powershell
pnpm test:integration
```
Output:
```
 Test Files  15 passed (15)
      Tests  78 passed (78)
   Start at  14:32:18
   Duration  49.31s (tests 97%, setup 2%, transform 1%)
```

```powershell
Select-String -Path src/infrastructure/auth/password.ts -Pattern "argon2id"
```
Output:
```
src\infrastructure\auth\password.ts:4: * Provides functions to hash passwords using Argon2id and to verify
src\infrastructure\auth\password.ts:8: * - Uses the Argon2id variant per DECISIONS.md D-3.9.
src\infrastructure\auth\password.ts:19:  return argon2.hash(plain, { type: argon2.argon2id });
```

```powershell
Select-String -Path src/infrastructure/auth/password.ts -Pattern 'from ["'']@prisma/client["'']|from ["'']react["'']|from ["'']@/domain'
```
Output:
```
(empty output, clean exit with code 0)
```

Acceptance Criteria Results:

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `argon2` is present in dependencies | PASS | `package.json:28: "argon2": "^0.45.1"` |
| 2 | `hashPassword` and `verifyPassword` exported from `password.ts` | PASS | Explicit typings, uses `argon2.argon2id`, handles errors safely |
| 3 | 5 unit tests pass in `tests/unit/infrastructure/auth/password.test.ts` | PASS | `tests/unit/infrastructure/auth/password.test.ts (5 tests)` passed |
| 4 | Typecheck passes cleanly | PASS | `pnpm exec tsc --noEmit` exited 0 |
| 5 | Full unit suite passes with 48 tests | PASS | `Test Files 4 passed (4), Tests 48 passed (48)` |
| 6 | Integration test suite remains green | PASS | `Test Files 15 passed (15), Tests 78 passed (78)` |
| 7 | Argon2id confirmed as hashing algorithm | PASS | `argon2.hash(plain, { type: argon2.argon2id })` confirmed |
| 8 | Infrastructure boundary respected (no domain/React/Prisma imports) | PASS | Boundary check regex produced empty output |
| 9 | ROADMAP.md updated | PASS | Task 3.1.1 marked ✅ Complete |
| 10 | PROGRESS.md updated | PASS | ENTRY-0053 appended, snapshot advanced to Task 3.1.2 |

Deviations from Contract:
Widened `vitest.config.ts` to include `tests/unit/infrastructure/**/*.test.ts` upon explicit user authorization, expanding touched files from 7 to 8 to resolve test runner path filtering.

Noticed but Out of Scope:
The `argon2` package uses library default cost parameters (memoryCost 65536 KiB, timeCost 3, parallelism 4), which align with D-3.9 and SYSTEM.md §15.3.

Document Impact:

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change to product scope | No change |
| DECISIONS.md | No | D-3.9 already recorded in Task 3.0 | No change |
| SYSTEM.md | No | Aligns with §15.3 | No change |
| BUILD.md | No | Aligns with §2, §5, §7.4, §8.8 | No change |
| ROADMAP.md | Yes | Task 3.1.1 marked complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0053 | Updated |

Contradiction Check:
None found.

Next:
Task 3.1.2 — Seed the staff members with different roles. The first action: read prisma/seed.ts to confirm the existing seeding functions and the StaffRepository.create input shape, then write a seedStaff() function that hashes each staff member's password via hashPassword and creates the staff member via createPrismaStaffRepository(prisma).create(...).

Awaiting Human Verification: YES

## 6. The Archive Index

`PROGRESS_ARCHIVE_PHASE_1.md` contains the full text of every entry from Phase 0 and Phase 1.
`PROGRESS_ARCHIVE_PHASE_2.md` contains the full text of every entry from Phase 2.

## 7. The Current State Snapshot

Updated at the end of every session.

Current phase: Phase 3 — Authentication and Sessions.

Current milestone: Milestone 3.1 — Session infrastructure.

Current task: Task 3.1.2 — Seed the staff members with different roles.

Current status: Task 3.1.1 is complete. The Argon2id password hashing and verification service is implemented in `src/infrastructure/auth/password.ts` and verified with 5 unit tests. All unit tests (48/48) and integration tests (78/78) pass. TypeScript check clean. Next task is Task 3.1.2.

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.

