import type { ReactNode, JSX } from 'react';

/**
 * The admin world's layout.
 *
 * Sets data-world="staff" on a wrapper div. The admin panel is a staff
 * tool: it uses the neutral palette, never the venue's brand color. Per
 * D-9.2, the brand color affects guest screens only, so that every staff
 * tool — at every venue — looks the same.
 *
 * The admin panel is a separate route group from app/staff/ because the
 * audience and the screens are different (the manager manages the venue;
 * the service staff work the queues), but both belong to the same world.
 * The layout for each is written separately rather than shared, because
 * the two will diverge: the admin layout will grow a sidebar, a header bar,
 * and a venue-switcher (Phase 8), while the staff layout will grow queue
 * tabs and a shared-device login state (Phase 7). Sharing a layout file
 * would force them to remain identical, which they should not.
 *
 * The default theme is light. The manager can toggle to dark later if a
 * design decision asks for it; no such decision exists today, so this
 * layout leaves the theme alone.
 *
 * This is a Server Component. It does no client work.
 *
 * Reference: DESIGN.md §4.2.5 (staff semantic tokens), §4.15.3 (staff token
 * block), D-9.2 (brand color affects guest screens only), SYSTEM.md §3 (the
 * folder structure reserves app/admin for the manager panel).
 */
interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps): JSX.Element {
  return (
    <div data-world="staff" className="min-h-dvh bg-staff-surface">
      {children}
    </div>
  );
}