"use client";

import { usePathname } from "next/navigation";
import { type JSX } from "react";

/**
 * The admin shell's header title (DESIGN.md §4.10.3 — "current section
 * title on the left").
 *
 * Maps the pathname to a human label. The mapping is explicit, not
 * derived from the nav list, so future sections can name their titles
 * independently. Unknown paths fall back to "Admin".
 */
const TITLES: ReadonlyArray<{ readonly prefix: string; readonly title: string }> = [
  { prefix: "/admin/orders/active", title: "Active Orders" },
  { prefix: "/admin/orders/completed", title: "Completed Orders" },
  { prefix: "/admin/menu", title: "Menu" },
  { prefix: "/admin/tables", title: "Tables" },
  { prefix: "/admin/rooms", title: "Rooms" },
  { prefix: "/admin/qr", title: "QR Codes" },
  { prefix: "/admin/staff", title: "Staff" },
  { prefix: "/admin/reports", title: "Reports" },
  { prefix: "/admin/settings", title: "Settings" },
  { prefix: "/admin", title: "Dashboard" },
] as const;

export function AdminShellTitle(): JSX.Element {
  const pathname = usePathname();
  const match = TITLES.find(
    (t) => pathname === t.prefix || pathname.startsWith(t.prefix + "/")
  );
  return (
    <h2 className="text-base font-semibold text-staff-text-primary">
      {match?.title ?? "Admin"}
    </h2>
  );
}
