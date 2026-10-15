# Project Documentation

**Version:** 2.0
**Status:** Approved
**Approved:** 2026-10-15

This directory contains the eight canonical documents of the project. Together they define what the product is, why every choice was made, how it is shaped, how code is written, what the plan is, where the project stands today, how it looks, and how it is proven to work.

---

## 1. The Documents

| Document | Purpose | When read |
|----------|---------|-----------|
| `PRODUCT.md` | What the product is: every feature, every flow, every screen, every loop. | At onboarding; whenever a task's cross-reference block cites a PRODUCT.md section. |
| `DECISIONS.md` | 88 locked decisions across 17 categories. Each record has its reason, its alternatives, and the trigger that would reopen it. | Whenever a task's cross-reference block names a D-ID. |
| `SYSTEM.md` | The shape of the system: the layers, the data model, the APIs, the lifecycles, the security boundaries. | Whenever a task touches a layer, a table, a route, or a lifecycle. |
| `BUILD.md` | How code is written, tested, verified, and closed. Coding standards, the testing strategy, the verification protocol, the task and report formats, the definition of done. | Before every coding task. |
| The plan: 11 phases, 319 tasks, dependencies, and per-task cross-reference blocks. | At the start of every session. |
| `PROGRESS.md` | The living project log, append-only. Read §7 for the current state; read the top three entries for recent context. | At the start of every session. |
| `DESIGN.md` | The frontend design specification: the color system, the typography, the components, the motion, the two atmospheres, the screen specifications. | Whenever a task touches the user interface. |
|PHASE_TESTS.md| The eleven phase acceptance tests. Each test proves that a phase delivered what it promised, end to end, from the right user's perspective. | At the end of every phase. |

---

## 2. How to Read

Read the documents in this order the first time:

1. `PRODUCT.md` — to understand what the product is.
2. `DECISIONS.md` — to understand why every choice was made.
3. `SYSTEM.md` — to understand the shape of the system.
4. `BUILD.md` — to understand the method: how code is written, tested, and closed.
5. `ROADMAP.md` — to understand the plan: what is being built, in what order.
6. `PROGRESS.md` — to understand where the project stands today.
7. `DESIGN.md` — to understand the visual language of the product.
8. `PHASE_TESTS.md` — to understand how each phase is proven to be complete.

Once the first reading is done, a session reads only what its current task needs. Each task in `ROADMAP.md` carries a cross-reference block naming the exact `SYSTEM.md`, `DESIGN.md`, and `BUILD.md` sections, the exact `DECISIONS.md` records, and the exact files it touches. A session reads that block first, then reads the sections it cites.

---

## 3. The Working Loop

Every session follows the same loop:

1. Read `PROGRESS.md` §7 (the current state snapshot) and the top three entries in §5.3 for recent context.
2. Read the current task's cross-reference block in `ROADMAP.md`.
3. Read the sections the block cites, and the files the block names.
4. Write the code the task specifies, following `BUILD.md`.
5. Run the proof-of-done check named in the block. Paste the raw output.
6. Write the report per `BUILD.md` §13.
7. Update `ROADMAP.md` (task status) and `PROGRESS.md` (new entry, new snapshot).
8. Stop. The next session begins with the next task.

At the end of every phase:

9. Open `PHASE_TESTS.md` and run the phase's acceptance test.
10. If every step shows the expected outcome, the phase is closed. If any step fails, the "If it fails" line on that step names the task that needs to be revisited.

---

## 4. The Numbers

These are the counts as of version 2.0 of the documents:

- **Documents:** 8
- **Decisions:** 88, across 17 categories (see `DECISIONS.md` Appendix)
- **Phases:** 11 (Phase 0 through Phase 10)
- **Tasks:** 319 across the 11 phases (see `ROADMAP.md`)
- **Phase acceptance tests:** 11 (Phase 0 through Phase 10, one per phase; seePHASE_TESTS.md)
- **Unit tests currently passing:** 43 (from Milestone 1.4)
- **Current phase:** Phase 1 closed; Phase 2 pending (see `PROGRESS.md` §7)

---

## 5. Current State

See the top of `PROGRESS.md` §7 (The Current State Snapshot). That snapshot is updated at the end of every session and is the single source of truth for what phase, milestone, and task the project is on.