import type { ReactNode, JSX } from 'react';

/**
 * The admin world's layout.
 *
 * Sets data-world="staff" on a wrapper div. The admin panel is a staff
 * tool: it uses the neutral palette, never the venue's brand color. Per
 * D-9.2, the brand color affects guest screens only, so that every staff
 * tool — at every venue — looks the same.
 *
 * The shell (sidebar, header, sign-out) lives in app/admin/(shell)/layout.tsx
 * and wraps the protected pages (dashboard, orders, menu, tables, rooms,
 * QR, staff, reports, settings). The login page (app/admin/login/) stays
 * outside the (shell) route group because it must not require a session —
 * this file is the bare wrapper the login page inherits.
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
