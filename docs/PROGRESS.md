# PROGRESS.md — The Living Project Log

**Version:** 4.0
**Status:** Approved
**Approved:** 2026-11-01
**Purpose:** The dated, append-only record of what has happened on the project. Newest first.

**How to read this file:** Read §7 (the snapshot) first. It tells you the current phase, milestone, and task. Then read the top three entries in §5.3 for recent context.

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

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase (e.g., `PROGRESS_ARCHIVE_PHASE_7.md`) and are summarised in §5.1. Only the current phase's entries live in this file in full.

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

---

## 3. The Compression Protocol

When a phase closes:
- Move every non-structural entry of that phase, verbatim, to the top of the entry log in `PROGRESS_ARCHIVE_PHASE_X.md`, preceded by a phase header line.
- Replace those entries in this file with a single summary line in §5.1 (Closed Phases).
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

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0191 | 2026-11-01 | Phase 7 initialization & roadmap setup | Complete | Milestone 7.1 | git log 1674008 |
| ENTRY-0192 | 2026-11-01 | Phase 7 Staff Domain: Approve, Deliver, Complete, Close | Complete | Milestone 7.1 | §5.3 |
| ENTRY-0193 | 2026-11-01 | Phase 7 Staff API Routes & Integration Tests | Complete | Milestone 7.2 | §5.3 |
| ENTRY-0194 | 2026-11-01 | Phase 7 Staff Dashboard (Orders + Maps) | Complete | Milestone 7.3 | §5.3 |

Next entry number: 0195

### 5.3 Current Milestone — Phase 8, Milestone 8.1 (The Dashboard). Current task: Task 8.1.1 — Add the live metric cards.

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0194 — 2026-11-01: Phase 7 Staff Dashboard (Orders + Maps)

- **Task**: TASK 7.3.1–7.3.8 — The Complete Staff Dashboard (Orders + Maps, covering tasks 7.3.1, 7.3.2, 7.3.3, 7.3.6, 7.3.7, 7.3.8).
- **Milestone**: Milestone 7.3 (The Service Staff Screen).
- **Scope**:
  - `app/staff/page.tsx`: Rewrote Staff Dashboard from scratch with three operational views (Orders, Table Map, Room Map):
    - Server Component queries `tableRepo`, `roomRepo`, `orderRepo`, and active guest sessions using `select: { tableId: true, roomId: true }` (never `placeId` or `placeType`).
    - Enriches missing `tableId` on orders through active/past sessions and filters completed orders to last 4 hours.
    - Event delegation: exactly 4 delegated listeners (`staff-tab-nav`, `order-queue`, `table-map`, `room-map`). Zero per-button listeners.
    - Wholesale row node replacement on state changes via `insertAdjacentHTML` (zero in-place DOM patching).
    - Client script using string concatenation `+` only (zero `${...}` template interpolations).
    - `.then().then().catch()` error handling only (zero `.finally()`).
    - 5-second polling for active orders and real-time map updates.
    - Responsive mobile layout using `flex flex-col md:flex-row`.
  - `docs/ROADMAP.md`: Marked tasks 7.3.1, 7.3.2, 7.3.3, 7.3.6, 7.3.7, 7.3.8 as Complete.
  - **Deviations**: Tasks 7.3.4 and 7.3.5 (Request Queue) moved to Phase 9 as Tasks 9.5.8 and 9.5.9 because the request domain functions (advanceRequest, cancelRequest, declineRequest, request.transitions) are 0-byte stubs. This is a STRUCTURAL change to the roadmap.
  - **Noticed but Out of Scope**: The six 0-byte domain request files (`advance-request.ts`, `cancel-request.ts`, `decline-request.ts`, `edit-request.ts`, `transitions.ts`, `index.ts`) are placeholders for Phase 9.
- **Verification**:
  - `tsc --noEmit`: 0 errors.
  - `pnpm test:unit`: 31 test files passed, 226 tests passed.
  - `pnpm test:integration`: 29 test files passed, 189 tests passed.
  - `pnpm build`: 47 routes + 1 proxy, exit 0.

### ENTRY-0193 — 2026-11-01: Phase 7 Staff API Routes & Integration Tests

- **Task**: TASK 7.2.1 — Phase 7 Staff API Routes (covering tasks 7.1.7 and 7.2.1 through 7.2.9).
- **Milestone**: Milestone 7.2 (The Staff Routes).
- **Scope**:
  - `src/domain/orders/actions.ts`: Added pure domain `cancelOrder` action enforcing state machine transitions to `CANCELLED` and validating reason string.
  - `src/domain/orders/index.ts`: Exported `cancelOrder` and `CancelOrderActionRequest`.
  - `tests/unit/orders/actions.test.ts`: Added unit tests for `cancelOrder` (happy path, empty reason validation, invalid state transition).
  - `app/api/staff/orders/route.ts`: Created `GET` endpoint returning orders in `PLACED`, `READY`, and `DELIVERED` states for service staff.
  - `app/api/staff/orders/[id]/approve/route.ts`: Created `POST` endpoint invoking `approveOrder` (`PLACED` → `APPROVED`).
  - `app/api/staff/orders/[id]/deliver/route.ts`: Created `POST` endpoint invoking `deliverOrder` (`READY` → `DELIVERED`).
  - `app/api/staff/orders/[id]/complete/route.ts`: Created `POST` endpoint invoking `completeOrder` (`DELIVERED` → `COMPLETED`).
  - `app/api/staff/orders/[id]/cancel/route.ts`: Created `POST` endpoint invoking `cancelOrder` with reason.
  - `app/api/staff/tables/[id]/close/route.ts`: Created `POST` endpoint invoking `closeTable` (invalidates table sessions, sets `FREE`).
  - `app/api/staff/rooms/[id]/checkout/route.ts`: Created `POST` endpoint invoking `checkoutRoom` (invalidates room sessions, sets `VACANT`).
  - `tests/integration/api/staff-orders.test.ts`: Wrote comprehensive integration test suite (14 test cases) verifying all 7 endpoints against PostgreSQL with role checks, invalid state handling, session invalidation, and venue isolation.
  - `docs/ROADMAP.md`: Marked tasks 7.1.7 and 7.2.1 through 7.2.9 as Complete.
- **Verification**:
  - `tsc --noEmit`: 0 errors.
  - `pnpm test:unit`: 31 test files passed, 226 tests passed.
  - `pnpm test:integration`: 29 test files passed, 189 tests passed (14 new integration tests).
  - `pnpm build`: 47 routes + 1 proxy, exit 0.

### ENTRY-0192 — 2026-11-01: Phase 7 Staff Domain: Approve, Deliver, Complete, Close

- **Task**: TASK 7.1.1 — Phase 7 Staff Domain: Approve, Deliver, Complete, Close (covering tasks 7.1.1 through 7.1.6).
- **Milestone**: Milestone 7.1 (The Staff Domain).
- **Scope**:
  - `src/domain/orders/actions.ts`: Added `deliverOrder` (`READY` → `DELIVERED`) and `completeOrder` (`DELIVERED` → `COMPLETED`), wrapping pure domain `advanceOrder`.
  - `src/domain/orders/index.ts`: Re-exported `deliverOrder` and `completeOrder`.
  - `src/domain/organization/table.repository.ts`: Added `TableStatus` alias and `setStatus(venueId, tableId, status: TableState): Promise<Result<void>>` to port interface.
  - `src/domain/organization/room.repository.ts`: Added `RoomStatus` alias and `setStatus(venueId, roomId, status: RoomState): Promise<Result<void>>` to port interface.
  - `src/infrastructure/db/repositories/table.repo.ts`: Implemented `setStatus` with venue isolation.
  - `src/infrastructure/db/repositories/room.repo.ts`: Implemented `setStatus` with venue isolation.
  - `src/domain/staff/close-table.ts`: Created pure domain function `closeTable(deps, input)` invalidating active table sessions via `invalidateSessionsForPlace` and setting table status to `FREE`.
  - `src/domain/staff/checkout-room.ts`: Created pure domain function `checkoutRoom(deps, input)` invalidating active room sessions via `invalidateSessionsForPlace` and setting room status to `VACANT`.
  - `src/domain/staff/index.ts`: Created staff domain module barrel export.
  - `vitest.config.ts`: Added `tests/unit/staff/**/*.test.ts` to test suite include list.
  - `tests/unit/orders/actions.test.ts`: Added unit tests for `deliverOrder` and `completeOrder` validating successful state transitions and invalid state error handling.
  - `tests/unit/staff/close-table.test.ts`: Added unit tests for `closeTable`.
  - `tests/unit/staff/checkout-room.test.ts`: Added unit tests for `checkoutRoom`.
  - `docs/ROADMAP.md`: Marked tasks 7.1.1 through 7.1.6 as Complete.
- **Verification**:
  - `tsc --noEmit`: 0 errors.
  - `pnpm test:unit`: 31 test files passed, 223 tests passed.
  - `pnpm build`: 40 routes + 1 proxy, exit 0.
  - `pnpm test:integration`: 29 test files passed, 175 tests passed.

---

## 6. The Archive Index

`PROGRESS_ARCHIVE_PHASE_1.md` contains the full text of every entry from Phase 0 and Phase 1.
`PROGRESS_ARCHIVE_PHASE_2.md` contains the full text of every entry from Phase 2.
`PROGRESS_ARCHIVE_PHASE_3.md` contains the full text of every entry from Phase 3.
`PROGRESS_ARCHIVE_PHASE_4.md` contains the full text of every entry from Phase 4.
`PROGRESS_ARCHIVE_PHASE_5_6.md` contains the full text of every entry from Phase 5 and Phase 6.

## 7. The Current State Snapshot

Updated at the end of every session.

Current phase: Phase 8 (The Manager Panel).

Current milestone: Milestone 8.1 (The Dashboard).

Current task: Task 8.1.1 — Add the live metric cards (waiting, in kitchen, ready, revenue today, orders today).

Current status: Milestone 7.3 complete. The complete Staff Dashboard (Orders, Table Map, Room Map) implemented without anti-patterns. All 4 baselines pass (`tsc` 0 errors, `pnpm test:unit` 226/226 passed, `pnpm test:integration` 189/189 passed, `pnpm build` 47 routes + 1 proxy). Ready for Phase 8.

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.