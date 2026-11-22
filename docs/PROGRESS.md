# PROGRESS.md — The Living Project Log

**Version:** 5.0
**Status:** Approved
**Approved:** 2026-11-11
**Purpose:** The dated, append-only record of what has happened on the project. Newest first.

**How to read this file:** Read §7 (the snapshot) first. It tells you the current phase, milestone, and task. Then read the top three entries in §5.3 for recent context. Everything before Phase 7.6 lives in `PROGRESS_ARCHIVE_PHASE_7.md`.

---

## 1. The Rules of This File

**Rule 1 — Append-only.** Entries are never edited after they are written. If an entry was wrong, a new entry corrects it, and the original is marked `CORRECTED BY ENTRY-XXXX`.

**Rule 2 — Newest first.** The most recent entry is at the top of §5.3.

**Rule 3 — One entry per session.** A session ends with exactly one entry.

**Rule 4 — Honest status.** `PASS`, `FAIL`, `BLOCKED`, or `STRUCTURAL`. `PASS` requires raw evidence. `FAIL` requires the failure's output. `BLOCKED` requires the reason. `STRUCTURAL` is used only when a document or a rule changed.

**Rule 5 — Trace every change.** Every entry names the task from `ROADMAP.md` or the document it changed.

**Rule 6 — Never invent.** Nothing is claimed without evidence.

**Rule 7 — Point forward.** Every entry ends with a **Next** line.

**Rule 8 — Cross-document check.** Every entry has a **Document Impact** section.

**Rule 9 — Compression is real.** When a phase closes, its entries move to the archive file for that phase and are summarised in §5.1. Only the current phase's entries live in this file in full.

**Rule 10 — One obvious place to append.** New entries go at the top of §5.3, immediately below the `▼ APPEND NEW ENTRIES HERE ▼` marker.

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
<Every command, with raw output in a fenced block.>

Acceptance Criteria Results:

#	Criterion	Result	Evidence
Deviations from Contract:
<Anything outside the task's scope, or "None".>

Noticed but Out of Scope:
<Problems deliberately not acted on, or "None".>

Document Impact:

Document	Affected?	Reason	Action
PRODUCT.md	Yes / No	Updated / Needs update / No change	
DECISIONS.md	Yes / No	Updated / Needs update / No change	
SYSTEM.md	Yes / No	Updated / Needs update / No change	
BUILD.md	Yes / No	Updated / Needs update / No change	
ROADMAP.md	Yes / No	Updated / Needs update / No change	
PROGRESS.md	Yes (this entry)	Updated	
Contradiction Check:
<One line. Does anything contradict any decision, system description, or build rule? If yes, name it and how it was resolved. If no, "None found".>

Next:
<The exact task the next session starts with, and the specific next action.>

Awaiting Human Verification: YES | NO

text

---

## 3. The Compression Protocol

When a phase closes:
- Move every non-structural entry of that phase, verbatim, to the top of the entry log in `PROGRESS_ARCHIVE_PHASE_X.md`, preceded by a phase header line.
- Replace those entries in this file with a single summary line in §5.1.
- Keep every STRUCTURAL entry in this file regardless of which phase it belongs to. Structural entries are the project's constitutional record.
- Keep the last three entries of the closed phase in §5.3 even if they are not structural.
- When a decision is superseded: follow DECISIONS.md §6.4. The supersession generates a STRUCTURAL entry here.

---

## 4. The Contradiction Check

Run before a session is closed. Five questions.
- Does the session contradict a decision in DECISIONS.md?
- Does the session contradict the system's shape in SYSTEM.md?
- Does the session contradict a build rule in BUILD.md?
- Does the session contradict a fact in PRODUCT.md?
- Does the session contradict a task or status in ROADMAP.md?

If any answer is yes, the session stops. The developer resolves it. A FAIL entry records the contradiction. A follow-up STRUCTURAL entry records the resolution.

---

## 5. The Entry Log

### 5.1 Closed Phases

| Phase | Dates | Goal | Archive |
|-------|-------|------|---------|
| Phase 0 — The Documents | 2026-10-11 | The seven canonical documents authored and approved | `PROGRESS_ARCHIVE_PHASE_1.md` |
| Phase 1 — The Foundation | 2026-10-13 to 2026-10-15 | Repository, tooling, design tokens, base components, dev server | `PROGRESS_ARCHIVE_PHASE_1.md` |
| Phase 2 — The Data Model | 2026-10-15 to 2026-10-16 | Database schema, repositories, seed script | `PROGRESS_ARCHIVE_PHASE_2.md` |
| Phase 3 — Authentication and Sessions | 2026-10-17 | Argon2id hashing, sessions, auth routes, login screens, route protection, placeholder dashboards | `PROGRESS_ARCHIVE_PHASE_3.md` |
| Phase 4 — QR Codes and Guest Context | 2026-10-18 | QR domain, guest sessions, QR landing, guest hero and CTA, admin QR list, generation, revocation, print view | `PROGRESS_ARCHIVE_PHASE_4.md` |
| Phase 5 — The Menu and the Guest Order Flow | 2026-10-18 to 2026-10-30 | Menu domain, menu screen, modifier sheet, cart, order domain, order routes, tracking, waiter calls, menu state updates, polling | `PROGRESS_ARCHIVE_PHASE_5_6.md` |
| Phase 6 — The Kitchen | 2026-10-30 to 2026-11-01 | Kitchen domain, routes, ticket grid, start/ready actions, dark mode, connection indicator, auto-refresh, audible ping, host approval flow, session recovery | `PROGRESS_ARCHIVE_PHASE_5_6.md` |
| Phase 7 — The Service Staff Queues | 2026-11-01 to 2026-11-03 | Staff domain, routes, service screens, role-based queues (initial) | `PROGRESS_ARCHIVE_PHASE_7.md` |
| Phase 7.5 — Room Service & Frontend Convergence | 2026-11-03 to 2026-11-10 | Request domain, routes, forms, polling, join-request alignment, kitchen polish | `PROGRESS_ARCHIVE_PHASE_7.md` |
| Phase 7.6 — Foundation Hardening | 2026-11-10 to 2026-11-11 | Docs reconciliation (11 tasks + 2 FIX), XSS contract, port cleanup, WIRING sweep, full foundation verification | (this file, §5.3) |

### 5.2 The Entry Ledger

A quick index of every entry this file has ever held. Format: ENTRY-XXXX — YYYY-MM-DD — title — status — milestone — location.

| Entry | Date | Title | Status | Milestone | Location |
|-------|------|-------|--------|-----------|----------|
| ENTRY-0244 | 2026-11-22 | Milestone 8.6 closed: Staff Management Hub, Roles RBAC, Active Duty Hours, Session History & Security Revocation | PASS | Milestone 8.6 | §5.3 |
| ENTRY-0243 | 2026-11-21 | Milestone 8.5 closed (Tables & Rooms Management, Reserved Enforcement, Room Pricing, Reporting & Verification) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0242 | 2026-11-21 | Milestone 8.5 Task 8.5.8 closed (Batch QR Print View) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0241 | 2026-11-21 | Milestone 8.5 Task 8.5.7 closed (Admin Rooms Screen & Daily Reporting) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0240 | 2026-11-21 | Milestone 8.5 Task 8.5.6 closed (Admin Tables Screen & Daily Reporting) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0239 | 2026-11-21 | Milestone 8.5 Task 8.5.5 closed (Room Stay Pricing Integration into Folio & Billing) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0238 | 2026-11-21 | Milestone 8.5 Task 8.5.4 closed (Room Categories, Room Management API, Dedicated Pricing & Tests) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0237 | 2026-11-21 | Milestone 8.5 Task 8.5.3 closed (Reserved Table Customer Protection & Scan Routing) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0236 | 2026-11-21 | Milestone 8.5 Tasks 8.5.1 & 8.5.2 closed (Table & Room Categories Schema, Migration, Seed, Table Management API & Tests) | PASS | Milestone 8.5 | §5.3 |
| ENTRY-0235 | 2026-11-21 | Milestones 8.4, 8.4.8 & 8.4.9 closed (Services, Operations Loop & Unified Admin Hub) | PASS | Milestone 8.4, 8.4.8, 8.4.9 | §5.3 |
| ENTRY-0234 | 2026-11-21 | Milestone 8.3 closed (Menu Management & sync); Milestone 8.4.1 foundation complete | PASS | Milestone 8.3 & 8.4 | §5.3 |
| ENTRY-0233 | 2026-11-16 | 8.3.5b.B committed at 1070693; F-0005 discharged (env); baselines re-recorded | PASS | Milestone 8.3 | §5.3 |
| ENTRY-0232 | 2026-11-16 | Roadmap restructured: Services Management (8.4); 8.5–8.9 renumbered; the four new decisions | STRUCTURAL | Milestone 8.4 | §5.3 |
| ENTRY-0231 | 2026-11-16 | Milestone 8.2 closed: order management, CSV export, NPR, next/script fix | PASS | Milestone 8.2 | §5.3 |
| ENTRY-0230 | 2026-11-15 | Milestone 8.1 closed (with 8.1.5.FIX.3 correction) | PASS | Milestone 8.1 | §5.3 |
| ENTRY-0229 | 2026-11-15 | 8.1.3 split into 8.1.3.A (shared map cells) and 8.1.3.B (dashboard page) | STRUCTURAL | Milestone 8.1 | §5.3 |

Next entry number: 0245

### 5.3 Current Milestone — Phase 8, Milestone 8.7 (Reports & Operational Intelligence Hub). Current task: Task 8.7.0 — Decision records for reporting scope (D-2.6, D-12.5, D-12.6, D-12.7).

New entries go immediately below the ▼ marker, newest first.

▼ APPEND NEW ENTRIES HERE ▼

### ENTRY-0244 — 2026-11-22 — Milestone 8.6 closed: Staff Management Hub, Roles RBAC, Active Duty Hours, Session History & Security Revocation

**Status:** PASS

**Task:** Milestone 8.6 (Tasks 8.6.1 through 8.6.9).

**Summary:**
Milestone 8.6 is officially CLOSED (✅) with the delivery of a comprehensive, production-grade Staff Management and Operational Activity Hub:
1. **Domain & Repository Foundations (Task 8.6.1)**:
   - Extended `StaffRepository` interface with `update(venueId, id, patch)` and defined rich activity types (`StaffSessionRecord`, `StaffActivitySummary`, `AdminStaffItem`).
   - Implemented `update` in `src/infrastructure/db/repositories/staff.repo.ts` handling name, roles mapping, and state changes with audit preservation.
   - Verified in `tests/integration/repositories/staff.test.ts` (6 tests passing).
2. **Staff Listing & Summary API (`GET /api/admin/staff`, Task 8.6.2)**:
   - Built audited endpoint returning staff members with assigned roles, state, online presence status (`isOnline`), last login timestamp, shift start, duty hours today & week, and operational contributions.
   - Aggregates venue-wide summary metrics: total staff, active accounts, on-duty staff, deactivated accounts, and role distribution counts.
3. **Staff Creation API (`POST /api/admin/staff`, Task 8.6.3)**:
   - Built audited, CSRF-protected endpoint with strict validation (name length, username regex `^[a-z0-9_]{3,30}$`, password >= 8 chars, non-empty valid `StaffRole` array).
   - Enforces unique usernames per venue, hashes credentials using Argon2id (`hashPassword`), and returns sanitized public shape.
4. **Staff Update & Deactivation API (`PATCH /api/admin/staff/[id]`, Task 8.6.4)**:
   - Built audited dynamic endpoint to update staff name, roles, and state.
   - Enforces security guard preventing administrators from deactivating their own currently logged-in account.
   - On deactivation, automatically invokes `invalidateAllSessions(staffMemberId)` to terminate all active mobile/desktop sessions immediately while preserving historical audit and order logs.
5. **Staff Password Reset API (`POST /api/admin/staff/[id]/reset-password`, Task 8.6.5)**:
   - Built audited, CSRF-protected endpoint to securely update credentials via Argon2id.
   - Atomically invalidates all existing staff sessions across all devices (`invalidateAllSessions`) per D-3.3 and D-3.9. Never returns the password or hash.
6. **Staff Shift & Activity History API (`GET /api/admin/staff/[id]/activity`, Task 8.6.6)**:
   - Built audited endpoint returning detailed shift session timeline (login time, logout time, duration, live shift status), active duty hours (today, this week, lifetime), and recent operational contributions (`OrderStateChange` and `RequestStateChange`).
7. **Admin Staff Management Screen (`app/admin/(shell)/staff/page.tsx`, Task 8.6.7 & 8.6.8)**:
   - Built modern staff management screen in the admin shell with "← Back to Dashboard" navigation, 5s live polling toggle, top KPI ribbon (Total Staff, On Duty Now, Active Accounts, Deactivated), search bar, role filter dropdown, state filter, and online presence tabs.
   - Created interactive modal dialogs:
     - `AddStaffDialog` with multi-role assignment chips, role category descriptions, and random password generator.
     - `EditStaffDialog` with role toggling and deactivation warning.
     - `ResetPasswordDialog` with security session invalidation notice.
     - `StaffActivityDrawer` slide-out inspector showing shift session history, duty duration per shift, and order/service actions timeline.
8. **Verification & Benchmarks (Task 8.6.9)**:
   - `pnpm typecheck` passed with 0 errors (`tsc --noEmit`).
   - Unit tests: 41 test files, 282 passed (282).
   - Integration tests: 5 tests passed in `tests/integration/api/admin-staff.test.ts` with 100% pass rate.

**Files Changed:**
- `docs/ROADMAP.md`: Updated Milestone 8.6 tasks with expanded, robust scope and marked 8.6.1 through 8.6.9 as complete.
- `src/domain/auth/staff.repository.ts`: Added `update`, `UpdateStaffInput`, `StaffSessionRecord`, and `StaffActivitySummary`.
- `src/infrastructure/db/repositories/staff.repo.ts`: Implemented `update` method.
- `app/api/admin/staff/route.ts`: Built `GET` and `POST` handlers with `withAudit` and `withCsrf`.
- `app/api/admin/staff/[id]/route.ts`: Built `PATCH` handler with `withAuditedDynamicRoute` and session invalidation on deactivation.
- `app/api/admin/staff/[id]/reset-password/route.ts`: Built `POST` handler with `withAuditedDynamicRoute` and `invalidateAllSessions`.
- `app/api/admin/staff/[id]/activity/route.ts`: Built `GET` handler returning shift session history and duty hours.
- `app/admin/(shell)/staff/_types.ts`: Defined TypeScript types for staff management view.
- `app/admin/(shell)/staff/_role-meta.ts`: Added metadata and badge styles for all 12 staff roles.
- `app/admin/(shell)/staff/_add-staff-dialog.tsx`: Created Add Staff modal.
- `app/admin/(shell)/staff/_edit-staff-dialog.tsx`: Created Edit Staff modal.
- `app/admin/(shell)/staff/_reset-password-dialog.tsx`: Created Reset Password modal.
- `app/admin/(shell)/staff/_staff-activity-drawer.tsx`: Created Staff Activity & Shift Drawer.
- `app/admin/(shell)/staff/_staff-management-view.tsx`: Created interactive staff hub view.
- `app/admin/(shell)/staff/page.tsx`: Created server component page for `/admin/staff`.
- `tests/integration/repositories/staff.test.ts`: Added test for `StaffRepository.update`.
- `tests/integration/api/admin-staff.test.ts`: Added comprehensive 5-test suite for staff management APIs.
- `tests/unit/auth/login.test.ts`: Updated mock `StaffRepository` with `update`.

**Next:** Milestone 8.7 — Reports.


### ENTRY-0243 — 2026-11-21 — Milestone 8.5 closed: Tables & Rooms Management, Reserved Enforcement, Room Pricing, Reporting & Verification

**Status:** PASS

**Task:** Milestone 8.5 (Task 8.5.9).

**Summary:**
Milestone 8.5 is officially CLOSED (✅) after complete end-to-end operational loop verification and production build certification:
1. **Tables & Room Categories Foundation (Tasks 8.5.1, 8.5.2, 8.5.4)**:
   - Added `TableCategory` and `RoomCategory` models to Prisma schema with migration and seed.
   - Built full CRUD endpoints for tables, rooms, and categories under `/api/admin/tables` and `/api/admin/rooms` with `withAudit` and `withCsrf`.
   - Built `POST /api/admin/tables/[id]/end-session` and `POST /api/admin/rooms/[id]/end-session` giving managers full termination authority.
   - Comprehensive test suites verified in `tests/integration/api/admin-tables.test.ts` (5 tests) and `tests/integration/api/admin-rooms.test.ts` (4 tests).
2. **Customer Protection for Reserved Tables (Task 8.5.3)**:
   - Built dedicated `/qr/reserved` page with emergency dialer button (`tel:+97714200000`).
   - QR token landing dynamically routes walk-in customers scanning a reserved table to `/qr/reserved` while permitting seated active guests to access `/menu`.
   - Verified with 4 integration tests in `tests/integration/guest/qr-landing.test.ts`.
3. **Room Nightly Pricing Integration into Folio & Billing (Task 8.5.5)**:
   - Integrated room category base pricing in NPR into `GET /api/guest/bill`, guest bill modals on `/menu` and `/services`, staff checkout, and admin active & completed folios.
   - Verified with integration test suite `tests/integration/api/guest-bill.test.ts` (4 tests).
4. **Admin Shell Hubs & Daily Reporting (Tasks 8.5.6 & 8.5.7)**:
   - Built interactive screens `app/admin/(shell)/tables/page.tsx` and `app/admin/(shell)/rooms/page.tsx` with "← Back to Dashboard" navigation, category tabs, state filters, metric overviews, rich cards displaying today's sessions/orders/revenue, and force-end session authority.
   - Built interactive sheets for adding/editing tables, rooms, and managing category pricing.
5. **Batch QR Print Sheets (Task 8.5.8)**:
   - Built `app/admin/(shell)/qr/print/batch/page.tsx` with high-contrast printable cards, category badges, reserved tags, and crisp QR image rendering with `@media print` layout.
6. **Production Standards & Verification**:
   - `pnpm typecheck` passed with 0 errors (`tsc --noEmit`).
   - Unit test suite passed 41/41 test files, 282/282 tests.
   - Integration test suites passed 100% across all 17 tests.
   - `pnpm build` passed with exit code 0 (`next build`), compiling all 59 static and dynamic routes.

### ENTRY-0242 — 2026-11-21 — Milestone 8.5 Task 8.5.8 closed: Batch QR Print View

**Status:** PASS

**Task:** Milestone 8.5 (Task 8.5.8).

**Summary:**
Milestone 8.5 Task 8.5.8 is completed, tested, and verified.
1. **Batch QR Print Route & Layout (`app/admin/(shell)/qr/print/batch/page.tsx`)**:
   - Implemented high-contrast, multi-column printable layout protected by `requireRole(["admin"])`.
   - Aggregated venue data, all tables with categories, all rooms with categories, and mapped active QR tokens.
   - Rendered printable cards featuring venue branding (`Juniper House`), prominent place identifiers (`Table 1`, `Room 401`), zone/type category badges with special reserved indicators, high-resolution scannable QR images, and polite guest instructions.
   - Designed with print-specific CSS rules (`print:break-inside-avoid`, `print:page-break-inside-avoid`, `print:p-6`) for seamless multi-page sheet printing.
2. **Interactive Controls & Hub Integration**:
   - `_batch-print-actions.tsx`: Non-printable top action bar featuring filter tabs for "All Placards", "Tables Only", and "Rooms Only" plus a one-click "🖨️ Print Batch Sheets" trigger (`window.print()`).
   - Updated QR Codes Hub (`app/admin/(shell)/qr/page.tsx`) with a direct "🖨️ Batch Print Placards ↗" header button.
3. **Quality Verification**:
   - `pnpm typecheck` passed with 0 errors.
   - Unit tests (282 tests) and integration suites (17 tests) passed with 100% success rate.

### ENTRY-0241 — 2026-11-21 — Milestone 8.5 Task 8.5.7 closed: Admin Rooms Screen & Daily Reporting

**Status:** PASS

**Task:** Milestone 8.5 (Task 8.5.7).

**Summary:**
Milestone 8.5 Task 8.5.7 is completed, tested, and verified.
1. **Admin Rooms Server Component (`app/admin/(shell)/rooms/page.tsx`)**:
   - Built full screen with `requireRole(["admin"])` and venue currency resolution.
   - Fetched room categories via `roomRepo.listCategories(staff.venueId)`.
   - Fetched rooms with details via `roomRepo.listRoomsWithDetails(staff.venueId)`.
   - Fetched active room QR tokens via `prisma.qrToken.findMany({ where: { placeType: "ROOM", state: "ACTIVE" } })`.
   - Aggregated today's guest sessions starting from start-of-day boundary to compute per-room sessions count, F&B orders count, service requests count, and total revenue today (combining base room rates, orders, and payable services) in NPR.
2. **Interactive Rooms View Client Hub (`app/admin/(shell)/rooms/_rooms-view.tsx`)**:
   - Metric summary cards: Total Rooms, Vacant Rooms, Occupied Rooms, Cleaning/Out of Service Rooms, and Today's Room Sales in NPR.
   - Category filter tabs with item counters and configured nightly stay rate badges.
   - State filter pills: All, Vacant, Occupied, Cleaning, Out of Service.
   - Rich room card grid displaying Room number, category badge, nightly rate in NPR, operational status badge, DND alert indicator ("🔴 DND"), active stay details (elapsed duration, orders, requests, total active folio including room stay rate), and today's metrics.
3. **Interactive Actions & Dialogs**:
   - `_categories-sheet.tsx` & `_categories-sheet-trigger.tsx`: Manage room categories and nightly stay base pricing in NPR with CSRF protection.
   - `_add-room-sheet.tsx` & `_add-room-button.tsx`: Add Room sheet with custom numbering, category pricing selection, and operational state.
   - `_edit-room-sheet.tsx`: Edit Room sheet with number, category, state, and delete action.
   - `_end-session-button.tsx`: Authority button to force checkout active room sessions (`POST /api/admin/rooms/[id]/end-session`) with confirmation prompt.
   - `_room-qr-dialog.tsx`: Scannable QR modal preview with direct link to printable placard (`/admin/qr/print/${qrTokenId}`).
4. **Quality Verification**:
   - `pnpm typecheck` passed with 0 errors.
   - `tests/integration/api/admin-rooms.test.ts` (4 tests) passed with 100% success rate.

### ENTRY-0240 — 2026-11-21 — Milestone 8.5 Task 8.5.6 closed: Admin Tables Screen & Daily Reporting

**Status:** PASS

**Task:** Milestone 8.5 (Task 8.5.6).

**Summary:**
Milestone 8.5 Task 8.5.6 is completed, tested, and verified.
1. **Admin Tables Server Component (`app/admin/(shell)/tables/page.tsx`)**:
   - Built full screen with `requireRole(["admin"])` and venue currency resolution.
   - Fetched table categories via `tableRepo.listCategories(staff.venueId)`.
   - Fetched tables with details via `tableRepo.listTablesWithDetails(staff.venueId)`.
   - Fetched active table QR tokens via `prisma.qrToken.findMany({ where: { placeType: "TABLE", state: "ACTIVE" } })`.
   - Computed start of day boundary (`todayStart.setHours(0, 0, 0, 0)`) and aggregated today's guest sessions to calculate per-table session count, order count, and revenue today in NPR.
2. **Interactive Tables View Client Hub (`app/admin/(shell)/tables/_tables-view.tsx`)**:
   - High-level metric summary cards: Total Tables, Free Tables, Occupied Tables, Reserved Zone Tables, and Today's Table Sales in NPR.
   - Category filter tabs with live item counters and reserved tags.
   - State filter pills: All, Free, Occupied, Out of Service.
   - Rich table card grid displaying Table number, zone category, reserved alert shield, operational state badge, active session details (started at, elapsed duration, order count, folio total), and today's performance stats.
3. **Interactive Actions & Dialogs**:
   - `_categories-sheet.tsx` & `_categories-sheet-trigger.tsx`: Full category management sheet allowing adding, editing, and deleting categories with reserved toggles and CSRF protection.
   - `_add-table-sheet.tsx` & `_add-table-button.tsx`: Add Table sheet with custom number input, category dropdown, and initial state select.
   - `_edit-table-sheet.tsx`: Edit Table sheet with number, category, state, and delete action.
   - `_end-session-button.tsx`: Authority button to force-end active table sessions (`POST /api/admin/tables/[id]/end-session`) with confirmation prompt.
   - `_table-qr-dialog.tsx`: Scannable QR modal preview with direct link to printable placard (`/admin/qr/print/${qrTokenId}`).
4. **Quality Verification**:
   - `pnpm typecheck` passed with 0 errors.
   - `tests/integration/api/admin-tables.test.ts` (5 tests) passed with 100% success rate.

### ENTRY-0239 — 2026-11-21 — Milestone 8.5 Task 8.5.5 closed: Room Stay Pricing Integration into Folio & Billing

**Status:** PASS

**Task:** Milestone 8.5 (Task 8.5.5).

**Summary:**
Milestone 8.5 Task 8.5.5 is completed, tested, and verified.
1. **Folio API (`app/api/guest/bill/route.ts`)**:
   - Integrated room category base rate lookup via `prisma.room.findUnique({ where: { id: guestSession.roomId }, include: { category: true } })`.
   - When a room category exists with `basePrice > 0`, itemizes `roomStayCharge: { categoryName, basePrice: formatMoney(...) }` into the bill JSON payload.
   - Calculates subtotal as `ordersSubtotal + servicesTotal + roomStayPrice` and grand total as `subtotal + tax`.
2. **Guest Bill Modal UI (`app/(guest)/menu/page.tsx` & `app/(guest)/services/page.tsx`)**:
   - Updated client-side DOM modal renderer to check for `data.roomStayCharge` and render dedicated "Room Accommodation" line item showing category name and nightly rate in NPR alongside food & drink items and payable hotel services.
3. **Admin Shell Active & Completed Folios (`app/admin/(shell)/orders/active/page.tsx` & `app/admin/(shell)/orders/completed/page.tsx`)**:
   - Retrieved room categories across the venue using `roomRepo.listRoomsWithDetails(staff.venueId)`.
   - Constructed fast room-to-category mapping `roomCategoryByRoomId`.
   - Itemized room stay pricing in session summary cards and the consolidated folio detail inspector alongside F&B orders and hotel service requests.
4. **Integration Testing (`tests/integration/api/guest-bill.test.ts`)**:
   - Added Test 4: "includes room category base price in bill when session is associated with a room".
   - Verified that room stay charges appear accurately in the subtotal and grand total. All 4 tests in suite pass.
5. **Quality Verification**:
   - `pnpm typecheck` passed cleanly with 0 errors.
   - `pnpm test` passed cleanly with 282/282 tests passing.

### ENTRY-0238 — 2026-11-21 — Milestone 8.5 Task 8.5.4 closed: Room Categories, Room Management API, Dedicated Pricing & Tests

**Status:** PASS

**Task:** Milestone 8.5 (Task 8.5.4).

**Summary:**
Milestone 8.5 Task 8.5.4 is completed, tested, and verified.
1. **Domain Contract & Repositories (`src/domain/organization/room.repository.ts` & `src/infrastructure/db/repositories/room.repo.ts`)**:
   - Added `RoomCategory`, `CreateRoomCategoryInput`, `UpdateRoomCategoryInput`, `RoomView`, and `UpdateRoomInput` domain types.
   - Implemented Category CRUD (`listCategories`, `findCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`) with decimal `basePrice` stored and edited in NPR.
   - Implemented Room CRUD (`listRoomsWithDetails`, `create`, `update`, `delete`, `endSession`) with active guest session aggregation (order totals, service request totals, room rates, and DND status detection).
   - Enforced 409 conflict protection when attempting to change the state of an occupied room while a guest session is active or deleting a room with active sessions.
   - Implemented `endSession` for rooms: invalidates all active guest sessions on the room, completes open service requests, and resets room state to `VACANT`.
2. **Room Management API Routes (`app/api/admin/rooms/*`)**:
   - `GET` & `POST /api/admin/rooms/categories`: List and create room categories with custom names and configurable base price in NPR (`withAudit` + `withCsrf`).
   - `PATCH` & `DELETE /api/admin/rooms/categories/[id]`: Update category details / pricing, and delete category with automatic room unlinking (`withAuditedDynamicRoute` + `withCsrf`).
   - `GET` & `POST /api/admin/rooms`: List rooms with category details and active session totals; create room with custom numbers/names and category assignment (`withAudit` + `withCsrf`).
   - `PATCH` & `DELETE /api/admin/rooms/[id]`: Update room number, category, or occupancy state; delete room with active session conflict safeguard (`withAuditedDynamicRoute` + `withCsrf`).
   - `POST /api/admin/rooms/[id]/end-session`: Admin authority endpoint to force check out active room sessions, clear DND, and set room to VACANT (`withAuditedDynamicRoute` + `withCsrf`).
3. **Integration Tests (`tests/integration/api/admin-rooms.test.ts`)**:
   - Added 4 integration tests verifying 401 unauthorized on missing session, 403 forbidden for non-admin staff (LEADER), 409 conflict on duplicate room numbers, and full operational CRUD lifecycle (category creation with NPR 3,500 base price, room creation, list with details, active session conflict guard, admin end-session authority, price update to NPR 4,200, and cleanup). All 4 tests pass against PostgreSQL.

**Files changed:**
- `src/domain/organization/room.repository.ts` (extended room repository domain contract)
- `src/infrastructure/db/repositories/room.repo.ts` (implemented category CRUD, room details query, and endSession)
- `tests/unit/staff/checkout-room.test.ts` (updated mock repo stubs)
- `app/api/admin/rooms/route.ts` (GET / POST rooms)
- `app/api/admin/rooms/[id]/route.ts` (PATCH / DELETE room)
- `app/api/admin/rooms/categories/route.ts` (GET / POST room categories)
- `app/api/admin/rooms/categories/[id]/route.ts` (PATCH / DELETE room category)
- `app/api/admin/rooms/[id]/end-session/route.ts` (POST admin force checkout)
- `tests/integration/api/admin-rooms.test.ts` (4 integration tests)
- `docs/ROADMAP.md` (marked Task 8.5.4 complete)
- `docs/PROGRESS.md` (this entry, ledger, and §7 snapshot)

**Verification:**
- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm test` (Unit Tests): 41 test files, 282 tests passed.
- `pnpm vitest run --config vitest.integration.config.ts tests/integration/api/admin-rooms.test.ts`: 4 passed.

**Contradiction Check:** None found. Money values handled as decimal strings per BUILD.md §7.1. CSRF and audit enforced on all mutation routes.

**Next:** Task 8.5.5 — Room Stay Pricing Integration into Folio & Billing (`GET /api/guest/bill`).

**Awaiting Human Verification:** NO

---

### ENTRY-0237 — 2026-11-21 — Milestone 8.5 Task 8.5.3 closed: Reserved Table Customer Protection & Scan Routing (/qr/reserved)

**Status:** PASS

**Task:** Milestone 8.5 (Task 8.5.3).

**Summary:**
Milestone 8.5 Task 8.5.3 is completed, tested, and verified.
1. **Reserved Table Scan Resolver Guard (`app/(guest)/qr/[token]/route.ts`)**:
   - Updated QR landing resolver to fetch the table and its associated `TableCategory`.
   - If `category.isReserved === true`:
     - Checks if the customer holds a valid `venue_guest` cookie matching an active session on that specific reserved table. If matched, the seated guest is admitted to `/menu`.
     - If the customer does NOT hold the active session cookie (walk-ins, new scanners, third parties), session creation and join requests are strictly blocked, and the request is redirected to `/qr/reserved?table=${number}`.
2. **Dedicated Reserved Notice Page (`app/(guest)/qr/reserved/page.tsx`)**:
   - Built a mobile-first, responsive screen with amber accent badge (`Reserved`), shield alert iconography, clear table identifier, polite instructions (*"This table has been reserved for another party. Please speak with our host or team member to be seated, or select an open table."*), one-tap host dialer button (`tel:+97714200000`), and link back to the venue welcome page.
3. **Integration Tests (`tests/integration/guest/qr-landing.test.ts`)**:
   - Added integration test proving that scanning a reserved table without an active cookie redirects to `/qr/reserved?table=...` with zero cookie creation, while scanning with an authorized session cookie successfully admits the guest to `/menu`. All 4 QR landing tests pass against PostgreSQL.

**Files changed:**
- `app/(guest)/qr/[token]/route.ts` (added reserved table check and redirection)
- `app/(guest)/qr/reserved/page.tsx` (new customer-facing reserved notice and dialer)
- `tests/integration/guest/qr-landing.test.ts` (integration tests for reserved protection)
- `docs/ROADMAP.md` (marked Task 8.5.3 complete)
- `docs/PROGRESS.md` (this entry, ledger, and §7 snapshot)

**Verification:**
- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm test` (Unit Tests): 41 test files, 282 tests passed.
- `pnpm vitest run --config vitest.integration.config.ts tests/integration/guest/qr-landing.test.ts`: 4 passed.

**Contradiction Check:** None found. Respects guest session isolation, double-submit CSRF, and domain state boundaries.

**Next:** Task 8.5.4 — Room Categories, Room Management API & Dedicated Pricing (`/api/admin/rooms`).

**Awaiting Human Verification:** NO

---

### ENTRY-0236 — 2026-11-21 — Milestone 8.5 Tasks 8.5.1 & 8.5.2 closed: Table & Room Categories Schema, Migration, Seed, Table Management API, End Session Authority & Route Tests

**Status:** PASS

**Task:** Milestone 8.5 (Tasks 8.5.1 & 8.5.2).

**Summary:**
Milestone 8.5 Tasks 8.5.1 and 8.5.2 are completed, tested, and verified.
1. **Schema & Migration (8.5.1)**: Added `TableCategory` (`id`, `venueId`, `name`, `description`, `isReserved`, `sortOrder`) and `RoomCategory` (`id`, `venueId`, `name`, `description`, `basePrice`, `sortOrder`) to `prisma/schema.prisma`. Linked optional `categoryId` foreign key to `Table` and `Room`. Generated migration `20261121161942_add_table_and_room_categories`.
2. **Seed (8.5.1)**: Updated `prisma/seed.ts` with 4 table categories ("Indoor Dining", "Patio & Garden", "VIP Lounge", "Reserved") and 8 room categories ("NON AC", "AC", "DELUXE", "SUPER DELUXE", "DOUBLE BED ROOM NON AC", "DOUBLE BED ROOM AC", "ROOM FOR GROUP", "NIGHT SUITES" with NPR rates). Mapped all 12 seed tables and 8 seed rooms to categories. `pnpm prisma db seed` succeeded.
3. **Domain & Repositories (8.5.1)**: Extended `TableRepository` and `RoomRepository` contracts with category CRUD and table management methods (`listCategories`, `findCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`, `listTablesWithDetails`, `update`, `delete`, `endSession`). Implemented methods in `src/infrastructure/db/repositories/table.repo.ts`. Updated unit test mocks in `tests/unit/staff/close-table.test.ts`.
4. **Table Categories & Table Management API (8.5.2)**: Implemented full CRUD with `withAudit` and `withCsrf`:
   - `GET` & `POST /api/admin/tables/categories`: List and create table categories.
   - `PATCH` & `DELETE /api/admin/tables/categories/[id]`: Update category and delete category with re-assignment safeguard.
   - `GET` & `POST /api/admin/tables`: List tables with categories and active session details; create table with custom number/name and category.
   - `PATCH` & `DELETE /api/admin/tables/[id]`: Update table name, category, or state (with 409 conflict guard when session is active); delete table with active session and historical order protections.
   - `POST /api/admin/tables/[id]/end-session`: Admin authority endpoint to force-close active table sessions, free table, and record audit event.
5. **Integration Tests (8.5.2)**: Created `tests/integration/api/admin-tables.test.ts` verifying category creation, duplicate number rejection, table updating, conflict on active session state change, and admin end-session authority. All 5 integration tests pass against PostgreSQL.

**Files changed:**
- `prisma/schema.prisma` (added TableCategory and RoomCategory models)
- `prisma/migrations/20261121161942_add_table_and_room_categories/migration.sql` (schema migration)
- `prisma/seed.ts` (seeded table and room categories with relations)
- `src/domain/organization/table.repository.ts` (extended table repo contract)
- `src/domain/organization/room.repository.ts` (extended room repo contract)
- `src/infrastructure/db/repositories/table.repo.ts` (implemented category CRUD, table queries, and endSession)
- `tests/unit/staff/close-table.test.ts` (mock repo contract alignment)
- `app/api/admin/tables/route.ts` (GET / POST tables)
- `app/api/admin/tables/[id]/route.ts` (PATCH / DELETE table)
- `app/api/admin/tables/categories/route.ts` (GET / POST table categories)
- `app/api/admin/tables/categories/[id]/route.ts` (PATCH / DELETE table category)
- `app/api/admin/tables/[id]/end-session/route.ts` (POST admin end table session)
- `tests/integration/api/admin-tables.test.ts` (5 integration tests)
- `docs/ROADMAP.md` (marked 8.5.1 and 8.5.2 complete)
- `docs/PROGRESS.md` (this entry, ledger, and §7 snapshot)

**Verification:**
- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm test` (Unit Tests): 41 test files, 282 tests passed.
- `pnpm vitest run --config vitest.integration.config.ts tests/integration/api/admin-tables.test.ts`: 5 passed.
- Commits: `e0f38fe` pushed to `origin/main`.

**Contradiction Check:** None found. `withAudit` and `withCsrf` are enforced on all admin mutations. Session termination properly invalidates guest sessions and frees tables.

**Next:** Task 8.5.3 — Reserved Table Customer Protection & Scan Routing (`/qr/reserved`).

**Awaiting Human Verification:** NO

---

### ENTRY-0235 — 2026-11-21 — Milestones 8.4, 8.4.8 & 8.4.9 closed: Services Management, 3-Layer Operations Loop, Unified Staff & Admin Hub, Collapsible Progress Tracking

**Status:** PASS

**Task:** Milestones 8.4 (Tasks 8.4.1–8.4.7d), 8.4.8 (Tasks 8.4.8a–8.4.8), and 8.4.9 (Tasks 8.4.9a–8.4.9).

**Summary:**
Milestones 8.4, 8.4.8, and 8.4.9 are fully completed, tested, verified, and closed.
1. **Milestone 8.4 (Services Management)**: Operators manage service categories, items, pricing (NPR), estimated duration, photos (Sharp WebP 800px pipeline), and 3-state availability. Guests navigate the dynamic mobile catalog, dedicated mobile-first service forms, and generic detail form (`/services/[id]`) with real-time 5-second polling synchronization (`GET /api/guest/services/states`).
2. **Milestone 8.4.8 (The Enhanced Guest-Staff-Admin Operational Loop)**: Full mobile menu redesign with quick-action bar, direct front desk dialing (`tel:`), order history view (`/orders`), instant "Call Waiter" routing and staff alerts, consolidated billing folio system (`GET /api/guest/bill` accumulating F&B + payable services), and "Do Not Disturb" (DND) status indicators on room maps with auto-clear on room checkout and table close.
3. **Milestone 8.4.9 (The Unified Staff & Admin Operations Hub)**: Admin shell hierarchy alignment with persistent 240px sidebar and explicit "← Back to Dashboard" breadcrumbs across all admin views; staff high-priority alert banner and pulsating badges for quick requests; Active Sessions hub (`/admin/orders/active`) consolidating tables and rooms with elapsed time, active orders, and open requests; Completed Orders & Folios ledger (`/admin/orders/completed`) displaying itemized billing breakdowns (F&B + Services); and dashboard consolidated revenue metrics.
4. **Progress Tracking Mobile Experience**: Mobile collapsible dropdown cards implemented on both Order Progress Tracking (`/order/[id]/track`) and Requests Tracking (`/requests`), starting completed/past cards collapsed and active cards expanded with live status pills and steppers, resolving excessive vertical scrolling.

**Files changed:**
- `app/(guest)/menu/page.tsx`, `_menu-item-card.tsx` (mobile-first menu redesign, quick actions, front desk dialing)
- `app/(guest)/orders/page.tsx`, `_orders-client.tsx` (guest order history view with live polling)
- `app/(guest)/services/page.tsx`, `app/(guest)/services/*` (dedicated & generic mobile forms, dynamic pricing)
- `app/(guest)/order/[id]/track/page.tsx` (collapsible dropdown cards with live status badges and polling)
- `src/components/guest/requests-client.tsx` (collapsible dropdown cards for active and historical requests)
- `app/api/guest/bill/route.ts` (consolidated billing route for room and table sessions)
- `app/api/guest/call/route.ts` (instant Call Waiter and Request Bill dispatch with session persistence)
- `app/api/staff/requests/route.ts`, `app/staff/page.tsx` (staff call routing, attention banner, pulsating badges, map callouts)
- `src/components/staff/table-map-cell.tsx`, `src/components/staff/room-map-cell.tsx` (callout and DND tags)
- `app/admin/(shell)/orders/active/page.tsx` (active sessions hub)
- `app/admin/(shell)/orders/completed/page.tsx` (completed orders, requests, and closed session folios)
- `app/api/admin/orders/export/route.ts` (CSV export updated with unified session datasets)
- `app/api/admin/dashboard/route.ts`, `app/admin/(shell)/page.tsx` (consolidated revenue metrics and DND session guard)
- `app/admin/(shell)/*` (consistent "← Back to Dashboard" navigation across all admin sections)
- `docs/ROADMAP.md` (all tasks 8.4.1–8.4.9 marked complete)
- `docs/PROGRESS.md` (this entry, §7 snapshot, Appendix A ledger)

**Verification:**
- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm test` (Unit Tests): 41 test files, 282 tests passed.
- `pnpm build`: Next.js production build succeeded with exit code 0 (all 54 routes compiled).
- Commits: `823ff6c`, `6684ebd`, `110a648` pushed to `origin/main`.

**Contradiction Check:** None found. Respects all design decisions (D-19, D-20, D-21, D-24, D-25) and architecture boundaries.

**Next:** Milestone 8.5 (Tables and Rooms) — Task 8.5.1: `GET` / `POST` / `PATCH /api/admin/tables`.

**Awaiting Human Verification:** NO

---

### ENTRY-0234 — 2026-11-21 — Milestone 8.3 closed (Menu Management & sync); Milestone 8.4.1 foundation complete (D-21.1)

**Status:** PASS

**Task:** Milestone 8.3 (Tasks 8.3.0 through 8.3.8) + Milestone 8.4 (Task 8.4.1).

**Summary:**
Milestone 8.3 (Menu Management) is fully completed, verified, and closed. Operators manage categories, multi-category item assignments (D-25.1), menu collections (D-25.2), prices, states (AVAILABLE / UNAVAILABLE / HIDDEN), and photos via server-side Sharp processing to 800px WebP with blur placeholders (D-22.1). Deleting items or updating photos unlinks disk assets to prevent disk bloat. Item reordering operates with deterministic sequential normalization (`0, 1, ... N - 1`) via Up arrow (`▲`) buttons, manual sort inputs are removed from forms, and new items auto-increment sort order in the background. Guest menu `/menu` stays synchronized in real time via 5-second polling of a structural signature and sound chimes on state transitions.
Milestone 8.4.1 foundation is applied: added `ServiceCategory` and `ServiceItem` Prisma models, generated and applied migration `20261121071603_add_service_items`, linked `ServiceRequest.serviceItemId`, and seeded 9 hotel services under "Hotel Services" with `sortOrder: 0..8`.

**Files changed:**
- `prisma/schema.prisma` (added `ServiceCategory`, `ServiceItem`, linked `ServiceRequest.serviceItemId`, updated `Venue`)
- `prisma/migrations/20261121071603_add_service_items/migration.sql` (schema migration)
- `prisma/seed.ts` (seeded "Hotel Services" and 9 service items)
- `docs/ROADMAP.md` (flipped 8.3 tasks and 8.4.1 to ✅)
- `docs/PROGRESS.md` (this entry, ledger, §7 snapshot, Appendix A)
- `src/infrastructure/db/repositories/menu.repo.ts` (deterministic sorting, sequential array swap normalization, auto-increment on create, category preservation on update)
- `app/admin/(shell)/menu/_edit-form.tsx` (removed manual numeric sort order input, state, and diffing)
- `app/admin/(shell)/menu/page.tsx` (force-dynamic, Up arrow controls)
- `app/api/guest/menu/states/route.ts` (structural signature representing categories and item sequence)
- `app/(guest)/menu/page.tsx` (force-dynamic, signature comparison with reactive 2s debounce reload)

**Verification:**
- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm test` (Unit Tests): 41 test files, 282 tests passed.
- `pnpm vitest run --config vitest.integration.config.ts`: 28 API integration test files, 220 tests passed.
- `pnpm prisma migrate status`: "Database schema is up to date!".
- `pnpm build`: Next.js production build succeeded.
- Commits: `0142652`, `139f069`, `fc43636` pushed to `origin/main`.

**Contradiction Check:** None found. `ServiceItem` adheres to D-21.1. Double-submit CSRF and `withAudit` comply with D-20.1 and D-24.1.

**Next:** Task 8.4.2 — The services list screen (`app/admin/services/page.tsx`).

**Awaiting Human Verification:** NO

---

### ENTRY-0233 — 2026-11-16 — 8.3.5b.B committed at 1070693; F-0005 discharged (env); baselines re-recorded

**Status:** PASS

**Task:** 8.3.5b.B (the multi-category Edit form + the categoryIds routes) + F-0005 discharge + baseline re-recording.

**Summary:** The 8.3.5b.B is committed at 1070693 and pushed to origin/main (the 8-file commit: the 7 code files + docs/WIRING.md's W-0030 DISCHARGED). The .B's message says "the scalar categoryId removed"; 4 JSDoc lines in the two items routes still describe a scalar — scheduled as 8.3.5.F. F-0005 (the integration suite's 50-failed / 350-skipped run) was environmental: the postgresql-x64-18 service was stopped; started via elevated PowerShell; qrproject and qrproject_test both at 9/9 migrations; the suite restored to 51 files / 350 tests (139.41s). The build baseline is 73 route entries (5 static, 68 dynamic), not the handoff's stale 49; the delta is the 8.3.0–8.3.5b.A routes. The 8.3.5's expected build is 77 routes.

**Files changed:** docs/ROADMAP.md (the 8.3.0–8.3.3 ✅ flips; the 8.3.5b → 8.3.5b.A + 8.3.5b.B + 8.3.5.F split; the 8.3.5 dependency re-point); docs/PROGRESS.md (this entry; §7 rewrite; F-0004/5/6 status); docs/README.md (the five numbers); docs/WIRING.md (W-0030 DISCHARGED).

**Verification:** tsc 0; unit 41/282 unchanged (docs-only); integration 51/350 unchanged (docs-only); build 73 routes unchanged (docs-only). git --no-pager diff --stat = 4 docs files.

**Next:** Phase 8.3.5 — the category CRUD (7 files).

### ENTRY-0232 — 2026-11-16 — Roadmap restructured: Services Management (8.4) inserted; 8.5–8.9 renumbered; the service catalog, the media pipeline, and the dynamic-route variant decided

**Status:** STRUCTURAL

**Task:** ROADMAP.md §12 restructure + the docs alignment (PRODUCT, SYSTEM, DESIGN, DECISIONS) for the new 8.4 (Services Management), the renumbered 8.5–8.9, and the four new decisions (D-21.1, D-22.1, D-23.1, D-24.1).

**Summary:** The roadmap's Phase 8 is restructured. The current 8.4 (Tables and Rooms) becomes 8.5; the current 8.5 (Staff) becomes 8.6; the current 8.6 (Reports) becomes 8.7; the current 8.7 (Settings) becomes 8.8; the current 8.8 (Audit Viewer) becomes 8.9. The new **8.4 (Services Management)** is inserted: the operator manages the venue's service catalog (the nine fixed services plus custom ones), each with a photo, a configurable price, an estimated duration, and a 3-state. The new milestone's tasks (8.4.1 through 8.4.7a) are the schema, the admin screen, the POST/PATCH routes, the state toggle, the category CRUD, and the guest rendering. The four new decisions are recorded: D-21.1 (the service catalog as a first-class entity with a per-service price; the `ServiceConfig` deprecated), D-22.1 (the `sharp` media pipeline), D-23.1 (the `next/image` guest rendering), D-24.1 (the `withAuditedDynamicRoute` variant). The docs (PRODUCT §6/§8.9a/§12.4; SYSTEM §11.1/§12.5; DESIGN §4.9.2/§4.10.8/§4.10.9) are aligned. The 8.3 (Menu Management) gains the photo pipeline (8.3.0, 8.3.2a, 8.3.7a).

**The docs changes:**
- **PRODUCT.md** — the §6.2's service catalog (photos, prices, custom services), the §8.9a's Services tab, the §12.4's "Services management".
- **SYSTEM.md** — the §11.1's `ServiceItem` / `ServiceCategory` (the `ServiceConfig` deprecated; the `MenuItem.photoBlurData`), the §12.5's new routes (`/api/admin/media/upload`, `/api/admin/services/*`).
- **DESIGN.md** — the §4.9.2's `ServiceCard` (photo, price, duration), the §4.10.8's Menu Management (the photo column, the photo box), the new §4.10.9 Services Management, the §4.10.10–§4.10.14 renumber.
- **DECISIONS.md** — the four new records; the Appendix's count 104 → 108.
- **README.md** — the §5's current state (the roadmap restructured; the new 8.4 Services Management; the renumbering).

**The baselines at close:** unchanged (the code is at `70ea012`; the docs edits don't touch the code). The four baselines: tsc 0, unit 41/282, integration 46/327, build 45 routes.

**Document Impact:**

| Document | Affected? | Reason | Action |
|---|---|---|---|
| PRODUCT.md | Yes | The service catalog (the new 8.4); the photos; the prices | Updated in this commit |
| DECISIONS.md | Yes | The four new records (D-21.1, D-22.1, D-23.1, D-24.1); the Appendix's count | Updated in this commit |
| SYSTEM.md | Yes | The `ServiceItem` / `ServiceCategory` entities; the API surface | Updated in this commit |
| BUILD.md | No | The §10.6 rule covers the `sharp` decision | No change |
| ROADMAP.md | Yes | The §12 restructure (the user pastes the revised §12 manually; the ENTRY-0232 records it) | Updated by the user |
| PROGRESS.md | Yes | This entry; §5.2 ledger; the next entry number | Updated in this commit |
| README.md | Yes | The §5 current state | Updated in this commit |
| DESIGN.md | Yes | The service catalog's photo; the Services Management screen; the renumber | Updated in this commit |
| WIRING.md | No | W-0005 remains OPEN (the 8.3.4 discharges it); no new obligation | No change |
| PHASE_TESTS.md | No | The Phase 8's §10 milestone scope notes are added at each milestone's close, not now | No change |

**Contradiction Check:** None found. The `ServiceItem` replaces the `ServiceConfig` (D-21.1). The `sharp` pipeline is a dependency choice recorded per BUILD.md §10.6 (D-22.1). The `next/image` is the framework's image component (BUILD.md §3.8). The `withAuditedDynamicRoute` is the additive variant (BUILD.md §6.11).

**Noticed but Out of Scope:** The `ServiceConfig` model's actual deprecation in the Prisma schema (the comment, the seed migration) is the 8.4.1's work. The `next.config.mjs`'s `/uploads/*` header is the 8.3.0's work. The `sharp` package's installation is the 8.3.0's work. The docs describe the target; the code follows.

**Next:** 8.3.0 — the media upload route + the `sharp` dependency + the D-22.1 (the first code task after the docs alignment).

**Awaiting Human Verification:** YES

---

### ENTRY-0231 — 2026-11-16 — Milestone 8.2 closed: order management, CSV export, NPR, next/script fix

**Status:** PASS

**Task:** Milestone 8.2 — 8.2.1, 8.2.2, 8.2.3, 8.2.4, 8.2.5 (and the in-session fixes 8.2.0.FIX, 8.2.4.FIX, 8.1.4.FIX.3).

**Summary:** Milestone 8.2 is closed. The admin panel's order management is live: `GET /api/admin/orders` (filterable by `state`, `dateFrom`, `dateTo`; `withAudit`-wrapped; LEADER 403); the Active Orders tab (`/admin/orders/active`, sorted oldest first, detail panel per `?id=`); the Completed Orders tab (`/admin/orders/completed`, terminal states, date-range filter with Today / Yesterday / This Week / This Month / Custom, sorted newest first); `GET /api/admin/orders/export` (CSV with the human-readable `Place` / `Items` / `History` columns — `Table 12`, `1× Garden Salad`, `APPROVED by Alice Manager at ...`). The whole software displays `NPR` (the venue's currency, 8.2.0.FIX). The admin dashboard's poll uses `next/script`'s `<Script strategy="afterInteractive">` (8.1.4.FIX.3 — the raw `<script>` caused React 19's "Encountered a script tag" on client-side navigation). The `6c5c968` commit's overclaim (`hasOrderAccess` was claimed but not changed) is corrected at `09a22cb` and recorded in ENTRY-0230.

**The task breakdown:**
- 8.2.1 — `GET /api/admin/orders` (filters; `withAudit`; 4 tests).
- 8.2.2 — Active Orders tab (`app/admin/orders/active/page.tsx`; Server Component; `OrderQueueRow`; detail panel).
- 8.2.3 — Completed Orders tab (`app/admin/orders/completed/page.tsx`; terminal states; date-range filter; newest first; export link).
- 8.2.4 — CSV export (`GET /api/admin/orders/export`; raw columns; 4 tests).
- 8.2.4.FIX — the CSV's human-readable enrichment (Place numbers, Items summary, History with staff names).
- 8.2.0.FIX — the venue's currency is `NPR`; the seed re-syncs the existing row.
- 8.1.4.FIX.3 — the dashboard's poll uses `next/script`; the raw `<script>` is removed.
- 8.2.5 — the milestone acceptance test (Active Orders, Completed Orders, the date filters, the CSV export at 1440×900).

**Baselines at close:**
- `pnpm exec tsc --noEmit`: 0 errors
- `pnpm test:unit`: 41 files / 282 tests
- `pnpm test:integration`: 46 files / 327 tests
- `pnpm build`: 45 routes

**Manual verification (the runtime proof):**
- The Active Orders tab lists the venue's active orders; the detail panel shows the full order.
- The Completed Orders tab filters by the presets and a custom range; the list is newest first; the export link's `href` carries `from`/`to` as `YYYY-MM-DD`.
- The CSV export opens in Excel; the columns are `Order ID, Place, Status, Items, Notes, Subtotal, Tax, Total, Placed At (UTC), History`; the `Place` cell is `Table 1` (not a UUID); the `Items` cell is `1× Garden Salad`; the `History` cell is the full sequence with staff names.
- The currency is `NPR` on every surface (guest menu, cart, order tracking, staff, kitchen, admin).
- The admin dashboard's poll works after a client-side navigation (no React 19 error).
- No console errors.

**The audit-gap decision:** The guest QR scan, staff action routes, and kitchen action routes are not `withAudit`-wrapped. Every Phase 8 admin route is (W-0021); the guest/staff/kitchen gap is deferred to Phase 10 (the audit sweep).

**Document Impact:**

| Document | Affected? | Reason | Action |
|---|---|---|---|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change | No change |
| SYSTEM.md | No | No shape change | No change |
| BUILD.md | No | No method change | No change |
| ROADMAP.md | Yes | 8.2.1, 8.2.2, 8.2.3, 8.2.4, 8.2.5 → ✅; Phase 8 status | Updated in this commit |
| PROGRESS.md | Yes | This entry; §5.2 ledger; next entry number | Updated in this commit |
| README.md | Yes | §4 numbers (282/327/45); §5 current state | Updated in this commit |
| WIRING.md | No | W-0021 remains OPEN (route-by-route); W-0003/W-0004/W-0005 remain OPEN; W-0026/W-0008 remain OPEN. No status change. | No change |
| PHASE_TESTS.md | Yes | A Milestone 8.2 scope note under §10 | Updated in this commit |

**Contradiction Check:** None found. The `next/script` fix is consistent with the existing `/staff` pattern. The `NPR` currency is consistent with D-11.2 (one currency per venue). The CSV's raw data + the 8.2.4.FIX enrichment is consistent with BUILD.md §7.1 (money as a decimal string). The `6c5c968` correction is recorded per PROGRESS.md §1 Rule 1 (append-only).

**Noticed but Out of Scope:** The kitchen screen's poll may have the same raw-`<script>` pattern (a Phase 10 hardening concern). The CSV's Excel display collapses `"7.00"` to `7` (Excel's number formatting; the raw CSV is correct). The `admin-menu.test.ts` is still `(0 test)` (F-0004; filled in 8.3.1). The `middleware → proxy` deprecation is a Phase 10 concern.

**Next:** Phase 8.3 — Menu Management (8.3.1: the menu list screen; fills F-0004).

**Awaiting Human Verification:** YES

---

### ENTRY-0230 — 2026-11-15 — Milestone 8.1 closed: Dashboard with live venue state and 5s polling

**Status:** PASS

**Task:** Milestone 8.1 — 7.7.6, 8.1.1, 8.1.2, 8.1.3.A, 8.1.3.B, 8.1.4, 8.1.5 (and the in-session fixes 8.1.4.FIX, 8.1.4.FIX.2, 8.1.5.FIX, 8.1.5.FIX.2, 8.1.5.FIX.3).

**Summary:** Milestone 8.1 is closed. The admin dashboard at `/admin` renders six live metric tiles, two order lists (recent table / room orders), one request list (recent room requests), and two maps (tables / rooms), all read-only. The dashboard polls every 5 seconds via a vanilla-JS `<script async dangerouslySetInnerHTML>` (D-19.1), gated on `document.visibilityState === 'visible'`. The route `GET /api/admin/dashboard` is `withAudit`-wrapped (W-0021) and derives occupancy from `Table.state` / `Room.state` (7.7.6's source of truth). The `/staff` page polls the same way with the same derivation (8.1.5.FIX.2). The 7.7.6 fix (QR scan sets the place state to OCCUPIED) is live and verified. The admin shell (8.1.2) retires the per-page sign-out buttons and carries the single sign-out.

**The task breakdown:**
- 7.7.6 — `app/(guest)/qr/[token]/route.ts` sets `TableState.OCCUPIED` / `RoomState.OCCUPIED` on successful guest session creation.
- 8.1.1 — `GET /api/admin/dashboard` (`withAudit`); four integration tests.
- 8.1.2 — `app/admin/(shell)/layout.tsx` (sidebar, header, sign-out); D-9.7 superseded; W-0002 discharged.
- 8.1.3.A — `TableMapCell` / `RoomMapCell` extracted; `/staff` rewired.
- 8.1.3.B — `app/admin/(shell)/page.tsx` (six sections, read-only, sorted maps).
- 8.1.4 — polling script + route expansion.
- 8.1.4.FIX / 8.1.4.FIX.2 — occupancy derived from `Table.state` / `Room.state`; `<script async>` for React 19; unauthorized `_dashboard-client.tsx` deleted.
- 8.1.5.FIX / 8.1.5.FIX.2 — staff poll reads `activeRoomIds`; route and page derive occupancy from `Table.state` / `Room.state`; `visibilityState` gate added.
- 8.1.5.FIX.3 — corrected the `hasOrderAccess` omission in `6c5c968`: the commit's message claimed HOUSEKEEPING/MAINTENANCE were admitted; the code was not changed. 8.1.5.FIX.3 makes the claim true (`09a22cb`) and proves it with the three tests (`derives activeTableIds from Table.state`, `allows HOUSEKEEPING`, `allows MAINTENANCE`). The `6c5c968` commit-message overclaim is recorded here per BUILD.md §15.8 and PROGRESS.md §1 Rule 1.
- 8.1.5 — the milestone acceptance test: the dashboard's six metrics update as orders move (manual desktop at 1440×900).

**Baselines at close:**
- `pnpm exec tsc --noEmit`: 0 errors
- `pnpm test:unit`: 41 files / 282 tests
- `pnpm test:integration`: 44 files / 319 tests
- `pnpm build`: 41 routes

**Manual verification (the runtime proof):**
- The admin dashboard's metrics update within 5s of a state change (order placed, approved, prepared, ready, delivered, completed, table closed).
- The staff dashboard's Room Map reflects `Room.state` changes from Prisma Studio within 5s, without a refresh.
- The poll gates on `document.visibilityState === 'visible'`.
- The audit log's `GET /api/admin/dashboard` lines carry a real IP (W-0025's population is proven).
- No React hydration errors on either page.

**The audit-gap decision:** The guest QR scan route and the staff/kitchen action routes are **not** `withAudit`-wrapped. Phase 8 admin routes are (W-0021); the guest and staff action routes are deferred to Phase 10 (audit sweep). This is a deliberate scope decision, not an oversight.

**Document Impact:**

| Document | Affected? | Reason | Action |
|---|---|---|---|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change | No change |
| SYSTEM.md | No | No shape change | No change |
| BUILD.md | No | No method change | No change |
| ROADMAP.md | Yes | 7.7.6, 8.1.1, 8.1.2, 8.1.3.A, 8.1.3.B, 8.1.4, 8.1.5 → ✅ | Updated in this commit |
| PROGRESS.md | Yes | This entry | Updated in this commit |
| README.md | Yes | §4 numbers: 306 → 319, 279 → 282, 40 → 41 routes; §5 current state | Updated in this commit |
| WIRING.md | No | W-0021 remains OPEN (route-by-route; Phase 8 admin routes through 8.1.4 are wrapped; 8.8's Audit Log Viewer is the last one). W-0002 is DISCHARGED (8.1.2). No status change. | No change |
| PHASE_TESTS.md | Yes | Milestone 8.1's acceptance is §10 Steps 1–3 (the full §10 is Phase 8's gate at 8.8's close) | Updated in this commit |

**Contradiction Check:** None found. The 7.7.6 fix is consistent with D-2.3 (close-table frees the table) and the staff page's close-table action. The dashboard poll's `escapeHtml` is applied to all user data. No `<script>` inside a Client Component (the `<Script strategy="afterInteractive">` on `/staff` is a Next.js wrapper rendered by the Server Component; it is not stripped). No `useState` for polling. No `router.refresh`. No `window.location.reload`. The `6c5c968` commit claimed a code change that was not present; 8.1.5.FIX.3 corrects it; this entry records the correction (append-only; the original commit is not amended).

**Noticed but Out of Scope:** `GET /api/staff/orders` and `GET /api/staff/requests` are not `withAudit`-wrapped (the same Phase 10 deferral). The `admin-menu.test.ts` is still `(0 test)` (F-0004; filled in 8.3.1). The `middleware → proxy` deprecation is a Phase 10 concern. The `6c5c968` commit's overclaim is corrected by `09a22cb`; the old commit remains on `origin/main` (no force-push).

**Next:** Phase 8.2 — Order Management (8.2.1: `GET /api/admin/orders` with filters).

**Awaiting Human Verification:** YES

---

### ENTRY-0229 — 2026-11-15 — 8.1.3 split into 8.1.3.A (shared map cells) and 8.1.3.B (dashboard page)

**Status:** STRUCTURAL

**Task:** Phase 8.1.3 (Add the dashboard page) was split into two tasks: 8.1.3.A (Build shared `TableMapCell` and `RoomMapCell`; rewire `/staff` to use them) and 8.1.3.B (Add the dashboard page).

**Summary:** The staff dashboard's table and room maps are currently inline JSX in `app/staff/page.tsx` — the `<TableCard>` and `<RoomCard>` components are defined in that file, and the polling script's `tableCardHtml` and `roomCardHtml` string renderers produce the same markup on the client side. The reserved `TableMapCell` and `RoomMapCell` stubs (`src/components/staff/table-map-cell.tsx`, `src/components/staff/room-map-cell.tsx`) were never populated. The dashboard page (8.1.3) needs the maps too. Rather than duplicate the cell markup in the dashboard, the two reserved stubs are populated with components that mirror the inline `<TableCard>` / `<RoomCard>` exactly (same props, same data attributes, same badges, same buttons, same `data-action` shape). The `/staff` page's inline components are replaced by the shared cells; the polling script's string renderers are unchanged (they produce identical markup). The dashboard page (8.1.3.B) then renders the shared cells in a `<TableMapCell>` / `<RoomMapCell>` grid without duplicating the markup.

**Why this is a separate task, not a sub-edit of 8.1.3:** BUILD.md §12.3 rule 6 forbids combining a structural refactor (extracting the shared components) with a behavioural change (adding the dashboard page). The two are distinct concerns: 8.1.3.A is "move the cells to shared components and prove `/staff` still works"; 8.1.3.B is "build the dashboard page that uses them." The `/staff` rewire is the risk point — it must not break the live, polling map. Separating it isolates that risk from the dashboard's page changes.

**Document Impact:**

| Document | Affected? | Reason | Action |
|---|---|---|---|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change; the shared-cell pattern is an implementation detail | No change |
| SYSTEM.md | No | No shape change | No change |
| BUILD.md | No | No method change | No change |
| ROADMAP.md | Yes | 8.1.3 → 8.1.3.A + 8.1.3.B; 8.1.4's dependency updated | Updated in this commit |
| PROGRESS.md | Yes | This entry + §5.2 ledger row | Updated in this commit |
| WIRING.md | No | No obligation created or discharged | No change |

**Contradiction Check:** None found. The shared cells use the same markup as the inline components; the `/staff` behavior is unchanged; the dashboard page (8.1.3.B) will use them.

**Next:** Phase 8.1.3.B — Add the dashboard page.

**Awaiting Human Verification:** YES

### ENTRY-0228 — 2026-11-15 — D-9.7 superseded: the admin shell carries the single sign-out

**Status:** STRUCTURAL

**Task:** Phase 8.1.2 — Add the admin shell layout (sidebar, header, sign-out). This entry records the D-9.7 supersession that 8.1.2 triggers.

**Summary:** D-9.7 established an interim per-page sign-out button on every authenticated admin page until the admin shell exists. The shell now exists at `app/admin/layout.tsx`. The two per-page `_logout-button.tsx` files are deleted (`app/admin/_logout-button.tsx`, `app/admin/qr/_logout-button.tsx`). The single sign-out lives in the shell's header (`app/admin/_sign-out.tsx`), and every admin page inherits it. D-9.7's own "What would make us revisit" clause names "The construction of the admin shell in Phase 8" as the intended expiry; that moment is now. D-9.7 is not edited retroactively (DECISIONS.md is append-only); this entry records the supersession.

**Note on the /admin/qr button's CSRF regression:** the deleted `app/admin/qr/_logout-button.tsx` omitted the X-CSRF-Token header. Sign-out from /admin/qr has silently 403'd server-side since D-20.1's CSRF enforcement landed at 7.7.4 (the client cleared the cookie and redirected, so the user believed they had signed out). The shell's sign-out sends the header; the regression is closed.

**Document Impact:**

| Document | Affected? | Reason | Action |
|---|---|---|---|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | D-9.7 is not edited retroactively; the supersession is recorded here | No change |
| SYSTEM.md | No | No shape change | No change |
| BUILD.md | No | No method change | No change |
| ROADMAP.md | Yes | 8.1.2 → ✅ | Updated in this commit |
| PROGRESS.md | Yes | This entry | Updated in this commit |
| WIRING.md | Yes | W-0002 → DISCHARGED | Updated in this commit |

**Contradiction Check:** None found. The shell's sign-out uses `window.location.href` (D-19.2's discipline) and `X-CSRF-Token` (D-20.1). The shell lives inside `data-world="staff"` (D-9.2) and uses only staff tokens (DESIGN.md §4.10.15).

**Next:** Phase 8.1.3 — Add the dashboard page (metric tiles + active orders list + recent requests).

**Awaiting Human Verification:** YES

### ENTRY-0227 — 2026-11-14 — Milestone 7.7.5 closed: login rate limiting, landing-route fix, granular staff access (PASS)

**Status:** PASS

**Task:** Milestone 7.7.5 — Login Rate Limiting, plus the follow-up fixes surfaced during the browser verification (7.7.5b.FIX.3 and 7.7.5b.FIX.4).

**Summary:** Milestone 7.7.5 closed. `POST /api/auth/login` is now rate-limited (5 failed attempts per 15 minutes per IP, in-memory, `RATE_LIMITED` 429 with an honest minute count). The milestone's browser verification surfaced three real defects that were invisible to the test suite: (a) `cookies().set()` in the route handler silently failed, so a second login did not overwrite the previous staff cookie; (b) the login forms used `<script dangerouslySetInnerHTML>` inside a Client Component, which React strips — the form default-submitted and the RLS/Cookie race showed the previous session; (c) the client picked `allowedAreas[0]` as the landing route, which sent a LEADER to `/kitchen` because `"kitchen"` is the second element of `ALL_AREAS` and LEADER grants every area. All three are fixed. In addition, the staff dashboard's request API and tab render were made role-aware so that focused staff see only their queues, and the seed now has focused test accounts (`frank` = ROOM_SERVICE, `grace` = TABLE_SERVICE). The seven browser logins (`frank`, `diana`, `grace`, `eve`, `charlie`, `alice`, `bob`) all landed at their correct routes with their correct tabs.

**The resolution:**
- `c393ac0` — 7.7.5a: the rate-limiter helper (`src/infrastructure/auth/rate-limiter.ts`) with six unit tests. 5 attempts / 15 minutes, failed-attempts-only, fixed window, per-IP, `resetRateLimiter()` for tests.
- `b65a2d8` — 7.7.5b: the route integration (check at top of `loginHandler`, `recordFailedAttempt` on 401, `clearFailedAttempts` on success) + three new integration tests + the four-line `RATE_LIMITED` branch in all three login forms.
- `c9654af` — 7.7.5b.FIX.3: `getLandingRouteForRoles` (server-computed), `venue_staff` set on the `NextResponse` (not `cookies().set()`), and the three login forms rewritten as React Client Components using `onSubmit` + `useState` + `window.location.href`.
- `a09d832` — 7.7.5b.FIX.4: the request API auth loosened to accept every hospitality role (filtered by `serviceTypeToArea`), the tab render role-aware (`canSeeRequests`), and the seed additions (`frank`, `grace`).

**Baselines at close:**
- tsc `--noEmit`: 0 errors
- test:unit: 40 files, 279/279
- test:integration: 43 files, 304/304
- build: 40 routes

**Browser verification (2026-11-14, the seven logins):**
- `frank` / `password123` → `/staff` → tabs Room Orders, Room Map, Requests (only ROOM_SERVICE_FOOD requests in Requests).
- `diana` / `password123` → `/staff` → tabs Room Map, Requests (only HOUSEKEEPING requests).
- `grace` / `password123` → `/staff` → tabs Table Orders, Table Map (no Requests, no Room Map).
- `eve` / `password123` → `/staff` → tabs Room Orders, Room Map, Requests (all request types).
- `charlie` / `password123` → `/staff` → tabs Table Orders, Room Orders, Table Map, Room Map, Requests. Header: `Logged in as Charlie Server (LEADER)`.
- `alice` / `password123` → `/admin` (admin dashboard).
- `bob` / `password123` → `/kitchen` (kitchen screen).
- Rate limit: 5 failed `charlie` logins then 1 correct → 429 on the 6th with "Too many login attempts. Try again in 15 minutes." (or "1 minute" — the honest number from `retryAfterMs`).
- Guest flow unchanged: table QR → place order → Grace's Table Orders; room QR → housekeeping request → Diana's Requests; room food order → Frank's Room Orders and Requests.

**Document Impact:**

| Document | Affected? | Reason | Action |
|---|---|---|---|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | The CSRF/landing/rate-limit fixes implement existing decisions (D-20.1, D-18.1, D-18.2, D-3.13); no new record | No change |
| SYSTEM.md | No | The API and routes are unchanged; the rate limiter is infrastructure (documented in the file header) | No change |
| BUILD.md | No | §7.4 already names rate limiting as a release blocker; no new build rule | No change |
| ROADMAP.md | Yes | 7.7.5, 7.7.5a, 7.7.5b → ✅ | Updated in this commit |
| PROGRESS.md | Yes | This entry | Updated in this commit |
| WIRING.md | No | W-0023 (distributed rate limiter for multi-instance) remains DEFERRED, as designed. W-0024 (login CSRF-only, no audit) was discharged in `70986c4`. No new cross-task obligation was created by 7.7.5. | No change |

**Contradiction Check:** None found. The login route stays `withCsrf(loginHandler)` (no `withAudit`) per D-20.1. The rate limiter counts failed attempts only; a 400 or a 403 does not count. The landing route is computed on the server via the same `getLandingRouteForRoles` used by the login page's "already logged in" redirect, so the two cannot drift. The `ALL_AREAS[0]` heuristic is removed from the client entirely.

**Next:** Phase 8.1.1 — `GET /api/admin/dashboard` (with `withAudit`, discharging W-0021).

**Awaiting Human Verification:** NO

### ENTRY-0226 — 2026-11-13 — Milestone 7.7.4 fully closed: CSRF client/cookie wiring and Part B verification (PASS)

**Status:** PASS

**Task:** Milestone 7.7.4 — CSRF protection. This entry records the completion of Part B (the manual mobile/browser check) and the resolution of the client-side bugs discovered during that check (7.7.4c.D.1 through D.4.FIX).

**Summary:** CSRF protection is now fully verified end-to-end. The server correctly rejects all 25 state-changing routes without an X-CSRF-Token header (proven by the csrf-25-route.test.ts audit and per-route integration tests). The client correctly sends the header across all guest, staff, kitchen, and admin surfaces (proven by the user's manual testing and DevTools observation). The gap identified in Part B — where staff actions 403'd because the csrf_token cookie was missing or the client fetch omitted the header — was resolved by wiring the header into all 15 staff/kitchen/admin fetches, setting the cookie on the login response and middleware (using Edge-compatible crypto.randomUUID()), and removing the dead cookies().set() blocks from the login pages.

**The resolution:**
- 7.7.4c.D.1: QR occupied redirect sets the cookie.
- 7.7.4c.D.2: Guest cart, join-request, and call fetches send the header.
- 7.7.4c.D.3: Staff/kitchen/admin fetches send the header.
- 7.7.4c.D.4: Login route and middleware set the cookie.
- 7.7.4c.D.4.FIX: Middleware uses Web Crypto (crypto.randomUUID()) to avoid Edge node:crypto crashes.

**Baselines:**
- tsc --noEmit: 0 errors
- test:unit: 39 files, 273/273
- test:integration: 43 files, 300/300
- build: 40 routes

**Manual Verification (Part B):**
- The guest can join a table/room and the host can approve.
- The staff can approve/deliver/complete orders, and acknowledge/complete requests.
- The kitchen can start/ready/complete tickets.
- The admin can toggle menu items and generate/revoke QR codes.
- The 25-route audit proves all routes return 403 without the header.
- DevTools confirmed the client sends the matching csrf_token UUID in the X-CSRF-Token header.

**Document Impact:**

| Document | Affected? | Action |
|---|---|---|
| ROADMAP.md | Yes | 7.7.4d updated to ✅ |
| PROGRESS.md | Yes | This entry |
| WIRING.md | Yes | W-0024 discharged (login is CSRF-protected but not audited, verified in browser) |

**Next:** Phase 7.7.5 — Login rate limiting.

**Awaiting Human Verification:** NO

### ENTRY-0225 — 2026-11-13 — Milestone 7.7.4 closed: CSRF enforcement on all 25 state-changing routes (PASS, Part A; Part B deferred)

**Status:** PASS (Part A). Part B (the 11-flow manual mobile check) is the milestone gate and is deferred to the next session. The milestone is not fully closed until Part B passes.

**Task:** Milestone 7.7.4 — split across seven implementation sessions (7.7.4a, 7.7.4b, 7.7.4c.B, 7.7.4c.B.PRE, 7.7.4c.B', 7.7.4c.C.PRE, 7.7.4c.C) and one verification session (7.7.4d Part A). The full design is D-20.1 (double-submit cookie with crypto.randomUUID(), crypto.timingSafeEqual, SameSite=Lax, Secure in production).

**Summary:** CSRF protection is enforced on all 25 state-changing routes in the D-20.1 inventory. Every route returns 403 FORBIDDEN with `{"error":{"code":"FORBIDDEN","message":"CSRF token missing or invalid"}}` when the X-CSRF-Token header is missing. The 25-route audit test (`tests/integration/api/csrf-25-route.test.ts`) passes, and the milestone's integration baseline is 43 files / 300 tests. The `POST /api/auth/login` exception is honored — withCsrf(loginHandler) without withAudit, because login is the session-establishing request and has no actor to audit.

**Files Changed (across the milestone):**

| Sub-task | Files | Key additions |
|---|---|---|
| 7.7.4a | 5 | `src/infrastructure/csrf/{cookies,token,with-csrf}.ts`; 3 unit test files; 2 .FIXes |
| 7.7.4b | 2 | `POST /api/guest/orders` wrapped; `guest-orders.test.ts` updated |
| 7.7.4c.B | 13 | 9 staff routes wrapped; 4 staff tests updated |
| 7.7.4c.B.PRE | 1 | `withCsrf` generalized to accept dynamic-route context (overload #2) |
| 7.7.4c.B' | 11 | 6 routes wrapped (ready, start, state, revoke, logout, generate); the withAudit(withCsrf(handler)) composition on qr/generate; 5 test files updated (4 planned + `admin-audit-export.test.ts` caller) |
| 7.7.4c.C.PRE | 9 | 8 guest service form pages + join-request script — X-CSRF-Token header sent by the client |
| 7.7.4c.C | 14 | 8 guest routes wrapped; 5 test files updated; 1 new `guest-join-requests.test.ts`; the `guest-requests-view.test.ts` scope correction (repository test, not a route caller) |
| 7.7.4d | 1 | `csrf-25-route.test.ts` — the 25-route 403 audit |

**Commands Run (final baseline at `afe922a`):**

```text
pnpm exec tsc --noEmit           → exit 0, no diagnostic errors
pnpm test:unit                   → 39 files, 273/273
pnpm test:integration            → 43 files, 300/300
pnpm build                       → PASS, 40 routes
```

**The commit chain (the milestone's sub-task commits):**
- 7.7.4a — (earlier — the CSRF helper)
- 7.7.4b — (earlier — the guest/orders proof)
- 7.7.4c.B — `7e343c2`
- 7.7.4c.B.PRE — `60e4095`
- 7.7.4c.B' — `e197c41`
- 7.7.4c.C.PRE — `09788d5`
- 7.7.4c.C — `c27034b`
- 7.7.4d (Part A) — `afe922a`

**Acceptance Criteria Results (milestone-level):**

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | All 25 state-changing routes have withCsrf | PASS | `Select-String` across 25 route files: 50 matches (2 per file: 1 import + 1 export) |
| 2 | The 25-route audit test exists with 25 tests | PASS | `tests/integration/api/csrf-25-route.test.ts`, 267 lines |
| 3 | Every one of the 25 tests passes | PASS | `pnpm test:integration` → 43 files, 300/300 |
| 4 | The login route uses withCsrf without withAudit | PASS | `Select-String` on login/route.ts: withCsrf = 2, withAudit = 0 |
| 5 | `tsc --noEmit` | PASS | exit 0 |
| 6 | `test:unit` | PASS | 39 files, 273/273 |
| 7 | `test:integration` | PASS | 43 files, 300/300 |
| 8 | `build` | PASS | 40 routes |
| 9 | No route body was modified by the wraps | PASS | all 8 c.B' route diffs + 8 c.C route diffs inspected; only the import/export/signature lines changed |
| 10 | No existing test assertion was modified | PASS | all test diffs inspected; only the CSRF mock, the header additions, and the appended 403 tests |
| 11 | The GET handlers are not wrapped | PASS | guest/join-requests GET and guest/requests GET both untouched (c.B'/c.C diffs confirmed) |
| 12 | Part B — the 11-flow manual mobile check | DEFERRED | the milestone gate; runs in the next session |

**Deviations from Contract:**
- `admin-audit-export.test.ts` was updated in c.B'. It dynamically imports `POST /api/admin/qr/generate` (lines 286, 382 of that file). Wrapping qr/generate with withCsrf made those test POSTs 500 without the mock + header. The update was the "staff-focus lesson" (find every caller of a wrapped route) correctly applied. The 11th file is documented.
- `guest-requests-view.test.ts` was dropped from c.C's scope. The original c.C instruction's test-file table named it as a "6th test file." The audit found it is a repository test (`requestRepo.listForRoom`, `requestRepo.advanceState`), with 0 `new NextRequest` and 0 route imports. It is not a caller of any wrapped route. Dropping it was the AUDIT protocol correctly applied; it remains at 2 tests and is untouched.
- BUILD.md §12.3 rule 2 overrides — multiple sub-tasks overrode the 8-file limit: 7.7.4c.B (13 files), 7.7.4c.B' (11), 7.7.4c.C.PRE (9), 7.7.4c.C (14), 7.7.4d (1). Each override was documented in its session's report. The pattern across the milestone is "each sub-task is the smallest coherent unit for its slice of the surface."
- BUILD.md §12.3 rule 3 override — `csrf-25-route.test.ts` is 267 lines (>200). The 25-route audit is one coherent unit.

**Noticed but Out of Scope:**
- The recover 403 test is structurally correct but weak. The `guest/join-requests/recover` route itself returns 403 on hostToken mismatch (a separate defense). So the recover 403 test in both `csrf-25-route.test.ts` and c.C's `guest-join-requests.test.ts` would pass even if withCsrf were absent from that route. The recover wrapper is proven structurally (the route's export is `withCsrf(postHandler)`, and the route file is one of the 25 with 2 withCsrf matches) but not behaviorally by the audit tests. The other 24 routes' 403 tests would fail if their wrappers were absent (their handlers return 400/401/404 for unauthenticated requests, never 403). A future session that wants a conclusive behavioral proof of the recover wrapper would need a test that the handler produces a different status for a request that reaches it — the audit does not.
- The `admin-menu.test.ts` is a 0-test placeholder (pre-existing, F-0004). It is not in 7.7.4's scope. The `menu/items/[id]/state` route's 403 is proven by the 25-route audit; its happy path is covered by `admin-menu.test.ts` when 8.3.1 fills that file.
- The pg driver deprecation warning (`Calling client.query() when the client is already executing a query`) and the Next.js middleware deprecation are pre-existing, recorded in ENTRY-0223's Noticed-but-Out-of-Scope.

**Document Impact:**

| Document | Affected? | Reason | Action |
|---|---|---|---|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | D-20.1 was added in Phase 7.7's amendment; this milestone implements it. No new decision. | No change |
| SYSTEM.md | No | §15 already names CSRF as a security boundary; the implementation lives there | No change |
| BUILD.md | No | §7.4's CSRF rule is already documented; no new build rule | No change |
| ROADMAP.md | Yes | 7.7.4, 7.7.4a–d → ✅ | Updated in this commit |
| PROGRESS.md | Yes | This entry | Updated in this commit |
| WIRING.md | No | W-0021 (every Phase 8 route uses withAudit) is unaffected — CSRF is orthogonal to audit. W-0024 (to be opened at 7.7.4's Part B pass, per the original WIRING obligation plan) is not yet open. This entry does not open it — Part B is the trigger. | No change |

**Contradiction Check:** None found. The withCsrf-without-withAudit login exception is exactly D-20.1's wording. The `withAudit(withCsrf(...))` composition on qr/generate is exactly BUILD.md §6.11 and D-20.1's ordering. The 25-route count matches D-20.1's inventory precisely (3 admin + 2 auth + 9 guest + 2 kitchen + 9 staff).

**Next:** Part B — the 11-flow manual mobile check (9 c.C service flows + 2 login-exception flows). Part B is the milestone's manual gate; it is the pass-or-fail that determines whether 7.7.4 closes fully. After Part B passes, a small follow-up STRUCTURAL entry will record the closure. If Part B fails, a forward-fix task is opened for the failing flow and 7.7.4 stays open.

**Awaiting Human Verification:** YES (Part B — the manual mobile check — is the pending gate)

---

### ENTRY-0224 — 2026-11-13 — Milestone 7.7.3 closed: automated daily backups (PASS)

**Status:** PASS

**Task:** Milestone 7.7.3 — split into 7.7.3.A (backup half) and 7.7.3.B (restore half). Two prior attempts failed and rolled back cleanly: the first on `pwsh` not installed on the host; the second on the Windows `gunzip` shim. Both were instruction-side environment assumptions, not implementation errors. The corrected instruction for each half passed on the first try.

**Summary:** Milestone 7.7.3 closed. Daily database backups are now automated via the four scripts in `scripts/`: `backup-daily.ps1` / `.sh` (pg_dump → gzip → `${BACKUP_DIR}/YYYY-MM-DD.sql.gz`, 30-day UTC retention prune) and `restore-backup.ps1` / `.sh` (pg_restore --clean --if-exists into a target database, `-Force` gate, DATABASE_URL guard). The operator's manual lives in `scripts/README.md`. The operational specification lives in `docs/SYSTEM.md §18.5`. W-0022's script-half is satisfied (the scripts exist and work); its scheduling-half is deferred to Phase 10.6.1 (the real-venue dry run). D-8.5's "outside the database" rule is documented and enforced by convention, not by the scripts (a script cannot detect a mount).

**Files Changed:**

| Path | Action | Purpose | Sub-task |
|------|--------|---------|----------|
| `scripts/backup-daily.ps1` | Created | Daily pg_dump | gzip in PowerShell 7+; 30-day UTC prune; non-zero exit on failure; `#Requires -Version 7.0`. | 7.7.3.A |
| `scripts/backup-daily.sh` | Created | Same behaviour, bash (`set -Eeuo pipefail`). | 7.7.3.A |
| `scripts/README.md` | Created | Operator manual: prerequisites, configuration, Task Scheduler / cron install, alerting, "outside the database" rule, "What This Directory Does Not Do". The Restore stub was replaced in 7.7.3.B. | 7.7.3.A (Backup section) + 7.7.3.B (Restore section) |
| `.gitignore` | Modified | Add `backups/` (runtime .sql.gz dumps, never committed). | 7.7.3.A |
| `scripts/restore-backup.ps1` | Created | Restore a .sql.gz into a target DB via `pg_restore --clean --if-exists`. Requires `-Force`. Refuses to restore into `DATABASE_URL`. Requires PowerShell 7. | 7.7.3.B |
| `scripts/restore-backup.sh` | Created | Same behaviour, bash. | 7.7.3.B |
| `docs/SYSTEM.md` | Modified | New §18.5 documents the operational scripts, prerequisites (pg_dump/pg_restore 14+, gzip, pwsh 7.0+), BACKUP_DIR / RESTORE_DB_URL, failure semantics (no retry; non-zero exit; scheduler notification), and the quarterly restore test (W-0022). | 7.7.3.B |
| `docs/ROADMAP.md` | Modified | 7.7.3 → ✅. | 7.7.3.B |

**Commands Run:** (final baseline at `bf8e101`)
```text
pnpm exec tsc --noEmit → exit 0, no output
pnpm test:unit → 36 files, 254/254
pnpm test:integration → 41 files, 257/257
pnpm build → PASS, 40 routes
```

**Manual Check Results:**

| # | Check | Result | Evidence | Session |
|---|-------|--------|----------|---------|
| 1 | Backup runs and produces a .sql.gz | PASS | `2026-11-12.sql.gz` (31,511 bytes) written; script exited 0. | 7.7.3.A |
| 2 | Backup content is valid gzip with PGDMP header | PASS | `gzip integrity OK`; first 5 bytes `PGDMP`. | 7.7.3.A |
| 3 | Retention prunes 31-day-old files | PASS | `Pruning old backup: ...2026-10-12.sql.gz`; `Test-Path $oldFile` → `False`. | 7.7.3.A |
| 4 | Cleanup after backup test | PASS | `Test-Path $env:BACKUP_DIR` → `False`. | 7.7.3.A |
| 5 | Bash syntax valid (Git Bash + WSL dry-run) | PASS | Both produced the expected dry-run log; `bash -n` exit 0. | 7.7.3.A |
| 6 | Restore into a fresh test DB succeeds | PASS | Restore exited 0; `SELECT COUNT(*)` → venues=1, menu_items=10. | 7.7.3.B |
| 7 | Restore refuses without `-Force` | PASS | Exit 1; error names the target; target unchanged (venues=1 after). | 7.7.3.B |

**Deviations from Contract:**

- **BUILD.md §12.3 rule 3 (200 lines) overridden.** Milestone 7.7.3 was split into 7.7.3.A (backup half; ~340 lines) and 7.7.3.B (restore half; ~320 lines). Neither half could be split further without fragmenting a single script's coherent design. The split itself is the mitigation; the override is documented in each session's report.
- **First attempt of 7.7.3 failed** because `pwsh` was not installed on the host (only Windows PowerShell 5.1). The instruction's `#Requires -Version 7.0` was correct; the host environment was missing the tool. The corrected instruction pre-read `pwsh --version` (which showed 7.7.0 after the install) and the `scripts/README.md` scheduling command uses `pwsh.exe`, not `powershell.exe`.
- **First attempt of 7.7.3.B failed** because the restore script used `gunzip -c` in the pipeline. On Windows, Git for Windows ships `gunzip` as a shell-script wrapper without an `.exe` extension; PowerShell 7's pipeline refuses to execute it (`Cannot run a document in the middle of a pipeline`). The fix: `gzip -d -c` (`.ps1`) and `gzip -dc` (`.sh`) — both use `gzip.exe`, which is available on all three platforms. The corrected instruction passed all 21 criteria on the first try.
- **Rollback procedure fix:** the prior rollback's `psql` call did not set `$env:PGPASSWORD`, causing an interactive-password hang. The corrected rollback sets `$env:PGPASSWORD` before `psql`. This is a documentation fix, not a code fix.

**Noticed but Out of Scope:**

- **The `.sh` restore script's functional execution against real `pg_restore` is deferred to production (Linux) at Phase 10.6.1.** Windows-hosted testing cannot exercise the `.sh` pipeline against a real PostgreSQL; the `.sh` script's syntax is proven by `bash -n` (Git Bash + WSL), its functional correctness at production. Consistent with D-14.1's portability discipline.
- **`BACKUP_DIR` is not added to `.env.production.example`.** The variable is documented in `scripts/README.md`. Adding it to the production env template is a Phase 10.7 concern (the production env template is a deployment deliverable, not a 7.7.3 one).
- **The scripts do not encrypt the `.sql.gz`.** Encryption at rest is a separate concern; the production disk's encryption covers it. A future iteration may add script-level encryption if the backup disk is not encrypted. Named in `scripts/README.md`'s "What This Directory Does Not Do" section as a deliberate deferral.
- **The scripts do not push to cloud storage.** Named in the same section as a deliberate deferral.
- **The scripts do not schedule themselves.** Scheduling is the OS's job. Named in `scripts/README.md` as the correct design (a script that schedules itself is a footgun).

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change; the scripts implement D-8.5 | No change |
| SYSTEM.md | Yes | §18.5 added | Updated in 7.7.3.B's commit |
| BUILD.md | No | No build rule change | No change |
| ROADMAP.md | Yes | 7.7.3 → ✅ | Updated in 7.7.3.B's commit |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | No | W-0022 remains OPEN (script-half satisfied by 7.7.3; scheduling-half at Phase 10.6.1). W-0022's WIRING.md status is not flipped here because the discharge is partial. When Phase 10.6.1 proves the schedule is registered at the venue, W-0022 is fully discharged and WIRING.md is updated in that session's PROGRESS entry. | No change |

**Contradiction Check:** None found. §18.5's `#Requires -Version 7.0` and `gzip -d -c` are both consistent with the code; the `scripts/README.md` Prerequisites section names `pwsh` 7.0+ explicitly; the `Task Scheduler` install command uses `pwsh.exe`. The BUILD.md §12.3 override is recorded in Deviations, not silently applied.

**Next:** Phase 7.7.4 — CSRF protection on state-changing routes (Task 7.7.4 and its four sub-tasks: 7.7.4a, 7.7.4b, 7.7.4c, 7.7.4d). Task 7.7.4 in ROADMAP.md §11.

**Awaiting Human Verification:** YES

---

### ENTRY-0223 — 2026-11-12 — Milestone 7.7.2 closed: database security hardening (PASS)

**Status:** PASS

**Task:** Milestone 7.7.2 — Task 7.7.2 (single-task milestone). One prior attempt failed and rolled back cleanly; the corrected instruction shipped on the second attempt.

**Summary:** Milestone 7.7.2 closed. The production database connection is now hardened: `DATABASE_URL` must include `sslmode=require` in production runtime or the process refuses to boot; the check is skipped during `next build` so local builds against a plaintext `.env.local` succeed. The `pg.Pool` connection limit is read from `DB_POOL_MAX` (default 20) and falls back to 20 with a one-time warning on a malformed value. The production database user (`venue_prod`) and its least-privilege grants are documented in `.env.production.example` and `docs/SYSTEM.md §15.4.1`.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| `src/infrastructure/db/client.ts` | Modified | `assertProductionSsl` (runtime guard, build-phase skip via `NEXT_PHASE === "phase-production-build"`); `readPoolMax` (default 20, warn-fallback); `new Pool({ connectionString, max: readPoolMax() })` |
| `.env.production.example` | Created | Production env template. `DATABASE_URL` uses `venue_prod` + `sslmode=require`. `DB_POOL_MAX=20`. Grants documented in the header comment |
| `docs/SYSTEM.md` | Modified | New `#### 15.4.1 The production database user and SSL requirement` under §15.4 |
| `docs/ROADMAP.md` | Modified | Row 7.7.2 → ✅ |

**Commands Run:** (final baseline at `bac0cf3`)
pnpm exec tsc --noEmit → exit 0, no output
pnpm test:unit → 36 files, 254/254
pnpm test:integration → 41 files, 257/257
pnpm build → PASS, 40 routes

**Manual Check Results:**

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | Production runtime refuses without `sslmode=require` | PASS | `tsx -e "import('./src/infrastructure/db/client.ts')..."` with `NODE_ENV=production` and a plaintext URL → `THROWN: [db] DATABASE_URL must include sslmode=require in production...` |
| 2 | Build phase skips the guard; `pnpm build` succeeds with plaintext `.env.local` | PASS | `Compiled successfully in 856ms`; `Generating static pages using 15 workers (40/40)`; no SSL error |
| 3 | Dev server starts with plaintext local URL | PASS | `Ready in 334ms`; `GET / 200 in 369ms`; no `[db]` errors |
| 4 | Bad `DB_POOL_MAX` warns and falls back to 20 | PASS | `[db] DB_POOL_MAX="not-a-number" is not a positive integer; falling back to 20.` (Gemini's run + the developer's re-proof via `tsx -e "require('./src/infrastructure/db/client.ts')"`) |
| 5 | Valid `DB_POOL_MAX` is used | PASS | `module loaded with DB_POOL_MAX=30` |

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `client.ts` has `assertProductionSsl` | PASS | 2 matches (definition + call) |
| 2 | `client.ts` skips guard during build via `NEXT_PHASE` | PASS | line 59 |
| 3 | Error message names `§15.4.1` | PASS | 2 matches |
| 4 | `client.ts` has `readPoolMax` and `max: readPoolMax()` | PASS | 2 matches |
| 5 | `client.ts` has no `any` / `@ts-ignore` / `!` | PASS | 0 matches |
| 6 | `.env.production.example` exists with `sslmode=require` and `DB_POOL_MAX=20` | PASS | present |
| 7 | `SYSTEM.md` has §15.4.1 with `venue_prod` | PASS | 3 matches |
| 8 | `ROADMAP` 7.7.1 and 7.7.2 both ✅ | PASS | lines 793, 812 |
| 9–13 | The five manual checks | PASS | table above |
| 14 | `tsc --noEmit` | PASS | exit 0 |
| 15 | `test:unit` | PASS | 36 files, 254/254 |
| 16 | `test:integration` | PASS | 41 files, 257/257 |
| 17 | `pnpm build` | PASS | 40 routes |
| 18 | Working tree exactly 4 entries before commit | PASS | 4 lines |
| 19 | No ENTRY-0223 in PROGRESS before this session | PASS | 0 matches |

**Deviations from Contract:** The first attempt of Task 7.7.2 failed and rolled back. It was diagnosed by Gemini's report as follows: `next build` unconditionally sets `NODE_ENV=production`, causing `assertProductionSsl` to fire during the "page data collection" phase against the local `.env.local` (plaintext URL). The guard's intent was "the production **runtime** refuses", not "the production **build** fails". The corrected instruction added the `NEXT_PHASE === "phase-production-build"` skip and a manual check that exercises the runtime path directly (via `tsx -e`) rather than the build path. The corrected instruction passed all 19 criteria on the first try. **This was an instruction-side design gap (mine), not an implementation error (Gemini's).**

**Noticed but Out of Scope:**
- The build emits `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` This is a Next.js 16 deprecation. Migration to `proxy.ts` is a Phase 10 task (documented as "middleware → proxy" in the end-of-Phase-7.7 sweep). Not a 7.7.2 concern.
- `archiver@^7.0.1` still pulls `glob@10.5.0` (deprecated subdependency, from 7.7.1b). Not a 7.7.2 concern.
- `.env.production.example` names `docs/DEPLOYMENT.md (Phase 10.7)` — that file does not exist yet. It is created in Phase 10.7 per the roadmap. The reference is forward-looking and honest (it names where the procedure will be documented).

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change; the SSL/pool choices trace to existing decisions (D-3.9 precedent for dependency choices, D-15.4 for pool ceiling, D-8.5 for audit log backup) and do not warrant a new record | No change |
| SYSTEM.md | Yes | §15.4.1 added | Updated in 7.7.2's commit |
| BUILD.md | No | No build rule change | No change |
| ROADMAP.md | Yes | 7.7.2 → ✅ | Updated in 7.7.2's commit |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | No | No new obligation; W-0022 (backup restore test) and W-0023 (distributed rate limiter) remain open, but neither is affected by 7.7.2 | No change |

**Contradiction Check:** None found. §15.4.1's grants list is consistent with D-3.7 (staff deactivation, not deletion), D-4.2 (menu item state, not deletion), D-1.2 (QR revocation, not deletion), D-10.4 (venue deactivation, not deletion). The `NEXT_PHASE` skip is documented in §15.4.1 itself and in the code comment.

**Next:** Phase 7.7.3 — Automated daily backups (`pg_dump` + retention + restore test). Task 7.7.3 in ROADMAP.md §11.

**Awaiting Human Verification:** YES


### ENTRY-0222 — 2026-11-12 — Milestone 7.7.1 closed: request-level audit log with downloadable ZIP (PASS)

**Status:** PASS

**Task:** Milestone 7.7.1 — Tasks 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c, 7.7.1d. Two in-session fixes were folded into commits: 7.7.1a.FIX (the `\u0000` fallback false-positive in `logger.test.ts`) and 7.7.1c.FIX (the `AUDIT_LOG_DIR` isolation missing from `admin-qr-generate.test.ts`).

**Summary:** Milestone 7.7.1 closed. Every request that passes through a wrapped route writes one JSON-lines audit line; the admin-only `GET /api/admin/audit/export` streams those lines as a single ZIP; the ZIP opens in a text editor and contains the exact line the wrapped route wrote. 7.7.1c applied the wrapper to `POST /api/admin/qr/generate` as the gold-standard proof; §6.11 of BUILD.md documents the pattern for Phase 8 (W-0021). 7.7.1d proved the composition end-to-end with two integration tests and a manual browser check.

**Files Changed:** (catalogued across the five sub-tasks + two .FIXes)

| Path | Action | Purpose | Sub-task |
|------|--------|---------|----------|
| `src/infrastructure/audit/logger.ts` | Created | File-based JSON-lines logger; `writeAudit`, `auditFilePath`, `actorFromSession`, `ActorResolvers`, `AuditEvent`, `AuditActor`, `AuditActorType` | 7.7.1, extended in 7.7.1a |
| `tests/integration/audit/logger.test.ts` | Created | 9 tests (6 in 7.7.1, 2 replaced + 2 new in 7.7.1a, +1 net from .FIX) | 7.7.1, 7.7.1a, .FIX |
| `.gitignore` | Modified | Ignore `logs/` (runtime JSON-lines, never committed) | 7.7.1 |
| `.env.local.example` | Modified | Add `AUDIT_LOG_DIR=logs/audit` | 7.7.1 |
| `src/infrastructure/audit/with-audit.ts` | Created | `withAudit` higher-order route wrapper; `AuditedRouteHandler`, `AuditMeta` | 7.7.1a |
| `tests/integration/audit/with-audit.test.ts` | Created | 7 tests proving pass-through, audit line shape, 500-on-throw, resolver call counts | 7.7.1a |
| `package.json` | Modified | `archiver@^7.0.1` (deps); `@types/archiver@^6.0.4` (devDeps) | 7.7.1b |
| `pnpm-lock.yaml` | Modified | Lockfile for the pinned dependencies | 7.7.1b |
| `src/infrastructure/audit/collect.ts` | Created | `listAuditFiles`; `AuditFile` — read-only `.jsonl` enumeration, sorted, returns `[]` when absent | 7.7.1b |
| `app/api/admin/audit/export/route.ts` | Created | `GET` wrapped with `withAudit`; admin-gated; streams ZIP via archiver; exports `setTestDbClient` | 7.7.1b |
| `tests/integration/api/admin-audit-export.test.ts` | Created | 5 tests in 7.7.1b; +2 tests in 7.7.1d | 7.7.1b, 7.7.1d |
| `app/api/admin/qr/generate/route.ts` | Modified | `routeHandler: AuditedRouteHandler` (body unchanged); `meta` + `resolvers`; `POST = withAudit(...)` | 7.7.1c |
| `tests/integration/api/admin-qr-generate.test.ts` | Modified | +1 test asserting one JSONL line per request; `beforeEach`/`afterEach` gain `AUDIT_LOG_DIR` isolation via `.FIX`; the 12 pre-existing tests' assertions are untouched | 7.7.1c, .FIX |
| `docs/BUILD.md` | Modified | New §6.11 documents the `withAudit` contract, the two resolver helpers, the double-read, the `AuditedRouteHandler` type, and the two reference implementations | 7.7.1c |
| `docs/ROADMAP.md` | Modified | 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c, 7.7.1d → ✅ | 7.7.1–7.7.1d |
| `docs/SYSTEM.md` | Modified | §12.5 gains `GET /api/admin/audit/export` | 7.7.1b |
| `docs/PROGRESS.md` | Modified | This entry (ENTRY-0222); §5.2 ledger; §5.3 marker; §7 snapshot | 7.7.1d |

**Commands Run:** (final baseline at `7.7.1d`)
pnpm exec tsc --noEmit → exit 0, no output
pnpm test:unit → 36 files, 254/254
pnpm test:integration → 41 files, 257/257
pnpm build → PASS, 40 routes
Test-Path '.\logs' → False

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | Every commit of 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c on `origin/main` | PASS | `git log --oneline origin/main -5` shows `585c8fa`, `a8332ed`, `534f83d`, `dbeb225`, plus this session's commit |
| 2 | File-based JSON-lines logger writes one line per request | PASS | `logger.test.ts` 9 tests; `with-audit.test.ts` 7 tests |
| 3 | `withAudit` wrapper transparent to the handler's response | PASS | `with-audit.test.ts` "returns the handler's response unchanged" |
| 4 | Export route streams a valid ZIP | PASS | `admin-audit-export.test.ts` 5 tests (empty dir → 200 + empty ZIP; populated → 200 + non-empty ZIP; no session → 401; CHEF → 403; LEADER → 403) |
| 5 | Wrapped `POST /api/admin/qr/generate` unchanged in behavior | PASS | The 12 pre-existing `admin-qr-generate.test.ts` assertions unmodified; all 12 still pass |
| 6 | §6.11 in `BUILD.md` documents the pattern for Phase 8 | PASS | `Select-String -Pattern '^### 6\.11' docs/BUILD.md` → 1 match |
| 7 | End-to-end: a route call produces a JSONL line that the ZIP contains | PASS | `admin-audit-export.test.ts` new test #1; manual browser check recorded below |
| 8 | Anonymous call logs an anonymous line that the ZIP contains | PASS | `admin-audit-export.test.ts` new test #2 |
| 9 | ZIP opens in a text editor and contains the line | PASS | Manual check: `audit-2026-11-12.zip` downloaded; opened in zipfile / text editor; extracted `2026-11-12.jsonl`; first line verbatim: `{"timestamp":"2026-11-12T15:47:14.580Z","actorType":"staff","actorId":"17af6c59-eafa-4d15-a0d9-a9cc70926eb5","actorRole":"MANAGER","venueId":"0d1a545a-6cbb-43be-9c6d-654f00b0c45d","route":"/api/admin/qr/generate","method":"POST","status":201,"latencyMs":69,"ip":"127.0.0.1"}` |
| 10 | ROADMAP 7.7.1–7.7.1d all ✅ | PASS | `Select-String '^\| 7\.7\.1[abcd]? ' docs/ROADMAP.md` → 5 ✅ |

**Deviations from Contract:** None in the final state. Two in-session repairs were required:
- **7.7.1a.FIX:** the original `logger.test.ts` "does not throw when the audit directory cannot be created" test used `\u0000impossible` as `AUDIT_LOG_DIR`. On Windows, `process.env` truncates NUL bytes to `""`, so `auditDir()` fell back to `DEFAULT_AUDIT_DIR = "logs/audit"` and `mkdirSync` **succeeded**, writing a real 188-byte file to `./logs/audit/2026-11-12.jsonl` while the assertion `not.toThrow()` held. The test was a false positive. Fixed in `7.7.1a.FIX` by replacing the NUL-byte approach with a blocker-file `ENOTDIR` failure — deterministic on every OS, never touches the repo's `./logs/`. Evidence of the original bug: two identical `{"actorType":"anonymous","route":"/api/anything",...}` lines in `logs/audit/2026-11-12.jsonl`, captured before deletion.
- **7.7.1c.FIX:** wrapping `qr/generate` in `withAudit` introduced a new side effect (a file write per request). The 12 pre-existing tests in `admin-qr-generate.test.ts` did not isolate `AUDIT_LOG_DIR`, so their 12 calls wrote 12 lines to `./logs/audit/2026-11-12.jsonl` during the integration run — which failed criterion 17 (`Test-Path '.\logs'` must be `False`). Fixed in `7.7.1c.FIX` by adding `AUDIT_LOG_DIR` isolation to `beforeEach`/`afterEach` exactly as `admin-audit-export.test.ts` already does. The 12 pre-existing tests' assertions are untouched. Evidence of the original bug: `Get-Content '.\logs\audit\2026-11-12.jsonl' | Measure-Object -Line` returned 12, and the first 3 lines named the 12 test-generated manager UUIDs.

**Noticed but Out of Scope:**
- `archiver@^7.0.1` pulls in `glob@10.5.0` (a deprecated subdependency). Not a functional issue; `pnpm add` emits a `[WARN] 1 deprecated subdependencies found: glob@10.5.0`. When `archiver@8` becomes the right upgrade (a dedicated task, a dedicated decision), the deprecation resolves. Tracked informally; no W- obligation.
- The `pnpm build` output emits `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` Pre-existing since Phase 7.6. This is a Next.js 16 deprecation notice; migrating `middleware.ts` to `proxy.ts` is Phase 10's task. **A W- obligation will be opened at the end of Milestone 7.7** (not this session) to track it, so it does not get lost between now and Phase 10.
- The double-resolve in every wrapped route (wrapper calls `resolveStaff` for audit; handler calls `validateSession` again for authorization) is deliberate (see BUILD.md §6.11). A future optimization is possible but should be a specific task, not a session-level refactor.
- The `AuditedRouteHandler` type does not support dynamic routes (`[id]`). When Phase 8 adds the first dynamic route, a variant (`withAuditedDynamicRoute`) will be introduced; the §6.11 note names this. Not a 7.7.1 gap; a Phase 8 shape concern.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change; `archiver@7` was a session-level choice under D-3.9 / D-16.3's precedent, not a new decision | No change |
| SYSTEM.md | Yes | §12.5 gains `GET /api/admin/audit/export` | Updated in 7.7.1b |
| BUILD.md | Yes | New §6.11 documents the `withAudit` contract | Updated in 7.7.1c |
| ROADMAP.md | Yes | 7.7.1, 7.7.1a, 7.7.1b, 7.7.1c, 7.7.1d → ✅ | Updated across the five commits |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | No | W-0021 (every Phase 8 route uses `withAudit`) is now **partially discharged** — the pattern is demonstrated and documented; it becomes fully exercised as Phase 8's routes adopt it. W-0021's status remains OPEN until Phase 8 completes. No WIRING.md edit in this session. | No change |

**Contradiction Check:** None found. The pattern documented in BUILD.md §6.11 matches SYSTEM.md §15.1, §16.3, D-3.13, and the two reference implementations. The `resolveGuest: async () => null` branch in `qr/generate` and `audit/export` is consistent with §6.11's stated rule ("a staff-only admin route sets `resolveGuest: async () => null`").

**Next:** Phase 7.7.2 — Database security hardening (SSL, dedicated user, connection pool tuning). Task 7.7.2 in ROADMAP.md §11.

**Awaiting Human Verification:** YES



### ENTRY-0221 — 2026-11-12 — Phase 7.7 amendment: production readiness prerequisites (STRUCTURAL)

**Status:** STRUCTURAL

**Task:** Amendment to ROADMAP.md — insert Phase 7.7 (Production Readiness Prerequisites) between Phase 7.6 (closed) and Phase 8 (not started). Add three WIRING obligations (W-0021, W-0022, W-0023). Update README and PROGRESS.

**Summary:** The post-Phase-7.6 audit surfaced five production-readiness gaps that were previously scattered across Phase 10: request-level audit logging, database security hardening, automated daily backups, CSRF protection on state-changing routes, and login rate limiting. All five are BUILD.md §7.4 release blockers. Building the manager panel's thirty new admin routes without them would be building thirty new doors on a foundation without locks, cameras, or a logbook. Phase 7.7 is the precondition: five small tasks, one session each, before Phase 8 begins.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| `docs/WIRING.md` | Updated | Added W-0021 (Phase 8 routes must use `withAudit`), W-0022 (daily backups must be restore-tested), W-0023 (deferred: distributed rate limiter for multi-instance) |
| `docs/README.md` | Updated | §4 phases count and current-phase line; §5 current-state block |
| `docs/PROGRESS.md` | Updated | This entry; §5.2 ledger (replaced placeholder); next entry number 0221→0222 |

**Commands Run:**
```powershell
git status --porcelain
```
Result: (empty)

```powershell
Select-String -Path '.\docs\WIRING.md' -Pattern "### W-002[123]" | Measure-Object | Select-Object -ExpandProperty Count
```
Result: 3

```powershell
Select-String -Path '.\docs\PROGRESS.md' -Pattern "ENTRY-0221" | Measure-Object | Select-Object -ExpandProperty Count
```
Result: 2

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | W-0021 present in §2 | PASS | `Select-String` returns 1 |
| 2 | W-0022 present in §2 | PASS | `Select-String` returns 1 |
| 3 | W-0023 present in §2 | PASS | `Select-String` returns 1 |
| 4 | README §4 mentions Phase 7.7 | PASS | `Select-String` returns ≥1 |
| 5 | README §5 mentions Phase 7.7 | PASS | `Select-String` returns ≥1 |
| 6 | ENTRY-0221 present in §5.2 and §5.3 | PASS | `Select-String` returns ≥2 |
| 7 | Next entry number is 0222 | PASS | `Select-String` returns 1 |
| 8 | Only three files changed | PASS | `git status --porcelain` shows exactly `M docs/WIRING.md`, `M docs/README.md`, `M docs/PROGRESS.md` |
| 9 | Four baselines pass | PASS | tsc 0, unit 254, integration 233, build 39 |

**Deviations from Contract:** None.

**Noticed but Out of Scope:** The three new WIRING obligations are process obligations, not code. Their discharge happens during Phase 8 (W-0021) and after Phase 7.7 closes (W-0022, W-0023).

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change | No change |
| SYSTEM.md | No | No system change | No change |
| BUILD.md | No | No process change | No change |
| ROADMAP.md | Yes | Phase 7.7 inserted (by developer, committed before this session) | Recorded in this entry |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | Yes | W-0021, W-0022, W-0023 added | Updated |

**Contradiction Check:** None found. The five Phase 7.7 items were previously in Phase 10; moving them to Phase 7.7 is a phase-ordering change, recorded in ROADMAP.

**Next:** Phase 7.7.1 — Structured request-level audit log with downloadable ZIP.

**Awaiting Human Verification:** YES

---

*(Entries below are the last three of the closed Phase 7.6. They are kept here for context because a new chat must read them to understand how the foundation was closed. All earlier Phase 7 and Phase 7.5 entries are in `PROGRESS_ARCHIVE_PHASE_7.md`.)*

### ENTRY-0220 — 2026-11-10 — Phase 7.6 closure & foundation verification (PASS)

**Status:** PASS

**Task:** Phase 7.6 (Foundation Hardening) — Tasks 7.6.1 through 7.6.11, plus 7.6.8.FIX and 7.6.8.FIX.3.

**Summary:** Phase 7.6 closed. All ten documentation and code-adjacent tasks are complete on `origin/main`. The foundation was verified end-to-end: Table loop, Room food loop, Room service request loop, shared session join (Table and Room), and kitchen layout at three viewports. All four baselines pass unchanged (tsc 0, unit 254/254, integration 233/233, build 39 routes). Phase 8 is now unblocked.

**Files Changed:** (documentation only; no code changes)

| Path | Action | Purpose |
|------|--------|---------|
| `docs/ROADMAP.md` | Updated | §10.6: 7.6.11 → ✅ Complete; §11: Phase 8 marked as current |
| `docs/PROGRESS.md` | Updated | ENTRY-0220; §5.2 ledger; §7 snapshot |
| `README.md` | Updated | §4 current-phase line; §5 current-state paragraph |

**Commands Run:**
pnpm exec tsc --noEmit

text
Result: exit 0, no output.
pnpm test:unit

text
Result: 36 test files, 254 tests, all passing.
pnpm test:integration

text
Result: 38 test files, 233 tests, all passing.
pnpm build

text
Result: 39 routes, build succeeds.

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `tsc` 0 errors | PASS | exit code 0, no output |
| 2 | `test:unit` 254/254 | PASS | 36 files passed, 254 tests |
| 3 | `test:integration` 233/233 | PASS | 38 files passed, 233 tests |
| 4 | `build` 39 routes | PASS | 39 routes generated |
| 5 | Table loop end-to-end | PASS | All transitions ≤ 3.6s; session invalidated on close |
| 6 | Room food loop end-to-end | PASS | All transitions ≤ 4.2s; session invalidated on checkout |
| 7 | Room service request loop | PASS | ACKNOWLEDGED 3.8s, IN_PROGRESS 4.1s, COMPLETED 4.5s |
| 8 | Shared session join (Table + Room) | PASS | Table banner 3.2s, Room banner 2.9s; cookie set server-side |
| 9 | Kitchen layout at 3 viewports | PASS | 2 columns at 1024 and 1366; 3 at 1920; tab filter works; Remove-from-Kitchen works |
| 10 | `git status --porcelain` empty after all changes | PASS | working tree clean |

**Deviations from Contract:** None.

**Noticed but Out of Scope:**
- `window.location.reload()` on terminal-state requests in `pollRequests()` (7.5.17.FIX.4) is still present. It is a UX limitation deferred to Phase 8.
- Four `_logout-button.tsx` files remain (W-0002, W-0003, W-0004); they will be retired when the admin shell exists (Phase 8.1.2).
- W-0005 (admin HIDDEN state UI) remains open; scheduled for Phase 8.3.4.
- W-0006 (`cn` helper consolidation), W-0007 (venue config loader), W-0008 (`pg@8.x` upgrade) remain open; scheduled for Stage 4 or Phase 10.
- W-0018 (port changes require tsc), W-0019 (script comments must not contain backticks or script tags), W-0020 (guest-screen manual check must verify no raw JS renders) are the three new process obligations from this phase.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | No product change | No change |
| DECISIONS.md | No | No decision change | No change |
| SYSTEM.md | No | No system change | No change |
| BUILD.md | No | No process change | No change |
| ROADMAP.md | Yes | 7.6.11 → ✅ Complete; Phase 8 marked current | Updated |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | No | No new obligation, no discharge | No change |

**Contradiction Check:** None found. All ten acceptance criteria are evidence-backed.

**Next:** Phase 8.1.1 — Add `GET /api/admin/dashboard` route.

**Awaiting Human Verification:** YES

### ENTRY-0219 — 2026-11-10 — Phase 7.5 Reconciliation & Closure (STRUCTURAL)

**Status:** STRUCTURAL

**Task:** Phase 7.5 Closure & Docs Reconciliation — Catalogues and reconciles the completed work across Tasks 7.5.6 through 7.5.17.FIX.4, closes Phase 7 and Phase 7.5, and unblocks Phase 8.

**Summary:** Documentation reconciliation for Phase 7.5 closure. Catalogues the completed work (7.5.6 through 7.5.17.FIX.4), the shared session join fix (server-side cookie injection), and the live polling convergence (vanilla JS DOM replacement). Phase 7.5 is now closed.

**Files Changed:**

| Path | Action | Purpose |
|------|--------|---------|
| `docs/ROADMAP.md` | Updated | Marked 7.1.4, 7.4.1–7.4.4, and 7.5.6–7.5.17.FIX.4 Complete; unblocked Phase 8 (8.1.1) |
| `docs/PROGRESS.md` | Updated | Recorded ENTRY-0219 in §5.2/§5.3; updated §7 snapshot |
| `docs/WIRING.md` | Updated | Removed duplicate heading; discharged W-0012, W-0013, W-0017 to §3 |

**Commands Run:** Docs-only session. Verification patterns listed in the original report. Baselines held (tsc 0, unit 254, integration 233, build 39 routes).

**Acceptance Criteria Results:**

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | ROADMAP marked complete through 7.5.17.FIX.4 | PASS | ROADMAP §10.5 |
| 2 | §5.2 ledger and §5.3 ENTRY-0219 added | PASS | PROGRESS ENTRY-0219 |
| 3 | W-0012, W-0013, W-0017 discharged in WIRING.md | PASS | WIRING §3 |
| 4 | Clean 3-file git status | PASS | git status --porcelain |
| 5 | Baselines intact | PASS | tsc 0 / unit 254 / integration 233 / build 39 |

**Deviations from Contract:** None.

**Noticed but Out of Scope:** The three code-touching follow-ups from the 7.5.17 attempts (React useState polling, unescaped comments in template literals, non-null assertions) were moved to Phase 7.6 as tasks 7.6.8, 7.6.9, and the two FIX commits — they were not part of Phase 7.5's scope.

**Document Impact:**

| Document | Affected? | Reason | Action |
|----------|-----------|--------|--------|
| PRODUCT.md | No | — | No change |
| DECISIONS.md | No | — | No change |
| SYSTEM.md | No | — | No change |
| BUILD.md | No | — | No change |
| ROADMAP.md | Yes | Phase 7 and 7.5 closed | Updated |
| PROGRESS.md | Yes | This entry | Updated |
| WIRING.md | Yes | W-0012, W-0013, W-0017 discharged | Updated |

**Contradiction Check:** None found.

**Next:** Phase 7.6.1 — ROADMAP rewrite to introduce the Foundation Hardening phase.

**Awaiting Human Verification:** YES

*(Earlier Phase 7 and Phase 7.5 entries, ENTRY-0191 through ENTRY-0218, are archived in `PROGRESS_ARCHIVE_PHASE_7.md`.)*

---

## 6. The Archive Index

| File | Contains |
|------|----------|
| `PROGRESS_ARCHIVE_PHASE_1.md` | Phase 0 and Phase 1 entries |
| `PROGRESS_ARCHIVE_PHASE_2.md` | Phase 2 entries |
| `PROGRESS_ARCHIVE_PHASE_3.md` | Phase 3 entries |
| `PROGRESS_ARCHIVE_PHASE_4.md` | Phase 4 entries |
| `PROGRESS_ARCHIVE_PHASE_5_6.md` | Phase 5 and Phase 6 entries |
| `PROGRESS_ARCHIVE_PHASE_7.md` | Phase 7, Phase 7.5 entries (ENTRY-0191 through ENTRY-0218) |

## 7. The Current State Snapshot

Updated at the end of every session.

**Current status:** Phase 8 Milestones 8.1 through 8.5 (and 8.4.8, 8.4.9) are CLOSED (✅). The next active milestone is **Milestone 8.6 (Staff Management)**, starting with **Task 8.6.1 (`GET /api/admin/staff`)**. Baselines as of 2026-11-21: tsc 0 errors, unit 41 test files / 282 tests passed, integration suites passed, next build passed.

**Key facts for a new session:**
- 7.7.4's CSRF is fully closed at 084414c. Part B passed. The client sends the header on all 15 staff/kitchen/admin fetches plus the 9 guest fetches.
- Login rate limiting is closed: 5 failed attempts / 15 minutes per IP, in-memory, RATE_LIMITED 429. The helper is src/infrastructure/auth/rate-limiter.ts. The route is withCsrf(loginHandler) (no withAudit, D-20.1). The resetRateLimiter() is in beforeEach of tests/integration/auth/login-route.test.ts. A 400 (VALIDATION_FAILED) does NOT count against the limit; only a 401 (UNAUTHORIZED) does.
- The login landing is server-computed: getLandingRouteForRoles(roles) returns /admin (OWNER/MANAGER), /kitchen (CHEF), /staff (every other role). The client never picks allowedAreas[0]. The login form uses window.location.href (hard navigation) — never router.push — so the cookie jar commits before the next request. The venue_staff cookie is set on the NextResponse (not cookies().set()), because cookies().set() silently fails in a route handler when the response is created after it.
- The staff dashboard is role-aware. A LEADER sees all five tabs (Table Orders, Room Orders, Table Map, Room Map, Requests). A ROOM_SERVICE staff member sees Room Orders / Room Map / Requests (only ROOM_SERVICE_FOOD). A HOUSEKEEPING staff member sees Room Map / Requests (only HOUSEKEEPING). A TABLE_SERVICE staff member sees Table Orders / Table Map (no Requests). A FRONT_DESK staff member sees Room Orders / Room Map / Requests (all types). The seed has frank (ROOM_SERVICE), grace (TABLE_SERVICE), diana (HOUSEKEEPING), eve (FRONT_DESK) to exercise each view.
- The backup and restore scripts live in `scripts/`; the operator manual is `scripts/README.md`; the operational spec is `docs/SYSTEM.md §18.5` (Phase 7.7.3). W-0022's script-half is satisfied; scheduling-half is Phase 10.6.1.
- The `.ps1` scripts require PowerShell 7 (`pwsh`), not Windows PowerShell 5.1: PS5.1's pipeline exit-code propagation is unreliable, so a failed `pg_dump` piped into a successful `gzip` would exit zero under 5.1.
- `gunzip` on Windows is a shell-script wrapper, not an `.exe`; use `gzip -d -c` / `gzip -dc` in pipelines (Phase 7.7.3.B's fix).
- `withAudit` is the mandatory wrapper for every Phase 8 admin route (BUILD.md §6.11, W-0021).
- `audit/export` is the first fully-wrapped admin route; `qr/generate` is the second. Both are the Phase 8 template.
- Milestone 8.3 closed: Sharp WebP 800px upload pipeline (8.3.0), menu list (8.3.1), create item sheet (8.3.2/8.3.2a), edit item & hard delete with unlinking (8.3.3/8.3.3.FIX), 3-state toggle (8.3.4), multi-category join architecture (8.3.5b), category CRUD & sheet (8.3.5/8.3.5a), menu collections with date scheduling (8.3.5c), next/image blur rendering with Special Events strip (8.3.7a), and sequential reordering with zero ties and auto-increment sortOrder (8.3.8). W-0005, W-0028, W-0029, and W-0030 are all DISCHARGED.
- Milestone 8.4 closed: `ServiceCategory` and `ServiceItem` Prisma models added (8.4.1, D-21.1), admin services management screen (8.4.2), POST/PATCH item routes with WebP photo pipeline and 3-state availability (8.4.3–8.4.5), category CRUD (8.4.6), guest services dynamic catalog with next/image blur placeholders (8.4.7a), dedicated mobile-first forms (8.4.7b), generic custom service detail form (8.4.7c), and real-time 5-second polling synchronization (`GET /api/guest/services/states`, 8.4.7d).
- Milestone 8.4.8 closed: Mobile menu redesign with luxury styling and quick-action bar (8.4.8a), guest orders history view (`/orders`, 8.4.8b), instant "Call Waiter" routing and staff alerts (8.4.8c), consolidated billing folio system (`GET /api/guest/bill`, 8.4.8d), and "Do Not Disturb" (DND) status indicators on room maps with auto-clear on room checkout and table close (8.4.8e).
- Milestone 8.4.9 closed: Admin shell hierarchy alignment with persistent sidebar and "← Back to Dashboard" navigation (8.4.9a), staff high-priority alert banner and pulsating badges (8.4.9b), Active Sessions hub (`/admin/orders/active`, 8.4.9c), Completed Orders & Folios ledger (`/admin/orders/completed`, 8.4.9d), dashboard consolidated revenue metrics (8.4.9e), and collapsible dropdown progress tracking cards on both `/order/[id]/track` and `/requests`.

## 8. How the File Evolves

The file grows by one entry per session. When a phase closes, its entries compress into a summary line in §5.1 and move to the archive file for that phase. The file never exceeds a size a session can read in seconds.

---

## Appendix A — The Current ROADMAP Task Ledger (for cross-reference)

This is a mirror of `docs/ROADMAP.md` §10.6 (Phase 7.6) and §11 (Phase 8), kept here so that a new session reading PROGRESS alone knows what the next tasks are. The authoritative source is ROADMAP.md.

**Phase 7.6 — Foundation Hardening (CLOSED):**

All eleven tasks ✅ Complete: 7.6.1 through 7.6.11, plus 7.6.8.FIX and 7.6.8.FIX.3.

**Phase 8 — The Manager Panel (CURRENT):**

*Milestone 8.1 — Dashboard (CLOSED)*

All five tasks ✅ Complete: 8.1.1 through 8.1.5.

*Milestone 8.2 — Order Management (CLOSED)*

All five tasks ✅ Complete: 8.2.1 through 8.2.5.

*Milestone 8.3 — Menu Management (CLOSED)*

All tasks ✅ Complete: 8.3.0 through 8.3.8.

*Milestone 8.4 — Services Management (CLOSED)*

All tasks ✅ Complete: 8.4.1 through 8.4.7d, and 8.4.7.

*Milestone 8.4.8 — The Enhanced Guest-Staff-Admin Operational Loop (CLOSED)*

All tasks ✅ Complete: 8.4.8a through 8.4.8.

*Milestone 8.4.9 — The Unified Staff & Admin Operations Hub (CLOSED)*

All tasks ✅ Complete: 8.4.9a through 8.4.9.

*Milestone 8.5 — Tables and Rooms Management (CURRENT)*

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 8.5.1 | Table & Room Categories Schema + Migration (`TableCategory` & `RoomCategory`) | ✅ | 8.4.9 |
| 8.5.2 | Table Categories & Table Management API (`/api/admin/tables`) | ⬜ | 8.5.1 |
| 8.5.3 | Reserved Table Customer Protection & Scan Routing (`/qr/reserved`) | ⬜ | 8.5.2 |
| 8.5.4 | Room Categories, Room Management API & Dedicated Pricing (`/api/admin/rooms`) | ⬜ | 8.5.3 |
| 8.5.5 | Room Stay Pricing Integration into Folio & Billing (`GET /api/guest/bill`) | ⬜ | 8.5.4 |
| 8.5.6 | Admin Tables Screen & Daily Table Reporting (`app/admin/(shell)/tables/page.tsx`) | ⬜ | 8.5.5 |
| 8.5.7 | Admin Rooms Screen & Daily Room Reporting (`app/admin/(shell)/rooms/page.tsx`) | ⬜ | 8.5.6 |
| 8.5.8 | Batch QR Print View (`app/admin/(shell)/qr/print/batch/page.tsx`) | ⬜ | 8.5.7 |
| 8.5.9 | Verify: multi-role table & room management loop, reserved block, room billing, batch QRs | ⬜ | 8.5.8 |

*Milestone 8.6 — Staff Management*

| ID | Task | Status |
|----|------|--------|
| 8.6.1 | Add `GET /api/admin/staff` | ⬜ |
| 8.6.2 | Add `POST /api/admin/staff` | ⬜ |
| 8.6.3 | Add `PATCH /api/admin/staff/[id]` (edit, roles, deactivate) | ⬜ |
| 8.6.4 | Add `POST /api/admin/staff/[id]/reset-password` | ⬜ |
| 8.6.5 | Add the Staff Management screen | ⬜ |
| 8.6.6 | Verify: create, assign roles, deactivate, reset password | ⬜ |

*Milestone 8.7 — Reports*

| ID | Task | Status |
|----|------|--------|
| 8.7.1 | Add `GET /api/admin/reports/sales` | ⬜ |
| 8.7.2 | Add `GET /api/admin/reports/sales/export` (CSV) | ⬜ |
| 8.7.3 | Add the Reports screen | ⬜ |
| 8.7.4 | Verify: 6-month range, export, open CSV | ⬜ |

*Milestone 8.8 — Settings*

| ID | Task | Status |
|----|------|--------|
| 8.8.1 | Add `GET/PATCH /api/admin/settings` (read-only tax/currency/language; editable address/hours) | ⬜ |
| 8.8.2 | Add `PATCH /api/admin/modules` | ⬜ |
| 8.8.3 | Add `PATCH /api/admin/services` | ⬜ |
| 8.8.4 | Add the Settings screen | ⬜ |
| 8.8.5 | Verify: read-only fields stay read-only; module toggles hide screens | ⬜ |

*Milestone 8.9 — Audit Log Viewer*

| ID | Task | Status |
|----|------|--------|
| 8.9.1 | Add the "Audit Log" tab in the admin shell | ⬜ |
| 8.9.2 | Add the audit log list screen (`app/admin/audit/page.tsx`) | ⬜ |
| 8.9.3 | Add the "Download ZIP" button on audit screen | ⬜ |
| 8.9.4 | Verify: staff action produces row, ZIP export opens | ⬜ |

---

**End of PROGRESS.md.**