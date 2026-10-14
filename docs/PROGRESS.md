# PROGRESS.md — The Living Project Log

**Version:** 2.0
**Status:** Active
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

**Rule 4 — Honest status.** `PASS`, `FAIL`, `BLOCKED`, or `STRUCTURAL`. `PASS` requires raw evidence. `FAIL` requires the failure's output. `BLOCKED` requires the reason. `STRUCTURAL` is used only when a document or rule changed.

**Rule 5 — Trace every change.** Every entry names the task from `ROADMAP.md` or the document it changed.

**Rule 6 — Never invent.** Nothing is claimed without evidence.

**Rule 7 — Point forward.** Every entry ends with a **Next** line.

**Rule 8 — Cross-document check.** Every entry has a **Document Impact** section.

**Rule 9 — Compression is real.** When a milestone closes, its entries move to `PROGRESS_ARCHIVE_PHASE_1.md` and are summarised in §5.1. Only the current milestone's entries, the last three entries from the previous milestone, and every `STRUCTURAL` entry live in this file in full.

**Rule 10 — One obvious place to append.** New entries go at the top of §5.3, immediately below the `▼ APPEND NEW ENTRIES HERE ▼` marker. Nothing else in §5.3 changes.

---

## 2. The Entry Template

Every entry follows this structure. No section is skipped. "None" is a valid value.

```markdown
### ENTRY-XXXX — YYYY-MM-DD — <session title>

**Status:** PASS | FAIL | BLOCKED | STRUCTURAL

**Task:** <Task ID from ROADMAP.md, or "None (structural session)">

**Summary:**
<Two sentences. What was done, and what is now true that was not true before.>

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
|      |        |         |

**Commands Run:**
<Every command, with raw output in a fenced block. If a command was not run, say so.>

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
|   |           |        |          |

**Deviations from Contract:**
<Anything outside the task's scope, or anything the task asked for that was not done. If none, "None".>

**Noticed but Out of Scope:**
<Problems or opportunities deliberately not acted on. If none, "None".>

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | Yes / No |        | Updated / Needs update / No change |
| DECISIONS.md  | Yes / No |        | Updated / Needs update / No change |
| SYSTEM.md     | Yes / No |        | Updated / Needs update / No change |
| BUILD.md      | Yes / No |        | Updated / Needs update / No change |
| ROADMAP.md    | Yes / No |        | Updated / Needs update / No change |
| PROGRESS.md   | Yes (this entry) | | Updated |

**Contradiction Check:**
<One line. Does anything in this session contradict any decision, system description, or build rule? If yes, name it and how it was resolved. If no, "None found".>

**Next:**
<The exact task the next session starts with, and the specific next action.>

**Awaiting Human Verification:** YES | NO
3. The Compression Protocol
When a milestone closes:

Move every non-structural entry of that milestone, verbatim, to the top of the entry log in PROGRESS_ARCHIVE_PHASE_1.md, preceded by a milestone header line:

text
## Milestone X.Y — <name>
Replace those entries in this file with a single summary line in §5.1 (Closed Milestones).

Keep every STRUCTURAL entry in this file regardless of which milestone it belongs to. Structural entries are the project's constitutional record.

Keep the last three entries of the closed milestone in §5.3 even if they are not structural, so a session that reads the top of the file sees recent context. The rest move to the archive.

When a decision is superseded: follow DECISIONS.md §6.4. The supersession generates a STRUCTURAL entry here; the old decision stays where it is in DECISIONS.md, marked superseded.

When this file exceeds 500 lines: apply the protocol to the oldest closed milestone still represented in full in §5.3. In practice, with this protocol, this file will not approach 500 lines.

4. The Contradiction Check
Run before a session is closed. Five questions.

Does the session contradict a decision in DECISIONS.md?

Does the session contradict the system's shape in SYSTEM.md?

Does the session contradict a build rule in BUILD.md?

Does the session contradict a fact in PRODUCT.md?

Does the session contradict a task or status in ROADMAP.md?

If any answer is yes, the session stops. The developer resolves it. A FAIL entry records the contradiction. A follow-up STRUCTURAL entry records the resolution.

5. The Entry Log
5.1 Closed Milestones
Phase 0 — The Documents (closed 2026-10-11). The seven canonical documents were authored: PRODUCT.md, DECISIONS.md, SYSTEM.md, BUILD.md, ROADMAP.md, PROGRESS.md, DESIGN.md. Full entry in PROGRESS_ARCHIVE_PHASE_1.md under "Phase 0".

Milestone 1.1 — Repository and tooling (closed 2026-10-13). Delivered the folder structure from SYSTEM.md §3, pnpm 12 with the allowBuilds setting in pnpm-workspace.yaml, TypeScript 7 in strict mode with the @/* path alias, Next.js 16 with the App Router, Tailwind 4 via @tailwindcss/postcss, the environment files, and .gitignore. Full entries in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.1". Notable: 198 empty placeholder files under app/ were deleted because Next.js validates every file; middleware.ts was deleted and is recreated in Task 3.5.1; React 19 + TypeScript 7 require the explicit JSX import from react.

Milestone 1.2 — Design tokens (closed 2026-10-13). Delivered the complete token foundation in app/globals.css: five anchor color scales, the neutral grayscale, four status colors, the guest and staff semantic tokens, the staff dark-mode override, the three font families through src/lib/fonts.ts, the guest and staff type scales, spacing, radius, elevation, motion durations and easings, and the prefers-reduced-motion fallback. Full entry in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.2". Notable: the four status colors are literal hex values (a documented exception to DESIGN.md §4.2.1); the fractional spacing steps from DESIGN.md §4.4.1 are included; the type tokens use the CSS font shorthand; !important is used inside the reduced-motion safety net (a documented exception).

Milestone 1.3 — Base components (closed 2026-10-14). Delivered the complete base component kit: Button, Input, Textarea, Select, Label, Dialog, Sheet, Drawer, Badge, Card, Separator, Table, Toast. Nine reserved placeholders (alert, avatar, checkbox, dropdown-menu, progress, radio, skeleton, tabs, tooltip) are still empty and wait for their future tasks. Full entries in PROGRESS_ARCHIVE_PHASE_1.md under "Milestone 1.3". Notable: Tailwind 4 parent-variant syntax corrected to [data-world=staff]_&:; the shadcn CLI's CSS was reconciled so our tokens remain the source of truth; @types/react-dom was missing and was added in Task 1.3.7.

5.2 The Entry Ledger
A quick index of every entry this file has ever held, including those that have moved to the archive. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location. Location is either current (in §5.3) or archived (in PROGRESS_ARCHIVE_PHASE_1.md).

Entry	Date	Title	Status	Milestone	Location
0000	2026-10-11	Project Foundation	STRUCTURAL	Phase 0	archived
0013	2026-10-13	Task 1.1.2b — Package manager configuration	PASS	1.1	archived
0014	2026-10-13	Milestone 1.1 — Repository and tooling	PASS	1.1	archived
0016	2026-10-13	Milestone 1.2 — Design tokens	PASS	1.2	archived
0018	2026-10-14	Git initialised and public repository created	STRUCTURAL	pre-1.3	archived
0019	2026-10-14	Task 1.3.1 — shadcn/ui installed and configured	PASS	1.3	archived
0020	2026-10-14	Task 1.3.2 — Button reconciled	PASS	1.3	archived
0021	2026-10-14	Task 1.3.3 — Input, Textarea, Select, Label	PASS	1.3	archived
0022	2026-10-14	Task 1.3.8 — Base component kit verified	PASS	1.3	archived
0023	2026-10-14	Milestone 1.3 closed	STRUCTURAL	1.3	archived
Next entry number: 0024.

(The table is updated whenever an entry is added or moved. Every session that writes a new entry appends its row at the bottom of this table. Every session that archives an entry changes its Location cell from current to archived. Nothing else in the table changes.)

5.3 Current Milestone — 1.4 (Shared utilities)
The current milestone is Milestone 1.4. New entries go immediately below the ▼ marker, newest first. Do not move or edit any entry below the marker except to move it to the archive when the milestone closes.

▼ APPEND NEW ENTRIES HERE ▼

(No entries yet. The first entry of Milestone 1.4 goes immediately below this line.)

6. The Archive Index
PROGRESS_ARCHIVE_PHASE_1.md contains the full text of every entry from every closed milestone, grouped by milestone with a header line. To read a specific past task:

Phase 0 — The Documents — see "Phase 0" in the archive.

Milestone 1.1 — Repository and tooling — see "Milestone 1.1" in the archive.

Milestone 1.2 — Design tokens — see "Milestone 1.2" in the archive.

Milestone 1.3 — Base components — see "Milestone 1.3" in the archive.

7. The Current State Snapshot
Updated at the end of every session.

Current phase: Phase 1 — The Foundation

Current milestone: 1.4 — Shared utilities

Current task: 1.4.2 — Money formatting (next; the 1.4.1 question is open)

Current status: Milestone 1.3 (Base components) is closed and verified. The full component kit renders in both worlds on a single scratch page. pnpm exec tsc --noEmit and pnpm build pass. origin/main is at a425244. The working tree is clean. The next work is the shared utilities of Milestone 1.4: the cn helper already exists, so the first task is either its test (if 1.4.1 is repurposed as "add tests for cn") or the money formatting utility (Task 1.4.2). After Milestone 1.4, Milestone 1.5 closes Phase 1 with the development-server wrappers. Phase 2 (the data model) follows.

8. How the File Evolves
The file grows by one entry per session. When a milestone closes, its entries compress into a summary line in §5.1 and move to PROGRESS_ARCHIVE_PHASE_1.md. The file never exceeds a size a session can read in seconds. The archive never needs to be read unless a session specifically needs to reconstruct a past decision.

If the archive ever exceeds 5,000 lines, it can itself be split by phase (for example, PROGRESS_ARCHIVE_PHASE_1.md). Not needed now.

text

---