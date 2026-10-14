# BUILD.md — How Code Is Written, Tested, and Verified

**Version:** 1.0
**Status:** Draft for approval
**Purpose:** Describe how the developer writes code, tests it, verifies it, and closes a task. This file owns the coding standards, the testing strategy, the local setup, the verification protocol, the task format, the report format, the session hygiene, and the definition of done. It does not own the product (PRODUCT.md), the reasons (DECISIONS.md), or the shape (SYSTEM.md).

**How to read this file:** Every rule here exists to prevent a specific class of mistake. A rule is not written because it is fashionable; it is written because ignoring it has a cost. If a rule becomes unnecessary, it is removed in a new version of this file. Nothing here contradicts DECISIONS.md or SYSTEM.md.

---

## Table of Contents

1. The Working Principles
2. Coding Standards — TypeScript
3. Coding Standards — React and Next.js
4. Coding Standards — Styling
5. Coding Standards — The Domain Layer
6. Coding Standards — API Routes
7. Coding Standards — Money, Tenancy, and Security
8. The Testing Strategy
9. The Local Setup
10. The Database Setup
11. The Verification Protocol
12. The Task Format
13. The Report Format
14. Session Hygiene
15. The Definition of Done
16. The Failure Protocol
17. What This File Does Not Define

---

## 1. The Working Principles

Five principles govern every line of code, every test, every task, and every session.

**Principle 1 — The structure is correct from the first commit.** Nothing is written "quickly to fix later". Every file goes to its correct place, every name is deliberate, every boundary is respected. The cost of a fix later is always higher than the cost of getting it right now.

**Principle 2 — Every claim is backed by evidence.** A task is not done because the code "looks right". A task is done because a command was run and its raw output was pasted. "It should work" is not evidence.

**Principle 3 — Small, verified increments.** One task per session. One concern per task. One command per acceptance criterion. When the task is done, the developer stops and the next session begins.

**Principle 4 — The repository is the source of truth.** Not memory, not a previous chat, not a prior session. The files in the repository decide what is true. If a remembered fact is not in the repository, it is not a fact.

**Principle 5 — The process is the guarantee.** The product reaches production not because the work is fast but because the work is verified. Speed comes from never redoing verified work; it never comes from skipping the verification.

*Traces to:* D-15.7 (structure correct from the beginning), D-15.1 (complete loop working), D-14.2 (local testing).

---

## 2. Coding Standards — TypeScript

These rules apply to every TypeScript file in the repository.

1. **Strict mode is on.** The `tsconfig.json` has `"strict": true`. It is never weakened. Every file compiles under strict mode.
2. **No `any`.** When a value's type is genuinely unknown, use `unknown` and narrow it before use. `any` disables type checking, which is the opposite of what we want.
3. **No `@ts-ignore` or `@ts-nocheck`.** If the type checker complains, fix the underlying issue. A silenced error is a deferred bug.
4. **Prefer `interface` for object shapes; `type` for unions and intersections.** This makes intent clear.
5. **Explicit return types on every exported function.** A caller should not have to infer what a function returns.
6. **No non-null assertions (`!`).** If a value might be null, handle the null case. If it cannot be null, tell the type checker with a check, not with an assertion.
7. **Immutability by default.** Use `const`, `readonly`, and `as const`. Mutation is an exception, not a default.
8. **Enums for closed sets.** Status values, role values, service types, and QR types are enums, never strings. A string literal for a state is a bug waiting to happen.
9. **Validate untrusted input at the boundary.** Every value that comes from a request, an environment variable, or an external system is validated before it enters the domain.
10. **Discriminated unions for state that has variants.** The `Result<T>` type is the canonical example; the same pattern applies elsewhere.

*Traces to:* SYSTEM.md §5 (the Result contract), D-15.7 (structure correct from the beginning).

---

## 3. Coding Standards — React and Next.js

These rules apply to every component, page, and layout in the presentation layer.

1. **Server Components by default.** A component becomes a Client Component only when it needs interactivity, a browser API, or client-side state. The default is the server.
2. **Server Components fetch through the domain.** A Server Component never imports the database client directly. It calls a domain function, which returns a `Result`.
3. **Client Components talk to the API.** A Client Component never imports the domain or the infrastructure directly. It calls an API route, which calls the domain.
4. **Named exports for components, default exports for pages.** A page is a route; a component is a reusable piece. The naming reflects the difference.
5. **No business logic in components.** Pricing, validation, state transitions, and permissions live in the domain. A component renders what the domain returns.
6. **Every component declares its atmosphere.** A component that belongs to the guest experience is under the guest folder; a component that belongs to the staff experience is under the staff folder; a shared component declares that it is shared. This is enforced by the folder structure and by review.
7. **No cross-atmosphere imports.** A guest component never imports a staff component. A staff component never imports a guest component. The shared layer is the only common ground.
8. **Images use the framework's image component.** Alt text is required. If an image is decorative, alt is set to an empty string.
9. **Fonts are self-hosted and loaded through the framework.** No external CDN at runtime.

*Traces to:* SYSTEM.md §2 (the layers), D-9.2 (brand color only on guest screens), PRODUCT.md §13 (the two atmospheres).

---

## 4. Coding Standards — Styling

These rules apply to every visual decision in the codebase.

1. **Tailwind utilities only.** Custom CSS exists only as design tokens or base resets, and it lives in one place: the global stylesheet.
2. **Design tokens only.** No raw hex values in components. No arbitrary pixel values. Colors, spacings, radii, and shadows come from the token layer.
3. **Class names come from a single helper.** Conditional class composition uses the `cn` helper, never string concatenation. Dynamic class names (built by string interpolation) are forbidden because the build cannot see them and they break.
4. **Base components first.** If a button, an input, a dialog, or a table exists in the base layer, use it. Do not build a new one.
5. **Atmosphere discipline.** A guest component uses the guest atmosphere's colors and motion. A staff component uses the staff atmosphere's colors and motion. Mixing is a bug.
6. **No inline styles**, except for the per-venue brand color injection into the guest layout.

*Traces to:* PRODUCT.md §13 (the two atmospheres), D-9.2 (brand color), D-9.4 (no guest dark mode), D-9.5 (kitchen dark mode).

---

## 5. Coding Standards — The Domain Layer

These rules apply to every file in the domain layer.

1. **Every public function returns a `Result`.** If the function can fail for a business reason, the failure is returned, not thrown.
2. **Never throw for an expected failure.** A missing record, an invalid transition, an unauthorized action — all returned as failures.
3. **Never return null to signal failure.** Use the failure type.
4. **Never import the database client.** The domain talks to the infrastructure through interfaces, never directly.
5. **Never import React.** The domain is framework-agnostic.
6. **Never import HTTP types.** Requests and responses belong to the API layer, not the domain.
7. **Money is a decimal, never a floating-point number.** A price, a tax, a total, and a modifier price are all stored and computed with decimal arithmetic.
8. **The venue's scope comes from the caller, never from the input.** A domain function receives the venue's identifier from the API layer (which resolved it from the session), never from a request body.
9. **Snapshots are written once and never updated.** An order's item prices, an order's tax rate, and an order's line totals are written at order creation and never modified.
10. **Multi-row writes use a transaction.** Creating an order writes the order, its items, and its first state-change record inside one transaction. Partial writes are forbidden.

*Traces to:* SYSTEM.md §2 (the layers), SYSTEM.md §5 (the Result contract), SYSTEM.md §9 (the order lifecycle), D-4.1 (frozen prices), D-4.4 (frozen tax), D-2.2 (guest cart), D-4.3 (one tax rate).

---

## 6. Coding Standards — API Routes

These rules apply to every file in the API layer.

1. **A route is an adapter.** It reads the request, validates the input, calls a domain function, maps the result to HTTP, and returns. It contains no business logic.
2. **Every response uses the standard envelope.** A success returns `{ "data": … }`. A failure returns `{ "error": { "code": …, "message": … } }`.
3. **Failures are mapped, not thrown.** When the domain returns a failure, the route maps its code to an HTTP status.
4. **No try-catch around expected failures.** A failure is a value, not an exception. Only true programming errors are caught, and they return a generic 500 with a server-side log.
5. **The venue's identifier is resolved from the session, never from the client.** A request that supplies a venue identifier is rejected.
6. **A price is resolved from the database, never from the client.** A request that supplies a price has that price ignored.
7. **A state transition is validated by the domain, never accepted from the client.** The client asks; the server decides.
8. **Money is a string on the wire.** A price of 10.99 is sent as `"10.99"`, never as `10.99`. The client formats it for display; the client never computes with it.
9. **Input is validated before the domain is called.** A request with missing or malformed fields returns `VALIDATION_FAILED` before touching the domain.

*Traces to:* SYSTEM.md §5 (the Result contract), SYSTEM.md §12 (the API surface), D-4.1 (frozen prices), D-4.4 (frozen tax).

---

## 7. Coding Standards — Money, Tenancy, and Security

### 7.1 Money

- Every monetary value is a decimal, with two digits after the decimal point.
- The domain accepts and returns decimal values or strings, never floating-point numbers.
- The client formats money for display with the browser's built-in internationalization. The client never computes with money.
- A call that would parse a price as a floating-point number is a bug.

### 7.2 Tenancy

- The venue's identifier is the scoping key.
- Every query that reads or writes a venue-scoped entity filters by the venue's identifier.
- The venue's identifier is resolved server-side, never accepted from the client.
- A request for a resource of another venue returns "not found", never "forbidden", to avoid leaking the existence of the resource.

### 7.3 Routing

- The guest routes are under a folder that carries the QR token in the URL.
- The staff routes are under a folder that is guarded by the staff session.
- The kitchen routes are under a folder that is guarded by the kitchen role or higher.
- The admin routes are under a folder that is guarded by the manager or owner role.

### 7.4 Security

- No secrets in code. Every secret is read from an environment variable.
- Passwords are hashed with a strong hashing function. The plain password is never stored, logged, or transmitted.
- Sessions are stored server-side. The cookie carries only a random token.
- XSS is prevented by React's default escaping. Dangerous HTML injection is never used with user data.
- CSRF protection is applied to state-changing endpoints (deferred to a later version if needed).
- Rate limiting is applied to the login endpoint (deferred to a later version if needed).

*Traces to:* D-4.1 (frozen prices), D-4.4 (frozen tax), D-2.1 (guest anonymous), D-3.1 to D-3.8 (staff identity), D-10.2 (isolation), SYSTEM.md §15 (security boundaries).

---

## 8. The Testing Strategy

### 8.1 The three levels of tests

The product has three levels of tests.

**Unit tests** exercise a single domain function with no database and no HTTP. They are fast, and they are the majority of the tests.

**Integration tests** exercise a route, a domain, and the database together. They use a dedicated test database that is created, migrated, and destroyed by the test run.

**End-to-end tests** exercise a complete loop through the browser. They are slow and few, and they verify the flows that matter most.

### 8.2 What the unit tests cover

- Order pricing. Every line total, subtotal, tax, and total is verified with exact decimal arithmetic.
- Order state transitions. Every allowed transition passes; every forbidden transition returns the correct failure.
- Service request state transitions. Same.
- QR token generation and resolution. A token resolves to the right place; a revoked token does not resolve.
- Menu item state. An unavailable item is not orderable; a hidden item is not visible.
- Session validation. An expired session fails; a valid one passes.
- Permission checks. A role sees what it should see; a role does not see what it should not.
- Payment ticket creation and verification. A ticket is created, its state is tracked, and its verification is enforced.

### 8.3 What the integration tests cover

- The guest places an order and the order is stored with the correct prices and tax.
- The staff advance the order through every state, and an invalid transition returns an error.
- The kitchen sees the order after approval and moves it through its states.
- The guest's tracking screen reads the current state.
- The guest submits a request and the request appears in the correct queue.
- A staff member of one venue cannot see another venue's data.
- A guest session cannot advance an order's state.
- A payment ticket is created, a callback is verified, and the order is marked paid.

### 8.4 What the end-to-end tests cover

- The full table loop: guest scans, browses, orders, tracks, and pays; the kitchen and staff advance the order.
- The full room service loop: guest scans, orders room service, tracks, and pays; the kitchen and staff advance the order.
- The full housekeeping loop: guest scans, submits a request, and sees it complete.
- The full counter loop: guest scans, orders with a pickup name, and picks up.
- The full admin loop: manager logs in, manages the menu, generates a QR, manages staff, and exports a report.

### 8.5 What is not tested

- Third-party libraries.
- Framework internals.
- The visual appearance of a component. Visual verification is done by looking at the screen, not by a test.

### 8.6 The test data

- Each test creates its own data. No test depends on another test's data.
- No test reads from a production database.
- No test calls a live external service. The payment provider, the QR image service, and any other external service is stubbed.

### 8.7 The coverage philosophy

Coverage is measured but not targeted as a percentage. A high coverage number with weak assertions is worse than a low coverage number with strong ones. The tests focus on the areas where mistakes are expensive: money, tenancy, state transitions, and authentication.

*Traces to:* D-15.1 (complete loop working), D-15.7 (structure correct from the beginning), §15 (the definition of done).

---

## 9. The Local Setup

### 9.1 The prerequisites

- Node.js, a recent LTS version.
- The package manager the project uses (one and only one; there is no mixing).
- PostgreSQL, version 14 or later, running locally.
- A terminal.

### 9.2 The installation

1. Clone the repository.
2. Install the dependencies with the project's package manager.
3. Copy the example environment file to a local environment file.
4. Set the database URL in the local environment file.
5. Run the database migrations.
6. Run the seed script.
7. Start the development server.
8. Open the local URL in a browser.

### 9.3 The environment variables

The local environment file contains:

- The database URL.
- The session secret.
- Any other secret the product needs.

No secret is committed to the repository. The example file contains placeholder values, not real ones.

### 9.4 The seed

The seed script creates a fully populated venue:

- One venue with both the table and room modules enabled.
- A set of tables with numbers.
- A set of rooms with numbers.
- A set of QR tokens, one per table and one per room.
- A set of menu categories and menu items with modifiers.
- A set of staff members with different roles.
- A set of hotel services enabled.

The seed is idempotent. Running it twice does not duplicate anything.

### 9.5 The development URLs

- The guest experience is reached by navigating to a QR token's URL (printed by the seed).
- The staff login is at the staff URL.
- The kitchen screen is at the kitchen URL.
- The admin panel is at the admin URL.

### 9.6 The mobile testing

The guest experience is designed for phones. During development, the developer tests it on a real phone when possible, and on a simulated phone viewport otherwise.

*Traces to:* D-14.2 (no staging environment), D-15.1 (complete loop working), D-15.7 (structure correct from the beginning).

---

## 10. The Database Setup

### 10.1 Installing the database

The database is PostgreSQL, version 14 or later. It is installed locally for development. The installation steps depend on the operating system and are documented in the project's setup notes.

### 10.2 Creating the development database

A database is created for development. Its name is descriptive (for example, `venue_dev`). Its owner is the local developer.

### 10.3 Configuring the connection

The connection string is placed in the local environment file. The format is the standard PostgreSQL connection string.

### 10.4 Running the migrations

The migrations are applied with the project's migration command. The migrations are versioned and committed. A migration is never edited after it is applied; a new migration is added to change the schema.

### 10.5 Running the seed

The seed is run with the project's seed command. It is idempotent. It creates the venue and its data.

### 10.6 The schema changes

A schema change requires:

1. A decision in DECISIONS.md, if the change is not covered by an existing decision.
2. A migration that is backward-compatible when possible.
3. A review of the migration's SQL before it is committed.
4. A note in the commit message describing what the migration does and why.

### 10.7 The rules

- A migration is never edited after it is applied.
- A migration is never deleted. To reverse one, a new forward migration is written.
- `prisma db push` is never used against a database with real data. It is only used for local throwaway experiments.
- The database is never edited by hand. Every change goes through a migration or through the product's own interface.

*Traces to:* SYSTEM.md §11 (the data model), D-8.5 (backup), D-15.7 (structure correct from the beginning).

---

## 11. The Verification Protocol

### 11.1 What verification means

A task is done when every acceptance criterion has been verified with raw evidence. Evidence is a command that was run and its raw output, or a manual action that was performed and its observed result.

### 11.2 What is not evidence

- "It should work."
- "It looks right."
- "The code is correct."
- A summary of a command's output without the raw output.
- A claim that a command passed without showing the command's result.

### 11.3 What counts as evidence

- The raw output of a command, pasted exactly as it appeared.
- A screenshot of a screen after an action.
- A row in a database after a write, read back with a command.
- A manual observation, described precisely, with the steps to reproduce it.

### 11.4 What to do when a command cannot be run

If a command cannot be run (a missing tool, a sandbox restriction, a network issue), the acceptance criterion is marked `NOT VERIFIED` with the reason. It is never marked as passed. A criterion that is not verified is not done.

### 11.5 What to do when a command fails

If a command fails, the failure's raw output is pasted. The failure is not summarized. The failure is not hidden. The task is marked as failed and the failure protocol (§16) is followed.

### 11.6 The acceptance criteria table

Every task has an acceptance criteria table. Every row has a criterion, the command or action that verifies it, and the expected result. The report reproduces the table and fills in the result and the evidence for each row.

*Traces to:* Principle 2 (every claim backed by evidence), D-15.1 (complete loop working).

---

## 12. The Task Format

### 12.1 What a task is

A task is one unit of work. It is small enough to finish in one session, focused enough to have one concern, and complete enough to be verified on its own.

### 12.2 The task's parts

Every task has the following parts:

- **The identifier.** A short name, for example `Phase 3 — Table QR generation`.
- **The dependency.** What must be done before this task.
- **The objective.** One or two sentences describing what the task achieves.
- **The scope.** A table of the files the task will touch, with the action (create, edit, delete) and the purpose for each file.
- **The out-of-scope list.** What the task will not touch, so no one accidentally expands it.
- **The pre-conditions.** What must be true before the task begins.
- **The steps.** The numbered steps the task will take.
- **The acceptance criteria.** The criteria that will be verified.
- **The rollback.** What to do if the task fails.

### 12.3 The rules for a task

1. **One concern per task.** If the objective contains the word "and" describing two different things, it is two tasks.
2. **Eight files or fewer.** If the task touches more, it is split.
3. **Two hundred lines or fewer.** If the change is larger, it is split.
4. **One command per acceptance criterion.** If a criterion cannot be verified by one command or one manual action, it is too vague.
5. **Reversible.** Every task states how to undo it.
6. **Never combine a structural change with a behavioural change.** The two are separate tasks.

### 12.4 The ordering within a milestone

Within a milestone, tasks are ordered by dependency:

1. Read-only investigation first.
2. Structural changes second (folders, configuration, dependencies).
3. Behavioural changes third (new logic).
4. Verification last.

*Traces to:* Principle 3 (small, verified increments), D-15.7 (structure correct from the beginning).

---

## 13. The Report Format

### 13.1 What a report is

At the end of every task, the developer writes a report. The report is the task's proof. It is written before the task is considered complete, and it is the only thing the next session needs to read to know what happened.

### 13.2 The report's parts

- **The task's identifier.**
- **The status.** Passed, failed, or blocked. Never "done".
- **A summary.** Two sentences describing what was done.
- **The files changed.** A table of every file, with what was added, what was removed, and why.
- **The commands run.** Every command, with its raw output.
- **The acceptance criteria results.** A table reproducing the task's criteria, with the result and the evidence for each.
- **The deviations.** Anything done that was not in the task's scope, or anything the task asked for that was not done.
- **The limitations.** What the task does not cover, and what is deferred.
- **The next step.** What the next session should start with.
- **The verification status.** Whether the developer is waiting for a human to verify the task.

### 13.3 The rules for a report

- The status is one of the three allowed values. Never "done", never "in progress".
- Every criterion has a result and evidence.
- Every command was actually run, and its raw output is visible.
- If a file outside the task's scope was changed, it is reported in the deviations.
- If a problem was noticed but not fixed, it is reported in the limitations.
- The report is written before the task is considered complete.

*Traces to:* Principle 2 (evidence), §11 (the verification protocol).

---

## 14. Session Hygiene

### 14.1 The start of a session

A session starts when the developer opens a fresh chat and provides:

- The current state of the project documents.
- The task for the session.

The first response of the session is a confirmation that the documents and the task have been read, followed by a restatement of the task in a few lines. No file is written yet.

### 14.2 The plan

The next response is a plan of no more than ten lines. The plan states what the session will do, in order, and what it will verify. No file is written yet.

### 14.3 The approval

The developer approves the plan or asks for a revision. No file is written until the plan is approved.

### 14.4 The execution

With the plan approved, the session executes the task:

- Only the files in the task's scope are touched.
- Only the commands in the task's acceptance criteria are run.
- Every command's raw output is captured for the report.

### 14.5 The report

When the execution is complete, the session writes the report per §13.

### 14.6 The stop

After the report, the session stops. It does not propose the next task. It does not start the next task. It waits for the developer to write "proceed" or to open a new session with the next task.

### 14.7 What is forbidden in a session

- Starting a second task.
- Touching a file that is not in the scope.
- Running a command that is not in the acceptance criteria.
- Claiming something passed without evidence.
- Summarizing the repository "for context".
- Making a decision that belongs in DECISIONS.md without recording it there.
- Proposing the next task before the current one is approved.

*Traces to:* Principle 3 (small, verified increments), Principle 5 (the process is the guarantee).

---

## 15. The Definition of Done

A task is done when every applicable condition is satisfied. A condition that does not apply is marked not applicable, not skipped.

- The task's objective is achieved.
- Every acceptance criterion has raw evidence.
- The type checker passes with no errors.
- The build passes with no errors.
- The new behaviour is covered by a test (unit, integration, or end-to-end, whichever is appropriate).
- The existing tests still pass.
- No file outside the task's scope was changed.
- The structure remains correct (the file is in its correct folder, the naming follows the conventions, the boundaries are respected).
- Any decision that arose is recorded in DECISIONS.md.
- Any deferred work is noted in the report's limitations.
- The report is complete and honest.

A task is not done if any of the following is true:

- The type checker reports errors.
- The build fails.
- A test fails.
- A criterion has no evidence.
- A file outside the scope was changed and not reported.
- A decision was made silently.
- The report claims something that is not proven.

*Traces to:* Principle 5 (the process is the guarantee), §11 (the verification protocol), §13 (the report format).

---

## 16. The Failure Protocol

### 16.1 When a task fails

If a task fails, the failure is not hidden and it is not retried with the same approach. The following steps are followed:

1. **Roll back.** The task's rollback is applied. The repository returns to the state before the task began.
2. **Diagnose.** The cause is identified. Was the task ambiguous? Was the assumption about the codebase wrong? Was the acceptance criterion wrong? Was the implementation wrong?
3. **Revise.** The task is revised to address the cause. If the task was ambiguous, it is rewritten with the missing detail. If the codebase was different from what was assumed, the assumption is corrected. If the acceptance criterion was wrong, it is fixed.
4. **Re-issue.** The revised task is executed in a new session.

### 16.2 The two failure modes

A task can fail in two ways:

- **A failure.** The task ran, and the acceptance criteria were not met.
- **A block.** The task could not run because a prerequisite was missing — a file, a tool, a decision, an approval.

Both are reported in the report's status. Both require the developer's attention before the next session.

### 16.3 What is never done

- A failed task is never retried with the same prompt and the same assumptions.
- A failed task is never "worked around" by ignoring the failure.
- A failed task is never marked as passed.
- A failure is never hidden from the report.

*Traces to:* Principle 2 (evidence), §11 (the verification protocol), §13 (the report format).

---

## 17. What This File Does Not Define

- The product — that is PRODUCT.md.
- The reasons — those are DECISIONS.md.
- The shape — that is SYSTEM.md.
- The plan — that is ROADMAP.md.
- The history — that is PROGRESS.md.

If a fact about the process is not in this file, it is not defined. If a process decision is needed that is not covered here, it is added in a new version of this file, and if it is significant enough to be a choice between alternatives, it is recorded in DECISIONS.md first.

---