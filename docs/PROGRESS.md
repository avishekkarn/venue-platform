# PROGRESS.md — The Living Project Log

**Version:** 3.0
**Status:** Approved
**Approved:** 2026-10-30
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

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase (e.g., `PROGRESS_ARCHIVE_PHASE_5.md`) and are summarised in §5.1. Only the current phase's entries live in this file in full.

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
| Phase 5 — The Menu and the Guest Order Flow | 2026-10-18 to 2026-10-30 | Menu domain, menu screen, modifier sheet, cart, order domain, order routes, tracking, waiter calls, menu state updates, polling | `PROGRESS_ARCHIVE_PHASE_5.md` |

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0161 | 2026-10-29 | Task 5.8.4 — Verify menu item state update (Milestone 5.8 and Phase 5 close) | PASS | Milestone 5.8 | §5.3 |
| ENTRY-0160 | 2026-10-29 | Task 5.8.3 — Add guest-side audible ping on item state change | PASS | Milestone 5.8 | §5.3 |
| ENTRY-0159 | 2026-10-29 | Tasks 5.8.1 & 5.8.2 — Admin item state toggle and guest menu refresh | PASS | Milestone 5.8 | §5.3 |

Next entry number: 0162

### 5.3 Current Milestone — Milestone 6.1 (The Kitchen Domain). Current task: Task 6.1.1 — Add the order approval action.

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

# PROGRESS.md — The Living Project Log

**Version:** 3.0
**Status:** Approved
**Approved:** 2026-10-30
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

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase (e.g., `PROGRESS_ARCHIVE_PHASE_5.md`) and are summarised in §5.1. Only the current phase's entries live in this file in full.

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
| Phase 5 — The Menu and the Guest Order Flow | 2026-10-18 to 2026-10-30 | Menu domain, menu screen, modifier sheet, cart, order domain, order routes, tracking, waiter calls, menu state updates, polling | `PROGRESS_ARCHIVE_PHASE_5.md` |

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0161 | 2026-10-29 | Task 5.8.4 — Verify menu item state update (Milestone 5.8 and Phase 5 close) | PASS | Milestone 5.8 | §5.3 |
| ENTRY-0160 | 2026-10-29 | Task 5.8.3 — Add guest-side audible ping on item state change | PASS | Milestone 5.8 | §5.3 |
| ENTRY-0159 | 2026-10-29 | Tasks 5.8.1 & 5.8.2 — Admin item state toggle and guest menu refresh | PASS | Milestone 5.8 | §5.3 |
| ENTRY-0162 | 2026-10-30 | Roadmap re-order — Phase 6 dependency order and task merges | STRUCTURAL | Phase 6 planning | §5.3 |

Next entry number: 0163

### 5.3 Current Milestone — Milestone 6.1 (The Kitchen Domain). Current task: Task 6.1.1 — Add the order approval action.

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0162 — 2026-10-30 — Roadmap re-order — Phase 6 (The Kitchen), Milestone 6.1 through 6.4 restructured for strict dependency order

**Status:** STRUCTURAL

**Task:** None (structural session — roadmap restructuring, no code, no task opened or closed)

**Summary:**
Re-ordered the Phase 6 tables in ROADMAP.md §9 to remove the rework and duplicated concerns in the original task order. The transition table (6.1.0) is now proven first; the state-transition validation (6.1.4) runs before the three actions (6.1.1–6.1.3) that depend on it; the state-change record task (6.1.5) is folded into 6.1.4 because the adapter's `advanceState` already writes the record; and three pairs of same-shape tasks were merged (6.2.2+6.2.3, 6.3.4+6.3.5, 6.4.1+6.4.2) to fit one session each without mixing concerns. No task ID was removed; no acceptance intent was dropped. Code, tests, routes, and the Native DOM scripts in `app/(guest)/menu/` and `app/(guest)/cart/` and `app/admin/page.tsx` are untouched.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| docs/ROADMAP.md | Edit | Re-ordered Phase 6 §9 (Milestones 6.1–6.4) into dependency-correct order; added 6.1.0 (transition-table proof); moved 6.1.4 before 6.1.1–6.1.3; folded 6.1.5 into 6.1.4, 6.2.3 into 6.2.2, 6.3.5 into 6.3.4, 6.4.2 into 6.4.1; kept all IDs and acceptance intent |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0162, updated §5.2 ledger, bumped next entry to 0163, updated §7 snapshot to reflect the re-order |
| docs/PROGRESS_ARCHIVE_PHASE_5.md | Add | Staged from the working tree (Phase 5 archive, committed separately in the prior commit) |

**Commands Run:**
```bash
# None. This is a documentation-only structural session; no code was built and no test or build was run.
# The tree state before this session showed:
#   M docs/PROGRESS.md            (CRLF/LF artefact — cleared with `git checkout -- docs/PROGRESS.md`)
#   ?? docs/PROGRESS_ARCHIVE_PHASE_5.md (Phase 5 archive — staged and committed)

### ENTRY-0161 — 2026-10-29 — Task 5.8.4 — Verify menu item state update (Milestone 5.8 and Phase 5 close)

**Status:** PASS

**Task:** Task 5.8.4 — Verify: an item marked unavailable by the manager greys out on the guest's screen within 5 seconds (Milestone 5.8 and Phase 5 close).

**Summary:**
The human manually verified the live item state update and audible cue on a real phone via LAN. The admin toggled an item to `UNAVAILABLE`, and within 5 seconds the guest menu polled, updated the DOM in place (without a page reload), greyed out the item, and played the Web Audio ping. Milestone 5.8 and Phase 5 are complete and closed.

**Awaiting Human Verification:** NO

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| docs/ROADMAP.md | Edit | Marked Task 5.8.4 complete, recorded Milestone 5.8 and Phase 5 closure |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0161, updated §5.2 ledger, bumped next entry to 0162, advanced §7 snapshot to Phase 6 / Milestone 6.1 / Task 6.1.1 next |

**Next:** Phase 6 — The Kitchen. Milestone 6.1 (The Kitchen Domain). Task 6.1.1 — Add the order approval action.

### ENTRY-0160 — 2026-10-29 — Task 5.8.3 — Add guest-side audible ping on item state change

**Status:** PASS

**Task:** Task 5.8.3 — Add the guest-side ping when an item's state changes

**Summary:**
Added client-side state diffing via sessionStorage and Web Audio API sine ping (880 Hz, 150ms) to /menu. Verified tsc (0 errors) and pnpm build (30 routes + 1 proxy on Next.js 16.4.0 Turbopack).

**Awaiting Human Verification:** YES

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/(guest)/menu/page.tsx | Edit | Added item state extraction, sessionStorage state diffing, and Web Audio API ping synthesis |
| docs/ROADMAP.md | Edit | Marked Task 5.8.3 complete (`✅ Complete`) |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0160, updated §5.2 ledger, bumped next entry to 0161, advanced §7 snapshot to Task 5.8.4 next |

**Next:** Task 5.8.4 — Verify item marked unavailable greys out on guest screen within 5 seconds.

### ENTRY-0159 — 2026-10-29 — Tasks 5.8.1 & 5.8.2 — Admin item state toggle and guest menu refresh

**Status:** PASS

**Task:** Tasks 5.8.1 & 5.8.2 — Add admin item state toggle and guest menu refresh

**Summary:**
Implemented `POST /api/admin/menu/items/[id]/state` with admin role verification and `MenuRepository.setItemState`. Added menu item availability toggle UI on admin dashboard (`/admin`) with native DOM fetch and form fallback. Added 5-second visibility-guarded polling on guest menu (`/menu`). All four baselines passed: tsc exit 0, build 30 routes + 1 proxy on Next.js 16.4.0 Turbopack, unit 186/27, integration 162/29 (79.13s).

**Awaiting Human Verification:** NO

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/api/admin/menu/items/[id]/state/route.ts | Create | Admin route to toggle item availability |
| app/admin/page.tsx | Edit | Added menu availability manager to admin dashboard |
| app/(guest)/menu/page.tsx | Edit | Added 5-second visibility-guarded polling |
| docs/ROADMAP.md | Edit | Marked Tasks 5.8.1 and 5.8.2 complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0159, updated ledger and snapshot |

**Next:** Task 5.8.3 — Add the guest-side ping.

---

## 6. The Archive Index

`PROGRESS_ARCHIVE_PHASE_1.md` contains the full text of every entry from Phase 0 and Phase 1.
`PROGRESS_ARCHIVE_PHASE_2.md` contains the full text of every entry from Phase 2.
`PROGRESS_ARCHIVE_PHASE_3.md` contains the full text of every entry from Phase 3.
`PROGRESS_ARCHIVE_PHASE_4.md` contains the full text of every entry from Phase 4.
`PROGRESS_ARCHIVE_PHASE_5.md` contains the full text of every entry from Phase 5.

## 7. The Current State Snapshot

Updated at the end of every session.

Current phase: Phase 6 (The Kitchen).

Current milestone: Milestone 6.1 (The Kitchen Domain).

Current task: Task 6.1.1 — Add the order approval action.

Current status: Phase 5 is closed and verified end-to-end. The guest can scan a QR, browse the menu, add items with modifiers to the cart, place an order, track its state live via polling, call a waiter/request the bill, and see menu availability changes update in place without losing their form state. The admin can toggle item availability. All baselines green: tsc 0, build 30 routes + 1 proxy, unit 186/27, integration 162/29. Ready for Phase 6 (The Kitchen).

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.

### ENTRY-0161 — 2026-10-29 — Task 5.8.4 — Verify menu item state update (Milestone 5.8 and Phase 5 close)

**Status:** PASS

**Task:** Task 5.8.4 — Verify: an item marked unavailable by the manager greys out on the guest's screen within 5 seconds (Milestone 5.8 and Phase 5 close).

**Summary:**
The human manually verified the live item state update and audible cue on a real phone via LAN. The admin toggled an item to `UNAVAILABLE`, and within 5 seconds the guest menu polled, updated the DOM in place (without a page reload), greyed out the item, and played the Web Audio ping. Milestone 5.8 and Phase 5 are complete and closed.

**Awaiting Human Verification:** NO

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| docs/ROADMAP.md | Edit | Marked Task 5.8.4 complete, recorded Milestone 5.8 and Phase 5 closure |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0161, updated §5.2 ledger, bumped next entry to 0162, advanced §7 snapshot to Phase 6 / Milestone 6.1 / Task 6.1.1 next |

**Next:** Phase 6 — The Kitchen. Milestone 6.1 (The Kitchen Domain). Task 6.1.1 — Add the order approval action.

### ENTRY-0160 — 2026-10-29 — Task 5.8.3 — Add guest-side audible ping on item state change

**Status:** PASS

**Task:** Task 5.8.3 — Add the guest-side ping when an item's state changes

**Summary:**
Added client-side state diffing via sessionStorage and Web Audio API sine ping (880 Hz, 150ms) to /menu. Verified tsc (0 errors) and pnpm build (30 routes + 1 proxy on Next.js 16.4.0 Turbopack).

**Awaiting Human Verification:** YES

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/(guest)/menu/page.tsx | Edit | Added item state extraction, sessionStorage state diffing, and Web Audio API ping synthesis |
| docs/ROADMAP.md | Edit | Marked Task 5.8.3 complete (`✅ Complete`) |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0160, updated §5.2 ledger, bumped next entry to 0161, advanced §7 snapshot to Task 5.8.4 next |

**Next:** Task 5.8.4 — Verify item marked unavailable greys out on guest screen within 5 seconds.

### ENTRY-0159 — 2026-10-29 — Tasks 5.8.1 & 5.8.2 — Admin item state toggle and guest menu refresh

**Status:** PASS

**Task:** Tasks 5.8.1 & 5.8.2 — Add admin item state toggle and guest menu refresh

**Summary:**
Implemented `POST /api/admin/menu/items/[id]/state` with admin role verification and `MenuRepository.setItemState`. Added menu item availability toggle UI on admin dashboard (`/admin`) with native DOM fetch and form fallback. Added 5-second visibility-guarded polling on guest menu (`/menu`). All four baselines passed: tsc exit 0, build 30 routes + 1 proxy on Next.js 16.4.0 Turbopack, unit 186/27, integration 162/29 (79.13s).

**Awaiting Human Verification:** NO

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/api/admin/menu/items/[id]/state/route.ts | Create | Admin route to toggle item availability |
| app/admin/page.tsx | Edit | Added menu availability manager to admin dashboard |
| app/(guest)/menu/page.tsx | Edit | Added 5-second visibility-guarded polling |
| docs/ROADMAP.md | Edit | Marked Tasks 5.8.1 and 5.8.2 complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0159, updated ledger and snapshot |

**Next:** Task 5.8.3 — Add the guest-side ping.

---

## 6. The Archive Index

`PROGRESS_ARCHIVE_PHASE_1.md` contains the full text of every entry from Phase 0 and Phase 1.
`PROGRESS_ARCHIVE_PHASE_2.md` contains the full text of every entry from Phase 2.
`PROGRESS_ARCHIVE_PHASE_3.md` contains the full text of every entry from Phase 3.
`PROGRESS_ARCHIVE_PHASE_4.md` contains the full text of every entry from Phase 4.
`PROGRESS_ARCHIVE_PHASE_5.md` contains the full text of every entry from Phase 5.

## 7. The Current State Snapshot

Updated at the end of every session.

Current phase: Phase 6 (The Kitchen).

Current milestone: Milestone 6.1 (The Kitchen Domain).

Current task: Task 6.1.0 — Add the transition table unit test.

Current status: Phase 5 is closed and verified end-to-end. Phase 6 has been re-ordered for dependency correctness (ENTRY-0162). The transition table is now proven first (6.1.0), then the transition validation helper (6.1.4), then the three actions (6.1.1–6.1.3), then the milestone verification (6.1.6). The kitchen routes, screen, and ping follow in that order. All baselines remain green: tsc 0, build 30 routes + 1 proxy, unit 186/27, integration 162/29. Ready for Task 6.1.0.

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.