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

## 11. Phase 8 — The Manager Panel

**Goal:** The manager can see everything, manage the venue's data, and export reports. All screens use staff-world tokens only (D-9.6). No branding tab. No SLA configuration.

**Status:** Phase 8 is the current phase. Phase 7.6 closed on 2026-11-10 (PROGRESS ENTRY-0220).

**Dependency:** Phase 7.6 is ✅ Complete.

**Note on Phase 8 dependency:** The original sequence had 8.1.1 (dashboard) as the first task. This was wrong — the admin shell must exist before the dashboard can render inside it. The resequenced 8.1 fixes this.

### Milestone 8.1 — Dashboard

| ID | Task | Status | Depends on |
|----|------|--------|------------|
| 8.1.1 | Add `GET /api/admin/dashboard` route | ⬜ | 7.6.11 |
| 8.1.2 | Add the admin shell layout (sidebar, header, sign-out) — retires D-9.7 per-page buttons; discharges W-0002 | ⬜ | 8.1.1 |
| 8.1.3 | Add the dashboard page (metric tiles + active orders list + recent requests) | ⬜ | 8.1.2 |
| 8.1.4 | Add 5s polling on the dashboard | ⬜ | 8.1.3 |
| 8.1.5 | Verify: metrics update as orders move (manual desktop at 1440×900) | ⬜ | 8.1.4 |

### Milestone 8.2 — Order Management

| ID | Task | Depends on |
|----|------|------------|
| 8.2.1 | Add `GET /api/admin/orders` (with filters: date range, state) | 8.1.5 |
| 8.2.2 | Add the Active Orders tab | 8.2.1 |
| 8.2.3 | Add the Completed Orders tab with date filters | 8.2.2 |
| 8.2.4 | Add `GET /api/admin/orders/export` (CSV) | 8.2.3 |
| 8.2.5 | Verify: filter by 6-month range, export CSV | 8.2.4 |

### Milestone 8.3 — Menu Management

| ID | Task | Depends on |
|----|------|------------|
| 8.3.1 | Add the menu list screen | 8.2.5 |
| 8.3.2 | Add `POST /api/admin/menu/items` | 8.3.1 |
| 8.3.3 | Add `PATCH /api/admin/menu/items/[id]` | 8.3.2 |
| 8.3.4 | Add HIDDEN state to existing toggle (discharges W-0005) | 8.3.3 |
| 8.3.5 | Add category management CRUD | 8.3.4 |
| 8.3.6 | Add modifier group/option CRUD | 8.3.5 |
| 8.3.7 | Verify: add, edit, hide, guest sees within 5s | 8.3.6 |

### Milestone 8.4 — Tables and Rooms

| ID | Task | Depends on |
|----|------|------------|
| 8.4.1 | Add `GET/POST/PATCH /api/admin/tables` | 8.3.7 |
| 8.4.2 | Add `GET/POST/PATCH /api/admin/rooms` | 8.4.1 |
| 8.4.3 | Add the Tables/Rooms screens with QR preview | 8.4.2 |
| 8.4.4 | Add batch QR print view | 8.4.3 |
| 8.4.5 | Verify: add table, generate QR, print sheet | 8.4.4 |

### Milestone 8.5 — Staff Management

| ID | Task | Depends on |
|----|------|------------|
| 8.5.1 | Add `GET /api/admin/staff` | 8.4.5 |
| 8.5.2 | Add `POST /api/admin/staff` | 8.5.1 |
| 8.5.3 | Add `PATCH /api/admin/staff/[id]` (edit, roles, deactivate) | 8.5.2 |
| 8.5.4 | Add `POST /api/admin/staff/[id]/reset-password` | 8.5.3 |
| 8.5.5 | Add the Staff Management screen | 8.5.4 |
| 8.5.6 | Verify: create, assign roles, deactivate, reset password | 8.5.5 |

### Milestone 8.6 — Reports

| ID | Task | Depends on |
|----|------|------------|
| 8.6.1 | Add `GET /api/admin/reports/sales` | 8.5.6 |
| 8.6.2 | Add `GET /api/admin/reports/sales/export` (CSV) | 8.6.1 |
| 8.6.3 | Add the Reports screen | 8.6.2 |
| 8.6.4 | Verify: 6-month range, export, open CSV | 8.6.3 |

### Milestone 8.7 — Settings

| ID | Task | Depends on |
|----|------|------------|
| 8.7.1 | Add `GET/PATCH /api/admin/settings` (read-only tax/currency/language; editable address/hours) | 8.6.4 |
| 8.7.2 | Add `PATCH /api/admin/modules` | 8.7.1 |
| 8.7.3 | Add `PATCH /api/admin/services` | 8.7.2 |
| 8.7.4 | Add the Settings screen | 8.7.3 |
| 8.7.5 | Verify: read-only fields stay read-only; module toggles hide screens | 8.7.4 |

---

## 12. Phase 9 — Focused Hotel Service Queues

**Goal:** Every focused role (Housekeeping, Maintenance, Concierge, Laundry, Spa, Front Desk) has its own scoped queue. Phase 7.5 delivered the LEADER-visible combined queue; Phase 9 delivers the focused per-role queues.

**Dependency:** Phase 8.7.5 is ✅ Complete.

**Scope honesty:** The domain (7.5.2, 7.5.3), the guest routes (7.5.4), the staff routes (7.5.5), and the guest view (7.5.8) are all ✅ from Phase 7.5. Phase 9 is therefore effectively **just 9.5.1 through 9.5.7** — the per-role queue screens. 9.1.x, 9.2.x, 9.3.x, 9.4.x, and 9.5.8–9.5.10 are retained for traceability only.

### Milestone 9.5 — The Focused Queues

| ID | Task | Depends on |
|----|------|------------|
| 9.5.1 | Add the Housekeeping queue (filter `/api/staff/requests` by HOUSEKEEPING; role gate) | 8.7.5 |
| 9.5.2 | Add the Maintenance queue | 9.5.1 |
| 9.5.3 | Add the Concierge queue | 9.5.2 |
| 9.5.4 | Add the Laundry queue | 9.5.3 |
| 9.5.5 | Add the Spa queue | 9.5.4 |
| 9.5.6 | Add the Front Desk combined view | 9.5.5 |
| 9.5.7 | Verify: each queue shows only its role's requests; actions advance them; guest /requests updates within 5s | 9.5.6 |

---

## 13. Phase 10 — Payments, Polish, Production

**Goal:** The product is deployable and safe for 1,000 users per venue. Every BUILD.md §7.4 release blocker is closed.

**Dependency:** Phase 9.5.7 is ✅ Complete.

### Milestone 10.1 — Payment Bridge (unchanged from prior plan; 10.1.1–10.1.9)

### Milestone 10.2 — Security Hardening (NEW)

| ID | Task | Depends on |
|----|------|------------|
| 10.2.1 | Add CSRF protection on every state-changing route | 10.1.9 |
| 10.2.2 | Add rate limiting to `/api/auth/login` | 10.2.1 |
| 10.2.3 | Audit every `dangerouslySetInnerHTML` — verify `escapeHtml` used for user data | 10.2.2 |
| 10.2.4 | Verify: login attempt limit; CSRF token accepted on form submission | 10.2.3 |

### Milestone 10.3 — Accessibility & Polish (was 10.2)

### Milestone 10.4 — Performance (was 10.3)

### Milestone 10.5 — Observability (NEW)

| ID | Task | Depends on |
|----|------|------------|
| 10.5.1 | Add server-side structured error logging | 10.4.5 |
| 10.5.2 | Add DB health-check endpoint | 10.5.1 |
| 10.5.3 | Add API request latency logging | 10.5.2 |
| 10.5.4 | Verify: simulate DB outage; observe logs and health endpoint | 10.5.3 |

### Milestone 10.6 — Real-Venue Dry Run (was 10.4)

### Milestone 10.7 — Documentation and Handover (was 10.5)

---

## 14. The Dependency Graph
7.5 (closed)
→ 7.6.1 (ROADMAP rewrite)
→ 7.6.2 (README)
→ 7.6.3 (DECISIONS)
→ 7.6.5 (SYSTEM)
→ 7.6.6 (PHASE_TESTS)
→ 7.6.7 (DESIGN)
→ 7.6.8 (escapeHtml)
→ 7.6.9 (listForGuestSession)
→ 7.6.10 (WIRING)
→ 7.6.11 (full verification)
→ 8.1.1 (dashboard route)
→ 8.1.2 (admin shell)
→ 8.1.3 (dashboard page)
→ 8.1.4 (polling)
→ 8.1.5 (verify)
→ 8.2.1 ... → 8.7.5
→ 9.5.1 ... → 9.5.7
→ 10.1.9 (payment bridge)
→ 10.2.4 (security)
→ 10.3.7 (accessibility)
→ 10.4.5 (performance)
→ 10.5.4 (observability)
→ 10.6.7 (real venue dry run)
→ 10.7.5 (handover)

text

---

## 15. The Rule for Starting a Task

A task can start when:

1. Every task it depends on is `✅ Complete`.
2. The task has a clear objective (one or two sentences).
3. The task has a scope (the files it will touch).
4. The task has acceptance criteria that can be verified with raw evidence.
5. The task has a rollback.
6. The previous task's report has been read.

**Anti-hallucination rule (added):** Before writing any code or any docs for a task, the session must verify the pre-conditions by running the exact `Select-String` / `Get-Content` commands the task names. If the pre-conditions do not match, the task stops and reports `BLOCKED` with the mismatch. No task is executed against a codebase or docs that differ from what the task expects.

---

## 16. The Rule for Finishing a Task

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

## 17. The Rule for Updating This File

This file is updated at the end of every session:

- The completed task's status is changed from `🟨 In progress` to `✅ Complete`.
- The next task's status is changed from `⬜ Not started` to `🟨 In progress` at the start of the next session, not before.
- If a task is blocked, its status is changed to `🟥 Blocked` and the blocking reason is recorded in the report.
- If a task is deferred, its status is changed to `🔵 Deferred` and the reason is recorded in DECISIONS.md.
- If a new task is discovered mid-phase, it is added to the phase's table at the correct position and its dependency is recorded.
- If a task is split, the original task's status is changed to `✅ Complete` with a note pointing to the new tasks, and the new tasks are added to the table.

**Anti-hallucination rule (added):** A structural change to this file (a new phase, a split task, a deferred task) requires a PROGRESS `STRUCTURAL` entry in the same session. A session that changes the ROADMAP without a matching PROGRESS entry is not complete.

The file is never rewritten wholesale. It grows and updates as the project moves. It is the live board the developer consults at the start of every session.