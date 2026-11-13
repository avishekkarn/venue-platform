/**
 * Client-side CSRF token reader.
 *
 * The csrf_token cookie is set by the server (the QR landing, the login
 * routes, and the occupied redirect — D-19.2 and D-20.1) and is NOT
 * HttpOnly, so the browser can read it. This helper reads it and returns
 * the token, or an empty string if the cookie is absent. The empty-string
 * fallback is the fail-closed behavior: the server's `safeCompareCsrfTokens`
 * treats '' as a mismatch and returns 403.
 *
 * This module is importable only from Client Components ("use client").
 * Server Components cannot call `document.cookie`; if a Server Component
 * needs the CSRF token, it reads it via `getCsrfCookie()` from
 * `src/infrastructure/csrf/cookies.ts` (which uses Next.js's `cookies()`).
 *
 * The two helpers (this one and `getCsrfCookie`) are the client-side and
 * server-side halves of the same cookie. The server sets it; the client
 * echoes it back in the `X-CSRF-Token` header. The double-submit pattern
 * (D-20.1) is what makes a forged request impossible: the attacker cannot
 * read the cookie (SameSite=Lax, no cross-origin), and cannot guess
 * 122 bits of entropy (UUID).
 *
 * Reference: DECISIONS.md D-20.1 (double-submit cookie),
 * BUILD.md §7.4, SYSTEM.md §15, D-19.2 (server-side Set-Cookie discipline).
 */
export function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match && match[1] ? decodeURIComponent(match[1]) : "";
}
