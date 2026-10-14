# PROGRESS_ARCHIVE_PHASE_1.md — The Full Entry History

**Version:** 1.0
**Status:** Active
**Purpose:** The complete, verbatim text of every entry ever written in `PROGRESS.md`, grouped by milestone. `PROGRESS.md` §5.1 links to this file. A session opens it only when it needs the full detail of a past milestone.

**How to read this file:** Use the milestone headers to locate an entry. Entries are newest first within each milestone. Nothing here is edited after it is written. The archive is the permanent record; `PROGRESS.md` is the working log.

---

## Milestone 1.5 — The development server

*(closed 2026-10-15)*

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

## Milestone 1.4 — Shared utilities

*(closed 2026-10-15)*

### ENTRY-0028 — 2026-10-15 — Task 1.4.5 + 1.5.1 — Verify utilities and root layout; close Milestone 1.4

**Status:** STRUCTURAL

**Task:** 1.4.5 (Verify the utilities with tests) and 1.5.1 (Configure the root layout with design tokens), combined into a single verification session.

**Summary:**
Verified with raw evidence that the three testable utilities from Milestone 1.4 (cn, formatMoney, formatTime/formatDateTime/formatElapsed) are tested and passing, and that the root layout carries the design tokens (satisfied by Task 1.2.2). Milestone 1.4 is closed. Task 1.5.1 is closed. The motion utilities are deferred per D-16.1 and are excluded from the milestone's "each utility has a small unit test" criterion per BUILD.md §8.5; that exception is recorded here and in D-16.1, not as a separate roadmap amendment.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `docs/ROADMAP.md` | Edited | Marked 1.4.5 and 1.5.1 ✅ Complete |
| `docs/PROGRESS.md` | Edited | This entry; §7 snapshot advanced to 1.5.2 |

No code files changed. No test files changed.

**Commands Run:**

`pnpm exec tsc --noEmit` — exit 0, no output.

`pnpm test:unit` — 3 files, 43 tests, all passed (13 cn + 16 money + 14 date).

`pnpm build` — Compiled successfully, 3 static routes (/, /_not-found).

`pnpm dev` — server ready; placeholder page rendered; font variables present on the `<html>` element.

`git status --short` — M docs/ROADMAP.md, M docs/PROGRESS.md only.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Type check passes | PASS | tsc exit 0 |
| 2 | Test suite passes | PASS | 43/43 |
| 3 | Build passes | PASS | build output |
| 4 | Dev server starts | PASS | pnpm dev output |
| 5 | Placeholder page renders | PASS | browser render |
| 6 | Root layout carries font variables | PASS | `<html class="...">` in rendered source |
| 7 | Utility files each have a test | PASS | tests/unit/lib/{utils,money,date}.test.ts present |
| 8 | Only the two document files changed | PASS | git status output |

**Deviations from Contract:**

1. Tasks 1.4.5 and 1.5.1 were combined into one session. Both are verification tasks with the same evidence set (the test run, the build, the dev server, the rendered page). Running them as two sessions would run the same commands twice.
2. Task 1.5.1's stated goal was already satisfied by Task 1.2.2, which applied the font variables to the `<html>` element. Task 1.5.1 was therefore a verification, not new work. This is not a deviation from the roadmap's intent; it is a consequence of Milestone 1.2 doing more than the roadmap line anticipated.
3. ROADMAP.md's Milestone 1.4 acceptance line ("each utility has a small unit test") is not amended. The exception for the motion utilities is recorded in D-16.1 and in this entry. A future session reading the criterion alongside D-16.1 has the full resolution.

**Noticed but Out of Scope:**

- src/lib/utils.ts's cn still has an inferred return type (BUILD.md §2.5). Pre-existing, unchanged.
- src/lib/cn.ts still exists as a duplicate of cn. Pre-existing, unchanged.
- The six Phase-2 placeholder test files under tests/unit/{auth,orders,qr,requests}/ are empty. The Vitest include is scoped to tests/unit/lib/ so they are not picked up. They will be filled in Phase 2.
- src/domain/*, src/infrastructure/*, src/config/venue.config.ts, src/motion/guest.ts, src/motion/staff.ts remain empty placeholders — correct per their owning tasks.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No product change | No change |
| DECISIONS.md  | No | No decision change | No change |
| SYSTEM.md     | No | No system shape change | No change |
| BUILD.md      | No | No build rule change | No change |
| ROADMAP.md    | Yes | 1.4.5 and 1.5.1 complete; Milestone 1.4 closed | Updated |
| DESIGN.md     | No | No design change | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. The motion-utility exception is recorded in D-16.1 and here; the roadmap's criterion line is unchanged, which is a deliberate choice to keep one authoritative record rather than duplicate the reasoning.

**Next:**
Task 1.5.2 — Configure the guest and staff atmosphere wrappers.

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

### ENTRY-0026 — 2026-10-14 — Task 1.4.3 — Date and time formatting utility

**Status:** PASS

**Task:** 1.4.3

**Summary:**
Populated src/lib/date.ts with three pure display helpers — formatTime, formatDateTime, and formatElapsed — and created 14 tests at tests/unit/lib/date.test.ts. The three helpers render an instant (or the interval between two instants) as a display string. They do not decide what is late; that stays in src/domain/shared/time.ts, which remains empty until Phase 2. The type check, the test run (43 tests across three files), and the production build all pass.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/lib/date.ts` | Populated (was empty) | The three display helpers |
| `tests/unit/lib/date.test.ts` | Created | 14 tests across 3 describe blocks |

**Commands Run:**

`pnpm exec tsc --noEmit` — exit 0, no output.

`pnpm test:unit` — 3 files, 43 tests, all passed (13 utils + 16 money + 14 date), 155ms.

`pnpm build` — Compiled successfully in 358ms, 3 static pages.

`git status --short` — M src/lib/date.ts; A tests/unit/lib/date.test.ts. Nothing else.

`git push` — 90622c2..69b504e main -> main.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | All three helpers compile with explicit return types | PASS | tsc exit 0 |
| 2 | The unit tests pass | PASS | 43/43 across three files |
| 3 | The test file covers the planned behaviours | PASS | 14 tests visible in run output |
| 4 | The build still passes | PASS | pnpm build output |
| 5 | No file outside the scope was changed | PASS | git status output |

**Deviations from Contract:**

1. Three test assertions were corrected after the first run. The initial file asserted exact local clock values (":45") and a two-digit hour for en-GB. The first run showed the machine is in UTC+5:30 and that Intl's en-GB output with hour:"numeric" is not zero-padded. The three affected assertions became shape assertions, with the reason documented in the test file's header comment. src/lib/date.ts was not changed. The failure was in the test's expectation, not in the code.
2. formatTime and formatDateTime tests use shape assertions, not exact-value assertions, because Intl renders in the runtime's local timezone and the test suite must pass on any machine. formatElapsed tests use exact-string assertions because formatElapsed does not call Intl and is timezone-independent.
3. No deviations from the API decisions. formatTime(timestamp: Date, locale: string): string, formatDateTime(timestamp: Date, locale: string): string, formatElapsed(from: Date, to: Date): string. Explicit return types, no timezone parameter, no default locale, no internal clock.

**Noticed but Out of Scope:**

- src/lib/utils.ts's cn still has an inferred return type. Same as ENTRY-0024. Bundling with the cn.ts reconciliation before Phase 2 is the correct fix.
- src/lib/cn.ts still exists as a duplicate of cn. Must be resolved before Phase 2.
- src/domain/shared/time.ts and src/domain/shared/money.ts remain empty — the future homes of domain time and money arithmetic (Phase 2). They are distinct from src/lib/date.ts and src/lib/money.ts: the domain decides *whether*, src/lib/ decides *how it looks*.
- The developer's machine is in UTC+5:30 (India Standard Time). Documented in the test file's header comment.
- The formatElapsed output contract is "<1m", "{n}m", "{h}h {m}m". A future design decision might want a separate "3 min ago" form; if so, formatElapsed is the single place it changes.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No product change | No change |
| DECISIONS.md  | No | No decision change | No change |
| SYSTEM.md     | No | No system shape change | No change |
| BUILD.md      | No | No build rule change | No change |
| ROADMAP.md    | Yes | Task 1.4.3 complete | Updated |
| DESIGN.md     | No | No design change | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. The helpers conform to BUILD.md §2.5 and §8.2, and to DESIGN.md §4.15.7. The timezone-shaped test assertions are a deliberate, documented choice.

**Next:**
Task 1.4.4 — Add the motion utilities, one per atmosphere. Target files: src/motion/guest.ts and src/motion/staff.ts (placeholders).

**Awaiting Human Verification:** YES

---

### ENTRY-0025 — 2026-10-14 — Task 1.4.2 — Money formatting utility

**Status:** PASS

**Task:** 1.4.2

**Summary:**
Added the formatMoney helper to src/lib/money.ts and 16 tests to tests/unit/lib/money.test.ts. The utility turns a decimal money string into a localized display string via Intl.NumberFormat. It does not compute, round, or sum — arithmetic belongs to the domain layer. The type check, the test run (29 tests total across two files), and the production build all pass.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/lib/money.ts` | Populated (was empty) | The formatMoney helper |
| `tests/unit/lib/money.test.ts` | Created | 16 tests across 5 describe blocks |

**Commands Run:**

`pnpm exec tsc --noEmit` — exit 0, no output.

`pnpm test:unit` — 2 files, 29 tests, all passed (13 utils + 16 money), 158ms.

`pnpm build` — Compiled successfully in 358ms, 3 static pages.

`git status --short` — M src/lib/money.ts; A tests/unit/lib/money.test.ts. Nothing else.

`git push` — 1d7454e..90622c2 main -> main.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | src/lib/money.ts has an explicit return type | PASS | tsc exit 0 |
| 2 | The unit tests pass | PASS | 29/29 in test:unit output |
| 3 | The test file covers the planned behaviours | PASS (exceeded: 16 tests) | Visible in run output |
| 4 | The build still passes | PASS | pnpm build output |
| 5 | No file outside the scope was changed | PASS | git status output |

**Deviations from Contract:**

1. The test file exceeds the plan's count. The plan described seven behaviours; the file has 16 tests across five describe blocks. This is more thorough, not a larger concern — all tests cover formatMoney and were written in one file.
2. No deviations from the locked API decisions. The signature is formatMoney(value: string, currency: string, locale: string): string, invalid input throws TypeError, the return type is explicit.
3. The two risks from the plan (locale output drift, INR symbol placement) did not materialise. Node 24.21.0's ICU data matched the expected literals, including the U+00A0 non-breaking space in the German EUR case. The en-NP test used a regex deliberately.

**Noticed but Out of Scope:**

- src/lib/utils.ts's cn still has an inferred return type (BUILD.md §2.5 requires explicit). Pre-existing, noted in ENTRY-0024. Bundling with the cn.ts reconciliation before Phase 2 is the correct fix.
- src/lib/cn.ts still exists as a duplicate. Unresolved.
- src/lib/date.ts remains empty — the target of Task 1.4.3.
- src/domain/shared/money.ts remains empty — the future home of domain money arithmetic (Phase 2). Now distinct from src/lib/money.ts: display in src/lib, arithmetic in src/domain/shared.
- No money arithmetic exists yet. When Phase 5's create-order.ts and compute-price.ts land, they will produce the strings this utility consumes.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No product change | No change |
| DECISIONS.md  | No | No decision change | No change |
| SYSTEM.md     | No | No system shape change | No change |
| BUILD.md      | No | No build rule change | No change |
| ROADMAP.md    | Yes | Task 1.4.2 complete | Updated |
| DESIGN.md     | No | No design change | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. The utility conforms to BUILD.md §7.1, §2.5, §2.9, and DESIGN.md §4.15.7.

**Next:**
Task 1.4.3 — Add the date and time formatting utility. Target file: src/lib/date.ts (empty placeholder). Test file: tests/unit/lib/date.test.ts.

**Awaiting Human Verification:** YES

---

### ENTRY-0024 — 2026-10-14 — Task 1.4.1 — Unit tests for the cn helper

**Status:** PASS

**Task:** 1.4.1 (repurposed from "Add the cn helper" to "Add tests for the cn helper")

**Summary:**
Repurposed Task 1.4.1 because the cn helper already exists in src/lib/utils.ts (created by shadcn/ui's init in Task 1.3.1). Added the project's first unit test file and the Vitest configuration that every future unit test will use. Thirteen tests now lock in the four behaviours of cn that every component in src/components/ui/ depends on: merge, Tailwind conflict resolution (last-wins), falsy and conditional inputs, and array/object composition.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `vitest.config.ts` | Created | Unit-test config: node environment, @/* alias via fileURLToPath, include scoped to tests/unit/lib/** |
| `tests/unit/lib/utils.test.ts` | Created | 13 tests for cn, in four describe blocks |
| `package.json` | Edited | Added "test:unit": "vitest run --config vitest.config.ts" |

**Commands Run:**

`pnpm exec tsc --noEmit` — exit 0, no output.

`pnpm test:unit` — 1 file, 13 tests, all passed, 479ms. All four describe blocks green.

`pnpm build` — Compiled successfully in 2.2s, 3 static pages (/ and /_not-found).

`git status --short` — M package.json; A tests/unit/lib/utils.test.ts; A vitest.config.ts. Nothing else.

`git push` — 457034b..1d7454e main -> main.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The vitest config resolves the @/* alias | PASS | tsc exit 0 |
| 2 | The unit test file compiles under strict TypeScript | PASS | tsc exit 0 |
| 3 | The unit tests pass | PASS | 13/13 in test:unit output |
| 4 | The tests cover the four behaviours that matter | PASS | Four describe blocks in run output |
| 5 | The build still passes | PASS | pnpm build output |
| 6 | No file outside the scope was changed | PASS | git status output |

**Deviations from Contract:**

1. Task 1.4.1 was repurposed. The helper already existed. Repurposing was necessary because ROADMAP.md §4 Milestone 1.4's acceptance criterion is "each utility has a small unit test; the tests pass" — closing 1.4.1 without a test would leave that criterion unsatisfiable for the first utility in the milestone.
2. The Vitest include pattern is scoped to tests/unit/lib/**/*.test.ts, not the broader tests/unit/**/*.test.ts. The project structure already contains six empty placeholder test files under tests/unit/auth, tests/unit/orders, tests/unit/qr, and tests/unit/requests. Widening the pattern now would fail on missing imports. The Phase 2 task that fills those placeholders widens the pattern in the same commit.
3. test:unit was added as a new script, not by changing the existing test script. This mirrors the existing test:integration and test:e2e pattern and preserves the watch-mode convenience of pnpm test.
4. The LF→CRLF warning on git add is expected on Windows and does not affect the committed content.

**Noticed but Out of Scope:**

- src/lib/cn.ts exists as a duplicate of the cn helper. Every component imports cn from @/lib/utils. The cn.ts file is either empty or a leftover. Must be resolved before Phase 2 begins.
- src/lib/money.ts and src/lib/date.ts exist as placeholders. They are the future homes of Tasks 1.4.2 and 1.4.3. Their tests will follow today's pattern, at tests/unit/lib/money.test.ts and tests/unit/lib/date.test.ts.
- src/lib/utils.ts's cn has an inferred return type, not an explicit one. BUILD.md §2.5 requires explicit return types on every exported function. Pre-existing minor violation; correct fix is one word. Belongs in a small follow-up, ideally bundled with the cn.ts reconciliation.
- tsconfig.json includes **/*.ts and **/*.tsx, which is why the new files type-check without any tsconfig change.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No product change | No change |
| DECISIONS.md  | No | No decision change | No change |
| SYSTEM.md     | No | No system shape change | No change |
| BUILD.md      | No | No build rule change | No change |
| ROADMAP.md    | Yes | Task 1.4.1 repurposed and completed | Updated |
| DESIGN.md     | No | No design change | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. The repurposing of 1.4.1 was necessary to make ROADMAP.md's own acceptance criterion for Milestone 1.4 satisfiable.

**Next:**
Task 1.4.2 — Add the money formatting utility. Target file: src/lib/money.ts (already exists as a placeholder). Test file: tests/unit/lib/money.test.ts.

**Awaiting Human Verification:** YES

---

## Milestone 1.3 — Base components

*(closed 2026-10-14)*

### ENTRY-0023 — 2026-10-14 — Milestone 1.3 closed

**Status:** STRUCTURAL

**Task:** None (structural session — milestone closure)

**Summary:**
Milestone 1.3 (Base components) is closed. All eight tasks (1.3.0 through 1.3.8) are complete. The project now has a complete, verified base component kit. Phase 1 continues with Milestone 1.4 (Shared utilities) and Milestone 1.5 (The development server), then Phase 2 begins.

**Files Changed:**
None. This entry records a milestone-level state.

**Commands Run:**
- `git log --oneline origin/main` — shows the eight task commits: f43ceeb, e8ffa2a, 924af87, b70b9af, 604412d, 8446066, fc0c163, 9b34c2a.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Every task in the milestone is complete | PASS | git log |
| 2 | Every component matches DESIGN.md §4.6 | PASS | ENTRY-0022 |
| 3 | The full kit renders in both worlds | PASS | ENTRY-0022 |
| 4 | The build and type check pass | PASS | ENTRY-0022 |

**Deviations from Contract:**
- Task 1.4.1 (cn helper) is redundant, as noted in ENTRY-0022. It should be closed or repurposed before Milestone 1.4 begins.

**Noticed but Out of Scope:**
See ENTRY-0022.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | — | No change |
| DECISIONS.md  | No | — | No change |
| SYSTEM.md     | No | — | No change |
| BUILD.md      | No | — | No change |
| ROADMAP.md    | Yes | Milestone 1.3 closed | Updated |
| DESIGN.md     | No | — | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. Milestone closure does not contradict any decision or document.

**Next:**
Milestone 1.4 — Shared utilities. See ENTRY-0022 for the recommended sequence.

**Awaiting Human Verification:** NO

---

### ENTRY-0022 — 2026-10-14 — Task 1.3.8 — Milestone 1.3 base component kit verified

**Status:** PASS

**Task:** 1.3.8

**Summary:**
The complete base component kit was rendered on a single scratch page in both worlds (guest and staff). All twelve components — Button, Input, Textarea, Select, Label, Dialog, Sheet, Drawer, Badge, Card, Separator, Table, Toast — render correctly with all their states. The guest and staff atmospheres are visually distinct where they must be and consistent where they should be. The browser console is clean. The milestone is closed.

**Files Changed:**
None committed. `app/page.tsx` was temporarily replaced with a scratch page for verification, then restored to the placeholder. `git status` is clean.

**Commands Run:**
- `pnpm exec tsc --noEmit` — exit 0.
- `pnpm build` — compiled successfully.
- `pnpm dev` — served the scratch page in both worlds.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Every component renders without errors | PASS | Browser screenshot, both worlds |
| 2 | The browser console has no warnings | PASS | DevTools Console |
| 3 | Type check passes | PASS | tsc exit 0 |
| 4 | Build passes | PASS | build output |
| 5 | The two worlds look different where they should | PASS | Guest Button primary olive, staff primary forest green |
| 6 | The two worlds share what they should | PASS | Input, Textarea, Select, Table render identically |
| 7 | Radii and spacing are consistent | PASS | Visual check |
| 8 | Nothing outside app/page.tsx changed | PASS | git status clean |

**Deviations from Contract:**
None. The task was a verification task and it verified.

**Noticed but Out of Scope:**
- Task 1.4.1 ("Add the cn helper for class name composition") is redundant — `src/lib/utils.ts` already contains the standard cn helper, created by shadcn/ui's init in Task 1.3.1. The task can be closed as complete or repurposed as "add unit tests for cn".
- The empty files under src/components/ui/ (alert, avatar, checkbox, dropdown-menu, progress, radio, skeleton, tabs, tooltip) are reserved placeholders. Each belongs to a future task in a later milestone. They are correctly empty.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | — | No change |
| DECISIONS.md  | No | — | No change |
| SYSTEM.md     | No | — | No change |
| BUILD.md      | No | — | No change |
| ROADMAP.md    | Yes | Task 1.3.8 complete; Milestone 1.3 closed | Updated |
| DESIGN.md     | No | — | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. Every component matches its section in DESIGN.md §4.6.

**Next:**
Milestone 1.4 — Shared utilities. The first task is 1.4.1 (the cn helper), which is now redundant, so the next actionable task is 1.4.2 — the money formatting utility. The next session should propose the plan for the money utility, or resolve the 1.4.1 question first, then move to 1.4.2.

**Awaiting Human Verification:** YES

---

### ENTRY-0021 — 2026-10-14 — Task 1.3.3 — Input, Textarea, Select, Label

**Status:** PASS

**Task:** 1.3.3

**Summary:**
Created four form primitives from scratch, matching DESIGN.md §4.6.2 (Input, Textarea) and §4.6.3 (Select). The Input and Textarea support optional label, helper, and error props, with correct accessibility (aria-invalid, aria-describedby). The Select wraps `@base-ui/react/select` and matches the Input's height, border, focus ring, and error state. Verified visually in both worlds.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/components/ui/label.tsx` | Created | Label wrapper |
| `src/components/ui/input.tsx` | Created | Text input with label / helper / error |
| `src/components/ui/textarea.tsx` | Created | Multi-line variant |
| `src/components/ui/select.tsx` | Created | Composition over @base-ui/react/select |

**Commands Run:**
- `pnpm exec tsc --noEmit` — exit 0.
- `pnpm build` — compiled successfully, 3 pages.
- `pnpm dev` — served both worlds.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | TypeScript strict | PASS | tsc exit 0 |
| 2 | Build passes | PASS | pnpm build |
| 3 | All six states render | PASS | Browser |
| 4 | Clicking a label moves focus | PASS | Manual |
| 5 | Tab shows 2px focus ring | PASS | Manual |
| 6 | Select opens, fades in, updates on select | PASS | Manual |
| 7 | Only scoped files changed | PASS | git show --stat HEAD |

**Deviations from Contract:**
- The Select menu's fade uses `duration-staff-fast` (140ms) in both worlds. DESIGN.md §4.6.3 specifies 140ms without a world-scope. Deliberate.

**Noticed but Out of Scope:**
- The `@base-ui/react/select` API surface was guessed at for Task 1.3.3 (import path, sub-component names). It compiled successfully on the first attempt, so the API matched the guess. Now confirmed for future form components (Radio, Checkbox).

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| ROADMAP.md | Yes | Task 1.3.3 complete | Updated |
| PROGRESS.md | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 1.3.4 — Dialog, Sheet, Drawer.

**Awaiting Human Verification:** YES

---

### ENTRY-0020 — 2026-10-14 — Task 1.3.2 — Button reconciled to DESIGN.md §4.6.1

**Status:** PASS

**Task:** 1.3.2

**Summary:**
The shadcn-generated Button was replaced with one that matches DESIGN.md §4.6.1. The shadcn Button was functional but wrong for our design system in nine ways: variant names, size names, sizes, focus ring, press motion, missing loading state, unnecessary aria-invalid styling, wrong radius, and world-agnostic colors. The reconciled Button uses our variant set (primary, secondary, ghost, danger), our size set (sm 32px, md 40px, lg 52px, xl 60px), the correct focus ring (2px in brand color, 2px offset), a loading state with three pulsing dots and aria-busy, and world-specific colors via the Tailwind 4 parent variant `[data-world=staff]_&:`. The press-feedback motion lives in app/globals.css. Verified in the browser: guest Primary renders olive; staff Primary renders forest green.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/components/ui/button.tsx` | Replaced | Reconciled against DESIGN.md §4.6.1 |
| `app/globals.css` | Edited | Appended the WORLD-SCOPED PRESS FEEDBACK block |

**Commands Run:**
- `pnpm exec tsc --noEmit` — exit 0.
- `pnpm build` — compiled successfully, 3 pages.
- `pnpm dev` — served both worlds, verified visually.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The Button compiles under strict TypeScript | PASS | tsc exit 0 |
| 2 | The build passes | PASS | pnpm build output |
| 3 | All four variants render | PASS | Browser screenshots |
| 4 | All four sizes render | PASS | Browser screenshot |
| 5 | World separation works | PASS | Guest primary olive, staff primary forest green |
| 6 | Loading state works | PASS | Three dots visible |
| 7 | Only scoped files changed | PASS | git show --stat HEAD |

**Deviations from Contract:**
- The Tailwind parent-variant syntax `[data-world='staff']&:` (with a quote and `&`) did not compile. Tailwind 4 silently dropped the variant. Corrected to `[data-world=staff]_&:` (no quote, underscore before `&`). This is now the project's pattern for world-scoped variants.
- The press feedback was moved from the component's class list into `app/globals.css` because Tailwind cannot cleanly branch a single class string on a parent `[data-world]` attribute without a `group` class we do not want to mandate.

**Noticed but Out of Scope:**
- `hover:brightness-95` on primary and danger is a CSS filter. For very dark brand colors, the brightness reduction may be imperceptible.
- The `lg` and `xl` sizes are guest-only per DESIGN.md §4.6.1. Not enforceable at the type level in a single component.
- Task 1.4.1 (cn helper) is now redundant.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| ROADMAP.md | Yes | Task 1.3.2 complete | Updated |
| PROGRESS.md | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. The component matches DESIGN.md §4.6.1.

**Next:**
Task 1.3.3 — Input, Textarea, Select, Label.

**Awaiting Human Verification:** YES

---

### ENTRY-0019 — 2026-10-14 — Task 1.3.1 — shadcn/ui installed and configured

**Status:** PASS (with reconciliation deviations noted)

**Task:** 1.3.1

**Summary:**
shadcn/ui was installed and configured. Its CLI wrote components.json, src/lib/utils.ts, a Button component, and a block of CSS variables into app/globals.css. The CLI's output was reconciled so that our design tokens remain the single source of truth: the CLI's radius overrides, its self-referencing font entries, and its unused .dark block were removed, and its semantic variable names were aliased to our tokens. The build, typecheck, and dev server all pass.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| components.json | Created | shadcn/ui's config |
| src/lib/utils.ts | Created | The cn helper |
| src/components/ui/button.tsx | Modified | The shadcn Button (delivered early by the CLI; refined in Task 1.3.2) |
| app/globals.css | Modified | Removed the shadcn runtime import, radius overrides, self-referencing font entries, and .dark block; added shadcn semantic aliases pointing at our tokens |
| package.json | Modified | Added @base-ui/react, class-variance-authority, clsx, lucide-react, tailwind-merge, tw-animate-css |
| pnpm-lock.yaml | Regenerated | — |

**Commands Run:**
- `pnpm dlx shadcn@latest init --yes --defaults` — ran, then reconciled.
- `pnpm remove cn` — removed the accidental cn package.
- `pnpm remove shadcn` — removed the CLI from production dependencies.
- `pnpm add clsx tailwind-merge` — added them as direct dependencies.
- `pnpm exec tsc --noEmit` — exit 0, no output.
- `pnpm build` — compiled successfully in 618ms, 3 pages.
- `pnpm dev` — ready in 354ms.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | components.json exists and is valid | PASS | File present, rsc: true |
| 2 | src/lib/utils.ts exports cn | PASS | File contains the standard cn helper |
| 3 | Four shadcn deps present | PASS | pnpm list output |
| 4 | Tokens intact in app/globals.css | PASS | The @theme block, :root, and every [data-world] block preserved |
| 5 | Typecheck passes | PASS | pnpm exec tsc --noEmit exit 0 |
| 6 | Build passes | PASS | pnpm build output |
| 7 | Page still renders | PASS | pnpm dev output |
| 8 | Only scoped files changed | PASS | git status output |

**Deviations from Contract:**

The shadcn CLI (v4.21.4) made four mistakes that we corrected:
1. It wrote @import "shadcn/tailwind.css" into app/globals.css, which required the shadcn package at runtime. We removed it.
2. It wrote the wrong import into both src/lib/utils.ts and src/components/ui/button.tsx (from "cn" instead of from "@/lib/utils"). We corrected both.
3. It added a duplicate Geist loader to app/layout.tsx and set --font-sans directly on <html>, which would have shadowed our font token. We removed it.
4. It added itself (shadcn) and the accidental cn package to production dependencies. We removed both with pnpm remove.

The style chosen by the CLI's --defaults flag was "base-nova", not the "new-york" specified in the plan. We accepted base-nova.

**Noticed but Out of Scope:**
- The shadcn Button that landed in src/components/ui/button.tsx uses shadcn's variant and size scheme (bg-primary, text-primary-foreground, h-8, h-9, etc.). Task 1.3.2 must reconcile it against DESIGN.md §4.6.1.
- The @custom-variant dark declaration is inert for us; we never apply a .dark class.
- The @layer base block applies bg-background and text-foreground to <body>. Now that those variables point at our tokens, this is consistent with our design.
- The @import "tw-animate-css" is required by future component tasks (Dialog, Sheet).

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | — | No change |
| DECISIONS.md  | No | — | No change |
| SYSTEM.md     | No | — | No change |
| BUILD.md      | No | — | No change |
| ROADMAP.md    | Yes | Task 1.3.1 complete | Updated |
| DESIGN.md     | No | — | No change |
| PROGRESS.md   | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. No decision in DECISIONS.md is contradicted. No rule in BUILD.md is violated. The @import "shadcn/tailwind.css" that DESIGN.md §4.15.6 did not anticipate was removed. No task in ROADMAP.md is contradicted.

**Next:**
Task 1.3.2 — Add the Button component, themed by tokens. The next session should read the current src/components/ui/button.tsx, compare it against DESIGN.md §4.6.1, and propose the reconciliation plan before editing.

**Awaiting Human Verification:** YES

---

## Milestone 1.2 — Design tokens

*(closed 2026-10-13)*

### ENTRY-0016 — 2026-10-13 — Milestone 1.2 — Design tokens complete

**Status:** PASS (with two noted evidence gaps)

**Task:** Milestone 1.2 (Tasks 1.2.1 through 1.2.7)

**Summary:**
The complete design-token foundation is now authored in `app/globals.css`: the five anchor color scales, the neutral grayscale, the status colors, the guest-world and staff-world semantic tokens, the staff dark-mode override, the three font families, the guest and staff type scales, the spacing scale, the radius scale, the elevation scale, the motion durations and easings, and the `prefers-reduced-motion` fallback. The temporary scratch page rendered every token correctly and was removed at the end of the milestone, leaving `app/page.tsx` as the placeholder root screen. Both `pnpm exec tsc --noEmit` and `pnpm build` pass with no errors.

**Files Changed (cumulative across the milestone):**
| Path | Action | Purpose |
|------|--------|---------|
| `app/globals.css` | Created then edited six times | The complete token foundation, authored across Tasks 1.2.1 through 1.2.6 |
| `app/page.tsx` | Replaced then reverted | The temporary scratch page (Tasks 1.2.1–1.2.6); reverted to the placeholder root screen in Task 1.2.7 |
| `src/lib/fonts.ts` | Created | The three `next/font` loaders and the `fontVariables` export |
| `app/layout.tsx` | Edited | Applied the font variables to the `<html>` element |

**Commands Run:**

`pnpm exec tsc --noEmit` — run after each of Tasks 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.6. Exit code 0, no output every time.

`pnpm build` — run after each of Tasks 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.6. Compiled successfully every time. Final build after Task 1.2.6 compiled in 370ms; routes `/` and `/_not-found` generated.

`pnpm dev` — run after Tasks 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.6. The scratch page rendered every section. Screenshots captured for Tasks 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.6.

**Evidence gaps (honest record):**

- Task 1.2.4: the render was confirmed by the developer but the raw output of `pnpm exec tsc --noEmit` and `pnpm build` was not pasted for that specific task. The build was re-run and pasted in Task 1.2.6 with the same code. Recorded as a minor gap.
- Task 1.2.7: the developer said "done" but did not paste the raw output of `pnpm exec tsc --noEmit` and `pnpm build` for the final placeholder-page state. Recorded as a minor gap.
- Task 1.2.6: the `@media (prefers-reduced-motion: reduce)` block was confirmed to exist in the file and to compile, but devtools confirmation of the block being active was not captured. Recorded as a minor evidence gap.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1.2.1.1–8 | Color tokens render, build passes | PASS | Screenshots and build output from Tasks 1.2.1 |
| 1.2.2.1–8 | Typography tokens render, build passes | PASS | Screenshots and build output from Task 1.2.2 |
| 1.2.3.1–4 | Spacing tokens render progressively, build passes | PASS | Screenshots and build output from Task 1.2.3 |
| 1.2.4.1–6 | Radius, elevation, motion tokens render, build passes | PASS (render confirmed; raw output noted as gap) | Developer confirmation and later Task 1.2.6 build |
| 1.2.5 | Status tokens resolved | PASS (folded into 1.2.1, re-verified in the scratch page) | Status swatches visible in every screenshot |
| 1.2.6.1–3 | Reduced-motion fallback authored, build passes | PASS (devtools confirmation noted as gap) | File contains the `@media` block; build output pasted |
| 1.2.7 | Scratch page removed, placeholder renders, build passes | PASS (raw output noted as gap) | Developer confirmation |

**Deviations from Contract:**

- **Status colors are literal hex values.** DESIGN.md §4.2.1 says the five anchors are the only raw hex values in the codebase, but DESIGN.md §4.2.3 lists four status colors as literal values. Resolved in favor of §4.2.3 (the more specific rule). Recorded in ENTRY-0015.
- **Spacing tokens include the fractional steps.** DESIGN.md §4.4.1 lists `--space-px`, `--space-0-5`, and `--space-1-5`; DESIGN.md §4.15.1 omits them. Resolved in favor of §4.4.1 (the more complete rule). Recorded in ENTRY-0015.
- **Type tokens use the CSS `font` shorthand.** DESIGN.md §4.3.2 and §4.3.3 give size / line-height, family, and weight per token. The shorthand form was chosen to keep each token to a single variable. Recorded in the Task 1.2.2 plan.
- **`--guest-text-hero` and `--guest-text-h1` have mobile overrides.** DESIGN.md §4.3.2 gives mobile and desktop values for both. A `@media (max-width: 639px)` block re-declares them at the mobile values. Recorded in the Task 1.2.2 plan.
- **`--shadow-brand-glow` references `--guest-brand`.** `--guest-brand` is defined inside `[data-world="guest"]`, so the token resolves only inside a guest-world element. This matches DESIGN.md §4.4.3. Recorded.
- **`!important` in the reduced-motion safety net.** BUILD.md §4.9 forbids `!important`; the reduced-motion fallback uses it per the standard pattern in DESIGN.md §4.5.7. Recorded as the documented exception.

**Noticed but Out of Scope:**

- **The Tailwind theme config is not authored.** DESIGN.md §4.15.6 shows a Tailwind config that maps every token to a Tailwind class. This was deferred from Milestone 1.2 and is not part of any existing roadmap task. It needs its own task (see the recommendation below).
- **`app/globals.css` uses duplicated comment banners.** A cosmetic inconsistency: a few indented block comments are aligned to four spaces where the rest of the file uses two. Not a defect; a future cleanup if desired.
- **The scratch page's `<h1>` uses 4-space indentation where the surrounding lines use 6.** Cosmetic, on a temporary file that has now been removed.
- **The initial build after Task 1.2.2 took 12.7s** because `next/font` fetched and self-hosted the three font families for the first time. Expected; subsequent builds returned to sub-second. Recorded.
- **No test covers the tokens.** This is correct per DESIGN.md §4.15.7 and BUILD.md §8.5 — the tokens are not logic, and visual verification is done by looking, not by a test.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change | No change |
| SYSTEM.md | No | No system shape change | No change |
| BUILD.md | No | No build rule change | No change |
| ROADMAP.md | Yes | Tasks 1.2.1–1.2.7 complete | Update statuses |
| PROGRESS.md | Yes (this entry) | — | Append |

**Contradiction Check:**
None found between the session and the documents. The two internal tensions within DESIGN.md (§4.2.1 vs §4.2.3; §4.4.1 vs §4.15.1) were resolved in favor of the more specific rule and recorded above. No decision in DECISIONS.md is contradicted. No rule in BUILD.md is violated except the documented `!important` exception. No task in ROADMAP.md is contradicted.

**Next:**
Milestone 1.2 is closed. The next milestone is Milestone 1.3 — Base components. Before Task 1.3.1 starts, two decisions must be made:

1. Which base component library — shadcn/ui (recommended, per DESIGN.md §4.6.3) or an equivalent.
2. Whether the Tailwind theme config (DESIGN.md §4.15.6) is added as a new task at the top of Milestone 1.3, or folded into Task 1.3.1.

**Awaiting Human Verification:** YES

---

## Milestone 1.1 — Repository and tooling

*(closed 2026-10-13)*

### ENTRY-0014 — 2026-10-13 — Milestone 1.1 — Repository and tooling complete

**Status:** PASS

**Task:** Milestone 1.1 (Tasks 1.1.1 through 1.1.7)

**Summary:**
The foundation of the project is complete. The repository has the correct folder structure, pnpm is configured as the package manager with all dependencies installed and build approvals recorded, TypeScript strict mode is on with the `@/*` path alias, Next.js 16 builds with the App Router and Tailwind 4, the environment files are in place, and `.gitignore` excludes everything it should. Both `pnpm exec tsc --noEmit` and `pnpm build` pass with no errors.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `package.json` | Populated | Project metadata, scripts, dependencies |
| `pnpm-workspace.yaml` | Populated | Workspace declaration and build approvals |
| `tsconfig.json` | Populated | TypeScript strict mode, path alias, Next.js options |
| `next.config.mjs` | Populated | Next.js framework configuration |
| `postcss.config.mjs` | Populated | Tailwind 4 PostCSS plugin |
| `app/globals.css` | Populated | Tailwind import and base CSS reset |
| `app/layout.tsx` | Populated | Root layout with `<html lang="en">` |
| `app/page.tsx` | Populated | Root screen ("Scan the QR code...") |
| `.gitignore` | Populated | Excludes dependencies, build artifacts, environment files |
| `.env.example` | Populated | Environment variable documentation |
| `.env.local` | Created | Local environment values (gitignored) |
| `app/**/*.tsx`, `app/**/*.ts` (198 files) | Deleted | Empty placeholders blocking the build |
| `middleware.ts` | Deleted | Empty placeholder; recreated in Task 3.5.1 |
| `@tailwindcss/postcss` | Added | Dev dependency required by Tailwind 4 |

**Commands Run:**

`pnpm exec tsc --noEmit` — (no output — exit code 0)

`pnpm build` — compiled successfully in 337ms; routes `/` and `/_not-found` generated.

`Get-Content .gitignore | Select-Object -First 20` — first 20 lines of the ignore rules confirmed.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1.1.1 | Folder structure created per SYSTEM.md §3 | PASS | 169 directories, 289 files created |
| 1.1.2 | Package manager configured (pnpm) | PASS | pnpm list --depth 0 shows 15 packages |
| 1.1.3 | TypeScript strict mode configured | PASS | pnpm exec tsc --noEmit exits 0 |
| 1.1.4 | Framework configured (Next.js App Router) | PASS | pnpm build succeeds with routes / and /_not-found |
| 1.1.5 | Environment files configured | PASS | .env.example and .env.local populated; Next.js reads .env.local |
| 1.1.6 | .gitignore configured | PASS | All required categories present |
| 1.1.7 | Foundation builds cleanly | PASS | pnpm exec tsc --noEmit and pnpm build both pass |

**Deviations from Contract:**
None. All seven tasks passed.

**Noticed but Out of Scope:**
- pnpm 12 settings moved. The `onlyBuiltDependencies` setting is now read from `pnpm-workspace.yaml`, not from `package.json`. BUILD.md §9 should be updated in a future session to document this.
- React 19 + TypeScript 7 require an explicit JSX import. The return type `JSX.Element` is no longer available from the global namespace. It must be imported from `react`. This affects every component file and is reflected in every file written in Milestones 1.3 and beyond.
- 198 empty placeholder files under `app/` were deleted. Next.js validates every file under `app/` during the build, so empty files break the build. Each will be recreated with real content in the task that owns it.
- Tailwind 4 is the version in use. Its configuration model differs from Tailwind 3: no `tailwind.config.ts` is required for basic use, and configuration is CSS-first via the `@theme` directive.
- `middleware.ts` was deleted. It will be recreated with real content in Task 3.5.1.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| BUILD.md | Yes (future) | Document pnpm 12's build approval setting location in §9 | Needs future update |
| ROADMAP.md | Yes | Milestone 1.1 tasks complete | Updated |
| PROGRESS.md | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found. The foundation is consistent with SYSTEM.md §3 (folder structure), BUILD.md §9 (local setup), and DESIGN.md §4.15 (tokens to come).

**Next:**
Task 1.2.1 — Author the color tokens in app/globals.css.

**Awaiting Human Verification:** YES

---

### ENTRY-0013 — 2026-10-13 — Task 1.1.2b — Package manager configuration completed

**Status:** PASS

**Task:** 1.1.2b

**Summary:**
The two IDE save-conflict dialogs were resolved by clicking Overwrite, and both files now contain the correct content on disk. `package.json` shows `"name": "venue-platform"`, `"version": "0.1.0"`, `"private": true`, `"type": "module"`, and `pnpm-workspace.yaml` shows `packages: - "."`. The block that held the project for five sessions is cleared.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| package.json | Replaced | Corrected project metadata, scripts, dependencies |
| pnpm-workspace.yaml | Rewritten | Declared the root as the workspace package |

**Commands Run:**

`Get-Content package.json | Select-Object -First 5` — confirmed `venue-platform`, `0.1.0`, `private: true`, `type: module`.

`Get-Content pnpm-workspace.yaml` — confirmed `packages: - "."`.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | package.json replaced with correct content | PASS | First five lines confirm |
| 2 | pnpm-workspace.yaml rewritten | PASS | Shows packages: - "." |
| 3 | pnpm install clean | PASS | From ENTRY-0009 |
| 4 | pnpm list --depth 0 clean | PASS | From ENTRY-0009 |
| 5 | All tool version checks pass | PASS | From ENTRY-0009 |

**Deviations from Contract:**
None. The task took five sessions because of an IDE save-conflict issue, now resolved.

**Noticed but Out of Scope:**
- BUILD.md §9 should document the IDE save-conflict workflow in a future session.
- Node.js v24.21.0, TypeScript 7.0.2, Next.js 16.4.0, React 19.3.0, Tailwind 4.3.3 are all recent stable versions.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| BUILD.md | Yes (future) | Document the IDE save-conflict workflow in §9 | Needs future update |
| ROADMAP.md | Yes | Task 1.1.2 complete | Updated |
| PROGRESS.md | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 1.1.3 — Configure TypeScript with strict mode.

**Awaiting Human Verification:** YES

---

## Phase 0 — The Documents

*(closed 2026-10-11)*

### ENTRY-0000 — 2026-10-11 — Project Foundation

**Status:** STRUCTURAL

**Task:** None (structural session)

**Summary:**
The seven canonical documents of the project were authored: PRODUCT.md, DECISIONS.md, SYSTEM.md, BUILD.md, ROADMAP.md, PROGRESS.md, and DESIGN.md. The product, its reasons, its shape, its build rules, its plan, its memory, and its visual language all exist and are consistent with one another.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `docs/PRODUCT.md` | Created | The product definition |
| `docs/DECISIONS.md` | Created | The 53 locked decisions across 15 categories |
| `docs/SYSTEM.md` | Created | The shape of the system |
| `docs/BUILD.md` | Created | The build rules |
| `docs/ROADMAP.md` | Created | The ten-phase plan |
| `docs/PROGRESS.md` | Created | The project's memory |
| `docs/DESIGN.md` | Created | The frontend design specification |

**Commands Run:**
None. This session authored documents.

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | PRODUCT.md exists | PASS | File created |
| 2 | DECISIONS.md exists with all 53 decisions | PASS | File created |
| 3 | SYSTEM.md exists | PASS | File created |
| 4 | BUILD.md exists | PASS | File created |
| 5 | ROADMAP.md exists | PASS | File created |
| 6 | PROGRESS.md exists with this entry | PASS | This entry |
| 7 | No document contradicts another | PASS | Contradiction check below |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
- The frontend design specification (`DESIGN.md`) was authored outside the six original canonical documents. It is a seventh document and is now canonical.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| All seven documents | Yes | Created | No change needed |

**Contradiction Check:**
None found. Every document was authored in sequence and each was reviewed against the previous ones before the next was written.

**Next:**
Begin Phase 1. The first task is 1.1.1 — Create the repository with the folder structure from SYSTEM.md §3.

**Awaiting Human Verification:** YES

---

## Git initialisation (pre-milestone)

*(The git initialisation happened between Milestone 1.2 and Milestone 1.3)*

### ENTRY-0018 — 2026-10-14 — Git initialised and public repository created

**Status:** STRUCTURAL

**Task:** None (structural session — repository tooling)

**Summary:**
The project is now under git version control. The local repository was initialised at `A:\QR-PROJECT`, an initial commit was made (`8e50b19`) capturing the entire project state at the end of Task 1.3.0, and the repository was pushed to the public GitHub remote `https://github.com/avishekkarn/venue-platform`. The working tree is clean and the local `main` branch tracks `origin/main`.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `.git/` | Created | Local repository metadata |
| `.gitignore` | Edited | Added `MASTER PLAN.docx` and `MASTER PLAN.pdf` to the exclusion list |

**Commands Run:**
- `git --version` → `git version 2.55.0.windows.5`
- `git config --global user.name "Avishek Karn"` and `git config --global user.email "avishek.np09@gmail.com"`
- `git init`, `git branch -M main`
- `git add -A`, `git status` (verified no `.env.local`, no `node_modules/`, no `.next/`)
- `git commit -m "Initial commit: foundation, design tokens, Tailwind theme mapping ..."` → `[main (root-commit) 8e50b19] 164 files changed, 12348 insertions(+)`
- `git remote add origin https://github.com/avishekkarn/venue-platform.git`
- `git push -u origin main` → succeeded, `* [new branch] main -> main`
- `git log --oneline origin/main` → `8e50b19 (HEAD -> main, origin/main) Initial commit ...`
- `git status` → `Your branch is up to date with 'origin/main'. nothing to commit, working tree clean`

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Local repository initialised | PASS | `git init` output |
| 2 | First commit created | PASS | `git commit` output, 164 files, 12348 insertions |
| 3 | No secrets committed | PASS | `.env.local` absent from `git status` |
| 4 | No `node_modules/` or `.next/` committed | PASS | Both absent |
| 5 | Remote configured | PASS | `git remote -v` |
| 6 | Push succeeded | PASS | `* [new branch] main -> main` |
| 7 | Local and remote in sync | PASS | `git log --oneline origin/main` matches `HEAD` |

**Deviations from Contract:**
- The initial push attempt failed with `403` because the machine's credential manager was authenticated as `nationalmocknepal-oss`, which has no permission on `avishekkarn/venue-platform`. Resolved by clearing the cached credential, signing in as `avishekkarn`, and creating a personal access token. The second push succeeded.
- The local repository is under `A:\QR-PROJECT`, but the system's git CLI reports `core.filemode=false` and `core.symlinks=false`, which are the correct defaults on Windows.

**Noticed but Out of Scope:**
- `MASTER PLAN.docx` and `MASTER PLAN.pdf` are excluded from the repository via `.gitignore`.
- `git config user.name` and `user.email` are set both globally and locally.
- The repository is public. `.env.local` must remain excluded forever.
- `docs/README.md` is inside `docs/`, not at the repository root. A root-level `README.md` could be added later.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| All others | No | No change | No change |
| PROGRESS.md | Yes (this entry) | — | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 1.3.1 — install and configure shadcn/ui.

**Awaiting Human Verification:** YES

---

## How This Archive Grows

When a milestone closes, its entries from `PROGRESS.md` are moved here, verbatim, under a `## Milestone X.Y — <name>` header, placed at the top of the file (newest milestone first). Nothing here is ever edited. The archive is the permanent record; `PROGRESS.md` is the working log.