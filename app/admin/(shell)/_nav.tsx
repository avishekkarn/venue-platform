"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type JSX } from "react";
import { cn } from "@/lib/utils";

/**
 * The admin shell's navigation list (DESIGN.md §4.10.4).
 *
 * Ten items, each a Link. The active item is highlighted with the staff
 * world's raised/sunken surfaces — no brand color, no motion (DESIGN.md
 * §4.10.14, §4.10.15).
 *
 * This is a Client Component because usePathname() is a client hook.
 * The layout that renders it is a Server Component; the nav is the
 * boundary.
 *
 * Tables and Rooms are rendered unconditionally in 8.1.2. A future task
 * (likely 8.7.5, when the module toggles are live) will hide them when
 * the venue's table or room module is off. Until then, the nav shows all
 * ten items; a click on a not-yet-built page 404s honestly.
 */
interface NavItem {
  readonly label: string;
  readonly href: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Active Orders", href: "/admin/orders/active" },
  { label: "Completed Orders", href: "/admin/orders/completed" },
  { label: "Menu", href: "/admin/menu" },
  { label: "Tables", href: "/admin/tables" },
  { label: "Rooms", href: "/admin/rooms" },
  { label: "QR Codes", href: "/admin/qr" },
  { label: "Staff", href: "/admin/staff" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Settings", href: "/admin/settings" },
] as const;

export function AdminNav(): JSX.Element {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center h-10 px-3 rounded-md text-sm font-medium transition-colors",
              "text-staff-text-secondary hover:bg-staff-surface-sunken hover:text-staff-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-staff-brand",
              isActive &&
                "bg-staff-surface-sunken text-staff-text-primary"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
