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

| ID    | Task                                                                       | Status | Depends on |
| ----- | -------------------------------------------------------------------------- | ------ | ---------- |
| 1.3.0 | Author the Tailwind 4 `@theme` token mapping in `app/globals.css` | ✅     | 1.2.7      |
| 1.3.1 | Install and configure the base component library (shadcn/ui or equivalent) | ✅ Complete     | 1.3.0      |
| 1.3.2 | Add the Button component, themed by tokens                                 | ✅ Complete     | 1.3.1      |
| 1.3.3 | Add the Input, Textarea, and Select components, themed by tokens           | ✅ Complete     | 1.3.2      |
| 1.3.4 | Add the Dialog, Sheet, and Drawer components                               | ✅ Complete     | 1.3.2      |
| 1.3.5 | Add the Badge, Card, and Separator components                              | ✅ Complete     | 1.3.2      |
| 1.3.6 | Add the Table component (for staff and manager views)                      | ✅ Complete     | 1.3.2      |
| 1.3.7 | Add the Toast or notification component                                    | ✅ Complete     | 1.3.2      |
| 1.3.8 | Verify: every base component renders on a scratch page; the build passes   | ✅ Complete     | 1.3.7      |

### Milestone 1.4 — Shared utilities

| ID    | Task                                                       | Status | Depends on |
| ----- | ---------------------------------------------------------- | ------ | ---------- |
| 1.4.1 | Add the `cn` helper for class name composition             | ✅ Complete     | 1.3.8      |
| 1.4.2 | Add the money formatting utility                           | ✅ Complete     | 1.4.1      |
| 1.4.3 | Add the date and time formatting utility                   | ✅ Complete     | 1.4.1      |
| 1.4.4 | Add the motion utilities, one per atmosphere               | ✅ Complete     | 1.4.1      |
| 1.4.5 | Verify: each utility has a small unit test; the tests pass | ✅ Complete     | 1.4.4      |

### Milestone 1.5 — The development server

| ID    | Task                                                                            | Status | Depends on |
| ----- | ------------------------------------------------------------------------------- | ------ | ---------- |
| 1.5.1 | Configure the root layout with the design tokens applied                        | ✅ Complete     | 1.4.5      |
| 1.5.2 | Configure the guest and staff atmosphere wrappers                               | ✅ Complete     | 1.5.1      |
| 1.5.3 | Add the 404 and error screens                                                   | ✅ Complete     | 1.5.2      |
| 1.5.4 | Verify: the dev server starts, the scratch page renders, the 404 screen renders | ✅ Complete     | 1.5.3      |

**Acceptance for Phase 1:** The dev server starts. The type checker passes. The build passes. The base components render. The design tokens are visible on a scratch page. No product feature works yet, and that is the point.

**Visible progress at the end of Phase 1:** The developer can open a browser and see the design system in action.

---

## 5. Phase 2 — The Data Model

**Goal:** The full database schema exists, matching SYSTEM.md §11. The seed creates one venue with tables, rooms, menu, staff, and QR codes.

### Milestone 2.1 — The schema

| ID     | Task                                                                         | Status | Depends on |
| ------ | ---------------------------------------------------------------------------- | ------ | ---------- |
| 2.1.1  | Configure the database client and the migration tool                         | ⬜     | 1.5.4      |
| 2.1.2  | Add the venue, configuration, and module-toggle tables                       | ⬜     | 2.1.1      |
| 2.1.3  | Add the table, room, and counter tables                                      | ⬜     | 2.1.2      |
| 2.1.4  | Add the QR token table                                                       | ⬜     | 2.1.3      |
| 2.1.5  | Add the staff member, staff session, and role tables                         | ⬜     | 2.1.2      |
| 2.1.6  | Add the menu category, menu item, modifier group, and modifier option tables | ⬜     | 2.1.2      |
| 2.1.7  | Add the order, order item, and order state-change tables                     | ⬜     | 2.1.6      |
| 2.1.8  | Add the service request and service request state-change tables              | ⬜     | 2.1.2      |
| 2.1.9  | Add the payment ticket and receipt tables                                    | ⬜     | 2.1.7      |
| 2.1.10 | Add every index required by the queries in SYSTEM.md §12                     | ⬜     | 2.1.9      |
| 2.1.11 | Generate and review the migration                                            | ⬜     | 2.1.10     |
| 2.1.12 | Verify: the migration applies cleanly; the schema matches SYSTEM.md §11      | ⬜     | 2.1.11     |

### Milestone 2.2 — The repositories

| ID    | Task                                                                                | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------- | ------ | ---------- |
| 2.2.1 | Add the venue repository (read the venue and its modules)                           | ⬜     | 2.1.12     |
| 2.2.2 | Add the table and room repositories                                                 | ⬜     | 2.2.1      |
| 2.2.3 | Add the QR token repository                                                         | ⬜     | 2.2.2      |
| 2.2.4 | Add the staff and staff session repositories                                        | ⬜     | 2.2.1      |
| 2.2.5 | Add the menu repositories                                                           | ⬜     | 2.2.1      |
| 2.2.6 | Add the order repository (create, read, list, advance)                              | ⬜     | 2.2.5      |
| 2.2.7 | Add the service request repository                                                  | ⬜     | 2.2.1      |
| 2.2.8 | Add the payment ticket and receipt repositories                                     | ⬜     | 2.2.6      |
| 2.2.9 | Verify: each repository has an integration test that reads and writes a real record | ⬜     | 2.2.8      |

### Milestone 2.3 — The seed

| ID    | Task                                                                                               | Status | Depends on |
| ----- | -------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 2.3.1 | Seed the venue with the table, room, and counter modules enabled                                   | ⬜     | 2.2.9      |
| 2.3.2 | Seed the tables and rooms                                                                          | ⬜     | 2.3.1      |
| 2.3.3 | Seed the QR tokens, one per table, one per room, and one for the counter                           | ⬜     | 2.3.2      |
| 2.3.4 | Seed the menu categories and menu items with modifiers                                             | ⬜     | 2.3.3      |
| 2.3.5 | Seed the staff members with different roles                                                        | ⬜     | 2.3.4      |
| 2.3.6 | Seed the enabled hotel services                                                                    | ⬜     | 2.3.5      |
| 2.3.7 | Seed the counter, its QR token, and its own pickup-labelled orders                                 | ⬜     | 2.3.6      |
| 2.3.8 | Verify: the seed is idempotent; running it twice does not duplicate anything; every table has data | ⬜     | 2.3.7      |

**Acceptance for Phase 2:** The database schema matches SYSTEM.md §11 exactly. The migrations apply cleanly. The seed creates a fully populated venue. Every repository has at least one integration test that passes.

**Visible progress at the end of Phase 2:** The developer can query the database and see a fully populated venue with tables, rooms, QR codes, a menu, and staff.

---

## 6. Phase 3 — Authentication and Sessions

**Goal:** Staff and managers can log in and out. Sessions work. Roles are enforced. Route protection is in place.

### Milestone 3.1 — Session infrastructure

| ID    | Task                                                                                            | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.1.1 | Add the password hashing service (hash and verify)                                              | ⬜     | 2.3.8      |
| 3.1.2 | Add the session service (create, validate, delete, invalidate-all)                              | ⬜     | 3.1.1      |
| 3.1.3 | Add the session cookie helpers (set, read, clear)                                               | ⬜     | 3.1.2      |
| 3.1.4 | Verify: a session can be created, validated, and deleted; a password can be hashed and verified | ⬜     | 3.1.3      |

### Milestone 3.2 — The auth domain

| ID    | Task                                                   | Status | Depends on |
| ----- | ------------------------------------------------------ | ------ | ---------- |
| 3.2.1 | Add the `login` domain function                        | ⬜     | 3.1.4      |
| 3.2.2 | Add the `logout` domain function                       | ⬜     | 3.2.1      |
| 3.2.3 | Add the `getSession` domain function                   | ⬜     | 3.2.1      |
| 3.2.4 | Add the `canAccess` domain function (roles and areas)  | ⬜     | 3.2.3      |
| 3.2.5 | Add the password-change invalidation logic             | ⬜     | 3.2.4      |
| 3.2.6 | Add the single-session-per-staff-member logic          | ⬜     | 3.2.5      |
| 3.2.7 | Verify: every domain function has unit tests; all pass | ⬜     | 3.2.6      |

### Milestone 3.3 — The auth routes

| ID    | Task                                                               | Status | Depends on |
| ----- | ------------------------------------------------------------------ | ------ | ---------- |
| 3.3.1 | Add `POST /api/auth/login`                                         | ⬜     | 3.2.7      |
| 3.3.2 | Add `POST /api/auth/logout`                                        | ⬜     | 3.3.1      |
| 3.3.3 | Add `GET /api/auth/session`                                        | ⬜     | 3.3.1      |
| 3.3.4 | Verify: the three routes return the correct envelopes and statuses | ⬜     | 3.3.3      |

### Milestone 3.4 — The login screens

| ID    | Task                                                                                                      | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.4.1 | Add the staff login screen                                                                                | ⬜     | 3.3.4      |
| 3.4.2 | Add the manager login screen                                                                              | ⬜     | 3.4.1      |
| 3.4.3 | Add the kitchen login screen                                                                              | ⬜     | 3.4.2      |
| 3.4.4 | Verify: each login screen accepts a username and password, submits, and either signs in or shows an error | ⬜     | 3.4.3      |

### Milestone 3.5 — Route protection

| ID    | Task                                                                                                                                                  | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.5.1 | Add the middleware that guards the staff, kitchen, and admin routes                                                                                   | ⬜     | 3.4.4      |
| 3.5.2 | Add the page-level session validation on each protected page                                                                                          | ⬜     | 3.5.1      |
| 3.5.3 | Add the role check on each protected page                                                                                                             | ⬜     | 3.5.2      |
| 3.5.4 | Verify: a signed-out request is redirected; a signed-in request with the wrong role is redirected; a signed-in request with the right role is allowed | ⬜     | 3.5.3      |

### Milestone 3.6 — Placeholder dashboards

| ID    | Task                                                                                    | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------- | ------ | ---------- |
| 3.6.1 | Add a placeholder staff dashboard                                                       | ⬜     | 3.5.4      |
| 3.6.2 | Add a placeholder kitchen screen                                                        | ⬜     | 3.6.1      |
| 3.6.3 | Add a placeholder admin dashboard                                                       | ⬜     | 3.6.2      |
| 3.6.4 | Verify: each placeholder renders after login and shows the staff member's name and role | ⬜     | 3.6.3      |

**Acceptance for Phase 3:** A staff member can log in, see a placeholder for their area, log out, and be rejected on the next request. A staff member of one role cannot access another role's area. Changing a staff member's password invalidates their sessions. A second login ends the first.

**Visible progress at the end of Phase 3:** The developer can log in as different roles and see the correct placeholder screen.

---

## 7. Phase 4 — QR Codes and Guest Context

**Goal:** A QR code can be generated, printed, scanned, and resolved to a guest session tied to a specific table or room. The guest landing screen renders with the venue's branding.

### Milestone 4.1 — QR domain and infrastructure

| ID    | Task                                                                       | Status | Depends on |
| ----- | -------------------------------------------------------------------------- | ------ | ---------- |
| 4.1.1 | Add the `generateToken` domain function                                    | ⬜     | 3.6.4      |
| 4.1.2 | Add the `resolveToken` domain function                                     | ⬜     | 4.1.1      |
| 4.1.3 | Add the `revokeToken` domain function                                      | ⬜     | 4.1.1      |
| 4.1.4 | Add the QR image generator (the adapter that produces a scannable image)   | ⬜     | 4.1.1      |
| 4.1.5 | Verify: a token can be generated, resolved, and revoked; the image renders | ⬜     | 4.1.4      |

### Milestone 4.2 — The guest session

| ID    | Task                                                                                                | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 4.2.1 | Add the guest session service (create, read, invalidate)                                            | ⬜     | 4.1.5      |
| 4.2.2 | Add the guest cookie helpers                                                                        | ⬜     | 4.2.1      |
| 4.2.3 | Add the guest session invalidation on table close and room checkout                                 | ⬜     | 4.2.2      |
| 4.2.4 | Verify: a guest session is created on scan, is invalidated on close, and the next scan starts fresh | ⬜     | 4.2.3      |

### Milestone 4.3 — The QR landing

| ID    | Task                                                                                               | Status | Depends on |
| ----- | -------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 4.3.1 | Add the QR landing page (resolves the token, creates the session, redirects)                       | ⬜     | 4.2.4      |
| 4.3.2 | Add the "QR no longer active" screen                                                               | ⬜     | 4.3.1      |
| 4.3.3 | Add the "scan the QR" screen for guests who land at the root without a token                       | ⬜     | 4.3.1      |
| 4.3.4 | Verify: a valid token opens the guest landing; a revoked token shows the "no longer active" screen | ⬜     | 4.3.3      |

### Milestone 4.4 — The guest landing screen

| ID    | Task                                                                         | Status | Depends on |
| ----- | ---------------------------------------------------------------------------- | ------ | ---------- |
| 4.4.1 | Add the venue hero (name, logo, brand color, hero image, welcome message)    | ⬜     | 4.3.4      |
| 4.4.2 | Add the primary action (View Menu or Explore Services)                       | ⬜     | 4.4.1      |
| 4.4.3 | Add the quiet secondary actions (Call a waiter, Request the bill)            | ⬜     | 4.4.2      |
| 4.4.4 | Add the menu preview (a few featured items)                                  | ⬜     | 4.4.3      |
| 4.4.5 | Add the "how it works" strip                                                 | ⬜     | 4.4.4      |
| 4.4.6 | Add the footer                                                               | ⬜     | 4.4.5      |
| 4.4.7 | Verify: the landing screen renders with the venue's branding on a real phone | ⬜     | 4.4.6      |

### Milestone 4.5 — Admin QR management

| ID    | Task                                                                                     | Status | Depends on |
| ----- | ---------------------------------------------------------------------------------------- | ------ | ---------- |
| 4.5.1 | Add the QR list screen in the admin panel                                                | ⬜     | 4.4.7      |
| 4.5.2 | Add the QR generation action                                                             | ⬜     | 4.5.1      |
| 4.5.3 | Add the QR revoke action                                                                 | ⬜     | 4.5.2      |
| 4.5.4 | Add the QR print view                                                                    | ⬜     | 4.5.2      |
| 4.5.5 | Verify: the manager can generate, revoke, and print a QR; the printed QR scans correctly | ⬜     | 4.5.4      |

**Acceptance for Phase 4:** A manager can generate a QR for a table, print it, place it on the table, and scan it with a real phone. The phone opens the venue's landing screen with the table number. A revoked QR shows the "no longer active" screen. A room QR opens the guest service catalog.

**Visible progress at the end of Phase 4:** The developer can print a QR code and scan it with a real phone.

---

## 8. Phase 5 — The Menu and the Guest Order Flow

**Goal:** A guest can browse the menu, customize an item, add it to a cart, place an order, and track it. The order is stored with frozen prices and tax.

### Milestone 5.1 — The menu domain

| ID    | Task                                                                             | Status | Depends on |
| ----- | -------------------------------------------------------------------------------- | ------ | ---------- |
| 5.1.1 | Add the `getMenu` domain function                                                | ⬜     | 4.5.5      |
| 5.1.2 | Add the `getMenuItem` domain function                                            | ⬜     | 5.1.1      |
| 5.1.3 | Add the `isOrderable` domain function (item state check)                         | ⬜     | 5.1.2      |
| 5.1.4 | Verify: the menu returns only available and unavailable items, never hidden ones | ⬜     | 5.1.3      |

### Milestone 5.2 — The menu screen

| ID    | Task                                                                                                                    | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.2.1 | Add the menu screen with category tabs                                                                                  | ⬜     | 5.1.4      |
| 5.2.2 | Add the item list with photos, names, descriptions, and prices                                                          | ⬜     | 5.2.1      |
| 5.2.3 | Add the search bar                                                                                                      | ⬜     | 5.2.2      |
| 5.2.4 | Add the unavailable-item state (greyed out, with a label)                                                               | ⬜     | 5.2.3      |
| 5.2.5 | Add the floating cart bar                                                                                               | ⬜     | 5.2.4      |
| 5.2.6 | Verify: the menu renders on a real phone; the categories work; the search filters; an unavailable item is not orderable | ⬜     | 5.2.5      |

### Milestone 5.3 — The modifier sheet

| ID    | Task                                                                                     | Status | Depends on |
| ----- | ---------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.3.1 | Add the modifier sheet layout                                                            | ⬜     | 5.2.6      |
| 5.3.2 | Add the single-choice modifier group                                                     | ⬜     | 5.3.1      |
| 5.3.3 | Add the multiple-choice modifier group                                                   | ⬜     | 5.3.1      |
| 5.3.4 | Add the quantity stepper                                                                 | ⬜     | 5.3.2      |
| 5.3.5 | Add the notes field                                                                      | ⬜     | 5.3.2      |
| 5.3.6 | Add the live total                                                                       | ⬜     | 5.3.4      |
| 5.3.7 | Add the "Add to cart" action                                                             | ⬜     | 5.3.6      |
| 5.3.8 | Verify: a dish with modifiers can be customized and added to the cart; the price updates | ⬜     | 5.3.7      |

### Milestone 5.4 — The cart

| ID    | Task                                                                                                            | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.4.1 | Add the cart screen                                                                                             | ⬜     | 5.3.8      |
| 5.4.2 | Add item-level adjustment (quantity, remove)                                                                    | ⬜     | 5.4.1      |
| 5.4.3 | Add the order-level notes field                                                                                 | ⬜     | 5.4.1      |
| 5.4.4 | Add the summary (subtotal, tax, total)                                                                          | ⬜     | 5.4.2      |
| 5.4.5 | Add the "Place order" action                                                                                    | ⬜     | 5.4.4      |
| 5.4.6 | Add the empty cart state                                                                                        | ⬜     | 5.4.1      |
| 5.4.7 | Add the pickup-name field for the counter flow                                                                  | ⬜     | 5.4.5      |
| 5.4.8 | Verify: items can be added, adjusted, and removed; the totals are correct; the counter pickup name is captured | ⬜     | 5.4.7      |

### Milestone 5.5 — The order domain

| ID    | Task                                                                                                                     | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------------------------------------ | ------ | ---------- |
| 5.5.1 | Add the `createOrder` domain function                                                                                    | ⬜     | 5.4.8      |
| 5.5.2 | Add the price and tax computation                                                                                        | ⬜     | 5.5.1      |
| 5.5.3 | Add the price and tax snapshot on creation                                                                               | ⬜     | 5.5.2      |
| 5.5.4 | Add the initial state change record                                                                                      | ⬜     | 5.5.3      |
| 5.5.5 | Add the transaction wrapper (order, items, and state change in one transaction)                                          | ⬜     | 5.5.4      |
| 5.5.6 | Verify: an order is created with frozen prices and tax; an invalid item is rejected; the transaction rolls back on error | ⬜     | 5.5.5      |

### Milestone 5.6 — The order routes

| ID    | Task                                                                                       | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------ | ------ | ---------- |
| 5.6.1 | Add `POST /api/guest/orders`                                                               | ⬜     | 5.5.6      |
| 5.6.2 | Add `GET /api/guest/orders/[id]`                                                           | ⬜     | 5.6.1      |
| 5.6.3 | Add `GET /api/guest/orders`                                                                | ⬜     | 5.6.1      |
| 5.6.4 | Verify: an order can be placed, read, and listed; the response shape matches SYSTEM.md §12 | ⬜     | 5.6.3      |

### Milestone 5.7 — The order confirmation and tracking

| ID    | Task                                                                                                                                        | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.7.1 | Add the order confirmation screen                                                                                                           | ⬜     | 5.6.4      |
| 5.7.2 | Add the order tracking screen with the timeline                                                                                             | ⬜     | 5.7.1      |
| 5.7.3 | Add the "add more items" action                                                                                                             | ⬜     | 5.7.2      |
| 5.7.4 | Add the "call a waiter" and "request the bill" actions                                                                                      | ⬜     | 5.7.2      |
| 5.7.5 | Add the polling on the tracking screen                                                                                                      | ⬜     | 5.7.2      |
| 5.7.6 | Verify: an order placed from a phone appears on the tracking screen with the correct state; the state updates when it changes on the server | ⬜     | 5.7.5      |
| 5.7.7 | Verify the counter loop: guest scans the counter QR, orders with a pickup name, staff marks ready for pickup, staff marks picked up         | ⬜     | 5.7.6      |

### Milestone 5.8 — Menu item state updates

| ID    | Task                                                                                               | Status | Depends on |
| ----- | -------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 5.8.1 | Add the admin action to change a menu item's state                                                 | ⬜     | 5.7.7      |
| 5.8.2 | Add the guest-side refresh when the state changes                                                  | ⬜     | 5.8.1      |
| 5.8.3 | Add the guest-side ping when an item's state changes                                               | ⬜     | 5.8.2      |
| 5.8.4 | Verify: an item marked unavailable by the manager greys out on the guest's screen within 5 seconds | ⬜     | 5.8.3      |

**Acceptance for Phase 5:** A guest can scan a QR, browse the menu, customize an item, add it to the cart, place the order, and see the order's confirmation and tracking. The order's prices and tax are frozen. The order appears in the manager's order list. Changing an item's state from the admin panel updates the guest's screen.

**Visible progress at the end of Phase 5:** A real order placed from a real phone with real prices and real tax.

---

## 9. Phase 6 — The Kitchen

**Goal:** The kitchen screen shows tickets and advances them through their states. The guest's tracking screen reflects the kitchen's actions.

### Milestone 6.1 — The kitchen domain

| ID    | Task                                                                                                                  | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 6.1.1 | Add the order approval action                                                                                         | ⬜     | 5.8.4      |
| 6.1.2 | Add the kitchen start action                                                                                          | ⬜     | 6.1.1      |
| 6.1.3 | Add the kitchen ready action                                                                                          | ⬜     | 6.1.2      |
| 6.1.4 | Add the state-transition validation                                                                                   | ⬜     | 6.1.3      |
| 6.1.5 | Add the state-change records                                                                                          | ⬜     | 6.1.4      |
| 6.1.6 | Verify: the transitions are correct; invalid transitions return `INVALID_STATE`; the state-change records are written | ⬜     | 6.1.5      |

### Milestone 6.2 — The kitchen routes

| ID    | Task                                                                                        | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------- | ------ | ---------- |
| 6.2.1 | Add `GET /api/kitchen/orders`                                                               | ⬜     | 6.1.6      |
| 6.2.2 | Add `POST /api/kitchen/orders/[id]/start`                                                   | ⬜     | 6.2.1      |
| 6.2.3 | Add `POST /api/kitchen/orders/[id]/ready`                                                   | ⬜     | 6.2.2      |
| 6.2.4 | Verify: the kitchen can read its orders and advance them; the responses match SYSTEM.md §12 | ⬜     | 6.2.3      |

### Milestone 6.3 — The kitchen screen

| ID    | Task                                                                                                                                    | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 6.3.1 | Add the ticket grid layout                                                                                                              | ⬜     | 6.2.4      |
| 6.3.2 | Add the ticket card (order number, place, items, modifiers, notes)                                                                      | ⬜     | 6.3.1      |
| 6.3.3 | Add the elapsed time display                                                                                                            | ⬜     | 6.3.2      |
| 6.3.4 | Add the "Start" action                                                                                                                  | ⬜     | 6.3.3      |
| 6.3.5 | Add the "Ready" action                                                                                                                  | ⬜     | 6.3.4      |
| 6.3.6 | Add the dark mode default                                                                                                               | ⬜     | 6.3.5      |
| 6.3.7 | Add the connection state indicator                                                                                                      | ⬜     | 6.3.5      |
| 6.3.8 | Verify: a ticket appears within 5 seconds of approval; the actions advance the ticket; the guest's tracking screen reflects the changes | ⬜     | 6.3.7      |

### Milestone 6.4 — The kitchen ping

| ID    | Task                                             | Status | Depends on |
| ----- | ------------------------------------------------ | ------ | ---------- |
| 6.4.1 | Add the audible ping on new tickets              | ⬜     | 6.3.8      |
| 6.4.2 | Verify: the ping plays when a new ticket arrives | ⬜     | 6.4.1      |

**Acceptance for Phase 6:** An order placed by a guest, approved by staff, and prepared by the kitchen appears on the kitchen screen, advances through Preparing and Ready, and the guest's tracking screen reflects each change.

**Visible progress at the end of Phase 6:** The kitchen screen runs on a real screen with real tickets.

---

## 10. Phase 7 — The Service Staff Queues

**Goal:** The service staff queues show orders and requests, allow one-tap advancement, and close the full order loop from placement to delivery.

### Milestone 7.1 — The staff domain

| ID    | Task                                                                                                      | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.1.1 | Add the delivery action                                                                                   | ⬜     | 6.4.2      |
| 7.1.2 | Add the completion action                                                                                 | ⬜     | 7.1.1      |
| 7.1.3 | Add the cancellation action with a reason                                                                 | ⬜     | 7.1.1      |
| 7.1.4 | Add the table-close action                                                                                | ⬜     | 7.1.3      |
| 7.1.5 | Add the room-checkout action                                                                              | ⬜     | 7.1.3      |
| 7.1.6 | Verify: every action is correct; the state machine is enforced; the guest session is invalidated on close | ⬜     | 7.1.5      |

### Milestone 7.2 — The staff routes

| ID     | Task                                                                                            | Status | Depends on |
| ------ | ----------------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.2.1  | Add `GET /api/staff/orders`                                                                     | ⬜     | 7.1.6      |
| 7.2.2  | Add `POST /api/staff/orders/[id]/advance`                                                       | ⬜     | 7.2.1      |
| 7.2.3  | Add `POST /api/staff/orders/[id]/cancel`                                                        | ⬜     | 7.2.2      |
| 7.2.4  | Add `GET /api/staff/requests`                                                                   | ⬜     | 7.2.1      |
| 7.2.5  | Add `POST /api/staff/requests/[id]/advance`                                                     | ⬜     | 7.2.4      |
| 7.2.6  | Add `POST /api/staff/requests/[id]/cancel`                                                      | ⬜     | 7.2.5      |
| 7.2.7  | Add `POST /api/staff/requests/[id]/decline`                                                     | ⬜     | 7.2.5      |
| 7.2.8  | Add `POST /api/staff/tables/[id]/close`                                                         | ⬜     | 7.2.3      |
| 7.2.9  | Add `POST /api/staff/rooms/[id]/checkout`                                                       | ⬜     | 7.2.8      |
| 7.2.10 | Verify: every route returns the correct envelope and status; the state transitions are enforced | ⬜     | 7.2.9      |

### Milestone 7.3 — The service staff screen

| ID    | Task                                                                                                | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.3.1 | Add the staff layout with the tabs (Orders, Requests, Tables or Rooms)                              | ⬜     | 7.2.10     |
| 7.3.2 | Add the order queue table                                                                           | ⬜     | 7.3.1      |
| 7.3.3 | Add the one-tap "Deliver" action                                                                    | ⬜     | 7.3.2      |
| 7.3.4 | Add the one-tap "Complete" action                                                                   | ⬜     | 7.3.3      |
| 7.3.5 | Add the request queue table                                                                         | ⬜     | 7.3.1      |
| 7.3.6 | Add the request actions (Acknowledge, In Progress, Complete, Cancel, Decline)                       | ⬜     | 7.3.5      |
| 7.3.7 | Add the table map (grid of tables with their states)                                                | ⬜     | 7.3.1      |
| 7.3.8 | Add the room map                                                                                    | ⬜     | 7.3.7      |
| 7.3.9 | Verify: the queues render on a real tablet; actions advance items; the maps show the current states | ⬜     | 7.3.8      |

### Milestone 7.4 — The full loop verification

| ID    | Task                                                                                                                              | Status | Depends on |
| ----- | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 7.4.1 | Verify the full table loop: guest places order, staff approves, kitchen starts, kitchen finishes, staff delivers, staff completes | ⬜     | 7.3.9      |
| 7.4.2 | Verify the full room service loop with the same shape                                                                             | ⬜     | 7.4.1      |
| 7.4.3 | Verify the guest's tracking screen reflects every state change                                                                    | ⬜     | 7.4.2      |
| 7.4.4 | Verify the table close and room checkout end the guest session                                                                    | ⬜     | 7.4.3      |

**Acceptance for Phase 7:** The complete order loop works end to end. A guest places an order, the kitchen and staff advance it, the guest tracks it, and the table is closed and the session ends.

**Visible progress at the end of Phase 7:** A real order, placed by a real guest, advanced by a real kitchen, delivered by real staff, tracked by the guest, and closed at the end.

---

## 11. Phase 8 — The Manager Panel

**Goal:** The manager can see everything, manage the venue's data, and export reports.

### Milestone 8.1 — The dashboard

| ID    | Task                                                                                | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------- | ------ | ---------- |
| 8.1.1 | Add the live metric cards (waiting, in kitchen, ready, revenue today, orders today) | ⬜     | 7.4.4      |
| 8.1.2 | Add the active orders list                                                          | ⬜     | 8.1.1      |
| 8.1.3 | Add the polling on the dashboard                                                    | ⬜     | 8.1.2      |
| 8.1.4 | Verify: the metrics update as orders move                                           | ⬜     | 8.1.3      |

### Milestone 8.2 — Order management

| ID    | Task                                                                                      | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------- | ------ | ---------- |
| 8.2.1 | Add the Active Orders tab                                                                 | ⬜     | 8.1.4      |
| 8.2.2 | Add the Completed Orders tab with date filters                                            | ⬜     | 8.2.1      |
| 8.2.3 | Add the order detail view (items, states, history)                                        | ⬜     | 8.2.2      |
| 8.2.4 | Add the CSV export                                                                        | ⬜     | 8.2.2      |
| 8.2.5 | Verify: the manager can filter orders by any range within 6 months and export them as CSV | ⬜     | 8.2.4      |

### Milestone 8.3 — Menu management

| ID    | Task                                                                        | Status | Depends on |
| ----- | --------------------------------------------------------------------------- | ------ | ---------- |
| 8.3.1 | Add the menu list                                                           | ⬜     | 8.2.5      |
| 8.3.2 | Add the add-item form                                                       | ⬜     | 8.3.1      |
| 8.3.3 | Add the edit-item form                                                      | ⬜     | 8.3.2      |
| 8.3.4 | Add the item state toggle (available, unavailable, hidden)                  | ⬜     | 8.3.3      |
| 8.3.5 | Add the category management                                                 | ⬜     | 8.3.4      |
| 8.3.6 | Add the modifier group and modifier option management                       | ⬜     | 8.3.5      |
| 8.3.7 | Verify: an item can be added, edited, and hidden; the guest sees the change | ⬜     | 8.3.6      |

### Milestone 8.4 — Table and room management

| ID    | Task                                                                        | Status | Depends on |
| ----- | --------------------------------------------------------------------------- | ------ | ---------- |
| 8.4.1 | Add the table list and add/edit forms                                       | ⬜     | 8.3.7      |
| 8.4.2 | Add the room list and add/edit forms                                        | ⬜     | 8.4.1      |
| 8.4.3 | Add the table and room QR management                                        | ⬜     | 8.4.2      |
| 8.4.4 | Add the batch QR print view                                                 | ⬜     | 8.4.3      |
| 8.4.5 | Verify: a table can be added, a QR generated, and the QR printed in a batch | ⬜     | 8.4.4      |

### Milestone 8.5 — Staff management

| ID    | Task                                                                                         | Status | Depends on |
| ----- | -------------------------------------------------------------------------------------------- | ------ | ---------- |
| 8.5.1 | Add the staff list                                                                           | ⬜     | 8.4.5      |
| 8.5.2 | Add the add-staff form                                                                       | ⬜     | 8.5.1      |
| 8.5.3 | Add the edit-staff form                                                                      | ⬜     | 8.5.2      |
| 8.5.4 | Add the role assignment                                                                      | ⬜     | 8.5.3      |
| 8.5.5 | Add the deactivate action                                                                    | ⬜     | 8.5.4      |
| 8.5.6 | Add the password reset action                                                                | ⬜     | 8.5.5      |
| 8.5.7 | Verify: a staff member can be added, given roles, deactivated, and have their password reset | ⬜     | 8.5.6      |

### Milestone 8.6 — Reports

| ID    | Task                                                                              | Status | Depends on |
| ----- | --------------------------------------------------------------------------------- | ------ | ---------- |
| 8.6.1 | Add the sales report (by day)                                                     | ⬜     | 8.5.7      |
| 8.6.2 | Add the sales report by week                                                      | ⬜     | 8.6.1      |
| 8.6.3 | Add the sales report by month                                                     | ⬜     | 8.6.2      |
| 8.6.4 | Add the custom range report (up to 6 months)                                      | ⬜     | 8.6.3      |
| 8.6.5 | Add the CSV export                                                                | ⬜     | 8.6.4      |
| 8.6.6 | Verify: a report can be filtered by any range within 6 months and exported as CSV | ⬜     | 8.6.5      |

### Milestone 8.7 — Settings and modules

| ID    | Task                                                                       | Status | Depends on |
| ----- | -------------------------------------------------------------------------- | ------ | ---------- |
| 8.7.1 | Add the settings screen (venue name, address, tax rate, currency)          | ⬜     | 8.6.6      |
| 8.7.2 | Add the module toggles                                                     | ⬜     | 8.7.1      |
| 8.7.3 | Add the service toggles                                                    | ⬜     | 8.7.2      |
| 8.7.4 | Verify: turning a module off hides its screens; turning it on reveals them | ⬜     | 8.7.3      |

**Acceptance for Phase 8:** The manager can log in and use every screen. The dashboard shows live metrics. Orders can be filtered and exported. The menu, tables, rooms, staff, and settings can all be managed. Reports can be generated for any range up to 6 months and exported as CSV. Modules and services can be toggled.

**Visible progress at the end of Phase 8:** A manager runs the venue's operation from a single panel.

---

## 12. Phase 9 — Hotel Services

**Goal:** The guest can submit service requests, and the staff queues handle them.

### Milestone 9.1 — The service request domain

| ID    | Task                                                                                                  | Status | Depends on |
| ----- | ----------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 9.1.1 | Add the `createRequest` domain function                                                               | ⬜     | 8.7.4      |
| 9.1.2 | Add the `advanceRequest` domain function                                                              | ⬜     | 9.1.1      |
| 9.1.3 | Add the `cancelRequest` domain function                                                               | ⬜     | 9.1.2      |
| 9.1.4 | Add the `declineRequest` domain function                                                              | ⬜     | 9.1.3      |
| 9.1.5 | Add the edit-while-submitted rule                                                                     | ⬜     | 9.1.1      |
| 9.1.6 | Verify: every function is correct; the state machine is enforced; the guest's edit window is enforced | ⬜     | 9.1.5      |

### Milestone 9.2 — The service request routes

| ID    | Task                                                              | Status | Depends on |
| ----- | ----------------------------------------------------------------- | ------ | ---------- |
| 9.2.1 | Add `POST /api/guest/requests`                                    | ⬜     | 9.1.6      |
| 9.2.2 | Add `PATCH /api/guest/requests/[id]`                              | ⬜     | 9.2.1      |
| 9.2.3 | Add `POST /api/guest/requests/[id]/cancel`                        | ⬜     | 9.2.2      |
| 9.2.4 | Add `GET /api/guest/requests`                                     | ⬜     | 9.2.1      |
| 9.2.5 | Verify: a request can be submitted, edited, cancelled, and listed | ⬜     | 9.2.4      |

### Milestone 9.3 — The guest service catalog

| ID     | Task                                                          | Status | Depends on |
| ------ | ------------------------------------------------------------- | ------ | ---------- |
| 9.3.1  | Add the service catalog grid (the services the venue enables) | ⬜     | 9.2.5      |
| 9.3.2  | Add the room service food form (reuses the menu flow)         | ⬜     | 9.3.1      |
| 9.3.3  | Add the housekeeping form                                     | ⬜     | 9.3.1      |
| 9.3.4  | Add the maintenance form (with photo upload)                  | ⬜     | 9.3.1      |
| 9.3.5  | Add the concierge form                                        | ⬜     | 9.3.1      |
| 9.3.6  | Add the laundry form                                          | ⬜     | 9.3.1      |
| 9.3.7  | Add the spa form                                              | ⬜     | 9.3.1      |
| 9.3.8  | Add the late checkout form                                    | ⬜     | 9.3.1      |
| 9.3.9  | Add the wake-up call form                                     | ⬜     | 9.3.1      |
| 9.3.10 | Add the do-not-disturb toggle                                 | ⬜     | 9.3.1      |
| 9.3.11 | Verify: each form submits and the request is stored           | ⬜     | 9.3.10     |

### Milestone 9.4 — The guest's requests view

| ID    | Task                                                                                        | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------------- | ------ | ---------- |
| 9.4.1 | Add the combined requests view                                                              | ⬜     | 9.3.11     |
| 9.4.2 | Add the request detail view with the timeline                                               | ⬜     | 9.4.1      |
| 9.4.3 | Add the edit and cancel actions (while Submitted)                                           | ⬜     | 9.4.2      |
| 9.4.4 | Verify: a guest sees all their active requests; a request's status updates as the staff act | ⬜     | 9.4.3      |

### Milestone 9.5 — The staff request queues

| ID    | Task                                                                                  | Status | Depends on |
| ----- | ------------------------------------------------------------------------------------- | ------ | ---------- |
| 9.5.1 | Add the housekeeping queue                                                            | ⬜     | 9.4.4      |
| 9.5.2 | Add the maintenance queue                                                             | ⬜     | 9.5.1      |
| 9.5.3 | Add the concierge queue                                                               | ⬜     | 9.5.2      |
| 9.5.4 | Add the laundry queue                                                                 | ⬜     | 9.5.3      |
| 9.5.5 | Add the spa queue                                                                     | ⬜     | 9.5.4      |
| 9.5.6 | Add the front desk combined view                                                      | ⬜     | 9.5.5      |
| 9.5.7 | Verify: each queue shows its requests; actions advance them; the guest's view updates | ⬜     | 9.5.6      |

**Acceptance for Phase 9:** A hotel guest can submit a service request of any enabled type, track it, edit or cancel it while it is still submitted, and see it completed. The staff queues handle every service type.

**Visible progress at the end of Phase 9:** A real hotel guest in a real room submits a real request and a real staff member completes it.

---

## 13. Phase 10 — Payments, Polish, Production

**Goal:** The payment bridge is wired, the product is accessible, the product is fast, and the product is in production.

### Milestone 10.1 — The payment bridge

| ID     | Task                                                                                                 | Status | Depends on |
| ------ | ---------------------------------------------------------------------------------------------------- | ------ | ---------- |
| 10.1.1 | Add the payment ticket domain                                                                        | ⬜     | 9.5.7      |
| 10.1.2 | Add the ticket creation route                                                                        | ⬜     | 10.1.1     |
| 10.1.3 | Add the confirmation route                                                                           | ⬜     | 10.1.2     |
| 10.1.4 | Add the verification step                                                                            | ⬜     | 10.1.3     |
| 10.1.5 | Add the receipt generation                                                                           | ⬜     | 10.1.4     |
| 10.1.6 | Add the cash-at-counter path                                                                         | ⬜     | 10.1.5     |
| 10.1.7 | Add the tip field                                                                                    | ⬜     | 10.1.6     |
| 10.1.8 | Add the placeholder provider adapter                                                                 | ⬜     | 10.1.7     |
| 10.1.9 | Verify: a ticket is created, a callback is verified, a receipt is generated, and the cash path works | ⬜     | 10.1.8     |

### Milestone 10.2 — Accessibility and polish

| ID     | Task                                            | Status | Depends on |
| ------ | ----------------------------------------------- | ------ | ---------- |
| 10.2.1 | Audit keyboard navigation on every guest screen | ⬜     | 10.1.9     |
| 10.2.2 | Audit screen reader compatibility               | ⬜     | 10.2.1     |
| 10.2.3 | Audit contrast                                  | ⬜     | 10.2.2     |
| 10.2.4 | Audit reduced-motion handling                   | ⬜     | 10.2.3     |
| 10.2.5 | Audit every empty state                         | ⬜     | 10.2.4     |
| 10.2.6 | Audit every error state                         | ⬜     | 10.2.5     |
| 10.2.7 | Verify: every screen passes the audit           | ⬜     | 10.2.6     |

### Milestone 10.3 — Performance

| ID     | Task                                                           | Status | Depends on |
| ------ | -------------------------------------------------------------- | ------ | ---------- |
| 10.3.1 | Measure the guest landing screen's first-paint time            | ⬜     | 10.2.7     |
| 10.3.2 | Optimise the landing screen to under 1 second on 4G            | ⬜     | 10.3.1     |
| 10.3.3 | Measure the kitchen screen's refresh and rendering             | ⬜     | 10.3.2     |
| 10.3.4 | Measure the guest's tracking screen's refresh                  | ⬜     | 10.3.3     |
| 10.3.5 | Verify: the performance targets from D-15.5 and D-15.6 are met | ⬜     | 10.3.4     |

### Milestone 10.4 — The real-venue dry run

| ID     | Task                                                          | Status | Depends on |
| ------ | ------------------------------------------------------------- | ------ | ---------- |
| 10.4.1 | Deploy the product to a hosting environment                   | ⬜     | 10.3.5     |
| 10.4.2 | Configure the venue's real data (menu, tables, rooms, staff)  | ⬜     | 10.4.1     |
| 10.4.3 | Print and place the real QR codes                             | ⬜     | 10.4.2     |
| 10.4.4 | Run a full meal service with real guests and real staff       | ⬜     | 10.4.3     |
| 10.4.5 | Run a full housekeeping cycle with real guests and real staff | ⬜     | 10.4.4     |
| 10.4.6 | Collect feedback and address any issues found                 | ⬜     | 10.4.5     |
| 10.4.7 | Verify: the product runs a real service end to end            | ⬜     | 10.4.6     |

### Milestone 10.5 — Documentation and handover

| ID     | Task                                                                   | Status | Depends on |
| ------ | ---------------------------------------------------------------------- | ------ | ---------- |
| 10.5.1 | Write the deployment documentation                                     | ⬜     | 10.4.7     |
| 10.5.2 | Write the backup and recovery procedure                                | ⬜     | 10.5.1     |
| 10.5.3 | Write the venue onboarding checklist for the developer                 | ⬜     | 10.5.2     |
| 10.5.4 | Write the staff training notes                                         | ⬜     | 10.5.3     |
| 10.5.5 | Verify: the developer can onboard a new venue from the checklist alone | ⬜     | 10.5.4     |

**Acceptance for Phase 10:** The product is deployed, the payment bridge is wired, the product is accessible and fast, and a real venue has run a real service with real guests and real staff.

**Visible progress at the end of Phase 10:** The product is in production and used by a real venue.

---

## 14. The Dependency Graph

The critical path — the sequence that cannot be shortened — is:

```
0.6
 → 1.1.1 (repo)
 → 1.5.4 (dev server)
 → 2.1.12 (schema)
 → 2.2.9 (repositories)
 → 2.3.8 (seed)
 → 3.1.4 (session)
 → 3.6.4 (placeholder dashboards)
 → 4.1.5 (QR domain)
 → 4.4.7 (guest landing)
 → 5.5.6 (order domain)
 → 5.7.6 (order tracking)
 → 6.3.8 (kitchen screen)
 → 7.4.4 (full loop)
 → 8.7.4 (settings and modules)
 → 9.5.7 (all service queues)
 → 10.1.9 (payment bridge)
 → 10.4.7 (real-venue dry run)
```

Every task on this path is a blocker for the next. Tasks off the path can be reordered within their phase, but the path is fixed.

**The tasks that can run in parallel if two developers are available:**

- Phase 1: tokens can be authored while the base components are installed.
- Phase 2: the schema can be finalised while the seed's content is being written.
- Phase 3: the login screens can be built while the middleware is being built.
- Phase 5: the cart screen can be built while the order domain is being written.
- Phase 8: the reports can be built while the menu management is being built.
- Phase 9: the guest forms can be built while the staff queues are being built.

For a single developer, the order in the phase tables is the right order.

---

## 15. The Rule for Starting a Task

A task can start when:

1. Every task it depends on is `✅ Complete`.
2. The task has a clear objective (one or two sentences).
3. The task has a scope (the files it will touch).
4. The task has acceptance criteria that can be verified with raw evidence.
5. The task has a rollback.
6. The previous task's report has been read.

If any of these is missing, the task is not ready. The developer does not start an unready task.

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

The developer stops after the report. The next session begins with the next task.

---

## 17. The Rule for Updating This File

This file is updated at the end of every session:

- The completed task's status is changed from `🟨 In progress` to `✅ Complete`.
- The next task's status is changed from `⬜ Not started` to `🟨 In progress` at the start of the next session, not before.
- If a task is blocked, its status is changed to `🟥 Blocked` and the blocking reason is recorded in the report.
- If a task is deferred, its status is changed to `🔵 Deferred` and the reason is recorded in DECISIONS.md.
- If a new task is discovered mid-phase, it is added to the phase's table at the correct position and its dependency is recorded.
- If a task is split, the original task's status is changed to `✅ Complete` with a note pointing to the new tasks, and the new tasks are added to the table.

The file is never rewritten wholesale. It grows and updates as the project moves. It is the live board the developer consults at the start of every session.

---