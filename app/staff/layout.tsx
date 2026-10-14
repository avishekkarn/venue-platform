import type { ReactNode, JSX } from 'react';

/**
 * The staff world's layout.
 *
 * Sets data-world="staff" on a wrapper div. Every component rendered under
 * this layout — the service staff queues (table, room, housekeeping,
 * maintenance, concierge, laundry, spa, front desk), the staff login, and
 * their maps — inherits the staff world's tokens from app/globals.css:
 *
 *   [data-world="staff"] { --staff-surface, --staff-text-primary, ... }
 *
 * The staff world is neutral, and it never uses the venue's brand color.
 * Per D-9.2, the staff tools are identical across venues so that a staff
 * member trained at one venue can walk into another and know exactly where
 * everything is. Per DESIGN.md §1.3, the two atmospheres never mix: a guest
 * component never imports a staff component, and vice versa.
 *
 * The default theme is light. The kitchen screen overrides this to dark in
 * app/kitchen/layout.tsx (see D-9.5 and DESIGN.md §4.5.5). Every other
 * staff screen is light by default, and any staff screen that wants a dark
 * toggle will set data-theme="dark" on its own subtree — not here.
 *
 * The wrapper paints the page background with bg-staff-surface
 * (--color-neutral-50). min-h-dvh fills the dynamic viewport height.
 *
 * This is a Server Component. It does no client work.
 *
 * Reference: DESIGN.md §4.2.5 (staff semantic tokens), §4.15.3 (staff token
 * block), D-9.2 (brand color affects guest screens only), SYSTEM.md §2.
 */
interface StaffLayoutProps {
  children: ReactNode;
}

export default function StaffLayout({
  children,
}: StaffLayoutProps): JSX.Element {
  return (
    <div data-world="staff" className="min-h-dvh bg-staff-surface">
      {children}
    </div>
  );
}