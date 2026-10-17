/**
 * Guest session cookie helpers.
 *
 * Implements functions to set, read, and clear the guest session cookie
 * using Next.js cookies() from next/headers.
 *
 * Reference: SYSTEM.md §6.2 (The guest session), §6.4 (The cookie names — venue_guest),
 * SYSTEM.md §6.5 (The enforcement layers), DECISIONS.md D-2.1, D-2.3, D-2.5,
 * BUILD.md §2 (TypeScript), §7.4 (Security).
 */

import { cookies } from "next/headers";

// The guest session cookie name is fixed by SYSTEM.md §6.4 (venue_guest).
const COOKIE_NAME = "venue_guest";

// 30 days max age for consistency with the staff session cookie (SYSTEM.md §6.4).
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Sets the guest session cookie carrying the guest session token.
 * HTTP-only, Secure in production, SameSite=Lax, Path=/.
 */
export async function setGuestCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Reads the guest session token from the cookie.
 * Returns null if the cookie is not present.
 */
export async function getGuestCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Clears the guest session cookie.
 */
export async function clearGuestCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
