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

These are the counts as of the current state (2026-11-10, Phase 7.6):

- **Documents:** 8 canonical files (PRODUCT, DECISIONS, SYSTEM, BUILD, ROADMAP, PROGRESS, DESIGN, PHASE_TESTS) + README
- **Decisions:** 104, across 17 categories (see `DECISIONS.md` Appendix)
- **Phases:** Phase 0 through Phase 10 (11 planned phases), plus Phase 7.5 (room-service convergence, closed), Phase 7.6 (foundation hardening, closed), and Phase 7.7 (production readiness prerequisites, in progress)
- **Unit tests passing:** 254 (36 files)
- **Integration tests passing:** 233 (38 files)
- **Production routes:** 39
- **Current phase:** Phase 7.7 — Production Readiness Prerequisites (Phase 7.6 is closed; Phase 8 begins after 7.7)

---

## 5. Current State

See the top of `PROGRESS.md` §7 (The Current State Snapshot). That snapshot is updated at the end of every session and is the single source of truth for what phase, milestone, and task the project is on.

As of the last session:

- **Phase 7.5** (Room Service & Frontend Convergence) is **closed**. The guest request loop is 1:1 aligned with the order loop. Polling uses vanilla-JS DOM replacement on the guest tracking surfaces (`/order/[id]/track`, `/requests`, and the join banner) — see D-19.1. The join-approval cookie is set server-side via `NextResponse` — see D-19.2.
- **Phase 7.6** (Foundation Hardening) is **closed** (commit `145d479`). All eleven tasks plus two FIX commits are on `origin/main`. The foundation is verified end-to-end. See PROGRESS ENTRY-0220.
- **Phase 7.7** (Production Readiness Prerequisites) is **in progress**. It closes five gaps before Phase 8 begins: request-level audit log with ZIP download (7.7.1), database security hardening (7.7.2), automated daily backups (7.7.3), CSRF protection (7.7.4), and login rate limiting (7.7.5).
- **Phase 8** (The Manager Panel) begins after Phase 7.7 closes. Task 8.1.1 (add `GET /api/admin/dashboard` route) is the first task of Phase 8.
- **All four baselines pass:** `tsc --noEmit` 0 errors, `test:unit` 254/254, `test:integration` 233/233, `build` 39 routes.