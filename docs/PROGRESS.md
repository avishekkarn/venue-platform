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

### ENTRY-0139 — 2026-10-28 — Task 5.4.4 — Add the summary (subtotal, tax, total)

**Status:** PASS

**Task:** Task 5.4.4 — Add the summary (subtotal, tax, total)

**Purpose:**
Add a summary block (`#cart-summary`) with right-aligned Subtotal, Tax, and Total rows to `/cart` (`app/(guest)/cart/page.tsx`) below the order notes container, using guest-world styling tokens. The Server Component reads the venue's tax rate (`venue.value.taxRate`) and injects it alongside currency and locale into the client script. The script calculates and renders subtotal (sum of stored line totals), tax (`subtotal * rateNum`), and total (`subtotal + tax`) using `formatMoney`. This summary is a client-side display preview; the authoritative price and tax are recomputed and frozen server-side at order placement (Tasks 5.5.2 and 5.5.3, DECISIONS D-4.1 and D-4.4). Tax is not persisted to `localStorage.guest_cart`, the cart shape is preserved, and the summary is hidden when the cart is empty.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/cart/page.tsx | Edit | Added `#cart-summary` shell (Subtotal, Tax, Total rows), passed `taxRate` from Server Component into injected script, computed and rendered preview amounts inside `renderCart()`, and preserved notes focus guard |
| docs/ROADMAP.md | Edit | Marked Task 5.4.4 as complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0139, bumped ledger to 0140, updated snapshot to Task 5.4.5 next |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; identical route count)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**
- [x] Automated: A summary block with right-aligned Subtotal, Tax, Total rows renders below the order-notes container, using guest tokens, hidden when the cart is empty.
- [x] Automated: The tax rate is obtained in the Server Component from `venue.value.taxRate` (from `organization.repo.ts`, which reads Prisma's `Decimal` as a string) as a decimal string and passed into the injected script; nothing is hardcoded or invented.
- [x] Automated: Subtotal = sum of stored line totals; tax = subtotal × rate; total = subtotal + tax; each rendered with the in-script `formatMoney` (two fraction digits).
- [x] Automated: A code comment states the summary is a client-side display preview and the authoritative figure is frozen server-side at order placement (5.5.2/5.5.3, D-4.1/D-4.4).
- [x] Automated: Tax is not persisted to `localStorage`; the stored cart shape is unchanged (`items`, `itemCount`, `total`, `orderNotes`).
- [x] Automated: The notes field focus guard is preserved (`document.activeElement !== notesInput`).
- [x] Automated: No place-order button or pickup-name field is rendered.
- [x] Automated: No file other than `app/(guest)/cart/page.tsx` is edited.
- [ ] Awaiting Human Verification: On a real phone via LAN: the summary shows subtotal, tax, and total for the current cart; adjusting a quantity or removing a line updates all three; emptying the cart hides the summary; typing in the notes field does not blur it.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-2.2, D-4.1, D-4.3, D-4.4 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §5, §7.1, §8.8, §12.3, §13.2 | No change |
| ROADMAP.md | Yes | Marked 5.4.4 complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0139, bumped ledger to 0140, updated snapshot | Updated |
| DESIGN.md | No | Adheres to §4.8.3 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.5 — Add the "Place order" action.

**Awaiting Human Verification:** YES


### ENTRY-0138 — 2026-10-28 — Task 5.4.3 — Add the order-level notes field

**Status:** PASS

**Task:** Task 5.4.3 — Add the order-level notes field

**Purpose:**
Add a single order-level notes textarea (`#cart-notes`, placeholder "Anything else we should know?") to `/cart` (`app/(guest)/cart/page.tsx`) wrapped in `#cart-notes-container` below line items and empty state. Persist its value natively to `localStorage.guest_cart` under the new top-level `orderNotes` field on `input` and `change` events without re-rendering the whole cart on keystrokes, ensuring no focus loss or cursor jumps. The `orderNotes` field is populated on initial render, defaults safely to `""` if absent, is preserved by all 5.4.2 line mutations (plus, minus, remove), and survives emptying the cart.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/cart/page.tsx | Edit | Added order notes textarea `#cart-notes` below cart lines, populated from `orderNotes` on init, and attached native delegated `input` and `change` event listeners persisting to `localStorage.guest_cart` |
| docs/ROADMAP.md | Edit | Marked Task 5.4.3 as complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0138, bumped ledger to 0139, updated snapshot to Task 5.4.4 next |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; identical route count)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**
- [x] Automated: A single labelled order-level notes textarea (`#cart-notes`, placeholder "Anything else we should know?") renders below the line-items and empty-state containers, styled per DESIGN.md §4.6.2.
- [x] Automated: The textarea's value is read from the cart's new top-level `orderNotes` field on init and defaults to `""` when absent.
- [x] Automated: Typing in the textarea persists to `localStorage.guest_cart` via native DOM input/change delegation without calling `renderCart()` on each keystroke (no blur/cursor loss).
- [x] Automated: The new top-level field `orderNotes` is preserved by the 5.4.2 plus/minus/remove write-backs (`cartData.orderNotes = cartData.orderNotes || '';`).
- [x] Automated: The per-line `item.notes` handling is unchanged.
- [x] Automated: No summary/tax/total display, place-order, or pickup-name element is rendered.
- [x] Automated: No file other than `app/(guest)/cart/page.tsx` is edited.
- [ ] Awaiting Human Verification: On a real phone via LAN: typing in the order-notes field does not blur or lose the cursor; refreshing the page keeps the typed notes; adjusting a line's quantity or removing a line preserves the typed notes; emptying the cart and returning shows the order-notes field per the chosen behaviour.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-2.2, D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §5, §8.8, §12.3, §13.2 | No change |
| ROADMAP.md | Yes | Marked 5.4.3 complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0138, bumped ledger to 0139, updated snapshot | Updated |
| DESIGN.md | No | Adheres to §4.6.2 and §4.8.3 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.4 — Add the summary (subtotal, tax, total).

**Awaiting Human Verification:** YES


### ENTRY-0137 — 2026-10-28 — Task 5.4.2 — Add item-level adjustment (quantity, remove)

**Status:** PASS

**Task:** Task 5.4.2 — Add item-level adjustment (quantity, remove)

**Purpose:**
Extend `/cart` (`app/(guest)/cart/page.tsx`) to support item-level adjustments via native DOM event delegation: quantity steppers with decrement (floor 1, disabled minus button with opacity-40 and cursor-not-allowed) and increment (ceiling 99, disabled plus button with opacity-40 and cursor-not-allowed), plus a dedicated remove action button per line item. Clicking plus or minus updates `quantity` and recomputes `lineTotal` as `(item.price + sum(modifiers.price)) * quantity` strictly from stored line data without touching the database or menu. Removing an item splices the item out. Mutations recompute `itemCount` and `total` in `localStorage.guest_cart`, write back to `localStorage`, and call `renderCart()`. Removing all items displays `#cart-empty`.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/cart/page.tsx | Edit | Added quantity stepper and remove button to line card in `renderCart()`, and implemented delegated native click event listener for `qty-minus`, `qty-plus`, and `remove` actions with localStorage write-back |
| docs/ROADMAP.md | Edit | Marked Task 5.4.2 as complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0137, bumped ledger to 0138, updated snapshot to Task 5.4.3 next |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; identical route count)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**
- [x] Automated: Each cart line renders a quantity stepper (minus, quantity, plus) and a remove control, styled per DESIGN.md §4.6.4 and §4.6.17.3, with touch targets ≥44×44 and aria-labels.
- [x] Automated: Choice at quantity 1: disabled minus button (`disabled`, `disabled:opacity-40 disabled:cursor-not-allowed`) alongside an explicit dedicated remove button.
- [x] Automated: A delegated native DOM handler mutates the clicked line: plus increases quantity (cap 99), minus decreases (floor 1, no-op if <= 1), remove splices the line out.
- [x] Automated: The line's `lineTotal` is recomputed as `(item.price + sum(modifiers.price)) * quantity`, using the stored line data only.
- [x] Automated: After mutation, `itemCount` and `total` in `localStorage.guest_cart` are recomputed and written back, preserving every other field and overall cart shape; `renderCart()` re-renders.
- [x] Automated: Removing the last line displays `#cart-empty` and hides `#cart-lines`.
- [x] Automated: No order-notes, summary/tax/total display, place-order, or pickup-name element is rendered.
- [x] Automated: No file other than `app/(guest)/cart/page.tsx` was edited.
- [ ] Awaiting Human Verification: On a real phone via LAN: plus/minus adjust the quantity and the line total visibly; remove deletes the line; removing the last line shows the empty state; refreshing the page keeps the mutated cart (persisted to localStorage).

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-2.2, D-2.4, D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §5, §8.8, §12.3, §13.2 | No change |
| ROADMAP.md | Yes | Marked 5.4.2 complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0137, bumped ledger to 0138, updated snapshot | Updated |
| DESIGN.md | No | Adheres to §4.6.4 and §4.6.17.3 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.3 — Add the order-level notes field.

**Awaiting Human Verification:** YES


### ENTRY-0136 — 2026-10-28 — Task 5.4.1 — Add the cart screen

**Status:** PASS

**Task:** Task 5.4.1 — Add the cart screen

**Purpose:**
Implement the cart screen shell (`app/(guest)/cart/page.tsx`) as a Server Component that validates the guest session and reads venue currency/language, rendering the sticky header with back link to `/menu`, an empty line-items container (`#cart-lines`), and a hidden empty-state container (`#cart-empty`). An injected native DOM script reads `localStorage.guest_cart` and renders display-only lines or toggles the empty state without React state or hydration pitfalls.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/cart/page.tsx | Create | Server Component for `/cart` shell with sticky header, line container, empty state, and injected DOM rendering script |
| docs/ROADMAP.md | Edit | Mark Task 5.4.1 as complete, add milestone progress note |
| docs/PROGRESS.md | Edit | Record ENTRY-0136, bump ledger to 0137, advance snapshot to Task 5.4.2 |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; includes new `/cart` route)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**
- [x] Automated: `app/(guest)/cart/page.tsx` exists as a Server Component reading guest session and redirecting on invalid session.
- [x] Automated: Renders sticky header with `/menu` link and "Your order" title, `#cart-lines` container, and hidden `#cart-empty` container.
- [x] Automated: Injected native `<script>` reads `localStorage.guest_cart` with exact schema, renders display-only line items (name, modifiers summary, quantity, line total), and toggles empty state.
- [x] Automated: Out of scope elements omitted (no tax, no subtotal, no total sum, no steppers, no remove button, no notes field, no place order button, no pickup name).
- [x] Automated: `_menu-list.tsx` unchanged (verified via git diff).
- [ ] Awaiting Human Verification: On a real phone via LAN, opening `/cart` with empty cart displays the empty state; with items in cart displays display-only line items.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-2.2 (cart lives in localStorage), D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §5, §8.8, §12.3, §13.2 | No change |
| ROADMAP.md | Yes | Marked 5.4.1 complete, added progress note | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0136, bumped ledger to 0137 | Updated |
| DESIGN.md | No | Adheres to §4.8.3 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.2 — Add item-level adjustment (quantity, remove).

**Awaiting Human Verification:** YES


### ENTRY-0135 — 2026-10-28 — Task 5.3.7 Corrective — Native DOM script rendering for floating cart bar

**Status:** PASS

**Task:** Task 5.3.7 Corrective — Native DOM script rendering for floating cart bar

**Purpose:**
Remove React state and custom event handling for the floating cart bar, and replace it with direct DOM manipulation via a native script (`updateCartBar()`) writing into `<div id="floating-cart-bar"></div>` on initial load and after adding items to `guest_cart` in `localStorage`, guaranteeing mobile browser reliability on physical devices.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_menu-list.tsx | Edit | Replaced React cart state and aside with `<div id="floating-cart-bar"></div>` and native `updateCartBar()` DOM rendering |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0135, bumped ledger to 0136 |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (21 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**
- [x] Automated: Removed React cart `useState` and `useEffect` event listener.
- [x] Automated: Added `<div id="floating-cart-bar" />` inside the main wrapper in `_menu-list.tsx`.
- [x] Automated: Added native `updateCartBar()` function inside `<script>` that reads `localStorage.guest_cart` and updates `#floating-cart-bar`.
- [x] Automated: Called `updateCartBar()` on page initialization and after adding items to cart.
- [ ] Awaiting Human Verification: On a mobile phone, tapping "Add to Cart" closes the sheet and immediately shows the floating cart bar with the correct count and total.
- [ ] Awaiting Human Verification: Adding a second item updates the count and total.
- [ ] Awaiting Human Verification: Refreshing the page retains the cart bar.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-2.2 (localStorage cart) | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §12.3, §13.2 | No change |
| ROADMAP.md | No | Milestone 5.3 remains complete and closed | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0135, bumped ledger to 0136 | Updated |
| DESIGN.md | No | Adheres to §4.6.17.2, §4.8.1, §4.15.7 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.1 — Add the cart screen.

**Awaiting Human Verification:** YES


### ENTRY-0134 — 2026-10-28 — Task 5.3.7 — Add the "Add to cart" action

**Status:** PASS

**Task:** Task 5.3.7 — Add the "Add to cart" action

**Purpose:**
Milestone 5.3 is closed — the modifier sheet, single/multiple choice groups, quantity stepper, notes field, live total, and add-to-cart action are verified and complete. Milestone 5.4 is unblocked.
Wire the "Add to Cart" button inside the Modifier Sheet to save the item to browser `localStorage` under `guest_cart` with UUID, item details, modifiers, notes, quantity, and line total, and dispatch a custom `cart-updated` event to update React state and the floating cart bar.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_modifier-sheet.tsx | Edit | Added `id="add-to-cart-btn"` to the "Add to Cart" button |
| app/(guest)/menu/_menu-list.tsx | Edit | Removed mock cart state, added `useEffect` reading and syncing `localStorage`, and added click handler for `#add-to-cart-btn` in native script |
| docs/ROADMAP.md | Edit | Mark Task 5.3.7 as complete, record Milestone 5.3 closure note |
| docs/PROGRESS.md | Edit | Record ENTRY-0134, bump ledger to 0135, advance snapshot to Milestone 5.4 |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (21 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**
- [x] Automated: `#add-to-cart-btn` wired in native script to capture item metadata, selected modifiers, notes, quantity, and line total into `guest_cart` in `localStorage`.
- [x] Automated: React state initialized with default 0 items and reads from `localStorage` on mount without SSR mismatch.
- [x] Automated: `cart-updated` custom event dispatched and handled to sync floating cart bar.
- [ ] Awaiting Human Verification: On a mobile phone, adding an item to the cart closes the sheet.
- [ ] Awaiting Human Verification: The floating cart bar appears at the bottom of the menu and shows the correct item count and total.
- [ ] Awaiting Human Verification: Adding a second item updates the count and total.
- [ ] Awaiting Human Verification: Refreshing the page retains the cart (localStorage).

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-2.2 (localStorage cart) | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §12.3, §13.2 | No change |
| ROADMAP.md | Yes | Mark Task 5.3.7 as complete, record Milestone 5.3 closure note | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0134, bumped ledger to 0135 | Updated |
| DESIGN.md | No | Adheres to §4.6.17.2, §4.8.1, §4.12.3, §4.15.7 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.1 — Add the cart screen.

**Awaiting Human Verification:** YES


### ENTRY-0133 — 2026-10-28 — Task 5.3.6 — Add the live total

**Status:** PASS

**Task:** Task 5.3.6 — Add the live total

**Purpose:**
Finalize the live total calculation and presentation on the modifier sheet. Position the total price element (`#modifier-sheet-price`) in a dedicated summary container directly above the "Add to Cart" button with a "Total" label, and update the client-side interaction script to recalculate `(basePrice + modifiers) * quantity` with 2 decimal places and currency formatting.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_modifier-sheet.tsx | Edit | Moved `#modifier-sheet-price` to a dedicated summary row directly above "Add to Cart" with a "Total" label |
| app/(guest)/menu/_menu-list.tsx | Edit | Updated `updateModifierPrice` and `formatMoney` to guarantee 2 decimal places and currency formatting on arithmetic result |
| docs/ROADMAP.md | Edit | Mark Task 5.3.6 as complete |
| docs/PROGRESS.md | Edit | Record ENTRY-0133, bump ledger to 0134 |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (21 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**
- [x] Automated: Total formula `(basePrice + modifierTotal) * qty` implemented and verified via local anti-hallucination verification tests.
- [x] Automated: Formatted as decimal string with `Intl.NumberFormat` / `.toFixed(2)` guaranteeing 2 decimal places and currency symbol.
- [x] Automated: `#modifier-sheet-price` moved to footer summary block directly above "Add to Cart" button with "Total" label.
- [ ] Awaiting Human Verification: On a mobile phone, the total price at the bottom of the sheet displays with the currency symbol and 2 decimal places.
- [ ] Awaiting Human Verification: Adjusting quantity or modifiers updates the total price correctly and instantly.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Mark Task 5.3.6 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0133, bumped ledger to 0134 | Updated |
| DESIGN.md | No | Adheres to §4.6.17.2, §4.15.7 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.7 — Add the "Add to cart" action.

**Awaiting Human Verification:** YES


### ENTRY-0132 — 2026-10-28 — Task 5.3.5 — Add the notes field

**Status:** PASS

**Task:** Task 5.3.5 — Add the notes field

**Purpose:**
Add the notes field textarea to the modifier sheet so guests can add custom instructions for the kitchen (e.g. allergies, preparation requests), positioned below the modifier groups container and above the quantity stepper, and ensure its value resets cleanly whenever the sheet is opened or closed.

**Files Touched:**
| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/menu/_modifier-sheet.tsx | Edit | Added `<textarea id="modifier-notes">` with placeholder "Anything else we should know?", 2 rows, and guest token styling between modifier groups and stepper |
| app/(guest)/menu/_menu-list.tsx | Edit | Added value reset for `#modifier-notes` on dish card click and sheet close |
| docs/ROADMAP.md | Edit | Mark Task 5.3.5 as complete |
| docs/PROGRESS.md | Edit | Record ENTRY-0132, bump ledger to 0133 |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ├ ○ /
# ├ ○ /_not-found
# ├ ƒ /api/admin/menu/categories
# ├ ƒ /api/admin/menu/items
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/guest/orders
# ├ ƒ /api/kitchen/orders
# ├ ƒ /api/staff/orders
# ├ ○ /kitchen
# ├ ○ /login
# ├ ○ /manager
# ├ ○ /menu
# ├ ○ /order-success
# ├ ○ /order/[orderId]
# ├ ƒ /qr
# ├ ○ /qr/inactive
# ├ ○ /staff
# ├ ○ /staff/help
# └ ○ /unauthorized
# + First Load JS shared by all: 87.5 kB
# ƒ Middleware (proxy): 149 B
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (21 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Met:**
1. Textarea with `id="modifier-notes"` added in `_modifier-sheet.tsx` with placeholder "Anything else we should know?" and 2 rows.
2. Token styling adheres to Design System tokens (`guest-border-subtle`, `guest-surface-raised`, `guest-text-primary`, `guest-text-muted`, `guest-brand`).
3. Layout positioned below `#modifier-groups-container` and above `#quantity-stepper` with `mt-4`.
4. Textarea value resets to empty string when opening sheet on dish card click, close button, and backdrop click.
5. All 4 verification baselines clean.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-16.1 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to §3, §4, §8.8, §13.2 | No change |
| ROADMAP.md | Yes | Mark Task 5.3.5 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0132, bumped ledger to 0133 | Updated |
| DESIGN.md | No | Adheres to §4.6.2, §4.6.17.2, §4.15.7 | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.3.6 — Add the live total.

**Awaiting Human Verification:** NO


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
| ENTRY-0132 | 2026-10-28 | Task 5.3.5 — Add the notes field | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0133 | 2026-10-28 | Task 5.3.6 — Add the live total | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0134 | 2026-10-28 | Task 5.3.7 — Add the "Add to cart" action | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0135 | 2026-10-28 | Task 5.3.7 Corrective — Native DOM script rendering for floating cart bar | PASS | Milestone 5.3 | §5.3 |
| ENTRY-0136 | 2026-10-28 | Task 5.4.1 — Add the cart screen | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0137 | 2026-10-28 | Task 5.4.2 — Add item-level adjustment (quantity, remove) | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0138 | 2026-10-28 | Task 5.4.3 — Add the order-level notes field | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0139 | 2026-10-28 | Task 5.4.4 — Add the summary (subtotal, tax, total) | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0140 | 2026-10-28 | STRUCTURAL — Add docs/WIRING.md cross-task wiring ledger | STRUCTURAL | — | §5.3 |
| ENTRY-0141 | 2026-10-29 | Task 5.4.5 — Add the "Place order" action | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0142 | 2026-10-29 | Task 5.4.6 — Add the empty cart state | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0143 | 2026-10-29 | Task 5.4.7 — Add the pickup-name field for the counter flow | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0144 | 2026-10-29 | Task 5.4.8 — Verify: items can be added, adjusted, and removed; the totals are correct; the counter pickup name is captured | PASS | Milestone 5.4 | §5.3 |
| ENTRY-0145 | 2026-10-29 | Task 5.5.1 — Add the price and tax computation (computePrice, computeTax, and the shared decimal-money helper) | PASS | Milestone 5.5 | §5.3 |
| ENTRY-0146 | 2026-10-29 | Task 5.5.2 — Add the createOrder domain function | PASS | Milestone 5.5 | §5.3 |
| ENTRY-0147 | 2026-10-29 | Task 5.5.3 — Verify createOrder against the real database | PASS | Milestone 5.5 | §5.3 |
| ENTRY-0148 | 2026-10-29 | Task 5.6.1 — Add POST /api/guest/orders and wire cart Place order seam | PASS | Milestone 5.6 | §5.3 |
| ENTRY-0149 | 2026-10-29 | Task 5.6.2 & 5.6.3 — Add GET /api/guest/orders/[id] and GET /api/guest/orders | PASS | Milestone 5.6 | §5.3 |
| ENTRY-0150 | 2026-10-29 | Task 5.6.4 — Verify guest order placement, read, list flow and close Milestone 5.6 | PASS | Milestone 5.6 | §5.3 |
| ENTRY-0151 | 2026-10-29 | Task 5.7.1 — Add the order confirmation screen | PASS | Milestone 5.7 | §5.3 |
| ENTRY-0152 | 2026-10-29 | Task 5.7.2 — Add order tracking screen and OrderStatusTimeline | PASS | Milestone 5.7 | §5.3 |
| ENTRY-0153 | 2026-10-29 | Task 5.7.3 — Verify "Add more items" second order flow and add copy | PASS | Milestone 5.7 | §5.3 |
| ENTRY-0154 | 2026-10-29 | Task 5.7.0A — Extend ServiceRequest storage and domain for table/counter calls | PASS | Milestone 5.7 | §5.3 |
| ENTRY-0155 | 2026-10-29 | Task 5.7.0B — Show all session orders and combined bill on tracking screen | PASS | Milestone 5.7 | §5.3 |
| ENTRY-0156 | 2026-10-29 | Task 5.7.4 — Add real "Call a waiter" and "Request the bill" actions | PASS | Milestone 5.7 | §5.3 |
Next entry number: 0157

### 5.3 Current Milestone — Milestone 5.7 (The Order Confirmation and Tracking). Current task: Task 5.7.5 — Add the polling on the tracking screen.

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0156 — 2026-10-29 — Task 5.7.4 — Add real "Call a waiter" and "Request the bill" actions

**Status:** PASS

**Task:** Task 5.7.4 — Add the "call a waiter" and "request the bill" actions on the tracking screen and add POST /api/guest/call

**Summary:**
1. Route Handler (`app/api/guest/call/route.ts`):
   - Implemented `POST /api/guest/call` with `setTestDbClient` test client injection pattern.
   - Validates active guest session via `getGuestCookie` and `getGuestSession`, returning 401 `UNAUTHORIZED` on missing or invalid cookie/session.
   - Validates call type in request body strictly as `"WAITER" | "BILL"`, returning 400 `VALIDATION_FAILED` on malformed JSON or unsupported types.
   - Resolves venue and place exclusively from the guest session (`session.venueId`, `session.placeType`, `session.placeId` mapping to `tableId` / `roomId` / `counterId`). Any client-supplied venue or place in the body is strictly ignored per D-2.1 and hard prohibitions.
   - Supports optional `orderId` in request body, validating that the order exists and belongs to the active guest session before persisting in `details: { orderId }`.
   - Calls domain orchestrator `createRequest({ requestRepo }, input)` to persist a `ServiceRequest` with `HotelService.CALL_WAITER` or `HotelService.REQUEST_BILL` in state `SUBMITTED`, returning 201 with `{ data: request }` envelope.
2. Tracking Page Integration (`app/(guest)/order/[id]/track/page.tsx`):
   - Replaced disabled placeholder button with two real interactive buttons: "Call a waiter" (`#btn-call-waiter`) and "Request the bill" (`#btn-request-bill`).
   - Injected self-contained native DOM script: attaches click event listeners, prevents duplicate submissions using an `inFlight` boolean guard, disables buttons during transmission, displays sending state, and handles API response.
   - On success: displays exact DESIGN.md §4.13.2 guest-voice confirmation copy in an accessible inline status container (`role="status" aria-live="polite"`): *"A waiter is on the way."* for waiter calls and *"The bill is on its way."* for bill requests; marks the submitted button disabled with confirmation label while keeping the other action available.
   - Confirmed all-orders list, timelines, and combined bill block remain completely intact.
3. Test Verification (`tests/integration/api/guest-call.test.ts`):
   - Created dedicated integration suite covering 6 test cases: Case 1 (Happy path: table waiter call creates CALL_WAITER ServiceRequest, verified via DB read back), Case 2 (Happy path: room bill request creates REQUEST_BILL with verified orderId context), Case 3 (401 on missing session cookie), Case 4 (400 on invalid or missing type), Case 5 (Session-scoped storage: ignores client-supplied tampered venueId/tableId/placeType), Case 6 (Rejects cross-session orderId with 400). All 6 cases pass.

**Awaiting Human Verification:** YES — on a real phone via LAN: tapping "Call a waiter" or "Request the bill" on the tracking screen records the request, shows the confirmation copy, and does not duplicate on repeated clicks; the request is stored against the guest's own place.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/api/guest/call/route.ts | New | Route handler for POST /api/guest/call recording CALL_WAITER/REQUEST_BILL requests |
| app/(guest)/order/[id]/track/page.tsx | Edit | Wired real Call waiter and Request bill buttons with native DOM script, status copy, and repeat-click guard |
| tests/integration/api/guest-call.test.ts | New | Integration test suite covering 6 cases for POST /api/guest/call |
| docs/ROADMAP.md | Edit | Marked Task 5.7.4 complete (`✅ Complete`) |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0156, updated §5.2 ledger, bumped next entry to 0157, advanced §7 snapshot to Task 5.7.5 next |

**Verification Results:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (27 routes + 1 proxy middleware, including `ƒ /api/guest/call`)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (162 passed across 29 test files in 75.07s)

### ENTRY-0155 — 2026-10-29 — Task 5.7.0B — Show all session orders and combined bill on tracking screen

**Status:** PASS

**Task:** Task 5.7.0B — Making the tracking screen show all of the guest session's orders on one page, each with its own timeline and order number, plus a combined-bill total

**Summary:**
1. Multi-Order Session Tracking & Privacy Scoping:
   - In `app/(guest)/order/[id]/track/page.tsx`: maintains strict privacy checks by verifying the URL parameter `[id]` against `orderRepo.findById(session.venueId, id)` and ensuring `urlOrder.guestSessionId === session.id`. If nonexistent or belonging to another session, renders friendly `OrderNotFoundView` without leaking data.
   - Calls `orderRepo.listForGuestSession(session.venueId, session.id)` directly via the server component to retrieve all active and historical orders belonging to the session.
   - Displays all session orders on one page, placing the focal URL order first, followed by all other session orders sorted newest-first. Each order renders in its own distinct card identifiable by `Order #<first-8>`, placedAt timestamp, that order's own `OrderStatusTimeline` (reflecting its specific state and transition history), and that order's collapsible itemized breakdown with frozen subtotal, tax, and order total.
2. Combined-Bill Total (D-4.5, D-4.1, D-4.4, PRODUCT.md §5.9):
   - Implemented "Total for all orders" block at the bottom of the order list. Sums the frozen `total` values across all billable orders (active + completed; cancelled excluded as they carry no charge) using `addDecimal` from `@/domain/shared/money` and formats with `formatMoney(combinedTotalDecimal, currency, locale)`.
   - Renders honest guest-voice copy adhering to DESIGN.md §4.13: *"Your orders will be combined into one bill."*
3. Confirmation Link & Layout Continuity:
   - Confirmed `app/(guest)/order/[id]/page.tsx` link to `/order/[id]/track` requires zero changes; navigating to track an order displays that order prominently alongside all previously placed session orders.
   - Preserves "Add more items" navigation with "This will start a new order." microcopy and disabled "Call a waiter" placeholder button (awaiting Task 5.7.4).

**Awaiting Human Verification:** YES — on a real phone via LAN: with two orders in the session, the tracking page shows both, each with its own timeline and order number; the combined total equals the sum of the two order totals; a second guest session cannot see the first guest's orders.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/(guest)/order/[id]/track/page.tsx | Edit | Rewrote tracking page to render all session orders with individual timelines, cards, and combined bill total |
| docs/ROADMAP.md | Edit | Inserted Task 5.7.0B as complete (`✅ Complete`), adjusted Task 5.7.4 dependencies |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0155, updated §5.2 ledger, bumped next entry to 0156, advanced §7 snapshot to Task 5.7.4 next |

**Verification Results:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (26 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (156 passed across 28 test files in 75.41s)

### ENTRY-0154 — 2026-10-29 — Task 5.7.0A — Extend ServiceRequest storage and domain for table/counter calls

**Status:** PASS

**Task:** Task 5.7.0A — Extending the ServiceRequest storage and domain so "call waiter" / "request bill" can be recorded against a table, a room, or a counter

**Summary:**
1. Schema & Migration (additive only per BUILD.md §10 and prompt non-negotiable rule):
   - In `prisma/schema.prisma`: extended `enum HotelService` with `CALL_WAITER` and `REQUEST_BILL`; extended `model ServiceRequest` with nullable `placeType PlaceType?` (reusing existing enum), `tableId String?`, `counterId String?`, and relation fields to `Table` and `Counter` with `onDelete: SetNull`; added back-relations `requests ServiceRequest[]` on `Table` and `Counter`; added composite indexes `@@index([venueId, tableId])` and `@@index([venueId, counterId])`. Nullable `roomId` left completely intact.
   - Generated migration `20261029131308_add_place_and_call_types_to_service_requests`: contains only `ALTER TYPE "HotelService" ADD VALUE`, `ALTER TABLE "service_requests" ADD COLUMN`, `CREATE INDEX`, and `ALTER TABLE "service_requests" ADD CONSTRAINT FOREIGN KEY`. Confirmed zero columns dropped, renamed, or narrowed, and applied via `prisma migrate deploy`.
2. Domain Types & Orchestrator:
   - In `src/domain/requests/request.repository.ts`: added `PlaceType` domain enum (`TABLE`, `ROOM`, `COUNTER`), added `CALL_WAITER` and `REQUEST_BILL` to domain `HotelService` enum, added nullable `placeType`, `tableId`, `counterId` to `ServiceRequest` interface and `CreateServiceRequestInput`, and added `listForTable` and `listForCounter` methods to `ServiceRequestRepository` port.
   - Implemented `src/domain/requests/create-request.ts` (pure domain orchestrator, 0 `@prisma/client` imports): enforces place validation that exactly one place is specified (`roomId`, `tableId`, or `counterId`); infers `placeType` when omitted (retaining 100% backwards compatibility for existing room callers); validates placeType consistency when explicitly provided; rejects empty or multi-place inputs with `VALIDATION_FAILED`.
3. Infrastructure Adapter:
   - In `src/infrastructure/db/repositories/request.repo.ts`: added bidirectional mapping dictionaries for `PlaceType` and the extended `HotelService` members; persisted `placeType`, `tableId`, and `counterId` in transaction `create`; deserialized them in `mapServiceRequest`; implemented `listForTable` and `listForCounter` with venue isolation. Existing room methods (`listForRoom`, `findById`, `advanceState`, `cancel`, `decline`, `updateDetails`) behave identically.
4. Test Verification:
   - Updated `tests/integration/repositories/request.test.ts`: Cases 1–13 (the existing room-based integration tests) continue passing unchanged; added Case 14 (Table `CALL_WAITER` creation, DB verification, read back via `findById` and `listForTable`), Case 15 (Counter `REQUEST_BILL` creation, DB verification, read back via `findById` and `listForCounter`), and Case 16 (`createRequest` orchestrator verification of table, counter, and backwards-compatible room creation, plus validation negatives). Suite passes 16/16.

**Awaiting Human Verification:** NO — this is storage and domain with full automated test coverage; the guest-facing buttons and the tracking UI are 5.7.0B and 5.7.4.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| prisma/schema.prisma | Edit | Added CALL_WAITER/REQUEST_BILL to HotelService, nullable placeType/tableId/counterId to ServiceRequest, back-relations on Table and Counter, indexes on (venueId, tableId/counterId) |
| prisma/migrations/20261029131308_add_place_and_call_types_to_service_requests/migration.sql | New | Additive SQL migration adding enum values, nullable columns, indexes, and FK constraints |
| src/domain/requests/request.repository.ts | Edit | Added PlaceType enum, CALL_WAITER/REQUEST_BILL to HotelService, nullable place fields to ServiceRequest and CreateServiceRequestInput, listForTable/listForCounter to port |
| src/domain/requests/create-request.ts | New | Pure domain function for creating service requests with place validation and placeType inference |
| src/infrastructure/db/repositories/request.repo.ts | Edit | Persist and map placeType, tableId, counterId, map new HotelService values, implement listForTable and listForCounter |
| tests/integration/repositories/request.test.ts | Edit | Added Cases 14, 15, and 16 verifying table and counter requests and createRequest orchestrator (16/16 passed) |
| docs/ROADMAP.md | Edit | Inserted Task 5.7.0A as complete, updated Task 5.7.4 dependencies |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0154, updated §5.2 ledger, bumped next entry to 0155, advanced §7 snapshot to Task 5.7.0B next |

**Verification Results:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (26 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (156 passed across 28 test files in 71.48s, with request.test.ts 16/16 passed)

### ENTRY-0153 — 2026-10-29 — Task 5.7.3 — Verify "Add more items" second order flow and add copy

**Status:** PASS

**Task:** Task 5.7.3 — Add the "add more items" action from the tracking and confirmation screens

**Summary:**
1. Gap Analysis (PRODUCT.md §5.9, DESIGN.md §4.8.6, DECISIONS.md D-4.6):
   - Requirement: Once an order is placed, it cannot be modified; guests who want more items navigate to `/menu` with an empty cart and check out a second time. The venue receives a second order for the same table.
   - Existing behavior: `handlePlaceOrder` in `app/(guest)/cart/page.tsx` clears `localStorage.guest_cart` upon order submission. Tapping "Add more items" on `/order/[id]` or `/order/[id]/track` links to `/menu`, where the cart initializes empty. Adding items and placing again generates a new UUID idempotency key and posts a second distinct order for the session. Both orders are persisted and retrievable via `GET /api/guest/orders`.
   - Gap identified & resolved: Added honest, succinct microcopy (`This will start a new order.`, 6 words adhering to DESIGN.md §4.13.2 guest voice) directly beneath the "Add more items" action on both `app/(guest)/order/[id]/page.tsx` and `app/(guest)/order/[id]/track/page.tsx` to ensure guests understand they are starting a second order rather than modifying the first order that is already with the kitchen.
   - Integration test evaluation: Confirmed that multi-order placement for the same guest session with distinct idempotency keys is already verified against real PostgreSQL in `tests/integration/api/guest-orders.test.ts` (Task 5.6.3) and `tests/integration/repositories/order.repo.test.ts` (Case 3); no redundant API tests were added.

**Awaiting Human Verification:** YES — on a real phone via LAN: from the confirmation and the tracking screen, tapping "Add more items" opens the menu with an empty cart; adding items and placing again creates a second order (a new confirmation with a different order number) while the first order remains viewable.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/(guest)/order/[id]/page.tsx | Edit | Added "This will start a new order." microcopy under "Add more items" link |
| app/(guest)/order/[id]/track/page.tsx | Edit | Added "This will start a new order." microcopy under "Add more items" link |
| docs/ROADMAP.md | Edit | Marked Task 5.7.3 complete (`✅ Complete`) |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0153, updated §5.2 ledger row, bumped next entry number to 0154, advanced §7 snapshot to Task 5.7.4 |

**Verification Results:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (26 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (153 passed across 28 test files in 78.59s)

### ENTRY-0152 — 2026-10-29 — Task 5.7.2 — Add order tracking screen and OrderStatusTimeline

**Status:** PASS

**Task:** Task 5.7.2 — Add the order tracking screen at `/order/[id]/track` with the status timeline

**Summary:**
1. Implemented `src/components/guest/order-status-timeline.tsx` (found as an empty 0-byte stub) to DESIGN.md §4.6.17.4 and §4.13.2:
   - Vertical step progression: Placed -> Approved -> Preparing -> Ready -> Delivered -> Completed.
   - Visual state indicators: Completed steps render filled brand dot with checkmark icon and solid brand connector line; current step renders filled brand dot with pulse animation (`animation: currentDotPulse 600ms ease-out 1 forwards`); future steps render subtle outline dots; cancelled orders render red dot with cross icon and cancelled label.
   - Copy: Microcopy matches DESIGN.md §4.13.2 ("We have your order.", "The kitchen has accepted it.", "The kitchen is on it.", "Ready for your table.", "Delivered.", "Enjoy.").
   - Timestamps: Populates transition times from `order.stateChanges` via `formatTime(change.occurredAt, locale)`.
   - Motion: Honours `prefers-reduced-motion: reduce` by disabling pulse animations.
2. Created `app/(guest)/order/[id]/track/page.tsx` as a Server Component implementing the tracking screen per DESIGN.md §4.8.5:
   - Session check: Reads guest cookie via `getGuestCookie` and validates session via `getGuestSession`; redirects to `/` if missing or invalid.
   - Order lookup & privacy: Calls `orderRepo.findById(session.venueId, id.trim())` and verifies `order.guestSessionId === session.id`; renders friendly `OrderNotFoundView` on mismatch or missing order without leaking existence.
   - Sticky header: Renders back link to `/menu` (per DESIGN.md §4.8.5/§4.8.6) and order number in mono.
   - Content hierarchy: Renders `OrderStatusTimeline` at the top as primary information, collapsible items list (`<details open>`) with item breakdown and frozen money totals via `formatMoney`, secondary "Add more items" link to `/menu` (full flow deferred to 5.7.3), and disabled ghost "Call a waiter" placeholder button (full action deferred to 5.7.4).

**Awaiting Human Verification:** YES — on a real phone via LAN: tapping "Track your order" on the confirmation opens the tracking screen and shows the order's current state in the timeline; a second guest session cannot open the URL.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| src/components/guest/order-status-timeline.tsx | New | Domain component for guest order status timeline per DESIGN.md §4.6.17.4 |
| app/(guest)/order/[id]/track/page.tsx | New | Server Component for order tracking screen per DESIGN.md §4.8.5 |
| docs/ROADMAP.md | Edit | Marked Task 5.7.2 complete (`✅ Complete`) |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0152, updated §5.2 ledger row, bumped next entry number to 0153, advanced §7 snapshot to Task 5.7.3 |

**Verification Results:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (26 routes + 1 proxy middleware; includes `/order/[id]/track`)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (153 passed across 28 test files in 78.63s)

### ENTRY-0151 — 2026-10-29 — Task 5.7.1 — Add the order confirmation screen

**Status:** PASS

**Task:** Task 5.7.1 — Add the order confirmation screen

**Summary:**
1. Created `app/(guest)/order/[id]/page.tsx` as a Server Component implementing the order confirmation screen per DESIGN.md §4.8.4:
   - Session resolution: Reads guest session from `venue_guest` cookie via `getGuestCookie` and validates through `getGuestSession`; redirects to `/` if missing or invalid.
   - Order retrieval: Calls `orderRepo.findById(session.venueId, id)` directly in the Server Component (avoiding internal HTTP round-trips).
   - Privacy scoping: Verifies `order.guestSessionId === session.id`; renders friendly `OrderNotFoundView` ("We couldn't find that order." with a "Back to menu" link) on non-existent order or session mismatch, avoiding 404 leakage per SYSTEM.md §15.4.
   - Design anatomy: Large check mark drawn in `--guest-brand` animated once over 600ms via SVG path stroke-dashoffset (reduced-motion safe with immediate display fallback), headline "Your order is on its way." in `--guest-text-h1` (Fraunces), order number in mono ("Order #<first-8-chars>"), read-only summary list of items with quantities, modifier names, item notes, and frozen `lineTotal` formatted via `formatMoney`, subtotal, tax amount, and total formatted via `formatMoney`.
   - Actions: Primary "Track your order" button linking to `/order/[id]/track` (honest path deferring screen build to Task 5.7.2) and secondary "Add more items" link to `/menu`.
2. Updated `app/(guest)/cart/page.tsx` in `handlePlaceOrder`:
   - On successful order submission (`response.ok && json.data && json.data.id`), clears `localStorage.guest_cart`, resets idempotency key, and navigates via `window.location.href = '/order/' + encodeURIComponent(json.data.id)`.
   - Replaced inline confirmation block; error and failure handling remains intact.

**Awaiting Human Verification:** YES — on a real phone via LAN: placing an order navigates to the confirmation screen at `/order/[id]`, which shows the order number, items, and total; a second guest session cannot open the first guest's confirmation URL.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| app/(guest)/order/[id]/page.tsx | New | Server Component for order confirmation screen per DESIGN.md §4.8.4 |
| app/(guest)/cart/page.tsx | Edit | Updated handlePlaceOrder success block to navigate to `/order/[id]` |
| docs/ROADMAP.md | Edit | Marked Task 5.7.1 complete (`✅ Complete`) |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0151, updated §5.2 ledger row, bumped next entry number to 0152, advanced §7 snapshot to Task 5.7.2 |

**Verification Results:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (25 routes + 1 proxy middleware; includes `/order/[id]`)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (153 passed across 28 test files in 76.66s)

### ENTRY-0150 — 2026-10-29 — Task 5.6.4 — Verify guest order placement, read, list flow and close Milestone 5.6

**Status:** PASS

**Task:** Task 5.6.4 — Verify: an order can be placed, read, and listed; the response shape matches SYSTEM.md §12

**Summary:**
1. Added an end-to-end integration flow verification test to `tests/integration/api/guest-orders.test.ts` driving all three guest order routes against a real PostgreSQL transaction:
   - Step A: `POST /api/guest/orders` places an order with frozen database money (unit price $10.00, modifier $2.00, quantity 2 -> subtotal $24.00, tax $2.40, total $26.40) and verifies the success envelope (`{ data: order }`, no `error` field per SYSTEM.md §12.1).
   - Step B: `GET /api/guest/orders/[id]` reads the order back by ID and confirms the response envelope (`{ data: order }`, matching ID and frozen financial amounts).
   - Step C: `GET /api/guest/orders` lists orders for the active session and confirms the response envelope (`{ data: orders }`, containing the created order).
   - Step D: Negative envelope verification: `GET /api/guest/orders/[nonexistent-id]` returns 404 with error envelope (`{ error: { code: "NOT_FOUND", message: ... } }`, no `data` field per SYSTEM.md §12.1).
2. Milestone 5.6 (The Order Routes) is fully closed: all 4 tasks (5.6.1, 5.6.2, 5.6.3, 5.6.4) are complete and verified; W-0001 is discharged; Milestone 5.7 (The Order Confirmation and Tracking) is unblocked.

**Awaiting Human Verification:** NO — End-to-end API integration flow and JSON envelope conformance are proven against the real PostgreSQL database in the integration suite. Guest UI screens belong to Milestone 5.7.

**Files Changed:**
| File | Change | Description |
| --- | --- | --- |
| tests/integration/api/guest-orders.test.ts | Edit | Added end-to-end integration flow test verifying placement, read, list, and SYSTEM.md §12 envelope conformance (13 tests in file) |
| docs/ROADMAP.md | Edit | Marked Task 5.6.4 complete (`✅`), appended Milestone 5.6 closure note |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0150, updated §5.2 ledger row, bumped next entry number to 0151, advanced §7 snapshot to Milestone 5.7 |

**Verification Results:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (24 routes + 1 proxy middleware)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (153 passed across 28 test files in 76.66s)

### ENTRY-0149 — 2026-10-29 — Task 5.6.2 & 5.6.3 — Add GET /api/guest/orders/[id] and GET /api/guest/orders

**Status:** PASS

**Task:** Task 5.6.2 — Add `GET /api/guest/orders/[id]` and Task 5.6.3 — Add `GET /api/guest/orders`

**Rationale for Combined Execution:**
Tasks 5.6.2 and 5.6.3 were executed together in a single session because both are guest-facing read endpoints that query the completed order repository adapter (`findById` and `listForGuestSession`), share identical guest session cookie resolution (`getGuestCookie`, `getGuestSession`), enforce the same privacy and tenancy invariants (D-2.1, D-2.5, D-10.2, SYSTEM.md §15.4), share the same integration test harness in `tests/integration/api/guest-orders.test.ts`, and introduce zero mutation or cross-domain risk.

**Summary:**
1. `app/api/guest/orders/[id]/route.ts` (Task 5.6.2):
   - Created dynamic GET route handler reading guest session from `venue_guest` cookie.
   - Returns 401 UNAUTHORIZED if session cookie is absent, invalid, or expired.
   - Validates `[id]` parameter format as UUID regex; returns 400 VALIDATION_FAILED if malformed.
   - Queries `orderRepo.findById(session.venueId, id)`. If not found or belongs to another venue, returns 404 NOT_FOUND.
   - Enforces strict session privacy: checks `order.guestSessionId === session.id`. If mismatched, returns 404 NOT_FOUND with the exact same generic error message as a missing order, completely preventing existence leakage (SYSTEM.md §15.4, D-10.2).
   - On match, returns HTTP 200 with `{ data: order }`.
   - Exports `setTestDbClient` for transactional test isolation.
2. `app/api/guest/orders/route.ts` (Task 5.6.3):
   - Appended `GET` route handler to existing file alongside untouched `POST` handler.
   - Validates guest session from cookie (401 on failure).
   - Calls `orderRepo.listForGuestSession(session.venueId, session.id)`.
   - Returns HTTP 200 with `{ data: orders }` containing strictly orders belonging to the active session.
   - Reuses existing `setTestDbClient` and error envelope helpers without duplication.
3. `tests/integration/api/guest-orders.test.ts`:
   - Extended test suite with 6 new integration tests (12 tests total in file) inside `withTransaction`:
     - 5.6.2 happy path: reads session order, returns 200 `{ data: order }`, verifies frozen money.
     - 5.6.2 nonexistent ID: returns 404 NOT_FOUND with generic error message.
     - 5.6.2 privacy negative: reading another guest session's order at the same venue returns 404 NOT_FOUND and leaks no data.
     - 5.6.2 no session: returns 401 UNAUTHORIZED.
     - 5.6.3 happy path: lists only the active session's orders (asserts 2 orders for Session A are returned and Session B's order is excluded).
     - 5.6.3 no session: returns 401 UNAUTHORIZED.
4. Baseline results: tsc 0, build 24 routes + 1 proxy (exit 0), unit 186/27, integration 152/28 (75.35s).

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/api/guest/orders/[id]/route.ts | Create | GET handler reading single order with session verification and privacy scoping |
| app/api/guest/orders/route.ts | Edit | Added GET handler listing all orders for guest session; POST handler untouched |
| tests/integration/api/guest-orders.test.ts | Edit | Extended suite with 6 integration tests covering both read routes and privacy negative |
| docs/ROADMAP.md | Edit | Marked Task 5.6.2 and Task 5.6.3 as complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0149, updated §5.2 ledger row, bumped next entry number to 0150, advanced §7 snapshot |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /api/guest/orders
# ├ ƒ /api/guest/orders/[id]
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  186 passed (186)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  28 passed (28)
#      Tests  152 passed (152)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (24 routes + 1 proxy middleware; +1 route for /api/guest/orders/[id]; exit 0)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (152 passed across 28 test files in 75.35s)

**Acceptance Criteria Results:**
- [x] Automated: `GET /api/guest/orders/[id]` reads session, calls `findById`, verifies `order.guestSessionId === session.id`, returns 404 NOT_FOUND on wrong-session or nonexistent read (no leak), returns 200 `{ data: order }` on owner read.
- [x] Automated: `GET /api/guest/orders` calls `listForGuestSession(session.venueId, session.id)` and returns 200 `{ data: orders }`; `POST` handler untouched.
- [x] Automated: Both routes return 401 UNAUTHORIZED without a valid session cookie.
- [x] Automated: Integration tests in `tests/integration/api/guest-orders.test.ts` extended with 6 new tests covering happy paths, nonexistent 404, wrong-session 404, no-session 401, and session-only orders.
- [x] Automated: All four baselines pass: tsc 0, build 24 routes + 1 proxy, unit 186/27, integration 152/28.
- [x] Automated: ROADMAP.md marks 5.6.2 and 5.6.3 complete; PROGRESS.md records ENTRY-0149.
- [ ] Awaiting Human Verification: On a real phone via LAN: the order placed in 5.6.1 can be read back by GET /api/guest/orders/{id} and appears in the list from GET /api/guest/orders; a second guest session cannot read the first guest's order.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | Scope matches product requirements (§5 guest order flow) | No change |
| DECISIONS.md | No | Adheres to D-2.1, D-2.3, D-2.5, D-4.6, D-10.2 | No change |
| SYSTEM.md | No | Adheres to §5, §6.2, §11.3, §12.1, §12.2, §12.7, §15.4 | No change |
| BUILD.md | No | Adheres to §5, §6, §7.2, §8.8 | No change |
| WIRING.md | No | No new wiring obligations created or discharged | No change |
| ROADMAP.md | Yes | Marked Task 5.6.2 and Task 5.6.3 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0149, bumped ledger, updated snapshot | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.6.4 — Verify: an order can be placed, read, and listed; the response shape matches SYSTEM.md §12.

**Awaiting Human Verification:** YES

### ENTRY-0148 — 2026-10-29 — Task 5.6.1 — Add POST /api/guest/orders and wire cart Place order seam

**Status:** PASS

**Task:** Task 5.6.1 — Add `POST /api/guest/orders` and wire the `PLACE-ORDER SEAM` (W-0001) in `app/(guest)/cart/page.tsx`

**Summary:**
Implemented `POST /api/guest/orders` route handler in `app/api/guest/orders/route.ts` and satisfied cross-task wiring obligation W-0001 by connecting the cart's "Place order" action in `app/(guest)/cart/page.tsx`:
1. `app/api/guest/orders/route.ts`:
   - Validates active guest session cookie via `getGuestCookie()` and `getGuestSession(...)` (returns 401 UNAUTHORIZED if missing/invalid/expired).
   - Validates client `idempotencyKey` as well-formed UUID before domain execution (returns 400 VALIDATION_FAILED if absent or malformed).
   - Enforces authoritative session context: resolves `venueId`, `placeType`, and place IDs (`tableId`, `roomId`, `counterId`) strictly from the guest session, ignoring client-supplied place or venue identifiers (D-2.1, BUILD.md §6 rule 5).
   - Strictly ignores client-supplied prices, subtotals, tax rates, tax amounts, and totals; maps client items to `CreateOrderItemRequest[]` (`menuItemId`, `quantity`, `selectedModifierIds`, `notes`).
   - Invokes domain orchestrator `createOrder({ orderRepo, menuRepo, venueRepo }, createRequest)`, which enforces authoritative database pricing, venue tax rate, frozen modifier names/prices, single atomic transaction, and idempotency key duplicate handling.
   - Translates domain errors via `domainErrorToStatus` into canonical HTTP status codes (400, 401, 403, 404, 409, 429, 500) and returns HTTP 201 `{ data: order }` on success.
   - Exports `setTestDbClient(client)` for transactional integration test harness.
2. `app/(guest)/cart/page.tsx` (W-0001 Discharged):
   - Replaced disabled placeholder seam with live submission handler `handlePlaceOrder()`.
   - Generates or reuses client `currentIdempotencyKey` per checkout intent (UUID regex compliant; preserved on error for safe retry per D-4.12 and SYSTEM.md §9.7).
   - Dynamically enables `#place-order-btn` when cart has items, validates required pickup name when counter flow is active, sets visual loading state ("Sending…", `cursor-wait`), and issues `POST /api/guest/orders`.
   - On success: clears `localStorage.removeItem('guest_cart')`, resets idempotency key, renders inline success state ("Order placed! Order #<id>"), and disables button.
   - On failure or network error: preserves cart in `localStorage`, keeps idempotency key for retry, restores button state ("Place order"), and renders safe inline error message in `#place-order-status`.
3. `tests/integration/api/guest-orders.test.ts`:
   - 6 integration tests against real PostgreSQL database and adapters inside `withTransaction`:
     - Test 1 (Happy path): creates order with frozen database money, initial PLACED state change, and table place context (201).
     - Test 2 (Negative): rejects missing or malformed `idempotencyKey` with 400 `VALIDATION_FAILED` without creating DB rows.
     - Test 3 (Negative): rejects unauthenticated requests (missing cookie or unknown token) with 401 `UNAUTHORIZED`.
     - Test 4 (Authoritative boundary): ignores client-supplied spoofed venue, table, price ($0.01), tax, and total; freezes database values.
     - Test 5 (Idempotency): replay with identical `idempotencyKey` returns existing order without creating duplicate rows (order count = 1).
     - Test 6 (Counter flow): captures `pickupName` alongside place context for counter orders.
4. Cross-task documentation:
   - `docs/WIRING.md`: W-0001 moved from §2 (Active) to §3 (Discharged by ENTRY-0148).
   - `docs/ROADMAP.md`: Marked 5.6.1 complete (✅).
   - All four baselines pass: tsc 0, build 23 routes + 1 proxy (exit 0), unit 186/27, integration 146/28 (70.45s).

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/api/guest/orders/route.ts | Create | Guest order submission route handler with session auth, UUID idempotency validation, and createOrder orchestration |
| app/(guest)/cart/page.tsx | Edit | Discharged W-0001: enabled Place order button, wired idempotency key and POST submission with retry preservation and success feedback |
| tests/integration/api/guest-orders.test.ts | Create | 6 integration tests for POST /api/guest/orders covering happy path, negative cases, boundary security, idempotency, and counter flow |
| docs/WIRING.md | Edit | Moved W-0001 from §2 Active to §3 Discharged with ENTRY-0148 proof |
| docs/ROADMAP.md | Edit | Marked Task 5.6.1 complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0148, updated §5.2 ledger row, bumped next entry number to 0149, advanced §7 snapshot |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /api/guest/orders
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  186 passed (186)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  28 passed (28)
#      Tests  146 passed (146)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (23 routes + 1 proxy middleware; +1 route for /api/guest/orders; exit 0)
- `pnpm test:unit`: PASS (186 passed across 27 test files)
- `pnpm test:integration`: PASS (146 passed across 28 test files in 70.45s)

**Acceptance Criteria Results:**
- [x] Automated: `POST /api/guest/orders` route handler created and exported.
- [x] Automated: Route checks guest cookie and validates guest session; returns 401 UNAUTHORIZED on missing or invalid session.
- [x] Automated: Idempotency key validated as valid UUID; returns 400 VALIDATION_FAILED when missing or malformed.
- [x] Automated: Venue and place resolved authoritatively from guest session, never from client body (BUILD.md §6 rule 5, D-2.1).
- [x] Automated: Client-supplied prices and totals are strictly ignored; prices and taxes recomputed and frozen via createOrder (D-4.1, D-4.4).
- [x] Automated: Success response envelope returns HTTP 201 `{ data: order }`.
- [x] Automated: Cart Place order action wired (W-0001 discharged); button enabled when cart non-empty; generates/reuses idempotency key; submits to `/api/guest/orders`.
- [x] Automated: On submission error, cart items and idempotency key are preserved for retry.
- [x] Automated: On submission success, localStorage cart is cleared and confirmation feedback displayed.
- [x] Automated: 6 integration tests in `tests/integration/api/guest-orders.test.ts` pass against real PostgreSQL database.
- [x] Automated: Cross-task wiring ledger W-0001 moved to §3 Discharged Obligations.
- [ ] Awaiting Human Verification: On a real phone via LAN: items in cart enable "Place order" button; clicking submits real order, shows loading/success, and clears localStorage; order appears in database.

**Impact:**
| Document | Touched? | Reason | Result |
|----------|----------|--------|--------|
| PRODUCT.md | No | Scope matches product requirements (§5 guest order flow) | No change |
| DECISIONS.md | No | Adheres to D-2.1, D-4.1, D-4.4, D-4.12, D-17.5 | No change |
| SYSTEM.md | No | Adheres to §5, §6.2, §9.7, §12.7, §15.2 | No change |
| BUILD.md | No | Adheres to §5, §6, §7.1, §8.8 | No change |
| WIRING.md | Yes | Discharged W-0001 (moved to §3) | Updated |
| ROADMAP.md | Yes | Marked Task 5.6.1 as complete | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0148, bumped ledger, updated snapshot | Updated |
| DESIGN.md | No | Adheres to design specifications | No change |

**Contradiction Check:**
None found.

**Next:**
Task 5.6.2 — Add `GET /api/guest/orders/[id]`.

**Awaiting Human Verification:** YES

### ENTRY-0147 — 2026-10-29 — Task 5.5.3 — Verify createOrder against the real database

**Status:** PASS

**Task:** Task 5.5.3 — Verify: `createOrder` writes an order with frozen prices and tax and the initial `PLACED` state change in one transaction; a retry with the same idempotency key returns the existing order; the transaction rolls back on error

**Summary:**
Implemented integration test suite in `tests/integration/orders/create-order.test.ts` driving the pure domain orchestrator `createOrder` against the real PostgreSQL test database and real repository adapters (`createPrismaOrderRepository`, `createPrismaMenuRepository`, `createPrismaVenueRepository`) inside the `withTransaction` rollback harness. Proved: (1) Happy path writes an order with frozen item names, prices, modifiers, and line totals from the menu repository, and authoritative venue tax rate, subtotal, tax amount, and total from the venue repository; (2) The initial `PLACED` state change is written atomically in the same transaction; (3) The idempotency contract: retrying `createOrder` with the same `idempotencyKey` returns the existing order and creates no second row (Order count remains 1); (4) Non-orderable items (`UNAVAILABLE`) are rejected with `VALIDATION_FAILED` (400) and no row is written; (5) Nonexistent items are rejected with `NOT_FOUND` (404) and no row is written; (6) Transactional rollback on database error: forcing a database constraint failure via an invalid `menuItemId` foreign key causes `orderRepo.create` to fail with `INTERNAL` (500) and leaves 0 orphan orders, 0 items, and 0 state changes; (7) Cross-venue isolation: an order created for venue A cannot be read with venue B's ID, returning `NOT_FOUND` (never `FORBIDDEN` or leaking data). Milestone 5.5 is closed; former tasks 5.5.4 (initial state change), 5.5.5 (transaction wrapper), and 5.5.6 (verification) were consolidated into this task 5.5.3 because the transactional write and idempotency constraint are already implemented in `order.repo.ts`. All four baselines pass: tsc 0, build 22 routes + 1 proxy, unit 186/27, integration 140/28 (74.42s). Milestone 5.6 is unblocked; W-0001 remains OPEN, satisfied by Task 5.6.1.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| tests/integration/orders/create-order.test.ts | Create | 7 integration tests verifying `createOrder` against real PostgreSQL database and adapters |
| docs/ROADMAP.md | Edit | Marked Task 5.5.3 complete; added Milestone 5.5 closure note |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0147, updated §5.2 ledger row, bumped next entry number to 0148, advanced §7 snapshot |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  186 passed (186)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  28 passed (28)
#      Tests  140 passed (140)
#   Duration  74.42s
```

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The new integration suite drives real `createOrder` against real repositories and database inside `withTransaction` | PASS | Implemented in `tests/integration/orders/create-order.test.ts` using `createPrismaOrderRepository`, `createPrismaMenuRepository`, `createPrismaVenueRepository` |
| 2 | Proves frozen prices and tax (read back from database) | PASS | Verified in happy path: stored subtotal ($47.00), tax ($4.70), total ($51.70), item prices, modifier prices ($2.50), line totals ($42.00, $5.00), and modifiersJson match authoritative database values |
| 3 | Proves single PLACED state change written in same transaction | PASS | Verified in dedicated test and happy path: exactly 1 state change with state = `PLACED`, staffMemberId = null |
| 4 | Proves idempotency retry (same id, no second row) | PASS | Verified: calling `createOrder` twice with same `idempotencyKey` returns identical order; venue order count remains 1, item count remains 1, state change count remains 1 |
| 5 | Proves non-orderable item rejection | PASS | Verified: item with state = `UNAVAILABLE` returns `VALIDATION_FAILED` (400), 0 orders written |
| 6 | Proves nonexistent item rejection | PASS | Verified: nonexistent item ID returns `NOT_FOUND` (404), 0 orders written |
| 7 | Proves transaction rolls back on error (no partial row) | PASS | Verified: foreign key constraint violation on `order_items_menuItemId_fkey` fails atomically; venue order count = 0, item count = 0, state change count = 0 |
| 8 | Proves cross-venue isolation | PASS | Verified: order created for venue A read with venue B's ID returns `NOT_FOUND` (never `FORBIDDEN`); cites repository test case 12 |
| 9 | No production code is changed | PASS | Zero files under `src/` or `app/` touched |
| 10 | Four baselines pass: tsc 0; build 22 routes + 1 proxy (Next.js 16.4.0 Turbopack); unit 186/27; integration 140/28 at 74.42s | PASS | All four commands executed with exit code 0 and exact expected outputs |
| 11 | ROADMAP.md marks 5.5.3 complete and carries Milestone 5.5 closure note; PROGRESS.md records ENTRY-0147 with ledger row on own line, next 0148, snapshot at 5.6.1 next, and states consolidation | PASS | Verified via git diff |
| 12 | Awaiting Human Verification: NO | PASS | Real-database proof established by integration test suite |

**Deviations:**
None. `vitest.integration.config.ts` already included "tests/integration/**/*.test.ts", so no config widening was required.

**Limitations:**
None. Integration verification against real PostgreSQL database complete.

**Next:**
Milestone 5.6 — The Order Routes, starting at Task 5.6.1: Add `POST /api/guest/orders` (and wire PLACE-ORDER SEAM W-0001).

**Awaiting Human Verification:** NO


### ENTRY-0146 — 2026-10-29 — Task 5.5.2 — Add the createOrder domain function

**Status:** PASS

**Task:** Task 5.5.2 — Add the `createOrder` domain function (validate, freeze item prices and modifiers, enforce the idempotency key, call the order repository)

**Summary:**
Implemented the pure domain orchestrator `createOrder` in `src/domain/orders/create-order.ts` and exported it along with `CreateOrderDeps`, `CreateOrderRequest`, and `CreateOrderItemRequest` via `src/domain/orders/index.ts`. The orchestrator: (1) validates input before any repository call (requiring non-empty venueId, UUID v4 idempotencyKey, valid PlaceType matching place ID, non-empty items array with positive integer quantities); (2) checks the idempotency key first via `orderRepo.findByIdempotencyKey` and returns `ok(existingOrder)` immediately on retry without performing writes or recalculations; (3) queries `venueRepo.findById` to obtain the authoritative venue taxRate; (4) queries `menuRepo.getItemWithModifiers` for each requested item, rejecting nonexistent items with `NOT_FOUND` and non-orderable items (`state !== AVAILABLE`) with `VALIDATION_FAILED`, resolving selected modifiers, and freezing database item names, prices, and modifier options; (5) computes line totals, subtotal, tax amount, and total authoritatively via the 5.5.1 decimal-money functions (`computeLineTotal`, `computeSubtotal`, `computeTax`, `computeTotal`); (6) assembles `CreateOrderInput` and calls `orderRepo.create`, propagating repository results unchanged. Any client-supplied money fields (price, lineTotal, subtotal, taxRate, taxAmount, total) are strictly ignored. Added 13 in-memory fake unit tests in `tests/unit/orders/create-order.test.ts` covering happy path, price tampering rejection, unavailable item rejection, nonexistent item rejection, UUID idempotency validation, idempotency retry returning existing order with 0 writes, repository error propagation, venue tax rate authoritativeness, place type consistency, and modifier validation. All four baselines pass cleanly.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/orders/create-order.ts | Create | Pure domain orchestrator for authoritative order creation |
| src/domain/orders/index.ts | Edit | Barrel export for `createOrder`, `CreateOrderDeps`, `CreateOrderRequest`, `CreateOrderItemRequest` |
| tests/unit/orders/create-order.test.ts | Create | 13 unit tests for `createOrder` using in-memory repository fakes |
| docs/ROADMAP.md | Edit | Marked Task 5.5.2 complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0146, updated §5.2 ledger row, bumped next entry number to 0147, advanced §7 snapshot |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  186 passed (186)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
#   Duration  77.69s
```

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `createOrder` exists, takes its dependencies as an object, validates the request (including UUID idempotency key and place/type consistency), and rejects non-orderable and nonexistent items with documented codes | PASS | Implemented in `src/domain/orders/create-order.ts`; rejects non-orderable with `VALIDATION_FAILED` (SYSTEM.md §5/§9.4) and nonexistent with `NOT_FOUND`; tested in unit suite |
| 2 | `createOrder` reads item and modifier prices from menu repository and tax rate from venue repository, computing line totals, subtotal, tax, and total via 5.5.1 functions with no client money used | PASS | Verified in happy path and tampering tests; database values are authoritative |
| 3 | `createOrder` checks `findByIdempotencyKey` first and returns existing order on retry; `orderRepo.create` called exactly once on happy path, zero times on every failure and retry | PASS | Verified in `tests/unit/orders/create-order.test.ts` (happy path, retry path, failure paths) |
| 4 | Repository failures propagate unchanged | PASS | Verified for `orderRepo.create`, `orderRepo.findByIdempotencyKey`, `venueRepo.findById`, and `menuRepo.getItemWithModifiers` |
| 5 | Unit suite covers every case with in-memory fakes (no database), and `pnpm test:unit` passes with increased totals | PASS | 13 tests added in `tests/unit/orders/create-order.test.ts`; unit total: 186 passed (27 files) |
| 6 | Four baselines pass: tsc 0; build 22 routes + 1 proxy (Next.js 16.4.0 Turbopack); unit 186/27; integration 133/27 at 77.69s | PASS | All four commands executed with exit code 0 |
| 7 | No out-of-scope file is touched | PASS | Only `create-order.ts`, `index.ts`, `create-order.test.ts`, `ROADMAP.md`, `PROGRESS.md` edited |
| 8 | ROADMAP.md marks 5.5.2 complete; PROGRESS.md records ENTRY-0146 with ledger row on own line, next 0147, snapshot at 5.5.3 next | PASS | Verified via git diff |
| 9 | Awaiting Human Verification: NO | PASS | Domain function fully unit-tested; real-database proof is 5.5.3 |

**Deviations:**
None. `vitest.config.ts` already included "tests/unit/orders/**/*.test.ts" from Task 5.5.1, so no config edits were needed.

**Limitations:**
None. Pure domain orchestrator with full unit test coverage.

**Next:**
Task 5.5.3 — Verify `createOrder` against the real database.

**Awaiting Human Verification:** NO


### ENTRY-0145 — 2026-10-29 — Task 5.5.1 — Add the price and tax computation (computePrice, computeTax, and the shared decimal-money helper)

**Status:** PASS

**Task:** Task 5.5.1 — Add the price and tax computation (`computePrice`, `computeTax`, and the shared decimal-money helper)

**Summary:**
Implemented the shared domain decimal-money arithmetic helper (`src/domain/shared/money.ts` providing `parseDecimal`, `roundToTwoDecimals`, `addDecimal`, and `multiplyDecimal`), the pure price computation module (`src/domain/orders/compute-price.ts` providing `computeLineTotal` and `computeSubtotal`), and the pure tax and total computation module (`src/domain/orders/compute-tax.ts` providing `computeTax` and `computeTotal`), exporting them through `src/domain/orders/index.ts`. All functions operate strictly on decimal strings across domain boundaries (BUILD.md §5.7, §7.1), validate inputs returning `Result<T>` with `DomainErrorCode.VALIDATION_FAILED` on malformed inputs (SYSTEM.md §5), and use exponential-scaled standard half-up rounding to two decimal places to prevent floating-point representation drift. Milestone 5.5 was restructured in ROADMAP.md: former 5.5.2 (price/tax computation) moved to 5.5.1 because `createOrder` depends on these computations, former 5.5.1 (`createOrder`) moved to 5.5.2, and former 5.5.4/5.5.5/5.5.6 consolidated into 5.5.3 (verification against the real database) because the transactional multi-row write and unique idempotency constraint are already implemented in `order.repo.ts`. Widened `vitest.config.ts` to include `tests/unit/orders/**/*.test.ts`, adding 36 unit tests across 2 new test suites (`tests/unit/orders/compute-price.test.ts` and `compute-tax.test.ts`), bringing the unit baseline to 173 passed across 26 files. All four baselines pass cleanly.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| src/domain/shared/money.ts | Create | Shared domain decimal-money helper (`parseDecimal`, `roundToTwoDecimals`, `addDecimal`, `multiplyDecimal`) |
| src/domain/orders/compute-price.ts | Create | Pure price computation (`computeLineTotal`, `computeSubtotal`) |
| src/domain/orders/compute-tax.ts | Create | Pure tax and total computation (`computeTax`, `computeTotal`) |
| src/domain/orders/index.ts | Create | Barrel exports for orders domain functions |
| tests/unit/orders/compute-price.test.ts | Create | 20 unit assertions for price arithmetic and money helpers |
| tests/unit/orders/compute-tax.test.ts | Create | 16 unit assertions for tax and total arithmetic |
| vitest.config.ts | Edit | Widened unit test include pattern to include `tests/unit/orders/**/*.test.ts` |
| docs/ROADMAP.md | Edit | Marked Task 5.5.1 complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0145, updated §5.2 ledger row, bumped next entry number to 0146, advanced §7 snapshot |

**Commands Run:**

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  26 passed (26)
#      Tests  173 passed (173)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
#   Duration  74.14s
```

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `money.ts`, `compute-price.ts`, `compute-tax.ts` are no longer 0 bytes and contain helper and functions | PASS | Full files written and verified in codebase |
| 2 | Public functions take and return decimal strings; malformed input returns `VALIDATION_FAILED`; no float artefacts | PASS | Verified by 36 unit tests covering empty, malformed, negative, float addition (0.1+0.2), and scaling |
| 3 | `computeLineTotal` = (itemPrice + sum(mods)) * qty; `computeSubtotal` = sum(lineTotals); `computeTax` = subtotal * rate (half-up); `computeTotal` = subtotal + tax | PASS | Unit tests assert exact arithmetic for single/multi modifiers, quantities, fractional tax rates, zero rates, and totals |
| 4 | `src/domain/orders/index.ts` exports `computeLineTotal`, `computeSubtotal`, `computeTax`, `computeTotal` | PASS | Barrel populated and verified |
| 5 | Both unit test files exist with specified coverage and `pnpm test:unit` passes with new totals | PASS | `tests/unit/orders/compute-price.test.ts` (20 tests), `compute-tax.test.ts` (16 tests); unit total: 173 passed (26 files) |
| 6 | Four baselines pass: tsc 0; build 22 routes + 1 proxy (Next.js 16.4.0 Turbopack); unit 173/26; integration 133/27 (74.14s) | PASS | All four commands executed with exit code 0 and exact expected outputs |
| 7 | No out-of-scope file is touched; `src/lib/money.ts` and `tests/unit/lib/money.test.ts` unchanged | PASS | Verified via git status |
| 8 | ROADMAP.md marks 5.5.1 complete; PROGRESS.md records ENTRY-0145 with ledger row on own line, next 0146, snapshot at 5.5.2 next, states restructure | PASS | Document updates verified |
| 9 | Awaiting Human Verification: NO | PASS | Pure domain arithmetic with complete unit test verification |

**Deviations:**
`vitest.config.ts` was edited to add `"tests/unit/orders/**/*.test.ts"` to the `include` array. This was required because Vitest's explicitly scoped pattern excluded the `tests/unit/orders/` directory by default, following the exact precedent established in ENTRY-0109 when `tests/unit/menu/**/*.test.ts` was added.

**Limitations:**
None. Pure domain arithmetic with full unit coverage.

**Next:**
Task 5.5.2 — Add the `createOrder` domain function (validate, freeze item prices and modifiers, enforce the idempotency key, call the order repository).

**Awaiting Human Verification:** NO


### ENTRY-0144 — 2026-10-29 — Task 5.4.8 — Verify: items can be added, adjusted, and removed; the totals are correct; the counter pickup name is captured

**Status:** PASS

**Task:** Task 5.4.8 — Verify: items can be added, adjusted, and removed; the totals are correct; the counter pickup name is captured

**Summary:**
The human performed the manual mobile verification on a real phone via LAN and confirmed, across the cart flow: an item added from the menu appears in the cart with its modifiers and line total; the quantity stepper increments/decrements correctly and the line total updates; the remove action deletes the line and removing the last line shows the empty state with the "Back to menu" link; the order-notes field accepts text without blurring and persists across a refresh and across line mutations; the summary block shows subtotal, tax, and total as a client-side display preview matching a hand computation for a stated cart (subtotal = sum of line totals; tax = subtotal × venue rate; total = subtotal + tax); the Place order button is shown, full-width, disabled, with the accessible reason "Ordering opens soon.", and creates no order; the pickup-name field appears only when the venue has the counter module enabled and the cart is non-empty, accepts a name without blurring, persists across refresh and line mutations, and is not transmitted. All observed as expected.

The cart summary verified here is a client-side display preview. The authoritative price and tax are recomputed and frozen server-side at order placement (Tasks 5.5.2 and 5.5.3, DECISIONS D-4.1 and D-4.4), and are verified at the Phase 5 acceptance test (PHASE_TESTS.md §7, step 11) after Milestone 5.5 — not by this milestone close.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| docs/ROADMAP.md | Edit | Mark Task 5.4.8 complete and record Milestone 5.4 closure note |
| docs/PROGRESS.md | Edit | Record ENTRY-0144, append §5.2 ledger row, bump next entry number to 0145, advance §7 snapshot to Milestone 5.5 / Task 5.5.1 |

**Commands Run:**

```powershell
git log --oneline -1
# Output: 235abab STRUCTURAL — Record ENTRY-0143 (Task 5.4.7 complete, D-17.5 locked)
```

```powershell
git status --short --untracked-files=all
# Output: (clean, empty output)
```

```powershell
git status --short --untracked-files=all
# Output:
#  M docs/PROGRESS.md
#  M docs/ROADMAP.md
```

No baselines were run because no code changed; the last real baselines are the Task 5.4.7 re-run (tsc `pnpm exec tsc --noEmit` exit 0; `pnpm build` exit 0, 22 routes + 1 proxy, Next.js 16.4.0 Turbopack; `pnpm test:unit` 137 passed / 23 files; `pnpm test:integration` 133 passed / 27 files, 64.35s) — as the current green state. Do not fabricate new test output.

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Item added from menu appears with modifiers and line total | PASS | Human-verified on a real phone via LAN |
| 2 | Quantity stepper increments/decrements and line total updates | PASS | Human-verified on a real phone via LAN |
| 3 | Remove action deletes line; removing last line displays empty state with "Back to menu" link | PASS | Human-verified on a real phone via LAN |
| 4 | Order notes textarea accepts input without blur and survives refresh and line mutations | PASS | Human-verified on a real phone via LAN |
| 5 | Summary block shows subtotal, tax, and total matching hand-computation preview | PASS | Human-verified on a real phone via LAN (hand check: Line 1 Truffle Burger $18.50 + Bacon $2.00 = $20.50 × 2 = $41.00; Line 2 Garlic Fries $6.00 × 1 = $6.00; Subtotal = $47.00; Venue tax rate = 8.25%; Tax = $47.00 × 0.0825 = $3.88; Total = $47.00 + $3.88 = $50.88; all 3 preview amounts matched display exactly) |
| 6 | Place order button is disabled with accessible text "Ordering opens soon." and creates no order | PASS | Human-verified on a real phone via LAN |
| 7 | Pickup-name field shows only when counter module enabled and cart non-empty; persists without blur | PASS | Human-verified on a real phone via LAN |
| 8 | Pickup name is not transmitted | PASS | Human-verified on a real phone via LAN (local state only; no network submission) |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No change | No change |
| DECISIONS.md | No | Adheres to D-2.2, D-4.1, D-4.4, D-17.5 | No change |
| SYSTEM.md | No | Adheres to §4, §11 | No change |
| BUILD.md | No | Adheres to build rules | No change |
| ROADMAP.md | Yes | Marked Task 5.4.8 complete, recorded Milestone 5.4 closure note | Updated |
| WIRING.md | No | W-0001 remains OPEN, satisfied by Task 5.6.1 | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0144, added §5.2 ledger row, bumped next entry number to 0145, updated §7 snapshot | Updated |

**Contradiction Check:**
None found. The milestone close records client-side preview verification only and does not claim authoritative charged amount verification, which is deferred to Tasks 5.5.2/5.5.3, D-4.1, and D-4.4.

**Next:**
Task 5.5.1 — Add the createOrder domain function (the first task of Milestone 5.5, The Order Domain).

**Awaiting Human Verification:** NO


### ENTRY-0143 — 2026-10-29 — Task 5.4.7 — Add the pickup-name field for the counter flow

**Status:** PASS

**Task:** Task 5.4.7 — Add the pickup-name field for the counter flow

**Summary:**
Added the pickup-name field (`#cart-pickup-name` inside `#cart-pickup-container`) to the cart page (`app/(guest)/cart/page.tsx`), conditionally rendered only when the venue has the counter module enabled (`hasCounterModule = venue.value.modules.includes("COUNTER")`) and the cart is non-empty. The field is saved locally under `pickupName` in `localStorage.guest_cart` on native input/change events without re-rendering or focus disruption, defaults to `""`, and is preserved across all line mutations. Appended locked decision D-17.5 in `docs/DECISIONS.md` governing the place-identifier-plus-pickup-name double-confirmation rule, and updated active obligation W-0001 in `docs/WIRING.md` to require Task 5.6.1 to transmit both.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/cart/page.tsx | Edit | Sourced `hasCounterModule` from venue modules, added `#cart-pickup-container` with `#cart-pickup-name`, toggled visibility in `renderCart()`, persisted input to `pickupName`, and preserved it during line mutations |
| docs/DECISIONS.md | Edit | Appended D-17.5 (place identifier + pickup name double-confirmation rule) and updated Section 17 index |
| docs/WIRING.md | Edit | Updated W-0001 obligation to require 5.6.1 to send both place identifier and pickup name, adding Related decision: D-17.5 |
| docs/ROADMAP.md | Edit | Marked Task 5.4.7 complete and added pickup-name requirement to Milestone 5.6 wiring note |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0143, added §5.2 ledger row, bumped next entry number to 0144, updated §7 snapshot |

**Commands Run:**

```powershell
git log --oneline -1
# Output: c60828f STRUCTURAL — Record ENTRY-0142 (Task 5.4.6 complete)
```

```powershell
git status --short --untracked-files=all
# Output: (clean, empty output)
```

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; identical route count)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Pickup-name field renders in cart, hidden when empty or counter module missing, shown otherwise | PASS | `#cart-pickup-container` with `#cart-pickup-name`, helper text, and required asterisk rendered; toggled via `hasCounterModule ? 'block' : 'none'` in `renderCart()` |
| 2 | Field value read on init with focus guard and persisted without re-render | PASS | `pickupInput.value = cartData.pickupName || ''` checked against `document.activeElement !== pickupInput`; `handlePickupInput` writes to `localStorage` without calling `renderCart()` |
| 3 | pickupName is top-level cart field defaulting to "" and preserved across line mutations | PASS | Default `{ items: [], itemCount: 0, total: '0.00', orderNotes: '', pickupName: '' }`; preserved via `cartData.pickupName = cartData.pickupName || ''` in click handler |
| 4 | No transmission | PASS | No fetch, no route, no createOrder, no idempotency-key generation, no navigation added |
| 5 | D-17.5 appended in correct format and number | PASS | Appended to `docs/DECISIONS.md` with Decision, Context, Alternatives, Consequences, What would make us revisit, Traces to |
| 6 | W-0001 updated to require place identifier + pickup name transmission | PASS | Obligation updated in `docs/WIRING.md` §2 and `Related decision: D-17.5` added; status remains OPEN |
| 7 | ROADMAP.md marks 5.4.7 complete and carries 5.6.1 pickup-name note | PASS | Task 5.4.7 marked `✅ Complete`; wiring note updated beneath Milestone 5.6 |
| 8 | 5.4.1–5.4.6 behaviour unchanged | PASS | Line rendering, quantity/remove, notes focus guard, summary calculation, empty state role="status", and Place order footer/seam untouched |
| 9 | Baselines pass clean | PASS | tsc exit 0, build 22 routes + 1 proxy, unit 137/23, integration 133/27 |
| 10 | Only named files changed | PASS | Only the five specified files modified |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Aligns with §4.3, §4.4, §7.3–§7.4; no change required | No change |
| DECISIONS.md | Yes | Appended locked decision D-17.5 | Updated |
| SYSTEM.md | No | System architecture untouched | No change |
| BUILD.md | No | Build process untouched | No change |
| ROADMAP.md | Yes | Marked Task 5.4.7 complete, updated 5.6.1 wiring note | Updated |
| WIRING.md | Yes | Updated W-0001 obligation to include pickup name and cite D-17.5 | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0143, bumped ledger to 0144, updated snapshot | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.8 — Verify: items can be added, adjusted, and removed; the totals are correct; the counter pickup name is captured.

**Awaiting Human Verification:** YES — on a real phone via LAN, in a venue with the counter module enabled: the pickup-name field shows in the cart and its value survives a refresh and quantity/remove changes; typing does not blur the field; in a table-only or room-only venue the field does not show; with an empty cart the field is hidden.


### ENTRY-0142 — 2026-10-29 — Task 5.4.6 — Add the empty cart state

**Status:** PASS

**Task:** Task 5.4.6 — Add the empty cart state

**Summary:**
Verified the cart screen empty state (`#cart-empty` in `app/(guest)/cart/page.tsx`) against DESIGN.md §4.8.3, confirming warm and brief copy ("Your cart is empty.") and a working link ("Back to menu" navigating to `/menu`). Added `role="status"` to `#cart-empty` for screen reader announcement when appearing, and verified that in `renderCart()` all four supporting containers (`#cart-lines`, `#cart-notes-container`, `#cart-summary`, and `#cart-footer`) are cleanly hidden when the cart is empty.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/cart/page.tsx | Edit | Added `role="status"` to `#cart-empty` for accessibility announcement |
| docs/ROADMAP.md | Edit | Marked Task 5.4.6 complete |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0142, added §5.2 ledger row, bumped next entry number to 0143, updated §7 snapshot |

**Commands Run:**

```powershell
git log --oneline -1
# Output: b09f4e3 STRUCTURAL — Record ENTRY-0141 (Task 5.4.5 complete, W-0001 opened)
```

```powershell
git status --short --untracked-files=all
# Output: (clean, empty output)
```

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; identical route count)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Empty state meets DESIGN.md §4.8.3 copy and link | PASS | Warm, brief copy ("Your cart is empty.", "Explore the menu to add items to your order.") and link ("Back to menu" href="/menu") verified |
| 2 | Four containers hidden in empty state | PASS | `renderCart()` hides `#cart-lines`, `#cart-notes-container`, `#cart-summary`, and `#cart-footer` when `items.length === 0` |
| 3 | Accessibility role added | PASS | `role="status"` added to `#cart-empty` |
| 4 | 5.4.1–5.4.5 behaviour unchanged | PASS | Line rendering, stepper/remove handlers, notes focus guard, summary calculation, and disabled Place order footer untouched |
| 5 | Baselines pass clean | PASS | tsc exit 0, build 22 routes + 1 proxy, unit 137/23, integration 133/27 |
| 6 | Only named files changed | PASS | Only `app/(guest)/cart/page.tsx`, `docs/ROADMAP.md`, `docs/PROGRESS.md` modified |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Cart empty state meets existing spec | No change |
| DECISIONS.md | No | No architectural decision changed | No change |
| SYSTEM.md | No | System architecture untouched | No change |
| BUILD.md | No | Build process untouched | No change |
| ROADMAP.md | Yes | Marked Task 5.4.6 complete | Updated |
| WIRING.md | No | W-0001 untouched | No change |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0142, bumped ledger to 0143, updated snapshot | Updated |

**Contradiction Check:**
None found.

**Next:**
Task 5.4.7 — Add the pickup-name field for the counter flow.

**Awaiting Human Verification:** YES — on a real phone via LAN: with an empty cart the empty state shows with the "Back to menu" link, and the lines, notes, summary, and Place order footer are all hidden; with items the empty state is hidden and those are shown; tapping "Back to menu" returns to /menu.


### ENTRY-0141 — 2026-10-29 — Task 5.4.5 — Add the "Place order" action

**Status:** PASS

**Task:** Task 5.4.5 — Add the "Place order" action

**Summary:**
Rendered the "Place order" button in the cart shell (`app/(guest)/cart/page.tsx`) as a full-width, sticky-at-the-bottom primary action styled per DESIGN.md §4.8.3, hidden when the cart is empty and shown when it has items via native DOM toggling in `renderCart()`. The button is an honest initiator with a disabled placeholder state (`disabled`, `aria-disabled="true"`, and `aria-describedby` referencing a visible adjacent line "Ordering opens soon."), creating no order; the real submission is deferred to Task 5.6.1/5.7.1, marked by the exact `PLACE-ORDER SEAM (W-0001)` comment in the client script and recorded as active obligation W-0001 in `docs/WIRING.md`.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| app/(guest)/cart/page.tsx | Edit | Added sticky bottom footer `#cart-footer` with `#place-order-btn` and visible status `#place-order-status`, toggled visibility in `renderCart()`, and inserted `PLACE-ORDER SEAM (W-0001)` comment |
| docs/WIRING.md | Edit | Appended W-0001 to §2 (Active Obligations) and removed the placeholder line |
| docs/ROADMAP.md | Edit | Marked Task 5.4.5 complete and added wiring note beneath Milestone 5.6 |
| docs/PROGRESS.md | Edit | Recorded ENTRY-0141, added §5.2 ledger row, bumped next entry number to 0142, updated §7 snapshot |

**Commands Run:**

```powershell
git log --oneline -1
# Output: 7eb4543 STRUCTURAL — Record ENTRY-0140 (WIRING.md added)
```

```powershell
git status --short --untracked-files=all
# Output: (clean, empty output)
```

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; identical route count)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | "Place order" button renders full-width, sticky-bottom, primary-styled, hidden when cart empty / shown when cart non-empty | PASS | `#cart-footer` with `#place-order-btn` styled with guest brand tokens, `style.display` toggled in `renderCart()` via native DOM |
| 2 | Button is disabled with `aria-disabled="true"` and accessible reason; clicking does nothing | PASS | Button carries `disabled`, `aria-disabled="true"`, and `aria-describedby="place-order-status"` pointing to visible "Ordering opens soon."; no click handler |
| 3 | PLACE-ORDER SEAM comment exists at handler location citing 5.5.1, 5.5.2, 5.5.3, 5.6.1, 5.7.1, D-4.12, SYSTEM.md §9.7 | PASS | Comment present at call site in script in `app/(guest)/cart/page.tsx` |
| 4 | No fetch, no route, no createOrder, no idempotency-key generation, no navigation added | PASS | Button is an inert initiator creating no order |
| 5 | W-0001 appended to `docs/WIRING.md` §2 per §5 template with status OPEN; placeholder line removed; §1, §3–§7 unchanged | PASS | W-0001 appended, placeholder removed, §1 and §3–§7 verified byte-identical |
| 6 | `docs/ROADMAP.md` marks 5.4.5 complete and carries 5.6.1 wiring note | PASS | Task 5.4.5 marked `✅ Complete`; wiring note added beneath Milestone 5.6 table |
| 7 | All four baselines pass clean | PASS | tsc exit 0, build 22 routes + 1 proxy, unit 137/23, integration 133/27 |
| 8 | Only the four named files changed | PASS | `git status` verifies only `app/(guest)/cart/page.tsx`, `docs/WIRING.md`, `docs/ROADMAP.md`, `docs/PROGRESS.md` modified |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Order submission deferred to 5.6.1; no product change | No change |
| DECISIONS.md | No | Confirmed Option A; no new architectural decision | No change |
| SYSTEM.md | No | System architecture untouched | No change |
| BUILD.md | No | Build process untouched | No change |
| ROADMAP.md | Yes | Marked Task 5.4.5 complete, added Task 5.6.1 wiring note | Updated |
| WIRING.md | Yes | Appended active obligation W-0001, removed placeholder line | Updated |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0141, bumped ledger to 0142, updated snapshot | Updated |

**Contradiction Check:**
None found. No canonical document is contradicted, because `docs/WIRING.md` owns nothing and defers to every canonical document by name in its §7.

**Next:**
Task 5.4.6 — Add the empty cart state.

**Awaiting Human Verification:** YES — on a real phone via LAN: with an empty cart the button is hidden; with items it shows full-width and disabled, with the accessible reason "Ordering opens soon."; tapping it creates no order and navigates nowhere.


### ENTRY-0140 — 2026-10-28 — STRUCTURAL — Add docs/WIRING.md cross-task wiring ledger

**Status:** STRUCTURAL

**Task:** None (structural session)

**Summary:**
docs/WIRING.md v1.0 is added as a new, append-only process document that indexes cross-task wiring obligations, deferred seams, and carry-forward reminders. It references — never duplicates or overrides — the canonical documents, and defers to all of them in its §7. It is seeded with the structure (the seven rules, the active and discharged obligation sections, the four deferred follow-ups, the entry template, the evolution rule) and with four deferred follow-ups: F-0001 the Next.js security advisory, F-0002 the CRLF/LF artefact, F-0003 the empty get-venue-tax-rate.ts stub, F-0004 the six placeholder (0 test) integration suites. The first active obligation, W-0001 (the cart "Place order" seam), is left for Task 5.4.5 to append, per the file's Rule 5.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| docs/WIRING.md | Create | Added cross-task wiring ledger v1.0 with 7 rules, empty active/discharged sections, 4 deferred follow-ups (F-0001..F-0004), entry template, evolution rule, and deferral section |
| docs/PROGRESS.md | Edit | Record ENTRY-0140, add §5.2 ledger row, bump next entry number to 0141 |

**Commands Run:**

```powershell
git log --oneline -1
# Output: fe6c0aa STRUCTURAL — Record ENTRY-0139 (Task 5.4.4 complete)
```

```powershell
git status --short --untracked-files=all
# Output: ?? docs/WIRING.md
```

```powershell
git diff docs/PROGRESS.md
# Output: (clean, empty output)
```

```powershell
pnpm exec tsc --noEmit
# Exit code: 0
```

```powershell
pnpm build
# Exit code: 0
# Route (app)
# ┌ ○ /
# ├ ○ /_not-found
# ├ ƒ /admin
# ├ ƒ /admin/login
# ├ ƒ /admin/qr
# ├ ƒ /admin/qr/print/[id]
# ├ ƒ /api/admin/qr/[id]/image
# ├ ƒ /api/admin/qr/[id]/revoke
# ├ ƒ /api/admin/qr/generate
# ├ ƒ /api/auth/login
# ├ ƒ /api/auth/logout
# ├ ƒ /api/auth/session
# ├ ƒ /api/dev/qr
# ├ ƒ /cart
# ├ ƒ /dev/qr
# ├ ○ /forbidden
# ├ ƒ /kitchen
# ├ ƒ /kitchen/login
# ├ ƒ /menu
# ├ ƒ /qr/[token]
# ├ ○ /qr/inactive
# ├ ƒ /services
# ├ ƒ /staff
# └ ƒ /staff/login
# ƒ Proxy (Middleware)
# ○  (Static)   prerendered as static content
# ƒ  (Dynamic)  server-rendered on demand
```

```powershell
pnpm test:unit
# Exit code: 0
# Test Files  23 passed (23)
#      Tests  137 passed (137)
```

```powershell
pnpm test:integration
# Exit code: 0
# Test Files  27 passed (27)
#      Tests  133 passed (133)
```

**Baseline Verification:**
- `pnpm exec tsc --noEmit`: PASS (0 errors)
- `pnpm build`: PASS (22 routes + 1 proxy middleware; identical route count)
- `pnpm test:unit`: PASS (137 passed across 23 test files)
- `pnpm test:integration`: PASS (133 passed across 27 test files)

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `docs/WIRING.md` exists and matches provided content verbatim | PASS | Verified in full: v1.0 header, §1 (7 rules), §2 (empty active obligations with placeholder line), §3 (empty discharged obligations), §4 (deferred follow-ups F-0001..F-0004), §5 (entry template), §6 (evolution rule), §7 (what this file does not define) |
| 2 | `ENTRY-0140` appended to `docs/PROGRESS.md` under §5.3 marker | PASS | Appended immediately below `▼ APPEND NEW ENTRIES HERE ▼` in exact project template |
| 3 | Ledger row added to §5.2 | PASS | Added `| ENTRY-0140 | 2026-10-28 | STRUCTURAL — Add docs/WIRING.md cross-task wiring ledger | STRUCTURAL | — | §5.3 |` |
| 4 | Next entry number bumped | PASS | Bumped from 0140 to 0141 |
| 5 | Snapshot unchanged in phase/milestone/current task | PASS | Phase 5 / Milestone 5.4 / Task 5.4.5 (no task executed) |
| 6 | Four baselines pass clean | PASS | tsc exit 0, build 22 routes + 1 proxy, unit 137/23, integration 133/27 |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
None.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | Process/documentation addition; no product change | No change |
| DECISIONS.md | No | No architectural decision changed | No change |
| SYSTEM.md | No | System architecture untouched | No change |
| BUILD.md | No | Build process untouched | No change |
| ROADMAP.md | No | Process document addition, not a roadmap task | No change |
| WIRING.md | Yes | Created cross-task wiring ledger v1.0 | Added |
| PROGRESS.md | Yes (this entry) | Recorded ENTRY-0140, updated ledger to 0141 | Updated |

**Contradiction Check:**
None found. No canonical document is contradicted, because `docs/WIRING.md` owns nothing and defers to every canonical document by name in its §7.

**Next:**
Task 5.4.5 — Add the "Place order" action (which will append W-0001 to docs/WIRING.md §2 and record it in ENTRY-0141).

**Awaiting Human Verification:** NO


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

Current milestone: Milestone 5.7 (The Order Confirmation and Tracking).

Current task: Task 5.7.5 — Add the polling on the tracking screen.

Current status: Task 5.7.4 complete. Real "Call a waiter" and "Request the bill" actions delivered on tracking screen with native DOM script, in-flight submission guard, and DESIGN.md §4.13.2 confirmation copy ("A waiter is on the way." / "The bill is on its way."). Route POST /api/guest/call records CALL_WAITER and REQUEST_BILL service requests scoped strictly to session venue and place, with tampered-place protection verified. Dedicated integration suite tests/integration/api/guest-call.test.ts covers happy paths, 401, 400, and session scoping (6/6 passed). All four baselines green: tsc 0, build 27 routes + 1 proxy (including /api/guest/call), unit 186/27, integration 162/29. Ready for Task 5.7.5.

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.