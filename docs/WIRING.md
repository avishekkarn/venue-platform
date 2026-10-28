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

### W-0001 — OPEN — Cart "Place order" submission seam

- **Originated:** Task 5.4.5 (PROGRESS ENTRY-0141).
- **Obligation:** Replace the disabled placeholder in `app/(guest)/cart/page.tsx` with the real submission.
- **Files and call site:** `app/(guest)/cart/page.tsx`, the PLACE-ORDER SEAM comment location.
- **Satisfied by:** Task 5.6.1 (`POST /api/guest/orders`), with 5.7.1 (confirmation) and 5.5.1–5.5.3 (domain/snapshot) as dependencies.
- **Depends on:** D-4.12, SYSTEM.md §9.7, BUILD.md §6, ROADMAP.md Task 5.6.1.
- **Verification:** The PROGRESS entry at the close of 5.6, and the Phase 5/6 boundary per PHASE_TESTS.md §7.
- **Status:** OPEN

---

## 3. The Discharged Obligations

*(Newest first. Each entry was moved here from §2 with the PROGRESS entry that proved it satisfied, per Rule 1.)*

*None yet.*

---

## 4. The Deferred Follow-Ups

*(Items that must not be lost. Each names its trigger and the ROADMAP.md entry that will own it when scheduled, per Rule 6.)*

### F-0001 — Next.js security advisory

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

Six integration test files report `(0 test)` and are placeholders for later phases: `kitchen-orders.test.ts`, `staff-orders.test.ts`, `guest-orders.test.ts`, `admin-menu.test.ts`, and two others in the same group. They are pre-existing and do not affect the current baseline (27 files / 133 tests).

- **Trigger to schedule:** when Phase 6 (kitchen), Phase 7 (staff queues), and Phase 8 (manager panel) fill those suites in.
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