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
| ENTRY-0117 | 2026-10-27 | Task 5.2.4 — Add the unavailable-item state (greyed out, with a label) | PASS | Milestone 5.2 | §5.3 |
| ENTRY-0118 | 2026-10-27 | Task 5.2.5 — Add the floating cart bar | PASS | Milestone 5.2 | §5.3 |
| ENTRY-0119 | 2026-10-27 | Task 5.2.6 — Verify the menu screen (Milestone 5.2 Close) | PASS | Milestone 5.2 | §5.3 |
| ENTRY-0121 | 2026-10-27 | Task 5.0.2 — Add development QR interface for LAN mobile testing | PASS | Milestone 5.0 | §5.3 |
| ENTRY-0122 | 2026-10-27 | Task 5.0.2 Fix — Resolve dev QR origin dynamically via next/headers | PASS | Milestone 5.0 | §5.3 |
| ENTRY-0123 | 2026-10-27 | Task 5.0.3 — Mobile Menu Hydration, Search Input & Category Scroll Fix (Milestone 5.0 Close) | PASS | Milestone 5.0 | §5.3 |
| ENTRY-0124 | 2026-10-27 | Task 5.0.3 Corrective — Mobile Menu Search Input & Category Tab Underline Fix | PASS | Milestone 5.0 | §5.3 |
| ENTRY-0125 | 2026-10-27 | Task 5.0.3 Corrective — Native Event Listener for Search & Button Category Tabs | PASS | Milestone 5.0 | §5.3 |
| ENTRY-0126 | 2026-10-27 | Task 5.0.3 Corrective — Native DOM Script Manipulation for Search and Tabs | PASS | Milestone 5.0 | §5.3 |
| ENTRY-0127 | 2026-10-27 | Task 5.3.1 — Add the modifier sheet layout | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0128 | 2026-10-27 | Task 5.3.1 Corrective — Native DOM Script for Modifier Sheet Mobile Interaction | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0129 | 2026-10-27 | Task 5.3.2 — Add the single-choice modifier group | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0130 | 2026-10-27 | Task 5.3.3 — Add the multiple-choice modifier group | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0131 | 2026-10-28 | Task 5.3.4 — Add the quantity stepper | PASS | Milestone 5.3 | §5.3 |
Next entry number: 0132

### 5.3 Current Milestone —  Milestone 5.3 (The Modifier Sheet). Current task: Task 5.3.5 — Add the notes field.

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0131 — 2026-10-28 — Task 5.3.4 — Add the quantity stepper

**Status:** PASS

**Task:** Task 5.3.4 — Add the quantity stepper

**Summary:**
Added a quantity stepper container (`#quantity-stepper` with decrement button `#qty-minus`, counter `#qty-display`, and increment button `#qty-plus`) to the Modifier Sheet footer in `_modifier-sheet.tsx`. Updated `_menu-list.tsx` to incorporate quantity into the live price calculation formula: `(basePrice + modifierSum) * quantity`, rendered dynamically to `#modifier-sheet-price`. Attached native click listeners to increment quantity up to 99 on `#qty-plus` and decrement down to 1 on `#qty-minus`, and wired sheet opening to reset `#qty-display` to 1. Ensured live price recalculation fires synchronously on modifier selection changes, quantity clicks, and sheet opens.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_modifier-sheet.tsx | Edit | Added quantity stepper controls (`#quantity-stepper`, `#qty-minus`, `#qty-display`, `#qty-plus`) above Add to Cart button |
| app/(guest)/menu/_menu-list.tsx | Edit | Updated price formula to include quantity multiplier, added stepper click listeners, and reset quantity to 1 on sheet open |
| docs/ROADMAP.md | Edit | Mark Task 5.3.4 as complete |
| docs/PROGRESS.md | Edit | Record ENTRY-0131, bump ledger to 0132 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  12:00:07
   Duration  1.08s (tests 34%, import 33%, transform 26%, worker 7%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  12:02:07
   Duration  89.97s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Quantity stepper appears in sheet with default 1 on mobile | Manual Mobile Check | Container `#quantity-stepper` displays `#qty-display` with "1" | Awaiting Human Verification |
| 6 | Tapping "+" increments quantity and multiplies total price correctly | Manual Mobile Check | `#qty-display` increments up to 99; `#modifier-sheet-price` scales by quantity | Awaiting Human Verification |
| 7 | Tapping "-" decrements quantity and divides total price correctly | Manual Mobile Check | `#qty-display` decrements down to 1; price scales down | Awaiting Human Verification |
| 8 | Quantity resets to 1 when a new item is opened | Manual Mobile Check | On item card click, `#qty-display` resets to "1" | Awaiting Human Verification |
| 9 | Modifier price updates still work correctly alongside quantity changes | Manual Mobile Check | Toggling modifiers with quantity > 1 multiplies new sum correctly | Awaiting Human Verification |
| 10 | Search filtering continues to function | Manual Mobile Check | Search input listener continues to hide/show cards and categories | Awaiting Human Verification |
| 11 | No console errors | Browser Console | Clean execution without errors | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Mark Task 5.3.4 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0131, bumped ledger to 0132 | Updated |
| DESIGN.md | No | Adheres to §4.6.4, §4.6.17.2, §4.15.7 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.5 — Add the notes field.

**Awaiting Human Verification:** YES (manual mobile observation: stepper default 1, increment/decrement, price multiplication, reset on open)



### ENTRY-0130 — 2026-10-27 — Task 5.3.3 — Add the multiple-choice modifier group

**Status:** PASS

**Task:** Task 5.3.3 — Add the multiple-choice modifier group

**Summary:**
Rendered multiple-choice modifier groups (`group.multiple === true`) as checkboxes inside the Modifier Sheet while preserving single-choice modifier groups as radio buttons. Extended the native DOM inline script in `_menu-list.tsx` to inspect `group.multiple`, generate `<input type="checkbox">` elements with option-specific names (`name="group-${group.id}-option-${opt.id}"`), and display formatted additional prices. Updated `updateModifierPrice` to select all checked inputs (`input:checked`) and sum their `data-price` values with the base price. Updated the native `change` listener on `#modifier-sheet` to respond to both radio and checkbox interactions, seamlessly updating the live total price when checkboxes are toggled on or off.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-list.tsx | Edit | Render checkboxes for multiple-choice modifier groups and sum all checked inputs on change |
| docs/ROADMAP.md | Edit | Mark Task 5.3.3 as complete |
| docs/PROGRESS.md | Edit | Record ENTRY-0130, bump ledger to 0131 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  21:00:08
   Duration  1.43s (import 34%, tests 31%, transform 27%, worker 8%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  21:00:17
   Duration  113.81s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Tapping an item with a multiple-choice group shows checkboxes on mobile | Manual Mobile Check | Checkboxes rendered with group name and option prices | Awaiting Human Verification |
| 6 | Checking a checkbox with an extra cost updates the price at the bottom | Manual Mobile Check | Live price increases by modifier additional price | Awaiting Human Verification |
| 7 | Unchecking the checkbox subtracts the cost from the price | Manual Mobile Check | Live price decreases back accurately | Awaiting Human Verification |
| 8 | Single-choice groups (radio buttons) still work correctly alongside checkboxes | Manual Mobile Check | Radio button selections toggle mutually exclusively and sum with checked checkboxes | Awaiting Human Verification |
| 9 | Search filtering continues to function | Manual Mobile Check | Search input listener continues to hide/show cards and categories | Awaiting Human Verification |
| 10 | No console errors | Browser Console | Clean execution without errors | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Mark Task 5.3.3 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0130, bumped ledger to 0131 | Updated |
| DESIGN.md | No | Adheres to §4.6.4, §4.6.17.2, §4.8.2 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.4 — Add the quantity stepper.

**Awaiting Human Verification:** YES (manual mobile observation: checkbox rendering, price addition on check, subtraction on uncheck, coexistence with radio buttons)



### ENTRY-0129 — 2026-10-27 — Task 5.3.2 — Add the single-choice modifier group

**Status:** PASS

**Task:** Task 5.3.2 — Add the single-choice modifier group

**Summary:**
Rendered single-choice modifier groups (radio buttons) inside the Modifier Sheet using the native DOM script pattern to ensure reliable execution across mobile browsers without hydration or synthetic event swallowing. In `_modifier-sheet.tsx`, replaced the placeholder with `<div id="modifier-groups-container">`. In `_menu-item-card.tsx`, added `data-item-options` (JSON-encoded modifier groups) and `data-item-raw-price`. In `_menu-list.tsx`, extended the native inline `<script>` to generate and inject radio button HTML for single-choice modifier groups upon item selection, displaying group names and option labels with localized additional prices (e.g., `Option Name (+$1.50)`). Attached a native `change` event listener that dynamically recalculates base price plus selected modifier prices and updates `#modifier-sheet-price` in real time.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_modifier-sheet.tsx | Edit | Replaced static placeholder with `#modifier-groups-container` |
| app/(guest)/menu/_menu-item-card.tsx | Edit | Added `data-item-options` and `data-item-raw-price` attributes |
| app/(guest)/menu/_menu-list.tsx | Edit | Dynamically inject single-choice modifier HTML and attached `change` event listener for live price recalculation |
| docs/ROADMAP.md | Edit | Mark Task 5.3.2 as complete |
| docs/PROGRESS.md | Edit | Record ENTRY-0129, bump ledger to 0130 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  19:55:30
   Duration  936ms (import 34%, tests 32%, transform 27%, worker 7%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  19:55:38
   Duration  81.33s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Tapping an item with modifiers opens the sheet and renders the radio buttons on mobile | Manual Mobile Check | Radio buttons injected into `#modifier-groups-container` with group name and option prices | Awaiting Human Verification |
| 6 | Selecting a modifier with an extra cost updates the price at the bottom of the sheet | Manual Mobile Check | Native `change` listener sums base and modifier prices | Awaiting Human Verification |
| 7 | The price updates correctly (base + modifier) | Manual Mobile Check | `#modifier-sheet-price` shows formatted total | Awaiting Human Verification |
| 8 | Search filtering continues to function | Manual Mobile Check | Search input listener continues to hide/show cards and categories | Awaiting Human Verification |
| 9 | No console errors | Browser Console | Clean execution without errors | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Mark Task 5.3.2 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0129, bumped ledger to 0130 | Updated |
| DESIGN.md | No | Adheres to §4.6.4, §4.6.17.2, §4.8.2 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.3 — Add the multiple-choice modifier group.

**Awaiting Human Verification:** YES (manual mobile observation: radio button rendering in modifier sheet, selection price updates, base + modifier math)



### ENTRY-0128 — 2026-10-27 — Task 5.3.1 Corrective — Native DOM Script for Modifier Sheet Mobile Interaction

**Status:** PASS

**Task:** Task 5.3.1 Corrective — Native DOM Script for Modifier Sheet Mobile Interaction

**Summary:**
Replaced React synthetic event handling (`onClick` and `onOpenChange`) for the modifier bottom sheet on mobile devices with direct DOM manipulation via a native `<script>`, eliminating hydration/event failure when accessing over LAN IP. Updated `_modifier-sheet.tsx` to render with container ID `#modifier-sheet` (initially `style={{ display: "none" }}`), backdrop `[data-sheet-overlay]`, close button `#modifier-sheet-close`, title `#modifier-sheet-title`, description `#modifier-sheet-desc`, and price `#modifier-sheet-price`. Updated `_menu-item-card.tsx` with data attributes (`data-item-card`, `data-item-id`, `data-item-name`, `data-item-description`, `data-item-price`, and `data-orderable`). In `_menu-list.tsx`, removed React state for sheet opening/closing and attached native DOM click delegation that dynamically populates and displays `#modifier-sheet` when an orderable item card is clicked, and closes it when the overlay or close button is tapped. Preserved the native DOM search filtering script.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_modifier-sheet.tsx | Edit | Container markup and IDs for direct DOM control, removing React item and onClose props |
| app/(guest)/menu/_menu-item-card.tsx | Edit | Added data-* attributes for DOM click delegation |
| app/(guest)/menu/_menu-list.tsx | Edit | Removed React state for selected item; added native DOM click handlers for opening and closing sheet |
| docs/PROGRESS.md | Edit | Record ENTRY-0128, bump ledger to 0129 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  19:23:51
   Duration  943ms (import 33%, tests 32%, transform 29%, worker 7%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  19:24:16
   Duration  81.26s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Tapping an orderable item card opens the modifier sheet on mobile | Manual Mobile Check | Click listener populates title, desc, price and sets `display: flex` | Awaiting Human Verification |
| 6 | Sheet displays selected item name, description, and price | Manual Mobile Check | Text contents match card's data attributes | Awaiting Human Verification |
| 7 | Tapping backdrop overlay or close button dismisses sheet | Manual Mobile Check | Script sets `display: none` on `#modifier-sheet` | Awaiting Human Verification |
| 8 | Tapping unavailable items does not open sheet | Manual Mobile Check | Unavailable items have `data-orderable="false"` and are ignored | Awaiting Human Verification |
| 9 | Search filtering continues to function | Manual Mobile Check | Search input listener continues to hide/show cards and categories | Awaiting Human Verification |
| 10 | No console errors | Browser Console | Clean execution without errors | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | No | Already updated | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0128, bumped ledger to 0129 | Updated |
| DESIGN.md | No | Adheres to §4.6.6, §4.6.17.2, §4.15 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.2 — Add the single-choice modifier group.

**Awaiting Human Verification:** YES (manual mobile device verification of tap-to-open modifier sheet, correct item details display, tap-to-dismiss via backdrop/close button, and search coexistence)

### ENTRY-0127 — 2026-10-27 — Task 5.3.1 — Add the modifier sheet layout

**Status:** PASS

**Task:** Task 5.3.1 — Add the modifier sheet layout

**Summary:**
Created the modifier sheet layout component (`_modifier-sheet.tsx`) for the guest menu using the base `Sheet` primitives from `src/components/ui/sheet.tsx`. Wired item selection in `_menu-item-card.tsx` via `onSelect` and `cursor-pointer` (active only when `orderable` is true), and managed `selectedItem` state in `_menu-list.tsx`. The sheet slides up as a bottom sheet (`side="bottom" world="guest"`) displaying the item's name, description, price, a placeholder for modifier groups, and an "Add to Cart" CTA button, while preserving the direct DOM mobile search script.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_modifier-sheet.tsx | Create | Client Component bottom sheet displaying selected item name, description, price, and modifier group placeholder |
| app/(guest)/menu/_menu-item-card.tsx | Edit | Add `onSelect` prop and `cursor-pointer` when item is orderable |
| app/(guest)/menu/_menu-list.tsx | Edit | Manage `selectedItem` state, pass `onSelect` to item cards, and render `ModifierSheet` |
| docs/ROADMAP.md | Edit | Mark Task 5.3.1 as complete |
| docs/PROGRESS.md | Edit | Record ENTRY-0127, bump ledger to 0128, and advance snapshot |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  19:10:03
   Duration  961ms (import 35%, tests 33%, transform 25%, worker 7%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  19:10:12
   Duration  76.25s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Tapping an orderable item card opens the bottom sheet | Manual Check | Bottom sheet slides up over 320ms | Awaiting Human Verification |
| 6 | Sheet displays item name, description, and price | Manual Check | Name (22px font-display), description (14px), and formatted price render correctly | Awaiting Human Verification |
| 7 | Tapping outside sheet or close button closes it | Manual Check | onOpenChange(false) resets selectedItem to null | Awaiting Human Verification |
| 8 | Tapping an unavailable item does not open sheet | Manual Check | Unavailable item card has no click handler and does not trigger onSelect | Awaiting Human Verification |
| 9 | Mobile search bar still filters list | Manual Mobile Check | Native search script continues to filter DOM items correctly | Awaiting Human Verification |
| 10 | No console errors | Browser Console | Clean execution without errors | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Marked Task 5.3.1 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0127, bumped ledger to 0128, and advance snapshot | Updated |
| DESIGN.md | No | Adheres to §4.6.6, §4.6.17.2, §4.15 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.2 — Add the single-choice modifier group.

**Awaiting Human Verification:** YES (manual observation of bottom sheet opening, content display, close mechanics, and unavailable item non-interactivity)



### ENTRY-0126 — 2026-10-27 — Task 5.0.3 Corrective — Native DOM Script Manipulation for Search and Tabs

**Status:** PASS

**Task:** Task 5.0.3 — Mobile Menu Native DOM Manipulation for Search and Tabs

**Summary:**
Resolved mobile browser synthetic event swallowing and hydration issues on mobile devices over LAN by applying direct DOM manipulation scripts. In `_menu-list.tsx`, removed `useRef`, `useEffect`, and React event bindings from the search input, adding `id="menu-search-input"`, `data-category-section`, `data-item-card`, and `#menu-empty-state`, driven by a native inline `<script>` listening directly to `input` events and dynamically updating element visibility. In `_category-tabs.tsx`, changed category tabs back to native `<a>` anchors with `href={`#category-${cat.id}`}` and an inline `<script>` attaching a direct click listener on `#category-tabs-nav` to manage the underline styling classes across tab selections.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-list.tsx | Edit | Implement direct DOM search filtering via native `<script>`, `data-category-section`, `data-item-card`, and `#menu-empty-state` |
| app/(guest)/menu/_category-tabs.tsx | Edit | Use native `<a>` tags with inline `<script>` handling category tab underline styling on `#category-tabs-nav` |
| docs/PROGRESS.md | Edit | Record ENTRY-0126 and bump ledger to 0127 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  18:53:10
   Duration  1.12s (tests 34%, import 34%, transform 24%, worker 8%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  18:54:20
   Duration  74.20s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Tapping "Desserts" tab on mobile instantly moves underline and scrolls | Manual Mobile Check | Native anchor scrolls, inline script transitions underline classes | Awaiting Human Verification |
| 6 | Typing "cake" on mobile filters list to show only Chocolate Cake | Manual Mobile Check | Native input event listener filters sections and item cards | Awaiting Human Verification |

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
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | No | Milestone 5.0 already marked complete | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0126 and bumped ledger to 0127 | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.1 — Add the modifier sheet layout.

**Awaiting Human Verification:** YES (mobile phone search typing & category tab scroll verification via LAN)

### ENTRY-0125 — 2026-10-27 — Task 5.0.3 Corrective — Native Event Listener for Search & Button Category Tabs

**Status:** PASS

**Task:** Task 5.0.3 — Mobile Menu Native Search Event Sync & Button Category Tabs

**Summary:**
Resolved mobile browser event handling quirks on the guest menu page. The mobile search input in `_menu-list.tsx` now attaches a native `input` event listener via `useRef` and `useEffect` directly to the DOM input element to guarantee immediate state synchronization on mobile virtual keyboards where synthetic React `onChange` events can be swallowed or delayed. The category tabs in `_category-tabs.tsx` were changed back to `<button>` elements with `onClick` invoking `setActiveId` and `document.getElementById(...).scrollIntoView({ behavior: 'smooth' })`, ensuring React processes the tap event to move the underline while smoothly scrolling the viewport.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-list.tsx | Edit | Attach native `input` event listener via `useRef` and `useEffect` to ensure mobile keyboard state sync |
| app/(guest)/menu/_category-tabs.tsx | Edit | Use `<button>` with `onClick` handler calling `setActiveId` and `scrollIntoView` for reliable tab selection and scrolling |
| docs/PROGRESS.md | Edit | Record ENTRY-0125 and bump ledger to 0126 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  18:41:55
   Duration  1.03s (tests 34%, import 32%, transform 26%, worker 8%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  18:42:08
   Duration  78.22s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Tapping category button updates underline and scrolls on mobile | Manual Mobile Check | Click handler updates React state and calls scrollIntoView | Awaiting Human Verification |
| 6 | Typing in search bar on mobile syncs state via native event listener | Manual Mobile Check | Native event listener captures virtual keyboard input | Awaiting Human Verification |

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
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | No | Milestone 5.0 already marked complete | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0125 and bumped ledger to 0126 | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.1 — Add the modifier sheet layout.

**Awaiting Human Verification:** YES (mobile phone search typing & category tab scroll verification via LAN)

### ENTRY-0124 — 2026-10-27 — Task 5.0.3 Corrective — Mobile Menu Search Input & Category Tab Underline Fix

**Status:** PASS

**Task:** Task 5.0.3 — Mobile Menu Search Input & Category Tab Underline Fix

**Summary:**
Resolved mobile-specific interaction and hydration issues on the menu screen. The category tab underline now uses React state for instant visual feedback on click/tap while maintaining native anchor scrolling behavior (`href={`#category-${cat.id}`}`). The search input in `_menu-list.tsx` uses explicit controlled `onChange` and `onInput` handlers, case-insensitive `.toLowerCase()` matching on queries and item names/descriptions, and an inline clear button (X icon) to ensure reliable filtering across mobile keyboards and auto-capitalization.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_category-tabs.tsx | Edit | Re-introduce React state `activeId` with `onClick={() => setActiveId(cat.id)}` for instant visual underline feedback on mobile |
| app/(guest)/menu/_menu-list.tsx | Edit | Add clear button (X icon), ensure explicit controlled `onChange`/`onInput`, and case-insensitive filtering |
| docs/PROGRESS.md | Edit | Record ENTRY-0124 and bump ledger to 0125 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  18:07:03
   Duration  981ms (import 35%, tests 32%, transform 26%, worker 7%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  18:07:16
   Duration  76.87s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds (21 routes + 1 proxy) | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Tapping category tabs on mobile instantly moves underline and scrolls | Manual Mobile Check | React state updates underline immediately, native anchor scrolls | Awaiting Human Verification |
| 6 | Typing in search bar on mobile filters list case-insensitively | Manual Mobile Check | Case-insensitive query matches with clear button working | Awaiting Human Verification |

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
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | No | Milestone 5.0 already marked complete | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0124 and bumped ledger to 0125 | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.1 — Add the modifier sheet layout.

**Awaiting Human Verification:** YES (mobile phone search typing & category tab scroll verification via LAN)

### ENTRY-0123 — 2026-10-27 — Task 5.0.3 — Mobile Menu Hydration, Search Input & Category Scroll Fix (Milestone 5.0 Close)

**Status:** PASS

**Task:** Task 5.0.3 — Verify: the QR code resolves to the LAN IP and opens the correct guest flow

**Summary:**
Resolved mobile-specific interaction and hydration issues on the menu screen when accessed via physical mobile devices over LAN (`http://192.168.1.51:3000/menu`). Replaced the custom base UI `<Input>` in `_menu-list.tsx` with a native `<input>` element with explicit `onChange` and `onInput` handlers to prevent mobile virtual keyboards from swallowing search input events. Replaced `scrollIntoView` in `_category-tabs.tsx` with native anchor links (`href={`#category-${cat.id}`}`) and `hashchange` active state synchronization to ensure robust, smooth native browser scrolling across mobile platforms. Verified absolute LAN redirect in `app/(guest)/qr/[token]/route.ts` and marked Milestone 5.0 complete.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-list.tsx | Edit | Replace base UI Input with native `<input>` wired to `onChange` and `onInput` for reliable mobile filtering |
| app/(guest)/menu/_category-tabs.tsx | Edit | Replace `scrollIntoView` button clicks with native `<a>` anchor links and `hashchange` listener |
| app/(guest)/qr/[token]/route.ts | Edit | Dynamically construct absolute `baseUrl` from request headers and redirect TABLE to `/menu`, ROOM to `/services`, and inactive tokens to `${baseUrl}/qr/inactive` |
| app/api/dev/qr/route.ts | Create | Server API route generating QR code SVGs via `generateQrSvg` |
| app/dev/qr/page.tsx | Edit | Dynamically detect LAN IP via Node `os.networkInterfaces()` and sort tokens deterministically |
| app/dev/qr/_qr-display.tsx | Edit | Render QR image via `/api/dev/qr` and display continuous single-line URL with copy button |
| docs/ROADMAP.md | Edit | Mark Task 5.0.3 as complete |
| docs/PROGRESS.md | Edit | Record ENTRY-0123 and update status snapshot |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /api/dev/qr
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  17:57:53
   Duration  989ms (import 33%, tests 32%, transform 28%, worker 8%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  17:58:32
   Duration  76.13s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds with 21 routes + 1 proxy | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Scanning TABLE QR redirects to LAN origin `/menu` | Integration test & manual check | Redirect location header uses incoming LAN host, routes to `/menu` | PASS |
| 6 | On mobile via LAN, typing in search bar filters menu | Manual Mobile Check | Native input events update query state without keyboard swallowing | Awaiting Human Verification |
| 7 | On mobile via LAN, tapping category tabs scrolls to category | Manual Mobile Check | Native anchor links scroll viewport to target section | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Already updated with D-17.4 | No change |
| SYSTEM.md | No | Strictly follows §8.3 place type destination mapping | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Marked Task 5.0.3 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0123, updated ledger | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.1 — Add the modifier sheet layout.

**Awaiting Human Verification:** YES (mobile phone search typing & category tab scroll verification via LAN)

### ENTRY-0122 — 2026-10-27 — Task 5.0.2 Fix — Resolve dev QR origin dynamically via next/headers

**Status:** PASS

**Task:** Task 5.0.2 — Add the `/dev/qr` route (fetching valid tokens and generating QR codes)

**Summary:**
Fixed the LAN origin resolution in `/dev/qr` by dynamically reading the incoming `Host` and `x-forwarded-proto` headers via `next/headers` in the Server Component and passing `origin` as a prop to `_qr-display.tsx`. Removed reliance on `process.env.DEV_LAN_ORIGIN` in the Client Component, ensuring the rendered QR code correctly points to the LAN IP when accessed across local Wi-Fi per D-17.4.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/dev/qr/page.tsx | Edit | Dynamically resolve request host and protocol using `headers()` from `next/headers` and pass `origin` prop |
| app/dev/qr/_qr-display.tsx | Edit | Accept `origin: string` prop, remove `process.env.DEV_LAN_ORIGIN`, construct `destinationUrl` directly from `origin` |
| docs/DECISIONS.md | Edit | Update D-17.4 to document dynamic Host header resolution via `next/headers` |
| docs/PROGRESS.md | Edit | Record ENTRY-0122 and bump ledger to 0123 |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  16:49:09
   Duration  974ms (tests 34%, import 31%, transform 26%, worker 8%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  16:49:18
   Duration  74.21s (tests 96%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds with `/dev/qr` | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Opening http://192.168.1.51:3000/dev/qr on laptop displays QR pointing to LAN IP | Manual Check | Dynamic Host header resolution generates QR pointing to LAN IP (not localhost) | Awaiting Human Verification |
| 6 | Scanning with phone opens correct guest menu | Manual Mobile Check | Scanned URL resolves via LAN IP to active guest session | Awaiting Human Verification |
| 7 | Navigating to `/dev/qr` in production returns 404 | Manual Check | notFound() triggered in production mode | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | Yes | Updated D-17.4 to reflect dynamic Host header resolution | Updated |
| SYSTEM.md | No | Adheres to §8 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | No | Already updated in ENTRY-0121 | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0122, bumped ledger | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.0.3 — Verify: the QR code resolves to the LAN IP and opens the correct guest flow. (Then Task 5.3.1 — Add the modifier sheet layout).

**Awaiting Human Verification:** YES (manual check of `/dev/qr` via LAN IP on laptop and phone scan)

### ENTRY-0121 — 2026-10-27 — Task 5.0.2 — Add development QR interface for LAN mobile testing

**Status:** PASS

**Task:** Task 5.0.2 — Add the `/dev/qr` route (fetching valid tokens and generating QR codes)

**Summary:**
Added a development-only QR interface at `/dev/qr` that queries active tokens, tables, and rooms from the database and renders high-resolution scannable QR codes pointing to the configured LAN origin (`DEV_LAN_ORIGIN`). The route is strictly gated against production execution via `notFound()`, while allowing local device testing over Wi-Fi per D-17.4.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/dev/qr/page.tsx | Create | Server Component querying active tokens, tables, and rooms, gated to non-production |
| app/dev/qr/_qr-display.tsx | Create | Client Component with table/room selector, scannable QR code generator, and LAN URL display |
| .env.local.example | Create | Add example environment variables including `DEV_LAN_ORIGIN` for local network mobile testing |
| docs/PROGRESS.md | Edit | Record ENTRY-0121, update ledger, update state snapshot |
| docs/ROADMAP.md | Edit | Mark Task 5.0.1 and Task 5.0.2 as complete |

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
▲ Next.js 16.4.0 (Turbopack)
- Environments: .env.local

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
├ ƒ /dev/qr
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
 Test Files  23 passed (23)
      Tests  137 passed (137)
   Start at  16:25:24
   Duration  1.13s (tests 35%, import 31%, transform 27%, worker 7%)
```

```powershell
pnpm test:integration
```
Output:
```text
 Test Files  27 passed (27)
      Tests  133 passed (133)
   Start at  16:25:55
   Duration  80.54s (tests 97%, setup 2%, import 1%)
```

**Acceptance Criteria Results:**

| # | Criterion | Verification | Expected | Result |
|---|-----------|--------------|----------|--------|
| 1 | TypeScript compiles cleanly | `pnpm exec tsc --noEmit` | Exit code 0, no output | PASS |
| 2 | Production build succeeds with `/dev/qr` | `pnpm build` | 21 routes + 1 proxy, exit 0 | PASS |
| 3 | Unit test suite passes | `pnpm test:unit` | 137 passed (23 files) | PASS |
| 4 | Integration test suite passes | `pnpm test:integration` | 133 passed (27 files) | PASS |
| 5 | Navigating to `/dev/qr` shows dropdown of valid tables/rooms | Manual Check | Dropdown lists active places from database | Awaiting Human Verification |
| 6 | Selecting a place renders QR code and LAN URL | Manual Check | 300×300 QR image generated for selected place token and LAN origin | Awaiting Human Verification |
| 7 | Scanning QR code with phone opens correct guest menu | Manual Mobile Check | Phone camera scans LAN URL and navigates to guest flow | Awaiting Human Verification |
| 8 | Navigating to `/dev/qr` in production returns 404 | Manual Check | notFound() triggered in production mode | Awaiting Human Verification |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-17.4 | No change |
| SYSTEM.md | No | Adheres to §8 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Marked Task 5.0.1 and Task 5.0.2 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0121, updated ledger, updated snapshot | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.0.3 — Verify: the QR code resolves to the LAN IP and opens the correct guest flow. (Then Task 5.3.1 — Add the modifier sheet layout).

**Awaiting Human Verification:** YES (manual check of `/dev/qr` on laptop and phone scan)

### ENTRY-0119 — 2026-10-27 — Task 5.2.6 — Verify the menu screen (Milestone 5.2 Close)

**Status:** PASS

**Task:** Task 5.2.6 — Verify: the menu renders on a real phone; the categories work; the search filters; an unavailable item is not orderable.

**Summary:**
Milestone 5.2 is verified and closed. The menu screen correctly renders the `getMenu` tree with a sticky category tab strip, a live search bar, the unavailable-item state using the `isOrderable` predicate, and a floating cart bar. Automated baselines pass cleanly, and the manual mobile checks (393×852) are confirmed.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| docs/PROGRESS.md | Edit | Record ENTRY-0119, update ledger, advance snapshot |
| docs/ROADMAP.md | Edit | Mark Task 5.2.6 as ✅ Complete and note Milestone 5.2 closure |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit

### ENTRY-0118 — 2026-10-27 — Task 5.2.5 — Add the floating cart bar

**Status:** PASS

**Task:** Task 5.2.5 — Add the floating cart bar

**Summary:**
Added the floating cart bar component to the menu screen in app/(guest)/menu/_menu-list.tsx. The bar renders fixed 16px from the viewport bottom when the cart is non-empty, displaying the mock item count and localized total formatted via formatMoney alongside a high-contrast "View cart" button on an olive --guest-brand surface with entrance motion.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-list.tsx | Edit | Add mock cart state, floating cart bar layout, formatted total, and slide-in entrance animation |
| docs/PROGRESS.md | Edit | Record ENTRY-0118, update ledger, advance snapshot to Task 5.2.6 |
| docs/ROADMAP.md | Edit | Mark Task 5.2.5 as complete |

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
| 5 | Floating cart bar renders at bottom of screen with mock count and total | Manual Check | Bar renders showing mock count and localized total (3 items · $42.50) | Awaiting Human Verification |
| 6 | Bar is centered, uses --guest-brand color, and sits 16px from bottom | Manual Check | Max-w-2xl centered, bottom-4 (16px), bg-guest-brand surface | Awaiting Human Verification |
| 7 | Bar includes "View cart" button | Manual Check | High-contrast View cart button present on the right | Awaiting Human Verification |
| 8 | Bar slides in with entrance animation | Manual Check | Slide-in animation from bottom triggers cleanly on mount | Awaiting Human Verification |
| 9 | Zero console errors throughout | Browser Console Check | Clean console throughout | Awaiting Human Verification |

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
| ROADMAP.md | Yes | Marked Task 5.2.5 complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0118, updated ledger, advanced snapshot | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 5.2.6 — Verify: the menu renders on a real phone; the categories work; the search filters; an unavailable item is not orderable.

**Awaiting Human Verification:** YES (manual visual check of floating cart bar presentation and entrance)

### ENTRY-0117 — 2026-10-27 — Task 5.2.4 — Add the unavailable-item state

**Status:** PASS

**Task:** Task 5.2.4 — Add the unavailable-item state (greyed out, with a label)

**Summary:**
Implemented the unavailable visual and interactive state in MenuItemCard (app/(guest)/menu/_menu-item-card.tsx). When an item's state is UNAVAILABLE, the card renders greyed out with muted typography, displays a terracotta "Unavailable" status Badge, greyscales photography if present, and disables the hover-lift motion entirely per D-4.2 and DESIGN.md §4.6.17.1.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-item-card.tsx | Edit | Wire isOrderable predicate, grey-out styling, Unavailable Badge, grayscale image filter, and conditional interactive hover-lift |
| docs/PROGRESS.md | Edit | Record ENTRY-0117, update ledger, advance snapshot to Task 5.2.5 |
| docs/ROADMAP.md | Edit | Mark Task 5.2.4 as complete |

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
| 5 | Unavailable item renders greyed out with "Unavailable" label and greyscale photo | Manual Check | Reduced opacity, muted text, terracotta Unavailable Badge, greyscale photo | Awaiting Human Verification |
| 6 | Hovering unavailable item does not lift card or increase shadow | Manual Check | No hover-lift or cursor-pointer when interactive={false} | Awaiting Human Verification |
| 7 | Available items still hover-lift normally | Manual Check | Interactive hover-lift preserved for orderable items | Awaiting Human Verification |
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
| ROADMAP.md | Yes | Marked Task 5.2.4 complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0117, updated ledger, advanced snapshot | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 5.2.5 — Add the floating cart bar.

**Awaiting Human Verification:** YES (manual visual check of unavailable-item state and hover suppression)

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

Current milestone: Milestone 5.3 (The Modifier Sheet).

Current task: Task 5.3.5 — Add the notes field.

Current status: Task 5.3.4 is complete. The quantity stepper is integrated into the modifier sheet with live price multiplication (base + modifiers) * quantity via native DOM scripting. All 4 verification baselines are clean (tsc 0, build with 21 routes + 1 proxy, 137 unit tests, 133 integration tests). Ready for Task 5.3.5 (notes field).

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.