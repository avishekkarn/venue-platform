# SYSTEM.md — The Shape of the System

**Version:** 2.0
**Status:** Approved
**Approved:** 2026-10-15
**Purpose:** Describe the shape of the system that follows from PRODUCT.md and DECISIONS.md. This file owns the layers, the boundaries, the data model, the interfaces, the flows, the authentication, the order and request lifecycles, the real-time strategy, and the security boundaries. It does not own the product (PRODUCT.md) or the reasons (DECISIONS.md).

**How to read this file:** Every section traces back to a decision in DECISIONS.md. If a section describes something that is not covered by a decision, the decision must be added first, in DECISIONS.md, before the shape is written here. Nothing in this file contradicts DECISIONS.md or PRODUCT.md. If a contradiction is found, DECISIONS.md wins and this file is corrected.

---

## Table of Contents

1. The Architectural Style
2. The Layers and the Dependency Direction
3. The Folder Structure
4. The Domain Modules
5. The Result Contract
6. Authentication and Sessions
7. The Role and Permission Model
8. The QR Context Resolution
9. The Order Lifecycle
10. The Service Request Lifecycle
11. The Data Model
12. The API Surface
13. The Payment Bridge
14. The Real-Time Strategy
15. The Security Boundaries
16. The Error and Failure Model
17. The Configuration Model
18. The Backup and Recovery Model
19. The Deployment Model
20. What This File Does Not Define

---

## 1. The Architectural Style

**A single deployable web application — a modular monolith.**

One codebase, one deployment, one database per venue. The application is built in Next.js using the App Router. Server-rendered pages handle the guest, staff, kitchen, and manager experiences. API routes handle the browser-driven actions (placing an order, advancing an order's state, submitting a request). Server-side logic handles the QR resolution, session validation, and business rules.

**Why a modular monolith and not microservices:**

- The venue is a single business with a single database. Splitting it into services would add operational cost without benefit.
- The product is deployed per venue. Each venue is a small installation. Microservices would multiply the deployments.
- The team is small. A single deployable is easier to maintain, test, and reason about than a distributed system.

**Why not a single-layer application:**

- The product has strict boundaries (guest logic must never touch the database directly, staff logic must never trust the guest's input, the kitchen must never see the guest's identity). A layered design enforces these boundaries and keeps the code honest as it grows.

**The modular monolith is layered, not flat.** The layers are described in §2. The modules are described in §4. The dependency direction is inward: outer layers know about inner layers, never the reverse.

*Traces to:* D-14.1 (portable), D-15.7 (structure correct from the beginning), D-10.1 (one venue per installation).

---

## 2. The Layers and the Dependency Direction

There are three layers. Dependencies flow inward: presentation depends on domain, domain depends on infrastructure, infrastructure depends on the database.

```
┌──────────────────────────────────────────────────────────┐
│  Presentation Layer                                      │
│  Pages, layouts, components, API routes.                 │
│  Knows how to render, how to read a request,             │
│  and how to call the domain.                             │
└──────────────────────┬───────────────────────────────────┘
                       │ depends on
┌──────────────────────▼───────────────────────────────────┐
│  Domain Layer                                            │
│  Business rules, state machines, validation,             │
│  pricing, lifecycle transitions.                         │
│  Knows nothing about HTTP, React, or the database.       │
└──────────────────────┬───────────────────────────────────┘
                       │ depends on
┌──────────────────────▼───────────────────────────────────┐
│  Infrastructure Layer                                    │
│  Database access, session storage, password hashing,     │
│  payment bridge, external adapters.                      │
│  The only layer that talks to the database.              │
└──────────────────────┬───────────────────────────────────┘
                       │ uses
┌──────────────────────▼───────────────────────────────────┐
│  PostgreSQL (or any compatible database)                 │
└──────────────────────────────────────────────────────────┘
```

**Allowed imports:**

| From → To | Presentation | Domain | Infrastructure |
|-----------|--------------|--------|----------------|
| Presentation | — | yes | no (except via domain) |
| Domain | no | — | yes |
| Infrastructure | no | no | — |

**Forbidden imports:**

- The database client may only be imported inside the infrastructure layer. Never in a page, a component, or a domain function.
- The infrastructure layer may never import from the domain layer or the presentation layer.
- The domain layer may never import from the presentation layer or from React.
- No circular imports between modules.

**Ports and adapters.** The two statements above — "the domain depends on infrastructure" and "the domain knows nothing about the database" — are consistent, and the pattern that makes them consistent is ports and adapters.

The domain defines **interfaces** (ports) that it needs. For example, `src/domain/orders/` defines an `OrderRepository` interface — a TypeScript `interface` with methods like `create`, `findById`, `listForVenue`, `advance`. The interface lives in the domain layer, next to the domain function that uses it. It contains only the domain's own types (the `Order` shape, the `Result` type, the `DomainErrorCode` enum). It does not name the database, Prisma, or SQL.

The infrastructure layer provides **implementations** (adapters) of those interfaces. For example, `src/infrastructure/db/repositories/order.repo.ts` exports a function that constructs an object satisfying the `OrderRepository` interface, backed by Prisma. That file is the only place the database client is imported for orders.

The **composition layer** wires them together. In a Server Component or an API route, the code that calls a domain function constructs the adapter and passes it to the domain function. The domain function receives an object that satisfies its `OrderRepository` interface. It never knows whether the object is backed by Prisma, by an in-memory test double, or by anything else.

Three consequences follow, and they are the reason the pattern exists:

1. The domain layer's dependencies are on interfaces it defines, not on the infrastructure. The arrow in the diagram points from domain to infrastructure only because the composition layer, which sits in the presentation layer, imports both. The domain's own imports are interfaces.
2. The domain layer is testable without a database. A unit test constructs an in-memory implementation of the `OrderRepository` interface and passes it to `createOrder`. The test runs in milliseconds and never touches Prisma.
3. A session that writes a domain function cannot accidentally import the database client. If it tries, the TypeScript build fails — the domain function's signature takes the interface, not the adapter, and the adapter is only available in the composition layer.

**Where the interfaces live:** in the domain module that owns the data. `OrderRepository` lives in `src/domain/orders/`. `MenuRepository` lives in `src/domain/menu/`. Each domain module owns its ports.

**Where the implementations live:** in `src/infrastructure/db/repositories/`. One file per repository. The file exports a function that constructs the adapter. The function name is the interface name plus `Prisma` (for example, `createPrismaOrderRepository`), so a reader knows immediately that it is the Prisma adapter.

**Where the wiring happens:** in the composition layer — the API route or the Server Component. The route imports the domain function and the infrastructure adapter, constructs the adapter, and calls the domain function with the adapter as an argument. Nothing in the domain layer knows about the adapter. Nothing in the infrastructure layer knows about the domain functions.

**Why this matters:** The guest screens must never be able to run a database query. The staff screens must never trust a guest-supplied price. The kitchen screen must never see a guest's identity. The layering enforces these rules by making the wrong import impossible without a deliberate effort. The ports-and-adapters pattern is what makes the layering concrete: the domain layer defines its needs; the infrastructure layer fulfills them; the composition layer connects them.

*Traces to:* D-15.7 (structure correct from the beginning).

---

## 3. The Folder Structure

The repository is organized so that every file has one obvious place. The folder structure is the physical expression of the layers in §2.

```
/
├── app/                                The presentation layer (Next.js App Router)
│   ├── (guest)/                        The guest experience
│   │   ├── qr/[token]/                 The QR landing (resolves context)
│   │   ├── menu/                       Menu browsing
│   │   ├── cart/                       Cart review
│   │   ├── order/                      Order confirmation and tracking
│   │   └── services/                   Hotel service catalog and request forms
│   ├── admin/                          The manager panel
│   │   ├── dashboard/                  Live metrics
│   │   ├── orders/                     Active and completed orders
│   │   ├── menu/                       Menu management
│   │   ├── tables/                     Table management (when the table module is on)
│   │   ├── rooms/                      Room management (when the room module is on)
│   │   ├── qr/                         QR code management
│   │   ├── staff/                      Staff management
│   │   ├── reports/                    Reports and CSV export
│   │   ├── payments/                   Payment bridge configuration
│   │   ├── modules/                    Module toggles
│   │   └── settings/                   Venue settings
│   ├── staff/                          The service staff queues
│   │   ├── table/                      Table service
│   │   ├── room/                       Room service
│   │   ├── housekeeping/               Housekeeping queue
│   │   ├── maintenance/                Maintenance queue
│   │   ├── concierge/                  Concierge queue
│   │   ├── laundry/                    Laundry queue
│   │   ├── spa/                        Spa queue
│   │   └── front-desk/                 Combined room request view
│   ├── kitchen/                        The kitchen screen
│   ├── api/                            API routes (the browser-facing endpoints)
│   │   ├── auth/                       Login, logout, session
│   │   ├── guest/                      Guest actions (order, request, track)
│   │   ├── staff/                      Staff actions (advance, acknowledge)
│   │   ├── kitchen/                    Kitchen actions (start, ready)
│   │   ├── admin/                      Manager actions
│   │   └── payments/                   Payment bridge callbacks
│   ├── layout.tsx                      The root layout
│   ├── globals.css                     Design tokens
│   └── not-found.tsx                   The 404 screen
│
├── src/
│   ├── domain/                         The domain layer
│   │   ├── organization/               Venue resolution, configuration
│   │   ├── auth/                       Session validation, role checks
│   │   ├── menu/                       Menu retrieval, item state
│   │   ├── orders/                     Order creation, pricing, lifecycle
│   │   ├── requests/                   Service request creation, lifecycle
│   │   ├── qr/                         Token generation, resolution, revocation
│   │   ├── payments/                   Payment bridge domain rules
│   │   └── shared/                     The Result type, error codes, shared rules
│   │
│   ├── infrastructure/                 The infrastructure layer
│   │   ├── db/                         The database client and repositories
│   │   ├── auth/                       Session storage, password hashing
│   │   ├── qr/                         QR image generation
│   │   ├── payments/                   Payment bridge adapters
│   │   └── config/                     Venue configuration loader
│   │
│   ├── components/                     The presentation components
│   │   ├── ui/                         Base components (buttons, inputs, dialogs)
│   │   ├── hospitality/                Shared domain components (status badges, price display)
│   │   ├── guest/                      Guest-only components
│   │   └── staff/                      Staff-only components
│   │
│   ├── motion/                         Motion utilities, one per atmosphere
│   │   ├── guest.ts                    Guest-side motion variants
│   │   └── staff.ts                    Staff-side motion (functional only)
│   │
│   └── lib/                            Truly generic utilities
│
├── prisma/
│   ├── schema.prisma                   The data model (translated from §11)
│   ├── migrations/                     Generated migrations
│   └── seed.ts                         The seed script (one venue, real data)
│
├── tests/
│   ├── unit/                           Domain tests
│   ├── integration/                    API and database tests
│   └── end-to-end/                     Full-loop tests
│
├── docs/                               The project documents
│   ├── PRODUCT.md
│   ├── DECISIONS.md
│   ├── SYSTEM.md (this file)
│   ├── BUILD.md
│   ├── ROADMAP.md
│   └── PROGRESS.md
│
└── public/                             Static assets
```

**Every file must fit one of these locations.** If a new file does not fit, the structure is wrong and the change must be discussed before the file is created.

*Traces to:* D-15.7 (structure correct from the beginning), §2 (the layers).

---

## 4. The Domain Modules

The domain layer is divided into modules. Each module owns a slice of the business. Modules communicate through their public functions, never through shared mutable state.

| Module | Owns | Example exports |
|--------|------|----------------|
| `organization` | Venue resolution, venue configuration, module toggles, branding values (read from configuration) | `getVenue()`, `getEnabledModules()`, `getVenueLanguage()` |
| `auth` | Session validation, login, logout, role checks, permission checks | `login(username, password)`, `getSession(token)`, `logout(token)`, `canAccess(session, area)` |
| `menu` | Menu retrieval, item state (available, unavailable, hidden), modifier resolution | `getMenu()`, `getMenuItem(id)`, `isOrderable(itemId)` |
| `orders` | Order creation, price computation, tax snapshot, state machine, cancellation | `createOrder(input)`, `advanceOrder(orderId, nextState, staffId)`, `cancelOrder(orderId, reason, staffId)` |
| `requests` | Service request creation, state machine, cancellation, decline | `createRequest(input)`, `advanceRequest(requestId, nextState, staffId)`, `cancelRequest(requestId, by, reason)` |
| `qr` | Token generation, resolution, revocation | `generateToken(venueId, placeType, placeId)`, `resolveToken(token)`, `revokeToken(token)` |
| `payments` | The payment bridge's domain rules: ticket creation, confirmation verification, receipt generation | `createTicket(orderId, amount)`, `confirmTicket(ticketId, providerRef)`, `verifyTicket(ticketId)` |
| `shared` | The Result type, error codes, shared validators, shared time and money helpers | `ok(value)`, `fail(code, message)`, `Result<T>` |

**Rules:**

- A domain function never imports another domain module's internals. Only its public exports.
- A domain function never touches HTTP, cookies, or React.
- A domain function returns a `Result<T>` (see §5) for any operation that can fail for a business reason.

*Traces to:* §2 (the layers), §5 (the Result contract).

---

## 5. The Result Contract

Every public function in the domain layer that can fail for a business reason returns a `Result<T>`. The `Result<T>` is the domain's way of saying "this worked" or "this failed for a known reason" without throwing an exception.

```ts
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };

export interface DomainError {
  code: DomainErrorCode;
  message: string;   // safe to show to a human
}

export enum DomainErrorCode {
  NOT_FOUND          = 'NOT_FOUND',          // 404
  UNAUTHORIZED       = 'UNAUTHORIZED',       // 401
  FORBIDDEN          = 'FORBIDDEN',          // 403
  VALIDATION_FAILED  = 'VALIDATION_FAILED',  // 400
  CONFLICT           = 'CONFLICT',           // 409
  INVALID_STATE      = 'INVALID_STATE',      // 409 (state machine violation)
  RATE_LIMITED       = 'RATE_LIMITED',       // 429
  INTERNAL           = 'INTERNAL',           // 500 (programming error)
}

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (code: DomainErrorCode, message: string): Result<never> => ({
  ok: false,
  error: { code, message },
});
```

**Rules:**

1. Expected business failures are returned, not thrown.
2. `null` is never returned to signal failure. Use `fail`.
3. Only true programming errors (a null dereference, an invariant violation) may throw.
4. Database errors are wrapped into `DomainError` at the infrastructure boundary, never leaked upward as database types.
5. API routes translate a failed `Result` into the correct HTTP status.

**The mapping from `DomainErrorCode` to HTTP status:**

| Code | HTTP status |
|------|-------------|
| `NOT_FOUND` | 404 |
| `UNAUTHORIZED` | 401 |
| `FORBIDDEN` | 403 |
| `VALIDATION_FAILED` | 400 |
| `CONFLICT` | 409 |
| `INVALID_STATE` | 409 |
| `RATE_LIMITED` | 429 |
| `INTERNAL` | 500 |

*Traces to:* §2 (the layers), D-15.7 (structure correct from the beginning).

---

## 6. Authentication and Sessions

### 6.1 The two kinds of identity

The product has two kinds of identity:

- **The guest** — anonymous, tied to the QR context, no account, no password.
- **The staff member** — identified by a username and password, with a session that lasts until they log out.

### 6.2 The guest session

When a guest scans a QR code, the server:

1. Resolves the token to a venue and a place (table, room, or counter).
2. Validates the venue is active and the token is not revoked.
3. Creates a guest session tied to that venue and that place.
4. Sets a cookie that carries the session.
5. Redirects the guest to the appropriate guest experience for that place.

The guest session carries:

- The venue's internal identifier.
- The place's internal identifier.
- The place's type (table, room, counter).

The guest session does **not** carry:

- Any personal detail.
- Any history.
- Any preference.

The guest session ends when the venue's staff close the table or check out the room (per D-2.3). The session is also invalidated if the QR code is revoked.

### 6.3 The staff session

When a staff member logs in:

1. They enter a username and password.
2. The server looks up the staff member by username within the venue.
3. The server verifies the password.
4. If successful, the server creates a staff session and sets a cookie that carries the session token.

The staff session carries:

- The staff member's internal identifier.
- The staff member's roles.
- The venue's internal identifier.

The staff session lasts until the staff member logs out (per D-3.2). Only one session per staff member at a time (per D-3.4). Changing the password invalidates all sessions (per D-3.3).

### 6.4 The cookie names

- `venue_guest` — the guest session cookie.
- `venue_staff` — the staff session cookie.

Both cookies are HTTP-only, secure in production, and SameSite set appropriately for the flow.

### 6.5 The enforcement layers

| Layer | Where it checks | What it checks |
|-------|-----------------|----------------|
| Middleware | At the edge, before the page loads | Presence of a staff cookie for staff, kitchen, and admin routes |
| Page or route handler | At the start of the request | Full session validation, role check, and venue match |
| Domain | Inside the business function | The venue's scope, the resource's venue, the acting staff member |

A request that fails any layer is either redirected (middleware) or rejected (page, route, domain).

*Traces to:* D-2.1 (guest anonymous), D-2.3 (guest session ends on close), D-2.5 (no previous guest's data), D-3.1 to D-3.8 (staff identity), D-10.1 (one venue per installation).

---

## 7. The Role and Permission Model

### 7.1 The roles

A staff member can hold one or more of the following roles (per D-3.6):

| Role | Sees | Can act on |
|------|------|------------|
| Owner | Everything | Everything, except actions explicitly reserved for the developer |
| Manager | Everything except the developer-only configuration | Everything within the venue |
| Chef | The kitchen screen | Kitchen tickets |
| Table Service | The table service queue | Table orders |
| Room Service | The room service queue | Room orders |
| Housekeeping | The housekeeping queue | Housekeeping requests |
| Maintenance | The maintenance queue | Maintenance requests |
| Concierge | The concierge queue | Concierge requests |
| Laundry | The laundry queue | Laundry requests |
| Spa | The spa queue | Spa bookings |
| Front Desk | The combined room requests view | Any room request |

### 7.2 The checks

- The staff's role decides which queue they see.
- Any staff member with an active session can advance an order state (per D-4.9).
- The manager can assign any role to any staff member.
- The owner can do everything the manager can do.

### 7.3 The role storage

A staff member's roles are stored with their account. A role is a value, not a hierarchy. A staff member with the roles `Manager` and `Chef` sees both the manager panel and the kitchen screen, and can act in both.

*Traces to:* D-3.6 (multiple roles), D-3.7 (deactivated staff keep history), D-4.9 (any staff can advance an order).

---

## 8. The QR Context Resolution

### 8.1 The token

A QR token is a random, opaque identifier (per D-1.2). It is not a human-readable name, not a sequential number, and not a signed payload. It is a UUID generated by the server.

### 8.2 The token's data

A token is stored in the database and carries:

- The venue's internal identifier.
- The place's internal identifier (table, room, or counter).
- The place's type.
- A state: active or revoked.
- A created date and a revoked date (if applicable).

### 8.3 The resolution flow

When a QR is scanned, the server:

1. Reads the token from the URL.
2. Looks up the token in the database.
3. If not found, or revoked, or the venue is inactive, shows a friendly "This QR is no longer active" screen.
4. If found and active, resolves the venue and the place.
5. Creates a guest session tied to that venue and that place.
6. Sets the guest cookie.
7. Redirects the guest to the right experience:
   - A table token opens the guest menu.
   - A room token opens the guest service catalog.
   - A counter token opens the guest menu with a pickup-name field.

### 8.4 The revocation

When a manager revokes a token:

- The token's state is set to revoked.
- The revoked date is recorded.
- Any guest sessions tied to that token are invalidated.
- Any subsequent scan shows the "no longer active" screen.

### 8.5 The generation

When a manager generates a token for a table, room, or counter:

- A new random token is created.
- A row is inserted for the token with the venue, the place, and the type.
- The token is shown in the admin panel with a QR image and download and print options.

The token is never reused, even after revocation.

### 8.6 The implementation contract

The QR implementation contract is fixed and is written out in full in DECISIONS.md D-16.2. It is repeated here in implementation terms so that Phase 4's tasks have a single authoritative reference.

- The token is an **opaque UUID**. It is never a sequential database ID, never a human-readable name, and never a signed payload. A guest cannot guess another guest's token by incrementing a number.
- The token's state is `active` or `revoked`. Revocation is a **state change**, not a delete. The row remains, with a `revoked_at` timestamp. This is what makes D-1.2's "a QR that no longer resolves shows a friendly screen" possible while preserving history.
- When a token is revoked, any active guest sessions tied to it are invalidated **immediately**. The next scan of the revoked token shows the "no longer active" screen.
- A revoked token is **never reused**. Reissuing a QR for the same table, room, or counter creates a new token with a new UUID. The old token stays in the table for history.
- The token carries the venue's internal identifier, the place's internal identifier, and the place's type. The resolution does not trust anything the guest supplies. The URL path segment is the token, and that is the entire input.

**The resolution path is a single indexed lookup** on the token column. The revocation path is a single-row update plus a session invalidation. Both are fast, and both are the only paths that exist.

Phase 4's implementation (Tasks 4.1.1 through 4.1.5 and 4.3.1 through 4.3.4) is written against this contract. If a task would violate any of these rules, the task is wrong, not the contract.

*Traces to:* D-1.1, D-1.2, D-1.3 (QR is the only entry point, tied to internal identity), D-2.5 (room privacy), D-16.2 (the QR implementation contract).

---

## 9. The Order Lifecycle

### 9.1 The states

An order moves through the following states (per D-4.8):

| State | Meaning | Who sees it |
|-------|---------|-------------|
| Placed | The guest has submitted the order. | The guest, the staff queue, the manager |
| Approved | A staff member has accepted it. | The guest, the staff queue, the kitchen, the manager |
| Preparing | The kitchen has started it. | The guest, the staff queue, the kitchen, the manager |
| Ready | The kitchen has finished it. | The guest, the staff queue, the kitchen, the manager |
| Delivered | The order has reached the table or room. | The guest, the staff queue, the manager |
| Completed | The order is closed and paid. | The guest, the manager |
| Cancelled | The order was cancelled with a reason. | The guest, the manager |

### 9.2 The allowed transitions

```
Placed     → Approved     (staff approval)
Placed     → Cancelled    (staff cancellation)

Approved   → Preparing    (kitchen start)
Approved   → Cancelled    (staff cancellation)

Preparing  → Ready        (kitchen finish)
Preparing  → Cancelled    (staff cancellation)

Ready      → Delivered    (staff delivery)
Ready      → Cancelled    (staff cancellation)

Delivered  → Completed    (staff completion, or payment)

Cancelled  → (terminal)
Completed  → (terminal)
```

No other transitions are allowed.

### 9.3 The enforcement

- The transition rules are enforced by the domain, not by the UI.
- An invalid transition returns `INVALID_STATE` with a message.
- Every successful transition writes a record of the transition: the state, the time, and the staff member who made the change.
- The guest cannot make a transition directly. The guest can only place an order.

### 9.4 The pricing at creation

When an order is created:

- The server reads each item's current price, name, and modifier details from the database.
- The server computes the line total for each item, the subtotal, the tax, and the total.
- The server stores all of these values with the order (per D-4.1).
- The server never trusts a price the client supplies.

### 9.5 The tax

The tax rate is read from the venue's configuration (per D-4.3) at the moment of ordering, applied to the subtotal, and stored with the order (per D-4.4). Changing the venue's tax rate later does not affect this order.

### 9.6 The second-wave order

A guest who has already placed an order and wants to add more places a new order (per D-4.6). The new order is separate. Both orders appear on the guest's tracking screen. Both count toward the same bill.

### 9.7 The idempotency contract

Every create-order request carries a **client-generated idempotency key**. The key is a UUID the guest's phone generates once, before the first attempt to send the order. The key is sent with the request, stored with the order under a **unique constraint**, and checked before the order is written.

The contract, in full:

- The API route accepts the key in the request body. If the key is missing or malformed, the route returns `VALIDATION_FAILED` before calling the domain.
- The domain's `createOrder` function takes the key as an input. It passes the key to the order repository.
- The order repository's `create` method writes the order and the key in the same transaction. If a row with the same key already exists, the repository returns the existing order rather than inserting a new one. The unique constraint on the key column is what enforces this at the database level; the repository catches the uniqueness violation and reads the existing row.
- The domain returns `ok(existingOrder)` in both cases — whether the order was newly created or returned from a previous attempt. The API route returns the same `{ "data": ... }` envelope either way. The guest's phone cannot tell whether the order was new or a retry, and it does not need to.
- A retried request with the same key returns the same order. The kitchen sees one ticket. The bill reflects one order. The guest sees one order on the tracking screen.

**Why the key is generated on the client, not the server:** the retry is a client-side event. The phone that lost the connection is the phone that retries. If the server generated the key, the retry would arrive without a key to match against. The key must exist before the first attempt, so the retry can carry it.

**Why the key is a UUID, not a timestamp or a hash of the cart:** a UUID is guaranteed unique without coordination. A timestamp can collide if two orders are placed in the same millisecond. A hash of the cart can collide if two guests order the same items at the same second. A UUID has no collision, and it costs sixteen bytes.

**What a retry looks like from the guest's screen:** the guest sees "Sending…" while the phone attempts the request. If the connection drops, the phone queues the order and retries when the connection returns. The guest sees one of three states:
- The order was confirmed (either the first attempt or the retry reached the server, and the server created the order once).
- The order is still queued, and the guest sees "Sending…" until the connection returns.
- The order failed after a long outage, and the guest sees an error with a "Retry" action.

In no case does the guest see two orders for one intent. That is the point of the key.

Phase 5's implementation (Tasks 5.5.1 through 5.5.6, and 5.6.1) is written against this contract.

*Traces to:* D-4.1 to D-4.12, D-6.1 (approval before kitchen), D-8.2 (retry safety), D-4.12 (the idempotency key).

---

## 10. The Service Request Lifecycle

### 10.1 The states

A service request moves through the following states (per D-5.2):

| State | Meaning |
|-------|---------|
| Submitted | The guest has submitted the request. |
| Acknowledged | A staff member has seen and accepted it. |
| In Progress | The staff member is working on it. |
| Completed | The request is done. |
| Cancelled | The guest or staff cancelled it. |
| Declined | The venue cannot fulfil the request. |

### 10.2 The allowed transitions

```
Submitted     → Acknowledged  (staff)
Submitted     → Cancelled     (guest or staff)
Submitted     → Declined      (staff)

Acknowledged  → In Progress   (staff)
Acknowledged  → Cancelled     (staff)
Acknowledged  → Declined      (staff)

In Progress   → Completed     (staff)
In Progress   → Cancelled     (staff)

Completed     → (terminal)
Cancelled     → (terminal)
Declined      → (terminal)
```

### 10.3 The guest's edit and cancel window

A guest can edit or cancel a request only while it is in the `Submitted` state (per D-5.3, D-5.4). Once it is `Acknowledged`, only staff can change it.

### 10.4 The details per service

A service request has a common shape (venue, room, service type, status, history) and a set of service-specific details. The details are stored with the request. The service type is an enum: housekeeping, maintenance, concierge, laundry, spa, late checkout, wake-up call, do not disturb.

### 10.5 The parallel tracks

A guest can have multiple requests in flight at once. The guest's Requests screen shows all of them, each with its own state and history (per D-5.1, PRODUCT.md §6.12).

*Traces to:* D-5.1 to D-5.7, D-13.1 (no guest notifications).

---

## 11. The Data Model

The data model is the shape of everything the product remembers. It is described here in business terms, and translated to the database schema in the next section. The database is relational and lives behind the infrastructure layer.

### 11.1 The entities

**The venue.** One venue per installation (per D-10.1). A venue has a name, a brand color, a logo, a hero image, a welcome message, a language, a currency, a tax rate, and a set of enabled modules.

**The venue's modules.** Table, room, counter, kitchen. Each is on or off (per PRODUCT.md §2, D-10.1).

**The venue's services.** The hotel services that are enabled for this venue: room service food, housekeeping, maintenance, concierge, laundry, spa, late checkout, wake-up call, do not disturb. Each can be on or off.

**The table.** A physical table in the venue. Has a number or name and a state: free, occupied, or out of service. Only exists when the table module is on.

**The room.** A physical room in the venue. Has a number or name and a state: occupied, vacant, cleaning, or out of service. Only exists when the room module is on.

**The counter.** A single point of ordering at the venue. Only exists when the counter module is on.

**The QR token.** A permanent random identifier for a place (table, room, or counter). Has a state: active or revoked. Has a created date and (if applicable) a revoked date. The token is an opaque UUID. It is never a sequential ID.

**The staff member.** A person who works at the venue. Has a name, a username, a password hash, one or more roles, and a state: active or deactivated. Has a history of logins and actions.

**The staff session.** An active login. Has a token, a staff member, and a created date. Ends on logout, on password change, or on a new login from another device.

**The guest session.** An anonymous session tied to a place. Has a token, a venue, and a place. Ends when the table or room is closed.

**The menu category.** A grouping of items. Has a name and an order.

**The menu item.** A dish or drink. Has a name, a description, a photo, a price, a category, and a state: available, unavailable, or hidden.

**The modifier group.** A group of options for an item. Has a name and rules about whether the guest must choose and whether they can choose more than one.

**The modifier option.** An option within a modifier group. Has a name and an additional price.

**The order.** A guest's order. Has a venue, a place, a placed time, a state, a set of items, a subtotal, a tax rate, a tax amount, a total, a set of notes, an idempotency key (unique, per D-4.12), and a history of state changes.

**The order item.** One line in an order. Has an item name, an item price, a quantity, a set of modifiers, a modifier price, and a line total — all frozen at the moment of ordering.

**The order state change.** A record of a transition. Has the new state, the time, and the staff member who made the change.

**The service request.** A guest's request for a service. Has a venue, a room, a service type, the guest's details, a submitted time, a state, the assigned staff member, and a history.

**The service request state change.** Same shape as the order state change.

**The payment ticket.** A record of a payment attempt. Has an order or bill, an amount, a currency, a ticket ID, a provider reference (if a provider is connected), a state (pending, succeeded, failed), a created time, and a confirmed time.

**The receipt.** A record of a completed payment. Has the order, the amount, the tip, the tax, the total, the payment method, the time, and the guest's optional email (if provided).

### 11.2 The relationships

- A venue has many tables, rooms, staff members, QR tokens, menu categories, orders, service requests, and payments.
- A table has many QR tokens (one active at a time, and any number of revoked ones for history).
- A room has many QR tokens, same as a table.
- A menu category has many menu items.
- A menu item has many modifier groups.
- A modifier group has many modifier options.
- An order has many order items and many order state changes.
- A service request has many service request state changes.
- An order has zero or one payment ticket (if the order is paid online).
- A payment ticket has zero or one receipt (once the payment succeeds).

### 11.3 The rules

- Every order stores the item names, prices, and modifiers as they were at the moment of ordering (per D-4.1).
- Every order stores the tax rate it used (per D-4.4).
- Every order stores its idempotency key (per D-4.12), with a unique constraint.
- A menu item is never deleted; it is marked hidden or unavailable (per D-4.2).
- A staff member is never deleted; they are deactivated and their history remains (per D-3.7).
- A QR token is never deleted; it is revoked and its history remains (per D-1.2 and D-16.2).
- A venue is never deleted; it is deactivated (per D-10.4).
- A guest session is never kept past the table close or room check-out (per D-2.3, D-2.5).

*Traces to:* PRODUCT.md §15 (the data in business terms), D-4.1, D-4.2, D-4.4, D-4.12, D-3.7, D-10.4, D-2.3, D-2.5, D-16.2.

---

## 12. The API Surface

Every action the browser performs goes through an API route. The routes are grouped by audience: guest, staff, kitchen, admin, and payments.

### 12.1 The envelope

Every response uses one of two shapes:

```json
// Success
{ "data": { … } }

// Failure
{ "error": { "code": "STRING", "message": "Human readable" } }
```

### 12.2 The guest routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/guest/menu` | Load the menu for the current venue |
| POST | `/api/guest/orders` | Place an order (body includes the idempotency key) |
| GET | `/api/guest/orders/[id]` | Read the state of one order |
| GET | `/api/guest/orders` | Read all orders for the current guest session |
| POST | `/api/guest/requests` | Submit a service request |
| PATCH | `/api/guest/requests/[id]` | Edit a service request (while Submitted) |
| POST | `/api/guest/requests/[id]/cancel` | Cancel a service request (while Submitted) |
| GET | `/api/guest/requests` | Read all requests for the current guest session |
| POST | `/api/guest/call` | Call a waiter or request the bill |
| GET | `/api/guest/receipt/[id]` | Read a receipt |

### 12.3 The staff routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/staff/orders/[id]/advance` | Move an order to the next state |
| POST | `/api/staff/orders/[id]/cancel` | Cancel an order with a reason |
| GET | `/api/staff/orders` | Read the active orders for the staff member's queue |
| POST | `/api/staff/requests/[id]/advance` | Move a service request to the next state |
| POST | `/api/staff/requests/[id]/cancel` | Cancel a service request |
| POST | `/api/staff/requests/[id]/decline` | Decline a service request |
| GET | `/api/staff/requests` | Read the active requests for the staff member's queue |
| POST | `/api/staff/tables/[id]/close` | Close a table |
| POST | `/api/staff/rooms/[id]/checkout` | Check out a room |

### 12.4 The kitchen routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/kitchen/orders` | Read the active tickets |
| POST | `/api/kitchen/orders/[id]/start` | Move an order to Preparing |
| POST | `/api/kitchen/orders/[id]/ready` | Move an order to Ready |

### 12.5 The admin routes

| Method | Path | Purpose |
|--------|------|---------|
| GET, POST, PATCH, DELETE | `/api/admin/menu/categories` | Manage categories |
| GET, POST, PATCH, DELETE | `/api/admin/menu/items` | Manage menu items |
| POST | `/api/admin/menu/items/[id]/state` | Change a menu item's state |
| GET, POST, PATCH | `/api/admin/tables` | Manage tables |
| GET, POST, PATCH | `/api/admin/rooms` | Manage rooms |
| POST | `/api/admin/qr/generate` | Generate a QR token for a place |
| POST | `/api/admin/qr/[id]/revoke` | Revoke a QR token |
| GET, POST, PATCH, DELETE | `/api/admin/staff` | Manage staff |
| POST | `/api/admin/staff/[id]/reset-password` | Reset a staff member's password |
| GET | `/api/admin/orders` | Read orders with filters |
| GET | `/api/admin/orders/export` | Export orders as CSV |
| GET | `/api/admin/requests` | Read service requests |
| GET | `/api/admin/reports/sales` | Read a sales report |
| GET | `/api/admin/reports/sales/export` | Export a sales report as CSV |
| PATCH | `/api/admin/modules` | Turn modules on or off |
| PATCH | `/api/admin/services` | Turn services on or off |
| PATCH | `/api/admin/settings` | Update venue settings |
| PATCH | `/api/admin/payments` | Configure the payment bridge |

### 12.6 The payment routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/payments/ticket` | Create a payment ticket |
| POST | `/api/payments/confirm` | Receive a provider's callback |
| GET | `/api/payments/ticket/[id]` | Read the state of a ticket |

### 12.7 The rules

- `organizationId` is never accepted from a client. It is always resolved from the session.
- A price is never accepted from a client. It is always recomputed by the server.
- An order's or request's state is never advanced by a client. The client asks the server, and the server checks the transition.
- Every request that mutates state validates the input before calling the domain.
- A create-order request carries a client-generated idempotency key (per §9.7 and D-4.12). The route passes it to the domain. The domain enforces uniqueness.

*Traces to:* §5 (the Result contract), §6 (the sessions), §8 (the QR), §9 (the order lifecycle), §10 (the request lifecycle).

---

## 13. The Payment Bridge

The payment bridge is the layer between the product and any payment provider (per D-7.1). It exists to record, verify, and confirm payments without locking the venue to a specific provider.

### 13.1 The flow

1. The guest taps "Pay now".
2. The product calls `POST /api/payments/ticket` with the order's identifier and the amount.
3. The domain creates a ticket, stores it, and returns the ticket's identifier.
4. If a provider is connected, the product redirects the guest to the provider with the ticket identifier.
5. The guest pays on the provider's page.
6. The provider redirects the guest back to the product, and separately calls `POST /api/payments/confirm` with the ticket identifier and the provider's reference.
7. The domain verifies the ticket with the provider (a second call, or a signature check).
8. If verification succeeds, the ticket is marked succeeded and the order is marked paid.
9. The guest sees a thank-you and a receipt.
10. If verification fails, the ticket is marked failed and the guest is asked to try again or pay at the counter.

### 13.2 The verification

The verification step (step 7) is essential. A provider's callback can be spoofed. The product never trusts the callback alone; it always verifies with the provider before marking a payment as succeeded.

### 13.3 The provider adapters

Each provider is an adapter in `src/infrastructure/payments/`. The adapter implements the bridge's interface: `createTicket`, `verifyTicket`, `parseCallback`. In the first version, there is one placeholder adapter, and the bridge is fully testable with it. Adding eSewa, UPI, or any other provider means writing one new adapter.

### 13.4 The cash path

The first version has no live provider. In the first version, the guest's only payment path is **cash at the counter** (per D-7.7). The tracking screen shows "Ask your waiter for the bill" or "Pay at the counter". The staff mark the order as paid from their panel. The receipt generation exists and is testable, but it is not exercised by a live guest until a provider is connected. When a provider is connected for a venue, the "Pay now" path is enabled for that venue, and the bridge flow above applies.

*Traces to:* D-7.1 to D-7.7.

---

## 14. The Real-Time Strategy

### 14.1 The polling model

In the first version, the kitchen screen, the staff queues, and the guest's tracking screen poll every 5 seconds (per D-6.6, D-8.1). A poll is a lightweight read that returns the current state of the relevant items. The screens do not hold an open connection; they ask, receive, and wait.

### 14.2 What each screen polls

- The kitchen screen polls for active tickets and their states.
- Each staff queue polls for its own items and their states.
- The guest's tracking screen polls for the state of their own order or request.
- The manager's dashboard polls for the venue's live metrics.

### 14.3 The connection drops

If a screen's connection drops:

- The kitchen screen shows a "connecting" state and retries automatically (per D-8.3).
- The staff queues show a subtle indicator and retry automatically.
- The guest's tracking screen shows a "reconnecting" state and retries automatically.
- The manager's dashboard shows a subtle indicator and retries automatically.

### 14.4 What polling is not

Polling is not a live push. It does not hold a connection. It does not stream. It is a periodic question, and the answer is the current state.

### 14.5 The path to live push

When the product grows large enough that polling is too heavy, the polling is replaced by a live push (Server-Sent Events) on the same screens. The screens' shape does not change; only the transport changes. This is deferred to a later version.

*Traces to:* D-6.6, D-8.1, D-8.3, D-8.4.

---

## 15. The Security Boundaries

### 15.1 What is trusted

- The staff session is trusted after validation.
- The domain layer is trusted; it assumes validated input.
- The database is trusted; the venue's data is only ever queried within the venue's scope.
- The venue's own configuration is trusted.

### 15.2 What is not trusted

- The guest's browser. Anything the guest sends is untrusted.
- The client-supplied price. Never trusted. Always recomputed.
- The client-supplied venue. Never trusted. Always resolved from the session.
- The client-supplied order state. Never trusted. Always validated against the state machine.
- The provider's callback. Never trusted alone. Always verified.

### 15.3 The boundary table

| Boundary | Trust level | Enforcement |
|----------|-------------|-------------|
| Guest browser | Untrusted | Guest session cookie validated on every guest route |
| Staff browser | Untrusted until the session is validated | Staff session cookie validated against the session store |
| API route handler | Trusted | Validates the session, the role, and the input; calls the domain |
| Domain | Trusted | Enforces business invariants |
| Infrastructure | Trusted | The only layer that talks to the database |
| Database | Trusted | Row-level scoping enforced by domain queries |
| Payment provider | Untrusted until verified | Verification call before marking a payment succeeded |

### 15.4 The cross-venue rules

- A staff member of one venue can never see another venue's data.
- A guest session is tied to one venue.
- A request for a resource that belongs to another venue returns `NOT_FOUND` (never `FORBIDDEN`), to avoid leaking the existence of the resource.

*Traces to:* §6 (sessions), §9 (order state), §13 (payment verification), D-10.2 (isolation).

---

## 16. The Error and Failure Model

### 16.1 The domain's failures

The domain returns failures as `Result` values, never as exceptions (per §5). Every failure has a code and a message. The message is safe to show to a human.

### 16.2 The API's failures

An API route that receives a failed `Result` maps the code to an HTTP status (per §5) and returns the standard error envelope. It never returns a stack trace, never returns a database error, and never returns an internal detail.

### 16.3 The programming errors

A true programming error (a null dereference, an invariant violation) may throw. The route handler catches it, logs it server-side, and returns an `INTERNAL` error with a generic message. The detail is never sent to the client.

### 16.4 The database's failures

The infrastructure layer wraps a database error into a `DomainError` at the boundary. The domain never sees a database error. The client never sees a database error.

### 16.5 The connection failures

If the guest's connection drops mid-action, the action is queued and retried (per D-8.2). The retry is safe because the order carries an idempotency key (per D-4.12 and §9.7). If a staff screen's connection drops, the screen shows a connecting state and retries (per D-8.3).

### 16.6 The venue's failures

If the venue's database is unreachable, the product shows a friendly "we are having trouble" screen to the guest and a clear "the connection to the database is lost" indicator to the staff. No data is lost; the action is retried when the connection returns.

*Traces to:* §5 (the Result contract), D-8.2, D-8.3, D-4.12.

---

## 17. The Configuration Model

### 17.1 What is configuration

The following values are configuration, set by the **developer** per venue at onboarding (per D-9.1 and D-9.6):

- The venue's name.
- The venue's logo.
- The venue's brand color.
- The venue's hero image.
- The venue's welcome message.
- The venue's language (English only in the first version, per D-11.1 and D-11.4).
- The venue's currency (per D-11.2).
- The venue's tax rate (per D-4.3).
- The venue's enabled modules (per PRODUCT.md §2).
- The venue's enabled services (per PRODUCT.md §6).
- The venue's payment provider configuration (per D-7.2).

The following values are **not** configuration, and are managed by the **operator** from the admin panel:

- The menu — categories, items, modifiers, prices.
- The tables and rooms — adding, editing, and status.
- The QR codes — generating, printing, revoking.
- The staff — creating, editing, deactivating, resetting passwords, assigning roles and queues.
- The active and completed orders.
- The service requests.
- The module toggles and the service toggles, within the limits the developer has enabled. The operator can turn an enabled module or service off. The operator cannot turn on a module or service the developer has not enabled.
- The venue's address, contact, hours, and notification preferences.

### 17.2 Where configuration lives

The developer's configuration lives in code, in a per-venue configuration file that the developer edits at onboarding. It is not editable from the admin panel in the first version. The admin panel reads some of it (for example, the venue's name and the enabled modules) and displays it read-only. The panel does not write to it.

The operator's data — the menu, the tables, the rooms, the staff, the orders, the requests — lives in the database and is managed through the admin panel. It is not configuration; it is the venue's operational data.

### 17.3 What is not configuration

- The venue's data (orders, requests, staff, tables, rooms) is not configuration. It lives in the database and is managed through the admin panel.
- The menu is not configuration. It lives in the database and is managed through the admin panel.
- The operator's daily toggles of modules and services are not configuration. They are operational state, and they are stored in the database. The developer's initial enablement of a module or service is configuration.

*Traces to:* D-9.1, D-9.6, D-7.2, D-11.1, D-11.2, D-11.4, D-4.3.

---

## 18. The Backup and Recovery Model

### 18.1 The backup

The venue's database is backed up automatically once a day (per D-8.5). The backup is a full snapshot of the venue's data. The backup is stored in a location independent of the primary database.

### 18.2 The retention

The backups are retained for 30 days (per D-8.5). Older backups are removed automatically.

### 18.3 The recovery

If the database is lost, the developer restores the most recent backup. The recovery procedure is documented and tested once per quarter.

### 18.4 The recovery point

The recovery point is up to 24 hours before the loss (the time of the most recent backup). Data created in the last 24 hours that was not in the most recent backup is lost.

*Traces to:* D-8.5.

---

## 19. The Deployment Model

### 19.1 The installation

The product is installed per venue (per D-10.1). The installation has:

- One application server.
- One database.
- One set of environment variables (database URL, session secret, payment provider credentials if configured).

### 19.2 The hosting

The product is deployable on any hosting platform that supports the framework and the database (per D-14.1). The first version is deployed on a specific hosting chosen for convenience, but the deployment does not lock the venue to that host.

### 19.3 The environment

The first version does not have a staging environment (per D-14.2). Testing happens locally.

### 19.4 The deployment

Deployments are triggered manually by the developer (per D-14.3). Automatic deployment is deferred.

### 19.5 The domain

Each venue has a domain or subdomain that its QR codes point to. The domain is chosen by the developer at onboarding. The QR codes carry the venue's domain and the token; the guest's browser opens the QR's URL when scanned.

Each installation serves one venue. There is no multi-venue switcher in the first version (per D-10.5). An organisation that operates more than one venue runs more than one installation, and each installation has its own domain, its own database, and its own operator accounts.

*Traces to:* D-14.1, D-14.2, D-14.3, D-10.1, D-10.5.

---

## 20. What This File Does Not Define

- The product — that is PRODUCT.md.
- The reasons — those are DECISIONS.md.
- The process — that is BUILD.md.
- The plan — that is ROADMAP.md.
- The history — that is PROGRESS.md.

If a fact about the shape of the system is not in this file, it is not defined. If a shape decision is needed that is not covered by a decision in DECISIONS.md, the decision must be added there before the shape is written here.

---