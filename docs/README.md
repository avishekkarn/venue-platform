# Project Documentation

**Version:** 2.1
**Status:** Approved
**Approved:** 2026-11-10

This directory contains the canonical project documents. Together they define what the product is, why every choice was made, how it is shaped, how code is written, what the plan is, where the project stands today, how it looks, and how it is proven to work.

---

## 1. The Documents

| Document | Purpose | When read |
|----------|---------|-----------|
| `PRODUCT.md` | What the product is: every feature, every flow, every screen, every loop. | At onboarding; whenever a task's cross-reference block cites a PRODUCT.md section. |
| `DECISIONS.md` | 104 locked decisions across 17 categories. Each record has its reason, its alternatives, and the trigger that would reopen it. | Whenever a task's cross-reference block names a D-ID. |
| `SYSTEM.md` | The shape of the system: the layers, the data model, the APIs, the lifecycles, the security boundaries. | Whenever a task touches a layer, a table, a route, or a lifecycle. |
| `BUILD.md` | How code is written, tested, verified, and closed. Coding standards, the testing strategy, the verification protocol, the task and report formats, the definition of done. | Before every coding task. |
| `ROADMAP.md` | The plan: 12 phases (0 through 10, plus 7.5 as a convergence phase, plus 7.6 as the current hardening phase), tasks, dependencies, and per-task cross-reference blocks. | At the start of every session. |
| `PROGRESS.md` | The living project log, append-only. Read §7 for the current state; read the top three entries for recent context. | At the start of every session. |
| `DESIGN.md` | The frontend design specification: the color system, the typography, the components, the motion, the two atmospheres, the screen specifications. | Whenever a task touches the user interface. |
| `PHASE_TESTS.md` | The phase acceptance tests. Each test proves that a phase delivered what it promised, end to end, from the right user's perspective. | At the end of every phase. |

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

**Anti-hallucination rules (ROADMAP §15–§17):**
- Before writing any code or any docs for a task, the session verifies the pre-conditions by running the exact `Select-String` / `Get-Content` commands the task names. If the pre-conditions do not match, the task stops and reports `BLOCKED` with the mismatch.
- If the report claims `PASS` but the manual verification step has not been run, the report is `NOT VERIFIED` and the task is not closed. A client-component change without a manual mobile check is `NOT VERIFIED`, not `PASS`.
- A structural change to `ROADMAP.md` (a new phase, a split task, a deferred task) requires a PROGRESS `STRUCTURAL` entry in the same session.

---

## 4. The Numbers

These are the counts as of the current state (2026-11-14, Phase 8.0.0):

- **Documents:** 9 canonical files (PRODUCT, DECISIONS, SYSTEM, BUILD, ROADMAP, PROGRESS, DESIGN, PHASE_TESTS, WIRING) + README
- **Decisions:** 104, across 17 categories (see `DECISIONS.md` Appendix)
- **Phases:** Phase 0 through Phase 10 (11 planned phases), plus Phase 7.5 (room-service convergence, closed), Phase 7.6 (foundation hardening, closed), Phase 7.7 (production readiness prerequisites, closed), and Phase 8.0.0 (docs-code alignment, in progress)
- **Unit tests passing:** 282 (41 files)
- **Integration tests passing:** 327 (46 files)
- **Production routes:** 45
- **Current milestone:** Phase 8.3 — Menu Management (Phase 8.1 and 8.2 closed at `1ec4d43`; Phase 8.3.1 is next)

---

## 5. Current State

See the top of `PROGRESS.md` §7 (The Current State Snapshot). That snapshot is updated at the end of every session and is the single source of truth for what phase, milestone, and task the project is on.

As of the last session (2026-11-16, commit `70ea012`):

- **Phase 7.7** (Production Readiness Prerequisites) is **fully closed** at `a09d832`.
- **Phase 8.0.0** (Docs-Code Alignment) is **fully closed** at `620ebc3`.
- **Phase 8.1** (Dashboard) is **✅ closed** at `f22aab3`.
- **Phase 8.2** (Order Management) is **✅ closed** at `70ea012`. The admin panel's `GET /api/admin/orders`, the Active Orders tab, the Completed Orders tab (date-range filter), and the CSV export (human-readable: `Table 12`, `1× Garden Salad`, `APPROVED by Alice Manager at ...`) are live. The venue's currency is **`NPR`** (8.2.0.FIX).
- **Phase 8.3** (Menu Management) is **next** — with the photo pipeline (8.3.0, 8.3.2a, 8.3.7a). The 8.3.0 is the first task.
- **The roadmap is restructured** — the new **8.4 (Services Management)** is inserted; the current 8.4–8.8 renumber to 8.5–8.9.
- **Canonical docs aligned** — the four new decisions (D-21.1, D-22.1, D-23.1, D-24.1) and docs are aligned (see ENTRY-0232).
- **All four baselines pass:** `tsc --noEmit` 0 errors, `test:unit` 282/282, `test:integration` 327/327, `build` 45 routes.