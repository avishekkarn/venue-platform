/**
 * CSRF cookie helpers.
 *
 * The CSRF cookie carries an opaque random token (a UUID). It is
 * NOT HttpOnly because the client must read it to echo it back in the
 * X-CSRF-Token header. It is SameSite=Lax so a cross-site form POST does
 * not send it. It is Secure in production. Its lifetime matches the
 * session cookie (30 days).
 *
 * This file mirrors the shape of src/infrastructure/auth/cookies.ts and
 * src/infrastructure/guest/cookies.ts. Every helper is async and reads
 * or writes the cookie via `cookies()` from next/headers. When the
 * cookie must be set on a response that also carries a redirect (the QR
 * landing and the staff login), the route uses `response.cookies.set(...)`
 * directly, not `setCsrfCookie`. That is the same discipline D-19.2 names
 * for the join-approval cookie.
 *
 * Reference: DECISIONS.md D-20.1 (double-submit cookie), BUILD.md §7.4,
 * SYSTEM.md §15, D-19.2 (server-side Set-Cookie discipline).
 */

import { cookies } from "next/headers";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "X-CSRF-Token";
export const CSRF_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Sets the CSRF cookie.
 *
 * NOT HttpOnly. The client reads the token and echoes it in the
 * X-CSRF-Token header. SameSite=Lax prevents a cross-site form POST from
 * sending the cookie (which is the double-submit's first half; the second
 * half is the server comparing the header to the cookie).
 *
 * This helper is for code paths that have a `cookies()` context (a route
 * handler or a server action that is not itself producing the final
 * response). For the QR landing redirect and the staff login response,
 * use `response.cookies.set(CSRF_COOKIE_NAME, token, { ... })` directly.
 */
export async function setCsrfCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: CSRF_MAX_AGE_SECONDS,
  });
}

/**
 * Reads the CSRF cookie value. Returns null if absent.
 */
export async function getCsrfCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Clears the CSRF cookie.
 */
export async function clearCsrfCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_COOKIE_NAME);
}
