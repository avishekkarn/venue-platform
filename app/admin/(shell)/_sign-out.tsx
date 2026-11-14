"use client";

import { useState, type JSX } from "react";
import { getCsrfToken } from "@/lib/csrf-client";

/**
 * The admin shell's single sign-out (supersedes D-9.7's per-page buttons).
 *
 * POSTs /api/auth/logout with the X-CSRF-Token header (D-20.1). Redirects
 * to /admin/login on completion. Uses window.location.href (hard
 * navigation) so the cookie jar commits before the next request — the
 * 7.7.5 lesson (D-19.2).
 *
 * The previous /admin/qr/_logout-button.tsx omitted the CSRF header
 * (silently 403'd since D-20.1 landed); this sign-out corrects that.
 */
export function AdminSignOut(): JSX.Element {
  const [loading, setLoading] = useState(false);

  async function handleSignOut(): Promise<void> {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": getCsrfToken() },
      });
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="text-sm font-medium text-staff-text-secondary hover:text-staff-text-primary transition-colors disabled:opacity-50"
    >
      {loading ? "Signing out…" : "Sign Out"}
    </button>
  );
}
