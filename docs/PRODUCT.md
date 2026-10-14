# PRODUCT.md — The Complete Product Design

**Version:** 1.0
**Status:** Draft for approval
**Scope:** What the product is, who uses it, every feature, every flow, every screen, every loop — from the guest's first scan to the manager's final report. No rules, no file paths, no technology choices, no implementation decisions. Only the product.

---

## Table of Contents

1. What This Product Is
2. The Core Idea — One Product, Many Shapes
3. Who Uses It
4. The Venue Types and How the Product Adapts
5. The Guest Journey — Restaurant (Table QR)
6. The Guest Journey — Hotel (Room QR)
7. The Owner / Manager Journey
8. The Service Staff Journey — Table Service
9. The Service Staff Journey — Room Service
10. The Kitchen Journey
11. The Complete Feature Set
12. The Visual Character
13. The Screen Map — Every Screen in the Product
14. The Data the Product Works With — In Business Terms
15. The Complete Loops, End to End
16. What This Product Is Not
17. Summary

---

## 1. What This Product Is

A single hospitality platform that a restaurant, a hotel, or any hospitality venue deploys for itself. Guests interact with it through a QR code — no app to download, no account to create, no signup form. Staff and owners interact with it through role-based dashboards. The venue gets a branded digital storefront, real-time order flow, service request management, staff coordination, and a permanent record of everything that happened.

The product adapts to the venue, not the other way around. A restaurant with only tables uses the table module. A hotel with only rooms uses the room module. A resort with both uses both. A venue with neither — a food truck, a counter-service café — marks both modules as unavailable and uses the product in a mode where guests order from a shared counter QR. The product never forces a venue to fit a shape it does not have.

The product is deployed per venue. Each venue has its own branding, its own colors, its own logo, its own menu, its own rooms or tables, its own staff, its own prices, its own tax rules, its own enabled modules. One install of the product serves exactly one venue. There is no public marketplace, no cross-venue login, no shared data. The guest only ever sees the venue they are physically inside.

---

## 2. The Core Idea — One Product, Many Shapes

The product is built around four modules. Each venue enables the modules it actually has and disables the ones it does not. Every module works independently and every module works together with the others.

**The four modules:**

1. **Table module** — for venues where guests are seated at tables. Each table gets a QR code. The guest scans, sees the food menu, orders, and tracks the order.
2. **Room module** — for venues where guests stay in rooms. Each room gets a QR code. The guest scans, sees a catalog of services (room service food, housekeeping, maintenance, concierge, laundry, spa, late checkout, wake-up call, do not disturb), and raises requests or orders.
3. **Counter module** — for venues without tables or rooms. A single QR code at the counter or entrance opens a menu, the guest orders and pays, and picks up at the counter. No table number, no room number.
4. **Kitchen module** — the fulfilment engine. Every order from any module passes through the kitchen module if it involves food preparation. A venue without a kitchen (a bar serving packaged drinks, a retail counter) marks the kitchen module as unavailable and the order flow skips the kitchen stage.

**Every module is independently toggleable in the venue's configuration.** The manager checks which modules apply and the product adjusts every screen, every flow, and every queue to match.

A restaurant with tables and a kitchen enables table + kitchen.
A hotel with rooms and a kitchen enables room + kitchen.
A hotel with rooms but no kitchen (a serviced apartment building) enables room only, with room service disabled.
A food truck with only a counter enables counter + kitchen.
A bar with no kitchen enables counter only.
A resort with tables, rooms, and a kitchen enables table + room + kitchen.

The product never asks the guest to choose a module. The QR code they scanned decides which module they enter. A QR on a table opens the table flow. A QR in a room opens the room flow. A QR at the counter opens the counter flow. The guest never sees a menu of modules; they see the flow that belongs to where they are.

---

## 3. Who Uses It

There are six types of people. Each has a different day, a different device, and a different relationship with the product.

### 3.1 The Guest — Table

Sitting at a table. Phone in hand. Just arrived, or halfway through the meal. Hungry, curious, in a social mood, not in a technical mood. Has never seen this product before. Scanned a small square code on the table, or on a small stand, or on a sticker near the condiments. Wants to see the menu, understand the prices, order something, and know it is coming. May want to add more later. May want the bill. Will not download anything, will not create an account, will not read instructions. If the first screen is confusing, they will close the browser and wave at a waiter instead.

Their device is a phone, held vertically. Their connection might be good or terrible. Their finger is on the screen and they are impatient.

### 3.2 The Guest — Room

In a hotel room, on the bed, at the desk, or on the balcony. Scanned a code printed on a small card, on the nightstand, on the back of the door, or inside the room-service menu booklet. Wants room service, or extra towels, or the air conditioning fixed, or a late checkout, or a taxi booked, or a spa slot. They may want one of these things, or several, at different times. They may be in a bathrobe. They may not speak the local language. They expect the same calm, quiet, warm experience a hotel lobby gives them — not a form.

Their device is a phone or a tablet. The connection is usually hotel wifi. They are not in a hurry, but they are not patient with confusion.

### 3.3 The Guest — Counter

At a food truck, a café counter, or a takeaway window. Scanned the QR code displayed on the counter, on a menu board, or on a stand. Wants to see the menu, order, and pick up. Not seated. Not staying. In a hurry. Wants the whole flow to take less than a minute of their attention.

Their device is a phone. The connection is whatever they have. The expectation is fast and simple.

### 3.4 The Service Staff

On the floor, or on the corridor of a hotel. Tablet in hand, or a phone in an apron pocket, or a terminal at the pass. Watches a queue of orders and service requests. Needs to see: which table or room, what was ordered, what the special instructions are, how long it has been waiting, and what the next action is. Needs to move an item from "waiting" to "delivered" in one tap. Does not want animation, decoration, or personality from the software. Wants to look, act, and move on. Their hands may be full. Their screen may be greasy. The lighting may be bad. They do not read carefully; they scan.

Their device is often a shared tablet mounted on a wall or held in a case. Multiple staff use the same device across a shift. They log in at the start and out at the end.

### 3.5 The Kitchen Staff

At the pass, or at a station. Watches a screen — a large monitor or a mounted tablet — showing the current ticket queue. Needs to see, from two meters away: the order number, the table or room, the items, the modifiers, the notes, and how long the ticket has been open. Advances tickets from "approved" to "preparing" to "ready" with a single tap. May be working in a hot, busy, loud, low-light environment. Cannot spare attention for anything decorative. Their screen is often shared by the whole kitchen, so it must be readable from a distance and by multiple people at once.

Their device is a mounted screen, always on, auto-refreshing. They never scroll through menus or navigate; they only see the queue and act on it.

### 3.6 The Manager / Owner

At a desk, or walking the floor with a phone. Responsible for the venue. Manages the menu, the prices, the tables, the rooms, the QR codes, the staff accounts, the branding, the tax settings, the service catalog, and the day's numbers. Reviews orders completed, revenue collected, service requests closed, and problems that occurred. Sets up new tables or rooms when the venue changes. Prints QR codes and places them. Creates staff accounts and assigns roles. Changes the brand color when the season changes. Wants a single place to see everything and change anything. Does not want to be a developer. Does not want to touch the database. Wants a clean, quiet, well-organized control panel.

Their device is a laptop or desktop, occasionally a tablet. They use the product less frequently than staff but with more breadth. When they log in, they usually have a specific job in mind.

### 3.7 The Owner (Separate from Manager)

In some venues, the person who owns the business is not the person who runs the day-to-day. The owner cares about revenue trends, staff activity, and brand consistency across multiple properties. They log in rarely, look at dashboards, and leave. They may manage more than one venue under the same ownership. Their screens emphasize numbers, trends, exports, and comparisons — not operations.

---

## 4. The Venue Types and How the Product Adapts

### 4.1 Restaurant with Tables

A dining venue with seated guests. The venue enables the table module and the kitchen module. Each table gets its own QR code. Guests scan, browse the food menu, order, and track. Orders flow to the kitchen, then to service staff for delivery. Guests may pay online or at the counter.

The manager configures the tables (their numbers, their zones), the menu, the modifiers, the tax rate, and the branding.

### 4.2 Hotel with Rooms

A lodging venue with guests staying in rooms. The venue enables the room module and, if it has a kitchen, the kitchen module. Each room gets its own QR code. Guests scan and see a service catalog: room service food (if kitchen is enabled), housekeeping, maintenance, concierge, laundry, spa, late checkout, wake-up call, do not disturb.

Each service is handled by its own team. Room service food goes to the kitchen. Housekeeping goes to the housekeeping queue. Maintenance goes to the maintenance queue. Concierge goes to the concierge queue. The manager assigns the teams and the roles.

### 4.3 Restaurant with Tables and a Counter

A restaurant with both seated dining and takeaway. The venue enables the table module, the counter module, and the kitchen module. Tables work as in §4.1. The counter QR opens the same menu but with no table number and no delivery; the guest picks up at the counter.

### 4.4 Hotel with Rooms and Tables

A hotel with both a restaurant and rooms. The venue enables the room module, the table module, and the kitchen module. Guests in the restaurant use the table flow; guests in rooms use the room flow. Both flow into the same kitchen queue, tagged by origin.

### 4.5 Counter-Only Venue

A food truck, a café, or a takeaway window. The venue enables the counter module and the kitchen module (if it prepares food) or the counter module alone (if it serves packaged goods). The guest scans the counter QR, orders, pays, and picks up. No table, no room, no delivery.

### 4.6 Room-Only Venue Without a Kitchen

A serviced apartment building, a hostel, or a retreat where meals are not provided. The venue enables the room module only. Room service food is disabled in the catalog. The guest sees housekeeping, maintenance, concierge, and the other non-food services. The kitchen module is disabled, so no orders flow to a kitchen queue.

### 4.7 The Module Toggle in the Manager Panel

In the manager's settings, there is a section called "Modules". It shows four toggles:

- **Table module** — on/off.
- **Room module** — on/off.
- **Counter module** — on/off.
- **Kitchen module** — on/off.

When a module is off, every screen, every menu item, every queue, and every endpoint that depends on it disappears from the product. The guest never sees a tab for a module that is off. The staff never see a queue for a module that is off. The manager never sees a configuration screen for a module that is off.

The manager can turn a module on or off at any time. Turning on a module reveals its configuration screens. Turning off a module hides them, keeps all historical data, and pauses the flows that depend on it. This is not deletion — nothing is ever deleted.

This is how the product guarantees it fits every venue: every venue enables exactly the modules it has and disables the rest.

---

## 5. The Guest Journey — Restaurant (Table QR)

This is the complete loop, from the moment the guest sits down to the moment they leave. Every click is described.

### 5.1 Discovery — Before the Scan

The guest sits. On the table there is a small stand, or a sticker, or a card, or a QR code etched into a wooden block. It says the venue's name, a short line ("Scan to order"), and a square code. Optionally a table number is printed next to it.

The guest opens their phone camera, points at the code, and taps the link that appears. No app store. No download. The phone's browser opens.

### 5.2 The Landing — First Impression

This is the most important screen in the product. It has approximately three seconds to convince the guest that this venue is worth ordering from. It must feel like the venue, not like software.

The landing screen contains, in this order, top to bottom:

1. **The venue's name**, in a large, elegant, display-style typeface. Not a generic sans. Something that could be on the cover of the menu. If the venue has a logo, it appears here instead of, or alongside, the name.
2. **A hero image or hero visual.** A photograph of the food, or the room, or the view, or the interior. Warm, high-quality, appetite-driven. If the venue has no image, a beautiful abstract background in the venue's brand color appears.
3. **A one-line welcome message.** "Welcome to Juniper." "Good evening, table 12." Short, human, warm.
4. **The primary action — "View Menu".** A large, tappable button in the venue's brand color. Clear, unmissable.
5. **A quiet secondary action** — "Call a waiter", "Request the bill", "Something else". Small, unobtrusive.
6. **A short menu preview.** Two to four featured dishes, each with a photo, a name, and a price. Just enough to make the guest hungry.
7. **A short "how it works" strip.** Three small steps: "Browse the menu → Order from your phone → We bring it to your table." Brief, not instructional.
8. **A footer.** The venue's name, hours, address, and small print.

Every element on this screen is branded with the venue's own color and identity. A guest should feel they are inside the venue's own app, not a third-party tool.

The animations are gentle: the hero fades and rises once, the preview cards fade in one after another, the button lifts slightly on touch. Nothing flashy. Nothing that delays the guest. Nothing that ignores the guest's phone setting for reduced motion.

**The loop back to this screen:** a small home icon is always visible in the corner of every subsequent screen. Tapping it returns here. This is the guest's anchor.

### 5.3 Browsing the Menu

The guest taps "View Menu". The screen transitions smoothly to the menu.

The menu screen has:

1. **A sticky header** at the top — small, not intrusive. It shows the venue's name (or logo) on the left, and a cart icon on the right with a count badge (empty at first). If the guest scrolls, this header stays.
2. **Category tabs** just below the header — a horizontal strip of the menu's sections. "Starters, Mains, Sides, Desserts, Drinks." Tapping one jumps the list to that section. The active tab is highlighted in the brand color.
3. **The item list** — a vertical scroll of dishes. Each dish is a card with:
   - A photograph (if available).
   - The name in a clear, medium-weight sans.
   - A short description (one or two lines, optional).
   - The price, right-aligned, in the venue's currency format.
   - A small "Add" button or a "+" icon.
   - If the dish is unavailable, it appears greyed out with a small "Sold out" label. It is not removed from the list — it stays visible, so the guest understands what they missed.
   - If the dish has a modifier group (size, doneness, sides, extras), tapping the card opens the modifier sheet instead of adding directly.
4. **A floating cart bar** at the bottom — appears only when the cart has at least one item. Shows the item count, the subtotal, and a "View cart" button. Always visible when the cart is non-empty, so the guest can jump to checkout at any moment.

The menu supports:

- **Search** — a small search icon in the header opens a text field. The guest types a dish name and the list filters live.
- **Filter by dietary tags** — if the venue labels items (vegetarian, vegan, gluten-free, spicy), small chips let the guest filter.
- **Featured section at the top** — the venue can mark some items as "chef's picks" or "popular", and these appear in a horizontal scroll above the categories.

**What the guest does not see:** no logins, no forms, no account creation, no "please register to continue". The guest is anonymous. The product knows only which table they scanned, and nothing else.

### 5.4 The Modifier Sheet

When the guest taps a dish with options, a sheet rises from the bottom of the screen (mobile) or opens as a modal (larger screens). It contains:

1. The dish's name and photo at the top.
2. The description below.
3. One section per modifier group. Examples:
   - **Size** — required, single choice. Radio buttons. "Small, Medium, Large."
   - **Doneness** — required, single choice. "Rare, Medium, Well."
   - **Extras** — optional, multiple choice. Checkboxes. "Extra cheese, Bacon, Avocado."
   - **Sides** — optional, single choice. "Fries, Salad, Rice."
4. Each option shows its additional price, if any. "Extra cheese +$1.50."
5. **A quantity stepper** — minus, count, plus.
6. **A notes field** — a short text box for special instructions. "No onions, please."
7. **A live total** — the current line total, updating as options change.
8. **An "Add to cart" button** at the bottom, in the brand color.

When the guest taps "Add to cart", the sheet closes with a small, satisfying animation. The cart badge in the header increments. The floating cart bar appears or updates.

### 5.5 The Cart

The guest taps the floating cart bar, or the cart icon in the header. The cart screen opens.

The cart screen contains:

1. **The list of items** added so far. Each row shows:
   - The dish name.
   - The chosen modifiers, in small grey text. "Medium, extra cheese, no onions."
   - The line total.
   - A quantity stepper to adjust.
   - A small "remove" action (swipe or a trash icon).
2. **A notes field for the whole order.** "We're celebrating a birthday." Optional.
3. **A summary block:**
   - Subtotal.
   - Tax (computed by the venue's rules, not shown as a formula).
   - Total.
4. **A "Place order" button** at the bottom, large and prominent, in the brand color.
5. **A "Continue browsing" link** — small, secondary, so the guest can add more items before ordering.

If the cart is empty, the screen shows a warm illustration and a "Your cart is empty — browse the menu" button.

### 5.6 Placing the Order

The guest taps "Place order". A brief loading state appears (the guest's cart is being sent to the venue). On success, the screen transitions to the order confirmation.

Behind the scenes, but invisible to the guest:

- The venue checks each item is still available.
- The venue recomputes the price from its own records — it does not trust the phone's math.
- The venue saves the order with the exact prices from the moment of ordering, so a price change tomorrow does not rewrite today's bill.
- The venue records which table the order came from, and the exact time.
- The order is now visible in the kitchen queue and the service staff queue.

If something failed — a dish just sold out, or the connection dropped — the guest sees a friendly message and their cart remains intact. They can retry.

### 5.7 Order Confirmation

The confirmation screen is short and calming:

1. **A success mark** — a small check or a gentle animation.
2. **"Your order is on its way."**
3. **The order number.**
4. **A summary** — the items, the total.
5. **An estimated time**, if the venue provides one. "Usually 20–30 minutes."
6. **A "Track your order" button** — the primary action, going to the tracking screen.
7. **A "Back to menu" link** — for guests who want to add more.

### 5.8 Tracking the Order

The tracking screen shows the guest the order's progress in real time, in a friendly way. It contains:

1. **The order number at the top.**
2. **A vertical timeline of stages:**
   - **Placed** — the venue received the order.
   - **Approved** — the kitchen has accepted it.
   - **Preparing** — the dish is being made.
   - **Ready** — the dish is out of the kitchen and waiting to be delivered.
   - **Served** — the dish has arrived at the table.
   - **Completed** — the meal is over, the bill is settled (if payments are enabled).
3. **A highlight on the current stage** — a filled dot, a colored line. The previous stages are muted. The later stages are grey.
4. **The items in the order** — collapsed by default, expandable.
5. **A "add more items" button** — because guests often order in waves.
6. **A "request the bill" action** — if the venue allows it.

The guest can leave this screen and come back later; the state is remembered. The screen refreshes quietly every few seconds. There is a subtle change animation when the stage advances, so a guest who is watching sees the transition happen, but a guest who is not looking does not miss anything important.

### 5.9 The Second Wave — Adding More Items

A guest often orders, eats, and then wants more. The product supports this naturally:

- From the tracking screen, "add more items" opens the menu again.
- The cart is separate from the previous order.
- The guest checks out a second time.
- The venue receives a second order for the same table.
- Both orders appear in the tracking screen, either as separate timelines or as one merged timeline, depending on how the venue prefers to show them.

### 5.10 Calling a Waiter or Requesting the Bill

On the landing screen, and inside the menu and tracking screens, there is a small always-available action: **"Call a waiter"** or **"Request the bill"** or **"Something else"**. This is a lightweight request, not an order. It appears in the service staff's queue as a simple ping with the table number and the request type. Staff acknowledge it, act on it, and close it.

This is important because no software can replace the human gesture of catching a waiter's eye. The product provides a faster, quieter way to make the same gesture.

### 5.11 Payment — End of the Meal

If the venue has payments enabled, the guest sees a "Pay now" button on the tracking screen once the meal is served.

The payment flow:

1. The guest taps "Pay now".
2. The screen shows the full bill — all orders for this table, itemized, with tax.
3. The guest chooses a payment method: card, wallet, or "pay at counter".
4. If paying digitally, they are redirected to a secure payment page (the venue's payment provider), complete the payment, and return.
5. The screen updates to "Paid — thank you". A receipt is available to view or email.
6. The table is marked as free in the venue's system.

If the venue has payments disabled, the guest sees "Ask your waiter for the bill" instead.

### 5.12 Leaving — After the Meal

There is no account to log out of. The guest closes the browser. The session quietly expires. Next time they scan, they start fresh.

The venue's record of the visit remains — the orders, the times, the amounts — and is visible to the manager in the admin panel.

---

## 6. The Guest Journey — Hotel (Room QR)

The hotel guest's journey follows the same skeleton, but with a richer catalog and multiple parallel tracks. Every click is described.

### 6.1 Discovery — In the Room

The guest finds a QR code on the nightstand, the desk, or the back of the room-service menu. It says the hotel's name and a soft prompt: "Scan to explore services". They scan it.

### 6.2 The Landing — First Impression

The hotel landing is calmer and more elegant than the restaurant landing. It contains:

1. **The hotel's name**, in a refined display typeface, with the logo if available.
2. **A hero image** — the room, the view, the lobby, or a soft abstract.
3. **A personalized line** — "Welcome to room 412." or "Good evening." The room number comes from the QR code.
4. **A service catalog** — a grid of large, friendly cards. Each card is one service: Room Service, Housekeeping, Maintenance, Concierge, Laundry, Spa, Late Checkout, Wake-up Call, Do Not Disturb.
5. **A "how it works" strip** — "Choose a service → Tell us what you need → We take care of it."
6. **A quiet help button** — "Call the front desk."
7. **A footer** — hotel name, wifi info, contact.

Each card on the landing page has:

- A soft icon or illustration.
- The service name.
- A one-line description.
- A subtle hover or tap animation.

The visual language is quiet, warm, and hotel-like. It should feel like the hotel's own guest app, not a third-party tool.

### 6.3 The Room Service Food Flow

Tapping "Room Service" opens a menu that behaves exactly like the restaurant menu: categories, dishes, modifiers, cart, order, track. The only difference is that the order is bound to the room, not a table, and the delivery person is hotel staff, not a waiter.

The guest browses, adds, orders, and tracks. The tracking screen says "Your order will be delivered to room 412."

### 6.4 The Housekeeping Request Flow

Tapping "Housekeeping" opens a short form:

1. **What do you need?** — a checklist of common items and tasks:
   - Extra towels.
   - Extra pillows.
   - Bed change.
   - Room cleaning.
   - Turndown service.
   - Toiletries.
   - Something else (a text box).
2. **When?** — a choice: "As soon as possible", "In the next hour", "This afternoon", "Custom time".
3. **A notes field** — optional. "Please don't knock, I'm on a call."
4. **A "Request" button.**

The guest submits. The request appears in the housekeeping queue. The guest sees a tracking screen with the request status: Received → Assigned → In Progress → Completed.

### 6.5 The Maintenance Request Flow

Tapping "Maintenance" opens a form:

1. **What is the issue?** — a short list (light, AC, plumbing, TV, wifi, door lock, other).
2. **A photo upload** — optional but encouraged. The guest takes a photo of the problem.
3. **A description** — a text field.
4. **Urgency** — "Can wait", "Soon", "Urgent".
5. **A "Report" button.**

The guest submits. The request appears in the maintenance queue with the photo attached. The guest tracks the status.

### 6.6 The Concierge Flow

Tapping "Concierge" opens a service request form with a few common options and a general request box:

- Book a taxi.
- Reserve a restaurant.
- Book a tour.
- Rent a car.
- Buy tickets.
- Other.

The guest fills in the details, submits, and tracks the request. The concierge responds either by completing the request or by messaging the guest through the tracking screen (a simple two-way text thread, if the venue enables it).

### 6.7 The Laundry Flow

Tapping "Laundry" opens a form:

1. **What would you like laundered?** — a small item list with counts (shirts, trousers, undergarments, etc.).
2. **Service level** — "Same day", "Next day", "Express".
3. **Pickup time** — "Now", "In an hour", "This evening", "Custom".
4. **A notes field.**
5. **A "Schedule pickup" button.**

The guest submits. The laundry team sees the request, picks up the items, and marks the request in progress. When ready, they deliver the items back and mark the request completed. The guest tracks the whole flow.

### 6.8 The Spa Booking Flow

Tapping "Spa" opens a booking flow:

1. **Treatment** — a list of treatments with duration and price.
2. **Date and time** — a simple calendar and time slot picker, showing only available slots.
3. **Number of guests** — 1 or 2.
4. **A notes field** — preferences, allergies.
5. **A "Book" button.**

The guest submits. The spa team sees the booking, confirms or proposes an alternative time, and the guest is notified through the tracking screen.

### 6.9 The Late Checkout Flow

Tapping "Late Checkout" opens a simple form:

1. **Desired checkout time** — a time picker.
2. **A notes field** — reason, if the guest wants.
3. **A "Request" button.**

The request goes to the front desk. They approve, deny, or propose a different time. The guest sees the response.

### 6.10 The Wake-up Call Flow

Tapping "Wake-up Call" opens:

1. **Time** — a time picker.
2. **A "Set" button.**

Immediate confirmation. The request is scheduled. There is no tracking screen — it is a one-shot action.

### 6.11 The Do Not Disturb Flow

Tapping "Do Not Disturb" toggles a flag for the room. When on, the hotel's housekeeping staff see it and skip the room. The card on the landing screen changes state visually so the guest can turn it off later.

### 6.12 Multiple Requests — The Parallel Tracks

A hotel guest may have several things in flight:

- A room service order on the way.
- A housekeeping request pending.
- A maintenance issue being looked at.
- A spa booking confirmed for tomorrow.

The tracking screen, when more than one request is active, shows a **combined view**: a list of active requests, each with its own status and its own timeline. Tapping one opens its detail. A single "Requests" tab at the bottom of the screen gives the guest one place to see everything.

### 6.13 The Hotel Anchor — The "Requests" Tab

At the bottom of the hotel guest experience, there is a persistent tab bar:

- **Home** — the landing screen.
- **Services** — the full service catalog.
- **Requests** — everything in flight.
- **Help** — call the front desk.

The restaurant guest has a simpler version: Home, Menu, Cart, Order.

### 6.14 Checking Out

When the guest checks out, the hotel's system marks the room as vacant. The guest's session expires naturally. No cleanup on the guest's side. Any requests still in flight are either completed before checkout or handed to the next guest's record as "closed — handled before checkout".

---

## 7. The Guest Journey — Counter (Counter QR)

The counter guest flow is the shortest. It is designed for speed.

### 7.1 Discovery

The guest is at a food truck, a café counter, or a takeaway window. A QR code is displayed on the counter, on the menu board, or on a small stand. It says the venue's name and "Scan to order". They scan it.

### 7.2 The Landing — Minimal

The counter landing is short and functional:

1. **The venue's name and logo.**
2. **A small hero image or none at all.**
3. **A "Order now" button.**
4. **A short "how it works":** "Order → Pay → Pick up at the counter."

No table number. No room number. No service catalog. Just a fast path to the menu.

### 7.3 The Menu

The menu behaves like the restaurant menu: categories, dishes, modifiers, search. The only difference is that at checkout, the guest is asked for a **name** or a **short pickup label** so the counter staff can call them. There is no table number.

### 7.4 The Cart and Order

The cart works like the restaurant cart. At checkout, the guest confirms the pickup name, pays (if payments are enabled) or is told to pay at the counter, and the order is submitted.

### 7.5 Tracking and Pickup

The tracking screen shows the order number and the status:

- **Placed** — the venue received the order.
- **Preparing** — the kitchen or counter is making it.
- **Ready for pickup** — the order is ready at the counter.
- **Picked up** — the guest has collected it.

The guest shows the order number at the counter. The staff confirms and marks it picked up.

The counter loop closes here. No delivery. No follow-up. No table clearing.

---

## 8. The Owner / Manager Journey

### 8.1 First Login — Setting Up the Venue

When the owner first logs in, they land on a setup flow:

1. **The venue's name.**
2. **The venue's type** — restaurant, hotel, resort, café, food truck, other.
3. **The modules to enable** — table, room, counter, kitchen. The product suggests defaults based on the venue type, and the owner can change them.
4. **The venue's address, contact, currency, and tax rate.**
5. **The brand color** — a color picker with live preview of the guest landing.
6. **The logo** — an upload, or the venue name rendered in a display typeface.
7. **The hero image** — an upload, or a default abstract in the brand color.

When the setup is complete, the owner sees the admin dashboard.

### 8.2 The Admin Home

The admin home is a calm, dense, well-organized page. It contains:

1. **A header** with the venue's name, the manager's name, and a sign-out.
2. **A row of live metric cards** at the top:
   - Orders waiting.
   - Orders in the kitchen.
   - Orders ready.
   - Today's revenue.
   - Today's order count.
   - Service requests open (if the room module is on).
   Each card is a small rectangle, labeled, with a number, and a subtle change indicator versus yesterday.
3. **A tab bar** for the main sections: "Active Orders", "Completed Orders", "Menu", "Tables" (if enabled), "Rooms" (if enabled), "QR Codes", "Staff", "Branding", "Reports", "Settings".
4. **A content area** that changes with the selected tab.

Tabs that belong to a disabled module do not appear. If the room module is off, the "Rooms" tab is hidden. If the counter module is off, the counter-related settings are hidden. The manager sees only the sections that apply to their venue.

### 8.3 The Active Orders Tab

A live list of every order currently in flight. Each row shows the order number, the table or room or pickup label, the items, the status, the elapsed time, and a single action. The manager can advance, cancel, or reassign an order.

### 8.4 The Completed Orders Tab

A historical list of every completed order. Filterable by date range: today, yesterday, this week, this month, custom. Each row shows the order number, the table or room, the total, and the closing time. A "export as CSV" action lets the manager download the filtered list for spreadsheets.

### 8.5 The Menu Tab

A list of every menu item, grouped by category. The manager can:

- Add a new item — a form with name, description, photo, price, category, availability toggle, and modifier groups.
- Edit an item — change any field.
- Reorder items within a category.
- Mark an item as sold out (temporarily unavailable).
- Delete an item (soft delete — the item is hidden but historical orders keep their record).
- Create or edit categories.
- Create or edit modifier groups and their options.

### 8.6 The Tables Tab (Restaurant)

A grid or list of every table. For each one, the manager can:

- Add a new table — set the number or name.
- Edit the number or name.
- Change the status (free, occupied, reserved, out of service).
- Generate a QR code for the table.
- Preview the QR code.
- Print the QR code, either as a single page or as a sheet of many.
- Revoke and regenerate a QR code if the old one has been compromised or the sticker has been damaged.

### 8.7 The Rooms Tab (Hotel)

A grid or list of every room. For each one, the manager can:

- Add a new room — set the number or name.
- Edit the number or name.
- Change the status (occupied, vacant, cleaning, out of service).
- Set which services are available for this room (all, or a subset).
- Generate a QR code for the room.
- Preview the QR code.
- Print the QR code.
- Revoke and regenerate a QR code.

### 8.8 The QR Codes Tab

A unified view of every QR code in the venue. The manager can:

- See which table, room, or counter each QR belongs to.
- See the created date and the status (active or revoked).
- Generate a new QR for a table, room, or counter.
- Print a batch of QR codes in a printable layout, ready to cut and place.
- Revoke a QR (it stops working immediately; a friendly error is shown to any guest who scans it).

### 8.9 The Staff Tab

A list of every staff account. The manager can:

- Add a new staff member — name, username, email, password, role, and the modules the staff member works on.
- Edit a staff member's details.
- Change a staff member's role.
- Assign a staff member to a queue — kitchen, table service, room service, housekeeping, maintenance, concierge, laundry, spa, front desk.
- Deactivate a staff member (they can no longer log in, but their historical actions remain).
- Reset a staff member's password.
- See when each staff member last logged in.

**The role list:**

- **Owner** — full access to everything.
- **Manager** — full access except billing and ownership transfer.
- **Chef** — the kitchen queue only.
- **Service Staff (Table)** — the table service queue only.
- **Service Staff (Room)** — the room service queue only.
- **Housekeeping** — the housekeeping queue only.
- **Maintenance** — the maintenance queue only.
- **Concierge** — the concierge queue only.
- **Laundry** — the laundry queue only.
- **Spa** — the spa queue only.
- **Front Desk** — a combined view of all room service requests.

A staff member can have more than one role. A housekeeping staff member who also handles laundry has both roles and sees both queues.

### 8.10 The Branding Tab

The manager can:

- Set the venue's display name.
- Upload the venue's logo.
- Choose the venue's brand color (with a preview of how it looks on the guest-facing screens).
- Set the venue's welcome message on the guest landing.
- Upload or choose the hero image on the guest landing.
- Preview the guest experience with the current branding.

### 8.11 The Reports Tab

The manager can see:

- **Sales today** — a running total, an hourly breakdown, and a comparison to the same day last week.
- **Sales this week** — daily totals, a bar chart, a comparison to the previous week.
- **Sales this month** — daily totals, top-selling items, revenue by category.
- **Sales this year** — monthly totals, seasonal trends.
- **Custom range** — any two dates within the last 6 months.
- **Export as CSV** — download any report for use in a spreadsheet.

### 8.12 The Settings Tab

The manager can adjust:

- The venue's address and contact.
- The tax rate.
- The currency format.
- The modules enabled (table, room, counter, kitchen).
- The service catalog (which services are enabled for hotel venues).
- The opening hours.
- The default language (if multi-language is enabled).
- Notification preferences.
- The default SLA targets per service.

### 8.13 Multi-Venue Owners

If the owner manages more than one venue, they see a venue switcher at the top of the admin panel. Switching venues changes every screen, every report, and every setting to the selected venue. There is no data leakage between venues; the switcher is a convenience, not a shared view.

---

## 9. The Service Staff Journey — Table Service

### 9.1 Arriving at the Shift

The service staff member opens the tablet, opens the venue's staff app, and logs in with their username and password. The device remembers them for the shift (until they log out or the session expires).

### 9.2 The Service Queue

The main screen is the service queue. It shows, in a dense, quiet layout:

1. **A header** with the venue's name, the staff member's name, the current time, and a "Sign out" action.
2. **A set of tabs** at the top: "Orders", "Requests", "Tables".
3. **The list** — one row per active item. Each row shows:
   - The table number, in a bold, prominent number.
   - The order or request ID, in a small mono font.
   - The status, in a color-coded badge: waiting, in progress, ready, delivered.
   - The elapsed time since the item arrived, updated live.
   - A single action button, labeled with the next step: "Approve", "Deliver", "Close".
4. **A filter bar** — filter by status, or by time, or by zone.

The rows are ordered by urgency — oldest first, or by the venue's preference. When a new item arrives, a small sound or a subtle visual pulse notifies the staff member, but nothing disruptive.

### 9.3 Acting on an Item

The staff member taps the action button on a row. The item advances to the next status. The row updates in place. There is a very short, quiet flash of color to confirm the change. Nothing else moves.

For an order:
- Waiting → Delivering → Delivered → Closed.

For a request:
- Received → Acknowledged → Acted → Closed.

### 9.4 The Tables View

Tapping the "Tables" tab shows a grid of every table, with its current status: free, occupied, waiting, cleaning. This is the map view. Staff use it to see the venue at a glance.

### 9.5 The Handover — End of Shift

At the end of the shift, the staff member taps "Sign out". The device returns to the login screen. The next staff member logs in. Nothing else needs to be done.

---

## 10. The Service Staff Journey — Room Service

### 10.1 The Room Service Queue

Room service staff log in and see the room service queue. It is structured like the table service queue but with rooms instead of tables. Each row shows the room number, the order, the items, the status, and the elapsed time.

### 10.2 Acting on a Room Order

The staff member taps the action button. The order moves through: waiting → preparing (if the kitchen module is on, this stage happens in the kitchen, not here) → ready → delivering → delivered → closed.

If the kitchen module is off (for a hotel without food service), room service orders do not exist and the queue is empty.

### 10.3 The Housekeeping Queue

Housekeeping staff log in and see a different queue. Each row is a housekeeping request:

- The room number.
- The request type — extra towels, room cleaning, turndown, etc.
- The notes from the guest.
- The preferred time.
- The elapsed time since the request arrived.
- A single action button: "Acknowledge", "Start", "Complete".

The housekeeping staff work through the queue in order of urgency and the requested time.

### 10.4 The Maintenance Queue

Maintenance staff log in and see their queue. Each row is a maintenance request:

- The room number.
- The issue type — light, AC, plumbing, etc.
- The photo the guest uploaded (if any).
- The description.
- The urgency.
- The elapsed time since the request arrived.
- A single action button: "Acknowledge", "Start", "Complete".

### 10.5 The Concierge Queue

Concierge staff log in and see their queue. Each row is a concierge request:

- The room number.
- The request type — taxi, restaurant, tour, etc.
- The details.
- The elapsed time since the request arrived.
- A single action button: "Acknowledge", "Acting", "Complete".

Concierge may also message the guest through the tracking screen if the request needs back-and-forth.

### 10.6 The Laundry Queue

Laundry staff see their queue. Each row is a laundry request:

- The room number.
- The items.
- The service level.
- The pickup time.
- A single action button: "Pickup Scheduled", "Pickup Complete", "Delivered".

### 10.7 The Spa Queue

Spa staff see their queue. Each row is a spa booking:

- The room number.
- The treatment.
- The requested date and time.
- The number of guests.
- A single action button: "Confirm", "Reschedule", "Complete".

### 10.8 The Front Desk View

Front desk staff see a combined view of all room service requests across all teams. This is useful for a single staff member covering multiple roles on a quiet shift, or for a front-desk agent who needs to answer a guest's question about any request.

### 10.9 The Handover

Same as table service: log in at the start, log out at the end. No other setup.

---

## 11. The Kitchen Journey

### 11.1 The Kitchen Screen

The kitchen screen is a large, always-on display, mounted on a wall or standing on a counter. It shows the current ticket queue in a grid. Each ticket is a card:

1. **The order number** — large, mono, at the top.
2. **The table, room, or pickup label** — very large, bold, unmissable.
3. **The items** — a list, in a large readable font. Modifiers on their own lines.
4. **Notes** — highlighted if present.
5. **The time open** — counting up since the ticket arrived.
6. **A single action button** — the next step.

### 11.2 The Flow

Tickets arrive as the kitchen accepts orders. The flow:

- A new ticket appears with an audible cue and a gentle pulse.
- The kitchen staff tap "Start" when they begin the ticket. The card changes color and moves to a "preparing" column.
- When the ticket is done, they tap "Ready". The card moves to a "ready" column, and the service staff see it in their queue.
- When the service staff deliver, they mark it "Served" (or "Delivered" for room service). The card disappears from the kitchen grid.

### 11.3 The Kitchen Environment

The kitchen screen is designed for:

- **Distance reading** — everything is large. The table or room number is legible from two meters.
- **Low-light conditions** — a dark background is available, often on by default.
- **Greasy fingers** — buttons are large and forgiving.
- **Multiple viewers** — the grid is laid out so two or three staff can scan it at once.
- **Zero decoration** — no animation beyond the essential state-change cue. No sound except the new-ticket alert. No personality.

### 11.4 The Kitchen Without a Queue

If the venue is a counter-only café with no kitchen display, the kitchen module still exists in the background to move orders through their stages, but the visual kitchen screen is not used. The counter staff advance the order from the counter terminal. This is the counter module using the kitchen module without a kitchen screen.

### 11.5 The Kitchen Without a Kitchen

If a venue has no kitchen at all (a bar serving packaged snacks), the kitchen module is off. Orders do not have a kitchen stage. The order moves directly from "Placed" to "Ready" to "Delivered" or "Picked up" depending on the module.

---

## 12. The Complete Feature Set

This is every capability the product will have, described by what it does for a human.

### 12.1 Guest-Facing Features

1. **Scan to open** — a QR code opens the venue's experience in the phone's browser. No app, no login.
2. **Branded landing** — the venue's name, logo, color, and hero image are the first thing the guest sees.
3. **Menu browsing** — a list of dishes with photos, descriptions, prices.
4. **Search and filter** — find dishes by name or by dietary tag.
5. **Item modifiers** — size, doneness, extras, sides, quantity, and free-form notes.
6. **Cart** — add, edit, remove, adjust quantity, view subtotal, tax, and total.
7. **Place order** — submit the order to the venue.
8. **Order confirmation** — a clear success screen with the order number.
9. **Order tracking** — a live timeline of the order's progress.
10. **Add more items** — order again without leaving the flow.
11. **Call a waiter** — a one-tap request for staff attention.
12. **Request the bill** — a one-tap request for the bill.
13. **Pay online** — a secure payment flow with a digital receipt.
14. **Service catalog (hotel)** — a grid of services: room service, housekeeping, maintenance, concierge, laundry, spa, late checkout, wake-up call, do not disturb.
15. **Service request forms (hotel)** — one form per service, each with its own fields.
16. **Parallel request tracking** — see all active requests in one place.
17. **Request history** — a record of past requests.
18. **Counter pickup** — for counter venues, a name or label and a pickup-ready notification.
19. **Multi-language (future)** — the guest experience can be presented in the guest's preferred language.
20. **Accessibility** — the guest experience works with screen readers, keyboard navigation, and reduced-motion preferences.

### 12.2 Staff-Facing Features (Service Staff)

1. **Login** — a username and password, with a session that lasts the shift.
2. **Order queue** — a live list of active orders.
3. **Service request queue** — a live list of active requests (hotel).
4. **Table or room view** — a map of the venue's current state.
5. **One-tap status advancement** — move an item to the next stage.
6. **Elapsed time display** — see how long each item has been waiting.
7. **Filter and sort** — find the items that matter now.
8. **Notification on new item** — a subtle alert when something new arrives.
9. **Combined front-desk view** — for staff covering multiple queues.

### 12.3 Staff-Facing Features (Kitchen Staff)

1. **Login** — same as service staff.
2. **Ticket grid** — a large, always-visible layout of current tickets.
3. **Distance-readable typography** — everything legible from two meters.
4. **Dark mode** — for low-light kitchens.
5. **One-tap status advancement** — Start, Ready.
6. **New-ticket alert** — a subtle sound and a visual pulse.
7. **Auto-refresh** — the screen updates itself.

### 12.4 Manager/Owner-Facing Features

1. **Login** — username and password.
2. **Live dashboard** — waiting orders, kitchen orders, ready orders, today's revenue, today's order count, open service requests.
3. **Active orders list** — every order in flight, with status and actions.
4. **Completed orders list** — historical orders, filterable by date, exportable as CSV.
5. **Menu management** — add, edit, reorder, mark sold out, delete items; manage categories, modifier groups, and modifier options.
6. **Table management** — add, edit, and change status of tables.
7. **Room management** — add, edit, and change status of rooms; set per-room service availability.
8. **QR code management** — generate, preview, print, revoke, and regenerate QR codes.
9. **Batch QR printing** — print a sheet of QR codes for all tables or rooms at once.
10. **Staff management** — add, edit, deactivate, and reset password for staff; assign roles and queues.
11. **Branding** — set the venue's name, logo, brand color, welcome message, hero image; preview the guest experience.
12. **Module configuration** — turn table, room, counter, and kitchen modules on or off.
13. **Service catalog configuration** — enable or disable individual hotel services.
14. **Reports** — sales by day, week, month, year, and custom range, up to 6 months; export as CSV.
15. **Settings** — address, contact, tax, currency, hours, language, notifications, SLAs.
16. **Role-based access** — staff see what their role allows; managers see more; owners see everything.
17. **Multi-venue switching** — for owners managing more than one venue.

### 12.5 Venue-Wide Features

1. **Multi-tenancy** — one install per venue, with strict isolation between venues.
2. **Per-venue branding** — each venue's guest experience is its own.
3. **Per-venue data** — orders, requests, staff, and menus are never shared across venues.
4. **Real-time updates** — order and request status changes reflect on guest, staff, and kitchen screens within seconds.
5. **Data retention** — every order, request, and action is recorded permanently.
6. **Reporting** — sales, service requests, and staff activity can be reviewed and exported.
7. **Backup and recovery** — the venue's data is backed up regularly and can be restored.
8. **Module toggling** — every module can be enabled or disabled by the manager at any time without data loss.

---

## 13. The Visual Character

### 13.1 The Guest Atmosphere

The guest experience is warm, quiet, and inviting. It should feel like the venue's own design language — not software. Key qualities:

- **Warm colors** — a palette that feels like natural materials: muted greens, warm sand, soft peach, sage, and deep forest.
- **Display typeface for headings** — something with character, like a serif or a warm sans, that would not look out of place on a menu cover.
- **Clean sans for body text** — legible, comfortable, generous line-height.
- **Layered photography** — real images of food, rooms, and spaces. High quality. Warm tone.
- **Gentle motion** — entrances fade in, cards rise slightly, buttons lift on tap. Nothing fast, nothing flashy.
- **Generous whitespace** — the screen breathes. Nothing is cramped.
- **One clear action per screen** — the guest always knows what to do next.

### 13.2 The Working Atmosphere

The staff experience is quiet, dense, and functional. It should feel like a well-organized tool — not a marketing site. Key qualities:

- **Neutral colors** — soft greys and whites, with color used only for meaning (status badges).
- **Sans typeface only** — legible and utilitarian. Mono for IDs and timestamps.
- **Dense information** — more on the screen, less scrolling.
- **No decorative motion** — only state-change feedback and button press feedback.
- **Large hit targets** — buttons are forgiving.
- **Clear status colors** — waiting, preparing, ready, delivered each have their own color.

### 13.3 The Two Atmospheres Never Mix

A guest screen never looks like a staff screen. A staff screen never looks like a guest screen. The guest sees warmth; the staff see function. Both use the same underlying palette, but they apply it differently.

### 13.4 The Brand Color

Each venue chooses a brand color. That color is used on the guest-facing screens — the buttons, the highlights, the accents. It does not appear on the staff screens, which use a fixed, neutral palette so that all venues' staff tools feel the same.

### 13.5 Dark Mode

The kitchen screen supports a dark mode, often used in low-light kitchens. The guest experience does not have a dark mode — it is designed for a warm, light, appetizing look.

### 13.6 Accessibility

Every guest screen is usable by keyboard, by screen reader, and by guests who have set their device to reduce motion. Contrast is sufficient for reading. Touch targets are large enough to tap easily.

---

## 14. The Screen Map — Every Screen in the Product

This is every screen, described by what it is for.

### Guest Screens — Table

1. **Landing** — brand, hero, welcome, "View Menu" button, preview, how it works, footer.
2. **Menu** — categories, item list, search, filter, floating cart bar.
3. **Item detail / modifier sheet** — name, photo, description, options, quantity, notes, add to cart.
4. **Cart** — items, quantity, notes, totals, place order.
5. **Order confirmation** — success mark, order number, summary, track button.
6. **Order tracking** — timeline, items, add more, call waiter, request bill, pay.
7. **Call waiter / request bill** — a lightweight confirmation screen.
8. **Payment** — bill, payment method choice, redirect to provider, success.
9. **Receipt** — itemized view, download, email.
10. **Help / call front desk** — a small help screen with contact info.

### Guest Screens — Room

1. **Landing** — brand, hero, room number, service grid, how it works, help, footer.
2. **Service detail — Room Service** — the restaurant menu flow.
3. **Service detail — Housekeeping** — a form with items, time, notes.
4. **Service detail — Maintenance** — a form with issue, photo, urgency, notes.
5. **Service detail — Concierge** — a form with request type, details, notes.
6. **Service detail — Laundry** — a form with items, service level, pickup time.
7. **Service detail — Spa** — treatment, date, time, guests, notes.
8. **Service detail — Late Checkout** — time, notes.
9. **Service detail — Wake-up Call** — time.
10. **Service detail — Do Not Disturb** — toggle.
11. **Requests** — a combined view of every active request.
12. **Request detail** — one request's status timeline.
13. **Call front desk** — a simple request.
14. **Receipt / folio** — view and download.

### Guest Screens — Counter

1. **Landing** — brand, "Order now".
2. **Menu** — same as table menu.
3. **Item detail / modifier sheet** — same as table.
4. **Cart** — with a pickup name field.
5. **Order confirmation** — order number, track button.
6. **Order tracking** — Placed → Preparing → Ready for pickup → Picked up.
7. **Receipt** — view and download.

### Staff Screens — Table Service

1. **Login**.
2. **Queue — Orders** — a live list of orders.
3. **Queue — Requests** — a live list of service requests.
4. **Map — Tables** — a grid of the venue.
5. **Order detail** — one order's items and status.
6. **Request detail** — one request's details and status.

### Staff Screens — Room Service

1. **Login**.
2. **Queue — Room Service Orders** — a live list of room service orders.
3. **Queue — Housekeeping** — a live list of housekeeping requests.
4. **Queue — Maintenance** — a live list of maintenance requests.
5. **Queue — Concierge** — a live list of concierge requests.
6. **Queue — Laundry** — a live list of laundry requests.
7. **Queue — Spa** — a live list of spa bookings.
8. **Front Desk** — a combined view of all room requests.
9. **Map — Rooms** — a grid of the venue.
10. **Order / Request detail** — one item's details and status.

### Staff Screens — Kitchen

1. **Login**.
2. **Ticket grid** — a large, always-on view of all tickets.
3. **Ticket detail** — one ticket, expanded, with items and modifiers.

### Manager Screens

1. **Login**.
2. **Setup flow** (first login only).
3. **Dashboard** — live metrics and a compact order queue.
4. **Active Orders** — a list.
5. **Completed Orders** — a list, with filters and CSV export.
6. **Menu** — a list; add/edit forms; category and modifier managers.
7. **Tables** (if enabled) — a grid; add/edit; QR generation.
8. **Rooms** (if enabled) — a grid; add/edit; per-room service settings; QR generation.
9. **QR Codes** — a list; generation; batch printing; revocation.
10. **Staff** — a list; add/edit; role assignment; queue assignment; deactivate; reset password.
11. **Branding** — name, logo, color, welcome message, hero image, preview.
12. **Modules** — table, room, counter, kitchen on/off.
13. **Services** (if room module is on) — enable or disable individual services.
14. **Reports** — sales by range, charts, CSV export.
15. **Settings** — address, tax, currency, hours, language, notifications, SLAs.
16. **Venue switcher** (if multi-venue owner).

---

## 15. The Data the Product Works With — In Business Terms

The product remembers the following about the venue. This list is written in business language, not in database language, because the database design is an implementation choice and will be decided later.

- **The venue** — its name, its logo, its brand color, its address, its contact, its tax rules, its currency, its hours, its language, its enabled modules, its enabled services.
- **The venue's physical places** — its tables (restaurant), its rooms (hotel), or its counter (counter venue), each with a label and a status.
- **The QR codes** — each is tied to one physical place, has a code, has a state (active or revoked), and has a history of when it was generated and by whom.
- **The staff** — each has a name, a username, a password, a role, a set of queues they work on, and a history of logins and actions.
- **The menu** — its categories, its dishes, each dish's name, description, photo, price, availability, and modifier groups.
- **The modifiers** — each dish's options, each option's name, and each option's additional price.
- **The service catalog (hotel)** — which services are offered, and each service's own configuration, including SLA targets.
- **The orders** — each order remembers the place it came from (table, room, or counter pickup), the time it was placed, the items with their exact prices at that moment, the tax at that moment, the total, the notes, and the full history of status changes with the time of each change and the staff member who made it.
- **The service requests** — each request remembers the room, the type of service, the details entered by the guest, the time it was placed, the assigned staff, the status, and the full history of changes.
- **The payments (if enabled)** — each payment remembers the order or bill it was for, the amount, the method, the time, and the provider's reference.
- **The reports** — the product can look back over the last 6 months and produce summaries of sales and service activity by day, week, month, or custom range.

Nothing is ever deleted. When a menu item is removed, the historical orders that included it keep their record. When a staff member leaves, their past actions remain. When a QR code is revoked, its history remains. The venue's record is permanent.

---

## 16. The Complete Loops, End to End

### 16.1 The Restaurant Table Loop

1. Guest sits at table 12.
2. Guest scans the QR code on the table.
3. Browser opens the venue's landing page.
4. Guest sees the venue's name, logo, brand color, hero image, welcome message.
5. Guest taps "View Menu".
6. Menu screen opens. Categories at the top, dishes below.
7. Guest scrolls, taps a dish with options.
8. Modifier sheet opens.
9. Guest picks size, extras, quantity, adds a note.
10. Guest taps "Add to cart".
11. Sheet closes. Cart badge increments. Floating cart bar appears.
12. Guest continues browsing. Adds two more dishes.
13. Guest taps the floating cart bar.
14. Cart screen opens. Guest reviews items, adjusts quantity, adds a note.
15. Guest taps "Place order".
16. Loading screen for a moment.
17. Order confirmation opens. Order number shown. Track button shown.
18. Guest taps "Track your order".
19. Tracking screen opens. Timeline shows "Placed".
20. Behind the scenes, the order appears in the kitchen queue and the service staff queue.
21. Kitchen staff tap "Start". Tracking screen updates to "Preparing".
22. Kitchen staff tap "Ready". Tracking screen updates to "Ready".
23. Service staff tap "Deliver". Tracking screen updates to "Served".
24. Guest finishes the meal. Taps "Add more items" if they want more.
25. Guest taps "Request the bill".
26. Service staff see the request, bring the bill.
27. Guest taps "Pay now" (if payments enabled).
28. Payment screen opens. Guest pays. Receipt appears.
29. Guest closes the browser.
30. The venue's record shows the whole visit — order, items, times, amount — visible to the manager in the admin panel.

### 16.2 The Hotel Room Loop — Room Service Food

Same as the restaurant table loop, with the table replaced by the room, and the service staff replaced by room service staff.

### 16.3 The Hotel Room Loop — Housekeeping

1. Guest in room 412 scans the QR code.
2. Landing page opens with the service catalog.
3. Guest taps "Housekeeping".
4. Form opens: what do you need, when, notes.
5. Guest ticks "Extra towels" and "Room cleaning", picks "In the next hour", adds a note.
6. Guest taps "Request".
7. Confirmation screen. The request appears in the housekeeping queue.
8. Housekeeping staff log in and see the request.
9. Staff tap "Acknowledge". The guest's tracking screen updates.
10. Staff do the work. Staff tap "Complete". The guest's tracking screen updates.
11. The guest sees the request as completed.

### 16.4 The Hotel Room Loop — Maintenance

Same shape as housekeeping, with the maintenance form and queue. The guest may upload a photo. The maintenance staff see the photo.

### 16.5 The Hotel Room Loop — Concierge

Same shape as housekeeping, with the concierge form and queue. Concierge may message the guest through the tracking screen if needed.

### 16.6 The Hotel Room Loop — Laundry

Same shape, with the laundry form and queue. The staff pick up, process, and deliver. The guest tracks each stage.

### 16.7 The Hotel Room Loop — Spa

Same shape, with the spa form and queue. The spa team confirm or reschedule. The guest sees the confirmation.

### 16.8 The Hotel Room Loop — Late Checkout, Wake-up Call, Do Not Disturb

These are lighter loops:

- Late checkout: guest submits a time; front desk approves, denies, or proposes a different time; guest sees the response.
- Wake-up call: guest sets a time; the product schedules it; no further interaction.
- Do not disturb: guest toggles a flag; housekeeping skips the room; the flag can be toggled off later.

### 16.9 The Counter Loop

1. Guest scans the counter QR.
2. Landing opens with a single "Order now" button.
3. Guest taps it. Menu opens.
4. Guest browses, adds items, customizes.
5. Guest taps the cart, then "Place order".
6. Guest enters a pickup name.
7. Order is submitted.
8. Confirmation screen shows the order number.
9. Kitchen or counter staff prepare the order. The guest's tracking screen updates.
10. Staff mark "Ready for pickup". The guest's tracking screen updates.
11. Guest shows the order number at the counter. Staff confirm. Staff mark "Picked up".
12. The loop closes.

### 16.10 The Parallel Hotel Guest Loop

A hotel guest may run several loops at once. The Requests tab shows all of them, each with its own status and timeline. Tapping one opens its detail. The guest can start a new request at any time from the Services tab.

---

## 17. What This Product Is Not

To keep the scope honest and the product focused, the following are explicitly out of scope until the venue asks for them:

- A mobile app. The product is the browser.
- A public marketplace where guests discover venues. The guest only sees the venue they are physically inside.
- Cross-venue login. There are no guest accounts.
- Inventory management. The product tracks menu items and availability, not stock levels.
- Table reservations. The product serves guests who are already seated.
- Loyalty programs. The product does not track guest identities across visits.
- Kitchen printer integration. The product uses screens, not printers.
- Point-of-sale integration. The product is the point of sale for its own orders.
- Multi-language UI (in the first version). The product ships in one language per venue, and multi-language is a later feature.
- Offline operation. The product requires a connection.
- Advanced analytics. The product provides sales and service summaries, not data science.
- Booking systems beyond the venue's own services (e.g., no external hotel booking engine).

These are excluded so the product stays sharp. Adding any of them would be a deliberate decision, not an accident.

---

## 18. Summary — What We Are Building

We are building a hospitality platform that a restaurant, a hotel, a resort, a café, a food truck, or any hospitality venue deploys for itself. Guests interact through a QR code with no app and no account. The guest experience is warm, branded, and immediate. The staff experience is dense, quiet, and fast. The manager experience is organized, complete, and calm.

The product is built around four modules — table, room, counter, and kitchen — that every venue enables or disables to match its own facilities. A venue with tables uses the table module. A venue with rooms uses the room module. A venue with neither uses the counter module. A venue without a kitchen disables the kitchen module. The product never forces a venue into a shape it does not have.

The product handles food orders, service requests across many types, table and room management, staff management with role and queue assignment, branding, QR code generation and printing, module configuration, reporting, and payments. It handles restaurants and hotels with the same skeleton. It is deployed per venue, branded per venue, and isolated per venue.

Every screen, every flow, every click, and every loop has been described in this document — from the guest's first scan to the manager's final report, and from the smallest venue (a single counter) to the largest (a resort with tables, rooms, and a full kitchen).

---