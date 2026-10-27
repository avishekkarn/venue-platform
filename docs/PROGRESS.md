# PROGRESS.md — The Living Project Log

**Version:** 2.0
**Status:** Approved
**Approved:** 2026-10-15
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

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase (e.g., `PROGRESS_ARCHIVE_PHASE_4.md`) and are summarised in §5.1. Only the current phase's entries live in this file in full.

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
| Phase 3 — Authentication and Sessions | 2026-10-17 | Argon2id hashing, sessions, auth routes, login screens, route protection, placeholder dashboards | `PROGRESS_ARCHIVE_PHASE_3.md` |
| Phase 4 — QR Codes and Guest Context | 2026-10-18 | QR domain, guest sessions, QR landing, guest hero and CTA, admin QR list, generation, revocation, print view | `PROGRESS_ARCHIVE_PHASE_4.md` |

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0109 | 2026-10-18 | Task 5.1.1 — Add the getMenu domain function | PASS | Milestone 5.1 | §5.3 |
| ENTRY-0110 | 2026-10-18 | Task 5.1.2 — Add the getMenuItem domain function | PASS | Milestone 5.1 | §5.3 |
| ENTRY-0111 | 2026-10-19 | Task 5.1.3 — Add the isOrderable domain function | PASS | Milestone 5.1 | §5.3 |
| ENTRY-0112 | 2026-10-19 | Task 5.1.4 — Verify: the menu returns only available and unavailable items, never hidden ones (Milestone 5.1 Close) | PASS | Milestone 5.1 | §5.3 |
| ENTRY-0113 | 2026-10-19 | Task 5.2.1 — Add the menu screen with category tabs | PASS | Milestone 5.2 | §5.3 |
| ENTRY-0114 | 2026-10-27 | Task 5.2.1 manual observation methodology correction | STRUCTURAL | Milestone 5.2 | §5.3 |
| ENTRY-0115 | 2026-10-27 | Task 5.2.2 — Add the item list with photos, names, descriptions, and prices | PASS | Milestone 5.2 | §5.3 |
| ENTRY-0116 | 2026-10-27 | Task 5.2.3 — Add the search bar | PASS | Milestone 5.2 | §5.3 |
Next entry number: 0117.

### 5.3 Current Milestone — Phase 5 Milestone 5.2 (The Menu Screen)

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0116 — 2026-10-27 — Task 5.2.3 — Add the menu search bar

**Status:** PASS

**Task:** Task 5.2.3 — Add the search bar

**Summary:**
Added a live menu search bar to the guest menu screen by creating the MenuList Client Component in app/(guest)/menu/_menu-list.tsx and refactoring app/(guest)/menu/page.tsx to mount it. Guests can search by dish name or description in real time with immediate filtering across categories, while preserving sticky category tabs and empty state notifications.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-list.tsx | Create | Client Component handling search state, live filtering, CategoryTabs, and item rendering |
| app/(guest)/menu/page.tsx | Edit | Mount MenuList Client Component with venue menu data |
| docs/PROGRESS.md | Edit | Record ENTRY-0116, update ledger, advance snapshot to Task 5.2.4 |
| docs/ROADMAP.md | Edit | Mark Task 5.2.3 as complete |

**Commands Run:**
- `pnpm exec tsc --noEmit`
- `pnpm build`
- `pnpm test:unit`
- `pnpm test:integration`

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds | `pnpm build` | 20 app routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Menu screen renders a search bar | Manual Check | Search input with Lucide Search icon rendered below Menu heading | Awaiting Human Verification |
| 6 | Typing dish name/description filters list live | Manual Check | Item list and categories filter in real time to matching items | Awaiting Human Verification |
| 7 | Clearing search restores full list | Manual Check | Empty query restores all menu categories and items | Awaiting Human Verification |
| 8 | Zero console errors throughout | Browser Console Check | Clean console throughout | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | No change | No change |
| SYSTEM.md | No | No change | No change |
| BUILD.md | No | No change | No change |
| ROADMAP.md | Yes | Marked Task 5.2.3 complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0116, updated ledger, advanced snapshot | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 5.2.4 — Add the unavailable-item state (greyed out, with a label).

**Awaiting Human Verification:** YES (manual search interaction checks)

### ENTRY-0115 — 2026-10-27 — Task 5.2.2 — Add the item list with photos, names, descriptions, and prices

**Status:** PASS

**Task:** Task 5.2.2 — Add the item list with photos, names, descriptions, and prices

**Summary:**
MenuItemCard in app/(guest)/menu/_menu-item-card.tsx has been upgraded to the full DESIGN.md §4.6.17.1 anatomy, supporting an optional 16:9 photo container, padded text layout, and guest-world hover-lift motion with reduced-motion suppression. All automated baselines pass cleanly (typecheck, 20 routes build, 137 unit tests, 133 integration tests), and manual visual checks await human verification.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-item-card.tsx | Edit | Render optional 16:9 photo, padded text block, and interactive hover-lift |
| docs/PROGRESS.md | Edit | Record ENTRY-0115, update ledger, advance snapshot to Task 5.2.3 |
| docs/ROADMAP.md | Edit | Mark Task 5.2.2 as complete |

**Commands Run:**
- `pnpm exec tsc --noEmit`
- `pnpm build`
- `pnpm test:unit`
- `pnpm test:integration`

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds | `pnpm build` | 20 app routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Item card with a photo renders photo at 16:9, rounded top corners | Manual Check | Photo above name, aspect-[16/9], object-cover, rounded-t-lg | Awaiting Human Verification |
| 6 | Item card without photo renders name, description, price cleanly | Manual Check | No empty photo slot, padded text container, clean layout | Awaiting Human Verification |
| 7 | Desktop pointer hover lifts card 2px with shadow | Manual Desktop Check (1440×900) | Lifts 2px with shadow expansion over ~200ms; settles back | Awaiting Human Verification |
| 8 | Touch device tap does not lift card | Manual Mobile Check (393×852) | No hover-lift on touch; clean mobile presentation | Awaiting Human Verification |
| 9 | Zero console errors | Browser Console Check | Clean console throughout | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | No change | No change |
| SYSTEM.md | No | No change | No change |
| BUILD.md | No | No change | No change |
| ROADMAP.md | Yes | Marked Task 5.2.2 complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0115, updated ledger, advanced snapshot | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 5.2.3 — Add the search bar.

**Awaiting Human Verification:** YES (manual desktop and mobile visual checks)

### ENTRY-0114 — 2026-10-27 — Task 5.2.1 manual observation methodology correction

**Status:** STRUCTURAL

**Task:** None (structural session)

**Summary:**
The initial manual check for Task 5.2.1 was performed under conditions that produced two false-positive defects: the `"Starters"` tab appeared absent due to residual horizontal scroll on the overflow-x-auto tab strip, and the item card appeared stretched due to observing at a desktop viewport. Re-observation under controlled mobile conditions (393×852) confirmed the tab strip and card anatomy render correctly per DESIGN.md, and the task was committed without code changes.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| docs/PROGRESS.md | Edit | Record ENTRY-0114, update ledger |

**Commands Run:**
None.

**Acceptance Criteria Results:**
None.

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
The tab strip's hide-scrollbar behaviour should be observed by swiping, not assumed visible from the current scroll position — this is now a project-level observation habit.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | No change | No change |
| SYSTEM.md | No | No change | No change |
| BUILD.md | No | No change | No change |
| ROADMAP.md | No | No change | No change |
| PROGRESS.md | Yes (this entry) | Updated | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 5.2.2 — Add the item list with photos, names, descriptions, and prices.

**Awaiting Human Verification:** NO
### ENTRY-0113 — 2026-10-19 — Task 5.2.1 — Add the menu screen with category tabs

**Status:** PASS

**Task:** Task 5.2.1 — Add the menu screen with category tabs

**Summary:**
The menu section below the hero in app/(guest)/menu/page.tsx now renders the getMenu tree with a sticky category tab strip and a scrollable item list, providing smooth in-page navigation across menu categories. Automated validation passed with zero TypeScript issues and all unit/integration tests green; guest-facing mobile manual verification on 393×852 is pending human inspection.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_category-tabs.tsx | Create | Client Component rendering sticky category tabs with active-tab underline and smooth scrolling |
| app/(guest)/menu/_menu-item-card.tsx | Create | Server Component rendering menu item name, description, and localized price via formatMoney |
| app/(guest)/menu/page.tsx | Edit | Call getMenu, wrap View Menu CTA in anchor, render sticky tabs and category sections with error/empty handling |
| docs/PROGRESS.md | Edit | Record ENTRY-0113, update ledger, advance snapshot to Task 5.2.2 |
| docs/ROADMAP.md | Edit | Mark Task 5.2.1 as ✅ Complete |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
```
Output:
```text
(exit code 0, no output)
```

```powershell
pnpm build
```
Output:
```text
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 14ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 981ms
  Running TypeScript ...
  Finished TypeScript in 448ms ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers (0/18) ...
  Generating static pages using 15 workers (4/18) 
  Generating static pages using 15 workers (8/18) 
  Generating static pages using 15 workers (13/18) 
✓ Generating static pages using 15 workers (18/18) in 302ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /admin/qr
├ ƒ /admin/qr/print/[id]
├ ƒ /api/admin/qr/[id]/image
├ ƒ /api/admin/qr/[id]/revoke
├ ƒ /api/admin/qr/generate
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /menu
├ ƒ /qr/[token]
├ ○ /qr/inactive
├ ƒ /services
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
```
Output:
```text
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/lib/date.test.ts (14 tests) 28ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 27ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 15ms
 ✓ tests/unit/menu/get-menu.test.ts (6 tests) 10ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 8ms
 ✓ tests/unit/guest/guest-session.service.test.ts (13 tests) 10ms
 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 7ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 7ms
 ✓ tests/unit/menu/get-menu-item.test.ts (6 tests) 9ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 11ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 8ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 7ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/infrastructure/qr/qr-image.adapter.test.ts (2 tests) 108ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 6ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 6ms
 ✓ tests/unit/infrastructure/guest/cookies.test.ts (4 tests) 5ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 4ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 5ms
 ✓ tests/unit/menu/is-orderable.test.ts (4 tests) 3ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 557ms

 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  00:37:16
   Duration  818ms (tests 38%, import 29%, transform 28%, worker 6%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  00:37:33
   Duration  76.03s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | Landing renders | Manual Mobile Check (393×852) | Page renders with venue name in Fraunces, warm sand background, View Menu CTA, clean console | Awaiting Human Verification |
| 2 | Menu section appears below Chef's Picks | Manual Mobile Check (393×852) | Menu heading (28px Fraunces), sticky category tabs (Starters, Mains, Desserts) | Awaiting Human Verification |
| 3 | Tapping a tab scrolls to that category | Manual Mobile Check (393×852) | Tapping Mains scrolls to category heading below sticky tab strip; active underline moves | Awaiting Human Verification |
| 4 | Item cards render name, description, price | Manual Mobile Check (393×852) | Name (18px semibold), description (14px secondary), price right-aligned via formatMoney | Awaiting Human Verification |
| 5 | Chef's Picks still works; console clean | Manual Mobile Check (393×852) | Chef's Picks row renders from listItems; zero console errors | Awaiting Human Verification |
| 6 | TypeScript typecheck clean | pnpm exec tsc --noEmit | Exit code 0, no output | PASS |
| 7 | Production build compiles clean | pnpm build | 20 routes | PASS |
| 8 | Unit tests pass exact count | pnpm test:unit | 137 passed across 23 files | PASS |
| 9 | Integration tests pass exact count | pnpm test:integration | 133 passed across 27 files | PASS |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
Chef's Picks still consumes listItems; the consolidation to getMenu is deferred. Card hover-lift, photos, search bar, unavailable-item styling, and floating cart bar belong to Tasks 5.2.2 through 5.2.5.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Adheres to §5.2, §5.3, §5.6 | No change |
| DECISIONS.md | No | Adheres to D-4.2, D-9.2, D-9.4, D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §5, §15.4 | No change |
| BUILD.md | No | Adheres to §1, §3, §4, §8.8, §12.3, §13.2, §15 | No change |
| ROADMAP.md | Yes | Marked Task 5.2.1 as ✅ Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0113, updated ledger, advanced snapshot | Updated |
| DESIGN.md | No | Adheres to §4.6.7, §4.6.10, §4.6.17.1, §4.8.1, §4.13.1, §4.15 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.2.2 — Add the item list with photos, names, descriptions, and prices.

**Awaiting Human Verification:** YES (the manual mobile check)


### ENTRY-0112 — 2026-10-19 — Task 5.1.4 — Verify: the menu returns only available and unavailable items, never hidden ones (Milestone 5.1 Close)

**Status:** PASS

**Task:** Task 5.1.4 — Verify: the menu returns only available and unavailable items, never hidden ones

**Summary:**
Four integration assertions executed against real PostgreSQL prove the D-4.2 rule that HIDDEN menu items and categories containing only HIDDEN items are pruned by getMenu, getMenuItem returns NOT_FOUND for HIDDEN items, and isOrderable returns false for UNAVAILABLE and HIDDEN items. Milestone 5.1 (the menu domain) is fully verified and closed, unblocking Milestone 5.2.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| tests/integration/menu/get-menu-hidden-filter.test.ts | Create | Integration test proving HIDDEN items are excluded from getMenu against real PostgreSQL, and that getMenuItem returns NOT_FOUND for them |
| docs/PROGRESS.md | Edit | Record ENTRY-0112, update ledger, advance snapshot |
| docs/ROADMAP.md | Edit | Mark Task 5.1.4 as ✅ Complete and record Milestone 5.1 close |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
```
Output:
```text
(exit code 0, no output)
```

```powershell
pnpm build
```
Output:
```text
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 13ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 525ms
  Running TypeScript ...
  Finished TypeScript in 404ms ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers (0/18) ...
  Generating static pages using 15 workers (4/18) 
  Generating static pages using 15 workers (8/18) 
  Generating static pages using 15 workers (13/18) 
✓ Generating static pages using 15 workers (18/18) in 276ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /admin/qr
├ ƒ /admin/qr/print/[id]
├ ƒ /api/admin/qr/[id]/image
├ ƒ /api/admin/qr/[id]/revoke
├ ƒ /api/admin/qr/generate
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /menu
├ ƒ /qr/[token]
├ ○ /qr/inactive
├ ƒ /services
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
```
Output:
```text
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/lib/utils.test.ts (13 tests) 14ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 27ms
 ✓ tests/unit/menu/get-menu.test.ts (6 tests) 10ms
 ✓ tests/unit/guest/guest-session.service.test.ts (13 tests) 10ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 8ms
 ✓ tests/unit/lib/date.test.ts (14 tests) 28ms
 ✓ tests/unit/menu/get-menu-item.test.ts (6 tests) 9ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 10ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 8ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 8ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 8ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 7ms
 ✓ tests/unit/infrastructure/qr/qr-image.adapter.test.ts (2 tests) 107ms
 ✓ tests/unit/infrastructure/guest/cookies.test.ts (4 tests) 6ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 8ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 6ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 5ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 6ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 4ms
 ✓ tests/unit/menu/is-orderable.test.ts (4 tests) 4ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 616ms

 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  00:19:00
   Duration  925ms (tests 44%, import 28%, transform 21%, worker 6%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  00:19:14
   Duration  67.89s (tests 96%, setup 3%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | getMenu excludes a HIDDEN item against real PostgreSQL | pnpm test:integration | returned tree includes AVAILABLE item and excludes HIDDEN item by ID | PASS |
| 2 | A category whose only item is HIDDEN is excluded entirely | pnpm test:integration | category with only HIDDEN item pruned from returned tree | PASS |
| 3 | getMenuItem returns NOT_FOUND for the HIDDEN item | pnpm test:integration | returns fail(NOT_FOUND, "Menu item not found") | PASS |
| 4 | isOrderable returns false for UNAVAILABLE and HIDDEN items | pnpm test:integration | returns false for UNAVAILABLE and HIDDEN items | PASS |
| 5 | TypeScript typecheck clean | pnpm exec tsc --noEmit | Exit code 0, no output | PASS |
| 6 | Production build compiles clean | pnpm build | 20 routes | PASS |
| 7 | Unit tests pass exact count | pnpm test:unit | 137 passed across 23 files | PASS |
| 8 | Integration tests pass exact count | pnpm test:integration | 133 passed across 27 files | PASS |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
Milestone 5.2 (the menu screen) is unblocked; the guest menu page still consumes listItems until Task 5.2.1; isOrderable's first caller is Task 5.2.4.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Adheres to §5.3 | No change |
| DECISIONS.md | No | Adheres to D-4.2 | No change |
| SYSTEM.md | No | Adheres to §4, §5, §11.3, §15.4 | No change |
| BUILD.md | No | Adheres to §1, §5, §8.8, §11, §13.2, §15 | No change |
| ROADMAP.md | Yes | Marked Task 5.1.4 as ✅ Complete and recorded Milestone 5.1 close | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0112, updated ledger, advanced snapshot to Milestone 5.2 | Updated |
| DESIGN.md | No | Adheres to specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.2.1 — Add the menu screen with category tabs.

**Awaiting Human Verification:** NO


### ENTRY-0111 — 2026-10-19 — Task 5.1.3 — Add the isOrderable domain function

**Status:** PASS

**Task:** Task 5.1.3 — Add the `isOrderable` domain function (item state check)

**Summary:**
isOrderable is a pure synchronous predicate over MenuItemView.state answering whether a menu item can currently be added to the cart. It returns true only when item state is AVAILABLE, treating UNAVAILABLE and HIDDEN as not orderable, with four unit assertions shipped and no new integration test because the function is a pure in-memory predicate with no database path.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/menu/is-orderable.ts | Create | Pure synchronous predicate isOrderable(item: MenuItemView): boolean |
| src/domain/menu/index.ts | Edit | Export is-orderable from menu domain barrel |
| tests/unit/menu/is-orderable.test.ts | Create | Four unit assertions covering AVAILABLE, UNAVAILABLE, HIDDEN, and determinism |
| docs/PROGRESS.md | Edit | Record ENTRY-0111, update ledger, advance snapshot |
| docs/ROADMAP.md | Edit | Mark Task 5.1.3 as ✅ Complete |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
```
Output:
```text
(exit code 0, no output)
```

```powershell
pnpm build
```
Output:
```text
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 14ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 534ms
  Running TypeScript ...
  Finished TypeScript in 373ms ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers (0/18) ...
  Generating static pages using 15 workers (4/18) 
  Generating static pages using 15 workers (8/18) 
  Generating static pages using 15 workers (13/18) 
✓ Generating static pages using 15 workers (18/18) in 276ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /admin/qr
├ ƒ /admin/qr/print/[id]
├ ƒ /api/admin/qr/[id]/image
├ ƒ /api/admin/qr/[id]/revoke
├ ƒ /api/admin/qr/generate
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /menu
├ ƒ /qr/[token]
├ ○ /qr/inactive
├ ƒ /services
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
```
Output:
```text
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/lib/date.test.ts (14 tests) 28ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 27ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 14ms
 ✓ tests/unit/guest/guest-session.service.test.ts (13 tests) 11ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 8ms
 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 7ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/infrastructure/guest/cookies.test.ts (4 tests) 6ms
 ✓ tests/unit/menu/get-menu.test.ts (6 tests) 10ms
 ✓ tests/unit/infrastructure/qr/qr-image.adapter.test.ts (2 tests) 118ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 7ms
 ✓ tests/unit/menu/get-menu-item.test.ts (6 tests) 9ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 9ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 10ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 6ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 7ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 4ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 5ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 5ms
 ✓ tests/unit/menu/is-orderable.test.ts (4 tests) 3ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 540ms

 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  00:04:55
   Duration  824ms (tests 42%, import 25%, transform 25%, worker 7%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  26 passed (26)
      Tests  129 passed (129)
   Start at  00:05:06
   Duration  73.68s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | AVAILABLE returns true | pnpm test:unit | item with AVAILABLE state returns true | PASS |
| 2 | UNAVAILABLE returns false (D-4.2 rule) | pnpm test:unit | item with UNAVAILABLE state returns false | PASS |
| 3 | HIDDEN returns false (defense in depth) | pnpm test:unit | item with HIDDEN state returns false | PASS |
| 4 | Determinism (no clock, no random, no cache drift) | pnpm test:unit | two calls on same item return true | PASS |
| 5 | TypeScript typecheck clean | pnpm exec tsc --noEmit | Exit code 0, no output | PASS |
| 6 | Production build compiles clean | pnpm build | 20 routes | PASS |
| 7 | Unit tests pass exact count | pnpm test:unit | 137 passed across 23 files | PASS |
| 8 | Integration tests pass exact count | pnpm test:integration | 129 passed across 26 files | PASS |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
Task 5.1.4 (milestone verification) is next; the guest menu page still consumes listItems until Task 5.2.1; isOrderable's caller is Task 5.2.4 (the unavailable-item state on the menu screen).

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Adheres to §5.3 | No change |
| DECISIONS.md | No | Adheres to D-4.2, D-4.6 | No change |
| SYSTEM.md | No | Adheres to §4, §5, §9.4, §11.3 | No change |
| BUILD.md | No | Adheres to §1, §2, §5, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Marked Task 5.1.3 as ✅ Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0111, updated ledger, advanced snapshot | Updated |
| DESIGN.md | No | Adheres to §4.6.17.1 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.1.4 — Verify: the menu returns only available and unavailable items, never hidden ones.

**Awaiting Human Verification:** NO


### ENTRY-0110 — 2026-10-18 — Task 5.1.2 — Add the getMenuItem domain function

**Status:** PASS

**Task:** Task 5.1.2 — Add the `getMenuItem` domain function

**Summary:**
getMenuItem is a pure domain function that retrieves a single guest-visible menu item by ID from the venue's menu tree, returning NOT_FOUND for nonexistent or HIDDEN items. Six unit assertions were shipped with no new integration test because the underlying getFullMenu query path is already covered by ENTRY-0109's integration tests.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/menu/get-menu-item.ts | Create | Pure domain function getMenuItem(deps, venueId, itemId) validating inputs, calling getFullMenu, and returning the requested MenuItemView or NOT_FOUND |
| src/domain/menu/index.ts | Edit | Re-export getMenuItem and GetMenuItemDeps from the domain module |
| tests/unit/menu/get-menu-item.test.ts | Create | Six unit assertions covering first-category item, later-category item, HIDDEN item NOT_FOUND, nonexistent ID NOT_FOUND, repo failure propagation, and empty itemId validation |
| docs/PROGRESS.md | Edit | Record ENTRY-0110, update ledger, advance snapshot |
| docs/ROADMAP.md | Edit | Mark Task 5.1.2 as ✅ Complete |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
```
Output:
```text
(exit code 0, no output)
```

```powershell
pnpm build
```
Output:
```text
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 13ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 521ms
  Running TypeScript ...
  Finished TypeScript in 426ms ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers (0/18) ...
  Generating static pages using 15 workers (4/18) 
  Generating static pages using 15 workers (8/18) 
  Generating static pages using 15 workers (13/18) 
✓ Generating static pages using 15 workers (18/18) in 272ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /admin/qr
├ ƒ /admin/qr/print/[id]
├ ƒ /api/admin/qr/[id]/image
├ ƒ /api/admin/qr/[id]/revoke
├ ƒ /api/admin/qr/generate
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /menu
├ ƒ /qr/[token]
├ ○ /qr/inactive
├ ƒ /services
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
```
Output:
```text
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/lib/date.test.ts (14 tests) 27ms
 ✓ tests/unit/menu/get-menu.test.ts (6 tests) 10ms
 ✓ tests/unit/guest/guest-session.service.test.ts (13 tests) 11ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 8ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 14ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 28ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 8ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 8ms
 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 7ms
 ✓ tests/unit/menu/get-menu-item.test.ts (6 tests) 10ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 10ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 9ms
 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 7ms
 ✓ tests/unit/infrastructure/qr/qr-image.adapter.test.ts (2 tests) 116ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 6ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 6ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 6ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 5ms
 ✓ tests/unit/infrastructure/guest/cookies.test.ts (4 tests) 6ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 543ms

 Test Files  22 passed (22)
      Tests  133 passed (133)
   Start at  23:53:45
   Duration  778ms (tests 38%, transform 32%, import 24%, worker 6%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  26 passed (26)
      Tests  129 passed (129)
   Start at  23:53:52
   Duration  73.99s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | Happy path — item in first category returns ok(item) with modifier groups and string money | pnpm test:unit | Item found in category 1, full shape returned | PASS |
| 2 | Happy path — item in later category searches without short-circuiting | pnpm test:unit | Item found in category 2 | PASS |
| 3 | HIDDEN item returns NOT_FOUND | pnpm test:unit | Item filtered at source returns NOT_FOUND | PASS |
| 4 | Nonexistent ID returns NOT_FOUND with "Menu item not found" | pnpm test:unit | Unknown UUID returns NOT_FOUND | PASS |
| 5 | Repository failure propagates unchanged | pnpm test:unit | INTERNAL error returned without wrapping | PASS |
| 6 | Empty itemId returns VALIDATION_FAILED and repo not called | pnpm test:unit | VALIDATION_FAILED returned | PASS |
| 7 | TypeScript typecheck clean | pnpm exec tsc --noEmit | Exit code 0, no output | PASS |
| 8 | Production build compiles clean | pnpm build | 20 routes | PASS |
| 9 | Unit tests pass exact count | pnpm test:unit | 133 passed across 22 files | PASS |
| 10 | Integration tests pass exact count | pnpm test:integration | 129 passed across 26 files | PASS |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
Task 5.1.3 (isOrderable domain function) is deferred. The guest menu page continues to consume listItems until Task 5.2.1.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Scope matches product requirements | No change |
| DECISIONS.md | No | Adheres to D-4.1, D-4.2 | No change |
| SYSTEM.md | No | Adheres to §4, §5, §11.3, §15.4 | No change |
| BUILD.md | No | Adheres to §5, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Marked Task 5.1.2 as ✅ Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0110, updated ledger, advanced snapshot | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.1.3 — Add the isOrderable domain function.

**Awaiting Human Verification:** NO

### ENTRY-0109 — 2026-10-18 — Task 5.1.1 — Add the getMenu domain function

**Status:** PASS

**Task:** Task 5.1.1 — Add the `getMenu` domain function

**Summary:**
getMenu is a pure domain function; it composes getFullMenu (a new port method and Prisma adapter method added in this task) and filters the returned tree to AVAILABLE and UNAVAILABLE items, dropping HIDDEN items and categories with no visible items. Six unit assertions and four integration assertions were shipped.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/menu/menu.repository.ts | Edit | Added ModifierOptionView, ModifierGroupView, MenuItemView, MenuCategoryView interfaces and getFullMenu(venueId) to MenuRepository port |
| src/infrastructure/db/repositories/menu.repo.ts | Edit | Implemented getFullMenu on Prisma adapter with nested includes, ordering by sortOrder asc, decimal string mapping, and error mapping |
| src/domain/menu/get-menu.ts | Edit | Pure domain function getMenu(deps, venueId) validating venueId, calling getFullMenu, filtering to AVAILABLE/UNAVAILABLE, and dropping empty categories |
| tests/unit/menu/get-menu.test.ts | Create | Six unit assertions covering full tree, HIDDEN exclusion, UNAVAILABLE inclusion, empty venue, repo failure propagation, and venueId validation |
| tests/integration/repositories/menu-get-full-menu.test.ts | Create | Four integration assertions in transaction rollback testing nested tree, ordering by order, empty venue, and cross-venue isolation |
| vitest.config.ts | Edit | Widened unit test include pattern to include tests/unit/menu/**/*.test.ts |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
```
Output:
```text
(exit code 0, no output)
```

```powershell
pnpm build
```
Output:
```text
$ next build
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local
✓ Running next.config.mjs took 14ms

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.

  To migrate automatically, run:
  npx @next/codemod@canary middleware-to-proxy .

  Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  Creating an optimized production build ...
✓ Compiled successfully in 543ms
  Running TypeScript ...
  Finished TypeScript in 505ms ...
  Collecting page data using 15 workers ...
  Generating static pages using 15 workers (0/18) ...
  Generating static pages using 15 workers (4/18) 
  Generating static pages using 15 workers (8/18) 
  Generating static pages using 15 workers (13/18) 
✓ Generating static pages using 15 workers (18/18) in 267ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /admin
├ ƒ /admin/login
├ ƒ /admin/qr
├ ƒ /admin/qr/print/[id]
├ ƒ /api/admin/qr/[id]/image
├ ƒ /api/admin/qr/[id]/revoke
├ ƒ /api/admin/qr/generate
├ ƒ /api/auth/login
├ ƒ /api/auth/logout
├ ƒ /api/auth/session
├ ○ /forbidden
├ ƒ /kitchen
├ ƒ /kitchen/login
├ ƒ /menu
├ ƒ /qr/[token]
├ ○ /qr/inactive
├ ƒ /services
├ ƒ /staff
└ ƒ /staff/login


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
```
Output:
```text
$ vitest run --config vitest.config.ts

 RUN  v5.0.4 A:/QR-PROJECT

 ✓ tests/unit/infrastructure/auth/session.test.ts (5 tests) 8ms
 ✓ tests/unit/auth/login.test.ts (5 tests) 10ms
 ✓ tests/unit/auth/change-password.test.ts (5 tests) 10ms
 ✓ tests/unit/lib/utils.test.ts (13 tests) 18ms
 ✓ tests/unit/guest/guest-session.service.test.ts (13 tests) 13ms
 ✓ tests/unit/lib/money.test.ts (16 tests) 33ms
 ✓ tests/unit/menu/get-menu.test.ts (6 tests) 12ms
 ✓ tests/unit/lib/date.test.ts (14 tests) 34ms
 ✓ tests/unit/qr/resolve-token.test.ts (4 tests) 10ms
 ✓ tests/unit/qr/revoke-token.test.ts (4 tests) 9ms
 ✓ tests/unit/auth/middleware.test.ts (5 tests) 11ms
 ✓ tests/unit/qr/generate-token.test.ts (4 tests) 9ms
 ✓ tests/unit/auth/require-role.test.ts (3 tests) 8ms
 ✓ tests/unit/infrastructure/qr/qr-image.adapter.test.ts (2 tests) 123ms
 ✓ tests/unit/auth/redirect-map.test.ts (5 tests) 7ms
 ✓ tests/unit/infrastructure/auth/cookies.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/get-session.test.ts (3 tests) 7ms
 ✓ tests/unit/auth/logout.test.ts (2 tests) 6ms
 ✓ tests/unit/auth/can-access.test.ts (6 tests) 4ms
 ✓ tests/unit/infrastructure/guest/cookies.test.ts (4 tests) 5ms
 ✓ tests/unit/infrastructure/auth/password.test.ts (5 tests) 600ms

 Test Files  21 passed (21)
      Tests  127 passed (127)
   Start at  23:31:41
   Duration  967ms (tests 39%, transform 28%, import 26%, worker 6%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  26 passed (26)
      Tests  129 passed (129)
   Start at  23:31:48
   Duration  72.33s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Command or Action | Expected Result | Actual Result |
|---|-----------|-------------------|-----------------|---------------|
| 1 | getFullMenu port method and View interfaces added with string money | Inspect src/domain/menu/menu.repository.ts | Types added, listItems untouched | PASS |
| 2 | getFullMenu adapter implementation queries nested categories/items/modifiers | Inspect src/infrastructure/db/repositories/menu.repo.ts | Single query, money mapped to string, errors mapped to INTERNAL | PASS |
| 3 | Pure getMenu domain function validates venueId and drops HIDDEN items | Inspect src/domain/menu/get-menu.ts | Pure function, filters AVAILABLE/UNAVAILABLE, drops empty categories | PASS |
| 4 | Unit test: full nested tree returned | pnpm test:unit | Assertion passes | PASS |
| 5 | Unit test: HIDDEN items and empty categories dropped | pnpm test:unit | Assertion passes | PASS |
| 6 | Unit test: UNAVAILABLE items preserved | pnpm test:unit | Assertion passes | PASS |
| 7 | Unit test: empty venue returns ok([]) | pnpm test:unit | Assertion passes | PASS |
| 8 | Unit test: repo failure propagates unchanged | pnpm test:unit | Assertion passes | PASS |
| 9 | Unit test: empty venueId returns VALIDATION_FAILED | pnpm test:unit | Assertion passes | PASS |
| 10 | Integration test: full tree with nested items and modifiers | pnpm test:integration | Real DB roundtrip passes | PASS |
| 11 | Integration test: categories and items ordered by order | pnpm test:integration | Ascending sortOrder preserved | PASS |
| 12 | Integration test: empty venue returns ok([]) | pnpm test:integration | Empty array returned | PASS |
| 13 | Integration test: cross-venue isolation enforced | pnpm test:integration | Separate venues do not leak items | PASS |
| 14 | Exact baseline counts match | Commands 1–4 | tsc 0, build 20 routes, unit 127/21, integration 129/26 | PASS |

**Deviations from Contract:**
1. The vitest.config.ts widening (tests/unit/menu/**/*.test.ts) is the same pattern established in ENTRY-0082 (Task 4.1.1) and ENTRY-0088 (Task 4.2.1) — required so the new unit test is discoverable, and stated in the config file's own comment.
2. Commit order reversed. The two commits for this task were executed in reverse order (dcf0a4d STRUCTURAL docs first, then 22abe47 code) instead of the mandated code-first-then-docs sequence. The final tree state after both commits is byte-identical to the correct order; no baseline was affected; no file content was wrong. The deviation is recorded here rather than rewriting history.
3. Pre-condition override. The session began with docs/PROGRESS_ARCHIVE_PHASE_4.md untracked, authorized by the human. This was recorded in the engineer's original report.

**Noticed but Out of Scope:**
The guest menu page continues to consume listItems for Chef's Picks until Task 5.2.1; getMenuItem (5.1.2) and isOrderable (5.1.3) are deferred.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Scope matches product requirements | No change |
| DECISIONS.md | No | Adheres to D-4.1, D-4.2 | No change |
| SYSTEM.md | No | Adheres to §4, §5, §11.1, §11.3 | No change |
| BUILD.md | No | Adheres to §5, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Marked Task 5.1.1 as ✅ Complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0109, updated ledger, advanced snapshot | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.1.2 — Add the getMenuItem domain function.

**Awaiting Human Verification:** NO

## 6. The Archive Index

`PROGRESS_ARCHIVE_PHASE_1.md` contains the full text of every entry from Phase 0 and Phase 1.
`PROGRESS_ARCHIVE_PHASE_2.md` contains the full text of every entry from Phase 2.
`PROGRESS_ARCHIVE_PHASE_3.md` contains the full text of every entry from Phase 3.
`PROGRESS_ARCHIVE_PHASE_4.md` contains the full text of every entry from Phase 4.

## 7. The Current State Snapshot

Updated at the end of every session.

Current phase: Phase 5.

Current milestone: Milestone 5.2 (The Menu Screen).

Current task: Task 5.2.4 — Add the unavailable-item state (greyed out, with a label).

Current status: Task 5.2.3 is complete. The MenuList component provides real-time client-side search filtering across dish names and descriptions with graceful empty states and sticky category tabs. All automated verification baselines are green (tsc, build, 137 unit tests, 133 integration tests); manual search verification awaits human inspection. Task 5.2.4 (unavailable items) is next.

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.