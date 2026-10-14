# DECISIONS.md — The Complete Record of Every Locked Choice

**Version:** 1.0
**Status:** Locked
**Purpose:** Every choice that shapes the product, recorded once, with its reason, its alternatives, and the conditions that would reopen it. Append-only. Nothing here is edited after the fact; a changed decision becomes a new record that supersedes the old one.

**How to read this file:** Each record has six parts. **The decision** is what we chose. **The context** is the problem that forced the choice. **The alternatives** are what else was on the table and why we did not pick it. **The consequences** are what we now live with — both the benefits and the costs. **What would make us revisit** is the specific event or condition that reopens the record. If a decision is later changed, the old record is marked `SUPERSEDED BY D-X.Y` and a new record takes its place; the old one is never deleted.

---

## Table of Contents

1. Venue Identity — D-1.1 to D-1.3
2. Guest Identity — D-2.1 to D-2.5
3. Staff Identity — D-3.1 to D-3.8
4. Order Identity — D-4.1 to D-4.10
5. Service Request Identity — D-5.1 to D-5.7
6. Kitchen and Fulfilment — D-6.1 to D-6.6
7. Payments — D-7.1 to D-7.6
8. Real-Time, Offline, and Reliability — D-8.1 to D-8.5
9. Branding and Theming — D-9.1 to D-9.5
10. Multi-Venue and Multi-Tenant — D-10.1 to D-10.4
11. Languages, Currencies, and Regions — D-11.1 to D-11.3
12. Reporting — D-12.1 to D-12.4
13. Notifications — D-13.1 to D-13.3
14. Deployment — D-14.1 to D-14.3
15. Success Criteria for the First Production Version — D-15.1 to D-15.7

---

## 1. Venue Identity

### D-1.1 — One hosted platform, entered only by scanning a QR code

**Decision:** The product is a single hosted platform. Every venue lives under one installation. A guest reaches a venue's experience only by scanning a QR code. The QR code is the sole entry point. The QR resolves server-side to a venue and to a specific table, room, or counter, and the guest experience is rendered for that specific context — the venue's name, the table or room number, and only the facilities that apply to that context.

**Context:** Venues need their own branded experience, but managing separate installations per venue is operationally heavy. A single hosted platform with QR-based routing gives each venue its own experience without duplicating infrastructure. It also keeps the venue's name out of any public URL, which the venue prefers.

**Alternatives considered:**
- A subdomain per venue (`venue.platform.com`) — rejected because it requires DNS and certificate management per venue, slowing onboarding and adding operational cost.
- A public path-based URL that a guest can type (`platform.com/venue-name`) — rejected because it invites guessing, exposes venue names publicly, and creates an entry point that bypasses the QR.
- A directory or marketplace of venues — rejected because it is a different product and the venue did not ask for it.

**Consequences:**
- The guest URL is opaque to the guest. The QR carries the venue and the context; the server resolves them.
- A guest can only reach the venue's experience by scanning a valid QR. There is no public discovery.
- The venue's display name appears on screen after resolution, never in the URL.
- The product scales to any number of venues without touching DNS.

**What would make us revisit:** If a venue asks for a public shareable guest URL (for a website link, a marketing email, or a printed card that is not a QR), we add a path-based public URL alongside the QR as an opt-in per venue.

---

### D-1.2 — The QR is permanent and tied to the venue's internal identity, not its display name

**Decision:** A printed QR code is permanent. It encodes an internal identifier for the venue and for the specific table, room, or counter. If the venue later changes its display name, the change is made in code for that venue, and every printed QR continues to work because the QR is tied to the internal identifier, not to the display name.

**Context:** In a previous design, the URL contained a human-readable name that could be changed, which would have invalidated every printed QR and forced a reprint of every table and room. Tying the QR to an internal identifier removes that risk entirely.

**Alternatives considered:**
- A human-readable URL segment that the owner can change — rejected because changing it would invalidate every printed QR.
- A human-readable URL segment that the owner cannot change — rejected because it still exposes the venue's name in the URL, which D-1.1 already decided against.

**Consequences:**
- The QR encodes an internal identifier for the venue and the place.
- The venue's display name is a separate field, shown on screen after resolution.
- Renaming a venue is a text change with no effect on any QR.
- A QR that no longer resolves shows a friendly "This QR is no longer active" screen.

**What would make us revisit:** Never. The permanence of the QR is a core promise to the venue.

---

### D-1.3 — There is no public URL a guest can type

**Decision:** The only way a guest reaches the guest experience is by scanning a QR. There is no public landing page, no venue directory, no search, no URL a guest can type. The QR is the entrance.

**Context:** The product promise is "scan and order". Any other entry point dilutes that promise and introduces a discovery surface the venue did not ask for.

**Alternatives considered:**
- A public directory of venues — rejected because it is a different product (a marketplace), and it is not what the venue asked for.
- A typed URL with a venue name — rejected for the same reason as D-1.2.

**Consequences:**
- Every guest screen assumes a valid QR context has been resolved.
- A guest who lands on the platform root without a QR context sees a small screen that says "Scan the QR code at your table or in your room."
- There is no SEO, no indexing, and no public page for any venue.

**What would make us revisit:** If a venue asks for a public "click here to order" web link for marketing, we add a public path-based URL as an opt-in per venue.

---

## 2. Guest Identity

### D-2.1 — The guest is always anonymous

**Decision:** A guest never creates an account, never logs in, and is never asked for personal details. The guest is identified only by the QR they scanned. The product knows only which venue and which table, room, or counter the guest is at.

**Context:** The product promise is zero friction. Any account-creation step loses guests before they see the menu.

**Alternatives considered:**
- Optional accounts for repeat guests — deferred. Revisit only if a venue asks for a loyalty feature.
- Mandatory accounts — rejected outright, because it would lose most guests.

**Consequences:**
- The guest session is anonymous and tied to the QR context.
- No guest data is ever collected beyond what the guest voluntarily types (notes, request details).
- The venue cannot contact a guest after they leave unless the guest chooses to share contact information inside a request.

**What would make us revisit:** If a venue asks for a loyalty program or a "return guest" feature, we add optional guest accounts isolated to that venue.

---

### D-2.2 — The guest's cart lives only on the guest's phone

**Decision:** The guest's cart lives only on the guest's phone, in the browser. It is not sent to the server until the guest places the order. If the guest closes the browser, the cart is lost.

**Context:** Storing the cart on the server adds a guest-session concept and a database write for every cart change, which is expensive and unnecessary for a flow that typically lasts a few minutes.

**Alternatives considered:**
- A server-side cart tied to a guest session — rejected because it adds load and complexity for a flow that is usually short.
- A server-side cart with a short timeout — rejected for the same reason, plus it still needs the guest-session concept.

**Consequences:**
- A guest who refreshes the page keeps their cart, as long as the browser retains local state.
- A guest who closes the browser loses their cart.
- No server resources are consumed by guests who browse but never order.

**What would make us revisit:** If guests complain about losing carts, or if a longer browsing pattern emerges (for example, a hotel guest building a cart over an hour), we add a server-side cart with a short timeout.

---

### D-2.3 — The guest session ends when staff close the table or room

**Decision:** The guest's anonymous session is tied to the table or room context. It stays active until the venue's staff explicitly close the table or check out the room. At that moment, the session ends and the next guest who scans the same QR starts fresh with no memory of the previous guest.

**Context:** For a restaurant, a table is reused across many guests in a day. For a hotel, a room is reused across many stays. The product must not leak one guest's data to the next.

**Alternatives considered:**
- A fixed timeout (for example, four hours) — rejected because a table might be reused in less time, and the timeout would then leak data.
- End on browser close — rejected because the guest might close and reopen, and an order in progress would be orphaned.

**Consequences:**
- The venue's staff have an explicit "close table" or "check out room" action.
- Closing the table ends every session tied to it, and the table becomes available for the next guest.
- A guest who has not ordered yet is not affected by a table close.
- The next guest who scans the same QR starts a completely fresh session.

**What would make us revisit:** Never. This is a privacy and trust requirement.

---

### D-2.4 — If a guest moves tables, the cart follows the guest

**Decision:** If a guest moves from one table to another during a meal, the guest's cart and order history follow the guest. This works because the guest's browser holds the cart, and the venue's staff can move the order to the new table from the staff panel.

**Context:** Guests sometimes move — a larger group arrives, a table is too hot or too cold, a reservation takes priority. The product should not force the guest to re-enter their cart.

**Alternatives considered:**
- The cart is tied to the table and does not follow the guest — rejected because it forces the guest to re-enter everything if they move.
- Automatic detection of the move — rejected because the product cannot know when the guest has moved unless the guest scans the new table's QR.

**Consequences:**
- The cart lives on the guest's phone and is unaffected by a table change.
- If the guest scans the new table's QR while they have an active order, the product shows them their existing order and asks if they want to move it to the new table.
- The staff can also manually move an order from one table to another.

**What would make us revisit:** Never. The cart belonging to the guest is the natural model.

---

### D-2.5 — A room QR never shows a previous guest's data

**Decision:** A room QR never reveals any data from a previous guest. Every time a guest scans a room QR, they start a completely fresh session. The only case where a session is remembered is when the same guest, on the same device, rescans the same room QR without checking out.

**Context:** A hotel room is a private space. Leaking one guest's requests, orders, or notes to another is unacceptable.

**Alternatives considered:**
- Remember the last session for a short time — rejected. Even a short memory is a privacy risk.
- Always ask "is this a new guest?" — rejected because it introduces friction the guest should not have to answer.

**Consequences:**
- The room's QR is tied to the room, not to the guest. The guest's session is created fresh on every scan.
- When a guest checks out, the room's session is invalidated.
- Any requests still open at checkout are archived and not shown to the next guest.

**What would make us revisit:** Never.

---

## 3. Staff Identity

### D-3.1 — Staff log in with username and password

**Decision:** Staff log in with a username and a password. The username is chosen by the manager when creating the account. The password is chosen by the manager or by the staff member.

**Context:** Staff accounts are created by the manager, who knows the staff member's name, not necessarily their email. Username login is simpler for venues where staff do not have work emails.

**Alternatives considered:**
- Email and password — rejected because many venue staff do not have work emails and would have to use personal emails the venue does not want on file.
- Either username or email — deferred for the first version because it introduces ambiguity and duplicate identities.

**Consequences:**
- Each staff account has a unique username per venue.
- The manager can record the staff member's email for contact, but it is not used for login.
- Password reset is done by the manager, per D-3.8.

**What would make us revisit:** If a venue asks for email-based login, or for single sign-on, we reopen.

---

### D-3.2 — Staff sessions last until the staff member logs out

**Decision:** A staff session stays active until the staff member explicitly logs out. There is no automatic timeout.

**Context:** Staff work long shifts and use shared devices. An automatic timeout would force them to log in repeatedly, which is a friction point during a busy service.

**Alternatives considered:**
- A fixed timeout (for example, twelve hours) — rejected because a double shift would trigger a mid-service logout.
- A short idle timeout (for example, thirty minutes) — rejected for the same reason.

**Consequences:**
- Staff must remember to log out at the end of their shift, especially on shared devices.
- The manager can force-log-out a staff member from the admin panel if needed.
- A session left open on a shared device is a mild risk. The manager can mitigate it by reminding staff to log out.

**What would make us revisit:** If a venue complains about staff leaving sessions open on shared devices, we add an optional idle timeout configurable by the manager.

---

### D-3.3 — A password change invalidates all of the staff member's existing sessions

**Decision:** When a staff member's password is changed — by the manager or by the staff member — all of their existing sessions are invalidated immediately. They must log in again with the new password.

**Context:** If a staff member suspects their password is compromised, the change needs to take effect immediately. Leaving old sessions alive would defeat the purpose.

**Alternatives considered:**
- Existing sessions continue until they expire — rejected because it leaves a security hole.

**Consequences:**
- The staff member is logged out of every device after a password change.
- The manager should tell the staff member before resetting the password, so the staff member is not surprised mid-shift.

**What would make us revisit:** Never.

---

### D-3.4 — A staff member can be logged in on only one device at a time

**Decision:** A staff member can only be logged in on one device at a time. Logging in on a new device ends the session on the previous device.

**Context:** This prevents a staff member's credentials from being silently shared across multiple devices without the manager's knowledge. It also keeps the queue views honest — a staff member cannot be in two queues at once.

**Alternatives considered:**
- Multiple devices allowed — rejected because it makes the "who is on duty" picture unclear.
- A limited number of devices — rejected because the limit is arbitrary.

**Consequences:**
- If a staff member logs in on a second device, the first device is signed out and shows the login screen on the next action.
- If a shared tablet is used by multiple staff across a shift, each staff member logs in and out in turn.
- If a staff member forgets to log out of a device and logs in elsewhere, the forgotten device is signed out automatically.

**What would make us revisit:** If a venue needs a staff member on two devices (for example, a tablet at the pass and a phone on the floor), we add an exception for specific roles.

---

### D-3.5 — Staff log in with a full password; no PIN, no badge

**Decision:** Staff log in with a full password. There is no PIN-only mode and no physical badge or card login in the first version.

**Context:** A full password is the simplest thing to implement, and it is sufficient for the first version. PINs and badges are convenient but add complexity that is not needed now.

**Alternatives considered:**
- A short PIN for quick re-login on shared tablets — deferred. Revisit if the manager asks for it, since typing a full password every time on a shared tablet is slow.
- A physical badge — deferred. It requires hardware the venue may not have.

**Consequences:**
- Staff typing on shared tablets need to enter a full password at the start of each shift.
- The manager must not use weak passwords.

**What would make us revisit:** If a venue complains that full-password login on a shared tablet slows the shift, we add an optional PIN set by the staff member and stored securely.

---

### D-3.6 — A staff member can hold multiple roles

**Decision:** A staff member can hold more than one role. For example, a person who covers the front desk and also handles housekeeping has both roles and sees both queues. The product shows the union of the roles' views.

**Context:** Small venues often have staff wearing multiple hats. A housekeeping attendant might also take laundry requests. A manager might also serve tables on a busy night.

**Alternatives considered:**
- One role per staff member — rejected because it forces the manager to create duplicate accounts or to make everyone a manager.
- A role plus a list of specific permissions — deferred, because it is more complex than needed for the first version.

**Consequences:**
- The admin panel shows all of a staff member's queues in one place.
- The staff member can switch between their queues, or see them side by side.
- The manager assigns roles when creating or editing a staff member.

**What would make us revisit:** If a venue asks for per-permission control (for example, "can see revenue but cannot issue refunds"), we add a permission layer on top of roles.

---

### D-3.7 — Deactivated staff keep their history under their name

**Decision:** When a staff member is deactivated, their account can no longer log in, but every action they took remains in the venue's history, attached to their name and marked as a former staff member.

**Context:** The venue needs to know who did what. If a manager needs to review why an order was cancelled three weeks ago, they need the name of the staff member who cancelled it, even if that person no longer works there.

**Alternatives considered:**
- Anonymise the actions — rejected because it removes the ability to investigate.
- Delete the account entirely — rejected because it would orphan the actions.

**Consequences:**
- Every order and request shows the name of the staff member who handled it, forever.
- The admin panel has a "former staff" filter so the manager can see only current staff when managing accounts, or all accounts when reviewing history.

**What would make us revisit:** Never.

---

### D-3.8 — Only the manager can reset a staff password

**Decision:** A staff member cannot reset their own password. Only the manager can reset it from the admin panel. The manager shares the new password with the staff member out of band — in person, or by whatever the venue uses.

**Context:** Staff accounts are created by the manager and do not have personal emails on file. A self-service reset would require email or SMS, which the venue does not want to set up.

**Alternatives considered:**
- Email-based self-service reset — rejected because most staff do not have work emails.
- SMS-based reset — rejected because it requires phone number collection and an SMS provider.

**Consequences:**
- If a staff member forgets their password, they ask the manager, who resets it.
- The manager must be available during shifts in case a password reset is needed.
- The admin panel has a prominent "Reset password" action on each staff account.

**What would make us revisit:** If a venue grows large enough that a manager is not always available, we add email-based self-service reset as an option.

---

## 4. Order Identity

### D-4.1 — Prices and item details are frozen at the moment of ordering

**Decision:** When an order is placed, the exact prices, item names, and modifier details are recorded with the order. If the menu changes later, the historical order keeps its original details. The venue's reporting is based on what was actually charged, not on what the menu says today.

**Context:** If a price changes tomorrow, yesterday's revenue must not change. This is a fundamental accounting requirement.

**Alternatives considered:**
- Live prices that follow the current menu — rejected because it makes reporting impossible and would surprise the guest.

**Consequences:**
- The order stores a copy of each item's name, price, and modifiers as they were at the moment of ordering.
- A menu item can be removed and the historical orders still show it correctly.
- Reports reflect the actual amount charged, which is what the venue needs.

**What would make us revisit:** Never.

---

### D-4.2 — Menu items have three states, and the manager controls them

**Decision:** A menu item can be in one of three states:

1. **Available** — the guest can see the item and order it.
2. **Unavailable** — the guest can see the item but cannot order it. It appears greyed out with a small label like "Unavailable" or "Sold out". The manager sets this state from the admin panel.
3. **Hidden** — the guest does not see the item at all. The manager sets this state from the admin panel.

The transition between these states is a manager action in the admin panel. When a manager changes an item's state, the guest's menu updates within the polling interval and plays a small ping on the guest's device if the guest has the menu open.

Historical orders keep the item's name and price as they were when the order was placed, regardless of the item's current state.

**Context:** The manager must be able to take an item off the menu quickly — for example, when a dish sells out — and put it back later. The guest must see what is not currently available so they are not surprised. The manager must never lose the item's history.

**Alternatives considered:**
- Automatic unavailability based on stock — deferred. The product does not track stock in the first version.
- A push notification to the guest when an item changes — rejected because the guest should not be interrupted. An on-screen update with a ping is enough.
- Hard deletion of the item — rejected because it would break historical orders.

**Consequences:**
- A guest looking at the menu when the manager marks an item unavailable sees it grey out within the polling interval, with a ping on their device.
- A guest not looking at the menu sees the item already greyed out when they return.
- Historical orders are unaffected by any state change.
- The menu management screen in the admin panel has three actions per item: Make available, Make unavailable, Hide.

**What would make us revisit:** If a venue asks for stock-based unavailability, we add a stock field and an automatic transition to "Unavailable" when the stock reaches zero.

---

### D-4.3 — One tax rate for the whole venue

**Decision:** The venue has a single tax rate applied to the subtotal of every order. There are no per-item or per-section tax rates in the first version.

**Context:** Most venues have one tax rate. Handling multiple rates adds complexity to the menu, the order, and the reports without benefit for the first version.

**Alternatives considered:**
- Per-section tax (for example, dine-in versus takeaway) — deferred. Revisit if a venue needs it.
- Per-item tax — deferred. Revisit if a venue needs it.

**Consequences:**
- The tax rate is a single setting in the venue's configuration.
- Every order uses the same rate.
- A venue with multiple rates cannot use the product yet.

**What would make us revisit:** If a venue operates in a region with different tax rates for dine-in and takeaway, or for food and alcohol, we add per-section or per-item rates.

---

### D-4.4 — Historical orders keep their tax rate

**Decision:** When the venue's tax rate changes, historical orders keep the tax rate that was in effect when they were placed. Only new orders use the new rate.

**Context:** Reports must reflect what was actually charged. Recalculating historical orders would corrupt the record.

**Alternatives considered:**
- Recalculate all historical orders — rejected because it corrupts the record.

**Consequences:**
- The order stores the tax rate it used.
- A tax-rate change does not affect any order placed before the change.
- Reports always show the correct tax collected.

**What would make us revisit:** Never.

---

### D-4.5 — One bill per table or room; no splitting in the first version

**Decision:** Every order for a table or room is part of one bill. There is no splitting by item and no splitting by person. The guest sees the total for their table or room.

**Context:** Splitting the bill is a common request in restaurants, but it introduces significant complexity in the payment flow and the reporting. For the first version, one bill per table or room keeps the flow simple.

**Alternatives considered:**
- Split by item — deferred. Revisit if guests ask for it.
- Split equally by number of people — deferred for the same reason.

**Consequences:**
- The guest sees one running total for their table or room.
- If a group wants to split, they handle it among themselves after seeing the total.
- The manager's reports show the total revenue, not the split.

**What would make us revisit:** If a venue asks for bill splitting, we add it as an option per venue.

---

### D-4.6 — Once placed, an order cannot be modified

**Decision:** Once an order is placed, it is final. If the guest wants more, they place a new order. If they want something removed or changed, the staff cancel the order (or part of it) from the staff panel and the guest places a new one.

**Context:** Allowing the guest to modify an order after the kitchen has started it creates chaos in the kitchen queue and makes pricing fragile.

**Alternatives considered:**
- A short window (two minutes) for the guest to modify — rejected because it introduces a race condition with the kitchen and complicates the queue.
- The guest can add items to an order at any time — rejected because it makes one order span multiple kitchen tickets, which is confusing.

**Consequences:**
- Guests who want to add items place a new order. The product makes this easy with an "add more items" button on the tracking screen.
- The venue's staff handle cancellations, not the guest.
- A guest's bill may include several orders if they order in waves, but the total is correct.

**What would make us revisit:** If a venue complains about the number of orders a table generates, we add a "combine orders into one bill" feature for the guest.

---

### D-4.7 — Only staff can cancel an order

**Decision:** A guest cannot cancel an order. Only staff can cancel an order from their panel. If a guest wants to cancel, they call a waiter or the front desk.

**Context:** Allowing guests to cancel freely would let them cancel after the kitchen has started, wasting food. The staff are the ones who should decide.

**Alternatives considered:**
- The guest can cancel within a short window — rejected because it creates a race condition with the kitchen.
- The guest can cancel at any time — rejected as operationally unreasonable.

**Consequences:**
- The guest sees an "ask the staff to cancel" link instead of a cancel button.
- The staff panel has a "cancel" action on every active order, with a reason.
- Every cancellation is recorded with the reason and the staff member's name.

**What would make us revisit:** If a venue wants a guest-initiated cancel window, we add it as an option.

---

### D-4.8 — The order states are Placed, Approved, Preparing, Ready, Delivered, Completed, Cancelled

**Decision:** An order moves through the following states, in this order:

1. **Placed** — the guest has submitted the order, and it has reached the venue's server.
2. **Approved** — the staff or the kitchen have accepted the order and are ready to work on it.
3. **Preparing** — the kitchen has started making the order.
4. **Ready** — the kitchen has finished and the order is waiting to be delivered.
5. **Delivered** — the order has reached the table or room.
6. **Completed** — the guest has paid or the meal is closed out.
7. **Cancelled** — the order was cancelled, with a reason.

No additional states are introduced in the first version.

**Context:** These seven states cover every real order. More states add no value; fewer states lose information.

**Alternatives considered:**
- Fewer states (for example, just Placed, Preparing, Done) — rejected because the venue cannot see whether an order is ready but not yet delivered.
- More states (for example, separate "in the pass" and "in the expo") — deferred. Revisit if a venue wants finer granularity.

**Consequences:**
- Every order moves through a known set of states.
- The guest's tracking screen shows the states that are relevant to them, hiding the ones they do not need.
- The kitchen screen shows only the states it acts on.

**What would make us revisit:** If a venue asks for finer order tracking, we add states.

---

### D-4.9 — Any staff member can move an order to its next state

**Decision:** Any staff member with an active session can advance an order from one state to the next, regardless of their role. There is no role-based restriction on order-state transitions.

**Context:** In small venues, the manager, the kitchen, and the service staff all move orders. Restricting transitions by role creates friction without a real security benefit.

**Alternatives considered:**
- Only the kitchen can move Placed → Approved → Preparing → Ready; only service can move Ready → Delivered → Completed — rejected because it slows down a busy kitchen and forces staff to switch devices.
- Only managers can move orders — rejected as too restrictive.

**Consequences:**
- Every staff member can act on any order.
- The action is recorded with the staff member's name, so the venue can review if needed.
- The manager can see who moved each order in the order's history.

**What would make us revisit:** If a venue wants role-based state restrictions, we add them as an option.

---

### D-4.10 — No timers or automatic alerts on the order; the state is what matters

**Decision:** The order does not have a running timer or an automatic alert if it is stuck. The order shows only its current state. The elapsed time since the order was placed is visible on the staff and kitchen screens, but no automatic alert fires.

**Context:** The venue's staff are the best judges of urgency. An automatic timer would be noisy and often wrong.

**Alternatives considered:**
- An alert if the order is in one state for more than a fixed number of minutes — deferred. Revisit if a venue asks for it.
- A visible countdown — rejected for the same reason.

**Consequences:**
- Staff look at the elapsed time to judge urgency and act accordingly.
- No automated alerts, no false alarms.
- The manager can see the elapsed time in reports to spot problems.

**What would make us revisit:** If a venue asks for SLA-based alerts, we add them as an optional per-venue setting.

---

## 5. Service Request Identity

### D-5.1 — One generic request structure for all services

**Decision:** All hotel services use the same request structure. A request has a room, a service type (housekeeping, maintenance, concierge, laundry, spa, late checkout, wake-up call, do not disturb), a set of details, a status, and a history. The details differ per service, but the surrounding structure is identical.

**Context:** Building a completely different flow for each service would multiply the work and the maintenance. A shared structure with service-specific details is simpler and behaves consistently across the staff panel.

**Alternatives considered:**
- A dedicated flow for each service — rejected because it forces the codebase to grow with every service.
- A single form for all services — rejected because it would lose the specific fields each service needs (for example, a photo for maintenance).

**Consequences:**
- The staff panel shows all requests in a unified queue, filterable by service type.
- Adding a new service is a matter of defining its fields and its queue, not building a new flow.
- The guest sees a tailored form for each service, but the underlying request is the same shape.

**What would make us revisit:** If a service needs a fundamentally different flow (for example, a spa booking with a real calendar), we consider a dedicated flow for that service.

---

### D-5.2 — A service request moves through Submitted, Acknowledged, In Progress, Completed, Cancelled, Declined

**Decision:** A service request moves through the following states, in this order:

1. **Submitted** — the guest has submitted the request.
2. **Acknowledged** — a staff member has seen it and accepted it.
3. **In Progress** — the staff member is working on it.
4. **Completed** — the request is done.
5. **Cancelled** — the guest or staff cancelled it.
6. **Declined** — the venue cannot fulfil the request.

**Context:** These six states cover every real request.

**Alternatives considered:**
- Fewer states — rejected because it loses information (for example, Acknowledged versus In Progress).
- More states — deferred.

**Consequences:**
- The guest sees the states that are relevant to them.
- The staff see all states and act on the transitions.
- Every state change is recorded with the time and the staff member's name.

**What would make us revisit:** If a venue asks for finer request tracking, we add states.

---

### D-5.3 — The guest can cancel a request only while it is still Submitted

**Decision:** A guest can cancel a service request only while it is still in the Submitted state. Once a staff member has acknowledged it, only staff can cancel it.

**Context:** If the staff have already started on the request, cancelling from the guest side would waste their work. Before they start, the guest's change of mind is fine.

**Alternatives considered:**
- The guest can cancel at any time — rejected because it disrupts staff mid-task.
- The guest can never cancel — rejected because it forces the guest to ask the staff, which is friction.

**Consequences:**
- The guest sees a "Cancel" button while the request is in Submitted.
- The "Cancel" button disappears once the request is Acknowledged.
- Staff can cancel any request at any time, with a reason.

**What would make us revisit:** Never.

---

### D-5.4 — The guest can edit a request only while it is still Submitted

**Decision:** A guest can change the details of a service request while it is still in the Submitted state. Once it is Acknowledged, the guest cannot change it; they would have to cancel and submit a new one.

**Context:** Same reasoning as D-5.3. Before staff start, the guest can revise. After, it is in motion.

**Alternatives considered:**
- The guest can never edit — rejected because it forces a cancel and resubmit for a trivial change.
- The guest can always edit — rejected because it disrupts the staff mid-task.

**Consequences:**
- The request screen has an "Edit" action while the state is Submitted.
- After Acknowledged, the action is hidden.
- Staff always work from the latest version the guest submitted.

**What would make us revisit:** Never.

---

### D-5.5 — Service requests show elapsed time; no automatic SLA alerts

**Decision:** Service requests show the elapsed time since they were submitted. No automatic alert fires if a request is open too long.

**Context:** Same reasoning as D-4.10. The venue's staff judge urgency.

**Alternatives considered:**
- SLA alerts — deferred. Revisit if a venue asks for them.

**Consequences:**
- The staff queue shows the elapsed time so staff can prioritise.
- The manager can see request times in reports.

**What would make us revisit:** If a venue asks for SLA-based alerts, we add them as an option.

---

### D-5.6 — There is no messaging between guest and staff inside a request

**Decision:** There is no chat thread inside a service request. The guest submits the request with details; the staff act on it and mark it done. If the guest needs to communicate, they call the front desk.

**Context:** A chat thread adds significant complexity — real-time messaging, notifications, moderation. For the first version, the request is one-way.

**Alternatives considered:**
- A chat thread per request — deferred. Revisit if a service (for example, concierge) needs back-and-forth.
- A chat thread only for concierge — deferred for the same reason.

**Consequences:**
- The request form is a one-time submission.
- The guest sees the request status, not a conversation.
- If the venue needs to ask the guest a question, they call the room phone or visit the room.

**What would make us revisit:** If a venue asks for concierge messaging, we add a chat thread to that specific service.

---

### D-5.7 — The guest sees only requests from the current stay

**Decision:** A guest sees only the requests from their current stay. When they check out, the requests are archived and the next guest sees nothing.

**Context:** Same privacy reasoning as D-2.5.

**Alternatives considered:**
- The guest sees their own past stays — rejected because there are no guest accounts, so there is no way to know it is the same guest.

**Consequences:**
- The Requests tab shows only the current stay.
- On checkout, the requests are archived and not shown again.
- The venue's staff and manager can still see the historical requests.

**What would make us revisit:** Never.

---

## 6. Kitchen and Fulfilment

### D-6.1 — The kitchen sees orders only after staff approve them

**Decision:** When a guest places an order, it does not go to the kitchen immediately. It goes to the venue's staff panel first, where a staff member approves it. Only after approval does the order appear in the kitchen.

**Context:** Approval gives the venue a chance to catch mistakes before the kitchen invests time. It also lets the venue handle cases where a table has left, or where the guest ordered something that is no longer available.

**Alternatives considered:**
- The kitchen sees orders immediately — rejected because it removes the venue's chance to catch mistakes.

**Consequences:**
- Every order passes through a staff approval step.
- In a venue where the manager wants orders to go straight to the kitchen, the approval can be configured to be automatic (a "trusted mode"), but this is a per-venue setting.
- The guest's tracking screen shows Placed until the staff approve, then Approved.

**What would make us revisit:** If a venue wants auto-approval, we add a per-venue toggle.

---

### D-6.2 — No "pause new orders" feature in the first version

**Decision:** The kitchen cannot pause new orders. If the kitchen is backed up, the staff handle it by approving orders more slowly, or by communicating with the guests.

**Context:** A pause button seems useful but introduces edge cases — paused guests see no progress, staff must remember to unpause, a pause left on overnight is a disaster. The staff approving slowly achieves the same result.

**Alternatives considered:**
- A pause button for the whole kitchen — deferred. Revisit if a venue asks for it.
- A pause per station — deferred for the same reason.

**Consequences:**
- The kitchen queue fills up during a rush, and the staff pace themselves.
- The venue can communicate a delay to guests through the tracking screen if needed.

**What would make us revisit:** If a venue asks for a pause, we add it as a per-venue setting.

---

### D-6.3 — Tickets are not assigned to kitchen stations

**Decision:** In the first version, the kitchen is treated as one unit. Tickets are not assigned to specific stations. Every ticket appears in the same queue, and the kitchen staff decide among themselves who makes what.

**Context:** Station-based routing requires the venue to define stations and the product to route items to stations. For the first version, the venue's own coordination is simpler.

**Alternatives considered:**
- Station-based routing — deferred. Revisit if a venue has a large kitchen with distinct stations.

**Consequences:**
- The kitchen screen shows one queue.
- The kitchen staff coordinate verbally, as they do today.

**What would make us revisit:** If a large venue asks for station-based routing, we add it.

---

### D-6.4 — The whole ticket is one unit, marked done at once

**Decision:** The kitchen marks the entire ticket as Preparing when starting, and as Ready when the whole ticket is done. Individual items are not marked separately.

**Context:** Marking items separately creates a more complex kitchen screen and more clicks for the staff. For most venues, the whole ticket is done together.

**Alternatives considered:**
- Individual item marking — deferred. Revisit if a venue has very large tickets (for example, a banquet) where items finish at different times.

**Consequences:**
- The kitchen's actions are simple: Start and Ready.
- The service staff see the whole order as Ready at once.
- The guest sees the whole order as Ready at once.

**What would make us revisit:** If a venue asks for item-level tracking, we add it.

---

### D-6.5 — Only the kitchen screen plays an audible ping

**Decision:** The kitchen screen is the only screen that plays an audible ping. When a new ticket arrives, the kitchen pings. No other screen plays any sound. The ping is always on; there is no mute option.

The guest's menu also plays a small ping when an item's availability changes while the menu is open — this is a guest-side cue, not a staff cue, and it is separate from the kitchen ping.

**Context:** The kitchen staff are often not looking at the screen. An audible ping is the fastest way to bring their attention to a new ticket. The staff and manager areas stay quiet so the venue is not full of sounds.

**Alternatives considered:**
- Ping on staff queues as well — rejected because a room full of pings is chaotic.
- Ping on the manager dashboard — rejected for the same reason.
- No ping anywhere — rejected because the kitchen must not miss a ticket.
- A mute option for the kitchen — rejected per the venue's preference that the kitchen never miss a ticket.

**Consequences:**
- The kitchen screen always pings on a new ticket.
- The service staff queues, the housekeeping queue, the maintenance queue, the concierge queue, the laundry queue, the spa queue, and the front desk view are silent.
- The manager dashboard is silent.
- The guest's menu pings only when an item's availability changes while the guest is looking at it.

**What would make us revisit:** If a venue asks for pings on staff queues, we add them as a per-venue setting.

---

### D-6.6 — The kitchen and staff screens poll every 5 seconds

**Decision:** The kitchen screen and the staff screens poll for updates every 5 seconds. They are not live-push in the first version. The guest's tracking screen also polls, at the same interval, when it is open.

**Context:** Polling every 5 seconds is simple, works everywhere, and gives the kitchen and staff a reasonable freshness without hammering the server. A faster refresh increases server load; a slower refresh risks a ticket being seen late.

**Alternatives considered:**
- Every 2 seconds — deferred. Revisit if the venue needs faster freshness.
- Live push (Server-Sent Events) — deferred to a later version. Revisit if the venue grows large enough.

**Consequences:**
- A new ticket appears on the kitchen screen within 5 seconds.
- A staff queue updates within 5 seconds.
- A guest's tracking screen updates within 5 seconds when it is open.
- The server load is reasonable.

**What would make us revisit:** If a venue asks for faster refresh, we reduce the interval or add live push.

---

## 7. Payments

### D-7.1 — The payment infrastructure is built; no provider is connected in the first version

**Decision:** The first version builds a payment bridge — a small, isolated layer that:

- Accepts a payment request (order or bill, amount, currency, reference).
- Records a ticket ID and a transaction ID for every attempt.
- Provides a confirmation endpoint that a provider's callback can call to mark a payment as succeeded or failed.
- Provides a verification step that the product runs before treating a payment as confirmed, so a spoofed callback cannot mark an order as paid.
- Shows the guest a thank-you message and a receipt only after verification passes.

The bridge is designed so that a specific provider can be plugged in later by writing one adapter that conforms to the bridge's interface. In the first version, the bridge is present, the records are written, the confirmation and verification flows are testable, but no live provider is connected. A venue that wants to accept payments on day one uses the cash-at-counter path.

**Context:** The venue asked for the payment infrastructure to be ready without integrating a provider. The intended first providers are eSewa (Nepal) and UPI (India). Building the bridge first, without locking to a provider, keeps the option open and matches the plan of aligning per organisation later.

**Alternatives considered:**
- Integrate eSewa now — deferred. Revisit when a Nepal-based venue is onboarded.
- Integrate UPI now — deferred. Same reason.
- Integrate Stripe now — deferred. Not the target region.
- Skip payments entirely for the first version — rejected because the venue asked for the infrastructure.

**Consequences:**
- The product can record and verify payments without being tied to any provider.
- Adding a provider later is one adapter, not a rewrite.
- The first version ships with the cash-at-counter path fully working.
- Every payment attempt, successful or not, is recorded with its ticket ID and transaction ID.

**What would make us revisit:** When the first venue in Nepal or India is onboarded, we write the eSewa or UPI adapter and enable online payment for that venue.

---

### D-7.2 — The payment provider is configured per venue

**Decision:** When the payment bridge is connected to a live provider, the provider's credentials are configured per venue by the developer in code, at the time of onboarding. The manager does not configure the provider from the admin panel.

**Context:** The venue's branding and configuration are developer-controlled per D-9.1. The payment provider follows the same model — it is set up per venue, in code, by the developer.

**Alternatives considered:**
- A self-service payment configuration in the admin panel — deferred until the product is offered as a general SaaS.

**Consequences:**
- Adding a provider for a venue is a developer task.
- Each venue's payment credentials are held in the venue's own configuration.
- If the venue has no provider configured, the product shows the cash-at-counter path to the guest.

**What would make us revisit:** When the product is offered as a general SaaS, we add self-service payment configuration.

---

### D-7.3 — The guest can pay online or in cash at the counter

**Decision:** The guest can pay online through the venue's payment bridge (once a provider is connected), or they can pay in cash at the counter. The product supports both paths.

**Context:** Not every guest wants to pay online, and not every venue has a card terminal. Cash at the counter is a real option.

**Alternatives considered:**
- Online only — rejected because it forces every guest to use a card.
- Cash only — rejected because it loses the convenience of online payment.

**Consequences:**
- The tracking screen has a "Pay now" button when the venue has a provider configured, and a "Pay at the counter" option always.
- If the guest pays at the counter, the staff mark the order as paid.
- Both types of payment are recorded in the order's history.

**What would make us revisit:** Never.

---

### D-7.4 — Tipping is optional, with a custom amount

**Decision:** The guest can add an optional tip during the payment flow. The tip is a custom amount they enter; if they leave it blank, no tip is added.

**Context:** Some venues expect tips, others do not. A custom amount lets the guest decide, and a blank default keeps it unobtrusive.

**Alternatives considered:**
- No tipping — rejected because venues in some regions expect it.
- Preset percentages — rejected because the guest might feel pressured.

**Consequences:**
- The payment screen has an optional tip field.
- The tip is added to the bill.
- The tip is recorded separately in the reports so the venue can distribute it.

**What would make us revisit:** If a venue asks for preset percentages, we add them as an option.

---

### D-7.5 — Refunds are handled outside the product

**Decision:** The product does not issue refunds. If a guest wants a refund, they ask at the counter, and the staff handle it through the payment provider's own tools. The product records the original payment and the fact that a refund was requested.

**Context:** Building refund logic into the product adds complexity (full versus partial, reason codes, provider-specific rules) for a rare event.

**Alternatives considered:**
- Refunds from the manager panel — deferred. Revisit if a venue asks for it.

**Consequences:**
- The manager cannot issue refunds from the product.
- The product shows the original payment record and a note that the guest requested a refund.
- The venue handles the refund outside the product.

**What would make us revisit:** If a venue asks for in-product refunds, we add them.

---

### D-7.6 — The guest gets a digital receipt

**Decision:** After payment, the guest sees a digital receipt they can view on screen and download. The receipt can also be emailed if the guest enters an email address.

**Context:** Guests need a record of their payment. A digital receipt is the standard.

**Alternatives considered:**
- No receipt — rejected because guests expect one.
- Print-only receipt — rejected because the venue may not have a printer.

**Consequences:**
- The payment success screen shows the receipt.
- The receipt has a download button and an optional email field.
- The receipt is also stored in the venue's records.

**What would make us revisit:** Never.

---

## 8. Real-Time, Offline, and Reliability

### D-8.1 — Polling every 5 seconds for kitchen, staff, and guest tracking screens

**Decision:** The kitchen screen, the staff queues, and the guest's tracking screen poll for updates every 5 seconds. They are not live-push in the first version.

**Context:** Same as D-6.6. Polling is simple and works everywhere.

**Alternatives considered:**
- Live push (Server-Sent Events) — deferred to a later version.
- Polling every 2 seconds — deferred. Revisit if the venue needs faster freshness.

**Consequences:**
- Screens update within 5 seconds.
- Server load is reasonable.

**What would make us revisit:** If a venue asks for faster refresh, we reduce the interval or add live push.

---

### D-8.2 — If the connection drops, the guest's order is queued locally

**Decision:** If the guest's connection drops while they are placing an order, the order is queued on the guest's phone and sent when the connection returns. The guest sees a "Sending…" state and then either a confirmation or an error.

**Context:** Guests on flaky wifi, especially in hotels, should not lose their cart just because the connection hiccupped.

**Alternatives considered:**
- Show an error and let the guest retry — rejected because it is a bad experience on a flaky network.
- Make the product work fully offline — rejected because it is a much larger effort and not needed for the first version.

**Consequences:**
- The guest's order is not lost if the connection drops briefly.
- The guest sees a clear "Sending…" state while the order is queued.
- If the connection is down for a long time, the guest sees an error and can retry.

**What would make us revisit:** If a venue's network is unreliable in a way that breaks this, we add a stronger offline queue.

---

### D-8.3 — The kitchen screen shows a "connecting" state and reconnects automatically

**Decision:** If the kitchen screen's connection drops, it shows a "connecting" state and retries automatically until the connection is restored.

**Context:** A kitchen screen must never silently show stale data without the staff knowing.

**Alternatives considered:**
- Show the last known state, marked as "stale" — rejected because the staff might act on stale data.
- Show an error and stop — rejected because it would require a manual refresh.

**Consequences:**
- The kitchen screen has a clear connection-state indicator.
- The screen retries automatically.
- The staff know immediately if the connection is down.

**What would make us revisit:** Never.

---

### D-8.4 — The guest's tracking screen shows live status changes when it is open

**Decision:** When the guest has the tracking screen open, the status of their order updates without a manual refresh. The screen polls every 5 seconds, and the changes appear as they happen.

**Context:** The guest should not have to refresh to see that their order is ready.

**Alternatives considered:**
- Manual refresh only — rejected because it is a poor experience.
- Live push — same as D-8.1, deferred to a later version.

**Consequences:**
- The tracking screen updates within 5 seconds of a status change.
- The guest sees a smooth transition when the state advances.
- The guest can leave the screen and come back to find the latest state.

**What would make us revisit:** Never.

---

### D-8.5 — Daily automatic backup, retained for 30 days

**Decision:** The venue's data is backed up automatically once a day, and the backups are retained for 30 days. Older backups are removed to keep storage under control.

**Context:** A daily backup is sufficient for the first version. Thirty days of retention gives the venue a month of recovery options.

**Alternatives considered:**
- Continuous backup with point-in-time recovery — deferred to a later version.
- Weekly backup — rejected because a week of lost data is too much.

**Consequences:**
- The venue can recover from most data-loss scenarios.
- A failure within the last 24 hours may lose up to 24 hours of data.
- Backup storage stays within reasonable bounds.

**What would make us revisit:** If a venue's data volume grows, or if a catastrophic loss occurs, we add continuous backup.

---

## 9. Branding and Theming

### D-9.1 — Every branding element is developer-controlled, per venue, in code

**Decision:** Every branding element — the venue's name, logo, brand color, hero image, welcome message, font choices, and language — is set by the developer in code, per venue, at the time of onboarding. The admin panel has no branding tab. The manager cannot change any branding.

**Context:** The venue's branding is a deliberate design choice, not a self-service toggle. The product is designed specifically for each organisation, and each venue's branding is aligned per organisation by the developer.

**Alternatives considered:**
- Self-service branding in the admin panel — deferred until the product is offered as a general SaaS.
- Partial self-service (color only) — deferred for the same reason.

**Consequences:**
- Onboarding a new venue is a developer task, not a manager task.
- Each venue's branding is deliberate and consistent.
- The admin panel is simpler — it has no branding tab.
- The codebase is aligned per organisation, one at a time.

**What would make us revisit:** When the product is offered to other organisations as a self-service product, we add self-service branding.

---

### D-9.2 — The brand color affects only the guest screens

**Decision:** The venue's brand color is used on the guest-facing screens only. The staff screens use a fixed, neutral palette.

**Context:** Staff tools should feel consistent across venues for training, support, and shared screenshots. A distinct palette for staff keeps that consistency.

**Alternatives considered:**
- Brand color used everywhere — rejected because it would make every venue's staff tools look different.

**Consequences:**
- The guest experience reflects the venue's brand color.
- The staff experience is identical across all venues.
- The staff learn the tool once and can use it anywhere.

**What would make us revisit:** Never.

---

### D-9.3 — Unreadable brand colours are rejected by the developer at onboarding

**Decision:** If a venue's proposed brand colour is unreadable on the guest surface, the developer chooses a different colour during onboarding. The product does not automatically adjust colours; the choice is made by the developer.

**Context:** An unreadable guest screen is worse than a slightly less brand-accurate one. The product must always be usable.

**Alternatives considered:**
- Automatically adjust the colour to a readable shade — deferred. Revisit if the developer wants a "make it readable" tool.
- Accept the colour anyway — rejected because it produces an unusable guest experience.

**Consequences:**
- The developer chooses a readable brand colour.
- The guest screen is always legible.
- There is no automatic colour adjustment in the product.

**What would make us revisit:** If the developer wants an automatic adjustment tool, we add it.

---

### D-9.4 — No dark mode on the guest screens

**Decision:** The guest screens are always light. There is no dark mode on the guest experience.

**Context:** The guest experience is designed for a warm, appetite-driven look. A dark mode would undermine that, and most guests prefer light menus on their phones.

**Alternatives considered:**
- Automatic dark mode based on device settings — rejected because it changes the guest's perception of the venue's brand.
- A guest toggle — rejected for the same reason.

**Consequences:**
- The guest screens are always light.
- The guest's device dark mode does not affect the guest experience.

**What would make us revisit:** Never.

---

### D-9.5 — The kitchen screen defaults to dark mode

**Decision:** The kitchen screen defaults to dark mode. The staff can switch to light mode if the kitchen is bright.

**Context:** Kitchens are often low-light environments. A dark screen is easier on the eyes and produces less glare.

**Alternatives considered:**
- Light mode by default — rejected because most kitchens are dark.
- No dark mode — rejected because it would be uncomfortable in a low-light kitchen.

**Consequences:**
- The kitchen screen starts dark.
- A toggle is available on the kitchen screen.
- The preference is remembered per device.

**What would make us revisit:** Never.

---

## 10. Multi-Venue and Multi-Tenant

### D-10.1 — One venue per installation in the first version

**Decision:** The first version supports one venue per installation. If a venue has both tables and rooms, it is one venue with both modules enabled. If a franchise wants more than one venue, they run more than one installation in the first version. Multi-venue per installation is deferred.

**Context:** The first version targets one venue, with both rooms and tables possible in the same venue. Multi-venue and multi-franchise support come later.

**Alternatives considered:**
- Multi-venue per installation — deferred. Revisit when a franchise asks for it.
- A true multi-tenant SaaS — deferred. This would be a large shift.

**Consequences:**
- One installation serves one venue.
- The venue's staff, menu, tables, and rooms are all in one place.
- A franchise runs more than one installation.
- The product can be extended to multi-venue later without a rewrite.

**What would make us revisit:** When a franchise asks for multi-venue support, or when the product is offered to other organisations, we add multi-venue per installation.

---

### D-10.2 — Venues are completely isolated from each other

**Decision:** If more than one venue exists in the future, each venue's data is completely isolated. No data is ever shared between venues.

**Context:** Even if two venues are owned by the same person, they are separate businesses. Sharing data between them would be surprising and potentially harmful.

**Alternatives considered:**
- Share some data (for example, menu templates) between venues — deferred. Revisit if a franchise asks for shared menus.

**Consequences:**
- No menu, order, staff, or guest data is ever shared between venues.
- Each venue has its own everything.
- Any shared feature would be an explicit, per-venue opt-in.

**What would make us revisit:** If a franchise asks for shared menus, we add them as an opt-in.

---

### D-10.3 — Only the developer can create a new venue

**Decision:** A new venue is created by the developer, not through a self-service flow. The developer sets up the venue's installation, its branding, its modules, and its initial data.

**Context:** The product is designed specifically for each organisation, and onboarding includes a developer. Self-service onboarding would require a lot of additional work.

**Alternatives considered:**
- Self-service onboarding — deferred. Revisit when the product is offered to other organisations.

**Consequences:**
- Onboarding a new venue is a developer task, not a manager task.
- Each venue's initial setup is deliberate and correct.
- Self-service onboarding is not part of the first version.

**What would make us revisit:** When the product is offered as a general SaaS, we add self-service onboarding.

---

### D-10.4 — A venue can be deactivated but not deleted

**Decision:** A venue can be deactivated. When deactivated, the venue's staff can no longer log in, and the guest QR codes no longer resolve; they show a friendly "This venue is no longer active" message. The venue's data is preserved and can be reactivated at any time.

**Context:** Deleting a venue would destroy its orders, requests, and history. Even a venue that closes might reopen, or might need its data for accounting. Deactivation preserves everything.

**Alternatives considered:**
- Hard delete with data destruction — rejected because it destroys history.
- Soft delete with archival to cold storage — deferred. Revisit if storage becomes an issue.

**Consequences:**
- The developer can deactivate a venue.
- The venue's data is preserved.
- The venue can be reactivated at any time.

**What would make us revisit:** Never.

---

## 11. Languages, Currencies, and Regions

### D-11.1 — The product is in English only

**Decision:** The product is in English only. There is no per-venue language setting, no guest language picker, and no multi-language support. Every screen — guest, staff, kitchen, and manager — is in English. If a venue operates in a non-English environment, the developer can localise the code per venue if needed, but this is a per-venue developer task, not a product feature.

**Context:** The venue confirmed the product is English-only. English is the default and only language in the first version.

**Alternatives considered:**
- Multi-language with a guest picker — deferred for the first version.
- Auto-detect from the browser — deferred for the same reason.
- A per-venue language setting — rejected because the venue asked for English only.

**Consequences:**
- Every text string in the product is English.
- A non-English venue is onboarded by editing the code if they want a different language, at the developer's discretion.
- No language infrastructure is built into the product.

**What would make us revisit:** If a venue asks for a second language as a first-class feature, we add a language setting.

---

### D-11.2 — One currency per venue

**Decision:** The venue has one currency. All prices, bills, and reports use that currency.

**Context:** One currency per venue is the natural model for a single physical venue.

**Alternatives considered:**
- Multiple currencies per venue — deferred. Revisit if a venue has international pricing.

**Consequences:**
- All prices use the venue's currency.
- The currency is set at onboarding.
- Reports use the venue's currency.

**What would make us revisit:** Never.

---

### D-11.3 — One tax rule per venue

**Decision:** The venue has one tax rule, applied to the subtotal of every order. See D-4.3.

**Context:** Same as D-4.3.

**Alternatives considered:**
- Multiple tax rules — deferred. See D-4.3.

**Consequences:**
- The tax rate is a single setting per venue.
- All orders use the same rate.

**What would make us revisit:** See D-4.3.

---

## 12. Reporting

### D-12.1 — Reports cover up to 6 months

**Decision:** The longest historical period a report can cover is 6 months. Reports beyond 6 months are not available in the first version.

**Context:** 6 months covers the venue's useful reporting window. Older data is still stored and can be extended to older ranges in a later version.

**Alternatives considered:**
- 30 days — rejected because a venue needs a seasonal view.
- 12 months — deferred. Revisit if a venue asks for it.
- All time — deferred. Revisit if a venue asks for it.

**Consequences:**
- Reports can cover any two dates within the last 6 months.
- Older data is available on request from the developer.
- The venue can see seasonal trends within a 6-month window.

**What would make us revisit:** If a venue asks for a longer range, we extend it.

---

### D-12.2 — Reports export as CSV only

**Decision:** Reports can be exported as CSV. No PDF, no Excel, in the first version.

**Context:** CSV opens in every spreadsheet, and is the format the venue's accountant will need.

**Alternatives considered:**
- PDF — deferred. Revisit if a venue asks for a formatted report.
- Excel — deferred for the same reason.

**Consequences:**
- The venue can download any report as a CSV.
- The CSV opens in Excel, Google Sheets, or any spreadsheet.
- No formatted reports in the first version.

**What would make us revisit:** If a venue asks for a PDF or Excel report, we add it.

---

### D-12.3 — No scheduled reports

**Decision:** The product does not email reports on a schedule. The manager downloads reports manually.

**Context:** Scheduled reports require an email infrastructure and a preference system. For the first version, manual download is sufficient.

**Alternatives considered:**
- Daily email — deferred. Revisit if a venue asks for it.
- Weekly email — deferred for the same reason.

**Consequences:**
- The manager opens the reports tab and downloads the CSV when they need it.
- No emails are sent by the product for reports.

**What would make us revisit:** If a venue asks for scheduled reports, we add them.

---

### D-12.4 — No aggregate staff activity reporting

**Decision:** The manager cannot see a report of individual staff activity (who did what, when) in the first version. Staff actions are recorded in each order and request history, but there is no aggregate staff report.

**Context:** Staff activity reporting is useful but can be misused for surveillance. For the first version, the manager can see the history of each order and request, which shows the staff member's name, but there is no aggregated "staff performance" view.

**Alternatives considered:**
- A staff activity report — deferred. Revisit if a venue asks for it.

**Consequences:**
- The manager sees staff names in order and request histories.
- There is no aggregate staff report.
- The staff do not feel surveilled by an aggregate view.

**What would make us revisit:** If a venue asks for staff activity reporting, we add it.

---

## 13. Notifications

### D-13.1 — The guest is not notified; they check the tracking screen

**Decision:** The guest is not notified by SMS, email, or push. The guest checks the tracking screen to see the order's status.

**Context:** The guest is anonymous and the product does not collect contact details. Notifications would require collecting contact information, which conflicts with the no-friction promise.

**Alternatives considered:**
- SMS — rejected because it requires collecting a phone number.
- Email — rejected for the same reason.
- Browser push — deferred. Revisit if the guest experience needs it.

**Consequences:**
- The guest must check the tracking screen to see the status.
- The tracking screen updates live when it is open.
- No notifications are sent by the product to the guest.

**What would make us revisit:** If a venue asks for guest notifications, we add them as an opt-in.

---

### D-13.2 — Staff are not notified beyond their queue and the kitchen ping

**Decision:** Staff are not notified by email, SMS, or push. They see new items in their queue. The kitchen screen has an audible ping for new tickets per D-6.5. There are no other notifications.

**Context:** Staff are at their station and can see the queue. Other notifications would be noise.

**Alternatives considered:**
- Browser notifications — deferred. Revisit if a staff member is often away from their screen.
- SMS — deferred for the same reason.

**Consequences:**
- Staff rely on the queue and the kitchen ping.
- No notifications are sent by the product to staff.

**What would make us revisit:** If a venue asks for browser notifications for staff, we add them.

---

### D-13.3 — The manager is not notified; they check the dashboard

**Decision:** The manager is not notified by email, SMS, or push. They see everything in the dashboard.

**Context:** Same as D-13.2. The manager can check the dashboard when they want.

**Alternatives considered:**
- Email — deferred. Revisit if a venue asks for it.

**Consequences:**
- The manager relies on the dashboard.
- No notifications are sent by the product to the manager.

**What would make us revisit:** If a venue asks for manager notifications, we add them.

---

## 14. Deployment

### D-14.1 — The product is deployable on any hosting and any compatible database

**Decision:** The product is designed so it can be deployed on any hosting platform and any database that meets the product's requirements. The first version is deployed on a specific hosting and a specific database, chosen for convenience, but the product's design does not lock the venue into a specific host or database.

**Context:** The product should be portable, so the venue or the developer can choose the hosting that suits them.

**Alternatives considered:**
- Locking to a specific host — rejected because it limits the venue's choice.
- Locking to a specific database — rejected for the same reason.

**Consequences:**
- The product's deployment is documented as a portable setup.
- The first version uses a specific host and database, chosen for convenience, not by design.
- The product can be moved to another host or database with effort but without a rewrite.

**What would make us revisit:** Never. Portability is a core promise.

---

### D-14.2 — No staging environment in the first version

**Decision:** The first version does not have a separate staging environment. Development and testing happen on the developer's local machine. Deployment is direct to production when the venue is ready.

**Context:** The first version is tested locally, with real data and full flows. A staging environment is deferred until the product is offered to other organisations.

**Alternatives considered:**
- Always-on staging — deferred. Revisit when the product is offered as a SaaS.

**Consequences:**
- Testing happens locally.
- The developer must be careful when deploying to production.
- The venue can be used for testing before it goes live with real guests.

**What would make us revisit:** When the product is offered to other organisations, or when more than one developer works on it, we add a staging environment.

---

### D-14.3 — Deployments are manual

**Decision:** Deployments are triggered manually by the developer, not automatically on every commit to the main branch.

**Context:** Automatic deployments are convenient but risky for the first version, when the product is still being shaped.

**Alternatives considered:**
- Automatic deployment on every commit — deferred. Revisit when the product stabilises.

**Consequences:**
- The developer decides when to deploy.
- A bad commit cannot go live on its own.
- Deployments are deliberate.

**What would make us revisit:** When the product stabilises, or when more than one developer works on it, we consider automatic deployment.

---

## 15. Success Criteria for the First Production Version

### D-15.1 — The first version must have the complete loop working

**Decision:** The first version must have the complete loop working for the guest, the manager, the service staff, and the kitchen, with a real database connection, real service data, and real menu data. Nothing is mocked. Every flow is testable end-to-end on the developer's local machine.

**Context:** A partial product is not acceptable. The first version must be a working, complete loop.

**Alternatives considered:**
- A partial product with some flows mocked — rejected because the venue asked for the complete loop.

**Consequences:**
- Every flow is implemented, not stubbed.
- The database is real and populated.
- The product can be demonstrated end-to-end on the developer's machine.

**What would make us revisit:** Never.

---

### D-15.2 — One venue with both rooms and tables

**Decision:** The first version is tested against a single venue that has both tables and rooms at the same time. The venue's modules — table, room, and kitchen — are all enabled.

**Context:** This ensures the product handles both facilities in the same installation, which is the more complex case.

**Alternatives considered:**
- One venue with only tables — rejected because the venue asked for both.
- One venue with only rooms — rejected for the same reason.

**Consequences:**
- The first venue has tables and rooms.
- All modules are enabled and tested.
- The product is verified for the more complex case first.

**What would make us revisit:** Never.

---

### D-15.3 — The first version supports up to 50 concurrent orders

**Decision:** The first version must handle 50 concurrent orders without slowing down.

**Context:** Fifty concurrent orders is a reasonable target for a busy venue.

**Alternatives considered:**
- Ten concurrent orders — rejected because it is too low for a busy venue.
- Hundreds — deferred. Revisit if a larger venue is onboarded.

**Consequences:**
- The product is tested against 50 concurrent orders.
- Performance work is scoped to that target.
- Beyond 50, the product may slow down.

**What would make us revisit:** If a larger venue is onboarded, we test against a higher number.

---

### D-15.4 — The first version supports up to 20 staff logged in at once

**Decision:** The first version must support up to 20 staff logged in at the same time.

**Context:** Twenty staff is more than most venues have.

**Alternatives considered:**
- Ten staff — rejected because it is too low for a large venue.
- Fifty staff — deferred.

**Consequences:**
- The product is tested against 20 concurrent staff sessions.
- The staff panel is designed for that load.

**What would make us revisit:** If a larger venue is onboarded, we test against a higher number.

---

### D-15.5 — The guest's landing page opens within 1 second

**Decision:** The guest's landing page must open within 1 second on a 4G connection.

**Context:** A fast landing is the most important factor in guest conversion.

**Alternatives considered:**
- 2 seconds — rejected because it is too slow.
- 3 seconds — rejected for the same reason.

**Consequences:**
- The guest's landing page is aggressively optimised for first paint.
- Images are compressed and served efficiently.
- The product's performance budget is set at 1 second.

**What would make us revisit:** Never.

---

### D-15.6 — A kitchen ticket appears immediately after approval

**Decision:** A kitchen ticket appears on the kitchen screen immediately after the guest places the order and the staff approve it. There is no deliberate delay.

**Context:** The kitchen must see new tickets as soon as possible.

**Alternatives considered:**
- A short delay (for example, 10 seconds) to batch tickets — rejected because the venue does not want batching.

**Consequences:**
- The kitchen screen polls frequently per D-6.6.
- A new ticket appears within the polling interval.
- No batching, no delay.

**What would make us revisit:** Never.

---

### D-15.7 — The structure is correct from the beginning

**Decision:** The product's structure — folders, layers, standards, naming — is correct from the very first commit. Every feature is added to the correct place from the start, with real data, and every loop is testable on the developer's local machine. Refinements come later, per organisation.

**Context:** The structure must be right from the beginning so that the product can grow without a rewrite.

**Alternatives considered:**
- Build something quick and refactor later — rejected because a rewrite would waste far more time than getting the structure right upfront.

**Consequences:**
- Every commit adds code to the correct place.
- No shortcuts, no temporary hacks, no "we'll fix it later".
- The product is testable end-to-end from the first milestone.
- Refinements are per-organisation changes to a stable foundation.

**What would make us revisit:** Never.

---

## Appendix — The Record Set as of Version 1.0

**Total decisions:** 53
**Categories:** 15
**Status:** All locked.

**Decisions deferred to a later version, with the trigger that would reopen them:**

| Deferred decision | Reopen trigger |
|-------------------|----------------|
| Optional guest accounts (D-2.1) | A venue asks for loyalty or return-guest features |
| Server-side cart with timeout (D-2.2) | Guests complain about losing carts, or longer browsing patterns emerge |
| Email-based login (D-3.1) | A venue asks for it, or for SSO |
| Optional idle timeout for staff (D-3.2) | A venue complains about shared-device sessions |
| PIN login for shared tablets (D-3.5) | A venue complains about full-password friction |
| Per-section or per-item tax (D-4.3) | A venue operates with differentiated tax |
| Bill splitting (D-4.5) | A venue asks for it |
| Guest-initiated cancel window (D-4.7) | A venue asks for it |
| Additional order states (D-4.8) | A venue asks for finer granularity |
| SLA alerts on orders (D-4.10) | A venue asks for them |
| Dedicated flow per hotel service (D-5.1) | A service needs a fundamentally different flow |
| SLA alerts on requests (D-5.5) | A venue asks for them |
| Guest-staff messaging inside a request (D-5.6) | A venue (concierge) asks for it |
| Auto-approval of orders (D-6.1) | A venue asks for it |
| Kitchen pause button (D-6.2) | A venue asks for it |
| Station-based kitchen routing (D-6.3) | A large venue asks for it |
| Item-level ticket marking (D-6.4) | A venue has very large tickets |
| Pings on staff queues (D-6.5) | A venue asks for them |
| Live push (SSE) for screens (D-6.6, D-8.1, D-8.4) | A venue needs faster freshness |
| eSewa and UPI adapters (D-7.1) | A venue in Nepal or India is onboarded |
| Self-service payment configuration (D-7.2) | The product is offered as a general SaaS |
| In-product refunds (D-7.5) | A venue asks for them |
| Stronger offline queue (D-8.2) | A venue's network is unreliable in a way that breaks this |
| Continuous backup (D-8.5) | A venue's data volume grows, or a catastrophic loss occurs |
| Self-service branding (D-9.1) | The product is offered as a general SaaS |
| Automatic brand-colour adjustment (D-9.3) | The developer wants a "make it readable" tool |
| Multi-venue per installation (D-10.1) | A franchise asks for it |
| Shared menus between venues (D-10.2) | A franchise asks for shared menus |
| Self-service venue onboarding (D-10.3) | The product is offered as a general SaaS |
| Multi-language (D-11.1) | A venue asks for a second language as a first-class feature |
| Multiple currencies (D-11.2) | A venue has international pricing |
| Multiple tax rules (D-11.3) | See D-4.3 |
| Reports beyond 6 months (D-12.1) | A venue asks for a longer range |
| PDF and Excel exports (D-12.2) | A venue asks for them |
| Scheduled reports (D-12.3) | A venue asks for them |
| Aggregate staff activity reporting (D-12.4) | A venue asks for it |
| Guest notifications (D-13.1) | A venue asks for them |
| Staff browser notifications (D-13.2) | A venue asks for them |
| Manager notifications (D-13.3) | A venue asks for them |
| Staging environment (D-14.2) | The product is offered as a SaaS, or more than one developer joins |
| Automatic deployments (D-14.3) | The product stabilises, or more than one developer joins |

---