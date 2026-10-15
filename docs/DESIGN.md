# FRONTEND DESIGN — COMPLETE SPECIFICATION

**Version:** 2.0
**Status:** Approved
**Approved:** 2026-10-15

---

# PART ONE — FIRST PRINCIPLES

## 1.1 The Emotional Job of the Guest Experience

The guest experience has one job that matters above all others: **to make the guest feel that they have arrived somewhere that knows what it is doing, and that ordering is the easiest thing they will do all evening.**

Within 1.5 seconds of the phone's browser opening after a scan, the guest must feel three things at once:

1. **Reassurance.** They are in the right place. The venue's name, its visual identity, and a single clear invitation sit above the fold. No confusion, no "is this an app?", no search bar, no cookie banner.
2. **Appetite.** The visual language must suggest that something good is about to happen — not because of stock photography, but because of the typographic warmth, the generous whitespace, and the way the food's names sit on the page like items on a menu cover.
3. **Permission to slow down.** The guest is not in a hurry, even if they think they are. The design must not push urgency. It must not use countdowns, "limited time", or red badges. It must let the guest browse as long as they want and order when they want.

This matters for the venue because **the guest's first 1.5 seconds decide whether they will order at all.** A guest who hesitates, who feels the page is confusing, who cannot find the menu button, will not ask for help — they will wave at a waiter. The product has failed the venue at the exact moment it was supposed to help.

**A guest experience that feels like software is a guest experience that loses revenue.**

## 1.2 The Emotional Job of the Staff Experience

The staff experience has one job: **to make the staff member feel that nothing is on fire that they have not already seen.**

When a kitchen staff member looks at the kitchen display at 7:45 PM on a Saturday, with 12 tickets in flight, they must feel:

1. **Total situational awareness.** Nothing on that screen surprises them. Every ticket is exactly where they expect it to be. They can scan the whole screen in two seconds and know what is behind.
2. **Zero guilt.** There is no hidden backlog. The screen does not lie by omission. If something is late, the screen says so in a way that lets them act, not a way that makes them feel blamed.
3. **Quiet confidence.** The staff member is not being managed by the software. They are using the software as a tool. The screen does not cheer, does not congratulate, does not nag.

This matters because **a staff member who distrusts the screen will stop looking at it.** A kitchen screen that is even slightly ambiguous — a ticket that could have been missed, a status that updates late, a "ready" that doesn't disappear — will be ignored by the staff within a week. The venue will revert to paper tickets. The product has failed.

**A staff experience that needs to be read is a staff experience that will not be used.**

## 1.3 Are These Really Two Designs, or One Design Expressed Differently?

**Two designs, sharing one foundation.**

The temptation is to say "it's one design system with two theme configurations." This is wrong, and it is the mistake that kills every dashboard-style product that tries to be both consumer and internal.

The guest and the staff do not just need different colors and different layouts. They need **different relationships to time, to information density, to failure, and to attention.**

- The guest has **unlimited time** and **limited attention**. The staff have **limited time** and **need total attention**.
- The guest interacts with the product **once, for a few minutes, with no training**. The staff interact with it **every day, for hours, with deep familiarity**.
- The guest sees **one screen at a time**. The staff see **all screens at once** — the queue, the clock, the printer, the door.
- The guest's failures are **forgivable**. The staff's failures are **operational failures that affect real guests.**

The two designs share:
- The same underlying palette of five anchors (so the product is unmistakably one product).
- The same spacing grid.
- The same radius scale.
- The same commitment to typographic clarity.

The two designs **do not share**:
- The motion policy. The guest animates. The staff does not.
- The density. The guest breathes. The staff compresses.
- The color expression. The guest uses warm surfaces. The staff use neutral surfaces.
- The typography. The guest uses a display serif for headings. The staff never uses a display serif.
- The default light or dark mode. The guest is always light. The staff defaults to dark on the kitchen.

**They are two designs that recognisably belong to the same product, the way a restaurant's dining room and its kitchen belong to the same restaurant.**

## 1.4 What Does the Product Physically Resemble?

Three physical metaphors drive the design.

**The restaurant guest experience is a printed menu cover.**
Not the inside of the menu — the cover. The cover has the venue's name in a typeface with character. It has one image, or one piece of typography large enough to be an image. It has nothing else. When a guest picks up a menu cover, they already know they will order; the cover exists to confirm that they are in a place that knows what it is. That is the guest experience's job for the first 1.5 seconds.

**The hotel room service experience is the morning card that the front desk slides under the door.**
It is quieter than a menu. It has a light touch. It lists what is available without insisting. It is respectful of the guest's privacy. When a guest picks it up, they feel they are being looked after, not sold to.

**The staff experience is the pass in a professional kitchen.**
The pass is the counter where finished dishes are placed and called out. It is not decorative. It is not warm. It is not what the guest sees. It is where the staff look when they need to know what is happening, right now. It has one job: to be scanned, not read. Everything about the staff design is derived from the pass.

**The kitchen display is a ticket rail.**
A ticket rail is a horizontal bar above the pass where paper tickets hang, ordered left to right by time. The kitchen staff do not read the tickets; they look at the rail. The rail's order is the information. The kitchen display must work the same way: the layout itself is the information.

## 1.5 The Core Tension

The product's central tension is **hospitality versus instrumentality**.

Hospitality says: *the guest is the reason we are here, and everything should be warm, human, unhurried, and personal.*

Instrumentality says: *the venue runs on a system, and the system must be fast, exact, unambiguous, and unattended.*

Every hospitality product I have seen fails by picking one and abandoning the other. The warm ones become slow and lose operational respect. The instrumented ones become cold and lose guests.

**The design leans into both, but never on the same screen.**

On the guest's screen, hospitality wins completely. The guest should never see a system. They should see a venue. They should never see an error code. They should see a friendly line in the venue's voice. They should never see a "processing" spinner. They should see a screen that says "bringing your order to the kitchen" in a way that feels like a waiter saying it.

On the staff's screen, instrumentality wins completely. The staff should never see hospitality. They should not see "Welcome back!" They should not see a friendly illustration of a chef. They should not see a tip of the hat. They should see exactly what is happening, exactly where, and exactly what to do next, in the fastest possible way.

**This is why the two worlds cannot share a page. Not because it is bad design, but because they are different verbs.** The guest's verb is *choose*. The staff's verb is *act*.

## 1.6 The Worst Version of This Design

The worst version is a Next.js template with shadcn/ui defaults, a purple or gradient hero, and a feature grid. Specifically:

- A guest landing page with a full-screen gradient background, a floating blob on the right, a hero image of food that has obviously been lifted from Unsplash, a "Get Started" button that does nothing, and a "Features" section with three columns of Lucide icons in rounded squares.
- A restaurant menu page with cards in a three-column grid, each with a photo, a "Popular" badge, an "Add" button that is a tiny plus sign, and a "See all" link.
- A cart page with a floating bottom bar that has a horizontal slide-in animation and a "Proceed to checkout" button that uses a gradient.
- A kitchen display with a Material Design table, alternating row colors, tiny text, and a "Refresh" button that the staff have to click.
- An admin panel with a left sidebar of twenty-four items, a top bar with a search input, a bell icon, and an avatar, and a dashboard of five cards with sparklines and a percentage change.
- Everywhere: rounded corners of 24px, soft shadows, gray-100 backgrounds, and the exact same content on every screen.

Every one of these clichés is forbidden. The reason is not that they are ugly individually. The reason is that **they are the visual language of software that was not made by anyone in particular.** Guests and staff can both sense this, and both respond to it badly. The guest senses "this is a generic tool, not this venue" and closes the browser. The staff sense "this was not built for us" and revert to paper.

## 1.7 The Unmistakable Decision

The single decision that, if removed, would make the product generic is: **the customer experience never uses a screen-wide background color. It always uses a surface, and the surface is always slightly warm.**

Every other consumer product uses white, or a very pale gray, or a gradient. Every "AI SaaS" uses a gradient. When the guest lands on a surface that is a fraction warmer than white — a color that feels like the paper a menu is printed on — the experience immediately reads as authored. It says: someone chose this. Someone said "this restaurant's menu would be on paper this color."

The staff experience uses the exact opposite rule: **the surface is always exactly neutral, never warm, never tinted.** The staff are not being seduced. They are being shown a fact.

The contrast between the two — warm in the guest world, neutral in the staff world — is the product's signature. It makes the two worlds unmistakable and it makes each world unmistakable against every other SaaS on the internet.

## 1.8 Surviving Without Images

**The design must survive without any images, and in the guest world it should be better without them.**

This is the most important test of the design. If a guest landing page cannot be beautiful without a hero photograph, the design is not a design — it is a slot for a photograph. Any venue can supply a photograph. Few can supply a design.

So the design is built on the assumption that the guest world may have no images at all. This forces the layout to lean entirely on:

- **Type** — a display serif that carries the page's weight, at sizes that make the type itself the image.
- **Whitespace** — a spacing scale that gives the type room, so the page breathes even when it is nothing but words on a warm surface.
- **One accent** — a single brand color used sparingly, so its presence means something.
- **Motion** — used generously, but only to invite the eye, never to entertain it.

When a venue does have photography, it becomes decoration on a strong skeleton, not a crutch for a weak one.

In the staff world, the design must survive without images because it will never have any. No photographs, no illustrations, no icons-as-decoration. Only type, spacing, and one signal color per state. This is not a constraint; it is the correct design for a pass.

---

# PART TWO — DESIGN SPECIFICATION

## 4.1 Design Thesis

**The product is a hospitality system that hides its machinery behind warmth on the guest side and reveals it as a clean tool on the staff side.** It borrows from the physical artifacts of restaurants and hotels — the menu cover, the room service card, the pass, the ticket rail — and from the design tradition of editorial print: generous whitespace, a display serif used with restraint, and a palette drawn from natural materials (muted olive, warm sand, soft peach, sage, and forest). It rejects the visual language of software: gradients, floating blobs, glassmorphism, purple, animated hero images, feature grids, dashboard cards with sparklines, and every decoration that exists because "that is what a modern SaaS looks like." It also rejects the opposite failure — the cold, sterile, "minimalist" product that uses pure white, pure black, and Helvetica as a personality. The design is warm without being soft, exact without being cold, and unmistakably one product across both its worlds even though each world is unmistakably itself.

## 4.2 Color System

### 4.2.1 The Five Anchors

Every color in the product derives from five anchors. These are the only raw hex values in the codebase. Every other color is a token that resolves to one of these, or a derived shade on a scale.

| Token | Hex | Why this color exists |
|-------|-----|----------------------|
| `--color-olive-500` | `#626542` | The primary brand color. It is the color of an olive leaf in late summer — natural, quiet, alive. It is deep enough to be used as a primary action color and muted enough that a venue can build a visual identity on it without competing with the food. |
| `--color-sand-500` | `#ab9170` | A warm mid-tone. It is the color of unbleached paper, of a wooden table, of a linen napkin. It exists to be the workhorse surface in the guest world, the color that says "printed menu" without needing a photograph to say it. |
| `--color-peach-500` | `#ddb69e` | A soft accent. It is the color of a peach at the moment it is ready to eat. It exists to be the "something is happening" color in the guest world — active states, highlights, the moment a card is touched. |
| `--color-sage-500` | `#849894` | A cool neutral. It is the color of a chalkboard, of a slate counter, of the wall of a working kitchen. It exists as the staff world's secondary surface and as a status color for completed and closed states. |
| `--color-forest-700` | `#344b3c` | A deep, low-saturation green. It is the color of deep shade under a tree. It exists as the staff world's brand color, the guest world's primary text color, and the color of every place where a strong, quiet contrast is needed without resorting to black. |

**No other raw hex values exist in the codebase.** Every component uses tokens, and every token resolves to one of these five or to a shade on one of their scales.

### 4.2.2 Primitive Scales

Each anchor expands into a nine-step scale. The 500 step is the anchor. The lighter steps move toward the warm-white of paper, and the darker steps move toward deep shade. The scales are not mathematically generated; they are hand-tuned so that mid-tones stay warm and dark tones stay neutral-green rather than turning muddy.

**Olive scale (brand primary):**
```
--color-olive-50:  #f4f5f0
--color-olive-100: #e4e7db
--color-olive-200: #c9cfb9
--color-olive-300: #aeb796
--color-olive-400: #929f74
--color-olive-500: #626542   ← anchor
--color-olive-600: #4f5235
--color-olive-700: #3c3f28
--color-olive-800: #2a2c1c
--color-olive-900: #181a10
```

**Sand scale (warm neutral):**
```
--color-sand-50:  #faf7f2
--color-sand-100: #f2ece1
--color-sand-200: #e6d9c4
--color-sand-300: #d9c6a7
--color-sand-400: #ccb38a
--color-sand-500: #ab9170   ← anchor
--color-sand-600: #8b7458
--color-sand-700: #6b5942
--color-sand-800: #4b3e2d
--color-sand-900: #2b2319
```

**Peach scale (accent):**
```
--color-peach-50:  #fdf7f3
--color-peach-100: #fbece1
--color-peach-200: #f7d9c5
--color-peach-300: #f3c5a6
--color-peach-400: #eebdaf
--color-peach-500: #ddb69e   ← anchor
--color-peach-600: #c99880
--color-peach-700: #a87a62
--color-peach-800: #7c5947
--color-peach-900: #523a2e
```

**Sage scale (cool neutral):**
```
--color-sage-50:  #f4f7f6
--color-sage-100: #e6ecea
--color-sage-200: #ccd7d4
--color-sage-300: #b3c2be
--color-sage-400: #99aca8
--color-sage-500: #849894   ← anchor
--color-sage-600: #6b7d79
--color-sage-700: #525f5c
--color-sage-800: #3a4240
--color-sage-900: #232826
```

**Forest scale (deep contrast):**
```
--color-forest-50:  #eef2ef
--color-forest-100: #d6dfd9
--color-forest-200: #aebfb4
--color-forest-300: #869f8f
--color-forest-400: #5d7e6a
--color-forest-500: #45604f
--color-forest-600: #3d5748
--color-forest-700: #344b3c   ← anchor
--color-forest-800: #243329
--color-forest-900: #141c17
```

**Neutral grayscale (staff world):**
```
--color-neutral-0:   #fbfbfa   (never pure white; a fraction warm)
--color-neutral-50:  #f5f5f4
--color-neutral-100: #ebebe9
--color-neutral-200: #dedeDB
--color-neutral-300: #c4c4c0
--color-neutral-400: #9a9a96
--color-neutral-500: #71716d
--color-neutral-600: #4a4a47
--color-neutral-700: #333330
--color-neutral-800: #1f1f1d
--color-neutral-900: #141413   (never pure black; a fraction warm)
```

**Rule:** No component ever uses `#000000` or `#ffffff`. The closest allowed values are `--color-neutral-900` and `--color-neutral-0`, both of which are very slightly warm. This is deliberate: pure black and pure white read as software; the fractional warmth reads as a physical surface.

### 4.2.3 Status Colors

Status colors are functional, not decorative. They are used only to signal order and request states in both worlds.

| Token | Hex | Meaning |
|-------|-----|---------|
| `--color-status-waiting` | `--color-neutral-500` | Waiting for staff action |
| `--color-status-waiting-bg` | `--color-neutral-100` | |
| `--color-status-active` | `#c2810f` | In progress (kitchen preparing, request being handled) |
| `--color-status-active-bg` | `#fbf0d7` | |
| `--color-status-ready` | `#3d7a4a` | Ready (kitchen finished, waiting for delivery) |
| `--color-status-ready-bg` | `#ddeede` | |
| `--color-status-done` | `--color-sage-600` | Delivered or completed |
| `--color-status-done-bg` | `--color-sage-100` | |
| `--color-status-cancelled` | `#8a3a34` | Cancelled or declined |
| `--color-status-cancelled-bg` | `#f3dbd8` | |

**Why these specific colors:** The status palette is derived from the anchors' darkest tones for the "done" state, from a natural amber for the "active" state, from a deep quiet green for "ready", and from a muted rust for "cancelled." None of them are the aggressive reds and greens of a dashboard. They are the colors of a working restaurant: a chalk mark on a slate, a red pencil, a green sticker.

**Order status → color mapping (locked):**

| Status | Foreground | Background |
|--------|-----------|-----------|
| Placed / Submitted | `--color-status-waiting` | `--color-status-waiting-bg` |
| Approved / Acknowledged | `--color-status-active` | `--color-status-active-bg` |
| Preparing / In Progress | `--color-status-active` | `--color-status-active-bg` |
| Ready | `--color-status-ready` | `--color-status-ready-bg` |
| Delivered / Completed | `--color-status-done` | `--color-status-done-bg` |
| Cancelled / Declined | `--color-status-cancelled` | `--color-status-cancelled-bg` |

The staff world and the guest world use the same status colors so that a staff member and a guest, looking at different screens, see the same signal for the same state.

### 4.2.4 Semantic Tokens — Guest World

The guest world uses warm surfaces. Its default state is light only — there is no guest dark mode.

```
/* Guest surfaces */
--guest-surface:          var(--color-sand-50)      /* page background */
--guest-surface-raised:   var(--color-neutral-0)    /* cards, sheets */
--guest-surface-sunken:   var(--color-sand-100)     /* inset areas */

/* Guest text */
--guest-text-primary:     var(--color-forest-700)
--guest-text-secondary:   var(--color-olive-600)
--guest-text-muted:       var(--color-sand-600)
--guest-text-inverse:     var(--color-neutral-0)

/* Guest borders */
--guest-border-subtle:    var(--color-sand-200)
--guest-border-strong:    var(--color-sand-400)

/* Guest brand */
--guest-brand:            var(--color-olive-500)    /* overridden per venue */
--guest-brand-contrast:   var(--color-neutral-0)    /* text on brand */
--guest-brand-muted:      var(--color-olive-100)

/* Guest accent */
--guest-accent:           var(--color-peach-500)
```

### 4.2.5 Semantic Tokens — Staff World

The staff world uses neutral surfaces. Its default state is light, with a dark mode for the kitchen.

```
/* Staff surfaces */
--staff-surface:          var(--color-neutral-50)
--staff-surface-raised:   var(--color-neutral-0)
--staff-surface-sunken:   var(--color-neutral-100)

/* Staff text */
--staff-text-primary:     var(--color-neutral-900)
--staff-text-secondary:   var(--color-neutral-600)
--staff-text-muted:       var(--color-neutral-400)
--staff-text-inverse:     var(--color-neutral-0)

/* Staff borders */
--staff-border-subtle:    var(--color-neutral-200)
--staff-border-strong:    var(--color-neutral-300)

/* Staff brand (fixed, never per-venue) */
--staff-brand:            var(--color-forest-700)
--staff-brand-contrast:   var(--color-neutral-0)
--staff-accent:           var(--color-sage-500)
```

### 4.2.6 Staff Dark Mode

The kitchen screen defaults to dark. The toggle is available on every staff screen.

```
[data-theme="dark"] {
  --staff-surface:          var(--color-neutral-900);
  --staff-surface-raised:   var(--color-neutral-800);
  --staff-surface-sunken:   var(--color-neutral-950, #0b0b0a);

  --staff-text-primary:     var(--color-neutral-50);
  --staff-text-secondary:   var(--color-neutral-300);
  --staff-text-muted:       var(--color-neutral-500);
  --staff-text-inverse:     var(--color-neutral-900);

  --staff-border-subtle:    var(--color-neutral-700);
  --staff-border-strong:    var(--color-neutral-600);

  --staff-brand:            var(--color-sage-400);
  --staff-accent:           var(--color-sage-300);
}
```

### 4.2.7 Per-Tenant Theming Rule

Only the guest world is per-tenant themed. The staff world is not.

**How it works:** The server resolves the venue's brand color at request time and injects it as `--guest-brand` on the guest root element. All guest components use `--guest-brand` and its variants. No guest component ever references `--color-olive-500` directly.

**Why only the guest world:** The staff tools are used by staff who work at one venue but may be trained on the product at another. Keeping the staff tools visually identical across venues means a staff member who has used the product at one venue can walk into another and know exactly where everything is. This matters more than brand consistency.

**Contrast enforcement:** The venue's brand color must pass WCAG AA (4.5:1) against `--guest-surface` for text, and 3:1 against `--guest-surface` for UI components. The developer validates this during onboarding. If a venue's color fails, the developer chooses a shade within the venue's brand family that passes.

## 4.3 Typography

### 4.3.1 Font Families

Three families total. No more.

| Token | Family | Role |
|-------|--------|------|
| `--font-display` | **Fraunces** (variable, serif) | Guest world headings only |
| `--font-sans` | **Geist** (variable, sans) | Body text in both worlds, all staff world text |
| `--font-mono` | **Geist Mono** | Order IDs, timestamps, QR tokens |

**Why Fraunces:** Fraunces is a variable serif with an optical-size axis and a "soft" axis. At large sizes it feels like a menu cover from a serious restaurant — not a wedding invitation, not a newspaper. At smaller sizes it remains readable as a heading. It has warmth without being sentimental, and it is unmistakably not a system font. It exists in the design because the guest experience is a menu cover, and a menu cover is a printed artifact.

**Why Geist:** Geist is a modern sans with a neutral skeleton and just enough character in its terminals that it does not look like every other UI sans. It is legible at large sizes (for the kitchen) and at small sizes (for the admin tables). It is not Inter, not Roboto, not Arial, not Poppins. It exists because it works well as a workhorse without asking for attention.

**Why Geist Mono:** The staff world shows order IDs, table numbers, and timestamps. A mono font makes these unmistakable as identifiers rather than words. Geist Mono matches the family, so the two never look foreign to each other. It exists because identifiers should look like identifiers.

**Why not Inter, Roboto, Arial, or Poppins:** Each of these is the visual equivalent of a beige wall. They are chosen because they are safe, not because they are right. A menu cover with Inter on it is a menu cover that says nothing.

### 4.3.2 Type Scale — Guest World

The guest world uses type at generous sizes, with tight line-height on display and loose line-height on body.

| Token | Size / Line-height | Family | Weight | Use |
|-------|-------------------|--------|--------|-----|
| `--guest-text-hero` | 56px / 60px (mobile: 40px / 44px) | display | 500 | Landing venue name |
| `--guest-text-h1` | 40px / 46px (mobile: 32px / 38px) | display | 500 | Section headings |
| `--guest-text-h2` | 28px / 34px | display | 500 | Card titles, category headers |
| `--guest-text-h3` | 22px / 28px | sans | 600 | Subsection headings |
| `--guest-text-h4` | 18px / 24px | sans | 600 | Item names, cart headings |
| `--guest-text-body-lg` | 18px / 30px | sans | 400 | Menu descriptions |
| `--guest-text-body` | 16px / 26px | sans | 400 | Default body |
| `--guest-text-body-sm` | 14px / 22px | sans | 400 | Secondary text |
| `--guest-text-label` | 13px / 18px | sans | 600 | Buttons, tags, labels |
| `--guest-text-caption` | 12px / 16px | sans | 500 | Smallest captions |

### 4.3.3 Type Scale — Staff World

The staff world uses type at slightly larger minimums than a typical dashboard, so it stays legible on the kitchen screen at 2 meters. It never uses the display serif.

| Token | Size / Line-height | Family | Weight | Use |
|-------|-------------------|--------|--------|-----|
| `--staff-text-h1` | 28px / 36px | sans | 600 | Page headings |
| `--staff-text-h2` | 22px / 30px | sans | 600 | Section headings |
| `--staff-text-h3` | 18px / 26px | sans | 600 | Card headings |
| `--staff-text-body-lg` | 18px / 26px | sans | 500 | Order row primary text, kitchen ticket items |
| `--staff-text-body` | 16px / 24px | sans | 400 | Default body |
| `--staff-text-body-sm` | 14px / 20px | sans | 400 | Secondary text |
| `--staff-text-label` | 13px / 18px | sans | 600 | Table headers, field labels |
| `--staff-text-mono` | 14px / 20px | mono | 500 | Order IDs, timestamps |
| `--staff-text-mono-lg` | 20px / 24px | mono | 600 | Kitchen ticket order numbers |
| `--staff-text-place` | 40px / 44px | sans | 600 | Kitchen ticket table/room number (the hero element) |

### 4.3.4 Typography Rules

1. The guest world never uses `--font-sans` for the hero or for H1/H2. Display serif only.
2. The staff world never uses `--font-display`. Sans and mono only.
3. Minimum body size in the guest world: 16px.
4. Minimum body size in the kitchen ticket: 18px.
5. Line length in the guest world: 45–75 characters. In staff tables: 60–90.
6. No uppercase except for status labels and micro-labels (e.g., "PLACED").
7. No letter-spacing adjustments except on the smallest captions (0.02em max).
8. No font-weight values outside the variable range of each family. No `font-weight: 100`.

### 4.3.5 Font Loading Strategy

- Both Fraunces and Geist are loaded via `next/font` with the `latin` subset.
- `display: 'swap'` on both.
- Fraunces is loaded with the `opsz` and `SOFT` axes at specific values to match the intended display usage.
- Geist and Geist Mono are loaded at their default variable axes.
- **Fallbacks:** For display, `Fraunces, "Iowan Old Style", Georgia, serif`. For sans, `Geist, system-ui, -apple-system, sans-serif`. For mono, `"Geist Mono", ui-monospace, "SF Mono", monospace`.
- No external font CDN. All fonts are self-hosted as part of the build.

## 4.4 Spacing, Radius, Elevation, Grid

### 4.4.1 Spacing Scale

The 8px grid, with a 4px half-step for tight cases.

```
--space-0:   0
--space-px:  1px
--space-0-5: 2px
--space-1:   4px
--space-1-5: 6px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
--space-20:  80px
--space-24:  96px
--space-32:  128px
--space-40:  160px
```

**Rules:**
- All padding, margin, and gap values come from this scale. No arbitrary values.
- The guest world uses the upper range (`8` and above) generously; the staff world uses the lower range (`1` to `6`) densely.
- Vertical rhythm in the guest world uses even numbers only (8, 16, 24, 32, 48, 64). Odd numbers feel mechanical.

### 4.4.2 Radius Scale

```
--radius-xs:   2px    /* inline code, tiny chips */
--radius-sm:   6px    /* badges, small chips */
--radius-md:   10px   /* inputs, buttons */
--radius-lg:   14px   /* cards, panels */
--radius-xl:   20px   /* guest cards, sheet corners */
--radius-2xl:  28px   /* guest hero panels only */
--radius-full: 9999px /* pills, avatars */
```

**Rules:**
- Guest world uses `lg` to `2xl`. Never `sm` or `xs` on a card.
- Staff world uses `sm` to `lg`. Never `xl` or `2xl` on a staff surface.
- Never mix radius sizes on a single card.

### 4.4.3 Elevation Scale

```
--shadow-none: none
--shadow-xs:   0 1px 2px 0 rgb(20 20 19 / 0.04)
--shadow-sm:   0 2px 4px -1px rgb(20 20 19 / 0.05), 0 1px 2px -1px rgb(20 20 19 / 0.04)
--shadow-md:   0 4px 8px -2px rgb(20 20 19 / 0.06), 0 2px 4px -2px rgb(20 20 19 / 0.04)
--shadow-lg:   0 12px 24px -8px rgb(20 20 19 / 0.08), 0 4px 8px -4px rgb(20 20 19 / 0.05)
--shadow-xl:   0 24px 48px -16px rgb(20 20 19 / 0.10), 0 8px 16px -8px rgb(20 20 19 / 0.06)
--shadow-brand-glow: 0 0 40px -8px var(--guest-brand)
```

**Rules:**
- Guest world uses `md` to `xl`. `brand-glow` is reserved for the hero card only.
- Staff world uses `none` to `sm`. `md` is used only on modals.
- Never use a shadow to make something look important. Use size, position, or contrast.

### 4.4.4 Grid

**Guest world:**
- Mobile (<640px): single column, 16px margins.
- Tablet (640–1024px): content max-width 640px, centered.
- Desktop (1024–1440px): content max-width 800px, centered.
- Large desktop (>1440px): content max-width 960px, centered.
- The guest world never uses a 12-column grid. It uses a content column with intentional, individual sections.

**Staff world:**
- 12-column grid, 16px gutter, 16px outer margin.
- Full-width up to 1920px. Above that, the layout is centered with a max-width of 1920px.
- The staff world uses the grid for dense layouts (tables, ticket grids).

### 4.4.5 Breakpoints

```
--bp-sm:  640px
--bp-md:  768px
--bp-lg:  1024px
--bp-xl:  1280px
--bp-2xl: 1536px
--bp-3xl: 1920px
```

**Rules:**
- Guest world is designed mobile-first from 375px.
- Staff world is designed desktop-first from 1440px and degrades down to 1024px (tablet landscape). Below 1024px, the staff world shows a "please use a larger screen" message; the staff tools are not designed for phones.
- Kitchen display is designed for 1920×1080 and 1366×768 specifically.

## 4.5 Motion Language

### 4.5.1 Overall Motion Personality

**Guest world:** *Slow and confident, like a host walking you to your table. The motion never rushes, never surprises, and never draws attention to itself.*

**Staff world:** *Functional and immediate, like a light switching on. There is no motion that exists for its own sake, and the motion that exists is measured in milliseconds, not tenths of seconds.*

### 4.5.2 Duration Tokens

**Guest world:**
```
--guest-motion-instant:  120ms
--guest-motion-fast:     200ms
--guest-motion-base:     320ms
--guest-motion-slow:     480ms
--guest-motion-entrance: 600ms
```

**Staff world:**
```
--staff-motion-instant:   80ms
--staff-motion-fast:      140ms
--staff-motion-base:      200ms
--staff-motion-flash:     320ms
```

### 4.5.3 Easing Tokens

**Guest world:**
```
--guest-ease-out:      cubic-bezier(0.16, 1, 0.3, 1)
--guest-ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1)
--guest-ease-entrance: cubic-bezier(0.22, 1, 0.36, 1)
--guest-ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Staff world:**
```
--staff-ease-out: cubic-bezier(0.2, 0.8, 0.2, 1)
--staff-ease-in:  cubic-bezier(0.4, 0, 1, 1)
```

### 4.5.4 Permitted Motion — Guest World

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Hero entrance (fade + rise 12px) | `--guest-motion-entrance` | `--guest-ease-entrance` | Once on landing load only |
| Section scroll reveal (fade + rise 8px) | `--guest-motion-slow` | `--guest-ease-entrance` | Fires when 20% in view |
| Card hover-lift (translateY -2px + shadow-md) | `--guest-motion-fast` | `--guest-ease-out` | Only on devices with hover |
| Button press (scale 0.98) | `--guest-motion-instant` | `--guest-ease-out` | |
| Add-to-cart confirmation (sheet close + cart badge pulse) | `--guest-motion-base` | `--guest-ease-spring` | The one moment of delight |
| Cart drawer slide-in | `--guest-motion-base` | `--guest-ease-in-out` | |
| Page transition (fade) | `--guest-motion-base` | `--guest-ease-out` | |
| Order status change (state dot pulse once) | `--guest-motion-slow` | `--guest-ease-out` | Gentle, single, not looping |

### 4.5.5 Permitted Motion — Staff World

| Interaction | Duration | Easing | Notes |
|-------------|----------|--------|-------|
| Button press (background darkens 4%) | `--staff-motion-instant` | `--staff-ease-out` | |
| Status change flash (row background to new status color) | `--staff-motion-flash` | `--staff-ease-out` | Once, then settles |
| Modal fade-in (opacity only) | `--staff-motion-fast` | `--staff-ease-out` | |
| Toast slide-in from top-right | `--staff-motion-base` | `--staff-ease-out` | |
| Loading indicator (three dots pulsing) | continuous | `--staff-ease-in-out` | Only during fetch |

### 4.5.6 Forbidden Motion — Both Worlds

- No skeleton shimmer in the staff world. Use a simple "Loading…" text or a single pulsing dot.
- No entrance animations in the staff world. Elements appear, they do not fade in.
- No parallax in the staff world. Ever.
- No bouncing, no elastic, no "attention-grabbing" animations.
- No animated illustrations.
- No looping background animations.
- No motion that exceeds `--guest-motion-entrance` in the guest world, or `--staff-motion-flash` in the staff world.

### 4.5.7 Reduced Motion

When `prefers-reduced-motion: reduce` is set:

- All durations become `0ms`.
- All transforms are removed. Elements appear at their final position.
- Scroll-triggered reveals become immediate visibility.
- The cart badge pulse becomes an immediate state change.
- The status-change flash becomes an immediate background color change (no transition).

**Rule:** Reduced motion is not "slower motion." It is "no motion." A user who has asked for reduced motion gets the same information, immediately, without any transition.

### 4.5.8 The Hard Ceiling

**Guest world ceiling:** 600ms. No animation exceeds this. The hero is the only element that uses the full 600ms, and it fires exactly once.

**Staff world ceiling:** 320ms. No animation exceeds this. The status-change flash is the only element that uses the full 320ms.

**Why the ceilings:** In the guest world, a 600ms entrance is on the long side of what the human eye tolerates without feeling slowed down. Anything longer feels deliberate. In the staff world, 320ms is the longest a state change can take before a staff member wonders whether the screen is stuck. Both ceilings exist so that no single animation ever becomes a bottleneck.

## 4.6 Component Specification

Every component is specified with: Purpose, World, Anatomy, States, Motion, Accessibility, Tokens.

### 4.6.1 Button

**Purpose:** Trigger a single action.

**World:** Both (visually distinct per world).

**Anatomy:** `root` → `label`, `leading-icon?`, `trailing-icon?`.

**Variants:** `primary`, `secondary`, `ghost`, `danger`.

**Sizes:** `sm` (32px height), `md` (40px height), `lg` (52px height, guest world only), `xl` (60px height, guest world CTA only).

**States:**
- Default: solid background for primary, outline for secondary, no background for ghost.
- Hover (pointer devices only): background darkens by one scale step; no size change.
- Focus: 2px ring in `--guest-brand` or `--staff-brand`, offset 2px, visible on keyboard focus only.
- Active: `scale(0.98)` for 120ms in guest world; background darkens for 80ms in staff world.
- Disabled: 40% opacity, no pointer events, cursor `not-allowed`.
- Loading: label replaced by a three-dot pulsing indicator; button width locked.

**Motion:** Guest: press scale only. Staff: background transition only. No other motion.

**Accessibility:** Renders as a `<button>`. Icon-only buttons require an `aria-label`. Loading buttons set `aria-busy="true"`. Disabled buttons use `disabled` attribute, not just visual styling.

**Tokens:** `--guest-brand`, `--staff-brand`, `--radius-md`, `--space-*`, text tokens per world.

### 4.6.2 Input / Textarea

**Purpose:** Accept user text.

**World:** Both.

**Anatomy:** `root` → `label`, `input`, `helper?`, `error?`.

**Sizes:** `md` (40px), `lg` (48px, guest world).

**States:** Default, focus (2px border in brand, no shadow), error (border in `--color-status-cancelled`), disabled (surface-sunken background, muted text), read-only.

**Motion:** None.

**Accessibility:** Label always rendered (visible or `aria-label`). Error text linked with `aria-describedby`. Error state uses `aria-invalid="true"`.

**Tokens:** `--guest-surface-raised`, `--staff-surface-raised`, `--guest-border-subtle`, `--staff-border-subtle`, `--radius-md`.

### 4.6.3 Select / Dropdown

**Purpose:** Choose from a list.

**World:** Staff primarily (guest world uses a sheet-based picker instead).

**Anatomy:** `trigger` → `value`, `chevron`; `menu` → `item*`, `divider?`, `group-label?`.

**States:** Closed, open, item-hover, item-selected, disabled.

**Motion:** Menu fades in over 140ms, no slide. Item hover is instant.

**Accessibility:** Uses a headless primitive (Radix or equivalent) for keyboard and screen reader behavior. Visual overrides only.

**Tokens:** `--staff-surface-raised`, `--staff-border-subtle`, `--radius-md`.

### 4.6.4 Checkbox / Radio

**Purpose:** Toggle a boolean or choose one of a set.

**World:** Both.

**Anatomy:** `root` → `control`, `label`.

**Size:** 20px control (guest), 16px control (staff). Touch target always ≥44px in guest world, ≥48px in staff world.

**States:** Unchecked, checked, indeterminate (checkbox only), focus, disabled, error.

**Motion:** Checkmark draws in 120ms with `--guest-ease-out` (guest world). Staff world: instant.

**Accessibility:** Native `<input>` underneath. Label is always associated.

### 4.6.5 Dialog (Modal)

**Purpose:** Present focused content that blocks the underlying view.

**World:** Both.

**Anatomy:** `overlay` → `panel` → `header` → `title`, `close`; `body`; `footer`.

**Sizes:** `sm` (400px), `md` (560px), `lg` (720px).

**States:** Closed, opening (fade), open, closing (fade).

**Motion:** Guest world: overlay fades in 200ms, panel scales from 0.96 to 1 over 320ms with `--guest-ease-out`. Staff world: overlay and panel fade in 140ms.

**Accessibility:** Focus trap. `role="dialog"`. `aria-modal="true"`. `aria-labelledby` points to the title. Esc closes. Focus returns to trigger on close.

**Tokens:** `--guest-surface-raised`, `--staff-surface-raised`, `--shadow-xl`.

### 4.6.6 Sheet / Drawer

**Purpose:** Slide-in panel for secondary content (mobile menus, cart).

**World:** Guest primarily.

**Anatomy:** `overlay` → `panel` (bottom sheet or side drawer) → `handle?`, `header`, `body`, `footer`.

**Positions:** `bottom` (mobile default), `right` (cart, desktop).

**Motion:** Slides in over 320ms with `--guest-ease-in-out`. Overlay fades in simultaneously.

**Accessibility:** Same as dialog. Swipe-to-dismiss on bottom sheet, with keyboard alternative (Esc).

### 4.6.7 Tabs

**Purpose:** Switch between views within the same context.

**World:** Both (visually distinct).

**Anatomy:** `list` → `trigger*`; `panel*`.

**States:** Default, active, focus, disabled.

**Motion:** Guest world: an underline indicator slides between tabs over 320ms. Staff world: instant background change.

**Accessibility:** `role="tablist"`, `role="tab"`, `role="tabpanel"`. Arrow keys navigate.

### 4.6.8 Table

**Purpose:** Display dense structured data.

**World:** Staff only.

**Anatomy:** `root` → `header` → `header-cell*`; `body` → `row*` → `cell*`.

**States:** Default, row-hover, row-selected, row-expanded, empty, loading.

**Motion:** None except the status-change flash on rows that change state.

**Accessibility:** `role="table"` or native `<table>`. Header cells use `<th>`. Sortable columns announce sort state.

**Tokens:** `--staff-border-subtle`, `--staff-surface-raised`, `--staff-text-primary`.

### 4.6.9 Badge

**Purpose:** Show a small piece of status or metadata.

**World:** Both.

**Anatomy:** `root` → `dot?`, `label`.

**Variants:** `status` (uses status colors), `neutral`, `brand`.

**Motion:** None except status-change (fill color transitions over 320ms in guest world; instant in staff world).

### 4.6.10 Card

**Purpose:** Group related content.

**World:** Both.

**Anatomy:** `root` → `media?`, `header?`, `body`, `footer?`.

**States:** Default, hover (guest only), focus (if interactive), selected.

**Motion:** Guest world: hover-lift (translateY -2px, shadow-md) over 200ms. Staff world: no hover motion.

**Tokens:** `--guest-surface-raised`, `--staff-surface-raised`, `--radius-lg` or `--radius-xl`, `--shadow-sm` or `--shadow-md`.

### 4.6.11 Alert

**Purpose:** Inline message for success, warning, error, or info.

**World:** Both.

**Anatomy:** `root` → `icon?`, `title?`, `body`, `action?`.

**States:** Variants per severity.

**Motion:** None.

### 4.6.12 Toast

**Purpose:** Transient notification.

**World:** Staff primarily.

**Anatomy:** `root` → `icon?`, `message`, `action?`, `dismiss`.

**Positions:** Top-right (staff), bottom-center (guest).

**Motion:** Staff: slide in from right over 200ms, auto-dismiss after 4 seconds, slide out over 140ms. Guest: fade in and out.

**Accessibility:** `role="status"` for success and info, `role="alert"` for warnings and errors. Announced once.

### 4.6.13 Tooltip

**Purpose:** Show additional information on hover or focus.

**World:** Both.

**Motion:** Fades in over 140ms. Never used for critical information.

### 4.6.14 Skeleton

**Purpose:** Placeholder during loading.

**World:** Guest only.

**Motion:** Shimmer over a continuous loop, using a linear gradient that moves left to right over 1.6 seconds.

**Rule:** The staff world never uses skeletons. It uses a single pulsing dot or a simple text label.

### 4.6.15 Avatar

**Purpose:** Represent a user or entity.

**World:** Staff only.

**Anatomy:** `root` → `initials` or `image`.

**Motion:** None.

### 4.6.16 Progress Indicator

**Purpose:** Show progress of a determinate or indeterminate action.

**World:** Both.

**Variants:** Bar (determinate), dots (indeterminate, guest only), spinner (indeterminate, staff only).

**Motion:** Bar fills with `--guest-ease-out`. Spinner rotates at 1 rotation per second, linear.

**Rule:** The guest world prefers a determinate bar over a spinner. A spinner is only used when duration is unknown.

### 4.6.17 Domain Components

Below are the components invented specifically for this product.

**4.6.17.1 MenuItemCard**

**Purpose:** Present a single menu item on the guest menu.

**World:** Guest only.

**Anatomy:** `root` → `media?`, `content` → `name`, `description?`, `price`; `action` (add button or "+").

**States:** Default, hover-lift, unavailable (grey, no hover, "Unavailable" label), loading.

**Motion:** Hover-lift over 200ms. Unavailable state has no motion.

**Accessibility:** Whole card is a button when it opens the modifier sheet; the "Add" action is a separate button when it adds directly. Both have distinct labels.

**4.6.17.2 ModifierSheet**

**Purpose:** Let the guest customize an item.

**World:** Guest only.

**Anatomy:** `overlay` → `panel` (bottom sheet) → `handle`, `media?`, `content` → `name`, `description?`, `modifier-group*`, `notes`; `footer` → `quantity-stepper`, `add-to-cart`.

**States:** Open, closing.

**Motion:** Slides up over 320ms. Each modifier group staggers in by 40ms.

**4.6.17.3 CartLine**

**Purpose:** Show one line in the cart.

**World:** Guest only.

**Anatomy:** `root` → `content` → `name`, `modifiers?`, `notes?`; `quantity-stepper`; `line-total`; `remove`.

**Motion:** Line enters with fade + slide-down over 200ms when added. Line exits with fade + slide-up over 200ms when removed.

**4.6.17.4 OrderStatusTimeline**

**Purpose:** Show an order's progress.

**World:** Guest (guest world's version), Staff (staff world's version is a compact horizontal indicator).

**Anatomy (guest):** `root` → `step*` → `dot`, `connector?`, `label`, `time?`.

**States:** Completed step (filled dot, brand color), current step (filled dot, brand color, pulsing once), future step (outline dot, muted), cancelled step (filled dot, cancelled color).

**Motion:** When a step becomes current, its dot pulses once over 600ms.

**4.6.17.5 RequestStatusTimeline**

**Purpose:** Same as OrderStatusTimeline, for service requests.

**World:** Guest.

**4.6.17.6 ServiceCard**

**Purpose:** Show one service on the hotel landing (Housekeeping, Concierge, etc.).

**World:** Guest only.

**Anatomy:** `root` → `icon`, `name`, `description?`, `availability?`.

**Motion:** Hover-lift over 200ms.

**4.6.17.7 RequestFormField**

**Purpose:** Domain-specific form field for service requests, supporting text, single-select chips, multi-select chips, time picker, and photo upload.

**World:** Guest only.

**4.6.17.8 OrderQueueRow**

**Purpose:** One row in the staff order queue.

**World:** Staff only.

**Anatomy:** `root` → `place` (table/room number), `id`, `items-summary`, `elapsed`, `status`, `action`.

**States:** Default, hover, focus, in-progress-flash (when status changes), pending, done.

**Motion:** Status-change flash: row background transitions to new status color over 320ms, then back to neutral over 320ms.

**Accessibility:** Row is a link to the order detail. Action button is a separate button. Elapsed time updates with `aria-live="off"` (announced only when queried, not on every update).

**4.6.17.9 RequestQueueRow**

**Purpose:** Same as OrderQueueRow, for service requests.

**World:** Staff only.

**4.6.17.10 KitchenTicket**

**Purpose:** One ticket on the kitchen display.

**World:** Kitchen only.

**Anatomy:** `root` → `header` → `order-id` (mono), `place` (large); `body` → `item*` → `name`, `modifiers?`, `notes?`; `footer` → `elapsed`, `action`.

**Size:** Fixed grid: 320px wide × auto height (typically 280–420px). Tickets arrange in a grid, left-to-right by time received, oldest first.

**States:** Placed (neutral), Preparing (active), Ready (ready), stale (>15 minutes, subtle warning border).

**Motion:** Status-change flash: background transitions over 320ms. No other motion.

**Accessibility:** Each ticket is a `<button>` for the primary action. Text is at least 18px. Place number is at least 40px. Order ID is mono. Contrast exceeds 7:1 in both light and dark modes.

**4.6.17.11 PlaceBadge**

**Purpose:** Show the table or room number on a ticket or in a queue.

**World:** Staff only.

**Anatomy:** `root` → `label`.

**Motion:** None.

**4.6.17.12 ElapsedTimer**

**Purpose:** Show the time since an item was placed.

**World:** Staff only.

**Anatomy:** `root` → `value` (mono).

**Motion:** None. The value updates every second, without animation, with `aria-live="off"`.

**4.6.17.13 TableMapCell**

**Purpose:** Show one table's status on the staff map.

**World:** Staff only.

**Anatomy:** `root` → `number`, `status-dot`.

**States:** Free, occupied, waiting, cleaning, out-of-service.

**Motion:** Status dot changes color instantly.

**4.6.17.14 QrCodeCard**

**Purpose:** Show a QR code in the admin panel.

**World:** Staff only.

**Anatomy:** `root` → `qr-image`, `place-label`, `actions` (print, revoke).

**Motion:** None.

**4.6.17.15 MetricTile**

**Purpose:** One metric on the admin dashboard.

**World:** Staff only.

**Anatomy:** `root` → `label`, `value`, `change?` (arrow + percentage).

**Motion:** Value changes do not animate. The tile does not flash.

**4.6.17.16 StaffHeaderBar**

**Purpose:** The persistent header on staff screens.

**World:** Staff only.

**Anatomy:** `root` → `venue-name`, `user-info`, `theme-toggle`, `sign-out`.

**Motion:** None.

**4.6.17.17 GuestHeaderBar**

**Purpose:** The persistent header on guest screens.

**World:** Guest only.

**Anatomy:** `root` → `home-link`, `cart-button` (with count badge).

**Motion:** Cart badge count change triggers a single pulse over 320ms.

**4.6.17.18 VoiceCallButton**

**Purpose:** The "Call a waiter" / "Call the front desk" action.

**World:** Guest only.

**Anatomy:** `root` → `icon`, `label`.

**Motion:** None.

## 4.7 Customer Landing Page — Full Spec

### 4.7.1 Section Order and Rationale

The landing page has eight sections. Their order follows the guest's mental sequence: **confirm place → establish identity → invite action → reduce friction → preview reward → establish process → reassure → close.**

**Section 1 — Hero.**
**Section 2 — Warm welcome.**
**Section 3 — Primary action.**
**Section 4 — Quiet secondary actions.**
**Section 5 — Menu preview.**
**Section 6 — How it works.**
**Section 7 — Venue information.**
**Section 8 — Footer.**

### 4.7.2 Section 1 — Hero

**Purpose:** Within 1.5 seconds, establish that the guest is in the right place and that the venue has taste.

**Content:**
- The venue's name, in `--guest-text-hero` (Fraunces), color `--guest-text-primary`.
- Below the name, a single line of context: "Table 12" or "Room 412" or "Welcome" — in `--guest-text-body-lg`, color `--guest-text-muted`.
- No photograph. The hero is type only, on `--guest-surface`.
- A large amount of vertical whitespace above and below the name (at least 96px on mobile, 160px on desktop).

**Layout:**
- Mobile: full-height (100vh minus the header bar), content centered vertically and horizontally.
- Tablet and desktop: same, but the name is centered in a wider content column.

**Motion:** On load, the name fades in and rises 12px over 600ms with `--guest-ease-entrance`. The context line fades in 200ms after the name, with a 6px rise.

**Copy voice:** The name is the venue's actual name. The context line is a plain statement of where the guest is. No exclamation marks, no "Welcome to" prefix, no emoji.

**Imagery:** None. Type is the image.

**Tokens:** `--guest-surface`, `--guest-text-primary`, `--guest-text-muted`, `--guest-motion-entrance`, `--guest-ease-entrance`.

### 4.7.3 Section 2 — Warm Welcome

**Purpose:** A human line that confirms the venue is present and unhurried.

**Content:** One paragraph, two lines maximum, in `--guest-text-body-lg`, color `--guest-text-secondary`. The copy is per-venue and reads like a host speaking.

**Layout:** Centered, max-width 480px on desktop. 32px above, 48px below.

**Motion:** Fades in on scroll when 20% in view, with a 4px rise over 480ms.

**Copy voice:** Conversational, brief, specific. Example: *"We are glad you are here. Order at your pace."* Or: *"Everything you need is on this page."*

### 4.7.4 Section 3 — Primary Action

**Purpose:** Get the guest into the menu in one tap.

**Content:** A single, full-width button, label "View Menu" or "Explore Services". `--radius-lg`, `--space-4` vertical padding, background `--guest-brand`, text `--guest-text-inverse`.

**Layout:** Full width of the content column, up to 400px wide on desktop.

**Motion:** Slight scale-up on hover (1.01) over 200ms. On tap, `scale(0.98)` for 120ms.

**Copy voice:** Direct, no exclamation mark. "View Menu." (Not "Browse our menu!" or "See the menu →".)

### 4.7.5 Section 4 — Quiet Secondary Actions

**Purpose:** Let the guest reach the venue without leaving the page.

**Content:** Two small buttons arranged horizontally, ghost variant: "Call a waiter" and "Request the bill". Or, in the room context: "Call the front desk" and "View requests".

**Layout:** Centered, `--space-8` below the primary action.

**Motion:** None.

### 4.7.6 Section 5 — Menu Preview

**Purpose:** Make the guest hungry and show them the menu is worth opening.

**Content:** Two to four featured items, arranged in a horizontal scroll on mobile (with snap) and a 2-column or 3-column grid on desktop. Each item uses the same card as the full menu, but without the action button — the whole card is a link to the full menu.

**Layout:** Full-bleed on mobile; centered within the content column on desktop.

**Motion:** Cards fade in one by one, 80ms stagger, over 480ms each.

**Copy voice:** None. The food speaks.

### 4.7.7 Section 6 — How It Works

**Purpose:** Remove any uncertainty about how the product works.

**Content:** Three steps, in a single horizontal row on desktop and vertically stacked on mobile. Each step has a small number (Fraunces, `--guest-text-h3`), a short label, and a one-line description.

**Example steps:**
1. Browse the menu.
2. Order from your phone.
3. We bring it to your table.

**Layout:** Centered. Max-width 640px.

**Motion:** Each step fades in with a 60ms stagger on scroll.

**Copy voice:** Plain, factual, no jargon. No "seamlessly". No "just".

### 4.7.8 Section 7 — Venue Information

**Purpose:** Give the guest the practical facts without cluttering the top of the page.

**Content:** The venue's address, opening hours, and phone number, in `--guest-text-body-sm`, color `--guest-text-muted`, centered.

**Motion:** Fades in on scroll.

### 4.7.9 Section 8 — Footer

**Purpose:** Close the page quietly.

**Content:** The venue's name, once more, in Fraunces at `--guest-text-h4`. Beneath it, small print: the venue's copyright line, and a "Powered by [product]" line in `--guest-text-caption`.

**Layout:** Centered, `--space-20` of top padding.

**Motion:** None.

### 4.7.10 Forbidden in the Hero and Above the Fold

- **No photograph.** The hero is type. A photograph above the fold turns the page into a slideshow; the venue's name competes with the image and loses.
- **No gradient background.** The surface is `--guest-surface`. A gradient is the visual language of a template.
- **No floating shapes or blobs.** Ever.
- **No hero CTA that says "Get Started".** This is not a product; it is a venue. The CTA names the action ("View Menu").
- **No countdown, no "limited time", no red badge.** The guest is not being sold to; they are being invited.
- **No animation that lasts more than 600ms.** The hero fires once, briefly, and settles.
- **No carousel.** The hero is one name, one line, one image (or none).
- **No video.** The hero is not a screen.
- **No "feature grid" of three columns of icons.** That belongs to software marketing pages, not a venue's guest experience.
- **No test for whether the guest is "a first-time visitor".** Every guest sees the same landing. The product does not discriminate.

### 4.7.11 Scroll Choreography

The page unfolds as follows when the guest scrolls:

- **0% to 15%:** The hero is on screen. Nothing has moved yet.
- **15% to 20%:** The hero has passed the top of the viewport. The warm welcome section enters with a fade + 4px rise over 480ms.
- **20% to 40%:** The welcome settles, the primary action is at eye level, the secondary actions sit quietly beneath it.
- **40% to 60%:** The menu preview enters with staggered card reveals.
- **60% to 75%:** The "how it works" section enters, its three steps staggering in.
- **75% to 90%:** The venue info section fades in.
- **90% to 100%:** The footer arrives with no motion.

**Rule:** No section animates more than once. Scrolling back up does not re-trigger the animation.

### 4.7.12 Token Usage Summary

The landing page uses only guest-world tokens. Specifically: `--guest-surface`, `--guest-surface-raised`, `--guest-text-primary`, `--guest-text-secondary`, `--guest-text-muted`, `--guest-brand`, `--guest-brand-contrast`, `--guest-border-subtle`, `--guest-motion-*`, `--guest-ease-*`, `--radius-*`, `--space-*`.

## 4.8 Customer Menu, Cart, and Order Tracking — Full Spec

### 4.8.1 Menu Screen

**Layout:**
- Header bar (sticky): the venue's name in small display text on the left, the cart icon with count badge on the right. Height 56px. Background `--guest-surface-raised`.
- Category tab strip (sticky beneath the header): horizontal scroll, no wrapping, each tab 40px height, active tab underlined with a 2px line in `--guest-brand`. Height 48px. Background `--guest-surface-raised`, with `--guest-border-subtle` bottom border.
- Item list: single column. Each item is a `MenuItemCard`. Vertical gap `--space-3`.
- Floating cart bar (only when cart is non-empty): sticky at bottom of viewport, 16px from bottom, height 56px, `--guest-brand` background, `--guest-text-inverse`. Shows "3 items · $42.50" and a "View cart" button.
- Right-hand side (desktop only): the cart is a persistent right column, 320px wide, sticky.

**Hierarchy:**
- Category tab strip is the primary navigational element.
- Item cards are the primary content.
- The floating cart bar is the persistent action.

**Empty state:** If the menu is genuinely empty (unusual), a simple illustration is not used. Instead, a single line in `--guest-text-body-lg`: "The menu is being updated. Please check back in a moment." with a "Retry" link.

**Loading state:** Skeleton cards matching the item card layout (image placeholder, two text lines, one price line). Never a spinner.

**Error state:** An inline alert at the top of the list: "We couldn't load the menu. Please try again." with a "Retry" button.

**Motion:**
- Menu entrance: item cards fade in with a 40ms stagger.
- Category tab change: content shifts instantly (no slide) but the tab indicator underlines the new active tab over 200ms.
- Scroll: nothing animates on scroll within the menu.

**Interaction model:**
- Tapping a category tab scrolls the list to that section.
- Tapping an item card opens the modifier sheet if the item has modifiers, or adds directly to the cart if it has none.
- The floating cart bar (or the header cart icon) opens the cart.

**Anchoring:** The guest's place in the menu is preserved when they return from the modifier sheet.

### 4.8.2 Modifier Sheet

Covered as a domain component in §4.6.17.2. Here is the interaction model:

- The sheet slides up from the bottom over 320ms.
- The item's photo (if any) fades in first; then the name, then the description, then the modifier groups (staggered 40ms apart), then the footer.
- The guest can swipe down to close; the swipe has to exceed 30% of the sheet's height to trigger.
- The "Add to cart" button is always visible at the bottom of the sheet; the sheet's body scrolls within itself.

### 4.8.3 Cart

**Layout:**
- Header bar (sticky): back arrow on the left (returns to menu), "Your order" title in the center.
- Line items list: each line is a `CartLine`, with the item name, modifiers summary, quantity stepper, line total, and a remove button.
- Order notes: a textarea below the line items, with a placeholder "Anything else we should know?".
- Summary block: subtotal, tax, total. Right-aligned.
- Primary action: "Place order" button, full-width, sticky at the bottom of the screen.

**Hierarchy:**
- Line items are the primary content.
- "Place order" is the primary action.
- The summary is supporting information; the guest knows how much they are about to pay without looking for it.

**Empty state:** A warm, brief message: "Your cart is empty." with a "Back to menu" link.

**Loading state:** The "Place order" button replaces its label with three pulsing dots, and the whole cart is inert.

**Error state:** An inline alert above the summary: "We couldn't reach the kitchen. Please try again." with a "Retry" button.

**Motion:**
- Lines slide in from the right with a fade when added (200ms).
- Quantity stepper buttons scale on press (120ms).
- Remove action: the line fades and collapses its height over 200ms.

### 4.8.4 Order Confirmation

**Layout:**
- Centered content column, max-width 480px.
- Large "check" mark (a simple, drawn check, not a success icon from a library) drawn in `--guest-brand`, animated once over 600ms as it is drawn.
- Headline: "Your order is on its way." in `--guest-text-h1` (Fraunces).
- Order number in mono: "Order #1048".
- A summary list of items, matching the cart lines but read-only.
- Primary action: "Track your order".
- Secondary action: "Add more items".

**Motion:**
- The check draws over 600ms.
- The headline fades in 200ms after the check.
- The rest of the content fades in 200ms after the headline.

### 4.8.5 Order Tracking

**Layout:**
- Header bar (sticky): back to menu on the left, order number in the center.
- OrderStatusTimeline at the top, occupying the full content column.
- The items list below the timeline, collapsible (default open on first visit, collapsed on return visits).
- Primary action at the bottom: "Add more items" (secondary button).
- A "Call a waiter" ghost button below.

**Hierarchy:**
- The timeline is the primary information; it is the first thing the guest sees.
- The items list is supporting.
- The action to add more is the primary action after the order is placed.

**Loading state:** A skeleton timeline, three steps, each as a placeholder.

**Error state:** An inline alert: "We couldn't load your order. Please try again."

**Motion:**
- The current step's dot pulses once when the step changes.
- A completed step's dot fills with `--guest-brand` over 320ms when it becomes complete.
- The whole timeline does not slide or scroll on its own; the guest scrolls it manually.

**Live update:** The screen polls every 5 seconds. When a status changes, the corresponding step animates as above, and the guest's device plays a soft, single ping only if the guest is looking at the page (visibility API). The ping is the same ping used in the guest menu when an item's availability changes.

### 4.8.6 Interaction Model Between Screens

The guest's path is:
`Landing → Menu → Modifier Sheet (overlays Menu) → Cart → Confirmation → Tracking`

- **Menu → Modifier Sheet → Menu:** The sheet overlays the menu. Closing returns the guest to their exact scroll position.
- **Menu → Cart:** The guest taps the floating cart bar or the header cart icon. The cart pushes onto the navigation stack; back returns to the menu at the same position.
- **Cart → Confirmation:** Placing an order replaces the cart with the confirmation. Back from the confirmation returns to the menu; the cart is empty.
- **Confirmation → Tracking:** Tapping "Track your order" pushes the tracking screen. Back returns to the menu (not to the confirmation).

**Rule:** Back navigation is always to a state the guest can act on. The guest never lands on a stale screen.

## 4.9 Room Service / Concierge Experience

### 4.9.1 What Stays the Same

The guest is still anonymous. The product still uses a warm surface. The typography, spacing, radius, and motion tokens are the same. The header bar is the same. The design does not feel like a different product.

### 4.9.2 What Changes

**The hero.** Instead of "Table 12", the context line says "Room 412". The venue's name is still the display element, but the guest's room number is prominent.

**The primary action.** Instead of "View Menu", the primary action is a grid of service cards. The guest is not going to a menu; they are choosing what they want to happen.

**The service catalog.** A 2-column grid on mobile (3-column on desktop) of `ServiceCard` components, one per enabled service. Each card: a single line-art icon in `--guest-brand`, the service name, and a one-line description.

**The service detail screens.** Each service opens a dedicated screen, not a sheet. The screen is a form: title, description, fields, submit button.

**The "Requests" tab.** A persistent bottom tab bar with three tabs: Home, Services, Requests. The Requests tab shows all active requests, each with a compact `RequestStatusTimeline`.

**The room context is shown everywhere.** Every screen in the room flow shows "Room 412" in the header bar so the guest is always anchored.

### 4.9.3 The Room Service Food Flow

Selecting "Room Service" from the catalog takes the guest into the exact same menu screen, cart, and tracking experience as the table flow. The only differences:
- The header bar shows "Room 412" instead of "Table 12".
- The tracking screen's delivery step says "On the way to your room" instead of "On the way to your table".
- The address is the room, not the table.

### 4.9.4 The Non-Food Service Forms

Each service form follows the same template:

- Header bar with the service name and a back arrow.
- A short description (one or two lines) in `--guest-text-body`.
- The form fields, using `RequestFormField`. Field types: text, single-select chips, multi-select chips, time picker, photo upload, textarea.
- A submit button at the bottom.

**Motion:** Fields stagger in from the top with a 40ms stagger when the screen loads.

### 4.9.5 The Requests Screen

- A vertical list of all active requests.
- Each request is a card with: the service name, the current status, the last status change time, and a compact horizontal timeline.
- Tapping a card opens a detail screen with the full `RequestStatusTimeline`, the request's details, and (while in the Submitted state) an "Edit" and a "Cancel" button.

### 4.9.6 What the Room Flow Does Not Include

- No menu of the hotel's restaurant. A hotel that also operates a restaurant (per PRODUCT.md §4.4) enables the table module alongside the room module. The guest in a room uses the room flow and sees the room service catalog; the guest at a restaurant table uses the table flow. The two flows share a kitchen queue but not a guest menu. The room flow never surfaces the table flow's menu.
- No multi-language picker.
- No identity collection (no name, no email, no phone).
- No cross-referencing with the guest's booking.

## 4.10 Staff Admin Panel — Full Spec

### 4.10.1 The Admin's Day

An admin's day on this screen looks like:

- **Morning:** Open the dashboard. Look at yesterday's numbers. Check the live metrics. If a menu item is not going to be available today, mark it unavailable.
- **Before service:** Look at the tables and rooms. Verify the QR codes are in place. If a QR has been damaged, generate a new one and print it.
- **During service:** Watch the live metrics. Occasionally check the active orders list. The kitchen and service staff are the primary operators; the admin steps in only if something goes wrong.
- **After service:** Open the completed orders list. Filter to today. Export a CSV if needed. Review any cancellations.
- **Weekly:** Open the reports tab. Compare this week to last week. Export a CSV.
- **When needed:** Manage staff. Add a new staff member. Reset a password. Deactivate a staff member who has left.

### 4.10.2 The Single Most Common Action

**Marking a menu item unavailable.** This is the action the admin takes most frequently during the day — when a dish sells out, when the kitchen tells them they are out of an ingredient, when a special is over. The design must make this one click.

**Design:** The admin dashboard shows a compact list of the current menu items with their states. Each item has a single toggle button. Clicking it flips the state between available and unavailable. There is no confirmation, no dialog. The item's row updates in place. If the admin needs to hide an item entirely, they open the item detail and choose Hidden there.

### 4.10.3 Layout

- **Left sidebar:** 240px wide, `--staff-surface-raised`. Contains: venue name at top, navigation items in a single column, sign-out at the bottom.
- **Top header bar:** 56px, `--staff-surface-raised`. Contains: current section title on the left, current user's name on the right, theme toggle.
- **Content area:** `--staff-surface`, with `--space-6` padding all around.
- **Right panel (optional):** slides in when a row is selected for detail.

### 4.10.4 Navigation

- Dashboard
- Active Orders
- Completed Orders
- Menu
- Tables (when the table module is on)
- Rooms (when the room module is on)
- QR Codes
- Staff
- Reports
- Settings

### 4.10.5 The Dashboard

- Top row: five `MetricTile`s — Orders Waiting, In Kitchen, Ready, Revenue Today, Orders Today.
- Below: two columns. Left column: recent active orders (5 rows from `OrderQueueRow`). Right column: recent service requests (5 rows from `RequestQueueRow`).
- Below that: a compact "Menu item status" section with the toggle-per-item design described in §4.10.2.

### 4.10.6 Active Orders

- Full-width table of active orders, using `OrderQueueRow`.
- Columns: Order ID, Place, Items summary, Status, Elapsed, Action.
- Sortable by any column. Default: oldest first.
- Clicking a row opens a detail panel on the right with the full order: items, states, history, notes.

### 4.10.7 Completed Orders

- Same layout as Active Orders.
- Date range filter at the top: Today, Yesterday, This Week, This Month, Custom.
- "Export CSV" button top-right.
- Clicking a row opens the order detail (read-only).

### 4.10.8 Menu Management

- Full-width table of menu items, grouped by category.
- Columns: Name, Category, Price, State, Actions.
- Actions per row: Edit, Toggle availability, Hide.
- "Add item" button top-right.
- Editing an item opens a right-hand form panel.

### 4.10.9 Tables / Rooms Management

- A grid of cards, one per table or room.
- Each card: the number, the status, the QR code state, and two actions: "Print QR" and "Revoke QR".
- "Add table" / "Add room" button top-right.
- "Print all QR codes" button top-right.

### 4.10.10 QR Codes

- A table of all QR tokens, with their place, their state, and their created date.
- "Generate new QR" button top-right.
- Row actions: Print, Revoke.

### 4.10.11 Staff Management

- A table of staff members with their name, username, roles, and last login.
- Row actions: Edit, Reset password, Deactivate.
- "Add staff" button top-right.

### 4.10.12 Reports

- A date range picker at the top: Today, This Week, This Month, This Year, Custom (up to 6 months).
- A line chart of daily revenue in `--staff-accent`.
- A bar chart of orders per day.
- A table of top-selling items.
- "Export CSV" button top-right.

### 4.10.13 Settings

- Venue name, address, contact (read-only, shown for reference).
- Tax rate (read-only in the first version).
- Currency (read-only).
- Module toggles: table, room, counter, kitchen.
- Service toggles: room service food, housekeeping, maintenance, concierge, laundry, spa, late checkout, wake-up call, do not disturb.
- No payment bridge configuration. The payment provider is set by the developer in code (per D-9.6 and D-7.2), not in the admin panel.

### 4.10.14 Motion

The admin panel has **no decorative motion**. No fade-ins on load. No slide-ins. No staggered reveals. The only motion is:

- The status-change flash on rows that change state (320ms).
- The right-side detail panel slides in over 200ms when a row is selected.
- The theme toggle transitions the surfaces over 140ms.

### 4.10.15 Tokens

The admin uses only staff-world tokens. No guest tokens. No Fraunces. No warm surfaces. Ever.

## 4.11 Kitchen Display — Full Spec

### 4.11.1 The Environment

The kitchen display is on a screen in a hot, loud, chaotic environment. It must be legible at 2 meters. It must require zero reading comprehension under pressure. It must never distract.

### 4.11.2 The Layout

- Full-screen. No sidebar, no top bar, no navigation.
- The only persistent UI is a small status strip at the very top (48px), showing: the venue's name in small text, the current time, and a connection indicator (a small dot: green = connected, amber = reconnecting, red = disconnected).
- Below the strip, the ticket grid.
- The grid is 3 columns at 1920px, 2 columns at 1366px, 1 column below 1024px.
- Ticket width: fixed at 320px (or, at 1920px, a flexible width of `(viewport - padding) / 3`).
- Gap between tickets: `--space-4` (16px).
- Tickets are ordered left-to-right, top-to-bottom, oldest first.

### 4.11.3 The Ticket Card

Each ticket is a `KitchenTicket`:

- **Height:** Auto, typically 280–420px.
- **Background:** `--staff-surface-raised` (light) or `--staff-surface-raised` dark (dark mode).
- **Border:** 1px `--staff-border-subtle`. When the ticket is stale (>15 minutes), the border becomes 2px `--color-status-active`.
- **Radius:** `--radius-lg`.
- **Padding:** `--space-5` (20px).

**Anatomy:**

1. **Header row:** order ID (mono, 20px, `--staff-text-mono-lg`) on the left; elapsed timer (mono, 14px, muted) on the right.
2. **Place row:** the table or room number, in `--staff-text-place` (40px, sans, weight 600). This is the largest element on the card. Directly below, the place type in small caps: "TABLE" or "ROOM".
3. **Divider:** a 1px line in `--staff-border-subtle`.
4. **Items list:** one line per item. Item name in `--staff-text-body-lg` (18px). Modifiers below, indented, in `--staff-text-body-sm`, color `--staff-text-muted`. Notes highlighted with a left border in `--color-status-active` and text in `--staff-text-primary`.
5. **Footer:** a single full-width action button. Label depends on the ticket's state:
   - Placed: "Start"
   - Preparing: "Ready"
   - Ready: "Done"

**States:**
- **Placed:** background `--staff-surface-raised`, action button primary.
- **Preparing:** background `--color-status-active-bg`, action button primary.
- **Ready:** background `--color-status-ready-bg`, action button primary.
- **Stale (>15 minutes):** a thin amber strip on the left edge of the card, plus a small "15+ min" text next to the elapsed timer.

**Motion:**
- **Arrival:** the card fades in over 320ms. No slide, no scale. The audible ping plays once.
- **Status change:** the background transitions over 320ms. No other motion.
- **Action button press:** background darkens instantly (80ms), no scale.

### 4.11.4 The Status Model

The kitchen display shows tickets in these states only: Placed (rare; most venues auto-approve), Preparing, Ready. Delivered tickets disappear immediately. Cancelled tickets do not appear on the kitchen display at all.

### 4.11.5 The Refresh Behavior

- Polling every 5 seconds.
- Between polls, the elapsed timer updates every second locally.
- When the poll returns new data, tickets that have not changed do not re-render.
- When a ticket's state changes on the server, the ticket's background transitions as described.

### 4.11.6 Light / Dark Behavior

- Default: dark.
- A single toggle in the top-right of the status strip.
- The toggle is a small circle icon (a sun or a moon), 32×32px, color `--staff-text-muted`.
- The preference is stored in the browser's local storage and remembered per device.
- In dark mode, the surface is `--color-neutral-900` and text is `--color-neutral-50`. In light mode, the surface is `--color-neutral-50` and text is `--color-neutral-900`.

### 4.11.7 The Audible Ping

- A single, soft tone (a single sine wave at 880 Hz, 200ms, with a 40ms attack and a 60ms decay).
- Plays when a new ticket arrives.
- Volume is fixed. No mute.
- Implemented via the Web Audio API to avoid loading a sound file and to allow polyphonic overlapping pings.

### 4.11.8 Accessibility

- Every ticket is keyboard-reachable.
- The primary action button is the first focusable element on the ticket.
- The ticket's content is read by screen readers in the correct order: order ID, place, items, action.
- Contrast exceeds 7:1 in both light and dark modes.
- Text sizes are large enough that legibility is not dependent on proximity.

## 4.12 Signature Moments

Six specific interactions that make the product feel authored, not generated. Each is named, described, and traced to hospitality.

### 4.12.1 The Draw

**What it is:** On the guest landing page, the venue's name is drawn in slowly over 600ms. Not typed, not faded — drawn as if by a calligrapher's hand. The stroke reveals left to right, at the pace of someone writing the name by hand.

**World:** Guest.

**Why:** The venue's name is the first thing the guest reads. Drawing it, rather than fading it in, tells the guest that this product was made by someone who cared about the venue's name. A fade says "this text exists". A draw says "someone wrote this for you". It is the digital equivalent of a host personally writing the guest's name on a card.

### 4.12.2 The Lift

**What it is:** When a guest hovers over a menu item card on desktop, the card lifts 2px and its shadow expands slightly over 200ms. On release, it settles back. On touch devices, the card does not lift; instead, it flashes its background to `--guest-surface-sunken` for 120ms on touch.

**World:** Guest.

**Why:** A menu is a physical object. Picking up a menu is a small, tactile gesture. The lift is the digital equivalent: it says "this is a thing you can hold, and I am responding to you". A menu item card that does not lift is a menu item card that feels like a spreadsheet row.

### 4.12.3 The Confirm

**What it is:** When a guest taps "Add to cart", the modifier sheet closes with a slide-down, and as it closes, the cart icon in the header pulses once. The pulse is a 1.1× scale that returns to 1× over 320ms with a spring easing. The item count increments at the moment of the pulse.

**World:** Guest.

**Why:** Adding an item to a cart is a moment of satisfaction. A cart icon that simply increments its number says "something happened". A cart icon that pulses once says "the thing you just did, I felt it". This is the same satisfaction as hearing a plate set down on a table.

### 4.12.4 The Flash

**What it is:** On staff and kitchen screens, when a ticket's or row's status changes on the server, the row's background transitions to the new status color over 320ms, holds for 600ms, then fades back to its neutral background over 320ms.

**World:** Staff and Kitchen.

**Why:** Staff look at their screens out of the corner of their eye. A silent, instantaneous change will be missed. A change that briefly announces itself — without requiring the staff member to look directly at it — is a change the staff member will notice without being distracted. It is the same as a server catching a plate being set on the pass out of the corner of their eye.

### 4.12.5 The Place

**What it is:** On the kitchen ticket, the table or room number is rendered at 40px, weight 600, directly beneath the order ID. It is the largest element on the ticket. It is the first thing a staff member sees from 2 meters.

**World:** Kitchen.

**Why:** The kitchen staff do not need to know what the order is; they need to know where it is going. The table or room number is the anchor. Everything else on the ticket is supporting information. Making this the largest element on the card is not a decoration; it is a statement of what matters.

### 4.12.6 The Quiet Header

**What it is:** On every guest screen after the landing, the header bar's background is `--guest-surface-raised` (the paper white), and the venue's name in the header is rendered at `--guest-text-h4` (18px) in Fraunces, not in sans. The cart icon and count badge sit on the right in the same size.

**World:** Guest.

**Why:** The venue's name is the guest's anchor. The guest should never have to guess which venue they are looking at. Rendering the name in Fraunces, at a small size, in the header, on every screen, is the digital equivalent of a menu having the restaurant's name on every page. It is a small detail, and it is the difference between a guest feeling "I am at a specific place" and "I am using an app".

## 4.13 Voice and Copy

### 4.13.1 Guest World Voice

**The guest world speaks like a calm, warm host who knows the venue and does not need to shout.** It is not chatty, not promotional, not apologetic. It uses complete sentences and correct punctuation. It never uses exclamation marks. It never uses emoji. It never says "just" or "simply". It respects the guest's time and intelligence.

**Rules:**
- No exclamation marks.
- No emoji.
- No "!" or "!!" even in success states.
- No "Oops!" or "Uh oh" or "Whoops".
- No "Please note that…".
- No "For your convenience".
- No jargon (no "sync", no "load", no "submit").
- No "successfully".
- No marketing verbs (no "elevate", no "unlock", no "discover").
- Statements over questions. "Order received." not "Did you mean to order?".
- Sentences of eight words or fewer where possible.

### 4.13.2 Guest World Microcopy — 15 Examples

| Context | Copy |
|---------|------|
| Primary CTA on landing | View Menu |
| Secondary CTA on landing | Call a Waiter |
| Cart icon tooltip | Your Order |
| Add-to-cart button | Add to Cart |
| Quantity stepper label | Quantity |
| Notes field placeholder | Anything else we should know? |
| Cart empty state | Your cart is empty. |
| Cart empty state CTA | Back to Menu |
| Place-order button | Place Order |
| Order confirmation headline | Your order is on its way. |
| Order tracking heading | Order #1048 |
| Order tracking status — placed | We have your order. |
| Order tracking status — preparing | The kitchen is on it. |
| Order tracking status — ready | Ready for your table. |
| Order tracking status — delivered | Enjoy. |
| Waiter-called confirmation | A waiter is on the way. |
| Bill-requested confirmation | The bill is on its way. |
| Room service form submit | Send Request |
| Service request confirmation | We have your request. |

### 4.13.3 Staff World Voice

**The staff world does not speak.** It labels. Every string is a fact or an action. No sentence longer than four words. No greeting. No farewell. No apology. No celebration.

**Rules:**
- Labels, not sentences.
- No greeting, no goodbye.
- No "Welcome back".
- No "Good morning".
- No "You're all caught up".
- No apology ("Sorry, something went wrong"). Instead, a fact: "Could not save." with a "Retry" action.
- No emoji, no exclamation marks.
- No marketing vocabulary.
- States are past-tense verbs: "Placed", "Preparing", "Ready", "Delivered", "Cancelled".
- Actions are imperative verbs: "Start", "Ready", "Deliver", "Complete", "Cancel".

### 4.13.4 Staff World Microcopy — 15 Examples

| Context | Copy |
|---------|------|
| Login button | Sign In |
| Sign-out link | Sign Out |
| Dashboard tile label — waiting | Waiting |
| Dashboard tile label — kitchen | In Kitchen |
| Dashboard tile label — ready | Ready |
| Dashboard tile label — revenue | Revenue Today |
| Order row action — placed | Approve |
| Order row action — approved | Start |
| Order row action — preparing | Ready |
| Order row action — ready | Deliver |
| Order row action — delivered | Complete |
| Kitchen ticket action — placed | Start |
| Kitchen ticket action — preparing | Ready |
| Empty state — no active orders | No active orders. |
| Error state — save failed | Could not save. |
| Error state — connection lost | Reconnecting… |
| Error state — no internet | Offline. |

### 4.13.5 Copy Rules for Both Worlds

1. Every button label is a verb. No noun-only buttons ("Submission").
2. Every empty state names the state and offers one action.
3. Every error names what went wrong, in the user's terms, and offers one action.
4. Every confirmation names what happened, in the past tense.
5. No string is longer than a hundred characters. Most are under fifty.
6. No placeholder text is ever shown as real text. No "Lorem ipsum", no "Sample", no "Test".
7. Sentence case for all UI text. Title case only for proper nouns.

## 4.14 Accessibility

### 4.14.1 Standard

WCAG 2.1 AA minimum. The guest world and the staff world both comply. The kitchen display exceeds AA where possible (AAA for contrast).

### 4.14.2 Focus Ring

- 2px solid ring in `--guest-brand` (guest world) or `--staff-brand` (staff world).
- 2px offset, so the ring sits outside the element.
- Border-radius matches the element's radius.
- Visible only on `:focus-visible` (keyboard focus), never on mouse click.
- Never hidden with `outline: none` without an equivalent replacement.

### 4.14.3 Touch Targets

- Guest world: minimum 44×44 CSS pixels.
- Staff world: minimum 48×48 CSS pixels.
- Kitchen display: minimum 64×64 CSS pixels for the primary action.
- Interactive elements that are visually smaller than the minimum have padding to reach it.

### 4.14.4 Contrast

- Body text: 4.5:1 minimum against its surface.
- Large text (≥18px or ≥14px bold): 3:1 minimum.
- UI components (borders, icons, focus rings): 3:1 minimum.
- The kitchen display exceeds 7:1 in both light and dark modes.
- All contrast pairs are verified with a manual check against the WCAG formula.

### 4.14.5 Reduced Motion

- `prefers-reduced-motion: reduce` is respected globally.
- All durations become `0ms`.
- All transform-based animations are removed; elements appear at their final state.
- No exceptions, in either world.

### 4.14.6 Keyboard Navigation

- Every interactive element is reachable by Tab.
- Every interactive element is actionable by Enter or Space.
- Focus order matches visual order.
- No focus traps except inside dialogs, which trap and release correctly.
- Esc closes any overlay.
- Skip-to-content link on every guest page and every staff page.

### 4.14.7 Screen Reader Labeling

- Every icon-only button has an `aria-label`.
- Every form field has an associated label.
- Every form field with an error has `aria-invalid="true"` and `aria-describedby` pointing to the error text.
- Order status changes in the guest world announce via a polite live region.
- Order status changes in the staff world do not announce (they are not the staff's focus at the moment of change).
- Toasts in the staff world announce via a polite live region.
- Kitchen ticket arrivals do not announce via a live region (they play the audible ping instead, and staff do not use screen readers at the kitchen display; the display is for sighted staff).

### 4.14.8 Language

- `<html lang="en">` on every page.
- Language is not switched per route; the product is English-only per D-11.1.

### 4.14.9 Images

- Every `<img>` has an `alt` attribute.
- Decorative images have `alt=""`.
- Icons from a library that are decorative have `aria-hidden="true"`.

## 4.15 Design Tokens → Code

### 4.15.1 Global Token Block (`:root`)

```css
:root {
  /* Primitives — Olive */
  --color-olive-50:  #f4f5f0;
  --color-olive-100: #e4e7db;
  --color-olive-200: #c9cfb9;
  --color-olive-300: #aeb796;
  --color-olive-400: #929f74;
  --color-olive-500: #626542;
  --color-olive-600: #4f5235;
  --color-olive-700: #3c3f28;
  --color-olive-800: #2a2c1c;
  --color-olive-900: #181a10;

  /* Primitives — Sand */
  --color-sand-50:  #faf7f2;
  --color-sand-100: #f2ece1;
  --color-sand-200: #e6d9c4;
  --color-sand-300: #d9c6a7;
  --color-sand-400: #ccb38a;
  --color-sand-500: #ab9170;
  --color-sand-600: #8b7458;
  --color-sand-700: #6b5942;
  --color-sand-800: #4b3e2d;
  --color-sand-900: #2b2319;

  /* Primitives — Peach */
  --color-peach-50:  #fdf7f3;
  --color-peach-100: #fbece1;
  --color-peach-200: #f7d9c5;
  --color-peach-300: #f3c5a6;
  --color-peach-400: #eebdaf;
  --color-peach-500: #ddb69e;
  --color-peach-600: #c99880;
  --color-peach-700: #a87a62;
  --color-peach-800: #7c5947;
  --color-peach-900: #523a2e;

  /* Primitives — Sage */
  --color-sage-50:  #f4f7f6;
  --color-sage-100: #e6ecea;
  --color-sage-200: #ccd7d4;
  --color-sage-300: #b3c2be;
  --color-sage-400: #99aca8;
  --color-sage-500: #849894;
  --color-sage-600: #6b7d79;
  --color-sage-700: #525f5c;
  --color-sage-800: #3a4240;
  --color-sage-900: #232826;

  /* Primitives — Forest */
  --color-forest-50:  #eef2ef;
  --color-forest-100: #d6dfd9;
  --color-forest-200: #aebfb4;
  --color-forest-300: #869f8f;
  --color-forest-400: #5d7e6a;
  --color-forest-500: #45604f;
  --color-forest-600: #3d5748;
  --color-forest-700: #344b3c;
  --color-forest-800: #243329;
  --color-forest-900: #141c17;

  /* Primitives — Neutral */
  --color-neutral-0:   #fbfbfa;
  --color-neutral-50:  #f5f5f4;
  --color-neutral-100: #ebebe9;
  --color-neutral-200: #dededb;
  --color-neutral-300: #c4c4c0;
  --color-neutral-400: #9a9a96;
  --color-neutral-500: #71716d;
  --color-neutral-600: #4a4a47;
  --color-neutral-700: #333330;
  --color-neutral-800: #1f1f1d;
  --color-neutral-900: #141413;
  --color-neutral-950: #0b0b0a;

  /* Status */
  --color-status-waiting:        var(--color-neutral-500);
  --color-status-waiting-bg:     var(--color-neutral-100);
  --color-status-active:         #c2810f;
  --color-status-active-bg:      #fbf0d7;
  --color-status-ready:          #3d7a4a;
  --color-status-ready-bg:       #ddeede;
  --color-status-done:           var(--color-sage-600);
  --color-status-done-bg:        var(--color-sage-100);
  --color-status-cancelled:      #8a3a34;
  --color-status-cancelled-bg:   #f3dbd8;

  /* Spacing */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-32: 128px;
  --space-40: 160px;

  /* Radius */
  --radius-xs:   2px;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-xl:   20px;
  --radius-2xl:  28px;
  --radius-full: 9999px;

  /* Elevation */
  --shadow-xs:    0 1px 2px 0 rgb(20 20 19 / 0.04);
  --shadow-sm:    0 2px 4px -1px rgb(20 20 19 / 0.05), 0 1px 2px -1px rgb(20 20 19 / 0.04);
  --shadow-md:    0 4px 8px -2px rgb(20 20 19 / 0.06), 0 2px 4px -2px rgb(20 20 19 / 0.04);
  --shadow-lg:    0 12px 24px -8px rgb(20 20 19 / 0.08), 0 4px 8px -4px rgb(20 20 19 / 0.05);
  --shadow-xl:    0 24px 48px -16px rgb(20 20 19 / 0.10), 0 8px 16px -8px rgb(20 20 19 / 0.06);

  /* Fonts */
  --font-display: var(--font-fraunces), "Iowan Old Style", Georgia, serif;
  --font-sans:    var(--font-geist-sans), system-ui, -apple-system, sans-serif;
  --font-mono:    var(--font-geist-mono), ui-monospace, "SF Mono", monospace;

  /* Motion — Guest */
  --guest-motion-instant:  120ms;
  --guest-motion-fast:     200ms;
  --guest-motion-base:     320ms;
  --guest-motion-slow:     480ms;
  --guest-motion-entrance: 600ms;

  --guest-ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
  --guest-ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);
  --guest-ease-entrance: cubic-bezier(0.22, 1, 0.36, 1);
  --guest-ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Motion — Staff */
  --staff-motion-instant: 80ms;
  --staff-motion-fast:    140ms;
  --staff-motion-base:    200ms;
  --staff-motion-flash:   320ms;

  --staff-ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --staff-ease-in:  cubic-bezier(0.4, 0, 1, 1);

  /* Breakpoints */
  --bp-sm:  640px;
  --bp-md:  768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
  --bp-2xl: 1536px;
  --bp-3xl: 1920px;
}
```

### 4.15.2 Guest World Token Block

```css
[data-world="guest"] {
  --guest-surface:          var(--color-sand-50);
  --guest-surface-raised:   var(--color-neutral-0);
  --guest-surface-sunken:   var(--color-sand-100);

  --guest-text-primary:     var(--color-forest-700);
  --guest-text-secondary:   var(--color-olive-600);
  --guest-text-muted:       var(--color-sand-600);
  --guest-text-inverse:     var(--color-neutral-0);

  --guest-border-subtle:    var(--color-sand-200);
  --guest-border-strong:    var(--color-sand-400);

  --guest-brand:            var(--color-olive-500);
  --guest-brand-contrast:   var(--color-neutral-0);
  --guest-brand-muted:      var(--color-olive-100);

  --guest-accent:           var(--color-peach-500);
}
```

### 4.15.3 Staff World Token Block

```css
[data-world="staff"] {
  --staff-surface:          var(--color-neutral-50);
  --staff-surface-raised:   var(--color-neutral-0);
  --staff-surface-sunken:   var(--color-neutral-100);

  --staff-text-primary:     var(--color-neutral-900);
  --staff-text-secondary:   var(--color-neutral-600);
  --staff-text-muted:       var(--color-neutral-400);
  --staff-text-inverse:     var(--color-neutral-0);

  --staff-border-subtle:    var(--color-neutral-200);
  --staff-border-strong:    var(--color-neutral-300);

  --staff-brand:            var(--color-forest-700);
  --staff-brand-contrast:   var(--color-neutral-0);
  --staff-accent:           var(--color-sage-500);
}
```

### 4.15.4 Staff Dark Mode Override

```css
[data-world="staff"][data-theme="dark"] {
  --staff-surface:          var(--color-neutral-900);
  --staff-surface-raised:   var(--color-neutral-800);
  --staff-surface-sunken:   var(--color-neutral-950);

  --staff-text-primary:     var(--color-neutral-50);
  --staff-text-secondary:   var(--color-neutral-300);
  --staff-text-muted:       var(--color-neutral-500);
  --staff-text-inverse:     var(--color-neutral-900);

  --staff-border-subtle:    var(--color-neutral-700);
  --staff-border-strong:    var(--color-neutral-600);

  --staff-brand:            var(--color-sage-400);
  --staff-accent:           var(--color-sage-300);
}
```

### 4.15.5 Per-Venue Brand Override

The venue's brand color is injected on the guest root element by the server:

```html
<div data-world="guest" style="--guest-brand: #626542;">
```

The value comes from the venue's configuration. The developer ensures it passes the contrast check (§4.2.7).

### 4.15.6 Tailwind Config Extension

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Guest world
        'guest-surface': 'var(--guest-surface)',
        'guest-surface-raised': 'var(--guest-surface-raised)',
        'guest-surface-sunken': 'var(--guest-surface-sunken)',
        'guest-text': {
          primary: 'var(--guest-text-primary)',
          secondary: 'var(--guest-text-secondary)',
          muted: 'var(--guest-text-muted)',
          inverse: 'var(--guest-text-inverse)',
        },
        'guest-border': {
          subtle: 'var(--guest-border-subtle)',
          strong: 'var(--guest-border-strong)',
        },
        'guest-brand': 'var(--guest-brand)',
        'guest-brand-contrast': 'var(--guest-brand-contrast)',
        'guest-brand-muted': 'var(--guest-brand-muted)',
        'guest-accent': 'var(--guest-accent)',

        // Staff world
        'staff-surface': 'var(--staff-surface)',
        'staff-surface-raised': 'var(--staff-surface-raised)',
        'staff-surface-sunken': 'var(--staff-surface-sunken)',
        'staff-text': {
          primary: 'var(--staff-text-primary)',
          secondary: 'var(--staff-text-secondary)',
          muted: 'var(--staff-text-muted)',
          inverse: 'var(--staff-text-inverse)',
        },
        'staff-border': {
          subtle: 'var(--staff-border-subtle)',
          strong: 'var(--staff-border-strong)',
        },
        'staff-brand': 'var(--staff-brand)',
        'staff-brand-contrast': 'var(--staff-brand-contrast)',
        'staff-accent': 'var(--staff-accent)',

        // Status
        'status-waiting': 'var(--color-status-waiting)',
        'status-waiting-bg': 'var(--color-status-waiting-bg)',
        'status-active': 'var(--color-status-active)',
        'status-active-bg': 'var(--color-status-active-bg)',
        'status-ready': 'var(--color-status-ready)',
        'status-ready-bg': 'var(--color-status-ready-bg)',
        'status-done': 'var(--color-status-done)',
        'status-done-bg': 'var(--color-status-done-bg)',
        'status-cancelled': 'var(--color-status-cancelled)',
        'status-cancelled-bg': 'var(--color-status-cancelled-bg)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        0: 'var(--space-0)',
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        32: 'var(--space-32)',
        40: 'var(--space-40)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      transitionDuration: {
        'guest-instant': 'var(--guest-motion-instant)',
        'guest-fast': 'var(--guest-motion-fast)',
        'guest-base': 'var(--guest-motion-base)',
        'guest-slow': 'var(--guest-motion-slow)',
        'guest-entrance': 'var(--guest-motion-entrance)',
        'staff-instant': 'var(--staff-motion-instant)',
        'staff-fast': 'var(--staff-motion-fast)',
        'staff-base': 'var(--staff-motion-base)',
        'staff-flash': 'var(--staff-motion-flash)',
      },
      transitionTimingFunction: {
        'guest-out': 'var(--guest-ease-out)',
        'guest-in-out': 'var(--guest-ease-in-out)',
        'guest-entrance': 'var(--guest-ease-entrance)',
        'guest-spring': 'var(--guest-ease-spring)',
        'staff-out': 'var(--staff-ease-out)',
        'staff-in': 'var(--staff-ease-in)',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 4.15.7 Enforcement Rules

1. **No raw hex values in component files.** Every color is a token from the palette above.
2. **No arbitrary pixel values.** Every size uses the spacing scale, radius scale, or a font-size token.
3. **No dynamic class name construction.** `text-${color}` is forbidden. Classes are always written in full, or composed via `cn()`.
4. **No inline styles** except the per-venue brand injection on the guest root.
5. **No `font-weight` values outside the font family's variable range.**
6. **No `!important`.** If the cascade needs to be overridden, the selector is wrong.
7. **No dark mode classes on guest components.** The guest world is light only.

## 4.16 Implementation Order

The frontend build is sequenced so that every task depends only on completed tasks.

### Task F-01 — Tokens and Fonts
**Files:** `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`
**Verification:** Open a scratch page; verify every token resolves; verify the three fonts load.

### Task F-02 — Base Primitives (Non-Interactive)
**Files:** `src/components/ui/` — Card, Badge, Divider, Separator, Skeleton, Avatar.
**Verification:** Render each on a scratch page in both worlds; verify states and tokens.

### Task F-03 — Base Primitives (Interactive)
**Files:** `src/components/ui/` — Button, Input, Textarea, Select, Checkbox, Radio.
**Verification:** Render each on a scratch page; verify every state; verify focus rings; verify keyboard behavior.

### Task F-04 — Overlays
**Files:** `src/components/ui/` — Dialog, Sheet, Drawer, DropdownMenu, Tooltip, Toast.
**Verification:** Open and close each on a scratch page; verify focus traps, escape key behavior, and screen reader announcements.

### Task F-05 — Navigation Primitives
**Files:** `src/components/ui/` — Tabs, Table.
**Verification:** Render on a scratch page; verify keyboard navigation; verify dense table rendering.

### Task F-06 — Domain Components — Guest
**Files:** `src/components/hospitality/` — MenuItemCard, ModifierSheet, CartLine, OrderStatusTimeline, ServiceCard, RequestStatusTimeline, RequestFormField, GuestHeaderBar, VoiceCallButton.
**Verification:** Render on a scratch page in the guest world; verify all states; verify motion.

### Task F-07 — Domain Components — Staff
**Files:** `src/components/staff/` — OrderQueueRow, RequestQueueRow, PlaceBadge, ElapsedTimer, TableMapCell, QrCodeCard, MetricTile, StaffHeaderBar.
**Verification:** Render on a scratch page in the staff world; verify all states.

### Task F-08 — Domain Components — Kitchen
**Files:** `src/components/staff/kitchen/` — KitchenTicket.
**Verification:** Render on a scratch page in the kitchen world; verify at 1366px and 1920px; verify light and dark; verify the status-change flash.

### Task F-09 — Guest Landing Page
**Files:** `app/(guest)/page.tsx`, `app/(guest)/_sections/`
**Verification:** Render with real content; verify every section; verify scroll choreography; verify reduced motion.

### Task F-10 — Guest Menu, Modifier Sheet, Cart
**Files:** `app/(guest)/menu/`, `app/(guest)/cart/`
**Verification:** Full flow from menu to cart; verify empty, loading, and error states.

### Task F-11 — Guest Confirmation and Tracking
**Files:** `app/(guest)/order/`
**Verification:** Place a test order; verify confirmation; verify tracking; verify live status updates.

### Task F-12 — Guest Room Service Catalog and Forms
**Files:** `app/(guest)/services/`
**Verification:** Render every service form; verify submission; verify the Requests screen.

### Task F-13 — Staff Login and Layout
**Files:** `app/staff/`, `app/admin/login/`, `app/kitchen/login/`
**Verification:** Log in as each role; verify the correct layout loads.

### Task F-14 — Staff Order and Request Queues
**Files:** `app/staff/table/`, `app/staff/room/`, `app/staff/housekeeping/`, etc.
**Verification:** Queue rendering; one-tap actions; status-change flash.

### Task F-15 — Kitchen Display
**Files:** `app/kitchen/`
**Verification:** Ticket grid; action flow; audible ping; light/dark toggle.

### Task F-16 — Admin Dashboard and Navigation
**Files:** `app/admin/dashboard/`, `src/components/staff/admin-shell.tsx`
**Verification:** All navigation items render; dashboard metrics render.

### Task F-17 — Admin Menu, Tables, Rooms, QR
**Files:** `app/admin/menu/`, `app/admin/tables/`, `app/admin/rooms/`, `app/admin/qr/`
**Verification:** Full CRUD on each; QR generation and print view.

### Task F-18 — Admin Staff, Reports, Settings
**Files:** `app/admin/staff/`, `app/admin/reports/`, `app/admin/settings/`
**Verification:** Staff management flows; CSV export; settings updates.

### Task F-19 — Accessibility Audit
**Files:** Any files with accessibility issues found.
**Verification:** Keyboard-only walkthrough of every screen; screen reader walkthrough of the guest flow and the staff queue.

### Task F-20 — Performance Audit
**Files:** Any files with performance issues found.
**Verification:** Landing page under 1 second on a throttled 4G connection; kitchen screen stable under simulated 50-order load.

---

# PART THREE — PER-VENUE ONBOARDING DATA

## What this part is

This part is not a list of open design questions. The design language — the palette, the typography, the components, the motion, the two atmospheres, the screen specifications — is settled. It is written out in Parts One and Two, and it is approved as of 2026-10-15 at version 2.0.

What remains is not a design question. It is a set of facts the developer needs from each venue at the time of onboarding, so that the venue's configuration can be set correctly. Those facts are collected once per venue, they are recorded in code by the developer, and they do not change the design.

## The onboarding data a venue provides

The developer asks each venue for the following before onboarding. The answers are recorded in code (per D-9.1 and D-9.6), not in the admin panel.

1. **The venue's display name.** What appears in the guest header, on the landing hero, and in the page title.
2. **The venue's logo.** An image file, or the decision to use the venue's name rendered in the display typeface. If a logo is provided, it replaces the hero's name typography. If it is not, the name stays as type.
3. **The venue's brand colour.** A single hex value. The developer verifies it passes the contrast check in §4.2.7 (WCAG AA against the guest surface for text, 3:1 for UI components). If it does not, the developer chooses a shade within the venue's brand family that does.
4. **The venue's hero image.** An image file, or the decision to use no hero image. The design supports both. If no image is provided, the hero is type only on the warm guest surface. If an image is provided, it is placed per §4.7.2.
5. **The venue's welcome message.** One line, in the venue's voice. It appears under the hero name (per §4.7.2).
6. **The venue's language.** English in the first version (per D-11.1 and D-11.4). If the venue needs another language, the developer sets it in code at onboarding.
7. **The venue's currency.** The ISO 4217 code the venue's prices and reports use (per D-11.2).
8. **The venue's tax rate.** The single rate applied to every order's subtotal (per D-4.3).
9. **The venue's enabled modules.** Which of the four — table, room, counter, kitchen — the venue actually has (per PRODUCT.md §2).
10. **The venue's enabled services.** Which of the hotel services the venue offers (per PRODUCT.md §6).
11. **The venue's payment provider configuration.** Deferred in the first version (per D-7.1 and D-7.7). The cash-at-counter path is the only path in the first version.

## What is not an onboarding question

The five design questions in the previous version of this file are settled. They are recorded in DECISIONS.md and they are not open:

- **The five-colour palette** (olive, sand, peach, sage, forest) — locked. Every venue uses it. The per-venue override affects only `--guest-brand`.
- **Fraunces as the display typeface** — locked (per DESIGN.md §4.3.1 and the code that loads it). It is used in the guest world only.
- **No guest dark mode** — locked (per D-9.4). The guest world is light only.
- **The motion ceilings** (600ms guest, 320ms staff) — locked (per DESIGN.md §4.5.8). They are the language of the guest and staff motion.
- **The kitchen dark mode default** — locked (per D-9.5). The kitchen screen starts dark and has a light-mode toggle.

## What the design does not decide

The design does not decide:

- Which package manager the project uses. That is settled: pnpm (per BUILD.md §9).
- The venue's table count, room count, or counter presence. Those are onboarding facts.
- The number of staff the venue has. That is an operational fact the operator manages.
- The shape of the menu, the price points, or the dish names. Those are operational facts the operator manages.

## The point of this part

Parts One and Two describe the design that the product **is**, for every venue. This part lists the facts the developer collects once per venue to make the venue's configuration correct. The design language does not change from venue to venue; only the values that are placed into it do.

---