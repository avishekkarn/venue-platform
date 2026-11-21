# ROADMAP.md — The Complete Build Plan

**Version:** 2.0
**Status:** Approved
**Approved:** 2026-10-15

**Purpose:** The ordered list of every phase, milestone, and task needed to take the product from zero to a production-ready first version. It is the live board the developer consults at the start of every session. It answers three questions: what is being built, what is next, and what is blocking.

**How to read this file:** Each phase has a goal, a list of milestones, and a list of tasks with a unique identifier. Each task has a status, a dependency, and an acceptance criterion. The status of every task is updated after each session. The order is fixed by dependency — a task never starts before the tasks it depends on are complete. Nothing here contradicts PRODUCT.md, DECISIONS.md, SYSTEM.md, or BUILD.md.

**Status legend:**

- ⬜ Not started
- 🟨 In progress
- ✅ Complete
- 🟥 Blocked
- 🔵 Deferred to a later version

---

## Table of Contents

1. How the Build Progresses
2. The Eleven Phases at a Glance
3. Phase 0 — The Documents
4. Phase 1 — The Foundation
5. Phase 2 — The Data Model
6. Phase 3 — Authentication and Sessions
7. Phase 4 — QR Codes and Guest Context
8. Phase 5 — The Menu and the Guest Order Flow
9. Phase 6 — The Kitchen
10. Phase 7 — The Service Staff Queues
10.5 Phase 7.5 — Room Service & Frontend Convergence
11. Phase 8 — The Manager Panel
12. Phase 9 — Hotel Services
13. Phase 10 — Payments, Polish, Production
14. The Dependency Graph
15. The Rule for Starting a Task
16. The Rule for Finishing a Task
17. The Rule for Updating This File

---

## 1. How the Build Progresses

The build progresses in eleven phases. Each phase has a goal — a thing that is working at the end of the phase that was not working at the start. Each phase is broken into milestones. Each milestone is broken into tasks. Each task is one session.

**The rule of dependency.** A task never starts before the tasks it depends on are complete. The dependency is not administrative; it is real. A page cannot be built before the data it reads exists. A domain function cannot be built before the repository it queries exists. A repository cannot be built before the database schema exists. The order below reflects this reality.

**The rule of visible progress.** At the end of every phase, something new is demonstrable. Not a percentage, not a plan. A thing that works. At the end of Phase 1, the project runs locally. At the end of Phase 2, the database is populated. At the end of Phase 4, a QR code can be printed and scanned. At the end of Phase 5, an order can be placed from a phone. At the end of Phase 7, the full loop from order to delivery works. At the end of Phase 10, the product is in production.

**The rule of one session per task.** A task is small enough to finish in one session. When the session ends, the task is either passed, failed, or blocked. There is no "in progress" state that spans sessions.

**The rule of honest status.** The status of every task is updated at the end of every session. A task is `✅ Complete` only when its acceptance criteria have raw evidence. A task whose status is uncertain is `🟨 In progress`, not `✅ Complete`.

---

## 2. The Eleven Phases at a Glance

| Phase | Goal                         | What works at the end                                                                              |
| ----- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 0     | The documents                | The seven documents are written, approved, and stable                                              |
| 1     | The foundation               | The project runs locally; the design tokens are in place; the base components render               |
| 2     | The data model               | The database schema exists; the venue is seeded with real data                                     |
| 3     | Authentication               | Staff and managers can log in and out; sessions work; roles are enforced                           |
| 4     | QR codes and guest context   | A QR code can be generated, printed, scanned, and resolved to a guest session                      |
| 5     | Menu and guest order         | A guest can browse the menu, add items, place an order, and track it                               |
| 6     | Kitchen                      | The kitchen screen shows tickets and advances them through their states                            |
| 7     | Service staff                | The service staff queues show items and advance them; the full order loop works end to end         |
| 8     | Manager panel                | The manager can see everything, manage the menu and tables and rooms and staff, and export reports |
| 9     | Hotel services               | The guest can submit service requests; the staff queues handle them                                |
| 10    | Payments, polish, production | The product is deployed, tested, and used by a real venue                                          |

---

## 3. Phase 0 — The Documents

**Goal:** The seven documents exist, are approved, and are stable. No code is written in this phase.

| ID  | Task                              | Status      | Depends on |
| --- | --------------------------------- | ----------- | ---------- |
| 0.1 | Write PRODUCT.md                  | ✅ Complete | —          |
| 0.2 | Write DECISIONS.md                | ✅ Complete | 0.1        |
| 0.3 | Write SYSTEM.md                   | ✅ Complete | 0.2        |
| 0.4 | Write BUILD.md                    | ✅ Complete | 0.3        |
| 0.5 | Write ROADMAP.md (this file)      | ✅ Complete | 0.4        |
| 0.6 | Write PROGRESS.md (initial entry) | ✅ Complete | 0.5        |

**Acceptance for Phase 0:** Every document is approved by the developer. No document contradicts another. No decision is missing for anything described in SYSTEM.md.

**Visible progress at the end of Phase 0:** The developer can hand the documents to anyone and the product, its reasons, its shape, and its method are all understood.

---

## 4. Phase 1 — The Foundation

**Goal:** A clean repository with a running local development environment. No product features yet. The design tokens are in place. The base components render on a scratch page. The database is reachable.

### Milestone 1.1 — Repository and tooling

| ID    | Task                                                                      | Status      | Depends on |
| ----- | ------------------------------------------------------------------------- | ----------- | ---------- |
| 1.1.1 | Create the repository with the folder structure from SYSTEM.md §3         | ✅ Complete | 0.6        |
| 1.1.2 | Configure the package manager (one and only one)                          | ✅ Complete | 1.1.1      |
| 1.1.3 | Configure TypeScript with strict mode                                     | ✅ Complete | 1.1.2      |
| 1.1.4 | Configure the framework (Next.js App Router)                              | ✅ Complete | 1.1.2      |
| 1.1.5 | Configure the environment file and the example file                       | ✅ Complete | 1.1.4      |
| 1.1.6 | Configure the `.gitignore` for secrets, build artifacts, and dependencies | ✅ Complete | 1.1.1      |
| 1.1.7 | Verify: `pnpm exec tsc --noEmit` passes, `pnpm run build` passes          | ✅ Complete | 1.1.6      |

### Milestone 1.2 — Design tokens

| ID    | Task                                                                  | Status      | Depends on |
| ----- | --------------------------------------------------------------------- | ----------- | ---------- |
| 1.2.1 | Author the color tokens (primitives, semantics, both atmospheres)     | ✅ Complete | 1.1.7      |
| 1.2.2 | Author the typography tokens (families, scale, both atmospheres)      | ✅ Complete | 1.2.1      |
| 1.2.3 | Author the spacing tokens                                             | ✅ Complete | 1.2.1      |
| 1.2.4 | Author the radius, elevation, and motion tokens                       | ✅ Complete | 1.2.1      |
| 1.2.5 | Author the status color tokens (waiting, preparing, ready, delivered) | ✅ Complete | 1.2.1      |
| 1.2.6 | Author the `prefers-reduced-motion` fallback                          | ✅ Complete | 1.2.4      |
| 1.2.7 | Verify: the tokens render on a scratch page; the build passes         | ✅ Complete | 1.2.6      |

### Milestone 1.3 — Base components

| ID    | Task                                                                       | Status      | Depends on |
| ----- | -------------------------------------------------------------------------- | ----------- | ---------- |
| 1.3.0 | Author the Tailwind 4 `@theme` token mapping in `app/globals.css`          | ✅          | 1.2.7      |
| 1.3.1 | Install and configure the base component library (shadcn/ui or equivalent) | ✅ Complete | 1.3.0      |
| 1.3.2 | Add the Button component, themed by tokens                                 | ✅ Complete | 1.3.1      |
| 1.3.3 | Add the Input, Textarea, and Select components, themed by tokens           | ✅ Complete | 1.3.2      |
| 1.3.4 | Add the Dialog, Sheet, and Drawer components                               | ✅ Complete | 1.3.2      |
| 1.3.5 | Add the Badge, Card, and Separator components                              | ✅ Complete | 1.3.2      |
| 1.3.6 | Add the Table component (for staff and manager views)                      | ✅ Complete | 1.3.2      |
| 1.3.7 | Add the Toast or notification component                                    | ✅ Complete | 1.3.2      |
| 1.3.8 | Verify: every base component renders on a scratch page; the build passes   | ✅ Complete | 1.3.7      |

### Milestone 1.4 — Shared utilities

| ID    | Task                                                       | Status      | Depends on |
| ----- | ---------------------------------------------------------- | ----------- | ---------- |
| 1.4.1 | Add the `cn` helper for class name composition             | ✅ Complete | 1.3.8      |
| 1.4.2 | Add the money formatting utility                           | ✅ Complete | 1.4.1      |
| 1.4.3 | Add the date and time formatting utility                   | ✅ Complete | 1.4.1      |
| 1.4.4 | Add the motion utilities, one per atmosphere               | ✅ Complete | 1.4.1      |
| 1.4.5 | Verify: each utility has a small unit test; the tests pass | ✅ Complete | 1.4.4      |

### Milestone 1.5 — The development server

| ID    | Task                                                                            | Status      | Depends on |
| ----- | ------------------------------------------------------------------------------- | ----------- | ---------- |
| 1.5.1 | Configure the root layout with the design tokens applied                        | ✅ Complete | 1.4.5      |
| 1.5.2 | Configure the guest and staff atmosphere wrappers                               | ✅ Complete | 1.5.1      |
| 1.5.3 | Add the 404 and error screens                                                   | ✅ Complete | 1.5.2      |
| 1.5.4 | Verify: the dev server starts, the scratch page renders, the 404 screen renders | ✅ Complete | 1.5.3      |

**Acceptance for Phase 1:** The dev server starts. The type checker passes. The build passes. The base components render. The design tokens are visible on a scratch page. No product feature works yet, and that is the point.

**Visible progress at the end of Phase 1:** The developer can open a browser and see the design system in action.

---

## 5. Phase 2 — The Data Model

**Goal:** The full database schema exists, matching SYSTEM.md §11. The seed creates one venue with tables, rooms, menu, staff, and QR codes.

### Milestone 2.1 — The schema

| ID     | Task                                                                         | Status      | Depends on |
| ------ | ---------------------------------------------------------------------------- | ----------- | ---------- |
| 2.1.1  | Configure the database client and the migration tool                         | ✅ Complete | 1.5.4      |
| 2.1.2  | Add the venue, configuration, and module-toggle tables                       | ✅ Complete | 2.1.1      |
| 2.1.3  | Add the table, room, and counter tables                                      | ✅ Complete | 2.1.2      |
| 2.1.4  | Add the QR token table                                                       | ✅ Complete | 2.1.3      |
| 2.1.5  | Add the staff member, staff session, and role tables                         | ✅ Complete | 2.1.2      |
| 2.1.6  | Add the menu category, menu item, modifier group, and modifier option tables | ✅ Complete | 2.1.2      |
| 2.1.7  | Add the order, order item, and order state-change tables                     | ✅ Complete | 2.1.6      |
| 2.1.8  | Add the service request and service request state-change tables              | ✅ Complete | 2.1.2      |
| 2.1.9  | Add the payment ticket and receipt tables                                    | ✅ Complete | 2.1.7      |
| 2.1.10 | Add every index required by the queries in SYSTEM.md §12                     | ✅ Complete | 2.1.9      |
| 2.1.11 | Generate and review the migration                                            | ✅ Complete | 2.1.10     |
| 2.1.12 | Verify: the migration applies cleanly; the schema matches SYSTEM.md §11      | ✅ Complete | 2.1.11     |

### Milestone 2.2 — The repositories

| ID    | Task                                                                                | Status      | Depends on |
| ----- | ----------------------------------------------------------------------------------- | ----------- | ---------- |
| 2.2.1 | Add the venue repository (read the venue and its modules)                           | ✅ Complete | 2.1.12     |
| 2.2.2 | Add the table and room repositories                                                 | ✅ Complete | 2.2.1      |
| 2.2.3 | Add the QR token repository                                                         | ✅ Complete | 2.2.2      |
| 2.2.4 | Add the staff and staff session repositories                                        | ✅ Complete | 2.2.1      |
| 2.2.5 | Add the menu repositories                                                           | ✅ Complete | 2.2.1      |
| 2.2.6 | Add the order repository (create, read, list, advance)                              | ✅ Complete | 2.2.5      |
| 2.2.7 | Add the service request repository                                                  | ✅ Complete | 2.2.1      |
| 2.2.8 | Add the payment ticket and receipt repositories                                     | ✅ Complete | 2.2.6      |
| 2.2.9 | Verify: each repository has an integration test that reads and writes a real record | ✅ Complete | 2.2.8      |

### Milestone 2.3 — The seed

| ID    | Task                                                                                               | Status      | Depends on |
| ----- | -------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| 2.3.1 | Seed the venue with the table, room, and counter modules enabled                                   | ✅ Complete | 2.2.9      |
| 2.3.2 | Seed the tables and rooms                                                                          | ✅ Complete | 2.3.1      |
| 2.3.3 | Seed the QR tokens, one per table, one per room, and one for the counter                           | ✅ Complete | 2.3.2      |
| 2.3.4 | Seed the menu categories and menu items with modifiers                                             | ✅ Complete | 2.3.3      |
| 2.3.5 | Seed the enabled hotel services                                                                    | ✅ Complete | 2.3.4      |
| 2.3.6.A | Extend CreateVenueInput and the venue adapter to support an optional counter                       | ✅ Complete | 2.3.5      |
| 2.3.6.B | Seed the counter and its QR token in prisma/seed.ts                                                | ✅ Complete | 2.3.6.A    |
| 2.3.7   | Verify: the seed is idempotent; running it twice does not duplicate anything; every table has data | ✅ Complete | 2.3.6.B    |

**Acceptance for Phase 2:** The database schema matches SYSTEM.md §11 exactly. The migrations apply cleanly. The seed creates a fully populated venue (tables, rooms, counter, QR codes, menu, and hotel services; staff seed moved to Task 3.1.2 per honest hashing dependency). Every repository has at least one integration test that passes.

**Visible progress at the end of Phase 2:** The developer can query the database and see a populated venue with tables, rooms, QR codes, menu, and enabled services.

---

## 6. Phase 3 — Authentication and Sessions

**Goal:** Staff and managers can log in and out. Sessions work. Roles are enforced. Route protection is in place.

### Milestone 3.1 — Session infrastructure

| ID    | Task                                                                                            | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.1.1 | Add the password hashing service (hash and verify)                                              | ✅ Complete | 2.3.7      |
| 3.1.2 | Seed the staff members with different roles                                                     | ✅ Complete | 3.1.1      |
| 3.1.3 | Add the session service (create, validate, delete, invalidate-all)                              | ✅ Complete | 3.1.2      |
| 3.1.4 | Add the session cookie helpers (set, read, clear)                                               | ✅ Complete | 3.1.3      |
| 3.1.5 | Verify: a session can be created, validated, and deleted; a password can be hashed and verified | ✅ Complete | 3.1.4      |

### Milestone 3.2 — The auth domain

| ID    | Task                                                   | Status | Depends on |
| ----- | ------------------------------------------------------ | ------ | ---------- |
| 3.2.1 | Add the `login` domain function                        | ✅ Complete | 3.1.5      |
| 3.2.2 | Add the `logout` domain function                       | ✅ Complete | 3.2.1      |
| 3.2.3 | Add the `getSession` domain function                   | ✅ Complete | 3.2.1      |
| 3.2.4 | Add the `canAccess` domain function (roles and areas)  | ✅ Complete | 3.2.3      |
| 3.2.5 | Add the password-change invalidation logic             | ✅ Complete | 3.2.4      |
| 3.2.6 | Add the single-session-per-staff-member logic          | ✅ Complete | 3.2.5      |
| 3.2.7 | Verify: every domain function has unit tests; all pass | ✅ Complete | 3.2.6      |

### Milestone 3.3 — The auth routes

| ID    | Task                                                               | Status | Depends on |
| ----- | ------------------------------------------------------------------ | ------ | ---------- |
| 3.3.1 | Add `POST /api/auth/login`                                         | ✅ Complete | 3.2.7      |
| 3.3.2 | Add `POST /api/auth/logout`                                        | ✅ Complete | 3.3.1      |
| 3.3.3 | Add `GET /api/auth/session`                                        | ✅ Complete | 3.3.1      |
| 3.3.4 | Verify: the three routes return the correct envelopes and statuses | ✅ Complete | 3.3.3      |

### Milestone 3.4 — The login screens

| ID    | Task                                                                                                      | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.4.1 | Add the staff login screen                                                                                | ✅ Complete | 3.3.4      |
| 3.4.2 | Add the manager login screen                                                                              | ✅ Complete | 3.4.1      |
| 3.4.3 | Add the kitchen login screen                                                                              | ✅ Complete | 3.4.2      |
| 3.4.4 | Verify: each login screen accepts a username and password, submits, and either signs in or shows an error | ✅ Complete | 3.4.3      |

### Milestone 3.5 — Route protection

| ID    | Task                                                                                                                                                  | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.5.1 | Add the middleware that guards the staff, kitchen, and admin routes                                                                                   | ✅ Complete | 3.4.4      |
| 3.5.2 | Add the page-level session validation on each protected page                                                                                          | ✅ Complete | 3.5.1      |
| 3.5.3 | Add the role check on each protected page                                                                                                             | ✅ Complete | 3.5.2      |
| 3.5.4 | Verify: a signed-out request is redirected; a signed-in request with the wrong role is redirected; a signed-in request with the right role is allowed | ✅ Complete | 3.5.3      |

### Milestone 3.6 — Placeholder dashboards

| ID    | Task                                                                                    | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.6.1 | Add a placeholder staff dashboard                                                       | ✅ Complete | 3.5.4      |
| 3.6.2 | Add a placeholder kitchen screen                                                        | ✅ Complete | 3.6.1      |
| 3.6.3 | Add a placeholder admin dashboard                                                       | ✅ Complete | 3.6.2      |
| 3.6.4 | Verify: each placeholder renders after login and shows the staff member's name and role | ✅ Complete | 3.6.3      |

**Acceptance for Phase 3:** A staff member can log in, see a placeholder for their area, log out, and be rejected on the next request. A staff member of one role cannot access another role's area. Changing a staff member's password invalidates their sessions. A second login ends the first.

**Visible progress at the end of Phase 3:** The developer can log in as different roles and see the correct placeholder screen.

---

## 7. Phase 4 — QR Codes and Guest Context

**Goal:** A QR code can be generated, printed, scanned, and resolved to a guest session tied to a specific table or room. The guest landing screen renders with the venue's branding.

### Milestone 4.1 — QR domain and infrastructure

| ID    | Task                                                                       | Status | Depends on |
| ----- | -------------------------------------------------------------------------- | ------ | ---------- |
| 4.1.1 | Add the `generateToken` domain function                                    | ✅ Complete | 3.6.4      |
| 4.1.2 | Add the `resolveToken` domain function                                     | ✅ Complete | 4.1.1      |
| 4.1.3 | Add the `revokeToken` domain function                                      | ✅ Complete | 4.1.1      |
| 4.1.4 | Add the QR image generator (the adapter that produces a scannable image)   | ✅ Complete | 4.1.1      |
| 4.1.5 | Verify: a token can be generated, resolved, and revoked; the image renders | ✅ Complete | 4.1.4      |

*(Milestone 4.1 is closed — QR token domain and image generator verified against real database integration tests.)*

### Milestone 4.2 — The guest session

| ID    | Task                                                                                                | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 4.2.1 | Add the guest session service (create, read, invalidate)                                            | ✅ Complete | 4.1.5      |
| 4.2.2 | Add the guest cookie helpers                                                                        | ✅ Complete | 4.2.1      |
| 4.2.3 | Add the guest session invalidation on table close and room checkout                                 | ✅ Complete | 4.2.2      |
| 4.2.4 | Verify: a guest session is created on scan, is invalidated on close, and the next scan starts fresh | ✅ Complete     | 4.2.3      |

*(Guest cookie helpers are in place; the guest session is now visible to the browser.)*
*(The capability is in place. The staff close-table and room-checkout routes that will invoke it are scheduled for Phase 7 (Tasks 7.1.4, 7.1.5, 7.2.8, 7.2.9).)*
*(Milestone 4.2 is closed — the guest session lifecycle is verified against real PostgreSQL by ENTRY-0091.)*

### Milestone 4.3 — The QR landing

| ID    | Task                                                                                               | Status | Depends on |
| ----- | -------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 4.3.1 | Add the QR landing page (resolves the token, creates the session, redirects)                       | ✅ Complete | 4.2.4      |
| 4.3.2 | Add the "QR no longer active" screen                                                               | ✅ Complete | 4.3.1      |
| 4.3.3 | Add the "scan the QR" screen for guests who land at the root without a token                       | ✅ Complete | 4.3.1      |
| 4.3.4 | Verify: a valid token opens the guest landing; a revoked token shows the "no longer active" screen | ✅ Complete | 4.3.3      |

*(Milestone 4.3 is closed — the QR landing, the inactive screen, and the root screen are verified by ENTRY-0096.)*

### Milestone 4.4 — The guest landing screen

| ID    | Task                                                                         | Status | Depends on |
| ----- | ---------------------------------------------------------------------------- | ------ | ---------- |
| 4.4.1 | Add the venue hero (name, logo, brand color, hero image, welcome message)    | ✅ Complete | 4.3.4      |
| 4.4.2 | Add the primary action (View Menu or Explore Services)                       | ✅ Complete | 4.4.1      |
| 4.4.3 | Add the quiet secondary actions (Call a waiter, Request the bill)            | ✅ Complete | 4.4.2      |
| 4.4.4 | Add the menu preview (a few featured items)                                  | ✅ Complete | 4.4.3      |
| 4.4.5 | Add the "how it works" strip                                                 | ✅ Complete | 4.4.4      |
| 4.4.6 | Add the footer                                                               | ✅ Complete | 4.4.5      |
| 4.4.7 | Verify: the landing screen renders with the venue's branding on a real phone | ✅ Complete | 4.4.6      |

*(Milestone 4.4 is closed — the guest landing screen is verified on a mobile viewport by ENTRY-0103.)*

### Milestone 4.5 — Admin QR management

| ID    | Task                                                                                     | Status | Depends on |
| ----- | ---------------------------------------------------------------------------------------- | ------ | ---------- |
| 4.5.1 | Add the QR list screen in the admin panel                                                | ✅ Complete | 4.4.7      |
| 4.5.2 | Add the QR generation action                                                             | ✅ Complete | 4.5.1      |
| 4.5.3 | Add the QR revoke action                                                                 | ✅ Complete | 4.5.2      |
| 4.5.4 | Add the QR print view                                                                    | ✅ Complete | 4.5.2      |
| 4.5.5 | Verify: the manager can generate, revoke, and print a QR; the printed QR scans correctly | ✅ Complete | 4.5.4      |

*(Milestone 4.5 is closed — QR generation, revocation, and printing are verified on a real mobile device.)*

*(Interim: Task 4.5.1 delivers a minimal per-page sign-out button on `/admin/qr` per D-9.7. The button is removed when the admin shell exists in Phase 8 Milestone 8.1–8.2.)*

**Acceptance for Phase 4:** A manager can generate a QR for a table, print it, place it on the table, and scan it with a real phone. The phone opens the venue's landing screen with the table number. A revoked QR shows the "no longer active" screen. A room QR opens the guest service catalog.

**Visible progress at the end of Phase 4:** The developer can print a QR code and scan it with a real phone.

---

## 8. Phase 5 — The Menu and the Guest Order Flow

**Goal:** A guest can browse the menu, customize an item, add it to a cart, place an order, and track it. The order is stored with frozen prices and tax.

### Milestone 5.0 — Development Infrastructure (Mobile Testing)

| ID    | Task                                                                 | Status | Depends on |
| ----- | -------------------------------------------------------------------- | ------ | ---------- |
| 5.0.1 | Add the `DEV_LAN_ORIGIN` environment variable to `.env.local.example`| ✅ Complete | —          |
| 5.0.2 | Add the `/dev/qr` route (fetching valid tokens and generating QR codes) | ✅ Complete | 5.0.1      |
| 5.0.3 | Verify: the QR code resolves to the LAN IP and opens the correct guest flow | ✅ Complete | 5.0.2      |

### Milestone 5.1 — The menu domain

| ID    | Task                                                                             | Status | Depends on |
| ----- | -------------------------------------------------------------------------------- | ------ | ---------- |
| 5.1.1 | Add the `getMenu` domain function                                                | ✅ Complete | 4.5.5      |
| 5.1.2 | Add the `getMenuItem` domain function                                            | ✅ Complete | 5.1.1      |
| 5.1.3 | Add the `isOrderable` domain function (item state check)                         | ✅ Complete | 5.1.2      |
| 5.1.4 | Verify: the menu returns only available and unavailable items, never hidden ones | ✅ Complete | 5.1.3      |

*(Milestone 5.1 is closed — the menu domain primitives (getMenu, getMenuItem, isOrderable) are verified against real PostgreSQL, including the D-4.2 HIDDEN-item exclusion at the database layer. Milestone 5.2 is unblocked.)*

### Milestone 5.2 — The menu screen    

| ID    | Task                                                                                                                    | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.2.1 | Add the menu screen with category tabs                                                                                  | ✅ Complete | 5.1.4      |
| 5.2.2 | Add the item list with photos, names, descriptions, and prices                                                          | ✅ Complete | 5.2.1      |
| 5.2.3 | Add the search bar                                                                                                      | ✅ Complete | 5.2.2      |
| 5.2.4 | Add the unavailable-item state (greyed out, with a label)                                                               | ✅ Complete | 5.2.3      |
| 5.2.5 | Add the floating cart bar                                                                                               | ✅ Complete | 5.2.4      |
| 5.2.6 | Verify: the menu renders on a real phone; the categories work; the search filters; an unavailable item is not orderable | ✅ Complete | 5.2.5      |

### Milestone 5.3 — The modifier sheet

| ID    | Task                                                                                     | Status | Depends on |
| ----- | ---------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.3.1 | Add the modifier sheet layout                                                            | ✅ Complete | 5.2.6      |
| 5.3.2 | Add the single-choice modifier group                                                     | ✅ Complete | 5.3.1      |
| 5.3.3 | Add the multiple-choice modifier group                                                   | ✅ Complete | 5.3.1      |
| 5.3.4 | Add the quantity stepper                                                                 | ✅ Complete | 5.3.2      |
| 5.3.5 | Add the notes field                                                                      | ✅ Complete | 5.3.2      |
| 5.3.6 | Add the live total                                                                       | ✅ Complete | 5.3.4      |
| 5.3.7 | Add the "Add to cart" action                                                             | ✅ Complete | 5.3.6      |
| 5.3.8 | Verify: a dish with modifiers can be customized and added to the cart; the price updates | ✅ Complete      | 5.3.7      |

*(Milestone 5.3 is closed — the modifier sheet, single/multiple choice groups, quantity stepper, notes field, live total, and add-to-cart action are verified and complete. Milestone 5.4 is unblocked.)*

### Milestone 5.4 — The cart

| ID    | Task                                                                                                           | Status | Depends on |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.4.1 | Add the cart screen                                                                                            | ✅ Complete | 5.3.8      |
| 5.4.2 | Add item-level adjustment (quantity, remove)                                                                   | ✅ Complete | 5.4.1      |
| 5.4.3 | Add the order-level notes field                                                                                | ✅ Complete | 5.4.1      |
| 5.4.4 | Add the summary (subtotal, tax, total)                                                                         | ✅ Complete | 5.4.2      |
| 5.4.5 | Add the "Place order" action                                                                                   | ✅ Complete | 5.4.4      |
| 5.4.6 | Add the empty cart state                                                                                       | ✅ Complete | 5.4.1      |
| 5.4.7 | Add the pickup-name field for the counter flow                                                                 | ✅ Complete | 5.4.5      |
| 5.4.8 | Verify: items can be added, adjusted, and removed; the totals are correct; the counter pickup name is captured | ✅ Complete | 5.4.7      |

*(Milestone 5.4 (The Cart) is closed — all eight tasks are complete; the cart shell, quantity/remove, order notes, summary preview, Place order initiator, empty state, and pickup-name field are verified on a real phone via LAN; the cart summary is a client-side display preview and the authoritative charged amount is deferred to Tasks 5.5.2/5.5.3 and verified at the Phase 5 acceptance test after 5.5.x; W-0001 (the Place order submission seam) remains OPEN and is satisfied by Task 5.6.1. Milestone 5.5 is unblocked.)*

### Milestone 5.5 — The order domain

| ID    | Task                                                                                                                                              | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.5.1 | Add the price and tax computation (`computePrice`, `computeTax`, and the shared decimal-money helper)                                             | ✅ Complete | 5.4.8      |
| 5.5.2 | Add the `createOrder` domain function (validate, freeze item prices and modifiers, enforce the idempotency key, call the order repository)          | ✅ Complete | 5.5.1      |
| 5.5.3 | Verify: `createOrder` writes an order with frozen prices and tax and the initial `PLACED` state change in one transaction; a retry with the same idempotency key returns the existing order; the transaction rolls back on error. *(The transactional write and the idempotency constraint are already implemented in `src/infrastructure/db/repositories/order.repo.ts`; this task proves them against the real database.)* | ✅ Complete | 5.5.2      |

*(Milestone 5.5 is restructured from the original six-task plan: the former 5.5.4 (initial state change), 5.5.5 (transaction wrapper), and 5.5.6 (verification) are consolidated into 5.5.3, because the transactional write and the idempotency constraint are already implemented in the order adapter; the former 5.5.2 (price and tax computation) becomes 5.5.1 because `createOrder` cannot be built before the computations that produce its inputs; and the former 5.5.1 (`createOrder`) becomes 5.5.2. No work is removed; the verification is preserved and made against the real database.)*

*(Milestone 5.5 (The Order Domain) is closed — all three tasks are complete: price and tax arithmetic (5.5.1), the createOrder orchestrator (5.5.2), and the real-database verification (5.5.3) are complete and proven; the transactional write and the idempotency constraint live in the order repository adapter; Milestone 5.6 (The Order Routes) is unblocked; W-0001 (the Place order submission seam in app/(guest)/cart/page.tsx) remains OPEN and is satisfied by Task 5.6.1.)*

### Milestone 5.6 — The order routes

| ID    | Task                                                                                       | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------ | ------ | ---------- |
| 5.6.1 | Add `POST /api/guest/orders`                                                               | ✅     | 5.5.3      |
| 5.6.2 | Add `GET /api/guest/orders/[id]`                                                           | ✅     | 5.6.1      |
| 5.6.3 | Add `GET /api/guest/orders`                                                                | ✅     | 5.6.1      |
| 5.6.4 | Verify: an order can be placed, read, and listed; the response shape matches SYSTEM.md §12 | ✅     | 5.6.3      |

*(Wiring note: Task 5.6.1 must replace the PLACE-ORDER SEAM (W-0001) in `app/(guest)/cart/page.tsx` with the real submission — client idempotency key per D-4.12, POST to `/api/guest/orders`, and on success navigate to 5.7.1. Per D-17.5 and W-0001, 5.6.1 must also send the pickup name alongside the place identifier).*

*(Milestone 5.6 (The Order Routes) is closed — all four tasks are complete: POST /api/guest/orders (5.6.1), GET /api/guest/orders/[id] (5.6.2), GET /api/guest/orders (5.6.3), and the complete placement, read, list flow and envelope verification (5.6.4) are complete and proven; W-0001 is discharged; Milestone 5.7 (The order confirmation and tracking) is unblocked.)*

### Milestone 5.7 — The order confirmation and tracking

| ID    | Task                                                                                                                                        | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.7.1 | Add the order confirmation screen                                                                                                           | ✅ Complete | 5.6.4      |
| 5.7.2 | Add the order tracking screen with the timeline                                                                                             | ✅ Complete | 5.7.1      |
| 5.7.3  | Add the "add more items" action                                                                                                             | ✅ Complete | 5.7.2      |
| 5.7.0A | Extend service-request storage for table/counter calls                                                                                      | ✅ Complete | 5.7.3      |
| 5.7.0B | Show all session orders and combined bill on tracking screen                                                                                | ✅ Complete | 5.7.0A     |
| 5.7.4  | Add the "call a waiter" and "request the bill" actions                                                                                      | ✅ Complete | 5.7.0A, 5.7.0B |
| 5.7.5 | Add the polling on the tracking screen                                                                                                      | ✅ Complete | 5.7.2      |
| 5.7.6 | Verify: an order placed from a phone appears on the tracking screen with the correct state; the state updates when it changes on the server | ✅ Complete     | 5.7.5      |
| 5.7.7 | Verify the counter loop: guest scans the counter QR, orders with a pickup name, staff marks ready for pickup, staff marks picked up         | ✅ Complete     | 5.7.6      |

*(Milestone 5.7 (The Order Confirmation and Tracking) is closed — all seven tasks are complete. The guest can place an order, view the confirmation, track all their session orders on a single page with a combined bill, call a waiter/request the bill, and watch the timeline update live via polling. Verified manually on a mobile device via LAN. Phase 6 (The Kitchen) is unblocked.)*

### Milestone 5.8 — Menu item state updates

| ID    | Task                                                                                               | Status | Depends on |
| ----- | -------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.8.1 | Add the admin action to change a menu item's state                                                 | ✅ Complete | 5.7.7      |
| 5.8.2 | Add the guest-side refresh when the state changes                                                  | ✅ Complete | 5.8.1      |
| 5.8.3 | Add the guest-side ping when an item's state changes                                               | ✅ Complete | 5.8.2      |
| 5.8.4 | Verify: an item marked unavailable by the manager greys out on the guest's screen within 5 seconds | ✅ Complete | 5.8.3      |

*(Milestone 5.8 and Phase 5 are closed — the complete guest order flow, from scanning a QR and ordering, to tracking the order, requesting the bill, and seeing menu changes live on their device, is complete and verified. Phase 6 is unblocked.)*

**Acceptance for Phase 5:** A guest can scan a QR, browse the menu, customize an item, add it to the cart, place the order, and see the order's confirmation and tracking. The order's prices and tax are frozen. The order appears in the manager's order list. Changing an item's state from the admin panel updates the guest's screen.

**Visible progress at the end of Phase 5:** A real order placed from a real phone with real prices and real tax.

---

## 9. Phase 6 — The Kitchen

**Goal:** The kitchen screen shows tickets and advances them through their states. The guest's tracking screen reflects the kitchen's actions.

### Milestone 6.1 — The kitchen domain

| ID    | Task                                                                                                                  | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 6.1.0.A | Author the transition table (`src/domain/orders/transitions.ts`) — the `OrderState` transition table from SYSTEM.md §9.2 and an `isTransitionAllowed(from, to)` validator returning `Result<true>` / `fail(INVALID_STATE)`; add its unit test | ✅ Complete | 5.8.4      |
| 6.1.0.B | Add the exhaustive transition table unit test (fill `tests/unit/orders/transitions.test.ts` with every allowed and every forbidden pair, coverage of all seven states, and the exact allowed-transition count) | ✅ Complete | 6.1.0.A    |
| 6.1.4 | Add the state-transition validation helper (the domain function in `src/domain/orders/advance-order.ts` that calls `isTransitionAllowed` from 6.1.0.A, returns `INVALID_STATE` on a forbidden transition, and carries the acting `staffMemberId` so the state-change record is guaranteed) | ✅ Complete | 6.1.0.B    |
| 6.1.1 | Add the order approval action (`PLACED → APPROVED`) using the helper from 6.1.4 | ✅ Complete | 6.1.4      |
| 6.1.2 | Add the kitchen start action (`APPROVED → PREPARING`) using the same helper | ✅ Complete | 6.1.1      |
| 6.1.3 | Add the kitchen ready action (`PREPARING → READY`) using the same helper | ✅ Complete | 6.1.2      |
| 6.1.6 | Verify: the transitions are correct; invalid transitions return `INVALID_STATE`; the state-change records are written (the unit tests of 6.1.0.B, 6.1.4, and the integration test of `advanceState` together prove it) | ✅ Complete | 6.1.3      |

*(Task 6.1.5 is folded into 6.1.4 — the record is already written by `advanceState`; 6.1.4's helper guarantees the acting staff member is carried, and 6.1.6 verifies the record. Task 6.1.0 is split into 6.1.0.A (author the table) and 6.1.0.B (prove the table) because the empty `transitions.ts` placeholder required a new task boundary. No work is removed. Task 6.1.4 is now a CREATE of the empty `advance-order.ts`, not an edit.)*

### Milestone 6.2 — The kitchen routes

| ID    | Task                                                                                        | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------- | ------ | ---------- |
| 6.2.1 | Add `GET /api/kitchen/orders`                                                               | ✅ Complete | 6.1.6      |
| 6.2.2 | Add `POST /api/kitchen/orders/[id]/start` and `POST /api/kitchen/orders/[id]/ready` (both call the 6.1.2/6.1.3 domain functions; same shape, one session) | ✅ Complete | 6.2.1      |
| 6.2.4 | Verify: the kitchen can read its orders and advance them; the responses match SYSTEM.md §12 | ✅ Complete | 6.2.2      |

*(Task 6.2.3 is folded into 6.2.2 — the two routes are the same adapter shape calling two already-tested domain functions. No work is removed.)*

### Milestone 6.3 — The kitchen screen

| ID    | Task                                                                                                                                    | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 6.3.1 | Add the ticket grid layout                                                                                                              | ✅ Complete | 6.2.4      |
| 6.3.2 | Add the ticket card (order number, place, items, modifiers, notes)                                                                      | ✅ Complete | 6.3.1      |
| 6.3.3 | Add the elapsed time display                                                                                                            | ✅ Complete | 6.3.2      |
| 6.3.4 | Add the "Start" and "Ready" actions (native DOM, in-place update, no page reload — the same discipline as the guest menu polling)       | ✅ Complete | 6.3.3      |
| 6.3.6 | Add the dark mode default           | ✅ Complete | 6.3.4      |
| 6.3.7 | Add the connection state indicator  | ✅ Complete | 6.3.4      |
| 6.3.8 | Verify: a ticket appears within 5 seconds of approval; the actions advance the ticket; the guest's tracking screen reflects the changes | ✅ Complete | 6.3.6, 6.3.7 |

*(Task 6.3.5 is folded into 6.3.4 — two buttons on one card wired to two routes is one concern. No work is removed.)*

### Milestone 6.4 — The kitchen ping

| ID    | Task                                                                  | Status | Depends on |
| ----- | --------------------------------------------------------------------- | ------ | ---------- |
| 6.4.1 | Add auto-refresh for new tickets and the audible ping (Web Audio, single 880 Hz tone, no mute, native DOM diffing — same discipline as the guest menu ping) | ✅ Complete | 6.3.8      |

*(Task 6.4.2 is folded into 6.4.1 — the ping is a small native script and its verification is the same session's manual audio check. No work is removed.)*

**Acceptance for Phase 6:** An order placed by a guest, approved by staff, and prepared by the kitchen appears on the kitchen screen, advances through Preparing and Ready, and the guest's tracking screen reflects each change.

**Visible progress at the end of Phase 6:** The kitchen screen runs on a real screen with real tickets.

---

## 10. Phase 7 — The Service Staff Queues

**Goal:** The service staff queues show orders and requests, allow one-tap advancement (Approve → Deliver → Complete), and close the full loop from placement to session termination for both tables and rooms.

### Milestone 7.1 — The staff domain

| ID    | Task                                                                                                      | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.1.1 | Add the order approval action (`PLACED` → `APPROVED`) so orders reach the kitchen                        | ✅ Complete | 6.4.1      |
| 7.1.2 | Add the delivery action (`READY` → `DELIVERED`)                                                           | ✅ Complete | 7.1.1      |
| 7.1.3 | Add the completion action (`DELIVERED` → `COMPLETED`)                                                     | ✅ Complete | 7.1.2      |
| 7.1.4 | Add the cancellation action with a reason (for both orders and requests)                                  | ✅ Complete | 7.1.3      |
| 7.1.5 | Add the table-close action (invalidates sessions, sets table FREE)                                        | ✅ Complete | 7.1.3 (order path) |
| 7.1.6 | Add the room-checkout action (invalidates sessions, sets room VACANT)                                     | ✅ Complete | 7.1.5      |
| 7.1.7 | Verify: state machine enforced; guest session invalidated on close/checkout                               | ✅ Complete | 7.1.6      |

*(Only the order cancellation path (cancelOrder in src/domain/orders/actions.ts) is complete. The request cancellation (src/domain/requests/cancel-request.ts) is a 0-byte stub and is Phase 9 (Task 9.1.3). Task 7.1.4 remains 🟨 until both are done; the request half is Phase 9.)*
*(Task 7.1.5 does not depend on 7.1.4's deferred request-cancellation half — see ENTRY-0202 Addendum.)*

### Milestone 7.2 — The staff routes

| ID     | Task                                                                                            | Status | Depends on |
| ------ | ----------------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.2.1  | Add `GET /api/staff/orders` (fetch active orders for the queue)                                 | ✅ Complete | 7.1.7      |
| 7.2.2  | Add `POST /api/staff/orders/[id]/approve` (move PLACED → APPROVED)                              | ✅ Complete | 7.2.1      |
| 7.2.3  | Add `POST /api/staff/orders/[id]/deliver` (move READY → DELIVERED)                              | ✅ Complete | 7.2.2      |
| 7.2.4  | Add `POST /api/staff/orders/[id]/complete` (move DELIVERED → COMPLETED)                         | ✅ Complete | 7.2.3      |
| 7.2.5  | Add `POST /api/staff/orders/[id]/cancel` (cancel with reason)                                   | ✅ Complete | 7.2.4      |
| 7.2.6  | Add `POST /api/staff/tables/[id]/close` (close table and end session)                           | ✅ Complete | 7.2.5      |
| 7.2.7  | Add `POST /api/staff/rooms/[id]/checkout` (checkout room and end session)                       | ✅ Complete | 7.2.6      |
| 7.2.8  | Add `GET /api/staff/requests` and all request action routes (advance, cancel, decline)          | 🔵 Deferred | 7.2.7      |
| 7.2.9  | Verify: every route returns the correct envelope and status; the state transitions are enforced | 🔵 Deferred | 7.2.8      |

*(7.2.8 was deferred to Phase 9 as Task 9.5.6 (Request routes) — see PROGRESS ENTRY-0194 and ENTRY-0202.)*

*(Task 7.2.9 is deferred to Phase 9 as Task 9.5.10 (the request route verification half). The order routes verification is complete and was tracked in 7.2.7. See ENTRY-0202 Addendum and Task 9.5.10 below.)*

### Milestone 7.3 — The service staff screen

| ID    | Task                                                                                    | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.3.1 | Add the staff layout with the tabs (Orders, Table Map, Room Map)                        | ✅ Complete | 7.2.7      |
| 7.3.2 | Add the order queue table (filtered by state: Placed, Ready, Delivered)                 | ✅ Complete | 7.3.1      |
| 7.3.3 | Add the one-tap actions to the order queue (Approve, Deliver, Complete)                 | ✅ Complete | 7.3.2      |
| 7.3.6 | Add the table map (grid of tables with status + "Close Table" button)                   | ✅ Complete | 7.3.1      |
| 7.3.7 | Add the room map (grid of rooms with status + "Checkout Room" button)                   | ✅ Complete | 7.3.6      |
| 7.3.8 | Verify: the queues render on a real tablet; actions advance items; maps close tables/rooms | ✅ Complete | 7.3.7      |

*(Tasks 7.3.4 and 7.3.5 — the Request Queue and its actions — are moved to Phase 9 (Hotel Services) as Tasks 9.5.8 and 9.5.9. The request lifecycle domain (advanceRequest, cancelRequest, declineRequest, request.transitions) is a Phase 9 deliverable; the Request Queue UI depends on it. Building the queue in Phase 7 would require inventing the domain functions out of scope. No work is removed; it is reordered.)*

*(Task 7.2.8 — the requests routes — is likewise deferred to Phase 9 as Tasks 9.5.6 and 9.5.7. Same reason.)*

### Milestone 7.4 — The full loop verification

*(Milestone 7.4 verification is required before Stage 3 of the Refinement Program per ENTRY-0201. Prior PROGRESS entries mislabeled Tasks 7.4.2 / 7.4.3 — see ENTRY-0202.)*

| ID    | Task                                                                                                                              | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.4.1 | Verify the full table loop: guest places order → staff approves → kitchen starts → kitchen ready → staff delivers → staff completes → staff closes table | ✅ Complete | 7.3.8      |
| 7.4.2 | Verify the full room service loop with the same shape                                                                             | ✅ Complete | 7.4.1      |
| 7.4.3 | Verify the guest's tracking screen reflects every state change                                                                    | ✅ Complete | 7.4.2      |
| 7.4.4 | Verify the table close and room checkout end the guest session (and kick the guest out)                                           | ✅ Complete | 7.4.3      |

*(Phase 7 closed via Phase 7.5 convergence. All loops verified end-to-end.)*

**Acceptance for Phase 7:** The complete order loop works end to end. A guest places an order, the staff approves it, the kitchen and staff advance it, the guest tracks it, the staff delivers it, and finally, the staff closes the table, ending the guest session and freeing the table.

## 10.5 Phase 7.5 — Room Service & Frontend Convergence

**Goal:** The room service flow (food + all 8 non-food services) works end to end with the same completeness as the table flow, the staff role model enforces focused visibility per D-18.1, and the frontend (kitchen especially) is optimized for tablets. No Phase 8 dashboard work begins until 7.5 closes.

### Milestone 7.5 — The Room & Convergence

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 7.5.0 | Formalize Phase 7.5, D-18.1, and update docs | ✅ Complete | 7.4.4 |
| 7.5.1 | Stage 3 flow audit (walk all 16 flows; catalog defects) | ✅ Complete | 7.5.0 |
| 7.5.2 | Add `src/domain/requests/transitions.ts` with unit tests | ✅ Complete | 7.5.1 |
| 7.5.3 | Add `advance`, `cancel`, `decline`, `edit` request domain functions | ✅ Complete | 7.5.2 |
| 7.5.4 | Add `app/api/guest/requests/*` routes (submit, edit, cancel, list) | ✅ Complete | 7.5.3 |
| 7.5.5 | Add `app/api/staff/requests/*` routes (queue, advance, cancel, decline) | ✅ Complete | 7.5.4 |
| 7.5.6 | Fix room→menu navigation (Room Service tile opens menu with `placeType=ROOM`) | ✅ Complete | 7.5.5 |
| 7.5.7 | Build guest request forms for the 8 non-food services | ✅ Complete | 7.5.6 |
| 7.5.8 | Build guest Requests view (combined active requests timeline) | ✅ Complete | 7.5.7 |
| 7.5.9 | Implement D-18.1 staff focus model (Charlie = LEADER) | ✅ Complete | 7.5.8 |
| 7.5.10 | Optimize kitchen screen for tablets (fixed header, tabbed grids, close action) | ✅ Complete | 7.5.9 |
| 7.5.11 | Fix room checkout 403 UX (hide actions based on role) | ✅ Complete | 7.5.10 |
| 7.5.12 | Verify: Full loop for table and room works without regressions | ✅ Complete | 7.5.11 |
| 7.5.13 | Copy fix & consistency for service requests | ✅ Complete | 7.5.8 |
| 7.5.14 | Add the staff request queue UI (LEADER-visible `/staff/requests` tab with queue, actions, and status) | ✅ Complete | 7.5.8 |
| 7.5.15.A | Add `guestSessionId` to `ServiceRequest` schema and repository | ✅ Complete | 7.5.14 |
| 7.5.15.B | Wire `guestSessionId` into guest request flow | ✅ Complete | 7.5.15.A |
| 7.5.15.C | Active-session filter for staff requests queue | ✅ Complete | 7.5.15.B |
| 7.5.16 | Add back-link to `/services` on `/menu` for ROOM sessions | ✅ Complete | 7.5.15.C |
| 7.5.16.FIX | Align Room Join Request experience with Table flow | ✅ Complete | 7.5.16 |
| 7.5.16.FIX.2 | Vanilla join request script injection | ✅ Complete | 7.5.16.FIX |
| 7.5.16.FIX.3 | Server-side cookie injection for join approval | ✅ Complete | 7.5.16.FIX.2 |
| 7.5.17 | Live polling on guest `/requests` | ✅ Complete | 7.5.15.B |
| 7.5.17.FIX | Convert `/requests` to JSON polling | ✅ Complete | 7.5.17 |
| 7.5.17.FIX.2 | Align polling discipline with order tracking | ✅ Complete | 7.5.17.FIX |
| 7.5.17.FIX.3 | Direct useState update for requests timeline | ✅ Complete | 7.5.17.FIX.2 |
| 7.5.17.FIX.4 | Vanilla-JS DOM replacement polling for `/requests` | ✅ Complete | 7.5.17.FIX.3 |

*(7.5.0 completed at commit `61e9049` (ENTRY-0205). 7.5.1 audit completed via live walk of 16 flows; defects catalogued in ENTRY-0206. 7.5.2 completed at commit `ba83f6d`; see ENTRY-0207. 7.5.2a (vitest config fix) completed at the same commit; see ENTRY-0208.)*

*(7.5.1 audit finding: the 9 service tiles on `/services` are inert — no `href`, no `onClick`, no network request on click. The `/menu` → `/cart` → `/api/guest/orders` flow is place-agnostic and already supports ROOM sessions; only the tiles need to navigate. Task 7.5.6 will make "Room Service" a `<Link href="/menu">`; Task 7.5.7 will make the other 8 tiles route to their forms.)*

*(7.5.3 completed across two commits: 7.5.3.A at `36cd603` (advanceRequest + cancelRequest, 13 tests) and 7.5.3.B at `9b0b21e` (declineRequest + editRequest, 9 tests). See ENTRY-0209 and ENTRY-0210. Unit suite: 232 -> 245 -> 254. The request domain layer is now complete and mirrors the order domain layer.)*

*(7.5.4 completed at commit `3e6e21e`. Guest request routes `POST /api/guest/requests`, `GET /api/guest/requests`, `GET /api/guest/requests/[id]`, `PATCH /api/guest/requests/[id]`, and `POST /api/guest/requests/[id]/cancel` are on `origin/main`. Eight integration tests prove the flow, including the client-supplied-place rejection (SYSTEM.md §15.2) and the D-5.3 / D-5.4 windows. See ENTRY-0211. Integration suite: 189 -> 197. Unit suite unchanged at 254.)*

*(7.5.5 completed at commit `4425444`. Staff request routes `GET /api/staff/requests`, `POST /api/staff/requests/[id]/advance`, `POST /api/staff/requests/[id]/cancel`, and `POST /api/staff/requests/[id]/decline` are on `origin/main`. Eight integration tests prove the flow, including the role gate (`canAccess(roles, "front-desk")`), the transition-table enforcement, and the reason-required guard on cancel/decline. See ENTRY-0212. Integration suite: 197 -> 205. Unit suite unchanged at 254. The request lifecycle is now callable end-to-end at the API level: guest creates, staff lists / advances / cancels / declines.)*

*(7.5.14 added on 2026-11-03 per ENTRY-0218. The Phase 7.5 goal — "the room service flow (food + all 8 non-food services) works end to end with the same completeness as the table flow" — cannot be satisfied without a staff surface to see and act on the 8 service request types. Phase 9's Task 9.5.8 remains the canonical focused per-role Request Queue (with scoped queues per HOUSEKEEPING / MAINTENANCE / CONCIERGE / LAUNDRY / SPA / FRONT_DESK). Task 7.5.14 is the minimal LEADER-visible queue that closes the loop in Phase 7.5. Both are tracked; they are not duplicates — 7.5.14 delivers the LEADER view; 9.5.8 delivers the focused per-role views. See WIRING.md W-0017.)*

Phase 7.5 is closed. The Room loop is now 1:1 aligned with the Table loop. The guest polling, the shared join sessions, and the kitchen layout are all verified.

## 10.5 Phase 7.5 — Room Service & Frontend Convergence

**Status:** ✅ COMPLETE — Phase 7.5 is closed. All tasks ✅ Complete. See PROGRESS ENTRY-0219.

*(The full task list is preserved below for audit; all statuses are ✅ as of ENTRY-0219.)*

| ID | Task | Status |
|----|------|--------|
| 7.5.0 | Formalize Phase 7.5, D-18.1, and update docs | ✅ Complete |
| 7.5.1 | Stage 3 flow audit | ✅ Complete |
| 7.5.2 | request transitions.ts | ✅ Complete |
| 7.5.3 | advance, cancel, decline, edit request domain functions | ✅ Complete |
| 7.5.4 | Guest request routes | ✅ Complete |
| 7.5.5 | Staff request routes | ✅ Complete |
| 7.5.6 | Room Service tile fix | ✅ Complete |
| 7.5.7 | 8 non-food service forms | ✅ Complete |
| 7.5.8 | Guest /requests view | ✅ Complete |
| 7.5.9 | LEADER role + focus model | ✅ Complete |
| 7.5.10 | Kitchen layout polish (tabbed filter, close action) | ✅ Complete |
| 7.5.11 | Room checkout 403 UX | ✅ Complete |
| 7.5.12 | Full loop verification | ✅ Complete |
| 7.5.13 | Copy fix | ✅ Complete |
| 7.5.14 | Staff request queue UI | ✅ Complete |
| 7.5.15.A/B/C | guestSessionId scoping | ✅ Complete |
| 7.5.16 | Back-link on /menu | ✅ Complete |
| 7.5.16.FIX/2/3 | Join request alignment (server cookie) | ✅ Complete |
| 7.5.17.FIX.1–4 | Vanilla-JS polling for /requests | ✅ Complete |

**Phase 7.5 is closed.** The Room loop is now 1:1 aligned with the Table loop. The guest polling, the shared join sessions, and the kitchen layout are all verified. All WIRING obligations from Phase 7.5 (W-0012, W-0013, W-0017) are discharged.

---

## 10.6 Phase 7.6 — Foundation Hardening (NEW)

**Goal:** Before Phase 8 begins, every documentation and code-level debt identified in the post-7.5 audit is closed. The four baselines remain green. No new features. No scope creep.

**Why this phase exists:** Three of the last five sessions were spent on bugs caused by documentation drift and code-level ambiguity (React polling failures, join-banner overlay, cookie race). This phase is a deliberate pause to lock in what we have built and to make the ground clean enough for Phase 8 to be built on it without inheriting the debt.

**Dependency:** Phase 7.5 is ✅ Complete (commit `5ff756f`).

**Duration:** 10 tasks, 1 task per session.

**Acceptance for Phase 7.6:** Every acceptance criterion has raw evidence. The four baselines pass. The docs match the code. The audit findings are all closed. No code outside the task's scope was touched. `git status --porcelain` is empty after the last task.

### Milestone 7.6 — The Hardening

| ID | Task | Status | Depends on | Scope |
|----|------|--------|------------|-------|
| 7.6.1 | ROADMAP.md rewrite (this file) | ✅ Complete | 7.5 | 1 file |
| 7.6.2 | README.md reconciliation | ✅ Complete | 7.6.1 | 1 file |
| 7.6.3 | DECISIONS.md — new records D-19.1, D-19.2 | ✅ Complete | 7.6.2 | 1 file |
| 7.6.4 | DECISIONS.md — appendix + count reconciliation | ✅ Complete | (folded into 7.6.3) | — |
| 7.6.5 | SYSTEM.md — API surface reconciliation | ✅ Complete | 7.6.3 | 1 file |
| 7.6.6 | PHASE_TESTS.md — Phase 7.5 closure note | ✅ Complete | 7.6.5 | 1 file |
| 7.6.7 | DESIGN.md — kitchen tab, close action, join banner, /requests polling | ✅ Complete | 7.6.6 | 1 file |
| 7.6.8 | Polling XSS contract documentation (audit: no user input in polling HTML today; Phase 9 must add escapeHtml when it introduces free-text) | ✅ Complete | 7.6.7 | 2 files (repaired: template literal backticks in 7.6.8.FIX) |
| 7.6.9 | listForGuestSession! fix (BUILD.md §2.6 compliance) | ✅ Complete | 7.6.8 | 6 files |
| 7.6.10 | WIRING.md — final discharge sweep + verify no duplicates | ✅ Complete | 7.6.9 | 1 file |
| 7.6.11 | Full foundation verification (four baselines + manual walkthroughs) | ✅ Complete | 7.6.10 | 0 files |

### Task Descriptions (Precise, Anti-Hallucination)

**7.6.1 — ROADMAP.md rewrite**
- **Files:** `docs/ROADMAP.md`
- **Action:** Replace §10.5 (Phase 7.5) through §17 with the new content you paste from this message.
- **Acceptance:** `Select-String -Path docs/ROADMAP.md -Pattern "Phase 7.6"` returns ≥1. `Select-String -Path docs/ROADMAP.md -Pattern "10.6 Phase 7.6"` returns ≥1. The four baselines unchanged.
- **Why:** the ROADMAP must reflect the new Phase 7.6 before any other task references it.

**7.6.2 — README.md reconciliation**
- **Files:** `README.md`
- **Action:** Update §1 decisions count from 88 to 104. Update §4 numbers (254 unit tests, current phase = 7.6). Update §5 pointer to PROGRESS §7. Remove the "Phase 1 closed; Phase 2 pending" line.
- **Acceptance:** `Select-String -Path README.md -Pattern "88"` returns 0. `Select-String -Path README.md -Pattern "104"` returns ≥1. `Select-String -Path README.md -Pattern "Phase 7.6"` returns ≥1. Four baselines unchanged.
- **Why:** a new chat reads README first; it must not be misled.

**7.6.3 — DECISIONS.md new records**
- **Files:** `docs/DECISIONS.md`
- **Action:** Add D-19.1 (Vanilla-JS Polling for guest tracking + join banner) and D-19.2 (Server-side cookie injection for join approval). Each follows the six-part template. Update the Appendix total from 102 to 104.
- **Acceptance:** `Select-String -Path docs/DECISIONS.md -Pattern "D-19.1"` returns ≥1. Same for D-19.2. Appendix total reads 104. Four baselines unchanged.
- **Why:** the last three sessions spent three attempts on React polling. A new chat must not "fix" it back to React.

**7.6.5 — SYSTEM.md API surface reconciliation**
- **Files:** `docs/SYSTEM.md`
- **Action:** In §12.2, remove `GET /api/guest/menu` (phantom), add `GET /api/guest/menu/states` (real), add `GET /api/guest/requests` (real, missing). In §14.2, clarify `/requests` polls `/api/guest/requests`.
- **Acceptance:** `Select-String -Path docs/SYSTEM.md -Pattern "GET /api/guest/menu$"` returns 0. `Select-String -Path docs/SYSTEM.md -Pattern "GET /api/guest/requests"` returns ≥1.
- **Why:** the audit found the phantom route and the missing routes.

**7.6.6 — PHASE_TESTS.md note**
- **Files:** `docs/PHASE_TESTS.md`
- **Action:** Add a note under §9 (Phase 7) that Phase 7.5 closed via convergence. Cite ENTRY-0219.
- **Acceptance:** `Select-String -Path docs/PHASE_TESTS.md -Pattern "Phase 7.5"` returns ≥1.
- **Why:** PHASE_TESTS.md says "eleven phases." Phase 7.5 was the twelfth.

**7.6.7 — DESIGN.md additions**
- **Files:** `docs/DESIGN.md`
- **Action:** Add §4.11.2 kitchen tab bar (All | Preparing | Ready). Add §4.11.3 "Remove from Kitchen" action. Add §4.6.17.19 JoinRequestBanner (fixed top-center, z-50, Approve/Decline). Clarify §4.9.5 that /requests uses vanilla-JS polling.
- **Acceptance:** `Select-String -Path docs/DESIGN.md -Pattern "JoinRequestBanner"` returns ≥1. `Select-String -Path docs/DESIGN.md -Pattern "Remove from Kitchen"` returns ≥1.
- **Why:** the design spec is the visual contract. The additions must be documented.

**7.6.8 — escapeHtml hardening**
- **Files:** `src/components/guest/requests-client.tsx`, `src/components/guest/join-request-script.tsx`
- **Action:** Add an `escapeHtml(str)` function to each file. Apply it to `req.name` in the join banner. Apply it to `serviceType` in the requests HTML. Add a comment in both: "Phase 9 must apply escapeHtml to every details field."
- **Acceptance:** `Select-String -Path src/components/guest/join-request-script.tsx -Pattern "escapeHtml"` returns ≥2. Same for requests-client. Manual mobile test: banner still works. `/requests` still updates. Four baselines pass.
- **Why:** Phase 9 introduces free-text service notes. The XSS surface must be safe before Phase 9.

**7.6.9 — listForGuestSession! fix**
- **Files:** `src/domain/requests/request.repository.ts` (remove `?`), `app/(guest)/requests/page.tsx` (remove `!`)
- **Action:** Make `listForGuestSession` a required method on the port. Remove the non-null assertion in the page.
- **Acceptance:** `Select-String -Path 'app/(guest)/requests/page.tsx' -Pattern "listForGuestSession!"` returns 0. `Select-String -Path 'src/domain/requests/request.repository.ts' -Pattern "listForGuestSession\?"` returns 0. Four baselines pass.
- **Why:** BUILD.md §2.6 forbids non-null assertions.

**7.6.10 — WIRING.md final sweep**
- **Files:** `docs/WIRING.md`
- **Action:** Verify §2 contains only genuinely open items. Verify no entry appears in both §2 and §3 (the audit found W-0001 duplicated). Verify no §2 entry has a DISCHARGED status. Ensure the four `_logout-button.tsx` entries (W-0002, W-0003, W-0004) stay OPEN (D-9.7 discharge is Phase 8).
- **Acceptance:** `Select-String -Path docs/WIRING.md -Pattern "W-0001"` returns exactly one entry in §3. `Select-String -Path docs/WIRING.md -Pattern "W-0002"` returns one entry in §2. No entry in §2 has "Status: DISCHARGED". Four baselines unchanged.
- **Why:** the pasted WIRING.md showed W-0001 duplicated in §3.

**7.6.11 — Full foundation verification**
- **Files:** (none)
- **Action:** Run the four baselines fresh. Run manual walkthroughs: Table order → kitchen → staff → close table. Room service request → staff queue → guest /requests live. Join banner appears on /menu and /services. Kitchen tablet filter works. Record every observation.
- **Acceptance:** tsc 0, unit 254/254, integration 233/233, build 39 routes. Manual walkthroughs pass. `git status --porcelain` empty.
- **Why:** the phase's acceptance criterion is not "docs updated" — it is "foundation verified clean."

---

## 11. Phase 7.7 — Production Readiness Prerequisites (NEW)

**Goal:** Close the five gaps that must be closed **before** Phase 8's manager panel adds thirty new admin routes. Every item in this phase is a production release blocker per BUILD.md §7.4, and every item is small (one session each). After Phase 7.7 closes, the foundation is not just "verified working" — it is verified, audited, hardened, and safe to expose to a real venue.

**Status:** This phase is inserted between the closed Phase 7.6 and the next phase (Phase 8 — The Manager Panel).

**Dependency:** Phase 7.6 is ✅ Complete (commit `145d479`).

**Why this phase exists, in one paragraph:** During Phase 7.6, three AI failure modes (broken template literals, port changes without `tsc`, guest screens with raw JS) were caught by the manual-verification discipline. Those were foundation bugs. They were caught. But three **production-readiness** gaps were not caught because they were never in scope: (a) there is no request-level audit trail — only per-state-change; (b) there is no CSRF protection on state-changing routes; (c) there is no rate limiting on the login endpoint. Building the manager panel without these is building thirty new doors on a foundation without locks, cameras, or a logbook. This phase installs the locks, cameras, and logbook first.

**Acceptance for Phase 7.7:** The audit log is written to disk as a ZIP that can be downloaded and opened in a text editor. The production database connection requires SSL. Backups run daily and are restorable. CSRF is enforced on every state-changing route. Rate limiting is enforced on the login endpoint. The four baselines pass at every step. All five tasks are ✅ Complete on `origin/main`.

### Milestone 7.7.1 — Structured request-level audit log with ZIP download

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 7.7.1 | Add a structured request-level audit log with a **downloadable ZIP** of the log files | ✅ | 7.6.11 |
| 7.7.1a | Add the `withAudit` route wrapper | ✅ | 7.7.1 |
| 7.7.1b | Add the ZIP download endpoint at `GET /api/admin/audit/export` (admin-only, role-gated) | ✅ | 7.7.1a |
| 7.7.1c | Apply `withAudit` to the gold-standard route (`POST /api/admin/qr/generate`) as proof; document the migration pattern for Phase 8 | ✅ | 7.7.1b |
| 7.7.1d | Verify: a route call produces a log line; the ZIP download returns a valid ZIP with today's log file | ✅ | 7.7.1c |

**Details:**
- The log is a structured JSON-lines file written to `logs/audit/YYYY-MM-DD.jsonl`. Each line is one request:
{ "timestamp": "ISO8601", "actorType": "guest" | "staff" | "anonymous", "actorId": "uuid|null", "actorRole": "string|null", "venueId": "uuid", "route": "/api/...", "method": "GET", "status": 200, "latencyMs": 12, "ip": "string" }

text
- The ZIP endpoint packs every JSON-lines file from `logs/audit/` into a single `.zip` on the fly and streams it to the admin. It uses the `archiver` npm package or Node's built-in `zlib` + a minimal ZIP writer (whichever the developer prefers). It is admin-only (MANAGER or OWNER role). It logs the download itself (an admin downloading the audit log is an auditable event).
- The ZIP opens in Notepad, Notepad++, VS Code, or any text editor because `.jsonl` is plain text.
- The migration pattern: `withAudit` is a higher-order function that wraps a route handler. Every Phase 8 admin route will use it. Task 7.7.1c demonstrates the pattern on the QR generate route, and the pattern is documented in `docs/BUILD.md` §6 so that every Phase 8 route author knows to use it.

### Milestone 7.7.2 — Database security hardening

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 7.7.2 | Add `sslmode=require` to the production connection string; document a dedicated `venue_prod` database user with minimum permissions; tune the `pg.Pool` limit to the venue's staff count | ✅ | 7.7.1 |

**Details:**
- `prisma.config.ts` reads `DATABASE_URL` from env. Add a startup check: if `NODE_ENV === "production"` and the URL does not contain `sslmode=require`, the app refuses to boot with a clear message.
- `.env.production.example` (new file) documents the production `DATABASE_URL` format and the recommended `venue_prod` database role (SELECT, INSERT, UPDATE on the venue's tables; no DROP).
- `src/infrastructure/db/client.ts`: the `pg.Pool` connection limit is configurable via `DB_POOL_MAX` (default 20 for dev, recommended 20 for production matching the venue's staff count per D-15.4).
- `docs/SYSTEM.md` §15.4 gets a new subsection documenting the production database user and SSL requirement.

### Milestone 7.7.3 — Automated daily backups

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 7.7.3 | Add a `pg_dump`-based daily backup script; document the retention policy (30 days, D-8.5); add a restore-test procedure | ✅ | 7.7.2 |

**Details:**
- `scripts/backup-daily.ps1` (PowerShell, Windows-hosted venues) and `scripts/backup-daily.sh` (bash, Linux-hosted venues) — both wrap `pg_dump` and gzip the output to `backups/YYYY-MM-DD.sql.gz`. They are scheduled via the OS's scheduler (Task Scheduler on Windows, cron on Linux). The scheduling command is documented in `docs/DEPLOYMENT.md` (which will be created in Phase 10.7; for Phase 7.7, the script and its README are the deliverable).
- Retention: the script deletes `.sql.gz` files older than 30 days.
- Restore test: `scripts/restore-backup.ps1` / `.sh` takes a backup file and restores it to a test database. The restoration is verified once per quarter (documented as a manual check in `docs/DEPLOYMENT.md`).
- The backup directory is **outside the database** (a separate disk or a network share, per D-8.5).

### Milestone 7.7.4 — CSRF protection on state-changing routes

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 7.7.4 | Add CSRF protection to every state-changing route (POST, PATCH, DELETE) | ✅ | 7.7.3 |
| 7.7.4a | Add the CSRF token generation and validation helper | ✅ | 7.7.4 |
| 7.7.4b | Apply CSRF to the guest order route (`POST /api/guest/orders`) as proof | ✅ | 7.7.4a |
| 7.7.4c | Apply CSRF to the staff order routes and the guest request routes | ✅ | 7.7.4b |
| 7.7.4d | Verify: a request without a valid CSRF token returns 403 | ✅ (Parts A, B, and 7.7.4c.D client/cookie wiring verified) | 7.7.4c |

**Details:**
- The pattern is **double-submit cookie**: the server sets a `csrf_token` cookie (not HttpOnly) on the first visit; every state-changing form must send the same token in a `X-CSRF-Token` header or a hidden form field; the server compares the two. This is the pattern Next.js documents as its recommended CSRF defense for stateless APIs.
- Applied first to `POST /api/guest/orders` (the highest-value target — a forged order costs the venue real food), then to staff routes, then to guest request routes.
- Every Phase 8 admin route uses the same helper. The manager panel's forms will include the hidden CSRF token by default because the helper is applied at the route layer.
- The CSRF token is rotated on each session; the cookie is `SameSite=Lax`; the token's lifetime matches the session's lifetime.

### Milestone 7.7.5 — Login rate limiting

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 7.7.5 | Add rate limiting to `/api/auth/login` | ✅ | 7.7.4d |
| 7.7.5a | Add an in-memory rate limiter (per-IP, 5 attempts per 15 minutes, exponential backoff) | ✅ | 7.7.5 |
| 7.7.5b | Verify: 6 failed logins from the same IP within 15 minutes returns 429 on the 6th | ✅ | 7.7.5a |

*(Phase 7.7.5 closed at `a09d832`. The 7.7.5b verification required three follow-up FIX commits — `c9654af` (server-computed landingRoute, hard-navigate on success, set `venue_staff` on `NextResponse`), `a09d832` (granular request-API auth, role-aware tabs, focused seed staff `frank`/`grace`), and the earlier `b65a2d8` (the rate-limit route integration and 429 UX). The browser gate: `frank`→Room Orders/Room Map/Requests, `diana`→Room Map/Requests, `grace`→Table Orders/Table Map, `eve`→Room Orders/Room Map/Requests, `charlie`→all five tabs, `alice`→`/admin`, `bob`→`/kitchen`. All seven confirmed. Follow-up: W-0025 (populate the audit IP) and W-0026 (audit log rotation) opened at the 7.7.5 closure as Phase 8 foundation obligations. See WIRING.md §2.)*

**Details:**
- For the first version (one venue per installation, D-10.1), an in-memory limiter is sufficient. It is reset on process restart, which is acceptable for a single-venue deployment.
- The limiter is applied only to `/api/auth/login`. Guest routes are anonymous and limited by CSRF, not rate limiting. Admin routes are behind login and therefore behind the limiter.
- The response is `{ "error": { "code": "RATE_LIMITED", "message": "Too many login attempts. Try again in 15 minutes." } }` with HTTP 429.
- If Phase 8 grows large enough that a distributed rate limiter is needed, W-0023 tracks the migration to Redis (deferred).

---

## 12. Phase 8 — The Manager Panel

**Goal:** The manager can see everything, manage the venue's data, and export reports. All screens use staff-world tokens only (D-9.6). No branding tab. No SLA configuration.

**Status:** ⬜ Not started. Blocked until Phase 7.7 closes.

**Dependency:** Phase 7.7 is ✅ Complete.

**Note on Phase 8 dependency:** The original sequence had 8.1.1 (dashboard) as the first task. This was wrong — the admin shell must exist before the dashboard can render inside it. The resequenced 8.1 fixes this.

**Foundation inheritance (Phase 8 onward):** Every Phase 8 route, without exception, is built on the foundation closed in Phase 7.7:
- **`withAudit` is mandatory** (W-0021). Every route under `app/api/admin/` uses `withAudit(resolvers, meta, handler)`. A route that omits it is `FAIL`. `qr/generate` is the reference (BUILD.md §6.11).
- **CSRF is enforced** on every state-changing route (already live for the 25-route inventory, D-20.1). New admin routes use `withCsrf(handler)` on the inner handler.
- **IP is populated in every audit line** (W-0025). The `withAudit` wrapper derives `ip` from `x-forwarded-for` (first segment) → `x-real-ip` → `"unknown"`, matching the login rate limiter's derivation. A line with `ip: null` is a FAIL from Phase 8 onward.
- **Log rotation is scheduled** (W-0026, Phase 10.7). The `logs/audit/` directory is pruned at 30 days, matching the backup retention (D-8.5). No line grows unbounded.

These obligations are not Phase 8 deliverables — they are Phase 8 **preconditions**. Every task's acceptance criteria includes "the route uses `withAudit`" and "the audit line carries a real IP."

*(The Milestone 8.1 through 8.7 task tables are unchanged from the prior version of this file. Each Phase 8 route will use `withAudit` (from 7.7.1) and CSRF validation (from 7.7.4). Each admin form will include the hidden CSRF token. Each API route will be rate-limited indirectly (the admin is logged in; the login is rate-limited).)*

## 12. Phase 8 — The Manager Panel

**Goal:** The manager can see everything, manage the venue's data, and export reports. All screens use staff-world tokens only (D-9.6). No branding tab. No SLA configuration.

**Status:** 🟨 In progress. Milestones 8.1, 8.2, 8.3, 8.4, and 8.4.8 are ✅ closed. Milestone 8.5 (Tables Management) is next.

**Dependency:** Phase 7.7 is ✅ Complete. The first task of Phase 8 — 8.1.1 — depends on **7.7.6** (which sets `Table.state` / `Room.state` to OCCUPIED on QR scan, so the Admin panel's state column matches the staff page's session-derived view).

**Foundation inheritance (Phase 8 onward):** Every Phase 8 route, without exception, is built on the foundation closed in Phase 7.7:
- **`withAudit` is mandatory** (W-0021). Every route under `app/api/admin/` uses `withAudit(resolvers, meta, handler)`. A route that omits it is `FAIL`. `qr/generate` is the reference (BUILD.md §6.11).
- **CSRF is enforced** on every state-changing route (already live for the 25-route inventory, D-20.1). New admin POST/PATCH/DELETE routes use `withCsrf(handler)` on the inner handler. GET routes are exempt.
- **Role enforcement at the route** (Benchmark 4): `canAccess(staff.roles, "admin")` at the top of the handler. `LEADER` is 403 (D-18.2). The audit `resolveStaff()` call is separate from the handler's own `validateSession()` — the double-read is deliberate (BUILD.md §6.11).
- **Venue scoping** (Benchmark 5): every read and write filters by `venueId`, resolved from the session (never from the client). Cross-venue reads return `NOT_FOUND` (SYSTEM.md §15.4, D-10.2).
- **IP is populated in every audit line** (W-0025). The `withAudit` wrapper derives `ip` from `x-forwarded-for` (first segment) → `x-real-ip` → `"unknown"`. The rate limiter's IP derivation is the reference. A line with `ip: null` (other than a localhost direct request with neither header) is a `FAIL`.
- **Log rotation is scheduled** (W-0026, Phase 10.7.6). The `logs/audit/` directory is pruned at 30 days, matching the backup retention (D-8.5).
- **`setTestDbClient` on every DB-touching route** (D-3.13, Benchmark 8). Integration tests inject the transaction client; no test writes to the dev database.
- **Money is a decimal string on the wire** (BUILD.md §7.1, Benchmark 6). Every `subtotal`, `taxRate`, `taxAmount`, `total`, item price, modifier price. The client never computes.
- **Every domain function returns `Result<T>`** (SYSTEM.md §5, Benchmark 7). No throws for expected failures.
- **No `any`, no `@ts-ignore`, no `!`** (BUILD.md §2, Benchmark 9).

These are Phase 8 **preconditions**, not deliverables. Every task's acceptance criteria includes "the route uses `withAudit`" and "the audit line carries a real IP."

### Milestone 8.1 — Dashboard

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **7.7.6** | **The QR scan route sets the place state to OCCUPIED** (table/room). Discharges the state-consistency gap; a precondition for 8.4's Rooms / Tables screens and for the dashboard's revenueToday metric to be trustworthy. One file (`app/(guest)/qr/[token]/route.ts`) + two integration tests. | ✅  | 7.7.5 |
| **8.0.1** | **Build `src/infrastructure/config/venue.ts` with `getVenueSlug()` and `getVenueId()`.** Discharges **W-0027**. Rewire `qr/generate` and `audit/export` to use `getVenueSlug()` instead of `process.env["VENUE_SLUG"] ?? "juniper-house"`. Two unit tests, two route edits. This is the last pre-dashboard hygiene. |  🟨  | 7.7.6 |
| **8.1.1** | **Add `GET /api/admin/dashboard` route** with `withAudit`. The route reads six metrics: `ordersWaiting`, `inKitchen`, `ready`, `revenueToday`, `ordersToday`, `requestsOpen`. Two new repository methods (`listForVenueOnDate`, `listOpenForVenue`) with integration tests. Four route tests (auth 401, role 403 for LEADER, 200 with empty data, 200 with populated data). Uses `getVenueSlug()`. Discharges nothing at this task (W-0025 was already populated at 7.7.1c; the audit line carries a real IP). | ✅  | 8.0.1 |
| **8.1.2** | **Add the admin shell layout** (`app/admin/layout.tsx`): sidebar with the ten navigation items (Dashboard, Active Orders, Completed Orders, Menu, Tables, Rooms, QR Codes, Staff, Reports, Settings, Audit Log), 56px header bar with the venue name + operator name + theme toggle + sign-out. **Retires D-9.7** per-page sign-out buttons. Discharges **W-0002** (the `app/admin/qr/_logout-button.tsx` file is deleted; its call sites import from the shell). | ✅  | 8.1.1 |
| **8.1.3** | **Add the dashboard page** (`app/admin/dashboard/page.tsx`): six metric tiles (per DESIGN.md §4.10.5), the recent-orders list (five rows from `OrderQueueRow`), the recent-requests list (five rows from `RequestQueueRow`), and the menu-item status section (the toggle-per-item from DESIGN.md §4.10.2). Server-rendered first paint; client-side polling fills the tiles. | ✅  | 8.1.2 |
| **8.1.4** | **Add 5s polling on the dashboard** — vanilla-JS `innerHTML` replacement (D-19.1), the same discipline as `/requests` and `/order/[id]/track`. Polls `GET /api/admin/dashboard`; updates each tile's number in place; updates the recent-orders list; updates the recent-requests list. No React `useState`. | ✅  | 8.1.3 |
| **8.1.5** | **Verify: the metrics update as orders move.** Place a live order from a phone (`/dev/qr` → menu → place). Watch `ordersWaiting` increment within 5 seconds. Approve from the staff page; watch `ordersWaiting` drop and `inKitchen` rise. Manual desktop at 1440×900. The milestone's acceptance test. | ✅  | 8.1.4 |

*(8.1.3 was split into 8.1.3.A (shared map cells; /staff rewire) and 8.1.3.B (dashboard page). Both closed. 8.1.4 was followed by 8.1.4.FIX (occupancy from Table.state, <script async>) and 8.1.4.FIX.2 (delete the unauthorized Client Component, restore the Server Component script). The sub-fixes are not separate ROADMAP tasks; they are the 8.1.4 row's content. 8.0.1 is partial: getVenueSlug() is live and W-0027 is discharged at 4d2a45e; getVenueId() is not implemented and is a follow-up. 8.1.5.FIX.3 (`09a22cb`) corrects the `6c5c968` claim that `hasOrderAccess` was updated — the code was not; 8.1.5.FIX.3 makes it true and proves it with the three tests.)*

*(8.0.0 was a pre-Phase-8 hygiene series: `8.0.0.1` — `getVenueSlug` pre-read; `8.0.0.2` — `getVenueSlug` implementation; `8.0.0.3` — `getVenueSlug` callers; `8.0.0.4` — audit logger test baseline; `8.0.0.5` — audit test isolation; `8.0.0.6` — `pg@8.x` deprecation check; `8.0.0.7` — `admin-menu.test.ts` stub. The pre-Phase-8 hygiene closed at `620ebc3`; that series is now folded into 7.7.6 + 8.0.1 + the `pg@9` W-0008 obligation.)*

*(7.7.6 is inserted before 8.0.1 because the state consistency is a prerequisite for the Admin panel's state columns and the dashboard's `revenueToday` metric, which sums completed orders whose place-state was set correctly at scan time. Without 7.7.6, the dashboard's revenueToday is correct but the Rooms / Tables screens' "Occupied / Vacant" labels are wrong; and any future report that joins on `Room.state` would be wrong. The fix is small; the fix is the precondition.)*

### Milestone 8.2 — Order Management

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.2.1** | **Add `GET /api/admin/orders`** with filters (`state`, `dateFrom`, `dateTo`). Wraps `withAudit`. Returns `{ data: Order[] }` with money as decimal strings. Four route tests (401, 403 for LEADER, 200 empty, 200 populated with filter). | ✅ | 8.1.5 |
| **8.2.2** | **Add the Active Orders tab** (`app/admin/orders/active/page.tsx`): a full-width table from `OrderQueueRow`, columns Order ID / Place / Items summary / Status / Elapsed / Action. Clicking a row opens a right-side detail panel with the full order (items, states, history, notes). The right-panel slides in over 200ms (DESIGN.md §4.10.14). | ✅ | 8.2.1 |
| **8.2.3** | **Add the Completed Orders tab** (`app/admin/orders/completed/page.tsx`) with a date-range filter (Today / Yesterday / This Week / This Month / Custom, up to 6 months per D-12.1). Same table, read-only detail panel. | ✅ | 8.2.1 |
| **8.2.4** | **Add `GET /api/admin/orders/export`** (CSV). The CSV's columns match the visible table; money cells are quoted strings (`"10.99"`, `"0.00"`); the export respects the same filters as 8.2.1. Wraps `withAudit`. One route test (200; the CSV opens in a spreadsheet). | ✅ | 8.2.3 |
| **8.2.5** | **Verify:** filter by a 6-month range, export the CSV, open it in Excel / Google Sheets. The filtered row count matches the table's; the daily totals (summed) match the DB. Manual desktop at 1440×900. The milestone's acceptance test. | ✅ | 8.2.4 |

### Milestone 8.3 — Menu Management (with the photo pipeline)

**Goal:** The operator manages the menu — categories, items, modifiers, prices, states, and photos — from the admin panel. The guest menu renders the item's photo, name, description, and price. The photo pipeline is shared with Milestone 8.4 (Services Management): one upload route, one `sharp` dependency, one `public/uploads/catalog/` directory.

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.3.0** | **The media upload route + the `sharp` dependency + D-22.1.** `POST /api/admin/media/upload` (multipart; max 5MB; MIME image/jpeg, image/png, image/webp; `withAudit` + `withCsrf`; `sharp` → 800px WebP (quality 80) → `public/uploads/catalog/{uuid}.webp`; 16px blurDataURL; returns `{ photoUrl, photoBlurData }`). `public/uploads/` is `.gitignore`d. Four route tests (401, 403 LEADER, 400 invalid MIME, 200 with a valid image). | ✅ 4d6a757 | 8.2.5 |
| **8.3.1** | **The menu list screen** (`app/admin/(shell)/menu/page.tsx`): full-width table grouped by category; columns Name / Category / Price / Photo / State / Actions (Edit, Toggle availability, Hide). **Fills `tests/integration/api/admin-menu.test.ts`** (F-0004). The list renders the `photoUrl` thumbnail. | ✅ c17936f | 8.3.0 |
| **8.3.2** | **`POST /api/admin/menu/items`** (`withAudit` + `withCsrf`). Body: name, description, photoUrl (optional), photoBlurData (optional), price (decimal string), categoryId, state. Returns `{ data: MenuItem }`. Four route tests (401, 403 LEADER, 400 missing fields, 201). | ✅ 3aa9817 | 8.3.1 |
| **8.3.2a** | **The admin "Add/Edit Item" form's photo box.** A drag-and-drop photo box in the right panel (DESIGN.md §4.10.8). On drop: `fetch('/api/admin/media/upload', { method: 'POST', body: FormData })` → preview the returned `photoUrl` + attach the `photoBlurData` to the POST/PATCH payload. The box is a Client Component (`useState` for the preview; no `router.refresh`). | ✅ 0efe50a | 8.3.2 |
| **8.3.3** | **`PATCH /api/admin/menu/items/[id]`** (`withAudit` + `withCsrf`; uses `withAuditedDynamicRoute<TParams>` (introduced at 8.3.0.F per D-24.1)). Body: the partial item shape. Returns `{ data: MenuItem }`. Four route tests. | ✅ 4b80d4d | 8.3.2a |
| **8.3.3.FIX** | **Pin the Edit sheet's Save button.** Moves the Cancel / Save changes footer out of the scrollable SheetBody and into the SheetContent's bottom, so it is always visible. Adds id="edit-item-form" to the form and form="edit-item-form" to the button. | ✅ | 8.3.3 |
| **8.3.4** | **The HIDDEN state toggle** (discharges **W-0005**). The 3-state `AVAILABLE ↔ UNAVAILABLE ↔ HIDDEN` via `POST /api/admin/menu/items/[id]/state` (the existing route; the admin form gains the third state). Three route tests. | ✅ | 8.3.3 |
| **8.3.4.FIX** | **Wire the Admin Menu Item Actions.** Replaces disabled placeholder buttons with `MenuRowActions` (Toggle between AVAILABLE/UNAVAILABLE and Hide) and `AddItemButton` (prompt for name/price, POST to `/api/admin/menu/items`, `router.refresh()`). | ✅ | 8.3.4 |
| **8.3.5.DOCS** | **Docs alignment for D-25.1 (multi-category) and D-25.2 (collections).** Updates DECISIONS.md (§23 TOC, D-25.1, D-25.2), SYSTEM.md, PRODUCT.md, DESIGN.md, ROADMAP.md, WIRING.md (W-0028, W-0029, W-0030), and PHASE_TESTS.md. Docs-only. | ✅ | 8.3.4 |
| **8.3.5b.A** | **The multi-category item foundation (D-25.1).** The `MenuItemCategory` join table (migration `20261116151735_add_menu_item_categories`); `MenuItem.categoryId` removed; the domain `MenuItem.categoryIds` / `MenuItemView.categoryIds` / `CreateItemInput.categoryIds` / `UpdateItemInput.categoryIds?`; the adapter's join read/write in a transaction; the seed's 6 categories / 12 items / 20 join rows. The 2 integration tests (`menu-multi-category.test.ts`). **Discharges W-0028.** | ✅ cb33758 | 8.3.5.DOCS |
| **8.3.5b.B** | **The multi-category Edit form + the `categoryIds` routes.** `_edit-form.tsx` uses the native `<select multiple>` (the `initialCategoryIds` prop, the at-least-one check, the sorted-array diff, the `payload.categoryIds`); `_edit-sheet.tsx` gains `initialCategoryIds`; the `page.tsx` computes the unique item count (`new Set(categories.flatMap(...)).size` — 12, not 20). `POST /api/admin/menu/items` and `PATCH /api/admin/menu/items/[id]` accept `categoryIds` (the array; the at-least-one; the per-venue check iterates; the response carries the full array; the scalar `categoryId` removed). The route tests updated. **Discharges W-0030.** | ✅ 1070693 | 8.3.5b.A |
| **8.3.5.F** | **Correct the stale `categoryId` JSDoc in the items routes.** The 8.3.5b.B's message says "the scalar `categoryId` removed"; the handlers use `categoryIds`, but 4 JSDoc lines in `app/api/admin/menu/items/route.ts` (lines 5, 14, 15) and `app/api/admin/menu/items/[id]/route.ts` (lines 5, 11) still describe a scalar. Rewrite the four references to `categoryIds`. No code change. | ✅ 8606e96 | 8.3.5b.B |
| **8.3.5** | **The category CRUD** (`GET` / `POST` / `PATCH` / `DELETE` at `/api/admin/menu/categories`). All `withAudit` + `withCsrf`. Join-aware `deleteCategory` (checks `MenuItemCategory`; returns 409 Conflict if items are associated, 204 if empty). Four route tests. | ✅ | 8.3.5b.B |
| **8.3.5a.R** | **Render the AVAILABLE badge in green (DESIGN.md §4.2.3).** The menu-item row's AVAILABLE badge currently renders "active" (amber); DESIGN.md §4.2.3 maps "Ready / Available" to --color-status-ready (green #3d7a4a). One line in stateToBadge: "active" -> "ready". The Badge primitive already supports the "ready" variant; the CSS tokens exist. One file, one line. | ✅ | 8.3.5 |
| **8.3.5a** | **The "Manage categories" / "Add category" UI.** Admin category management interface (`app/admin/(shell)/menu/_categories-sheet.tsx`): list, create, rename, reorder, delete. Integrates with the menu page header. | ✅ | 8.3.5a.R |
| **8.3.5.D** | **The Admin UI for Create, Edit, and Delete Item.** Replaces prompt with Add Item Sheet (`_add-item-sheet.tsx`), adds Delete action to Edit Sheet, fixes category multi-select pre-selection, and updates row action labels (Mark Unavailable/Available, Hide). | ✅ | 8.3.5a |
| **8.3.5c** | **The collections CRUD + UI (D-25.2).** Schema migration for `MenuCollection` and `MenuCollectionItem`. API routes `/api/admin/menu/collections`, `[id]`, and `[id]/items` (`withAudit` + `withCsrf`). Admin "Manage collections" interface. Route and integration tests. | ✅ | 8.3.5a |
| **8.3.5c.A** | **The menu collections foundation (D-25.2).** Schema migration for `MenuCollection` and `MenuCollectionItem` (`20261116182500_add_menu_collections`); the domain types `MenuCollection`, `MenuCollectionItem`, `MenuCollectionView`; `MenuRepository` port methods (`listCollections`, `createCollection`, `updateCollection`, `deleteCollection`, `addItemToCollection`, `removeItemFromCollection`); the Prisma adapter; the seed with 2 collections and 4 items. The 3 integration tests (`menu-collections.test.ts`). | ✅ af9a0d5 | 8.3.5c |
| **8.3.5c.B** | **The menu collections routes + the 4 integration tests.** API routes `GET` / `POST` at `/api/admin/menu/collections`, `PATCH` / `DELETE` at `/api/admin/menu/collections/[id]`, and `POST` / `DELETE` at `/api/admin/menu/collections/[id]/items` (`withAudit` + `withCsrf`). Four route integration tests (`admin-menu-collections.test.ts`). CSRF suite extended to 35 routes. | ✅ | 8.3.5c.A |
| **8.3.5c.C** | **The "Manage collections" / "Add collection" UI.** Admin collections management interface: list, create, edit date range, add/remove items, delete. Integrates with the menu page header. | ✅ | 8.3.5c.B |
| **8.3.6** | **The modifier CRUD** (`POST` / `PATCH` / `DELETE` at `/api/admin/menu/modifiers` and `/api/admin/menu/modifiers/[id]`). All `withAudit` + `withCsrf`. Four route tests. | ✅ | 8.3.5c |
| **8.3.6.A** | **The modifier CRUD foundation (port + adapter).** Adds UpdateModifierGroupInput, UpdateModifierOptionInput, and the four port methods (updateModifierGroup, deleteModifierGroup, updateModifierOption, deleteModifierOption); the Prisma adapter implements them with the venue scope through the nested relation (the group's menuItem's venueId; the option's group's menuItem's venueId). No routes, no UI. | ✅ | 8.3.6 |
| **8.3.6.B** | **The modifier routes + tests.** Adds POST/PATCH/DELETE at /api/admin/menu/modifiers and /api/admin/menu/modifiers/[id]; the 4 integration tests; the CSRF inventory 35 -> 39. | ✅ | 8.3.6.A |
| **8.3.6.C** | **The item edit form's modifier section.** The "Manage modifiers" UI inside the item edit sheet: list the item's modifier groups, add/edit/delete a group, add/edit/delete an option. | ✅ | 8.3.6.B |
| **8.3.7** | **Verify:** add an item (with a photo and multi-categories), edit it, hide it (HIDDEN), verify the guest menu sees the item, the photo, and the state within 5s. Manual desktop + mobile. The milestone's acceptance test. | ✅ | 8.3.6 |
| **8.3.7a** | **The guest menu's photo rendering and Special Events strip (D-23.1, D-25.2).** The `MenuItemCard` uses `next/image` with `photoUrl` and `photoBlurData`. The guest menu renders active collections as a "Special events" / "Featured" strip above categories. Discharges **W-0029**. `next.config.mjs` cache headers. | ✅ | 8.3.7 |
| **8.3.7a.A** | **The photo pipeline + collections strip.** `next.config.mjs` immutable cache headers; `MenuItemCard` uses `next/image` with blur placeholder; `SpecialEventsStrip` renders active collections above categories; discharges W-0029. | ✅ | 8.3.7 |
| **8.3.7a.B** | **Hard delete & photo lifecycle cleanup.** Adds `deleteItem` to MenuRepository port and Prisma adapter; `deleteUploadedPhoto` unlinks obsolete WebP images on photo replacement and item deletion; `DELETE /api/admin/menu/items/[id]` with full audit, CSRF, and cascade. | ✅ | 8.3.7a.A |
| **8.3.8** | **Menu UI Polish: inline Save/Cancel, item sortOrder, and guest polling reload.** Adds explicit Save/Cancel controls for categories and collections; adds sortOrder number input to item edit form; detects added/deleted items in guest menu polling and reloads page. | ✅ | 8.3.7a.B |

---

### Milestone 8.4 — Services Management

**Goal:** The operator manages the venue's service catalog — categories, services, photos, prices, estimated durations, and states — from the admin panel. The guest services page renders each service's photo, name, description, price (or "Free"), and estimated duration. The nine fixed hotel services are seeded as `ServiceItem` rows (the `ServiceConfig` model is deprecated per D-21.1); the operator can add custom services beyond the nine.

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.4.1** | **The `ServiceCategory` / `ServiceItem` schema + the migration + D-21.1.** The `ServiceCategory` (`id`, `name`, `sortOrder`); the `ServiceItem` (`id`, `name`, `description`, `photoUrl`, `photoBlurData`, `price` Decimal(10,2), `estimatedMinutes` Int?, `state` MenuItemState, `categoryId`, `category`, `updatedAt`, `createdAt`). The `ServiceConfig` is deprecated — the seed migrates the nine `services` array entries into nine `ServiceItem` rows in a seeded "Hotel Services" category. The migration. | ✅ | 8.3.8 |
| **8.4.2** | **The services list screen** (`app/admin/services/page.tsx`): grouped by service category; columns Photo / Name / Category / Price / Estimated Minutes / State / Actions (Edit, Toggle availability, Hide). Mirrors the 8.3.1 menu list. | ✅ | 8.4.1 |
| **8.4.3** | **`POST /api/admin/services/items`** (`withAudit` + `withCsrf`). Body: name, description, photoUrl, photoBlurData, price (decimal string), estimatedMinutes (optional int), categoryId, state. Returns `{ data: ServiceItem }`. Four route tests (401, 403 LEADER, 400 missing fields, 201). | ✅ | 8.4.2 |
| **8.4.3a** | **The admin "Add/Edit Service" form's photo box.** A drag-and-drop photo box in the right panel (the same 8.3.0's upload route; the same 8.3.2a's photo-box pattern). | ✅ | 8.4.3 |
| **8.4.4** | **`PATCH /api/admin/services/items/[id]`** (`withAudit` + `withCsrf`; the `withAuditedDynamicRoute` variant per D-24.1). Body: the partial shape. Returns `{ data: ServiceItem }`. Four route tests. | ✅ | 8.4.3a |
| **8.4.5** | **The service state toggle** (`ServiceRowActions`). The 3-state `AVAILABLE ↔ UNAVAILABLE ↔ HIDDEN` via the 8.4.4 PATCH route. | ✅ | 8.4.4 |
| **8.4.6** | **The service category CRUD** (`GET` / `POST` / `PATCH` / `DELETE` at `/api/admin/services/categories`). All `withAudit` + `withCsrf`. Four route tests. | ✅ | 8.4.5 |
| **8.4.7a** | **The guest services page's photo rendering.** The `ServiceCard` (a new component or the current `Card` shape) uses `next/image` (per D-23.1) with the `photoUrl` and the `photoBlurData` placeholder. The `app/(guest)/services/page.tsx` fetches the enabled `ServiceItem` rows (the `state: AVAILABLE`) and renders the cards. The price shows as "Free" when `price === "0.00"`; otherwise the formatted money (the `formatMoney` from `src/lib/money.ts`, the venue's `NPR` currency). The `ServiceItem`'s id is submitted with the request form (the `ServiceRequest`'s `serviceType` stays the `HotelService` enum; the `ServiceItem` is the catalog row). | ✅ | 8.4.6 |
| **8.4.7b** | **The Mobile-First Dedicated Service Forms + Dynamic Pricing Integration.** Wires all guest service forms (`housekeeping`, `laundry`, `spa`, `maintenance`, `concierge`, `late-checkout`, `wake-up-call`, `do-not-disturb`) to load the live `ServiceItem` record, displays admin-managed pricing and estimated minutes in a mobile-optimized header badge, attaches `serviceItemId` to the `POST /api/guest/requests` submission payload, and links directly to `/requests` for progress tracking. | ✅ | 8.4.7a |
| **8.4.7c** | **The Generic Custom Service Detail Form (`/services/[id]`).** A responsive mobile-first detail form for any custom operator-created service beyond the 9 seeded hotel services, letting guests read the description, see pricing/duration, submit intake notes, and track progress on `/requests`. | ✅ | 8.4.7b |
| **8.4.7d** | **Service Polling & Live State Sync (`GET /api/guest/services/states`).** Implements the lightweight guest polling endpoint for services (mirroring `/api/guest/menu/states`) and client reload hook so when an admin toggles a service state (Available/Unavailable/Hidden), the guest services catalog updates within 5s. | ✅ | 8.4.7c |
| **8.4.7** | **Verify:** Full operational loop verification (Admin configures service price & availability → Guest navigates dynamic mobile catalog → Guest submits structured request → Staff receives in `/staff` area queue and advances state → Guest tracks live timeline on `/requests`). Manual desktop + mobile. The milestone's acceptance test. | ✅ | 8.4.7d |

---

### Milestone 8.4.8 — The Enhanced Guest-Staff-Admin Operational Loop

**Goal:** Bridge all operational, visual, and billing gaps across the Guest, Staff, and Admin layers. Redesign `/menu` into a responsive mobile-first experience using global guest design tokens. Wire quick-action controls: instant "Call a waiter" notifications routed accurately to Table vs Room service queues; direct "Call the front desk" dialing; a dedicated guest `/orders` history view; a consolidated billing system (accumulated food & drink for tables; food & drink + payable hotel services for rooms) with on-screen folio breakdown and staff alert; and visible "Do Not Disturb" (DND) status indicators on staff and admin room maps.

| ID | Task | Status | Depends on |
|---|---|---|---|
| **8.4.8a** | **Menu Page Mobile Experience & Luxury Redesign (`app/(guest)/menu/page.tsx`)** — Re-architect mobile menu cards (`_menu-item-card.tsx`) for mobile screens (refined aspect ratios, typography, prices, and tactile `+` quick-add controls); upgrade header quick-action bar with responsive high-contrast buttons; wire `/services` "Call the front desk" to direct native dialer (`tel:${phone}`) and informative modal. | ✅ | 8.4.7 |
| **8.4.8b** | **Guest Orders History Page (`/orders`) & Menu Linkage** — Build `app/(guest)/orders/page.tsx` and `_orders-client.tsx` (mirroring `/requests`) querying `GET /api/guest/orders` with live polling, itemized breakdown, and status steppers; add "View Orders" button to `/menu` quick-action bar for all guests. | ✅ | 8.4.8a |
| **8.4.8c** | **Instant "Call Waiter" Notification & Route Dispatch (`Table` + `Room`)** — Wire "Call a waiter" on `/menu` to `POST /api/guest/call` (`type: "WAITER"`); update area routing in `app/api/staff/requests/route.ts` and `app/staff/page.tsx` so room calls route to `room-service` & `front-desk` and table calls route to `table-service`; add instant staff alert and guest confirmation toast. | ✅ | 8.4.8b |
| **8.4.8d** | **Consolidated Billing & Folio System (Room vs Table)** — Implement `GET /api/guest/bill` computing cumulative totals (food & drink orders for tables; orders + payable services like Spa, Laundry, Late Checkout for rooms); wire "Request Bill" on `/menu` to dispatch `POST /api/guest/call` (`type: "BILL"`), alert staff, and render live on-screen itemized bill folio. | ✅ | 8.4.8c |
| **8.4.8e** | **"Do Not Disturb" (DND) Badge on Room Maps (`Staff` & `Admin`)** — Track active DND state per room from latest `DO_NOT_DISTURB` requests; update `RoomMapCell` in `src/components/staff/room-map-cell.tsx`, the client polling renderer in `app/staff/page.tsx`, and admin room overview to render a prominent "Do Not Disturb" tag. | ✅ | 8.4.8d |
| **8.4.8** | **Verify:** Multi-role end-to-end verification (Mobile guest menu browsing → Waiter call to staff → Order history tracking → Bill requesting with consolidated folio → DND room map tag sync). Production build, zero-error typecheck, unit and integration suites. | ✅ | 8.4.8e |

---

### Milestone 8.4.9 — The Unified Staff & Admin Operations Hub

**Goal:** Bridge all operational, navigation, and folio gaps across the Staff Operations screen and the Admin Management suite.
1. **Staff Notifications**: Active bill requests and waiter calls trigger instant visual banners, audible cues, pulsating tab badges, and map badges on Table/Room cells so staff can acknowledge and resolve them immediately.
2. **Admin Shell Layout & Back Navigation**: Move `/admin/orders/active` and `/admin/orders/completed` under the `(shell)` route group to inherit the 240px sidebar, header, and persistent navigation; add explicit "← Back to Dashboard" breadcrumb navigation across all admin views.
3. **Admin Active Sessions**: Re-architect `/admin/orders/active` into an Active Sessions Hub unifying all active tables and rooms, displaying their elapsed time, active food orders, and open hotel service requests in a consolidated card layout.
4. **Admin Completed Orders, Requests & Closed Folios**: Re-architect `/admin/orders/completed` into a consolidated ledger rendering completed food orders, completed service requests, and closed guest session bills (with itemized breakdown: orders subtotal + services subtotal + tax = total bill).
5. **Admin Dashboard Collections**: Upgrade `GET /api/admin/dashboard` and the admin dashboard metrics to consolidate revenue from both completed food orders AND payable hotel services, displaying clear collection breakdowns (Total Revenue, F&B, Hotel Services).

| ID | Task | Status | Depends on |
|---|---|---|---|
| **8.4.9a** | **Admin Shell Navigation & Hierarchy Alignment** — Move `orders/active` and `orders/completed` inside `app/admin/(shell)/orders/` so they inherit the persistent navigation sidebar and header; add explicit "← Back to Dashboard" navigation header breadcrumb to all admin sections (`active`, `completed`, `menu`, `services`, `tables`, `rooms`, `qr`, `staff`). | ✅ | 8.4.8 |
| **8.4.9b** | **Staff Instant Notification & Visual Dispatch for Bill / Waiter Calls** — Grant table-service staff access to call requests in `app/api/staff/requests/route.ts`; add persistent high-priority alert banner at top of staff screen when active `CALL_WAITER` or `REQUEST_BILL` requests exist with instant Acknowledge action; add pulsating badge on Requests tab and map cell callout tags on `TableMapCell` & `RoomMapCell`. | ✅ | 8.4.9a |
| **8.4.9c** | **Admin Active Sessions & Unified Operations View (`/admin/orders/active`)** — Redesign Active Orders into an Active Sessions Hub showing all active table and room sessions with elapsed time, active food orders, open service requests, running folio total, and interactive side-panel detail inspector. | ✅ | 8.4.9b |
| **8.4.9d** | **Admin Completed Orders, Requests & Closed Session Folios (`/admin/orders/completed`)** — Redesign Completed view into a consolidated ledger rendering completed food orders, completed service requests, and closed session folios with itemized billing breakdowns (F&B + Services); update CSV export to reflect the unified dataset. | ✅ | 8.4.9c |
| **8.4.9e** | **Admin Dashboard Consolidated Collections & Service Revenue** — Update `app/api/admin/dashboard/route.ts` and `app/admin/(shell)/page.tsx` to compute revenue today across both completed orders and completed payable services; display itemized collections breakdown card (Total Collections, F&B Revenue, Services Revenue). | ✅ | 8.4.9d |
| **8.4.9** | **Verify:** End-to-end verification across Staff and Admin (Staff bill/waiter alert banner → Admin active sessions view → Admin completed session folios → Dashboard collections breakdown → Admin navigation back-link). Production build, zero-error typecheck, unit and integration suites. | ✅ | 8.4.9e |

---

### Milestone 8.5 — Tables and Rooms

**Goal:** The operator manages the venue's tables and rooms — adding, editing, setting state, generating and printing QRs — from the admin panel.

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.5.1** | **`GET` / `POST` / `PATCH /api/admin/tables`**. All `withAudit` + `withCsrf`. `GET` returns the venue's tables. `POST` creates (number, state default FREE). `PATCH` updates (number, state). If the table has an active session, the state change is rejected with `CONFLICT`. Four route tests. | ⬜ | 8.4.9 |
| **8.5.2** | **`GET` / `POST` / `PATCH /api/admin/rooms`**. Same shape as 8.5.1 (state default VACANT). Four route tests. | ⬜ | 8.5.1 |
| **8.5.3** | **The Tables/Rooms screens** (`app/admin/tables/page.tsx`, `app/admin/rooms/page.tsx`): a grid of `QrCodeCard`s, each with the number, the state, the QR preview, and two actions (Print QR, Revoke QR). The "Add Table" / "Add Room" form opens in the right panel. | ⬜ | 8.5.2 |
| **8.5.4** | **The batch QR print view** (`app/admin/qr/print/batch/page.tsx`): a Server Component that fetches the venue's tables and rooms, renders their QRs in a printable grid, and offers a "Print" button. | ⬜ | 8.5.3 |
| **8.5.5** | **Verify:** add a table, generate its QR, print a sheet, scan on a phone. The scan lands on the guest menu; the table appears in the admin's Tables grid as Occupied (7.7.6's fix). Manual desktop + mobile. The milestone's acceptance test. | ⬜ | 8.5.4 |

---

### Milestone 8.6 — Staff Management

**Goal:** The operator manages the venue's staff accounts — adding, editing, assigning roles, deactivating, resetting passwords — from the admin panel. W-0003 and W-0004 discharge here (the per-page `_logout-button.tsx` files are retired when the shell's sign-out is the only one).

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.6.1** | **`GET /api/admin/staff`** (`withAudit`). Returns `{ data: StaffMember[] }`. Four route tests. | ⬜ | 8.5.5 |
| **8.6.2** | **`POST /api/admin/staff`** (`withAudit` + `withCsrf`). Body: name, username, password (hashed via `hashPassword`), roles. Returns `{ data: StaffMember }`. Four route tests. | ⬜ | 8.6.1 |
| **8.6.3** | **`PATCH /api/admin/staff/[id]`** (`withAudit` + `withCsrf`; the `withAuditedDynamicRoute` variant). Body: name, roles, state. Deactivating a staff member keeps the history (D-3.7). Four route tests. | ⬜ | 8.6.2 |
| **8.6.4** | **`POST /api/admin/staff/[id]/reset-password`** (`withAudit` + `withCsrf`). Body: the new password. The route: `hashPassword` (D-3.9); `invalidateAllSessions` (D-3.3); return `{ data: { success: true } }` — never the password. **Discharges W-0003 and W-0004** (the `app/staff/_logout-button.tsx` and `app/kitchen/_logout-button.tsx` files are removed). Four route tests. | ⬜ | 8.6.3 |
| **8.6.5** | **The Staff Management screen** (`app/admin/staff/page.tsx`): a table of staff with name, username, roles, last login, state. Row actions: Edit, Reset Password, Deactivate. "Add Staff" opens the right panel. | ⬜ | 8.6.4 |
| **8.6.6** | **Verify:** create a staff member, assign roles, deactivate, reset the password; log in as them, then reset from admin (the session is invalidated). Manual desktop. The milestone's acceptance test. | ⬜ | 8.6.5 |

---

### Milestone 8.7 — Reports

**Goal:** The operator sees the venue's sales reports — daily revenue, orders per day, top-selling items, by category — and exports them as CSV.

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.7.1** | **`GET /api/admin/reports/sales`** (`withAudit`). Query params: `dateFrom`, `dateTo` (up to 6 months per D-12.1). Returns `{ data: { dailyTotals, topItems, byCategory } }`. All money as decimal strings. Four route tests. | ⬜ | 8.6.6 |
| **8.7.2** | **`GET /api/admin/reports/sales/export`** (CSV, `withAudit`). One CSV per report type via `?type=daily|items|categories`. Four route tests. | ⬜ | 8.7.1 |
| **8.7.3** | **The Reports screen** (`app/admin/reports/page.tsx`): a date range picker, a line chart of daily revenue, a bar chart of orders per day, a table of top-selling items, three "Export CSV" buttons. | ⬜ | 8.7.2 |
| **8.7.4** | **Verify:** a 6-month range, export the daily CSV, open it; the daily totals sum to the same sum from the DB. Manual desktop. The milestone's acceptance test. | ⬜ | 8.7.3 |

---

### Milestone 8.8 — Settings

**Goal:** The operator sees the venue's read-only tax / currency / language; can edit the address, contact, hours; and can toggle the modules and services within the limits the developer enabled.

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.8.1** | **`GET` / `PATCH /api/admin/settings`** (`withAudit`; PATCH + `withCsrf`). `GET` returns the venue's settings: address, contact, hours (editable), taxRate / currency / language (read-only). `PATCH` accepts only address, contact, hours. **Rejects writes to taxRate / currency / language with `VALIDATION_FAILED`** (D-9.6). Four route tests. | ⬜ | 8.7.4 |
| **8.8.2** | **`PATCH /api/admin/modules`** (`withAudit` + `withCsrf`). Body: the module toggles. The operator can turn off a module the developer enabled; cannot turn on a disabled module (D-9.6). A request that tries to enable a disabled module returns `FORBIDDEN`. Four route tests. | ⬜ | 8.8.1 |
| **8.8.3** | **`PATCH /api/admin/services`** (`withAudit` + `withCsrf`). Same as 8.8.2 for the service-catalog enablement. Four route tests. | ⬜ | 8.8.2 |
| **8.8.4** | **The Settings screen** (`app/admin/settings/page.tsx`): the venue's address / contact / hours (editable form), the read-only taxRate / currency / language, the module toggles, the service toggles. | ⬜ | 8.8.3 |
| **8.8.5** | **Verify:** the read-only tax rate stays read-only (a PATCH including `taxRate` returns 400); a module toggle hides the Rooms tab; a service toggle hides the Laundry card on the guest service catalog. Manual desktop + mobile. The milestone's acceptance test. | ⬜ | 8.8.4 |

---

### Milestone 8.9 — Audit Log Viewer

**Goal:** The operator sees the audit log's last 7 days, filterable; can download the full log as a ZIP.

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| **8.9.1** | **The "Audit Log" tab in the admin shell** (visible to MANAGER / OWNER only). | ⬜ | 8.8.5 |
| **8.9.2** | **The audit log list screen** (`app/admin/audit/page.tsx`): a table of the last 7 days, filterable by actor, route, and status. Reads from a new `GET /api/admin/audit/list?since=7d` route (`withAudit`, paginated envelope). Four route tests. | ⬜ | 8.9.1 |
| **8.9.3** | **The "Download ZIP" button** on the audit list screen, hitting `GET /api/admin/audit/export` (the 7.7.1b route). | ⬜ | 8.9.2 |
| **8.9.4** | **Verify:** a staff action produces a row in the audit list within one poll; the ZIP download opens in a text editor and contains the row. Manual desktop. The milestone's acceptance test. | ⬜ | 8.9.3 |
---

### Phase 8 Acceptance (from PHASE_TESTS.md §10)

The manager logs in, sees the six live metrics, watches them update as orders move, filters active orders by date, exports CSV, adds a menu item, toggles its state (Available → Unavailable → Hidden → Available), adds a table with a QR, adds a staff member with a role, resets their password, deactivates them, generates a sales report, exports it, toggles a module off (Rooms disappear), toggles a service off (Laundry disappears), and confirms the read-only fields stay read-only and the Branding tab stays absent. **Sixteen steps, all proven, at 1440×900.**

### WIRING obligations at Phase 8's close

- **W-0002, W-0003, W-0004** — discharged at 8.1.2, 8.5.4, 8.5.4 (the per-page sign-out buttons retire as the admin shell carries the sign-out).
- **W-0005** — discharged at 8.3.4 (the HIDDEN state in the admin toggle).
- **W-0021** — still OPEN, discharged route-by-route. Every Phase 8 route's report names the obligation.
- **W-0025** — discharged at 7.7.1c's implementation (IP is populated in `with-audit.ts`). 8.1.1 verifies the first audit line carries a real IP.
- **W-0026** — still OPEN, scheduled for Phase 10.7.6 (log rotation).
- **W-0027** — discharged at 8.0.1 (the `getVenueSlug()` helper; the two existing routes rewired).

### The four baselines at Phase 8's close

- `pnpm exec tsc --noEmit`: 0 errors.
- `pnpm test:unit`: higher than 279 (8.0.1 adds 2; 8.3.1 fills F-0004).
- `pnpm test:integration`: higher than 306 (8.1.1 adds 4; 8.2–8.8 add route tests).
- `pnpm build`: 41+ routes (each new `page.tsx` is a route; each new API route is a route).
---

## 13. Phase 9 — Focused Hotel Service Queues

*(Unchanged. Phase 9 is now blocked on Phase 8.7.5 instead of Phase 8.1.1.)*

**Dependency:** Phase 8.8.4 is ✅ Complete.

*(The Phase 9 task tables are unchanged.)*

---

## 14. Phase 10 — Payments, Polish, Production

*(Phase 10 shrinks. Items 10.2.1–10.2.2 and 10.5.1–10.5.4 have moved to Phase 7.7. Phase 10 retains payments, accessibility, performance, real-venue dry run, and documentation.)*

**Dependency:** Phase 9.5.7 is ✅ Complete.

### Milestone 10.1 — Payment Bridge

*(Unchanged. 10.1.1–10.1.9.)*

### Milestone 10.2 — Security Polish

| ID | Task | Depends on |
|----|------|------------|
| 10.2.1 | ~~CSRF protection~~ **MOVED TO 7.7.4** | — |
| 10.2.2 | ~~Rate limiting~~ **MOVED TO 7.7.5** | — |
| 10.2.3 | Audit every `dangerouslySetInnerHTML` — verify `escapeHtml` used for user data | 10.1.9 |
| 10.2.4 | Verify: every guest screen renders without raw JS; every injected script executes (re-runs W-0020) | 10.2.3 |

### Milestone 10.3 — Accessibility & Polish

*(Unchanged from prior plan.)*

### Milestone 10.4 — Performance

*(Unchanged from prior plan.)*

### Milestone 10.5 — Observability

| ID | Task | Depends on |
|----|------|------------|
| 10.5.1 | ~~Structured error logging~~ **MOVED TO 7.7.1** | — |
| 10.5.2 | ~~DB health-check endpoint~~ **DEFERRED to Phase 10.5.2 (kept)** | 10.5.1 is now the DB health check |
| 10.5.2 | Add DB health-check endpoint (`GET /api/health/db`) | 10.4.5 |
| 10.5.3 | Add API request latency metrics (aggregated from the audit log from 7.7.1) | 10.5.2 |
| 10.5.4 | Verify: simulate DB outage; observe logs and health endpoint | 10.5.3 |

### Milestone 10.6 — Real-Venue Dry Run

*(Unchanged from prior plan.)*

### Milestone 10.7 — Documentation and Handover

*(Unchanged from prior plan.)*

**W-0026** — Audit log rotation (30-day retention). The Phase 10.7 deployment task installs the pruner (see `docs/WIRING.md` §2 W-0026). The reference implementation mirrors `scripts/backup-daily.*`. Dependency: `10.6.1` (the real-venue dry run that schedules both the backups and the rotation).

---

## 15. The Dependency Graph (Revised)
7.5 (closed)
→ 7.6.1 ... 7.6.11 (closed at 145d479)
→ 7.7.1 (audit log + ZIP export)
→ 7.7.2 (DB security)
→ 7.7.3 (daily backups)
→ 7.7.4 (CSRF)
→ 7.7.5 (login rate limiting)
→ 8.1.1 (dashboard route)
→ 8.1.2 (admin shell)
→ 8.1.3 (dashboard page)
→ 8.1.4 (polling)
→ 8.1.5 (verify)
→ 8.2.1 ... 8.7.5 (order, menu, tables, staff, reports, settings)
→ 8.8.1 ... 8.8.4 (audit log viewer)
→ 9.5.1 ... 9.5.7 (focused queues)
→ 10.1.9 (payment bridge)
→ 10.2.4 (security polish)
→ 10.3.7 (accessibility)
→ 10.4.5 (performance)
→ 10.5.4 (observability)
→ 10.6.7 (real venue dry run)
→ 10.7.5 (handover)

text

---

## 16. The Rule for Starting a Task

A task can start when:

1. Every task it depends on is `✅ Complete`.
2. The task has a clear objective (one or two sentences).
3. The task has a scope (the files it will touch).
4. The task has acceptance criteria that can be verified with raw evidence.
5. The task has a rollback.
6. The previous task's report has been read.

**Anti-hallucination rule (added in Phase 7.6):** Before writing any code or any docs for a task, the session must verify the pre-conditions by running the exact `Select-String` / `Get-Content` commands the task names. If the pre-conditions do not match, the task stops and reports `BLOCKED` with the mismatch. No task is executed against a codebase or docs that differ from what the task expects.

**Audit-log rule (added in Phase 7.7):** Every new API route from Phase 8 onward must use `withAudit`. A route that does not use it is `FAIL`. The audit log is the record of who did what; a route without it is a blind spot.

**CSRF rule (added in Phase 7.7):** Every new state-changing route (POST, PATCH, DELETE) from Phase 7.7.4 onward must validate the CSRF token. A route that skips CSRF is `FAIL`. The login route is CSRF-protected even though it is not state-changing (it establishes a session, which is state).

**Backup rule (added in Phase 7.7):** Before a venue goes live, a restore test must succeed. A backup that has never been restored is a backup that does not exist.

**Test floor rule (unchanged from BUILD.md §8.8):** Every task has a mandatory test level. A domain change needs a unit test. A repository change needs an integration test. A route change needs an integration test plus a negative test. A guest-facing change needs a manual mobile check. A staff-facing change needs a manual desktop check. A change that skips its floor is `FAIL`.

---

## 17. What This Revision Adds, In One Paragraph

Phase 7.7 installs five locks on the door before Phase 8 opens thirty new doors. The audit log makes every action traceable, and it is downloadable as a ZIP that opens in Notepad. The database hardening ensures the production connection is encrypted and uses a dedicated user. The backups ensure the venue's data can be restored. CSRF ensures a malicious site cannot forge an order on behalf of a logged-in guest. Rate limiting ensures a staff password cannot be brute-forced. These five items were previously in Phase 10 as "polish." They are not polish — they are preconditions. The manager panel is the largest piece of the product, and it will be built on a foundation that is verified (Phase 7.6) and hardened (Phase 7.7). That is the honest sequence.

---

## 18. The Rule for Finishing a Task

A task is finished when:

1. Every acceptance criterion has raw evidence.
2. The type checker passes.
3. The build passes.
4. Every test passes.
5. No file outside the scope was touched.
6. The report is written.
7. The status is updated in this file.

**Anti-hallucination rule (added):** If the report claims a `PASS` but the manual verification step has not been run, the report is `NOT VERIFIED` and the task is not closed. A `PASS` requires the evidence to include the raw output of the manual step. A client-component change without a manual mobile check is `NOT VERIFIED`, not `PASS`.

---

## 19. The Rule for Updating This File

This file is updated at the end of every session:

- The completed task's status is changed from `🟨 In progress` to `✅ Complete`.
- The next task's status is changed from `⬜ Not started` to `🟨 In progress` at the start of the next session, not before.
- If a task is blocked, its status is changed to `🟥 Blocked` and the blocking reason is recorded in the report.
- If a task is deferred, its status is changed to `🔵 Deferred` and the reason is recorded in DECISIONS.md.
- If a new task is discovered mid-phase, it is added to the phase's table at the correct position and its dependency is recorded.
- If a task is split, the original task's status is changed to `✅ Complete` with a note pointing to the new tasks, and the new tasks are added to the table.

**Anti-hallucination rule (added):** A structural change to this file (a new phase, a split task, a deferred task) requires a PROGRESS `STRUCTURAL` entry in the same session. A session that changes the ROADMAP without a matching PROGRESS entry is not complete.

The file is never rewritten wholesale. It grows and updates as the project moves. It is the live board the developer consults at the start of every session.