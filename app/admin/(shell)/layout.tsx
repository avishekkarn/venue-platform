import type { ReactNode, JSX } from 'react';
import { requireRole } from '@/lib/auth/require-role';
import { getVenueSlug } from '@/infrastructure/config/venue';
import { AdminNav } from './_nav';
import { AdminSignOut } from './_sign-out';
import { AdminShellTitle } from './_shell-title';

/**
 * The admin shell (DESIGN.md §4.10.3).
 *
 * Wraps every protected admin page — dashboard, orders, menu, tables,
 * rooms, QR, staff, reports, settings. Renders the 240px sidebar, the
 * 56px header, and the content area. The login page (app/admin/login/)
 * is outside this (shell) route group and inherits the bare wrapper
 * from app/admin/layout.tsx.
 *
 * This is the single sign-out for every admin page (supersedes D-9.7,
 * discharged by W-0002). The sign-out sends X-CSRF-Token (D-20.1) — the
 * deleted /admin/qr per-page button did not, and was silently 403'ing
 * since D-20.1's CSRF enforcement landed.
 *
 * This is a Server Component. The three sub-components are Client
 * Components (they need usePathname or onClick).
 *
 * Reference: DESIGN.md §4.10.3, §4.10.4, §4.10.14, §4.10.15, D-9.2,
 * D-9.7 (superseded), D-19.2 (hard navigation), D-20.1 (CSRF),
 * SYSTEM.md §3.
 */
interface AdminShellLayoutProps {
  children: ReactNode;
}

export default async function AdminShellLayout({
  children,
}: AdminShellLayoutProps): Promise<JSX.Element> {
  const staff = await requireRole(['admin']);
  const venueSlug = getVenueSlug();

  return (
    <div data-world="staff" className="min-h-dvh bg-staff-surface">
      <div className="flex min-h-dvh">
        <aside className="fixed left-0 top-0 h-dvh w-60 bg-staff-surface-raised border-r border-staff-border-subtle flex flex-col">
          <div className="h-14 flex items-center px-4 border-b border-staff-border-subtle">
            <span className="text-sm font-semibold text-staff-text-primary truncate">
              {venueSlug}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <AdminNav />
          </div>
        </aside>

        <div className="ml-60 flex flex-1 flex-col">
          <header className="h-14 bg-staff-surface-raised border-b border-staff-border-subtle flex items-center justify-between px-6">
            <AdminShellTitle />
            <div className="flex items-center gap-4">
              <span className="text-sm text-staff-text-secondary">
                {staff.name} · {staff.roles.join(', ')}
              </span>
              <AdminSignOut />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
