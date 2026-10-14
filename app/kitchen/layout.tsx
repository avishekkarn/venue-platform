import type { ReactNode, JSX } from 'react';

/**
 * The kitchen world's layout.
 *
 * Sets data-world="staff" AND data-theme="dark" on a wrapper div. The
 * kitchen screen belongs to the staff world (it uses the neutral palette,
 * not the guest palette), but it defaults to dark mode.
 *
 * Per D-9.5 and DESIGN.md §4.5.5, the kitchen screen defaults to dark
 * because kitchens are often low-light environments, and a dark screen is
 * easier on the eyes and produces less glare. The staff can switch to light
 * mode if their kitchen is bright; that toggle lives inside the kitchen
 * screens (Phase 6), not here. This layout sets the default, and the toggle
 * overrides it on the client when it exists.
 *
 * The matching override in app/globals.css is:
 *
 *   [data-world="staff"][data-theme="dark"] { --staff-surface: var(--color-neutral-900); ... }
 *
 * Because this layout sets both attributes on the same element, and the
 * CSS selector requires both on the same element, the dark-mode tokens
 * apply to the kitchen and to nothing else.
 *
 * The wrapper paints the page background with bg-staff-surface. Note that
 * bg-staff-surface resolves to --staff-surface, which is already switched to
 * the dark value by the [data-theme="dark"] override — so the background is
 * dark without needing a separate class. That is the point of using the
 * token: the token changes, and every consumer follows.
 *
 * This is a Server Component. The theme toggle (Phase 6) will be a Client
 * Component that changes the attribute; the layout's default does not need
 * to be interactive.
 *
 * Reference: DESIGN.md §4.2.6 (staff dark mode tokens), §4.15.4 (staff dark
 * mode override), §4.5.5 (kitchen motion), D-9.5 (kitchen defaults to dark),
 * D-9.2 (brand color affects guest screens only).
 */
interface KitchenLayoutProps {
  children: ReactNode;
}

export default function KitchenLayout({
  children,
}: KitchenLayoutProps): JSX.Element {
  return (
    <div
      data-world="staff"
      data-theme="dark"
      className="min-h-dvh bg-staff-surface"
    >
      {children}
    </div>
  );
}