# PHASE_TESTS.md — The Phase Acceptance Suite

**Version:** 1.0
**Status:** Approved
**Approved:** 2026-10-15
**Purpose:** The eleven phase acceptance tests. Each test proves that a phase delivered what it promised, end to end, from the right user's perspective. Passing a phase test is what closes the phase. Failing it sends the phase back to the specific task whose work is suspect.

**How to read this file:** Each phase has one test. Each test has a prerequisite, a statement of what it proves, a sequence of numbered steps with action / expected / if-it-fails, a list of evidence to capture, and a pass/fail rule. The "if it fails" line on each step names the `ROADMAP.md` task IDs whose work is suspect. This makes each test double as a debugging instrument: when Phase 5 fails at step 8, you know to look at Task 5.5.2 or 5.5.3. A phase test is not a per-task test suite. It tests the loop the phase delivered, not every function inside it.

---

## Table of Contents

1. How the Phase Tests Work
2. Phase 0 — The Documents
3. Phase 1 — The Foundation
4. Phase 2 — The Data Model
5. Phase 3 — Authentication and Sessions
6. Phase 4 — QR Codes and Guest Context
7. Phase 5 — The Menu and the Guest Order Flow
8. Phase 6 — The Kitchen
9. Phase 7 — The Service Staff Queues
10. Phase 8 — The Manager Panel
11. Phase 9 — Hotel Services
12. Phase 10 — Payments, Polish, Production
13. What This File Does Not Define

---

## 1. How the Phase Tests Work

**The rule of the loop.** A phase is not a folder of features. A phase is a loop that a real user can run end to end. Phase 5 is not "the menu screen exists." Phase 5 is "a guest scans a QR, browses the menu, adds an item to a cart, places the order, and sees the confirmation." If any step of that loop is missing, the phase is not done, no matter how many individual tasks were closed.

**The rule of the right user.** Each test is run from the perspective of the user the phase was built for. Phase 4's test is run by a developer who has access to the admin panel and a phone. Phase 5's test is run by a guest on a phone. Phase 6's test is run from the kitchen's perspective. Phase 8's test is run by a manager on a laptop. If the test is run from the wrong perspective, it will pass when it should fail.

**The rule of the expected observation.** Every step has an "Expected" line. The expected observation is not "the page loads." It is "the page shows the venue's name in Fraunces, a warm sand background, and a single View Menu button above the fold." An observation that could be produced by three different implementations is too loose. The test's job is to distinguish the correct implementation from every other one.

**The rule of the evidence.** Every step has an "Evidence" line. The evidence is what the tester pastes into the phase's `PROGRESS.md` entry. A screenshot. A command's raw output. A database row read back with a query. Nothing is claimed without evidence (`BUILD.md` §11.2).

**The rule of the failure pointer.** Every step has an "If it fails" line. It names the `ROADMAP.md` task IDs whose work is suspect. This is how a phase test doubles as a debugging instrument: when the test fails at Phase 5 step 8, the failure points at Task 5.5.2 (the price computation) or Task 5.5.3 (the tax snapshot) instead of at the whole phase.

**The rule of the closing.** When every step of a phase test shows its expected outcome, the phase is closed: the evidence goes into a new `PROGRESS.md` entry, the phase's tasks are marked ✅ in `ROADMAP.md`, and `PROGRESS.md` §7 advances to the next phase.

**What counts as a phase test passing.** Every step shows the expected outcome. The browser console shows no errors on any guest or staff screen touched by the test. Every command listed in the evidence section was run and its raw output was pasted. No step is skipped.

**What counts as a phase test failing.** Any step shows an unexpected outcome, or the browser console shows an error, or the raw output of a required command is missing. A phase test that fails at any step does not close the phase. The failure is recorded in the phase's entry with the raw output of the failing step, the failure pointer is followed to the suspect task, that task is re-opened, and the phase test is re-run in a later session.

**What a phase test is not.** It is not a per-task test suite. It does not test every function. It does not test every branch of a domain module. Those tests live in `tests/unit/`, `tests/integration/`, and `tests/end-to-end/`, and they run on every commit. The phase test is the acceptance test for the phase: it proves the loop works, in the browser, from the right user's perspective, with real data.

**What a phase test does not replace.** The unit tests, integration tests, and end-to-end tests defined in `BUILD.md` §8. A phase can be green on the phase test and still have a broken unit test — that is a build failure, not a phase failure, and it must be fixed before the commit that closes the phase.

---

## 2. Phase 0 — The Documents

**Prerequisite:** The `docs/` folder is under version control. Nothing else. This test is run before any code exists.

**What this test proves:** The seven canonical documents exist, are consistent with each other, and describe the same product, the same reasons, the same shape, the same method, and the same plan.

**Environment:** The repository, opened in an editor. No database. No dev server. No browser. This test is run on the documents themselves.

### Steps

#### Step 1 — The seven documents exist

- **Action:** List `docs/`.
- **Expected:** Eight files present: `PRODUCT.md`, `DECISIONS.md`, `SYSTEM.md`, `BUILD.md`, `ROADMAP.md`, `PROGRESS.md`, `DESIGN.md`, `README.md`.
- **If it fails:** Task 0.1 through 0.6.
- **Evidence:** The output of `Get-ChildItem docs/` (or the equivalent).

#### Step 2 — Every document is at the approved version

- **Action:** Open each of the seven canonical documents. Read the header.
- **Expected:** Each has `**Version:** 2.0`, `**Status:** Approved`, `**Approved:** 2026-10-15`.
- **If it fails:** The document with the stale header. For version 2.0, the correction milestone (C-02 through C-08) is the suspect.
- **Evidence:** A `Select-String` over `docs/*.md` for `^\\*\\*Status:` that shows every value is `Approved`.

#### Step 3 — No document contradicts another

- **Action:** For each cross-reference in each document, open the cited section and confirm the fact is present and consistent.
- **Expected:** Every `D-` reference in `SYSTEM.md`, `BUILD.md`, and `DESIGN.md` resolves to a record in `DECISIONS.md`; every PRODUCT.md section referenced by a task's cross-reference block exists; every ROADMAP task ID referenced by another document exists in `ROADMAP.md`.
- **If it fails:** The document whose reference does not resolve. The correction milestone is the suspect.
- **Evidence:** A `Select-String` over all documents for `D-\\d+\\.\\d+` and a manual confirmation that each of the IDs appears in `DECISIONS.md`.

#### Step 4 — The product, the reasons, the shape, the method, and the plan are all consistent

- **Action:** Read `PRODUCT.md` §1 (What This Product Is), then `DECISIONS.md` §1 (Venue Identity), then `SYSTEM.md` §1 (The Architectural Style), then `BUILD.md` §1 (The Working Principles), then `ROADMAP.md` §1 (How the Build Progresses).
- **Expected:** Each of the five descriptions refers to the same product, at the same scope, with the same constraints.
- **If it fails:** The section whose description drifted. The document it belongs to is the suspect.
- **Evidence:** A short note in the phase's `PROGRESS.md` entry confirming the five descriptions were read and matched.

### Evidence to capture

- The output of `Get-ChildItem docs/` (Step 1).
- The output of the `Select-String` over all documents (Step 2).
- The output of the `Select-String` over the decision IDs (Step 3).
- The note from Step 4.

### What passes

Every document exists, is at version 2.0, is approved, and every cross-reference resolves. No two documents contradict.

### What fails

Any document is missing, or is at a version below 2.0, or a cross-reference does not resolve, or two documents contradict.

### Close the phase

Paste the four pieces of evidence into a new `PROGRESS.md` entry, mark Phase 0's tasks ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 1.

---

## 3. Phase 1 — The Foundation

**Prerequisite:** Phase 0 is closed. The repository is initialized. The database is installed locally but is not yet connected.

**What this test proves:** The project runs locally. The dev server starts. The design tokens are in place. The base components render on a scratch page. The shared utilities have passing unit tests. The two atmosphere wrappers set the world attribute. The 404 and error screens exist.

**Environment:** The repository on the developer's machine. The dev server running. A browser. No database connection required.

### Steps

#### Step 1 — The dev server starts

- **Action:** Run `pnpm dev`.
- **Expected:** `Ready in <some milliseconds>` on `http://localhost:3000`.
- **If it fails:** Task 1.5.4.
- **Evidence:** The raw output of `pnpm dev`.

#### Step 2 — The type checker passes

- **Action:** Run `pnpm exec tsc --noEmit`.
- **Expected:** Exit 0, no output.
- **If it fails:** The file whose type error is printed.
- **Evidence:** The raw output of `pnpm exec tsc --noEmit`.

#### Step 3 — The build passes

- **Action:** Run `pnpm build`.
- **Expected:** `Compiled successfully`, with routes ` / ` and ` /_not-found `.
- **If it fails:** Task 1.1.4 or Task 1.5.4.
- **Evidence:** The raw output of `pnpm build`.

#### Step 4 — The scratch page renders the base components

- **Action:** In a scratch page under `app/`, import and render one of each base component: Button, Input, Textarea, Select, Label, Dialog, Sheet, Drawer, Badge, Card, Separator, Table, Toast. Wrap half in a `<main data-world="guest">` and half in `<main data-world="staff">`. Open the page in the browser.
- **Expected:** Every component renders. The guest world shows olive primary buttons and warm surfaces. The staff world shows forest-green primary buttons and neutral surfaces. The browser console shows no warnings or errors.
- **If it fails:** Task 1.3.8.
- **Evidence:** A screenshot of the scratch page, in both worlds.

#### Step 5 — The two atmospheres are visually distinct

- **Action:** In the same scratch page, place a guest Button and a staff Button side by side.
- **Expected:** The guest Button has an olive background; the staff Button has a forest-green background. The two are unmistakably different.
- **If it fails:** Task 1.3.2.
- **Evidence:** The same screenshot from Step 4, or a second one focused on the two Buttons.

#### Step 6 — The shared utilities have passing tests

- **Action:** Run `pnpm test:unit`.
- **Expected:** All tests pass. The count is at least 43.
- **If it fails:** Task 1.4.5.
- **Evidence:** The raw output of `pnpm test:unit`.

#### Step 7 — The 404 screen renders

- **Action:** Navigate to a URL under `localhost:3000` that does not match any route.
- **Expected:** The custom 404 screen renders, with a warm sand background and a friendly message. The URL returns HTTP 404.
- **If it fails:** Task 1.5.3.
- **Evidence:** A screenshot of the 404 screen and the browser's status code.

### Evidence to capture

- The output of `pnpm dev` (Step 1).
- The output of `pnpm exec tsc --noEmit` (Step 2).
- The output of `pnpm build` (Step 3).
- A screenshot of the scratch page in both worlds (Step 4).
- A close-up of the two Buttons (Step 5).
- The output of `pnpm test:unit` (Step 6).
- A screenshot of the 404 screen (Step 7).

### What passes

The dev server starts. The type checker and the build pass. Every base component renders in the correct world. The shared utilities have passing tests. The 404 screen renders.

### What fails

Any command fails, or any component is missing, or the two worlds are visually identical, or the 404 screen does not render.

### Close the phase

Paste the seven pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 1 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 2.

---

## 4. Phase 2 — The Data Model

**Prerequisite:** Phase 1 is closed. PostgreSQL is installed locally. The `.env.local` file contains the connection string.

**What this test proves:** The full database schema exists, matching `SYSTEM.md` §11. The migrations apply cleanly. The seed creates one venue with tables, rooms, a counter, QR tokens, a menu, staff, and enabled services. Every repository has an integration test that reads and writes a real record.

**Environment:** The repository on the developer's machine. PostgreSQL running. `pnpm` available. `prisma studio` (or an equivalent SQL client) available. No dev server required for this test, except at the last step.

### Steps

#### Step 1 — The schema file exists and matches the entities

- **Action:** Open `prisma/schema.prisma`. Compare the models against `SYSTEM.md` §11.1.
- **Expected:** Every entity in §11.1 has a corresponding model. Every relation in §11.2 is expressed. Every rule in §11.3 is enforced by a constraint or a unique index — in particular, the `Order` model has a unique constraint on `idempotency_key` (per `SYSTEM.md` §9.7 and D-4.12).
- **If it fails:** Task 2.1.2 through 2.1.10.
- **Evidence:** A `Select-String` over `prisma/schema.prisma` for `^model ` and `@unique`.

#### Step 2 — The migration applies cleanly

- **Action:** Run `pnpm db:migrate`.
- **Expected:** The migration applies with no errors. The database now has the tables.
- **If it fails:** Task 2.1.11.
- **Evidence:** The raw output of `pnpm db:migrate`.

#### Step 3 — The seed runs and populates the venue

- **Action:** Run `pnpm db:seed`.
- **Expected:** The seed completes with no errors. It reports the entities it created.
- **If it fails:** Task 2.3.1 through 2.3.7.
- **Evidence:** The raw output of `pnpm db:seed`.

#### Step 4 — The seed is idempotent

- **Action:** Run `pnpm db:seed` a second time.
- **Expected:** The seed completes with no errors. No row is duplicated.
- **If it fails:** Task 2.3.8.
- **Evidence:** The raw output of the second `pnpm db:seed`, plus a `SELECT COUNT(*)` on the `Order` table (or any seeded table) that shows the count is unchanged.

#### Step 5 — The populated venue is inspectable

- **Action:** Open `prisma studio` (or an equivalent SQL client) and connect to the local database.
- **Expected:** Exactly one `Venue` row. It has the table, room, and counter modules enabled. It has many `Table`, `Room`, `QrToken`, `MenuCategory`, `MenuItem`, `ModifierGroup`, `ModifierOption`, `StaffMember`, and `ServiceConfig` rows. At least one `QrToken` is bound to the counter.
- **If it fails:** Task 2.3.1.
- **Evidence:** A screenshot of `prisma studio` showing the `Venue` row and a summary of its related rows.

#### Step 6 — Every repository has an integration test that reads and writes a real record

- **Action:** Run `pnpm test:integration`.
- **Expected:** Every repository test passes. Each test opens a transaction against the test database, reads or writes a real record, and rolls back. The `Order` repository test proves the idempotency key's unique constraint rejects a duplicate insert.
- **If it fails:** Task 2.2.9.
- **Evidence:** The raw output of `pnpm test:integration`, including the passing count.

#### Step 7 — The dev server still starts with the database connected

- **Action:** Run `pnpm dev`.
- **Expected:** The dev server starts, connects to the database, and serves the placeholder page. No database connection error appears in the console.
- **If it fails:** Task 2.1.1.
- **Evidence:** The raw output of `pnpm dev` and a `GET /` request in the log.

### Evidence to capture

- The output of the schema `Select-String` (Step 1).
- The output of `pnpm db:migrate` (Step 2).
- The output of `pnpm db:seed` (Step 3).
- The output of the second `pnpm db:seed` and the row counts (Step 4).
- A screenshot of `prisma studio` (Step 5).
- The output of `pnpm test:integration` (Step 6).
- The output of `pnpm dev` (Step 7).

### What passes

The schema matches `SYSTEM.md` §11. The migration applies. The seed is idempotent. The venue is inspectable with tables, rooms, a counter, QR tokens, a menu, and staff. Every repository has an integration test that passes.

### What fails

Any command fails, or the schema diverges from `SYSTEM.md` §11, or the seed duplicates rows on a second run, or a repository test fails.

### Close the phase

Paste the seven pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 2 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 3.

---

## 5. Phase 3 — Authentication and Sessions

**Prerequisite:** Phase 2 is closed. The venue is seeded. The staff members exist with their usernames and passwords.

**What this test proves:** A staff member can log in, see a placeholder for their area, log out, and be rejected on the next request. A staff member of one role cannot access another role's area. Changing a staff member's password invalidates their sessions. A second login ends the first.

**Environment:** The repository on the developer's machine. PostgreSQL running with the seeded venue. The dev server running. A browser.

### Steps

#### Step 1 — The login screen renders

- **Action:** Navigate to the staff login URL (whatever it is in the dev server's routing).
- **Expected:** A login form appears. It has a username field, a password field, and a Sign In button. The page has no guest-world tokens — its surface is the staff world's.
- **If it fails:** Task 3.4.1.
- **Evidence:** A screenshot of the login screen.

#### Step 2 — A valid login succeeds

- **Action:** Enter a seeded staff member's username and password. Click Sign In.
- **Expected:** The browser redirects to the staff area's placeholder screen. The screen shows the staff member's name and role.
- **If it fails:** Task 3.3.1, or Task 3.2.1.
- **Evidence:** A screenshot of the placeholder screen showing the name and role.

#### Step 3 — An invalid login is rejected

- **Action:** Log out. Enter a valid username with an invalid password. Click Sign In.
- **Expected:** The screen shows an error message. The message is generic ("Incorrect username or password"). It does not reveal whether the username exists.
- **If it fails:** Task 3.2.1.
- **Evidence:** A screenshot of the error message.

#### Step 4 — The session cookie is set

- **Action:** Log in with a valid staff member. Open the browser's DevTools, Application (or Storage), Cookies.
- **Expected:** A cookie named `venue_staff` is present. It is HttpOnly. Its value is a random token.
- **If it fails:** Task 3.1.3.
- **Evidence:** A screenshot of the cookie in DevTools.

#### Step 5 — A signed-out request is redirected

- **Action:** Copy the URL of the staff area from Step 2. Log out. Paste the URL into the browser.
- **Expected:** The browser redirects to the login screen.
- **If it fails:** Task 3.5.1, or Task 3.5.2.
- **Evidence:** A screenshot of the redirect, or the browser's address bar after the redirect.

#### Step 6 — A role cannot access another role's area

- **Action:** Log in as a Chef. Navigate to the admin URL.
- **Expected:** The browser redirects to a screen that is not the admin panel. The redirect target is either the login screen or the staff member's own area. It is never the admin panel.
- **If it fails:** Task 3.5.3.
- **Evidence:** A screenshot of the redirect, or a browser address bar showing the redirected URL.

#### Step 7 — A second login ends the first

- **Action:** Log in as a staff member in one browser tab. In a second tab (same browser, or a private window), log in as the same staff member. In the first tab, navigate to any protected page.
- **Expected:** The first tab is signed out. It shows the login screen on the next action.
- **If it fails:** Task 3.2.6.
- **Evidence:** A screenshot of the first tab showing the login screen.

#### Step 8 — Changing a password invalidates existing sessions

- **Action:** Log in as a staff member. In the admin panel (as the manager), reset the staff member's password. In the staff member's tab, navigate to any protected page.
- **Expected:** The staff member's tab is signed out. It shows the login screen.
- **If it fails:** Task 3.2.5.
- **Evidence:** A screenshot of the staff member's tab after the reset.

#### Step 9 — Logging out ends the session

- **Action:** Log in as a staff member. Click Sign Out. Navigate back to the staff area.
- **Expected:** The browser redirects to the login screen.
- **If it fails:** Task 3.2.2.
- **Evidence:** A screenshot of the login screen after the logout.

### Evidence to capture

- The output of `pnpm dev` (Step 1).
- A screenshot of the login screen (Step 1).
- A screenshot of the placeholder after a valid login (Step 2).
- A screenshot of the error message after an invalid login (Step 3).
- A screenshot of the `venue_staff` cookie in DevTools (Step 4).
- A screenshot of the redirect after a signed-out request (Step 5).
- A screenshot of the redirect after a wrong-role request (Step 6).
- A screenshot of the first tab after a second login (Step 7).
- A screenshot of the staff member's tab after the password reset (Step 8).
- A screenshot of the login screen after logout (Step 9).

### What passes

Every step shows its expected outcome. The session cookie is set. A signed-out request is redirected. A wrong-role request is redirected. A second login ends the first. A password reset invalidates sessions.

### What fails

Any step shows an unexpected outcome. Any browser console error appears.

### Close the phase

Paste the ten pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 3 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 4.

## 6. Phase 4 — QR Codes and Guest Context

**Prerequisite:** Phase 3 is closed. PostgreSQL running with the seeded venue. The dev server running. A phone with a camera on the same network as the dev machine, or a phone-viewport browser on the dev machine itself.

**What this test proves:** A QR code can be generated from the admin panel, printed (or opened as an image on a phone), scanned with a real phone, resolved to a venue and a specific table or room, and used to open the venue's guest landing page with the correct place number. A revoked QR shows a friendly "no longer active" screen. A room QR opens the guest service catalog. A counter QR opens the guest menu with a pickup-name field.

**Environment:** The repository on the developer's machine. PostgreSQL running with the seeded venue. The dev server running and reachable from the phone (via the network URL that `pnpm dev` prints, not `localhost`). A phone with a camera. The seeded QR tokens printed or displayed as images.

### Steps

#### Step 1 — The admin QR list renders

- **Action:** Log in to the admin panel. Navigate to the QR Codes tab.
- **Expected:** A table of every seeded QR token. Each row shows the place (table 12, room 412, counter), the token's state (active), and the created date. Each row has a Print action and a Revoke action.
- **If it fails:** Task 4.5.1.
- **Evidence:** A screenshot of the QR Codes list.

#### Step 2 — A token can be generated from the admin panel

- **Action:** In the QR Codes tab, generate a new token for an existing table (or, if the seed already gave every table a token, revoke one and generate a new one).
- **Expected:** A new row appears with the token's state set to active. The token's value is an opaque UUID — it does not look like a sequential number or a human-readable name.
- **If it fails:** Task 4.5.2, or Task 4.1.1.
- **Evidence:** A screenshot of the new row, with the token value visible.

#### Step 3 — The token's value is not guessable

- **Action:** Read the token's value. It will be a UUID such as `7c9e6679-7425-40de-944b-e07fc1f90ae7`. Change one character in the value.
- **Expected:** The changed token does not resolve. The guest sees the "no longer active" screen (or a "not found" screen — see Step 6).
- **If it fails:** Task 4.1.2.
- **Evidence:** A screenshot of the changed URL and the resulting screen.

#### Step 4 — A printed or displayed token scans and resolves

- **Action:** Display the token's QR image on the admin panel. Scan it with a phone's camera.
- **Expected:** The phone's browser opens the venue's guest landing page. The page's address bar contains the token, not a table number. The page shows the venue's name in Fraunces, a warm sand background, and the place's number ("Table 12") in the context line.
- **If it fails:** Task 4.3.1, or Task 4.4.1.
- **Evidence:** A screenshot of the guest landing page on the phone, with the address bar visible.

#### Step 5 — The guest session cookie is set

- **Action:** On the phone, open DevTools (or an equivalent), and inspect the cookies for the site.
- **Expected:** A cookie named `venue_guest` is present. It is HttpOnly. Its value is a random token.
- **If it fails:** Task 4.2.2.
- **Evidence:** A screenshot of the cookie.

#### Step 6 — A revoked token shows the "no longer active" screen

- **Action:** In the admin panel, revoke a token. On the phone, navigate to the revoked token's URL (or rescan its QR image if it is still displayed).
- **Expected:** The phone shows a friendly "This QR is no longer active" screen. The screen has a warm sand background — it is a guest-world screen, not a raw HTTP error.
- **If it fails:** Task 4.3.2, or Task 4.1.3.
- **Evidence:** A screenshot of the "no longer active" screen.

#### Step 7 — A room QR opens the guest service catalog

- **Action:** Display a room QR image. Scan it with a phone.
- **Expected:** The phone opens the guest landing page in the room context. The context line says "Room 412". The primary action is "Explore Services", not "View Menu". Below the hero, a grid of service cards appears — Room Service, Housekeeping, Maintenance, Concierge, Laundry, Spa, Late Checkout, Wake-up Call, Do Not Disturb — filtered to the services the seed enabled for this venue.
- **If it fails:** Task 4.4.1, or Task 4.3.1.
- **Evidence:** A screenshot of the room landing page.

#### Step 8 — A counter QR opens the guest menu with a pickup-name field

- **Action:** Display the counter QR image. Scan it with a phone.
- **Expected:** The phone opens the guest landing page in the counter context. The context line says the venue's name (no table number, no room number). The primary action is "Order Now". Navigating into the menu and adding an item to the cart, then to the cart, shows a pickup-name field where the table number would be for the table flow.
- **If it fails:** Task 4.3.1, or Task 4.4.1.
- **Evidence:** A screenshot of the counter landing page and a screenshot of the cart with the pickup-name field.

#### Step 9 — The guest session ends when the table is closed

- **Action:** In the admin panel (or the staff panel, if Phase 7 is already built — otherwise in `prisma studio`), close the table whose token was scanned in Step 4. On the phone, refresh the guest landing page.
- **Expected:** The guest session is invalidated. The phone either shows the guest landing page fresh (a new session was created by the refresh) or shows a "session ended" screen. Either way, the previous session's cart is not visible.
- **If it fails:** Task 4.2.3.
- **Evidence:** A screenshot of the phone after the refresh.

### Evidence to capture

- A screenshot of the QR Codes list (Step 1).
- A screenshot of the new token (Step 2).
- A screenshot of the changed token's URL and result (Step 3).
- A screenshot of the guest landing page from a phone (Step 4).
- A screenshot of the `venue_guest` cookie (Step 5).
- A screenshot of the "no longer active" screen (Step 6).
- A screenshot of the room landing page (Step 7).
- Screenshots of the counter landing and the cart with the pickup-name field (Step 8).
- A screenshot of the phone after the table close (Step 9).

### What passes

Every step shows its expected outcome. The token is an opaque UUID. The guest landing page renders in both worlds. A revoked token shows the friendly screen. The room and counter flows open their correct experiences.

### What fails

Any step shows an unexpected outcome. Any browser console error appears. Any token in the QR list is human-readable.

### Close the phase

Paste the nine pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 4 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 5.

---

## 7. Phase 5 — The Menu and the Guest Order Flow

**Prerequisite:** Phase 4 is closed. The venue's menu is seeded with at least three categories, at least ten items, and at least two modifier groups. The dev server is running and reachable from a phone. A phone with a camera. The database can be inspected via `prisma studio` (or an equivalent SQL client).

**What this test proves:** A guest can scan a QR, browse the menu, customize an item, add it to a cart, place the order, and see the confirmation and tracking screen. The order's prices and tax are frozen at the moment of ordering. The order appears in the manager's order list. An item marked unavailable by the manager greys out on the guest's screen.

**Environment:** The repository on the developer's machine. PostgreSQL running with the seeded venue. The dev server running and reachable from the phone. A phone. A laptop for the admin panel side of the test. `prisma studio` (or an equivalent).

### Steps

#### Step 1 — The guest scans a table QR and sees the landing page

- **Action:** Scan a table's QR with the phone.
- **Expected:** The landing page renders as in Phase 4 step 4. The primary action is "View Menu".
- **If it fails:** Task 4.4.2 (the primary action) or the earlier Phase 4 tasks if the landing page itself is broken.
- **Evidence:** A screenshot of the landing page.

#### Step 2 — The menu screen renders

- **Action:** Tap "View Menu".
- **Expected:** The menu screen appears. The sticky header shows the venue's name on the left and a cart icon with an empty count badge on the right. A horizontal strip of category tabs sits below the header. The item list scrolls below the tabs. Each item card shows the photo (if any), the name, the description, and the price in the venue's currency format. The price is a decimal string with two digits after the decimal point, formatted with the venue's currency.
- **If it fails:** Task 5.2.1, or Task 5.2.2.
- **Evidence:** A screenshot of the menu screen.

#### Step 3 — The category tabs filter the list

- **Action:** Tap a category tab that is not the first.
- **Expected:** The list scrolls to that category's first item. The tapped tab is highlighted in the venue's brand color. The other tabs are not.
- **If it fails:** Task 5.2.1.
- **Evidence:** A screenshot after the tab tap.

#### Step 4 — The search filters the list

- **Action:** Tap the search icon. Type two or three letters from an item's name.
- **Expected:** The list filters live to items whose name or description matches the query. The filtered list shows only matching items.
- **If it fails:** Task 5.2.3.
- **Evidence:** A screenshot of the filtered list.

#### Step 5 — An unavailable item is not orderable

- **Action:** In the admin panel on the laptop, mark a menu item as unavailable. On the phone, return to the menu screen and wait up to 5 seconds.
- **Expected:** The item's card greys out. A small "Unavailable" or "Sold out" label appears on the card. The card is not tappable. A small ping plays on the phone if the guest is looking at the menu (per D-4.2).
- **If it fails:** Task 5.8.1, or Task 5.8.2, or Task 5.8.3.
- **Evidence:** A screenshot of the greyed-out card.

#### Step 6 — The modifier sheet opens for a dish with modifiers

- **Action:** Tap a menu item that has modifier groups.
- **Expected:** A bottom sheet slides up. It shows the dish's name and photo at the top, then the description, then one section per modifier group. Each single-choice group shows radio buttons; each multiple-choice group shows checkboxes. Each option shows its additional price, if any. The quantity stepper and the notes field are below. The live total is at the bottom, above the "Add to Cart" button.
- **If it fails:** Task 5.3.1, or Task 5.3.2, or Task 5.3.3.
- **Evidence:** A screenshot of the modifier sheet.

#### Step 7 — The live total updates correctly

- **Action:** Pick a modifier that adds a price (for example, "Extra cheese +$1.50"). Watch the live total.
- **Expected:** The live total updates immediately. The amount added is exactly the modifier's additional price. The displayed amount is a decimal string with two digits after the decimal point. No floating-point rounding artifact appears.
- **If it fails:** Task 5.3.6, or Task 5.3.4.
- **Evidence:** A screenshot of the modifier sheet with the live total.

#### Step 8 — Adding the item to the cart updates the badge

- **Action:** Set the quantity to 2. Tap "Add to Cart". The sheet closes.
- **Expected:** The sheet slides down. The cart badge in the header increments to 2 (or the count of items, per the badge's convention). The floating cart bar appears at the bottom of the screen.
- **If it fails:** Task 5.3.7, or Task 5.2.5.
- **Evidence:** A screenshot of the menu screen after the sheet closes.

#### Step 9 — The cart lists the added item

- **Action:** Tap the floating cart bar.
- **Expected:** The cart screen opens. It lists the added item with the correct modifiers and quantity. The line total is the item's price plus its modifiers, multiplied by the quantity. The summary block shows the subtotal, tax, and total. The subtotal is the sum of the line totals. The tax is the subtotal times the venue's tax rate, shown as a decimal string with two digits after the decimal point. The total is subtotal plus tax. All three amounts match the arithmetic when verified by hand.
- **If it fails:** Task 5.4.4.
- **Evidence:** A screenshot of the cart.

#### Step 10 — The order is placed

- **Action:** Tap "Place Order".
- **Expected:** A brief loading state appears. The screen transitions to the order confirmation. The confirmation shows a check mark, the headline "Your order is on its way.", the order number, a summary of the items, and the total. Two buttons appear: "Track Your Order" and "Back to Menu".
- **If it fails:** Task 5.6.1, or Task 5.7.1.
- **Evidence:** A screenshot of the confirmation screen.

#### Step 11 — The order is stored with frozen prices and tax

- **Action:** Open `prisma studio` (or an equivalent SQL client). Open the `Order` table. Find the order that was just placed.
- **Expected:** The order row exists. Its `subtotal`, `tax_rate`, `tax_amount`, and `total` match the cart's values exactly, at the moment of ordering. Its `idempotency_key` column is populated with a UUID. Its `placed_at` timestamp is the moment of ordering. Its `state` is `Placed`. On the related `OrderItem` rows, the item name, item price, and modifier details match the menu at the moment of ordering — not the menu as it is now.
- **If it fails:** Task 5.5.3, or Task 5.5.4.
- **Evidence:** A screenshot of the order row in `prisma studio`.

#### Step 12 — A retry with the same idempotency key returns the same order

- **Action:** In `prisma studio`, delete nothing. Instead, from a development tool (a scratch script or an HTTP client), send the same `POST /api/guest/orders` request again, with the same idempotency key as the order from Step 10.
- **Expected:** The response is `{ "data": { ... existing order ... } }`, with the same order ID as the first request. No second `Order` row is created in the database. The `Order` table's row count is unchanged.
- **If it fails:** Task 5.5.5, or Task 5.6.1.
- **Evidence:** The raw HTTP response and the `Order` table's row count before and after.

#### Step 13 — The tracking screen shows the timeline

- **Action:** On the phone, tap "Track Your Order".
- **Expected:** The tracking screen opens. A vertical timeline appears with the states that are relevant to the guest (Placed, Approved, Preparing, Ready, Served, Completed). The current state (Placed) is highlighted with a filled dot in the venue's brand color. The previous states are muted. The later states are grey. The items list is below the timeline.
- **If it fails:** Task 5.7.2.
- **Evidence:** A screenshot of the tracking screen.

#### Step 14 — The tracking screen updates when the state changes

- **Action:** In `prisma studio`, change the order's state to `Approved` (or, if Phase 6 is built, tap "Start" on the kitchen screen).
- **Expected:** Within 5 seconds, the tracking screen on the phone updates. The `Placed` step is muted; the `Approved` step is highlighted with the amber status color. The change appears as a smooth transition, not a page reload.
- **If it fails:** Task 5.7.5, or Task 5.7.2.
- **Evidence:** A screenshot of the tracking screen after the state change.

#### Step 15 — The order appears in the manager's list

- **Action:** On the laptop, open the admin panel. Navigate to the Active Orders tab.
- **Expected:** The order from Step 10 appears in the list. Its row shows the order number, the place ("Table 12"), a summary of the items, the current state, the elapsed time, and an action button.
- **If it fails:** Task 5.7.6, or (if Phase 8 is already built) Task 8.1.2.
- **Evidence:** A screenshot of the Active Orders list.

### Evidence to capture

- A screenshot of the menu screen (Step 2).
- A screenshot after the category tab tap (Step 3).
- A screenshot of the filtered list (Step 4).
- A screenshot of the greyed-out card (Step 5).
- A screenshot of the modifier sheet (Step 6).
- A screenshot of the modifier sheet with the live total (Step 7).
- A screenshot of the menu screen after the sheet closes (Step 8).
- A screenshot of the cart (Step 9).
- A screenshot of the confirmation screen (Step 10).
- A screenshot of the order row in `prisma studio` (Step 11).
- The raw HTTP response and the row count (Step 12).
- A screenshot of the tracking screen (Step 13).
- A screenshot of the tracking screen after the state change (Step 14).
- A screenshot of the Active Orders list (Step 15).

### What passes

Every step shows its expected outcome. The prices and tax are frozen. The idempotency key is stored. A retry returns the same order. The tracking screen updates within 5 seconds of a state change. The order appears in the manager's list.

### What fails

Any step shows an unexpected outcome. Any floating-point rounding artifact appears in a price. Any arithmetic in the cart does not match a hand computation. A retry creates a second order.

### Close the phase

Paste the fifteen pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 5 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 6.

---

## 8. Phase 6 — The Kitchen

**Prerequisite:** Phase 5 is closed. An order has been placed and is in the `Placed` state or has been advanced to `Approved`. The kitchen screen is running on the developer's machine, at the size it will be deployed at (1920×1080, or 1366×768).

**What this test proves:** The kitchen screen shows tickets, advances them through their states, and reflects every change on the guest's tracking screen. A new ticket triggers an audible ping. The dark mode default is in place. The connection indicator works.

**Environment:** The repository on the developer's machine. PostgreSQL running with the seeded venue. The dev server running. The kitchen screen opened at `/kitchen/tickets` (or whatever the route is) at the target size. The phone from Phase 5 still open on the guest tracking screen. Audio enabled on the dev machine.

### Steps

#### Step 1 — The kitchen screen shows the order

- **Action:** Place a fresh order from the phone. Open the kitchen screen.
- **Expected:** The order appears in the ticket grid within 5 seconds of being approved. The ticket card shows the order number at the top, the place ("Table 12") at the largest size, the items with their modifiers, the notes, and the elapsed time. The place is legible from two meters away (per `DESIGN.md` §4.12.5).
- **If it fails:** Task 6.3.1, or Task 6.3.2.
- **Evidence:** A screenshot of the kitchen screen with the ticket visible.

#### Step 2 — The dark mode default is active

- **Action:** Reload the kitchen screen.
- **Expected:** The screen's surface is dark (`--color-neutral-900`). The text is light (`--color-neutral-50`). The dark mode is active without the developer having to toggle it.
- **If it fails:** Task 6.3.6.
- **Evidence:** A screenshot of the kitchen screen showing the dark surface.

#### Step 3 — The connection indicator shows "connected"

- **Action:** Look at the status strip at the top of the kitchen screen.
- **Expected:** A small dot shows green (connected).
- **If it fails:** Task 6.3.7.
- **Evidence:** A zoomed screenshot of the status strip.

#### Step 4 — The connection indicator shows "reconnecting" when the connection drops

- **Action:** Stop the dev server (or disconnect the network on the dev machine).
- **Expected:** Within 5 seconds, the kitchen screen's dot turns amber (reconnecting). The screen keeps the last known state visible.
- **If it fails:** Task 6.3.7, or Task 6.3.8 (the polling).
- **Evidence:** A screenshot of the reconnecting state.

#### Step 5 — The connection indicator returns to "connected"

- **Action:** Restart the dev server (or reconnect the network).
- **Expected:** Within 10 seconds, the dot turns green again. The screen shows the current state.
- **If it fails:** Task 6.3.7.
- **Evidence:** A screenshot of the connected state after the recovery.

#### Step 6 — The new-ticket ping plays

- **Action:** From the phone, place a fresh order. Approve it (or place it in a state that the kitchen sees). Have the audio on.
- **Expected:** Within 5 seconds of the ticket appearing in the grid, a single soft tone plays. The tone is a single sine wave at 880 Hz, 200 ms, with a 40 ms attack and a 60 ms decay (per `DESIGN.md` §4.11.7). It does not loop; it plays once per new ticket.
- **If it fails:** Task 6.4.1.
- **Evidence:** A note in the phase's `PROGRESS.md` entry confirming the tone played, plus an audio recording of the tone if possible.

#### Step 7 — The "Start" action advances the ticket to Preparing

- **Action:** On the kitchen screen, tap the "Start" button on a ticket.
- **Expected:** The ticket's background transitions over 320 ms from the neutral surface to the amber `--color-status-active-bg`. The action button's label changes to "Ready". The elapsed timer keeps counting.
- **If it fails:** Task 6.3.4, or Task 6.1.2.
- **Evidence:** A screenshot of the ticket before and after the tap.

#### Step 8 — The guest's tracking screen reflects the Preparing state

- **Action:** On the phone, look at the tracking screen.
- **Expected:** Within 5 seconds, the `Preparing` step is highlighted with the amber status color. The transition is smooth.
- **If it fails:** Task 5.7.5 (if the guest tracking polling is not built), or Task 6.3.8 (if the kitchen's state changes are not propagating).
- **Evidence:** A screenshot of the tracking screen.

#### Step 9 — The "Ready" action advances the ticket to Ready

- **Action:** On the kitchen screen, tap the "Ready" button.
- **Expected:** The ticket's background transitions over 320 ms from the amber to the green `--color-status-ready-bg`. The action button's label changes to "Done".
- **If it fails:** Task 6.3.5, or Task 6.1.3.
- **Evidence:** A screenshot of the ticket after the tap.

#### Step 10 — The guest's tracking screen reflects the Ready state

- **Action:** On the phone, look at the tracking screen.
- **Expected:** Within 5 seconds, the `Ready` step is highlighted with the green status color.
- **If it fails:** Task 5.7.5, or Task 6.3.8.
- **Evidence:** A screenshot of the tracking screen.

#### Step 11 — An invalid transition is rejected

- **Action:** From a development tool (a scratch script or an HTTP client), send a `POST /api/kitchen/orders/<id>/start` request for a ticket that is already in the `Ready` state.
- **Expected:** The response is `{ "error": { "code": "INVALID_STATE", "message": "..." } }` with HTTP status 409. The ticket's state in the database is unchanged.
- **If it fails:** Task 6.1.4.
- **Evidence:** The raw HTTP response and a `Select` on the ticket's state in the database.

#### Step 12 — The state-change records are written

- **Action:** Open `prisma studio`. Open the `OrderStateChange` table.
- **Expected:** Every transition the kitchen made in this test has a corresponding row. Each row shows the new state, the timestamp, and the staff member who made the change (or `null` if the transition was triggered by a test script).
- **If it fails:** Task 6.1.5.
- **Evidence:** A screenshot of the `OrderStateChange` rows for the order.

### Evidence to capture

- A screenshot of the kitchen screen with the ticket visible (Step 1).
- A screenshot of the dark surface (Step 2).
- A zoomed screenshot of the connected indicator (Step 3).
- A screenshot of the reconnecting state (Step 4).
- A screenshot of the recovery (Step 5).
- A note confirming the ping played (Step 6).
- Screenshots of the ticket before and after the Start tap (Step 7).
- A screenshot of the guest tracking screen showing Preparing (Step 8).
- A screenshot of the ticket after the Ready tap (Step 9).
- A screenshot of the guest tracking screen showing Ready (Step 10).
- The raw HTTP response and the database state (Step 11).
- A screenshot of the `OrderStateChange` rows (Step 12).

### What passes

Every step shows its expected outcome. The ticket appears within 5 seconds of approval. The dark mode default is active. The ping plays. The state transitions are correct. The guest's tracking screen reflects each change within 5 seconds. Invalid transitions are rejected. State-change records are written.

### What fails

Any step shows an unexpected outcome. The ping does not play. The dark mode is not the default. A state change takes more than 5 seconds to appear on the guest's tracking screen. An invalid transition is accepted.

### Close the phase

Paste the twelve pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 6 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 7.

---

## 9. Phase 7 — The Service Staff Queues

**Prerequisite:** Phase 6 is closed. The service staff queues are running on the developer's machine, at the size they will be deployed at (a tablet landscape, or a 1440×900 desktop viewport). An order has been placed and is in the `Ready` state.

**What this test proves:** The service staff queues show orders and requests, advance them one tap at a time, and close the full order loop from placement to delivery. The table close and room checkout end the guest session.

**Environment:** The repository on the developer's machine. PostgreSQL running with the seeded venue. The dev server running. The staff queue opened at the target size. The phone from Phase 5 still open on the guest tracking screen. A second laptop (or a browser tab) for the manager panel or `prisma studio`.

### Steps

#### Step 1 — The service queue shows the order

- **Action:** Log in as a Table Service staff member. Open the service queue.
- **Expected:** The order from the previous phase, now in the `Ready` state, appears in the queue. Its row shows the table number ("Table 12") in a bold, prominent font, the order ID in a mono font, the status as a color-coded badge ("Ready"), the elapsed time, and a single action button labeled "Deliver".
- **If it fails:** Task 7.3.1, or Task 7.3.2.
- **Evidence:** A screenshot of the queue with the row visible.

#### Step 2 — The "Deliver" action advances the order to Delivered

- **Action:** Tap the "Deliver" button.
- **Expected:** The order's row updates in place. The badge changes from "Ready" to "Delivered". The action button's label changes to "Complete". A short flash of color confirms the change (per `DESIGN.md` §4.12.4). No other element on the row moves.
- **If it fails:** Task 7.3.3, or Task 7.1.1.
- **Evidence:** A screenshot of the row before and after the tap.

#### Step 3 — The guest's tracking screen reflects the Delivered state

- **Action:** On the phone, look at the tracking screen.
- **Expected:** Within 5 seconds, the `Delivered` step is highlighted. The transition is smooth.
- **If it fails:** Task 5.7.5, or Task 7.2.2.
- **Evidence:** A screenshot of the tracking screen.

#### Step 4 — The "Complete" action closes the order

- **Action:** Tap the "Complete" button.
- **Expected:** The row is removed from the active queue. The order's state in the database is `Completed`.
- **If it fails:** Task 7.3.4, or Task 7.1.2.
- **Evidence:** A screenshot of the queue without the row and a screenshot of the `Order` table showing `state = Completed`.

#### Step 5 — The request queue shows a service request

- **Action:** In a browser tab, log in as a Housekeeping staff member. If the guest has submitted a housekeeping request from Phase 5's parallel-tracks test, it appears in the queue. If not, submit one from the phone.
- **Expected:** The request appears in the housekeeping queue. Its row shows the room number, the request type (extra towels, room cleaning, etc.), the notes, the preferred time, the elapsed time, and a single action button labeled "Acknowledge".
- **If it fails:** Task 7.3.5, or Task 7.3.6.
- **Evidence:** A screenshot of the housekeeping queue.

#### Step 6 — The request actions advance the request

- **Action:** Tap "Acknowledge". Then "In Progress". Then "Complete".
- **Expected:** Each tap advances the request's state and updates the row. The action button's label changes to match the next step. A short flash of color confirms each change.
- **If it fails:** Task 7.3.6, or Task 7.1.3.
- **Evidence:** A screenshot of the row after each tap.

#### Step 7 — The "Cancel" action on a request records the reason

- **Action:** Submit a fresh housekeeping request from the phone. On the staff screen, tap "Cancel". Provide a reason.
- **Expected:** The request's state is `Cancelled`. The reason is stored with the state change.
- **If it fails:** Task 7.1.3.
- **Evidence:** A screenshot of the `ServiceRequestStateChange` rows showing the cancelled state and the reason.

#### Step 8 — The "Decline" action on a request is separate from "Cancel"

- **Action:** Submit another housekeeping request. On the staff screen, tap "Decline". Provide a reason.
- **Expected:** The request's state is `Declined`, not `Cancelled`. The reason is stored with the state change.
- **If it fails:** Task 7.2.7.
- **Evidence:** A screenshot of the `ServiceRequestStateChange` rows showing the declined state and the reason.

#### Step 9 — The table map shows the tables

- **Action:** Tap the "Tables" tab.
- **Expected:** A grid of every table in the venue. Each cell shows the table's number and a status dot (free, occupied, waiting, cleaning). The current states match the database.
- **If it fails:** Task 7.3.7.
- **Evidence:** A screenshot of the table map.

#### Step 10 — The room map shows the rooms

- **Action:** Switch to a Room Service staff member. Tap the "Rooms" tab.
- **Expected:** A grid of every room. Each cell shows the room's number and a status dot (occupied, vacant, cleaning, out of service). The current states match the database.
- **If it fails:** Task 7.3.8.
- **Evidence:** A screenshot of the room map.

#### Step 11 — The table close ends the guest session

- **Action:** In the table map, close the table from Step 1. On the phone, refresh the guest tracking screen.
- **Expected:** The guest session is invalidated. The phone either shows the guest landing page fresh (a new session is created by the refresh) or shows a "session ended" screen. Either way, the previous session's cart is not visible, and the previous orders are not shown.
- **If it fails:** Task 7.1.4, or Task 7.2.8.
- **Evidence:** A screenshot of the phone after the refresh.

#### Step 12 — The room checkout ends the guest session

- **Action:** In the room map, check out the room from Step 5. On a phone that was in that room's session, refresh.
- **Expected:** Same as Step 11, for the room flow.
- **If it fails:** Task 7.1.5, or Task 7.2.9.
- **Evidence:** A screenshot of the phone after the refresh.

### Evidence to capture

- A screenshot of the service queue with the row (Step 1).
- Screenshots of the row before and after the Delivered tap (Step 2).
- A screenshot of the guest tracking screen showing Delivered (Step 3).
- A screenshot of the queue without the row and a screenshot of the `Order` table (Step 4).
- A screenshot of the housekeeping queue (Step 5).
- Screenshots of the request row after each action tap (Step 6).
- A screenshot of the `ServiceRequestStateChange` rows showing the cancelled state and the reason (Step 7).
- A screenshot of the `ServiceRequestStateChange` rows showing the declined state and the reason (Step 8).
- A screenshot of the table map (Step 9).
- A screenshot of the room map (Step 10).
- A screenshot of the phone after the table close (Step 11).
- A screenshot of the phone after the room checkout (Step 12).

### What passes

Every step shows its expected outcome. The queue shows the order and the request. One-tap actions advance them. The guest's tracking screen reflects each change within 5 seconds. The table close and the room checkout end the guest session. Cancel and Decline are distinct actions, and each records its reason.

### What fails

Any step shows an unexpected outcome. An action button's label does not match the next step. The guest's tracking screen does not update within 5 seconds. The table close or room checkout does not end the guest session. Cancel and Decline are conflated.

### Close the phase

Paste the twelve pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 7 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 8.

## 10. Phase 8 — The Manager Panel

**Prerequisite:** Phase 7 is closed. The manager panel is running on the developer's machine, at a desktop viewport (1440×900 or larger). The database is populated with the seeded venue and at least twenty completed orders spread across the last thirty days.

**What this test proves:** The manager can log in and use every screen. The dashboard shows live metrics that update as orders move. Orders can be filtered and exported as CSV. The menu, tables, rooms, staff, and settings can all be managed. Reports can be generated for any range up to 6 months and exported as CSV. Modules and services can be toggled within the limits the developer enabled.

**Environment:** The repository on the developer's machine. PostgreSQL running with the seeded venue and the historical orders. The dev server running. A desktop browser at 1440×900 or larger. A second tab (or a second window) with `prisma studio` open for verification. A phone for triggering orders during the live-metrics checks.

### Steps

#### Step 1 — The admin login works

- **Action:** Navigate to the admin login URL. Log in as the seeded manager.
- **Expected:** The browser redirects to the admin dashboard. The page's surface is the staff world's neutral palette. The header shows the venue's name and the manager's name. There is no Branding tab in the navigation.
- **If it fails:** Task 3.4.2, or Task 8.1.1.
- **Evidence:** A screenshot of the dashboard.

#### Step 2 — The dashboard shows the six live metrics

- **Action:** Look at the top row of the dashboard.
- **Expected:** Six metric tiles are visible: Orders Waiting, In Kitchen, Ready, Revenue Today, Orders Today, and Service Requests Open. Each shows a number. Each tile's number matches a manual count in `prisma studio`.
- **If it fails:** Task 8.1.1.
- **Evidence:** A screenshot of the metric row and a screenshot of the corresponding database counts.

#### Step 3 — The metrics update when orders move

- **Action:** From the phone, place a fresh order. Watch the dashboard.
- **Expected:** Within 5 seconds, the Orders Waiting metric increments. Then approve the order from a staff tab (or from `prisma studio`). Within 5 seconds, Orders Waiting decrements and In Kitchen increments.
- **If it fails:** Task 8.1.3.
- **Evidence:** A screenshot of the metric before and after the order.

#### Step 4 — The active orders list renders

- **Action:** Navigate to the Active Orders tab.
- **Expected:** A full-width table of active orders. Columns: Order ID, Place, Items summary, Status, Elapsed, Action. Rows are sorted oldest first. Clicking a row opens a right-side detail panel with the full order — items, states, history, notes.
- **If it fails:** Task 8.2.1, or Task 8.2.3.
- **Evidence:** A screenshot of the Active Orders table and a screenshot of the detail panel.

#### Step 5 — The completed orders list filters by date

- **Action:** Navigate to the Completed Orders tab. Set the date range to "Today". Then "This Week". Then "This Month". Then a custom range within the last 6 months.
- **Expected:** Each filter changes the rows shown. The "Today" filter shows only orders closed today. The "This Week" filter shows only orders closed in the last seven days. The "This Month" filter shows only orders closed in the last thirty days. The custom range shows only orders within the two dates.
- **If it fails:** Task 8.2.2.
- **Evidence:** A screenshot of each filtered list.

#### Step 6 — The completed orders list exports as CSV

- **Action:** With the "This Month" filter applied, click "Export CSV".
- **Expected:** A CSV file downloads. Open it in a spreadsheet. Its columns match the visible table's columns. Its row count matches the filtered row count. Every amount is a decimal string with two digits after the decimal point.
- **If it fails:** Task 8.2.4.
- **Evidence:** A screenshot of the downloaded CSV opened in a spreadsheet.

#### Step 7 — A menu item can be added

- **Action:** Navigate to the Menu tab. Click "Add Item". Fill in the name, description, price, category, and a modifier group with two options. Save.
- **Expected:** The item appears in the menu list. Its row shows the name, category, price, and state (Available). The price is stored as a decimal string with two digits after the decimal point. Navigating to the item's detail shows the modifier group and its options.
- **If it fails:** Task 8.3.2, or Task 8.3.6.
- **Evidence:** A screenshot of the new item's row and a screenshot of its modifier group.

#### Step 8 — A menu item's state can be toggled

- **Action:** On the menu list, tap the state toggle on the newly added item. Choose "Unavailable". Then choose "Hidden". Then "Available".
- **Expected:** Each toggle updates the item's row in place, with no confirmation dialog. In `prisma studio`, the item's `state` column changes each time. In the guest menu on a phone, the item greys out when it becomes Unavailable, disappears when it becomes Hidden, and reappears when it becomes Available — each within 5 seconds.
- **If it fails:** Task 8.3.4.
- **Evidence:** A screenshot of the row before and after each toggle, and a screenshot of the guest menu.

#### Step 9 — A table can be added and its QR generated

- **Action:** Navigate to the Tables tab. Click "Add Table". Give it number 99. Save. On the new row, click "Print QR".
- **Expected:** The table appears in the grid. The QR print view opens in a new tab or a modal. The QR image is scannable — verifying by scanning it with a phone opens the guest landing page for table 99.
- **If it fails:** Task 8.4.1, or Task 8.4.3.
- **Evidence:** A screenshot of the tables grid, the QR print view, and a phone showing the resolved landing page.

#### Step 10 — A staff member can be added and given a role

- **Action:** Navigate to the Staff tab. Click "Add Staff". Fill in the name, username, password, and choose the "Table Service" role. Save. Log out of the admin panel. Log in as the new staff member.
- **Expected:** The new staff member appears in the staff list with the Table Service role. Logging in as the new staff member redirects to the table service queue, not the admin panel.
- **If it fails:** Task 8.5.2, or Task 8.5.4.
- **Evidence:** A screenshot of the staff list and a screenshot of the new staff member's queue after login.

#### Step 11 — A staff member's password can be reset

- **Action:** Log back in as the manager. On the new staff member's row, click "Reset Password". Set a new password. In the staff member's tab, refresh any page.
- **Expected:** The staff member's tab is signed out. Logging back in with the new password succeeds; the old password fails.
- **If it fails:** Task 8.5.6.
- **Evidence:** A screenshot of the staff member's tab after the reset and a screenshot of the successful login with the new password.

#### Step 12 — A staff member can be deactivated

- **Action:** On the new staff member's row, click "Deactivate".
- **Expected:** The staff member's state becomes Deactivated. Attempting to log in as them fails. Their name is still visible in the order histories they touched (if any).
- **If it fails:** Task 8.5.5.
- **Evidence:** A screenshot of the deactivated row, a screenshot of the failed login, and a screenshot of an order history showing the staff member's name.

#### Step 13 — A sales report covers a custom range

- **Action:** Navigate to the Reports tab. Set the date range to a custom window within the last 6 months. Click "Export CSV".
- **Expected:** The report shows a line chart of daily revenue in the staff accent color, a bar chart of orders per day, and a table of top-selling items. The CSV downloads. Its columns match the report. Its daily totals, when summed, match the corresponding sum of the orders in `prisma studio`.
- **If it fails:** Task 8.6.4, or Task 8.6.5.
- **Evidence:** A screenshot of the report and a screenshot of the downloaded CSV.

#### Step 14 — A module can be toggled off

- **Action:** Navigate to the Settings tab. Find the Room module toggle. Turn it off. Return to the navigation.
- **Expected:** The Rooms tab disappears from the navigation. The room-related settings disappear. The guest's room QR no longer resolves to a service catalog — it shows the "no longer active" or a module-disabled screen (per the product's design). The developer-enabled state is unchanged; the operator has only turned the module off for daily use.
- **If it fails:** Task 8.7.2.
- **Evidence:** A screenshot of the navigation before and after, and a screenshot of a room QR scan.

#### Step 15 — A service can be toggled off

- **Action:** In the Settings tab, find the Service toggles. Turn off "Laundry". Return to the room landing page on a phone.
- **Expected:** The Laundry card disappears from the guest's service catalog. The other service cards remain.
- **If it fails:** Task 8.7.3.
- **Evidence:** A screenshot of the guest service catalog before and after.

#### Step 16 — The settings that are read-only cannot be edited

- **Action:** In the Settings tab, find the venue's tax rate, currency, and language. Attempt to change any of them.
- **Expected:** They are shown as read-only. There is no edit control. The Branding tab is absent from the navigation entirely. The payment provider configuration is absent — the developer sets it in code, not in the admin panel.
- **If it fails:** Task 8.7.1.
- **Evidence:** A screenshot of the Settings tab showing the read-only fields and the absence of the Branding tab.

### Evidence to capture

- A screenshot of the dashboard (Step 1).
- A screenshot of the metric row and a screenshot of the corresponding database counts (Step 2).
- Screenshots of the metrics before and after the order (Step 3).
- A screenshot of the Active Orders table and a screenshot of the detail panel (Step 4).
- A screenshot of each filtered list (Step 5).
- A screenshot of the downloaded CSV (Step 6).
- A screenshot of the new item's row and its modifier group (Step 7).
- Screenshots of the row before and after each toggle, and a screenshot of the guest menu (Step 8).
- A screenshot of the tables grid, the QR print view, and a resolved landing page (Step 9).
- A screenshot of the staff list and a screenshot of the new staff member's queue after login (Step 10).
- A screenshot of the staff member's tab after the reset and a screenshot of the successful login with the new password (Step 11).
- A screenshot of the deactivated row, the failed login, and an order history showing the staff member's name (Step 12).
- A screenshot of the report and a screenshot of the downloaded CSV (Step 13).
- Screenshots of the navigation before and after, and a screenshot of a room QR scan (Step 14).
- A screenshot of the guest service catalog before and after (Step 15).
- A screenshot of the Settings tab showing the read-only fields (Step 16).

### What passes

Every step shows its expected outcome. The dashboard's metrics match the database. Filters work. Exports match the filtered rows. Items, tables, staff, and settings are all manageable. Modules and services can be toggled. The read-only settings stay read-only.

### What fails

Any step shows an unexpected outcome. A metric does not match the database. A CSV export's row count does not match the visible rows. A read-only setting is editable. The Branding tab exists.

### Close the phase

Paste the sixteen pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 8 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 9.

---

## 11. Phase 9 — Hotel Services

**Prerequisite:** Phase 8 is closed. The room module is on. At least six hotel services are enabled for the venue: Room Service Food, Housekeeping, Maintenance, Concierge, Laundry, Spa. The staff queues for each service are running.

**What this test proves:** A hotel guest can submit a service request of any enabled type, track it, edit or cancel it while it is still submitted, and see it completed. The staff queues handle every service type.

**Environment:** The repository on the developer's machine. PostgreSQL running with the seeded venue. The dev server running. A phone with a camera. The staff queues opened in separate tabs. `prisma studio` open for verification.

### Steps

#### Step 1 — The service catalog shows the enabled services

- **Action:** Scan a room QR with the phone. Look at the service catalog on the landing page.
- **Expected:** A grid of service cards. Each card shows a line-art icon in the venue's brand color, the service name, and a one-line description. The cards match exactly the services the developer enabled: Room Service, Housekeeping, Maintenance, Concierge, Laundry, Spa, Late Checkout, Wake-up Call, Do Not Disturb. Any service the developer did not enable is absent.
- **If it fails:** Task 9.3.1.
- **Evidence:** A screenshot of the service catalog.

#### Step 2 — The Housekeeping form opens

- **Action:** Tap the Housekeeping card.
- **Expected:** A dedicated screen opens (not a sheet). The screen shows a header bar with the service name and a back arrow, a short description, and the form fields: a checklist of common items (Extra towels, Extra pillows, Bed change, Room cleaning, Turndown service, Toiletries, Something else), a "When?" choice (As soon as possible, In the next hour, This afternoon, Custom time), a notes field, and a "Request" button.
- **If it fails:** Task 9.3.3.
- **Evidence:** A screenshot of the Housekeeping form.

#### Step 3 — The guest submits a Housekeeping request

- **Action:** Tick "Extra towels" and "Room cleaning". Pick "In the next hour". Add a note. Tap "Request".
- **Expected:** A confirmation screen appears with the venue's voice ("We have your request."). The request appears in the database with the correct room, type, details, and state `Submitted`. In the housekeeping queue on the staff tab, the request appears within 5 seconds.
- **If it fails:** Task 9.3.3, or Task 9.2.1, or Task 9.1.1.
- **Evidence:** A screenshot of the confirmation, a screenshot of the housekeeping queue, and a screenshot of the `ServiceRequest` row.

#### Step 4 — The guest can edit the request while it is Submitted

- **Action:** On the phone, navigate to the Requests tab. Open the Housekeeping request. Tap "Edit". Add "Extra pillow" to the checklist. Save.
- **Expected:** The request's details update. The staff queue's row shows the updated details within 5 seconds.
- **If it fails:** Task 9.4.3, or Task 9.1.5.
- **Evidence:** A screenshot of the edited request on the phone and a screenshot of the staff queue.

#### Step 5 — The guest can cancel the request while it is Submitted

- **Action:** On the phone, tap "Cancel" on the Housekeeping request.
- **Expected:** The request's state is `Cancelled`. The staff queue's row is removed within 5 seconds.
- **If it fails:** Task 9.4.3, or Task 9.1.3.
- **Evidence:** A screenshot of the phone and the staff queue.

#### Step 6 — The staff acknowledges and completes a request

- **Action:** Submit a fresh Housekeeping request from the phone. On the staff tab, tap "Acknowledge", then "In Progress", then "Complete".
- **Expected:** Each tap advances the request's state and updates the row. The guest's Requests tab shows the state change within 5 seconds of each tap.
- **If it fails:** Task 9.5.1, or Task 9.1.2.
- **Evidence:** A screenshot of the phone after each state change.

#### Step 7 — The guest cannot edit or cancel after Acknowledged

- **Action:** Submit a fresh request. On the staff tab, tap "Acknowledge". On the phone, open the request.
- **Expected:** The "Edit" and "Cancel" actions are hidden. Only the current status and the timeline are visible.
- **If it fails:** Task 9.1.5.
- **Evidence:** A screenshot of the phone showing the request without the edit and cancel actions.

#### Step 8 — The Maintenance form accepts a photo

- **Action:** Tap the Maintenance card. Fill in the issue, upload a photo, add a description, choose "Urgent", tap "Report".
- **Expected:** The request is stored. The maintenance queue shows the request with the photo attached. The photo is viewable in the staff queue.
- **If it fails:** Task 9.3.4.
- **Evidence:** A screenshot of the maintenance form on the phone and a screenshot of the maintenance queue with the photo.

#### Step 9 — The Concierge form accepts a request type

- **Action:** Tap the Concierge card. Choose "Book a taxi". Fill in the details. Tap "Submit".
- **Expected:** The request is stored with the type `concierge` and the details. The concierge queue shows the request.
- **If it fails:** Task 9.3.5.
- **Evidence:** A screenshot of the concierge form and the concierge queue.

#### Step 10 — The Laundry form captures items, service level, and pickup time

- **Action:** Tap the Laundry card. Enter counts for shirts and trousers. Choose "Same day". Choose "Now". Tap "Schedule pickup".
- **Expected:** The request is stored with the items, service level, and pickup time. The laundry queue shows the request.
- **If it fails:** Task 9.3.6.
- **Evidence:** A screenshot of the laundry form and the laundry queue.

#### Step 11 — The Spa form captures treatment, date, and guests

- **Action:** Tap the Spa card. Choose a treatment. Pick a date and time. Choose 1 guest. Tap "Book".
- **Expected:** The request is stored with the treatment, date, time, and number of guests. The spa queue shows the request.
- **If it fails:** Task 9.3.7.
- **Evidence:** A screenshot of the spa form and the spa queue.

#### Step 12 — The Late Checkout form captures a time

- **Action:** Tap the Late Checkout card. Pick a time. Tap "Request".
- **Expected:** The request is stored with the requested time. The front desk queue shows the request.
- **If it fails:** Task 9.3.8.
- **Evidence:** A screenshot of the late checkout form and the front desk queue.

#### Step 13 — The Wake-up Call form captures a time

- **Action:** Tap the Wake-up Call card. Pick a time. Tap "Set".
- **Expected:** Immediate confirmation. The request is stored. There is no tracking screen for this request; it is a one-shot action.
- **If it fails:** Task 9.3.9.
- **Evidence:** A screenshot of the confirmation and a screenshot of the `ServiceRequest` row.

#### Step 14 — The Do Not Disturb toggle flips a flag

- **Action:** Tap the Do Not Disturb card. It toggles on. Navigate away. Return to the card.
- **Expected:** The card shows the "on" state visually. In `prisma studio`, the room's `do_not_disturb` flag is `true`. Tapping it again flips it off.
- **If it fails:** Task 9.3.10.
- **Evidence:** A screenshot of the card in both states and a screenshot of the room's flag in the database.

#### Step 15 — The guest's Requests tab shows parallel tracks

- **Action:** Submit three requests of different types (Housekeeping, Maintenance, Concierge) in quick succession. Tap the Requests tab at the bottom of the screen.
- **Expected:** All three requests appear, each with its own status and its own timeline. Tapping one opens its detail. Tapping the back button returns to the combined list.
- **If it fails:** Task 9.4.1, or Task 9.4.2.
- **Evidence:** A screenshot of the Requests tab showing all three.

#### Step 16 — The front desk view combines all room requests

- **Action:** Log in as a Front Desk staff member. Open the front desk view.
- **Expected:** A combined view of all room service requests across all teams. Each row shows the room, the request type, the details, the elapsed time, and the current state.
- **If it fails:** Task 9.5.6.
- **Evidence:** A screenshot of the front desk view.

#### Step 17 — A request is archived on checkout

- **Action:** In the admin panel, check out the room. Return to the guest's phone and refresh.
- **Expected:** The guest sees a fresh session. The previous requests are not shown.
- **If it fails:** Task 9.4.4.
- **Evidence:** A screenshot of the phone after the checkout.

### Evidence to capture

- A screenshot of the service catalog (Step 1).
- A screenshot of the Housekeeping form (Step 2).
- A screenshot of the confirmation, the housekeeping queue, and the `ServiceRequest` row (Step 3).
- A screenshot of the edited request and the staff queue (Step 4).
- A screenshot of the phone and the staff queue after cancel (Step 5).
- Screenshots of the phone after each state change (Step 6).
- A screenshot of the phone without the edit and cancel actions (Step 7).
- A screenshot of the maintenance form and the queue with the photo (Step 8).
- A screenshot of the concierge form and the queue (Step 9).
- A screenshot of the laundry form and the queue (Step 10).
- A screenshot of the spa form and the queue (Step 11).
- A screenshot of the late checkout form and the front desk queue (Step 12).
- A screenshot of the confirmation and the `ServiceRequest` row (Step 13).
- A screenshot of the DND card in both states and the database flag (Step 14).
- A screenshot of the Requests tab with three parallel tracks (Step 15).
- A screenshot of the front desk view (Step 16).
- A screenshot of the phone after checkout (Step 17).

### What passes

Every step shows its expected outcome. Every service form opens and submits. The staff queues handle every service type. The guest can edit and cancel while Submitted, and cannot after. The parallel tracks view works. The front desk combined view works. Checkout archives the requests.

### What fails

Any step shows an unexpected outcome. A service form is missing. A queue is empty when it should have a request. The guest can still edit after Acknowledged.

### Close the phase

Paste the seventeen pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 9 task ✅ in `ROADMAP.md`, and advance `PROGRESS.md` §7 to Phase 10.

---

## 12. Phase 10 — Payments, Polish, Production

**Prerequisite:** Phase 9 is closed. The venue's real payment provider is connected (if the venue is ready for online payments), or the cash-at-counter path is confirmed as the first version's payment method. The product is deployed to a hosting environment.

**What this test proves:** The payment bridge is wired. The cash-at-counter path works. The product is accessible, fast, and running in production. A real venue has run a real service with real guests and real staff.

**Environment:** The production deployment of the product on the venue's real domain. A real phone. A real kitchen screen. The venue's real staff. The venue's real menu. Real guests, or the developer's team acting as guests.

### Steps

#### Step 1 — The product is deployed

- **Action:** Navigate to the venue's production URL. Confirm the deployment serves the guest landing page.
- **Expected:** The guest landing page opens with the venue's real branding — the real name, the real logo or the name as type, the real brand color, the real hero image if any, and the real welcome message.
- **If it fails:** Task 10.4.1, or Task 10.4.2.
- **Evidence:** A screenshot of the production landing page.

#### Step 2 — The QR codes are printed and placed

- **Action:** Print the venue's QR codes for every table and every room. Place them.
- **Expected:** Every QR code scans to the correct place. Scanning table 12's QR opens the table 12 landing page. Scanning room 412's QR opens the room 412 landing page.
- **If it fails:** Task 10.4.3.
- **Evidence:** A photograph of at least three placed QR codes and a screenshot of the correct landing page each resolves to.

#### Step 3 — A guest completes the cash-at-counter loop

- **Action:** A real guest (or a team member acting as one) scans a table's QR. Browses the menu. Adds items. Places the order. Tracks it. Requests the bill. Pays in cash at the counter. The staff mark the order paid and complete it.
- **Expected:** Every step of the loop works as in the Phase 5 and Phase 7 tests, with real menu items, real prices, real tax.
- **If it fails:** The task for the step that failed in Phase 5 or Phase 7.
- **Evidence:** A note in the phase's `PROGRESS.md` entry describing the loop and the real amounts.

#### Step 4 — The payment bridge records an attempt (if a provider is connected)

- **Action:** If the venue has a live payment provider, a guest taps "Pay now". Completes the payment on the provider's page. Returns to the product.
- **Expected:** A `PaymentTicket` row is written with the ticket ID and the transaction ID. The ticket's state is `succeeded`. The order is marked paid. A `Receipt` row is written. The guest sees the thank-you screen and the receipt.
- **If it fails:** Task 10.1.1 through Task 10.1.6.
- **Evidence:** A screenshot of the receipt, a screenshot of the `PaymentTicket` row, and a screenshot of the `Receipt` row.

#### Step 5 — A spoofed callback is rejected

- **Action:** From a development tool (a scratch script or an HTTP client), send a `POST /api/payments/confirm` request with a fabricated ticket ID.
- **Expected:** The response is `{ "error": { "code": "NOT_FOUND", "message": "..." } }` with HTTP status 404. No `PaymentTicket` is created. No order is marked paid.
- **If it fails:** Task 10.1.4.
- **Evidence:** The raw HTTP response and a `Select` on the `PaymentTicket` table confirming no new row.

#### Step 6 — The guest landing page opens within 1 second

- **Action:** On a phone on a 4G connection (or a throttled connection that simulates 4G), scan a table QR. Time from the moment the browser opens to the moment the venue's name is on screen.
- **Expected:** The landing page's first paint is under 1 second (per D-15.5).
- **If it fails:** Task 10.3.2.
- **Evidence:** A screenshot of the browser's performance panel showing the first-paint time.

#### Step 7 — Keyboard navigation works on every guest screen

- **Action:** On a desktop browser, tab through the guest landing page, the menu, the cart, the confirmation, and the tracking screen.
- **Expected:** Every interactive element is reachable by Tab. Every element is actionable by Enter or Space. The focus ring is visible and follows the visual order. No element traps focus. Every overlay closes on Esc.
- **If it fails:** Task 10.2.1.
- **Evidence:** A short note in the phase's `PROGRESS.md` entry confirming the walkthrough, plus a screenshot of the focus ring on the primary action.

#### Step 8 — Screen reader compatibility works on the guest flow

- **Action:** With a screen reader enabled (VoiceOver on macOS, NVDA on Windows, or TalkBack on Android), run through the guest landing page, the menu, and the tracking screen.
- **Expected:** Every icon-only button has an accessible name. Every form field has a label. Every order status change announces via a polite live region. Every toast announces once.
- **If it fails:** Task 10.2.2.
- **Evidence:** A short note in the phase's `PROGRESS.md` entry describing what the screen reader announced at each step.

#### Step 9 — Contrast passes on every screen

- **Action:** Use a contrast checker on every color pair used for text and UI components on every guest, staff, kitchen, and admin screen.
- **Expected:** Every pair passes WCAG 2.1 AA. The kitchen screen's pairs pass AAA.
- **If it fails:** Task 10.2.3.
- **Evidence:** A note in the phase's `PROGRESS.md` entry listing the pairs checked and their ratios.

#### Step 10 — Reduced motion is honoured

- **Action:** On a device with `prefers-reduced-motion: reduce` set, navigate through the guest landing page, the menu, and the tracking screen.
- **Expected:** Every animation duration is effectively zero. Every transform-based animation is removed. Elements appear at their final position. No scroll-triggered reveal animates.
- **If it fails:** Task 10.2.4.
- **Evidence:** A short note confirming the behaviour, plus a screenshot of the reduced-motion setting on the device.

#### Step 11 — The empty, loading, and error states render

- **Action:** For every guest screen and every staff queue, force each state: the empty state (no data), the loading state (the data is being fetched), and the error state (the data fetch fails).
- **Expected:** Each state renders per `DESIGN.md` §4.8.1 through §4.8.5 and the corresponding staff-screen sections. The empty states name the state and offer one action. The loading states use the correct indicators (skeletons in the guest world, a pulsing dot in the staff world). The error states name what went wrong in the user's terms and offer one action.
- **If it fails:** Task 10.2.5, or Task 10.2.6.
- **Evidence:** A screenshot of each state.

#### Step 12 — The full meal service runs end to end with real guests

- **Action:** Run a full meal service at the venue. Real guests order from their phones. The kitchen prepares. The staff delivers. The guests pay. The venue's record shows the whole service.
- **Expected:** Every order is placed, prepared, delivered, and paid. The manager's completed orders list shows every order with the correct amounts. The reports show the day's revenue matching the actual cash collected (plus online payments, if any).
- **If it fails:** Task 10.4.4.
- **Evidence:** A note in the phase's `PROGRESS.md` entry describing the service, with the order count and the revenue total.

#### Step 13 — The full housekeeping cycle runs with real guests

- **Action:** Run a full housekeeping cycle at the venue. Real guests submit requests. The housekeeping staff handle them. The guests see the requests completed.
- **Expected:** Every request is submitted, acknowledged, and completed. The manager's service request list shows every request. The front desk's combined view shows every request.
- **If it fails:** Task 10.4.5.
- **Evidence:** A note in the phase's `PROGRESS.md` entry describing the cycle, with the request count.

#### Step 14 — The deployment documentation and the onboarding checklist exist

- **Action:** Read `docs/DEPLOYMENT.md`, `docs/BACKUP_AND_RECOVERY.md`, and `docs/ONBOARDING.md`.
- **Expected:** Every document exists. The deployment document describes how to deploy the product from a fresh machine. The backup document describes how to restore the most recent backup. The onboarding document describes how to onboard a new venue, step by step, in a way that a different developer could follow.
- **If it fails:** Task 10.5.1 through Task 10.5.3.
- **Evidence:** A screenshot of each document's first page.

#### Step 15 — The staff training notes exist

- **Action:** Read `docs/STAFF_TRAINING.md`.
- **Expected:** The document describes how a staff member logs in, sees their queue, and advances an order or a request. It is written for a non-technical reader.
- **If it fails:** Task 10.5.4.
- **Evidence:** A screenshot of the document's first page.

### Evidence to capture

- A screenshot of the production landing page (Step 1).
- A photograph of placed QR codes and the resolved landing pages (Step 2).
- A note describing the cash-at-counter loop (Step 3).
- A screenshot of the receipt and the `PaymentTicket` and `Receipt` rows (Step 4, if a provider is connected).
- The raw HTTP response and the database state (Step 5).
- A screenshot of the performance panel showing first paint (Step 6).
- A note confirming the keyboard walkthrough (Step 7).
- A note describing the screen reader walkthrough (Step 8).
- A note listing the contrast pairs checked (Step 9).
- A note confirming reduced-motion behaviour and a screenshot of the setting (Step 10).
- A screenshot of each empty, loading, and error state (Step 11).
- A note describing the meal service (Step 12).
- A note describing the housekeeping cycle (Step 13).
- A screenshot of each documentation file's first page (Step 14).
- A screenshot of the staff training notes (Step 15).

### What passes

Every step shows its expected outcome. The product is deployed. The QR codes scan. The cash-at-counter loop works. If a provider is connected, the payment flow works and the spoofed callback is rejected. The landing page is under 1 second. Accessibility passes. A real venue has run a real service.

### What fails

Any step shows an unexpected outcome. A QR code scans to the wrong place. A payment is confirmed without verification. The landing page exceeds 1 second. Any accessibility check fails.

### Close the phase

Paste the fifteen pieces of evidence into a new `PROGRESS.md` entry, mark every Phase 10 task ✅ in `ROADMAP.md`, and mark the product as in production in `PROGRESS.md` §7.

---

## 13. What This File Does Not Define

- The product — that is `PRODUCT.md`.
- The reasons — those are `DECISIONS.md`.
- The shape — that is `SYSTEM.md`.
- The method — that is `BUILD.md`.
- The plan — that is `ROADMAP.md`.
- The history — that is `PROGRESS.md`.
- The visual language — that is `DESIGN.md`.
- The per-task tests — those live in `tests/`.

This file owns only the phase acceptance tests: the eleven tests that close the eleven phases. If a phase's acceptance is not described here, it is not defined. If a phase needs a step this file does not have, the step is added in a new version of this file.

---