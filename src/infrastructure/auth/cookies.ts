/**
 * Staff session cookie helpers.
 *
 * Implements functions to set, read, and clear the staff session cookie
 * using Next.js cookies() from next/headers.
 *
 * Reference: SYSTEM.md §6.4 (cookie names — venue_staff),
 * SYSTEM.md §6.5 (cookie security flags), DECISIONS.md D-3.2, D-3.4,
 * BUILD.md §5, §8.8.
 */

import { cookies } from "next/headers";

const COOKIE_NAME = "venue_staff";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Sets the staff session cookie.
 * HTTP-only, Secure in production, SameSite=Lax.
 */
export async function setSessionCookie(token: string): Promise<void> {
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
 * Reads the staff session token from the cookie.
 * Returns null if the cookie is not present.
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Clears the staff session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
