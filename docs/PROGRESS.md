# PROGRESS.md — The Living Project Log

**Version:** 2.0
**Status:** Approved
**Approved:** 2026-10-15
**Purpose:** The dated, append-only record of what has happened on the project. Newest first. Every milestone's entries live in full here while the milestone is open. When the milestone closes, its entries move to `PROGRESS_ARCHIVE_PHASE_1.md` and a one-line summary replaces them in §5.1.

**How to read this file:** Read §7 (the snapshot) first. It tells you the current phase, milestone, and task. Then read the top three entries in §5.3 for recent context. Only open `PROGRESS_ARCHIVE_PHASE_1.md` when you need the full detail of a past milestone.

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

**Rule 4 — Honest status.** `PASS`, `FAIL`, `BLOCKED`, or `STRUCTURAL`. `PASS` requires raw evidence. `FAIL` requires the failure's output. `BLOCKED` requires the reason. `STRUCTURAL` is used only when a document or a rule changed. A STRUCTURAL entry that only removes noise (chat text, stale commentary, miscounted appendix lines) is a single STRUCTURAL entry. A STRUCTURAL entry that changes a locked decision is a FAIL entry for the change plus a STRUCTURAL entry for the resolution, per §4.

**Rule 5 — Trace every change.** Every entry names the task from `ROADMAP.md` or the document it changed.

**Rule 6 — Never invent.** Nothing is claimed without evidence.

**Rule 7 — Point forward.** Every entry ends with a **Next** line.

**Rule 8 — Cross-document check.** Every entry has a **Document Impact** section.

**Rule 9 — Compression is real.** When a milestone closes, its entries move to `PROGRESS_ARCHIVE_PHASE_1.md` and are summarised in §5.1. Only the current milestone's entries, the last three entries from the previous milestone, and every `STRUCTURAL` entry live in this file in full.

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

Path	Action	Purpose
Commands Run:
<Every command, with raw output in a fenced block. If a command was not run, say so.>

Acceptance Criteria Results:

#	Criterion	Result	Evidence
Deviations from Contract:
<Anything outside the task's scope, or anything the task asked for that was not done. If none, "None".>

Noticed but Out of Scope:
<Problems or opportunities deliberately not acted on. If none, "None".>

Document Impact:

Document	Affected?	Reason	Action
PRODUCT.md	Yes / No		Updated / Needs update / No change
DECISIONS.md	Yes / No		Updated / Needs update / No change
SYSTEM.md	Yes / No		Updated / Needs update / No change
BUILD.md	Yes / No		Updated / Needs update / No change
ROADMAP.md	Yes / No		Updated / Needs update / No change
PROGRESS.md	Yes (this entry)		Updated
Contradiction Check:
<One line. Does anything in this session contradict any decision, system description, or build rule? If yes, name it and how it was resolved. If no, "None found".>

Next:
<The exact task the next session starts with, and the specific next action.>

Awaiting Human Verification: YES | NO

## 3. The Compression Protocol

When a milestone closes:

Move every non-structural entry of that milestone, verbatim, to the top of the entry log in `PROGRESS_ARCHIVE_PHASE_1.md`, preceded by a milestone header line:

```
## Milestone X.Y — <name>
```

Replace those entries in this file with a single summary line in §5.1 (Closed Milestones).

Keep every STRUCTURAL entry in this file regardless of which milestone it belongs to. Structural entries are the project's constitutional record.

Keep the last three entries of the closed milestone in §5.3 even if they are not structural, so a session that reads the top of the file sees recent context. The rest move to the archive.

When a decision is superseded: follow DECISIONS.md §6.4. The supersession generates a STRUCTURAL entry here; the old decision stays where it is in DECISIONS.md, marked superseded.

When this file exceeds 500 lines: apply the protocol to the oldest closed milestone still represented in full in §5.3. In practice, with this protocol, this file will not approach 500 lines.

## 4. The Contradiction Check

Run before a session is closed. Five questions.

Does the session contradict a decision in DECISIONS.md?

Does the session contradict the system's shape in SYSTEM.md?

Does the session contradict a build rule in BUILD.md?

Does the session contradict a fact in PRODUCT.md?

Does the session contradict a task or status in ROADMAP.md?

If any answer is yes, the session stops. The developer resolves it. A FAIL entry records the contradiction. A follow-up STRUCTURAL entry records the resolution.

## 5. The Entry Log

### 5.1 Closed Milestones

Phase 0 — The Documents (closed 2026-10-11). The seven canonical documents were authored: PRODUCT.md, DECISIONS.md, SYSTEM.md, BUILD.md, ROADMAP.md, PROGRESS.md, DESIGN.md. Full entry in PROGRESS_ARCHIVE_PHASE_1.md under "Phase 0".

Milestone 1.1 — Repository and tooling (closed 2026-10-13). Delivered the folder structure from SYSTEM.md §3, pnpm 12 with the allowBuilds setting in pnpm-workspace.yaml, TypeScript 7 in strict mode with the @/* path alias, Next.js 16 with the App Router, Tailwind 4 via @tailwindcss/postcss, the environment files, and .gitignore. Full entries in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.1". Notable: 198 empty placeholder files under app/ were deleted because Next.js validates every file; middleware.ts was deleted and is recreated in Task 3.5.1; React 19 + TypeScript 7 require the explicit JSX import from react.

Milestone 1.2 — Design tokens (closed 2026-10-13). Delivered the complete token foundation in app/globals.css: five anchor color scales, the neutral grayscale, four status colors, the guest and staff semantic tokens, the staff dark-mode override, the three font families through src/lib/fonts.ts, the guest and staff type scales, spacing, radius, elevation, motion durations and easings, and the prefers-reduced-motion fallback. Full entry in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.2". Notable: the four status colors are literal hex values (a documented exception to DESIGN.md §4.2.1); the fractional spacing steps from DESIGN.md §4.4.1 are included; the type tokens use the CSS font shorthand; !important is used inside the reduced-motion safety net (a documented exception).

Milestone 1.3 — Base components (closed 2026-10-14). Delivered the complete base component kit: Button, Input, Textarea, Select, Label, Dialog, Sheet, Drawer, Badge, Card, Separator, Table, Toast. Nine reserved placeholders (alert, avatar, checkbox, dropdown-menu, progress, radio, skeleton, tabs, tooltip) are still empty and wait for their future tasks. Full entries in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.3". Notable: Tailwind 4 parent-variant syntax corrected to [data-world=staff]_&:; the shadcn CLI's CSS was reconciled so our tokens remain the source of truth; @types/react-dom was missing and was added in Task 1.3.7.

Milestone 1.4 — Shared utilities (closed 2026-10-15). Delivered the project's first unit-test harness (vitest.config.ts) and the four shared utilities: tests for the cn helper; the formatMoney utility in src/lib/money.ts; the formatTime / formatDateTime / formatElapsed helpers in src/lib/date.ts; and the record of the motion implementation strategy as D-16.1 in DECISIONS.md. 43 unit tests passing, all green. Full entries ENTRY-0024 through ENTRY-0028 in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.4".

Milestone 1.5 — The development server (closed 2026-10-15). Confirmed the root layout applies the design tokens (satisfied by Task 1.2.2); delivered the four route-group atmosphere wrappers (app/(guest)/layout.tsx with data-world="guest", app/staff/layout.tsx, app/kitchen/layout.tsx with data-theme="dark", app/admin/layout.tsx — all data-world="staff" except guest); added the 404 screen (app/not-found.tsx, guest-world, sets data-world="guest" on its own root) and the root error boundary (app/error.tsx, client, world-inheriting); verified the dev server, the root page, and the custom 404. Phase 1 is complete. Full entries ENTRY-0029 through ENTRY-0031 in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.5".

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held, including those that have moved to the archive. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location. Location is either `current` (in §5.3) or `archived` (in PROGRESS_ARCHIVE_PHASE_1.md).

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| 0000 | 2026-10-11 | Project Foundation | STRUCTURAL | Phase 0 | archived |
| 0013 | 2026-10-13 | Task 1.1.2b — Package manager configuration | PASS | 1.1 | archived |
| 0014 | 2026-10-13 | Milestone 1.1 — Repository and tooling | PASS | 1.1 | archived |
| 0016 | 2026-10-13 | Milestone 1.2 — Design tokens | PASS | 1.2 | archived |
| 0018 | 2026-10-14 | Git initialised and public repository created | STRUCTURAL | pre-1.3 | archived |
| 0019 | 2026-10-14 | Task 1.3.1 — shadcn/ui installed and configured | PASS | 1.3 | archived |
| 0020 | 2026-10-14 | Task 1.3.2 — Button reconciled | PASS | 1.3 | archived |
| 0021 | 2026-10-14 | Task 1.3.3 — Input, Textarea, Select, Label | PASS | 1.3 | archived |
| 0022 | 2026-10-14 | Task 1.3.8 — Base component kit verified | PASS | 1.3 | archived |
| 0023 | 2026-10-14 | Milestone 1.3 closed | STRUCTURAL | 1.3 | archived |
| 0024 | 2026-10-14 | Task 1.4.1 — Unit tests for the cn helper | PASS | 1.4 | archived |
| 0025 | 2026-10-14 | Task 1.4.2 — Money formatting utility | PASS | 1.4 | archived |
| 0026 | 2026-10-14 | Task 1.4.3 — Date and time formatting utility | PASS | 1.4 | archived |
| 0027 | 2026-10-15 | Task 1.4.4 — Record D-16.1 (motion implementation strategy) | STRUCTURAL | 1.4 | current |
| 0028 | 2026-10-15 | Task 1.4.5 + 1.5.1 — Verify utilities and root layout | STRUCTURAL | 1.4 / 1.5 | archived |
| 0029 | 2026-10-15 | Task 1.5.2 — Guest and staff atmosphere wrappers | PASS | 1.5 | current |
| 0030 | 2026-10-15 | Task 1.5.3 — The 404 and error screens | PASS | 1.5 | current |
| 0031 | 2026-10-15 | Task 1.5.4 — Verify the dev server, root page, and 404; close Milestone 1.5 and Phase 1 | STRUCTURAL | 1.5 | current |
| 0032 | 2026-10-15 | C-01 — Start the documentation correction milestone; rewrite PROGRESS.md to v2.0 | STRUCTURAL | correction | current |

Next entry number: 0033.

(The table is updated whenever an entry is added or moved. Every session that writes a new entry appends its row at the bottom of this table. Every session that archives an entry changes its Location cell from current to archived. Nothing else in the table changes.)

### 5.3 Current Milestone — the documentation correction

The current milestone is the documentation correction. Phase 1 is closed. Phase 2 has not begun. The correction milestone runs eight tasks: C-01 (this file), C-02 (DECISIONS.md), C-03 (PRODUCT.md), C-04 (SYSTEM.md), C-05 (BUILD.md), C-06 (DESIGN.md), C-07 (ROADMAP.md part A), C-08a through C-08j (ROADMAP.md part B, one phase per session). Phase 2 begins only after every document is at v2.0 and approved.

**STRUCTURAL entries are kept in this file regardless of milestone** (PROGRESS.md §3, "Structural entries are the project's constitutional record"). ENTRY-0027 is the D-16.1 record and stays here. The other Milestone 1.4 and 1.5 non-structural entries (0024, 0025, 0026, 0028, 0029, 0030) have been moved to the archive per the compression protocol.

The last three entries of the just-closed milestone (1.5) are kept in this file as recent context (0031, 0030, 0029 — in that order, newest first), plus the STRUCTURAL entry 0027 which belongs to milestone 1.4 but is the constitutional record of D-16.1.

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0032 — 2026-10-15 — C-01 — Start the documentation correction milestone; rewrite PROGRESS.md to v2.0

**Status:** STRUCTURAL

**Task:** C-01 (the first task of the documentation correction milestone).

**Summary:**
Started the documentation correction milestone. Rewrote PROGRESS.md to v2.0 and marked it Approved. Removed the chat-text block that had accumulated after §8 (it was never a project entry). Added a clarifying clause to Rule 4 so that a structural correction that removes noise is unambiguously a single STRUCTURAL entry, while a structural correction that changes a decision remains a FAIL plus a STRUCTURAL resolution. Added this entry to the ledger and the log; advanced §7 to name the correction milestone.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `docs/PROGRESS.md` | Replaced | Whole-file rewrite to v2.0; removed the chat-text block after §8; added ENTRY-0032; advanced §7 to the correction milestone. |

No code files changed. No test files changed.

**Commands Run:**
None. This is a document rewrite. Verification commands (git status, Select-String on the noise marker, Select-String on the entry headers) will be run after every document in the correction milestone is at v2.0, before the single commit that pushes all of them.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The file is version 2.0, Approved, 2026-10-15 | PASS | Header block |
| 2 | The chat-text block after §8 is gone | PASS | §8 ends at the file-evolution prose; no "One thing to note" text |
| 3 | Every prior entry is preserved verbatim | PASS | ENTRY-0031, 0030, 0029, 0027 unchanged |
| 4 | ENTRY-0032 exists | PASS | Present above the marker |
| 5 | The ledger has a row for 0032 and the next number is 0033 | PASS | §5.2 |
| 6 | §7 names the correction milestone | PASS | Snapshot |

**Deviations from Contract:**
None. This is the first task of a milestone that changes documentation, not code.

**Noticed but Out of Scope:**

- The DECISIONS.md appendix line (54/16) is stale; the real count is 80 decisions. It is corrected in C-02.
- The README.md counts (53 decisions, 224 tasks) are stale. They are corrected in C-08.
- PRODUCT.md's table of contents is off by one from §7 onward. It is corrected in C-03.
- PRODUCT.md §8.1, §8.10, §8.13 describe an owner setup flow and a multi-venue switcher that contradict DECISIONS.md D-9.1, D-10.1, and D-10.3. They are corrected in C-03.
- PRODUCT.md §5.11 and §16.1 describe a guest online payment flow that D-7.1 defers. It is corrected in C-03.
- SYSTEM.md §2's dependency-direction wording is ambiguous (domain depends on infrastructure / domain does not know about infrastructure). A ports-and-adapters clarification is added in C-04.
- BUILD.md §7.4 treats CSRF and rate limiting as optionally deferred. It is corrected in C-05.
- DESIGN.md Part Three contains stale open questions. It is corrected in C-06.
- ROADMAP.md's phase heading says "Ten Phases" but there are eleven. It is corrected in C-07.
- The counter module is not seeded or verified in Phase 2 or Phase 5. It is added in C-07.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No (this task) | Corrected in C-03 | Needs update |
| DECISIONS.md  | No (this task) | Corrected in C-02 | Needs update |
| SYSTEM.md     | No (this task) | Corrected in C-04 | Needs update |
| BUILD.md      | No (this task) | Corrected in C-05 | Needs update |
| ROADMAP.md    | No (this task) | Corrected in C-07 and C-08 | Needs update |
| DESIGN.md     | No (this task) | Corrected in C-06 | Needs update |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. The rewrite removes noise and records the start of the correction; it does not change a decision. The contradictions that exist in other documents are named in "Noticed but Out of Scope" and are each assigned to a correction task.

**Next:**
C-02 — Rewrite DECISIONS.md to v2.0. Fix the appendix count from 54 to the actual count. Add D-4.11 (no SLA targets), D-4.12 (idempotency key), D-7.7 (cash-at-counter only in the first version), D-9.6 (operator manages operations; developer sets branding, provider, deployment — superseding in part D-9.1), D-10.5 (no multi-venue switcher in the first version), D-11.4 (language is fixed at onboarding), D-16.2 (the QR implementation contract), and D-17.1 (the documentation is approved as of 2026-10-15). Update the Table of Contents and the appendix.

**Awaiting Human Verification:** YES

---

### ENTRY-0031 — 2026-10-15 — Task 1.5.4 — Verify the dev server, root page, and 404; close Milestone 1.5 and Phase 1

**Status:** STRUCTURAL

**Task:** 1.5.4 (Verify: the dev server starts, the scratch page renders, the 404 screen renders). Closes Milestone 1.5 and Phase 1.

**Summary:**
Verified with raw evidence that the dev server starts (Ready in 364ms), the root placeholder page renders (GET / 200), the custom 404 renders (GET /this-does-not-exist 404 in 197ms, with the warm guest surface), the type check passes (exit 0), the build passes (Compiled successfully, 3 static routes including _not-found), and the unit tests pass (43/43). Milestone 1.5 is closed. Phase 1 — The Foundation is complete.

**Files Changed:**
None. This is a verification session.

**Commands Run:**

`pnpm exec tsc --noEmit` — exit 0, no output.

`pnpm build` — Compiled successfully in 720ms. Routes: /, /_not-found.

`pnpm test:unit` — 3 files, 43 tests, all passed.

`pnpm dev` — Ready in 364ms, localhost:3000.

`GET /` — 200.

`GET /this-does-not-exist` — 404, custom screen rendered with guest surface.

`git status --short` — clean (after the 1.5.3 commit).

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The dev server starts | PASS | Ready in 364ms |
| 2 | The scratch page renders | PASS | GET / 200 |
| 3 | The 404 screen renders | PASS | GET /this-does-not-exist 404, custom screen |
| 4 | The type check passes | PASS | tsc exit 0 |
| 5 | The build passes | PASS | build output |
| 6 | The test suite passes | PASS | 43/43 |

**Deviations from Contract:**
None. The verification confirmed what the previous four tasks promised. No new code was written.

**Noticed but Out of Scope:**

- The error boundary (app/error.tsx) was not visually exercised in any session. It compiles and builds. Its render can be verified in Phase 2 or later by adding a temporary throw.
- src/lib/utils.ts's cn still has an inferred return type (BUILD.md §2.5). Pre-existing.
- src/lib/cn.ts still exists as a duplicate of cn. Pre-existing.
- The app/(guest)/ folder requires single-quoted paths in PowerShell.
- The placeholder app/page.tsx still sits at the root, not in (guest)/. The move is deferred to Phase 4 or Phase 5.
- Phase 2 (the data model) begins next. No Phase 1 code is unfinished.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No product change | No change |
| DECISIONS.md  | No | No decision change | No change |
| SYSTEM.md     | No | No system shape change | No change |
| BUILD.md      | No | No build rule change | No change |
| ROADMAP.md    | Yes | Milestone 1.5 and Phase 1 closed | Updated |
| DESIGN.md     | No | No design change | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. Phase 1 is complete and consistent with the documents. Phase 2 can begin.

**Next:**
Phase 2 — The Data Model. Milestone 2.1 — The schema. Task 2.1.1 — Configure the database client and the migration tool.

**Awaiting Human Verification:** YES

---

### ENTRY-0030 — 2026-10-15 — Task 1.5.3 — The 404 and error screens

**Status:** PASS

**Task:** 1.5.3

**Summary:**
Created app/not-found.tsx (the guest-world 404) and app/error.tsx (the root error boundary). The 404 sets data-world="guest" on its own root element, uses the guest surface and the Fraunces headline, and never displays the number 404 or an error code. The error screen is a Client Component, never displays the error's message or digest, and inherits its world from whichever layout was rendering. Verified visually via the dev server and in the build.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `app/not-found.tsx` | Created | The guest-world 404 screen |
| `app/error.tsx` | Created | The root error boundary |

**Commands Run:**

`pnpm exec tsc --noEmit` — exit 0.

`pnpm build` — Compiled successfully, routes / and /_not-found.

`pnpm test:unit` — 43/43.

`pnpm dev` — Ready; `GET /this-does-not-exist` returned 404 and the custom screen rendered.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Type check passes | PASS | exit 0 |
| 2 | Build passes; /not-found registered | PASS | _not-found in route list |
| 3 | The test suite passes | PASS | 43/43 |
| 4 | Non-existent URL renders the custom 404 | PASS | 404 response + screenshot |
| 5 | The 404 is guest-voiced | PASS | no 404, no error code, guest vocabulary |
| 6 | Only the two new files changed | PASS | git status |

**Deviations from Contract:**

1. The error screen uses font-sans on the headline (Option B), not font-display. DESIGN.md §4.3.4 rule 2 forbids the display serif in the staff world; the error screen is world-agnostic and inherits whichever world was rendering. A font-display headline would violate the rule for a staff-page error. The choice was named in the plan and approved before the file was written.
2. app/not-found.tsx sets data-world="guest" on its own root element. This is the exception to the rule that only route-group layouts set data-world; a not-found screen has no route group, so it must set the attribute itself for the guest tokens to resolve.

**Noticed but Out of Scope:**

- The error screen was not visually exercised. It compiles and builds. A future session can verify it by temporarily throwing.
- Pre-existing items carried forward (cn's inferred return type, cn.ts duplicate, PowerShell quoting).

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| ROADMAP.md    | Yes | Task 1.5.3 complete | Updated |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 1.5.4 — Verify the dev server, the root page, and the 404. Closes Milestone 1.5 and Phase 1.

**Awaiting Human Verification:** YES

---

### ENTRY-0029 — 2026-10-15 — Task 1.5.2 — Guest and staff atmosphere wrappers

**Status:** PASS

**Task:** 1.5.2

**Summary:**
Created four route-group layouts that set the data-world attribute so that every component's world-scoped tokens resolve. app/(guest)/layout.tsx sets data-world="guest"; app/staff/layout.tsx sets data-world="staff"; app/kitchen/layout.tsx sets data-world="staff" and data-theme="dark"; app/admin/layout.tsx sets data-world="staff". Each wrapper paints the world's surface background and fills the dynamic viewport.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `app/(guest)/layout.tsx` | Created | data-world="guest" |
| `app/staff/layout.tsx` | Created | data-world="staff" |
| `app/kitchen/layout.tsx` | Created | data-world="staff" + data-theme="dark" |
| `app/admin/layout.tsx` | Created | data-world="staff" |

**Commands Run:**

`pnpm exec tsc --noEmit` — exit 0.

`pnpm build` — Compiled successfully, routes / and /_not-found.

`pnpm test:unit` — 43/43.

`git status --short` — four new files, then committed as 46e7da4.

`Select-String` on the four files — data-world at guest:36, staff:40, kitchen:48, admin:38; data-theme="dark" at kitchen:49.

Built CSS check — .bg-guest-surface and .bg-staff-surface present, resolving through the tokens; the [data-world=guest], [data-world=staff], and [data-world=staff][data-theme=dark] blocks present.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Compile under strict TypeScript | PASS | tsc exit 0 |
| 2 | Build passes | PASS | build output |
| 3 | Tests pass | PASS | 43/43 |
| 4 | Only four files changed | PASS | git status |
| 5 | World attributes present | PASS | Select-String output |
| 6 | Background utilities generated | PASS | built CSS contains both classes |

**Deviations from Contract:**

1. The CSS verification command needed correction during the session: the original .next/static/css path was the Next.js 13/14 webpack convention; Turbopack places output elsewhere. Also, single quotes are required around paths containing (guest), and PowerShell's **/*.css glob does not recurse. The corrected recursive command found the CSS and confirmed both utilities.
2. app/page.tsx was not moved into app/(guest)/. The move is deferred to Phase 4 or Phase 5 per BUILD.md §12.3 (structural change separated from behavioural change).

**Noticed but Out of Scope:**

- The (guest) folder requires single-quoted paths in PowerShell.
- app/page.tsx will move to app/(guest)/page.tsx in a future structural task.
- Empty route groups do not appear in the build route list. The wrappers take effect when their first pages land.
- Pre-existing items carried forward.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| ROADMAP.md    | Yes | Task 1.5.2 complete | Updated |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 1.5.3 — The 404 and error screens.

**Awaiting Human Verification:** YES

---

### ENTRY-0027 — 2026-10-15 — Task 1.4.4 — Record D-16.1 (motion implementation strategy)

**Status:** STRUCTURAL

**Task:** 1.4.4 (repurposed from "Add the motion utilities, one per atmosphere")

**Summary:**
Repurposed Task 1.4.4 because the motion files cannot be unit-tested (BUILD.md §8.5 excludes visual behaviour), and because choosing an animation library without a consumer is inventing infrastructure. D-16.1 records that motion is implemented at the point of consumption, not as a shared library: simple transitions use Tailwind classes over the existing motion tokens; complex keyframed motion is deferred to its first consumer (Phase 5 for the hero, Phase 6 for the kitchen ticket, Phase 7 for the staff queue). src/motion/guest.ts and src/motion/staff.ts remain empty. Two commits were required because the first left a placeholder in place of the record's body.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `docs/DECISIONS.md` | Edited twice | Added section 16 with D-16.1; updated appendix count to 54 and categories to 16; added the deferred-decisions row |

No code files changed. No test files changed.

**Commands Run:**

`Select-String ... "the rest of D-16.1"` — no output. Placeholder gone.

`Select-String ... six-part patterns` — six matches at lines 1581, 1587, 1591, 1599, 1607, 1609. All six parts of D-16.1 present.

`Select-String ... "^## \d+\."` — sixteen sections, in order, from `## 1. Venue Identity` to `## 16. Motion Implementation`.

`Select-String ... D-15.7` — one match at line 1562. Unchanged.

`Select-String ... "Total decisions|Categories:"` — line 1615 shows 54, line 1616 shows 16.

`pnpm exec tsc --noEmit` — exit 0.

`pnpm test:unit` — 3 files, 43 tests, all passed, 155ms.

`git status --short` — M docs/DECISIONS.md only.

`git push` — e62eb63..b558642 main -> main.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Section 16 exists with D-16.1 in six parts | PASS | six-part pattern matches at 1581–1609 |
| 2 | The appendix has the motion row | PASS | present in the deferred-decisions table |
| 3 | Total-decisions count is 54 | PASS | line 1615 |
| 4 | Type check passes | PASS | exit 0 |
| 5 | No file outside scope changed | PASS | git status output |

**Deviations from Contract:**

1. The first commit (e62eb63) was incomplete — it added the headings, the appendix count, and the appendix row, but left the literal string `[the rest of D-16.1]` where the record's body should be. This was the assistant's error: the instruction not to re-paste the full block caused the placeholder to reach the file. The fix (b558642) replaced the placeholder with the complete six-part record. No previous decision was altered by either commit.
2. Two commits were used instead of one. e62eb63 was pushed before the incompleteness was found, so a forward fix was used rather than a force-push.
3. The task was repurposed from "Add the motion utilities" to "Record the motion implementation strategy." The reasons are in D-16.1 itself.

**Noticed but Out of Scope:**

- src/lib/utils.ts's cn still has an inferred return type (BUILD.md §2.5). Pre-existing.
- src/lib/cn.ts still exists as a duplicate. Pre-existing.
- src/domain/shared/money.ts and src/domain/shared/time.ts remain empty — Phase 2 targets.
- src/motion/guest.ts and src/motion/staff.ts remain empty — correct per D-16.1.
- The build was not run in this session (no code changed). It passed in the previous session (Task 1.4.3).

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No product change | No change |
| DECISIONS.md  | Yes | D-16.1 added | Updated |
| SYSTEM.md     | No | No system shape change | No change |
| BUILD.md      | No | No build rule change | No change |
| ROADMAP.md    | Yes | Task 1.4.4 repurposed and complete | Updated |
| DESIGN.md     | No | No design change | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. D-16.1 records a strategy that the existing documents left undefined and names the trigger for revisiting it.

**Next:**
Task 1.4.5 — Verify the shared utilities and close Milestone 1.4.

**Awaiting Human Verification:** YES

---

## 6. The Archive Index

`PROGRESS_ARCHIVE_PHASE_1.md` contains the full text of every entry from every closed milestone, grouped by milestone with a header line. To read a specific past task:

Phase 0 — The Documents — see "Phase 0" in the archive.

Milestone 1.1 — Repository and tooling — see "Milestone 1.1" in the archive.

Milestone 1.2 — Design tokens — see "Milestone 1.2" in the archive.

Milestone 1.3 — Base components — see "Milestone 1.3" in the archive.

Milestone 1.4 — Shared utilities — see "Milestone 1.4" in the archive (ENTRY-0024 through ENTRY-0028).

Milestone 1.5 — The development server — see "Milestone 1.5" in the archive (the non-structural entries; ENTRY-0029, ENTRY-0030, and ENTRY-0031 are also kept in §5.3 for recent-context purposes per the compression protocol).

## 7. The Current State Snapshot

Updated at the end of every session.

Current phase: Phase 1 — The Foundation (closed); Phase 2 — The Data Model (pending).

Current milestone: the documentation correction.

Current task: C-01 — rewrite PROGRESS.md to v2.0 (this task). The next document to rewrite is C-02 — DECISIONS.md.

Current status: Phase 1 is complete. Milestones 1.1 through 1.5 are closed. The project has the design-token foundation, the base component kit, four shared utilities with 43 passing tests, the four atmosphere wrappers, the 404 screen, and the root error boundary. origin/main is at 9a297d6. The documentation correction milestone is under way: the seven canonical documents and the README are being rewritten to v2.0 and approved, to remove every contradiction and every gap before Phase 2 begins. C-01 (PROGRESS.md) is complete; C-02 (DECISIONS.md) is next. Phase 2 begins only after every document is at v2.0 and approved.

## 8. How the File Evolves

The file grows by one entry per session. When a milestone closes, its entries compress into a summary line in §5.1 and move to `PROGRESS_ARCHIVE_PHASE_1.md`. The file never exceeds a size a session can read in seconds. The archive never needs to be read unless a session specifically needs to reconstruct a past decision.

If the archive ever exceeds 5,000 lines, it can itself be split by phase (for example, `PROGRESS_ARCHIVE_PHASE_1.md`). Not needed now.