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
| 0033 | 2026-10-16 | Milestone 2.1 — The schema, database migration, and verification | PASS | 2.1 | current |
| 0034 | 2026-10-16 | Task 2.2.1 — The venue repository and integration harness | PASS | 2.2 | current |
| 0035 | 2026-10-16 | Task 2.2.2 — The table and room repositories | PASS | 2.2 | current |
| 0036 | 2026-10-16 | Task 2.2.3 — The QR token repository | PASS | 2.2 | current |
| 0037 | 2026-10-16 | Task 2.2.4 — The staff and staff session repositories | PASS | 2.2 | current |
| 0038 | 2026-10-16 | Task 2.2.5 — The menu repository | PASS | 2.2 | current |
| 0039 | 2026-10-16 | Task 2.2.6 — The order repository | PASS | 2.2 | current |
| 0040 | 2026-10-16 | Task 2.2.7 — The service request repository | PASS | 2.2 | current |
| 0041 | 2026-10-16 | Task 2.2.8 — The payment ticket and receipt repositories | PASS | 2.2 | current |
| 0042 | 2026-10-16 | Task 2.2.9 — Milestone 2.2 Verification and Close | STRUCTURAL | 2.2 | current |

Next entry number: 0043.

(The table is updated whenever an entry is added or moved. Every session that writes a new entry appends its row at the bottom of this table. Every session that archives an entry changes its Location cell from current to archived. Nothing else in the table changes.)

### 5.3 Current Milestone — Phase 2 Milestone 2.1 (Closed) & Milestone 2.2 (Repositories)

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0042 — 2026-10-16 — Task 2.2.9 — Milestone 2.2 Verification and Close

**Status:** STRUCTURAL

**Task:** Task 2.2.9 — Verify: each repository has an integration test that reads and writes a real record. Close Milestone 2.2.

**Summary:**
Closed Milestone 2.2 ("The repositories") with full verification across all layers. Verified that all ten domain doorways (ports in `src/domain/`) and eleven database adapters in `src/infrastructure/db/repositories/` (the payment module splitting into two adapters for one port per SYSTEM.md §4) are firmly in place, strictly isolated, and thoroughly tested against real PostgreSQL 18 databases. The integration test suite grew from 24 tests across 7 files at Task 2.2.4 to 76 tests across 15 files at milestone close. Reconciled the `DbClient` factory signature discrepancy by removing the default parameter from `createPrismaQrTokenRepository(client: DbClient)` in `src/infrastructure/db/repositories/qr-token.repo.ts`, establishing 100% uniformity across all 11 repository factories. Addressed `prisma:error` logging via decision D-16.4 in `docs/DECISIONS.md`, deferring global test error output suppression to Phase 3 harness hardening to preserve active database diagnostics during development. Structural boundaries are intact with zero `@prisma/client` imports in `src/domain/`. Milestone 2.2 is complete and all 9 tasks in ROADMAP.md are marked ✅.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/infrastructure/db/repositories/qr-token.repo.ts` | Modified | Reconciled factory signature: removed `= defaultPrisma` default |
| `docs/DECISIONS.md` | Modified | Recorded D-16.4 (deferral of global test error log suppression to Phase 3); updated TOC and appendix count |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.9 as Complete; confirmed all 9 tasks in Milestone 2.2 are complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0042, updated ledger, advanced §7 to Milestone 2.3 |

**Commands Run:**
```bash
# Integration test suite (all 76 tests pass across 15 files)
pnpm test:integration
# Output:
# Test Files  15 passed (15)
# Tests       76 passed (76)
# Duration    42.40s

# Unit test suite (43 tests pass across 3 files)
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)
# Duration    144ms

# Typecheck (clean exit code 0)
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Production build (compiled successfully)
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0

# Check 2.1 — Ten ports in src/domain/
Get-ChildItem -Recurse -Path "src/domain" -Filter "*.repository.ts" | Select-Object FullName
# Output: Exactly 10 port files matching the 10 domain aggregates.

# Check 2.2 — Eleven adapters in src/infrastructure/db/repositories/
Get-ChildItem -Path "src/infrastructure/db/repositories" | Select-Object Name
# Output: Exactly 11 adapter files (10 aggregates + receipt.repo.ts).

# Check 2.3 — Repository test files in tests/integration/repositories/
Get-ChildItem -Path "tests/integration/repositories" | Select-Object Name
# Output: Exactly 10 repository integration test files covering all 11 adapters, plus harness.test.ts in parent.

# Check 2.4 — Zero @prisma/client imports in src/domain
Get-ChildItem -Recurse -Path "src/domain" -Filter "*.ts" | Select-String -Pattern "from ['\""]@prisma/client['\""]"
# Output: Clean. 0 matches (empty output).
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The integration suite passes (76+ tests) | PASS | 76/76 tests pass across 15 test files |
| 2 | The unit suite passes (43 tests) | PASS | 43/43 tests pass across 3 test files |
| 3 | The typecheck passes | PASS | `pnpm exec tsc --noEmit` exits with code 0 |
| 4 | The build passes | PASS | `pnpm build` completes successfully |
| 5 | Ten ports, one per aggregate | PASS | Check 2.1 returns exactly 10 domain port files |
| 6 | Eleven adapters in infrastructure | PASS | Check 2.2 returns exactly 11 adapter files |
| 7 | Every repository has a real integration test | PASS | Check 2.3 confirms 10 test files covering all repositories |
| 8 | The domain layer is clean of database imports | PASS | Check 2.4 returns 0 matches for `@prisma/client` |
| 9 | The DbClient factory signature is reconciled | PASS | Path (a) executed: `qr-token.repo.ts` has no default |
| 10 | The prisma:error suppression is reconciled | PASS | Path (b) executed: D-16.4 recorded in `docs/DECISIONS.md` |
| 11 | ROADMAP.md shows Milestone 2.2 fully ✅ | PASS | All 9 tasks in Milestone 2.2 marked ✅ Complete |
| 12 | PROGRESS.md has ENTRY-0042 (STRUCTURAL) and §7 advanced | PASS | Verified in file |

**Limits of the Milestone (What Was Not Proven / Limits Named):**
1. **Production atomicity of multi-row writes:** Not exercised by integration tests. The test harness wraps each test in an outer transaction; the nested `$transaction` wrapper in `createOrder`, `createServiceRequest`, and other multi-row methods is skipped in tests. True production atomicity is deferred to a dedicated real-PrismaClient test.
2. **DbClient factory signature reconciliation:** Reconciled via Path (a). `createPrismaQrTokenRepository` now requires `client: DbClient` explicitly with no default, unifying all 11 repository adapters across the platform.
3. **Prisma error logging in negative-path tests:** Reconciled via Path (b). Six test files emit cosmetic `prisma:error` blocks during expected constraint violation tests. Suppression was deferred to Phase 3 harness hardening via D-16.4 to preserve unmasked database diagnostic visibility during active development.
4. **Sequential test execution:** Vitest integration tests run with `fileParallelism: false` (introduced in Task 2.2.7) to prevent cross-file database deadlocks during transactional teardown/setup. This guarantees deterministic passes at the cost of wall-clock time (~42s total suite duration).

### ENTRY-0041 — 2026-10-16 — Task 2.2.8 — The payment ticket and receipt repositories

**Status:** PASS

**Task:** Task 2.2.8 — Add the payment ticket and receipt repositories.

**Summary:**
Delivered the single `PaymentRepository` port in `src/domain/payments/payment.repository.ts` uniting both `PaymentTicketRepository` and `ReceiptRepository` interfaces per SYSTEM.md §4 (payments as one module, PaymentTicket and Receipt as one aggregate tree). Implemented two dedicated infrastructure adapters: `createPrismaPaymentTicketRepository` in `src/infrastructure/db/repositories/payment-ticket.repo.ts` and `createPrismaReceiptRepository` in `src/infrastructure/db/repositories/receipt.repo.ts`. Both factory signatures use `client: DbClient` with no default value. The port defines the `PaymentState` domain enum (`PENDING`, `SUCCEEDED`, `FAILED`) mapped via bidirectional lookup tables. Money fields (`PaymentTicket.amount`, `Receipt.subtotal`, `Receipt.taxAmount`, `Receipt.tipAmount`, `Receipt.total`) strictly obey the string discipline: read via `.toFixed(2)` on Prisma's `Decimal` object without numeric coercion, and written directly from input strings. Delivered integration test coverage across all 13 test cases in `tests/integration/repositories/payment.test.ts`. `confirmTicket` transitions `PENDING` to `SUCCEEDED`, records `providerRef`, sets `confirmedAt = now()`, and returns `INVALID_STATE` on second confirmation. `failTicket` sets state = `FAILED`. `createReceipt` returns `CONFLICT` on duplicate `paymentTicketId` (caught via `isUniqueConstraintError`). Receipt venue isolation is enforced via relation filtering against `paymentTicket.venueId`.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Added `failureReason String?` to `PaymentTicket` model |
| `prisma/migrations/20261015211847_add_failure_reason_to_payment_tickets/migration.sql` | Created | Forward migration adding `failureReason` column to `payment_tickets` table |
| `src/domain/payments/payment.repository.ts` | Created | Single `PaymentRepository` port, sub-interfaces `PaymentTicketRepository` & `ReceiptRepository`, domain models with `failureReason`, `PaymentState` enum, and input types |
| `src/infrastructure/db/repositories/payment-ticket.repo.ts` | Created | Adapter factory `createPrismaPaymentTicketRepository(client: DbClient)` storing and mapping `failureReason` |
| `src/infrastructure/db/repositories/receipt.repo.ts` | Created | Adapter factory `createPrismaReceiptRepository(client: DbClient)` |
| `tests/integration/repositories/payment.test.ts` | Created | Integration tests covering all 13 test cases including `failureReason` round-trip |
| `docs/DECISIONS.md` | Modified | Added D-7.8 (Receipt inherits venue from ticket, not own column), updated TOC and appendix count |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.8 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0041, updated ledger, advanced §7 to Task 2.2.9 |

**Commands Run:**
```bash
# Forward migration generation and deployment
pnpm prisma migrate dev --name add_failure_reason_to_payment_tickets
# Output:
# Applying migration `20261015211847_add_failure_reason_to_payment_tickets`
# The following migration(s) have been created and applied from new schema changes:
#   20261015211847_add_failure_reason_to_payment_tickets/migration.sql

# Regenerate Prisma Client
pnpm prisma generate
# Output:
# Generated Prisma Client (v7.10.0)

# Specific repository integration tests (13 cases)
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/payment.test.ts
# Output:
# ✓ tests/integration/repositories/payment.test.ts (13 tests) 2419ms
# Test Files  1 passed (1)
# Tests       13 passed (13)

# Signature inspection verifying client: DbClient has no default value on both factories
Select-String -Path "src/infrastructure/db/repositories/payment-ticket.repo.ts" -Pattern "export function createPrismaPaymentTicketRepository"
# Output: src\infrastructure\db\repositories\payment-ticket.repo.ts:64:export function createPrismaPaymentTicketRepository(client: DbClient): PaymentTicketRepository {

Select-String -Path "src/infrastructure/db/repositories/receipt.repo.ts" -Pattern "export function createPrismaReceiptRepository"
# Output: src\infrastructure\db\repositories\receipt.repo.ts:45:export function createPrismaReceiptRepository(client: DbClient): ReceiptRepository {

# Structural check verifying zero @prisma/client imports in src/domain
Get-ChildItem -Recurse -Path "src/domain" -Filter "*.ts" | Select-String -Pattern "from ['\""]@prisma/client['\""]"
# Output: Clean. 0 matches (empty output).

# Complete integration test suite (growing count from 63 to 76 tests across 15 test files)
pnpm test:integration
# Output:
# Test Files  15 passed (15)
# Tests       76 passed (76)
# Duration    41.25s

# Unit tests (run separately)
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck (run separately)
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build (run separately)
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The port lives in `src/domain/payments/payment.repository.ts` with no `@prisma/client` import | PASS | Verified by search and code inspection |
| 2 | The adapters are `createPrismaPaymentTicketRepository(client: DbClient)` and `createPrismaReceiptRepository(client: DbClient)` with no default value | PASS | Verified by Select-String inspection |
| 3 | `PaymentState` is a domain enum mapped by bidirectional lookup tables | PASS | Explicit lookup tables in `payment-ticket.repo.ts` |
| 4 | `createTicket` writes a `PENDING` row; returned amount is string | PASS | Verified in integration test Case 1 |
| 5 | `findTicketById` returns ticket; missing ticket or cross-venue returns `NOT_FOUND` | PASS | Verified in integration test Cases 2 & 3 |
| 6 | `confirmTicket` sets `SUCCEEDED`, `confirmedAt`, and `providerRef` | PASS | Verified in integration test Case 4 |
| 7 | `confirmTicket` on an already-confirmed ticket returns `INVALID_STATE` | PASS | Verified in integration test Case 5 |
| 8 | `failTicket` sets `FAILED` and records `failureReason` | PASS | Verified in integration test Case 5 (asserted on entity and in DB) |
| 9 | `createReceipt` writes a receipt row with string money fields (`subtotal`, `taxAmount`, `tipAmount`, `total`) | PASS | Verified in integration test Case 6 |
| 10 | Second `createReceipt` for duplicate `paymentTicketId` returns `CONFLICT` | PASS | Verified in integration test Case 7 (caught via `isUniqueConstraintError`) |
| 11 | `findReceiptForTicket` returns receipt scoped to ticket/venue | PASS | Verified in integration test Case 8 |
| 12 | `findReceiptForTicket` on ticket with no receipt or cross-venue returns `NOT_FOUND` | PASS | Verified in integration test Cases 9 & 10 |
| 13 | Money fields round-trip as strings (`typeof === "string"`) without floating-point conversion | PASS | Verified in integration test Case 10 |
| 14 | `tipAmount` defaults to `"0.00"` when not supplied | PASS | Verified in integration test Case 11 |
| 15 | Cross-venue operations return `NOT_FOUND`, never `FORBIDDEN` | PASS | Verified in integration test Cases 3, 10, 12 & 13 |
| 16 | The whole integration suite passes (76 tests across 15 files) | PASS | 76/76 tests pass across 15 test files |

**Deviations:**
1. **The one-port-two-adapters decision:** SYSTEM.md §4 names `payments` as a single domain module. `PaymentTicket` and `Receipt` form a single aggregate tree (a ticket has zero or one receipt). The domain declares a unified `PaymentRepository` port (which extends both `PaymentTicketRepository` and `ReceiptRepository`). The infrastructure implements two factory functions (`createPrismaPaymentTicketRepository` and `createPrismaReceiptRepository`) because the two database entities have distinct row shapes, distinct Prisma models, and can be composed independently or unified into a single `PaymentRepository`.
2. **The $transaction branch:** Neither `createPrismaPaymentTicketRepository` nor `createPrismaReceiptRepository` requires multi-row transactional updates for their methods: each method operates on a single table row (`PaymentTicket` or `Receipt`), so Prisma's single-statement operations (`create`, `findFirst`, `update`) are atomic at the database engine level. No manual `$transaction` wrapper is needed.
3. **The PaymentState enum lookup table:** Domain enum `PaymentState` (`PENDING`, `SUCCEEDED`, `FAILED`) exactly mirrors the Prisma `PaymentState` enum, with bidirectional lookup maps `TO_PRISMA_STATE` and `TO_DOMAIN_STATE` guaranteeing compile-time exhaustiveness and decoupling the domain from Prisma.
4. **The factory signatures with no default:** Both factory signatures use `client: DbClient` with no default value. This matches Tasks 2.2.1, 2.2.2, 2.2.4, 2.2.5, 2.2.6, and 2.2.7, declining Task 2.2.3's `= defaultPrisma` default.
5. **The venue-scope design choice for Receipt (D-7.8):** Per D-7.8, the `Receipt` model has no `venueId` column in `prisma/schema.prisma`. A receipt inherits its venue from the `PaymentTicket` it belongs to. To uphold SYSTEM.md §9.1 and §9.3 multi-tenant isolation, the receipt adapter enforces venue scoping via relation join: `where: { paymentTicketId, paymentTicket: { venueId } }`. This ensures receipts can never be accessed across venue boundaries.
6. **Forward migration for failureReason (D-7.1 and BUILD.md §10.7):** To prevent silent loss of the reason passed to `failTicket(venueId, id, reason?: string)`, forward migration `20261015211847_add_failure_reason_to_payment_tickets` added `failureReason String?` to `payment_tickets`. Traced to D-7.1 (the bridge records every attempt) and BUILD.md §10.7. The adapter writes `failureReason`, maps it back to the domain `PaymentTicket`, and the integration test asserts that the reason round-trips.

**Noticed:**
1. `tests/integration/repositories/payment.test.ts` emits a `prisma:error` line during execution of Case 7 (`second createReceipt for the same paymentTicketId returns CONFLICT`). This is expected behavior when Vitest catches the Prisma P2002 unique constraint violation on `receipts_paymentTicketId_key`. `payment.test.ts` now joins the 6 files (`venue.test.ts`, `table.test.ts`, `room.test.ts`, `staff.test.ts`, `order.repo.test.ts`, and `payment.test.ts`) that produce expected `prisma:error` output during conflict/unique constraint tests, scheduled for log suppression in Task 2.2.9.

### ENTRY-0040 — 2026-10-16 — Task 2.2.7 — The service request repository

**Status:** PASS

**Task:** Task 2.2.7 — Add the service request repository.

**Summary:**
Delivered the `ServiceRequestRepository` port in `src/domain/requests/request.repository.ts`, the Prisma adapter `createPrismaServiceRequestRepository` in `src/infrastructure/db/repositories/request.repo.ts`, and full integration test coverage across all 13 test cases in `tests/integration/repositories/request.test.ts`. The port establishes pure domain types for `ServiceRequest` and `RequestStateChange`, domain enums `RequestState` and `HotelService` (9 hotel services), and strongly typed `ServiceRequestDetails` avoiding `any`. The adapter wraps creation and state transitions in transactions, writes reasons for cancellation and decline into `request_state_changes.note`, deserializes `detailsJson` into domain objects, filters at the database level by venue, room, service type, and state, and strictly isolates all operations by `venueId`.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/domain/requests/request.repository.ts` | Created | `ServiceRequestRepository` port, domain interfaces, enums, inputs |
| `src/infrastructure/db/repositories/request.repo.ts` | Created | Factory `createPrismaServiceRequestRepository` adapter |
| `tests/integration/repositories/request.test.ts` | Created | Integration tests covering all 13 test cases |
| `vitest.integration.config.ts` | Modified | Added `fileParallelism: false` to prevent cross-file database lock deadlocks |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.7 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0040, updated ledger, advanced §7 to Task 2.2.8 |

**Commands Run:**
```bash
# Specific repository integration tests (13 cases)
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/request.test.ts
# Output:
# ✓ tests/integration/repositories/request.test.ts (13 tests) 2487ms
# Test Files  1 passed (1)
# Tests       13 passed (13)

# Signature inspection verifying client: DbClient has no default value
powershell -Command "Select-String -Path 'src/infrastructure/db/repositories/request.repo.ts' -Pattern 'export function createPrismaServiceRequestRepository'"
# Output:
# src\infrastructure\db\repositories\request.repo.ts:128:export function createPrismaServiceRequestRepository(client: DbClient): ServiceRequestRepository {

# Structural check verifying zero @prisma/client imports outside infrastructure/db
powershell -Command "Get-ChildItem -Recurse -Path 'src' -Filter '*.ts' | Select-String -Pattern 'from [''\""]@prisma/client[''\""]' | Select-Object Path, Line"
# Output: Clean. Only files in src/infrastructure/db/ import from @prisma/client.

# Complete integration test suite (growing count to 63 tests across 14 test files)
pnpm test:integration
# Output:
# Test Files  14 passed (14)
# Tests       63 passed (63)

# Unit tests (run separately)
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck (run separately)
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build (run separately)
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The port lives in `src/domain/requests/` with no `@prisma/client` import | PASS | Verified by PowerShell search and code inspection |
| 2 | The adapter is `createPrismaServiceRequestRepository(client: DbClient)`, no default | PASS | Verified by string inspection of `request.repo.ts:128` |
| 3 | `RequestState` and `HotelService` are domain enums, mapped by lookup table | PASS | Explicit bidirectional lookup tables in `request.repo.ts` |
| 4 | create writes request and first RequestStateChange (SUBMITTED) | PASS | create writes request and first RequestStateChange (SUBMITTED) — the two rows exist after a successful call (Case 1). The atomicity of the write is provided by the $transaction wrapper on the production path; the test runs inside the harness's outer transaction and does not exercise the inner $transaction. Atomicity will be proven in Task 2.2.9's verification pass with the real PrismaClient. |
| 5 | `findById` returns request with details deserialized correctly | PASS | Verified in integration test Case 2 |
| 6 | `listForVenue` returns requests for the venue | PASS | Verified in integration test Case 3 |
| 7 | `listForVenue` with `serviceType: HOUSEKEEPING` returns only housekeeping requests | PASS | Verified in integration test Case 4 |
| 8 | `listForVenue` with `state: SUBMITTED` returns only submitted requests | PASS | Verified in integration test Case 5 |
| 9 | `listForVenue` returns `ok([])` for a venue with no requests | PASS | Verified in integration test Case 6 |
| 10 | `listForRoom` returns only requests for that room | PASS | Verified in integration test Case 7 |
| 11 | `advanceState` writes new state and a new `RequestStateChange` | PASS | Verified in integration test Case 8 |
| 12 | `cancel` writes `CANCELLED` and `RequestStateChange` with reason in note | PASS | Verified in integration test Case 9 |
| 13 | `decline` writes `DECLINED` and `RequestStateChange` with reason in note | PASS | Verified in integration test Case 10 |
| 14 | `updateDetails` writes new detailsJson and subsequent `findById` returns it | PASS | Verified in integration test Case 11 |
| 15 | Cross-venue reads and operations return `NOT_FOUND`, never `FORBIDDEN` | PASS | Verified in integration test Cases 12 and 13 |
| 16 | The whole integration suite passes (63 tests across 14 files) | PASS | 63/63 tests pass across 14 test files |
| 17 | Unit tests, typecheck, and build pass | PASS | 43 unit tests pass; `tsc` exit 0; `next build` exit 0 |

**Deviations from Contract:**
- **The $transaction Branch:** The adapter checks whether the client supports `$transaction` before wrapping writes in `create`, `advanceState`, `cancel`, and `decline`. In production with PrismaClient, the write is atomic; in test transactions with TransactionClient, it executes directly within the outer test transaction. As in Task 2.2.6, the tests run inside the harness's outer transaction, so the inner $transaction is not exercised. The production atomicity of create, advanceState, cancel, and decline is provided by the $transaction wrapper on the production path. Proving it requires a test that calls the adapter with the real PrismaClient; this is deferred to Task 2.2.9's verification pass or a follow-up.
- **Details Domain Shape:** `ServiceRequestDetails` is typed as `Record<string, string | number | boolean | null | string[]>` to ensure strong compile-time typing and avoid `any`.
- **Enum Lookup Tables:** Mappings between Prisma and domain enums for `RequestState` and `HotelService` use explicit bidirectional lookup dictionaries (`PRISMA_TO_DOMAIN_*` and `DOMAIN_TO_PRISMA_*`) rather than type casts, ensuring compile-time type exhaustiveness.
- **Factory Signature:** The adapter factory signature uses `client: DbClient` with no default, matching Tasks 2.2.1 through 2.2.6.
- **Integration Test Parallelism:** Added `fileParallelism: false` to `vitest.integration.config.ts` to execute database integration test files sequentially, preventing PostgreSQL transaction deadlocks (40P01) caused by table-level exclusive locks during database cleanup. The deadlocks first appeared at Task 2.2.7, when this repository's tests added a third file opening transactions against rooms and service_requests in parallel with the existing repository tests. The fix is suite-wide; it applies to every integration test file.

**Noticed but Out of Scope:**
- `tests/integration/repositories/request.test.ts` produced zero `prisma:error` lines because negative tests are cross-venue reads and lookups returning `null` rather than triggering unique-constraint violations.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change | No change |
| DECISIONS.md  | No | Conforms to D-5.1 to D-5.7, D-10.2 | No change |
| SYSTEM.md     | No | Conforms to §2, §4, §10, §11.1, §15.4 | No change |
| BUILD.md      | No | Follows testing and coding standards | No change |
| ROADMAP.md    | Yes | Task 2.2.7 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0040 added | Updated |

**Contradiction Check:**
None found. Architecture strictly respects ports-and-adapters; zero Prisma imports in domain; details shape is typed without `any`; enums mapped via lookup tables; cross-venue queries return NOT_FOUND; module path is `src/domain/requests/`.

**Next:**
Task 2.2.8 — Add the payment ticket and receipt repositories in `src/domain/payments/` and `src/infrastructure/db/repositories/`.

**Awaiting Human Verification:** NO

---

### ENTRY-0039 — 2026-10-16 — Task 2.2.6 — The order repository

**Status:** PASS

**Task:** Task 2.2.6 — Add the order repository (create, read, list, advance, cancel, idempotency contract).

**Summary:**
Delivered the `OrderRepository` port in `src/domain/orders/order.repository.ts`, the Prisma adapter `createPrismaOrderRepository` in `src/infrastructure/db/repositories/order.repo.ts`, and full integration test coverage across all 13 test cases in `tests/integration/repositories/order.repo.test.ts`. The port establishes pure domain types for `Order`, `OrderItem`, and `OrderStateChange`, defining domain enums `OrderState` and `PlaceType`. The adapter strictly enforces the idempotency contract (SYSTEM.md §9.7, D-4.12): `create` writes the order, items, and initial `OrderStateChange` (`PLACED`) in a single transaction; on Prisma P2002 on `orders_idempotencyKey_key` (detected via `isUniqueConstraintError`), it reads the existing order via `findByIdempotencyKey` and returns `ok(existingOrder)` without creating duplicate rows. Added forward migration `20261015204426_add_note_to_order_state_change` per D-4.7 and BUILD.md §10.7 to record cancellation reasons in `order_state_changes.note`. Money and frozen item fields are written as-is from input and read as decimal strings (`.toFixed(2)`).

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Added `note String?` to `OrderStateChange` model per D-4.7 |
| `prisma/migrations/20261015204426_add_note_to_order_state_change/migration.sql` | Created | Forward migration adding `note` column to `order_state_changes` |
| `src/domain/orders/order.repository.ts` | Created | OrderRepository port with pure domain entities and inputs |
| `src/infrastructure/db/repositories/order.repo.ts` | Created | Factory `createPrismaOrderRepository` adapter enforcing idempotency |
| `tests/integration/repositories/order.repo.test.ts` | Modified | Comprehensive integration tests covering all 13 test cases |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.6 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0039, updated ledger, advanced §7 to Task 2.2.7 |

**Commands Run:**
```bash
# Forward migration generation and deployment
pnpm prisma migrate dev --name add_note_to_order_state_change
# Output:
# Applying migration `20261015204426_add_note_to_order_state_change`
# The following migration(s) have been created and applied from new schema changes:
#   20261015204426_add_note_to_order_state_change/migration.sql

# Specific repository integration tests (13 cases)
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/order.repo.test.ts
# Output:
# ✓ tests/integration/repositories/order.repo.test.ts (13 tests) 10549ms
# Test Files  1 passed (1)
# Tests       13 passed (13)

# Signature inspection verifying client: DbClient has no default value
powershell -Command "Select-String -Path 'src/infrastructure/db/repositories/order.repo.ts' -Pattern 'export function createPrismaOrderRepository'"
# Output:
# src\infrastructure\db\repositories\order.repo.ts:141:export function createPrismaOrderRepository(client: DbClient): OrderRepository {

# Structural check verifying zero @prisma/client imports outside infrastructure/db
powershell -Command "Get-ChildItem -Recurse -Path 'src' -Filter '*.ts' | Select-String -Pattern 'from [''\""]@prisma/client[''\""]' | Select-Object Path, Line"
# Output: Clean. Only files in src/infrastructure/db/ import from @prisma/client.

# Complete integration test suite (growing count from 37 to 50)
pnpm test:integration
# Output:
# Test Files  13 passed (13)
# Tests       50 passed (50)

# Unit tests (run separately)
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck (run separately)
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build (run separately)
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The port lives in `src/domain/orders/` with no `@prisma/client` import | PASS | Verified by PowerShell search and code inspection |
| 2 | The adapter is `createPrismaOrderRepository(client: DbClient)`, no default | PASS | Verified by string inspection of `order.repo.ts:141` |
| 3 | `OrderState` and `PlaceType` are domain enums, mapped by lookup table | PASS | Explicit bidirectional lookup tables in `order.repo.ts` |
| 4 | create writes order, items, and first OrderStateChange (PLACED) | PASS | create writes order, items, and first OrderStateChange (PLACED) — the three rows exist after a successful call (Case 1). The atomicity of the write is provided by the $transaction wrapper on the production path; the test runs inside the harness's outer transaction and does not exercise the inner $transaction. Atomicity will be proven in Task 2.2.9's verification pass with the real PrismaClient. |
| 5 | Second `create` with same `idempotencyKey` returns existing order, no duplicate row | PASS | Verified in integration test Case 2 (1 order row in DB) |
| 6 | `create` with different `idempotencyKey` creates second distinct order | PASS | Verified in integration test Case 3 |
| 7 | `findById` returns order with items and state changes | PASS | Verified in integration test Case 4 |
| 8 | `findByIdempotencyKey` returns existing order | PASS | Verified in integration test Case 5 |
| 9 | `listForVenue` returns orders and supports state filtering; returns `ok([])` on empty | PASS | Verified in integration test Cases 6 and 7 |
| 10 | `listForGuestSession` returns orders for session; returns `ok([])` on empty | PASS | Verified in integration test Case 8 |
| 11 | `advanceState` writes new state and a new `OrderStateChange` | PASS | Verified in integration test Case 9 |
| 12 | `cancel` writes `CANCELLED` and `OrderStateChange` with reason note | PASS | Verified in integration test Case 10 |
| 13 | Money fields round-trip as decimal strings without floating-point math | PASS | Verified in integration test Case 11 (`typeof === "string"`) |
| 14 | Cross-venue reads and operations return `NOT_FOUND`, never `FORBIDDEN` | PASS | Verified in integration test Cases 12 and 13 |
| 15 | The whole integration suite passes (50 tests) | PASS | 50/50 tests pass across 13 test files |
| 16 | Unit tests, typecheck, and build pass | PASS | 43 unit tests pass; `tsc` exit 0; `next build` exit 0 |

**Deviations from Contract:**
- **The $transaction Branch:** The adapter checks whether the client supports $transaction before wrapping the write. In production, the client is the PrismaClient, which supports $transaction, and the write is atomic. In the integration test, the client is the test's Prisma.TransactionClient (the inner client inside the harness's outer transaction), which does not support nested $transaction; the write runs inside the test's outer transaction and rolls back with it. The production atomicity is therefore not exercised by the test — it is the correct path, but the test does not prove it. Proving it requires a test that calls the adapter with the real PrismaClient and asserts the three rows exist in the database, then cleans up. This is deferred to Task 2.2.9's verification pass or a follow-up.
- **Forward Migration for Cancellation Reason:** Added forward migration `20261015204426_add_note_to_order_state_change` (`ALTER TABLE "order_state_changes" ADD COLUMN "note" TEXT;`) traced to D-4.7 (cancellation reasons must be recorded with the transition) and BUILD.md §10.7 (never edit applied migrations; add forward migrations).
- **The Two Halves of Money-as-String:** On the read path, `Decimal(10, 2)` columns are converted via `.toFixed(2)` (and `Decimal(5, 4)` via `.toFixed(4)`) on Prisma's Decimal object, which returns a string without coercing to a JavaScript number. On the write path, the adapter accepts strings in `CreateOrderInput` and `CreateOrderItemInput` and passes them to Prisma without conversion, strictly avoiding `Number(...)`, `.toNumber()`, or floating-point arithmetic.
- **Enum Lookup Tables:** Mappings between Prisma and domain enums for `OrderState` and `PlaceType` use explicit bidirectional lookup dictionaries (`PRISMA_TO_DOMAIN_*` and `DOMAIN_TO_PRISMA_*`) rather than type casts, ensuring compile-time type exhaustiveness.
- **Factory Signature:** The adapter factory signature uses `client: DbClient` with no default, matching Tasks 2.2.1, 2.2.2, 2.2.4, and 2.2.5.

**Noticed but Out of Scope:**
- `tests/integration/repositories/order.repo.test.ts` emits a `prisma:error` log to stdout/stderr when Case 2 triggers a unique constraint violation on `orders_idempotencyKey_key`. This is expected and caught by the adapter, joining `venue.test.ts`, `table.test.ts`, `room.test.ts`, and `staff.test.ts` on the list of test files producing `prisma:error` logs scheduled for suppression in Task 2.2.9.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change | No change |
| DECISIONS.md  | No | Conforms to D-4.1, D-4.7, D-4.12, D-10.2 | No change |
| SYSTEM.md     | No | Conforms to §2, §5, §9.7, §11.1, §15.4 | No change |
| BUILD.md      | No | Follows testing and coding standards | No change |
| ROADMAP.md    | Yes | Task 2.2.6 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0039 added | Updated |

**Contradiction Check:**
None found. Architecture strictly respects ports-and-adapters; zero Prisma imports in domain; idempotency contract fully implemented; money fields are strings; enums mapped via lookup tables; cross-venue queries return NOT_FOUND; forward migration cleanly applied.

**Next:**
Task 2.2.7 — Add the service request repository in `src/domain/service-requests/` and `src/infrastructure/db/repositories/`.

**Awaiting Human Verification:** NO

---

### ENTRY-0038 — 2026-10-16 — Task 2.2.5 — The menu repository

**Status:** PASS

**Task:** Task 2.2.5 — Add the menu repository.

**Summary:**
Delivered the `MenuRepository` port in `src/domain/menu/menu.repository.ts`, the Prisma adapter `createPrismaMenuRepository` in `src/infrastructure/db/repositories/menu.repo.ts`, and full integration test coverage across all 13 test cases in `tests/integration/repositories/menu.test.ts`. The port establishes pure domain types for `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, and `MenuItemWithModifiers`, defining domain enums `MenuItemState` and `ModifierChoiceType`. The adapter strictly practices the money-as-string discipline (BUILD.md §7.1): on read, `Decimal(10, 2)` columns are converted via `.toFixed(2)` to guarantee two decimal places, never calling `Number(...)`; on write, decimal strings are accepted in the input and passed directly to Prisma without conversion. Queries are scoped by `venueId` (SYSTEM.md §15.4), `setItemState` updates item state without deleting rows (D-4.2) and is idempotent, and empty category/item queries return `ok([])`.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/domain/menu/menu.repository.ts` | Created | MenuRepository port with pure domain types and money-as-string |
| `src/infrastructure/db/repositories/menu.repo.ts` | Created | Factory `createPrismaMenuRepository` adapter with enum lookup tables |
| `tests/integration/repositories/menu.test.ts` | Created | Integration tests for MenuRepository covering 13 test cases |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.5 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0038, updated ledger, advanced §7 to Task 2.2.6 |

**Commands Run:**
```bash
# Specific repository integration tests (13 cases)
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/menu.test.ts
# Output:
# ✓ tests/integration/repositories/menu.test.ts (13 tests) 2071ms
# Test Files  1 passed (1)
# Tests       13 passed (13)

# Signature inspection verifying client: DbClient has no default value
Select-String -Path "src/infrastructure/db/repositories/menu.repo.ts" -Pattern "export function createPrismaMenuRepository"
# Output:
# src\infrastructure\db\repositories\menu.repo.ts:151:export function createPrismaMenuRepository(

# Structural check verifying zero @prisma/client imports outside infrastructure/db
Get-ChildItem -Recurse -Path "src" -Filter "*.ts" | Select-String -Pattern "from ['\""]@prisma/client['\""]" | Select-Object Path, Line
# Output: Clean. Only files in src/infrastructure/db/ import from @prisma/client.

# Complete integration test suite
pnpm test:integration
# Output:
# Test Files  13 passed (13)
# Tests       37 passed (37)

# Unit tests (run separately)
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck (run separately)
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build (run separately)
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | The port lives in `src/domain/menu/` with no `@prisma/client` import | PASS | Verified by structural PowerShell check and code inspection |
| 2 | The adapter is `createPrismaMenuRepository(client: DbClient)`, no default | PASS | Verified by string inspection of `menu.repo.ts:151` |
| 3 | `MenuItemState` and `ModifierChoiceType` are domain enums, mapped by lookup table, not cast | PASS | Explicit bidirectional lookup tables in `menu.repo.ts` |
| 4 | `MenuItem.price` and `ModifierOption.additionalPrice` are strings in port; adapter never calls `Number(...)` | PASS | Explicitly asserted via `typeof === "string"` in cases 4, 5, 8, 9 |
| 5 | `listCategories` and `listItemsForCategory` return `ok([])` on empty result | PASS | Verified in integration test cases 1 and 6 |
| 6 | `getItemWithModifiers` returns the item with its groups and options | PASS | Verified in integration test case 9 |
| 7 | `setItemState` writes state, leaves row intact, and is idempotent | PASS | Verified in integration test cases 10, 11, and 12 |
| 8 | A cross-venue read returns `NOT_FOUND`, not `FORBIDDEN` | PASS | Verified in integration test case 13 |
| 9 | The whole integration suite passes | PASS | 37/37 tests pass across 13 test files |
| 10 | Unit tests, typecheck, and build pass | PASS | 43 unit tests pass; `tsc` exit 0; `next build` exit 0 |

**Deviations from Contract:**
- On the read path, the adapter maps each Decimal column by calling .toFixed(2) on Prisma's Decimal object, which returns a string. It does not call Number(...) or .toNumber(), and it does not perform floating-point arithmetic. On the write path, the adapter accepts a string in the input and passes it to Prisma as-is, without conversion.
- **Enum Lookup Tables:** Mappings between Prisma and domain enums for `MenuItemState` and `ModifierChoiceType` use explicit bidirectional lookup dictionaries (`PRISMA_TO_DOMAIN_*` and `DOMAIN_TO_PRISMA_*`) rather than type casts, ensuring compile-time type exhaustiveness.
- **Modifier Writes Context:** `createModifierGroup` and `createModifierOption` accept `menuItemId` and `modifierGroupId` directly without requiring `venueId` in their input, because modifier entities are scoped to their parent menu item / group. The domain layer confirms venue ownership of the parent menu item prior to invoking these methods.
- **Factory Signature:** The adapter factory signature uses `client: DbClient` with no default, matching Tasks 2.2.1, 2.2.2, and 2.2.4.

**Noticed but Out of Scope:**
- Cosmetic `prisma:error` logged to stderr during negative-path conflict tests in `venue.test.ts`, `table.test.ts`, `room.test.ts`, and `staff.test.ts` remains scheduled for suppression in Task 2.2.9. The menu integration test (`menu.test.ts`) produced zero `prisma:error` lines because cross-venue lookups query `where: { id, venueId }` and return `null` rather than throwing unique constraint violations. The list of test files producing `prisma:error` will be addressed collectively during Task 2.2.9.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change | No change |
| DECISIONS.md  | No | Conforms to D-4.1, D-4.2, D-4.3, D-10.1, D-10.2 | No change |
| SYSTEM.md     | No | Conforms to §2, §3, §4, §5, §11.1, §11.3, §15.4 | No change |
| BUILD.md      | No | Follows testing and coding standards | No change |
| ROADMAP.md    | Yes | Task 2.2.5 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0038 added | Updated |

**Contradiction Check:**
None found. Architecture strictly respects ports-and-adapters; zero Prisma imports in domain; money fields are strings; enums mapped via lookup tables; cross-venue queries return NOT_FOUND; item states updated without deleting rows.

**Next:**
Task 2.2.6 — Add the order repository (create, read, list, advance, cancel, and idempotency contract) in `src/domain/orders/` and `src/infrastructure/db/repositories/`.

**Awaiting Human Verification:** NO

### ENTRY-0037 — 2026-10-16 — Task 2.2.4 — The staff and staff session repositories

**Status:** PASS

**Task:** Task 2.2.4 — Add the staff and staff session repositories.

**Summary:**
Delivered the `StaffRepository` port in `src/domain/auth/staff.repository.ts`, the `StaffSessionRepository` port in `src/domain/auth/staff-session.repository.ts`, their Prisma adapters `createPrismaStaffRepository` and `createPrismaStaffSessionRepository` in `src/infrastructure/db/repositories/staff.repo.ts` and `src/infrastructure/db/repositories/staff-session.repo.ts`, and full integration test suites in `tests/integration/repositories/staff.test.ts` and `tests/integration/repositories/staff-session.test.ts`. The ports employ two shapes for staff (`StaffMember` public shape without credentials, `StaffMemberWithCredentials` carrying `passwordHash` strictly for `findByUsername`), map roles via explicit bidirectional lookup tables without casts, and keep password hashes out of general reads and writes (SYSTEM.md §15.3). `StaffSessionRepository.listActiveForStaff` filters by `endedAt: null` directly at the database level, and `endAllForStaff` terminates all active sessions in one query returning `Result<number>`.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/domain/auth/staff.repository.ts` | Created | StaffRepository port with StaffMember and StaffMemberWithCredentials shapes |
| `src/domain/auth/staff-session.repository.ts` | Created | StaffSessionRepository port with session lifecycle methods |
| `src/infrastructure/db/repositories/staff.repo.ts` | Created | Factory `createPrismaStaffRepository` adapter implementing StaffRepository |
| `src/infrastructure/db/repositories/staff-session.repo.ts` | Created | Factory `createPrismaStaffSessionRepository` adapter implementing StaffSessionRepository |
| `tests/integration/repositories/staff.test.ts` | Created | Integration tests for StaffRepository (9 test cases) |
| `tests/integration/repositories/staff-session.test.ts` | Created | Integration tests for StaffSessionRepository (8 test cases across 4 test blocks) |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.4 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0037, updated ledger, advanced §7 to Task 2.2.5 |

**Commands Run:**
```bash
# Specific repository integration tests
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/staff.test.ts tests/integration/repositories/staff-session.test.ts
# Output:
# ✓ tests/integration/repositories/staff-session.test.ts (4 tests) 2246ms
# ✓ tests/integration/repositories/staff.test.ts (5 tests) 2268ms
# Test Files  2 passed (2)
# Tests       9 passed (9)

# Structural import check for zero @prisma/client leaks outside infrastructure/db
Get-ChildItem -Recurse -Path "src" -Filter "*.ts" | Select-String -Pattern "from ['\""]@prisma/client['\""]" | Select-Object Path, Line
# Output: Clean. Only files in src/infrastructure/db/ import from @prisma/client.

# Complete integration test suite
pnpm test:integration
# Output:
# Test Files  12 passed (12)
# Tests       24 passed (24)

# Unit tests
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Both ports live in `src/domain/auth/` with no `@prisma/client` import | PASS | Verified by structural PowerShell check and code inspection |
| 2 | Both adapters are `createPrisma<Name>Repository(client: DbClient)` | PASS | Defined in `staff.repo.ts` and `staff-session.repo.ts` without default values |
| 3 | `roles` is a domain `StaffRole[]` in the port, not a Prisma enum array | PASS | Explicit lookup table mapping between domain and Prisma enums |
| 4 | `findByUsername` returns `StaffMemberWithCredentials`; every other read returns `StaffMember` | PASS | Verified in port types and integration tests |
| 5 | `setState` to `DEACTIVATED` writes the state and does not delete the row | PASS | Verified in `tests/integration/repositories/staff.test.ts` |
| 6 | A duplicate `[venueId, username]` returns `CONFLICT` | PASS | Caught via `isUniqueConstraintError` and verified in integration tests |
| 7 | `listActiveForStaff` filters by `endedAt: null` at the database level | PASS | Verified in query structure of `staff-session.repo.ts` |
| 8 | `endAllForStaff` returns `ok(number)` and ends every active session | PASS | Verified in `tests/integration/repositories/staff-session.test.ts` |
| 9 | The whole integration suite passes | PASS | 24/24 tests pass across 12 test files |
| 10 | Unit tests, typecheck, and build pass | PASS | 43 unit tests pass; `tsc` exit 0; `next build` exit 0 |

**Deviations from Contract:**
The adapter factory signature uses client: DbClient with no default. This matches Tasks 2.2.1 and 2.2.2, and declines Task 2.2.3's default. The divergence will be reconciled in Task 2.2.9.

endAllForStaff returns Result<number> (the count of ended sessions), not a Result<StaffSession[]>. This is the first repository method in the milestone to return a count rather than a row. Task 3.2.5 (password-change invalidation) and Task 3.2.6 (single-session enforcement) consume the count.

**Noticed but Out of Scope:**
- Cosmetic `prisma:error` logged to stderr during negative-path conflict tests in `venue.test.ts`, `table.test.ts`, `room.test.ts`, and `staff.test.ts` remains scheduled for suppression in Task 2.2.9, when the milestone close runs the full integration suite and cleans its output.
The list of test files producing cosmetic prisma:error output will grow as more negative-path tests are added in Tasks 2.2.5 through 2.2.8. Task 2.2.9's suppression will cover the full set.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change | No change |
| DECISIONS.md  | No | Conforms to D-3.1 through D-3.8, D-10.1, D-10.2 | No change |
| SYSTEM.md     | No | Conforms to §4, §5, §6.3, §7, §11.1, §15.3 | No change |
| BUILD.md      | No | Follows testing and coding standards | No change |
| ROADMAP.md    | Yes | Task 2.2.4 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0037 added | Updated |

**Contradiction Check:**
None found. Architecture strictly respects ports-and-adapters; zero Prisma imports in domain; roles mapped via lookup table; passwordHash strictly isolated to findByUsername; sessions ended without deletions; DB-level filtering on endedAt.

**Next:**
Task 2.2.5 — Add the menu repositories in `src/domain/menu/` and `src/infrastructure/db/repositories/`.

**Awaiting Human Verification:** NO

### ENTRY-0036 — 2026-10-16 — Task 2.2.3 — The QR token repository

**Status:** PASS

**Task:** Task 2.2.3 — Add the QR token repository.

**Summary:**
Delivered the `QrTokenRepository` port in `src/domain/qr/qr-token.repository.ts`, the Prisma adapter `createPrismaQrTokenRepository` in `src/infrastructure/db/repositories/qr-token.repo.ts`, and full integration test coverage in `tests/integration/repositories/qr-token.test.ts`. The port models place references as a discriminated union on `placeType` (TABLE, ROOM, COUNTER) ensuring compile-time invariants. The adapter enforces the QR implementation contract (SYSTEM.md §8.6 and D-1.2): generates opaque UUID tokens, never deletes rows on revocation (`state = REVOKED`, `revokedAt = now()`), returns `DomainErrorCode.INVALID_STATE` on attempting to revoke an already-revoked token (SYSTEM.md §5, §16.1), and supports generating distinct non-reused tokens for the same place.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/domain/qr/qr-token.repository.ts` | Created | QrTokenRepository port with discriminated union on placeType |
| `src/infrastructure/db/repositories/qr-token.repo.ts` | Created | Factory `createPrismaQrTokenRepository` adapter implementing QrTokenRepository |
| `tests/integration/repositories/qr-token.test.ts` | Created | Integration tests for QrTokenRepository |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.3 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0036 and updated ledger & snapshot |

**Commands Run:**
```bash
# Specific repository integration test
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/qr-token.test.ts
# Output:
# ✓ tests/integration/repositories/qr-token.test.ts (4 tests) 1956ms
# Test Files  1 passed (1)
# Tests       4 passed (4)

# Complete integration test suite
pnpm test:integration
# Output:
# Test Files  10 passed (10)
# Tests       15 passed (15)

# Unit tests
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | QrToken port defined in `src/domain/qr/` with pure domain types | PASS | `src/domain/qr/qr-token.repository.ts` has no Prisma imports |
| 2 | Place reference modeled as discriminated union on `placeType` | PASS | Expressed in `GenerateTokenInput` and `QrToken` |
| 3 | Token generated as opaque UUID | PASS | Generated via Prisma `@default(uuid())` and verified with regex |
| 4 | Revocation sets state = REVOKED and revokedAt = now() without deleting row | PASS | Row remains readable via `findById` |
| 5 | Second revoke on already-revoked token returns INVALID_STATE | PASS | Verified in integration tests |
| 6 | Tokens for different places are never confused | PASS | Verified with Table 1 and Table 2 in integration test |
| 7 | Revoked token is never reused on subsequent generation | PASS | New token generated with distinct UUID |
| 8 | Whole integration suite passes | PASS | 15/15 tests pass across 10 test files |
| 9 | Unit tests, typecheck, and build pass | PASS | 43 unit tests pass; `tsc` exit 0; `next build` exit 0 |

**Deviations from Contract:**
- The port models place references as a discriminated union on `placeType` (`PlaceType.TABLE` with `tableId`, `PlaceType.ROOM` with `roomId`, `PlaceType.COUNTER` with `counterId`) rather than three loose nullable fields. This enforces the domain invariant at compile time that exactly one place foreign key is populated per token, as required by SYSTEM.md §8.6 and §11.1.
- Token string generation is delegated to Prisma's `@default(uuid())` in the database rather than generated manually via `crypto.randomUUID()` in the adapter, ensuring clean consistency with the schema definition.
- Because the token is generated by the database, the adapter reads the token back from the returned row. Callers (including the QR image generator in Task 4.1.4) receive the token from the domain object returned by generate. No caller needs to generate a token itself.
- Revoking an already-revoked token returns `DomainErrorCode.INVALID_STATE` (which maps to HTTP 409) rather than `CONFLICT`, tracing directly to SYSTEM.md §5 and §16.1 which explicitly cite "trying to revoke a token that is already revoked" as the canonical example of `INVALID_STATE`.
- createPrismaQrTokenRepository takes client: DbClient = defaultPrisma (the default is new; Tasks 2.2.1 and 2.2.2 take a required client). The default is for convenience at production call sites; the integration test still passes the transaction client explicitly. The default will be reconciled across all adapters — either every adapter takes a required client, or every adapter takes a default — in Task 2.2.9.

**Noticed but Out of Scope:**
- Cosmetic `prisma:error` logged to stderr during negative-path conflict tests in `venue.test.ts`, `table.test.ts`, and `room.test.ts` remains scheduled for suppression in Task 2.2.9, when the milestone close runs the full integration suite and cleans its output.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change | No change |
| DECISIONS.md  | No | Conforms to D-1.2, D-16.2 | No change |
| SYSTEM.md     | No | Conforms to §4, §5, §8.6, §11.1 | No change |
| BUILD.md      | No | Follows testing and coding standards | No change |
| ROADMAP.md    | Yes | Task 2.2.3 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0036 added | Updated |

**Contradiction Check:**
None found. Architecture strictly respects ports-and-adapters; domain does not import database; discriminated union enforces place integrity; tokens are permanent UUIDs; revocation updates state and never deletes rows.

**Next:**
Task 2.2.4 — Add the staff and staff session repositories in `src/domain/auth/` and `src/infrastructure/db/repositories/`.

**Awaiting Human Verification:** NO

### ENTRY-0035 — 2026-10-16 — Task 2.2.2 — The table and room repositories

**Status:** PASS

**Task:** Task 2.2.2 — Add the table and room repositories.

**Summary:**
Delivered the `TableRepository` port interface in `src/domain/organization/table.repository.ts`, the `RoomRepository` port interface in `src/domain/organization/room.repository.ts`, their Prisma adapters `createPrismaTableRepository` and `createPrismaRoomRepository` in `src/infrastructure/db/repositories/table.repo.ts` and `src/infrastructure/db/repositories/room.repo.ts`, and their integration test suites in `tests/integration/repositories/table.test.ts` and `tests/integration/repositories/room.test.ts`. Every method enforces tenancy by accepting `venueId` first per D-10.2, returns `Result<T>` with domain error codes, and maps domain states (`TableState`, `RoomState`) without coupling ports to Prisma. Integration tests prove non-existent lookups return `NOT_FOUND`, creates persist valid records, reads return correct data structures, state transitions succeed, and duplicate composite numbers `[venueId, number]` return `CONFLICT`.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `src/domain/organization/table.repository.ts` | Created | TableRepository port interface and domain TableState enum |
| `src/domain/organization/room.repository.ts` | Created | RoomRepository port interface and domain RoomState enum |
| `src/infrastructure/db/repositories/table.repo.ts` | Created | Factory `createPrismaTableRepository` adapter implementing TableRepository |
| `src/infrastructure/db/repositories/room.repo.ts` | Created | Factory `createPrismaRoomRepository` adapter implementing RoomRepository |
| `tests/integration/repositories/table.test.ts` | Created | Integration tests for TableRepository (create, findById, findByNumber, listForVenue, setState, NOT_FOUND, CONFLICT) |
| `tests/integration/repositories/room.test.ts` | Created | Integration tests for RoomRepository (create, findById, findByNumber, listForVenue, setState, NOT_FOUND, CONFLICT) |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.2 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0035 and updated ledger & snapshot |

**Commands Run:**
```bash
# Specific repository integration tests
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/table.test.ts tests/integration/repositories/room.test.ts
# Output:
# ✓ tests/integration/repositories/table.test.ts (3 tests) 1919ms
# ✓ tests/integration/repositories/room.test.ts (3 tests) 2093ms
# Test Files  2 passed (2)
# Tests       6 passed (6)

# Complete integration test suite
pnpm test:integration
# Output:
# Test Files  9 passed (9)
# Tests       11 passed (11)

# Unit tests
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Table and Room ports defined in `src/domain/organization/` with pure domain types | PASS | `src/domain/organization/table.repository.ts` & `room.repository.ts` have no Prisma imports |
| 2 | TableState and RoomState domain enums mirror schema enums without Prisma dependency | PASS | Declared directly in port files |
| 3 | Every port method takes `venueId` first (tenancy isolation per D-10.2) | PASS | Verified in both ports and adapters |
| 4 | Prisma adapters wrap all errors into `Result<T>` or `Result<T[]>` | PASS | Handled in `table.repo.ts` and `room.repo.ts` |
| 5 | Non-existent records return `NOT_FOUND` (never null, never throw) | PASS | Verified in integration tests |
| 6 | Create persists valid table/room rows with correct timestamps and states | PASS | Verified in integration tests |
| 7 | Duplicate `[venueId, number]` returns `CONFLICT` | PASS | Caught via `isUniqueConstraintError` and verified in integration tests |
| 8 | `setState` updates state column and returns updated domain entity | PASS | Verified in integration tests |
| 9 | Whole integration suite passes | PASS | 11/11 tests pass |
| 10 | Unit tests, typecheck, and build pass | PASS | 43 unit tests pass; `tsc` exit 0; `next build` exit 0 |

**Deviations from Contract:**
The table and room adapters accept client: DbClient (PrismaClient | Prisma.TransactionClient) as their first argument. Task 2.2.1's createPrismaVenueRepository takes only PrismaClient; the newer adapters take the union, so the integration tests can pass the rollback-transaction client from tests/integration/setup.ts. Traces to BUILD.md §8.8 (integration tests open a transaction and roll it back). The venue adapter will be reconciled to the same DbClient alias in Task 2.2.9, not now.

**Noticed but Out of Scope:**
- Integration test output displays cosmetic `prisma:error` logged to stdout/stderr during negative-path conflict tests when testing unique constraint violations (`tables_venueId_number_key` and `rooms_venueId_number_key`). This is expected and caught/wrapped into `CONFLICT`, but visible due to `client.ts` logging configuration.
Scheduled for suppression in Task 2.2.9, when the milestone close runs the full integration suite and cleans its output.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change | No change |
| DECISIONS.md  | No | Follows existing decisions D-10.1, D-10.2 | No change |
| SYSTEM.md     | No | Strictly conforms to §4, §5, §11.1 | No change |
| BUILD.md      | No | Follows testing and coding standards | No change |
| ROADMAP.md    | Yes | Task 2.2.2 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0035 added | Updated |

**Contradiction Check:**
None found. Architecture strictly respects ports-and-adapters; domain does not import database; tenancy isolation respected (`venueId` first); Result type used for all outcomes; domain enums match Prisma values without coupling.

**Next:**
Task 2.2.3 — Add the QR token repository in `src/domain/qr/` and `src/infrastructure/db/repositories/`.

**Awaiting Human Verification:** NO

### ENTRY-0034 — 2026-10-16 — Task 2.2.1 — The venue repository and integration harness

**Status:** PASS

**Task:** Task 2.2.1 — Add the venue repository (read the venue and its modules), preceded by the integration test harness prerequisite.

**Summary:**
Configured the integration test harness (`vitest.integration.config.ts`, `tests/integration/setup.ts`, `@prisma/adapter-pg` driver adapter for Prisma 7) and delivered the VenueRepository port interface in `src/domain/organization/venue.repository.ts`, its Prisma adapter in `src/infrastructure/db/repositories/organization.repo.ts`, and full integration test coverage in `tests/integration/repositories/venue.test.ts`. Real reads, writes, and uniqueness constraints were verified against local PostgreSQL (`qrproject_test`) with transactional rollback.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `vitest.integration.config.ts` | Created | Vitest config running integration suite against dedicated test database |
| `tests/integration/setup.ts` | Created | Integration test setup deploying migrations once and providing `withTransaction` rollback helper |
| `tests/integration/harness.test.ts` | Created | Verification of test database connectivity and transaction rollback |
| `src/infrastructure/db/client.ts` | Modified | Added `@prisma/adapter-pg` driver adapter required by Prisma 7 |
| `src/domain/organization/venue.repository.ts` | Created | VenueRepository port interface and domain types (no @prisma/client dependency) |
| `src/infrastructure/db/repositories/organization.repo.ts` | Modified | Factory `createPrismaVenueRepository` adapter implementing VenueRepository |
| `tests/integration/repositories/venue.test.ts` | Created | Integration tests for venue repository (create, findById, findBySlug, NOT_FOUND, CONFLICT) |
| `package.json` | Modified | Updated `test:integration` script, added `@prisma/adapter-pg`, `pg`, `@types/pg` |
| `pnpm-lock.yaml` | Modified | Updated dependencies |
| `.env.local` | Modified | Added `TEST_DATABASE_URL` pointing to `qrproject_test` |
| `docs/ROADMAP.md` | Modified | Marked Task 2.2.1 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0034 and updated snapshot |

**Commands Run:**
```bash
# Specific repository integration test
pnpm vitest run --config vitest.integration.config.ts tests/integration/repositories/venue.test.ts
# Output:
# ✓ tests/integration/repositories/venue.test.ts (3 tests) 2472ms
# Test Files  1 passed (1)
# Tests       3 passed (3)

# Complete integration test suite
pnpm test:integration
# Output:
# ✓ tests/integration/repositories/venue.test.ts (3 tests)
# ✓ tests/integration/harness.test.ts (2 tests)
# Test Files  7 passed (7)
# Tests       5 passed (5)

# Unit tests
pnpm test:unit
# Output:
# Test Files  3 passed (3)
# Tests       43 passed (43)

# Typecheck
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Build
pnpm build
# Output: Compiled successfully, generating static pages (3/3), exit code 0
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Integration test harness runs against test database | PASS | `tests/integration/harness.test.ts` passes (2/2) |
| 2 | Port interface defined in domain with pure types | PASS | `src/domain/organization/venue.repository.ts` |
| 3 | Prisma adapter wraps errors into Result<T> | PASS | `src/infrastructure/db/repositories/organization.repo.ts` |
| 4 | Money/tax values represented as decimal strings | PASS | `taxRate` read and returned as string |
| 5 | Integration test verifies create, findById, findBySlug | PASS | `tests/integration/repositories/venue.test.ts` passes (3/3) |
| 6 | Missing records return NOT_FOUND (never null) | PASS | Verified in `venue.test.ts` |
| 7 | Unique slug violation returns CONFLICT | PASS | Verified in `venue.test.ts` |
| 8 | Unit tests still pass | PASS | 43/43 tests pass |
| 9 | Typecheck passes | PASS | `pnpm exec tsc --noEmit` exit 0 |
| 10 | Production build passes | PASS | `next build` exit 0 |

**Deviations from Contract:**
- `src/infrastructure/db/client.ts`: Added `@prisma/adapter-pg` driver adapter with `pg.Pool` because Prisma 7 requires a driver adapter for direct PostgreSQL connections. Traces to D-16.3.
- `package.json` & `pnpm-lock.yaml`: Added `@prisma/adapter-pg`, `pg`, and `@types/pg` dependencies to supply the PostgreSQL driver adapter. Traces to D-16.3.
- `.env.local`: Added `TEST_DATABASE_URL` pointing to dedicated `qrproject_test` database; it is a test-only variable scoped to `vitest.integration.config.ts` and never read by production code.

**Noticed but Out of Scope:**
- The integration test output displays a cosmetic `prisma:error` logged to stderr/stdout during the negative-path test for duplicate slug in `venue.test.ts`. The error is expected and caught/wrapped into `CONFLICT` as designed, but is printed because `log: ["query", "warn", "error"]` is enabled in `client.ts` for non-production environments. Suppressing or re-routing Prisma logs in the test environment can be addressed in a future refinement task.
- Five integration test files currently show 0 tests; in particular, `tests/integration/repositories/order.repo.test.ts` is the file that will satisfy PHASE_TESTS.md §4 Step 6 when Task 2.2.6 lands, while `tests/integration/api/guest-orders.test.ts`, `tests/integration/api/kitchen-orders.test.ts`, `tests/integration/api/admin-menu.test.ts`, and `tests/integration/api/staff-orders.test.ts` are reserved placeholders for future roadmap tasks (Tasks 5.6.4, 6.2.4, 8.3.7, and 7.4.4).

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change | No change |
| DECISIONS.md  | Yes | Recorded D-16.3 (driver adapter requirement) | Updated |
| SYSTEM.md     | No | Exactly follows §2, §4, §5 | No change |
| BUILD.md      | No | Follows testing and coding standards | No change |
| ROADMAP.md    | Yes | Task 2.2.1 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0034 added | Updated |

**Contradiction Check:**
None found. Architecture strictly respects ports-and-adapters; domain does not import database; Decimal mapped to string; Result type used for all outcomes; D-16.3 documents the Prisma 7 driver adapter choice.

**Next:**
Task 2.2.2 — Add the table and room repositories in `src/domain/organization/` and `src/infrastructure/db/repositories/`.

**Awaiting Human Verification:** NO

### ENTRY-0033 — 2026-10-16 — Milestone 2.1 — The schema, database migration, and verification

**Status:** PASS

**Task:** Tasks 2.1.1 through 2.1.12 (Milestone 2.1 — The schema).

**Summary:**
Configured Prisma 7 client and CLI tooling with dedicated `prisma.config.ts`, authored the authoritative database schema in `prisma/schema.prisma` with 22 models and indexes matching SYSTEM.md §11-12, generated and cleanly executed the initial database migration on PostgreSQL 18 (`qrproject`), generated the typed Prisma Client, authored the canonical Result contract in `src/domain/shared/result.ts`, and verified zero TypeScript errors and 43 passing unit tests.

**Files Changed:**
| Path | Action | Purpose |
|------|--------|---------|
| `prisma/schema.prisma` | Modified | Complete data model definition with 22 models and enums matching SYSTEM.md §11-12 |
| `prisma.config.ts` | Created | Prisma ORM v7 configuration with explicit `.env.local` loading |
| `src/infrastructure/db/client.ts` | Modified | Global singleton PrismaClient instance for Next.js development |
| `src/infrastructure/db/errors.ts` | Modified | Infrastructure error helpers wrapping Prisma errors |
| `src/domain/shared/result.ts` | Created | Canonical Result<T>, DomainError, and DomainErrorCode implementation (SYSTEM.md §5) |
| `.env.local` | Modified | Configured working PostgreSQL connection string (`qrproject`) |
| `package.json` | Modified | Added `dotenv` development dependency |
| `pnpm-lock.yaml` | Modified | Updated lockfile |
| `prisma/migrations/20261015183749_phase2_initial_schema/migration.sql` | Created | Initial schema migration |
| `docs/ROADMAP.md` | Modified | Marked tasks 2.1.1 through 2.1.12 as Complete |
| `docs/PROGRESS.md` | Modified | Added ENTRY-0033 and updated snapshot |

**Commands Run:**
```bash
# Validated schema
pnpm prisma validate
# Output: The schema at prisma\schema.prisma is valid 🚀

# Executed migration against local PostgreSQL 18
pnpm prisma migrate dev --name "phase2_initial_schema"
# Output:
# Applying migration `20261015183749_phase2_initial_schema`
# Your database is now in sync with your schema.

# Generated typed client
pnpm prisma generate
# Output: ✔ Generated Prisma Client (v7.10.0)

# Verified database tables
psql -h localhost -p 5432 -U postgres -d qrproject -c "\dt"
# Output: 22 tables created (venues, tables, rooms, counters, menu_items, orders, etc.)

# Type check
pnpm exec tsc --noEmit
# Output: clean exit (code 0)

# Unit tests
pnpm test -- --run
# Output: 3 test files passed, 43 passed (43)
```

**Acceptance Criteria Results:**
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Database client & Prisma 7 configured | PASS | `prisma.config.ts`, `src/infrastructure/db/client.ts` |
| 2 | All 22 models and enums in schema | PASS | `prisma/schema.prisma` validates cleanly |
| 3 | Migration generated and applied | PASS | `20261015183749_phase2_initial_schema` applied |
| 4 | Tables exist in PostgreSQL | PASS | `psql -c "\dt"` returns 22 tables |
| 5 | Prisma Client generated | PASS | `@prisma/client` generated |
| 6 | Result contract defined | PASS | `src/domain/shared/result.ts` |
| 7 | TypeScript typecheck passes | PASS | `pnpm exec tsc --noEmit` exit code 0 |
| 8 | Unit tests pass | PASS | 43/43 tests pass |

**Deviations from Contract:**
None.

**Noticed but Out of Scope:**
- In-memory repository doubles and integration test harness (`vitest.integration.config.ts`) will be set up as part of Milestone 2.2.

**Document Impact:**
| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md    | No | No change to product definition | No change |
| DECISIONS.md  | No | Conforms to all decisions | No change |
| SYSTEM.md     | No | Exactly mirrors §11 and §12 | No change |
| BUILD.md      | No | Complies with database and verification rules | No change |
| ROADMAP.md    | Yes | Tasks 2.1.1 to 2.1.12 marked Complete | Updated |
| PROGRESS.md   | Yes (this entry) | ENTRY-0033 added | Updated |

**Contradiction Check:**
None found. Schema and data types match SYSTEM.md §11-12, Money uses Decimal per BUILD.md §7.1, ports and adapters architecture followed per SYSTEM.md §2.

**Next:**
Task 2.2.1 — Add the venue repository (read the venue and its modules) in `src/domain/organization/` (port interface) and `src/infrastructure/db/repositories/organization.repo.ts` (Prisma adapter).

**Awaiting Human Verification:** NO

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

Current phase: Phase 2 — The Data Model.

Current milestone: Milestone 2.3 — The seed.

Current task: Task 2.3.1 — Seed the venue with the table, room, and counter modules enabled.

Current status: Milestone 2.1 (The schema) and Milestone 2.2 (The repositories) are complete and verified. All ten domain ports and eleven infrastructure adapters are in place with 100% consistent `createPrisma*Repository(client: DbClient)` factory signatures and zero `@prisma/client` leakage into `src/domain/`. Integration test suite has 76 passed tests across 15 files, unit test suite has 43 passed tests across 3 files, typecheck passes with 0 errors, and production build succeeds. Two forward migrations are applied. Next milestone is Milestone 2.3 (The seed), beginning with Task 2.3.1.

## 8. How the File Evolves

The file grows by one entry per session. When a milestone closes, its entries compress into a summary line in §5.1 and move to `PROGRESS_ARCHIVE_PHASE_1.md`. The file never exceeds a size a session can read in seconds. The archive never needs to be read unless a session specifically needs to reconstruct a past decision.

If the archive ever exceeds 5,000 lines, it can itself be split by phase (for example, `PROGRESS_ARCHIVE_PHASE_1.md`). Not needed now.