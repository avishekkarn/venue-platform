/**
 * The venue-config loader.
 *
 * The venue's slug is the identifier every admin route uses to resolve
 * "the venue" (SYSTEM.md §15.4, D-10.2). It is a required configuration
 * value: `VENUE_SLUG` must be set in `.env.local` (development) and in
 * the venue's server-side `.env` (production). There is no fallback —
 * a missing value is a configuration error, not a runtime default.
 *
 * The fallback pattern that this file replaces is a data-
 * isolation footgun: a production deployment with a missing `VENUE_SLUG`
 * would silently read the seed venue's data (D-10.2, SYSTEM.md §15.4).
 * A thrown error is the honest response.
 *
 * W-0027 (docs/WIRING.md §2) tracks this obligation; it is discharged
 * by the first admin route that calls `getVenueSlug()` (Task 8.1.1).
 *
 * Reference: WIRING.md W-0027, SYSTEM.md §15.4, DECISIONS.md D-10.2.
 */

/**
 * Returns the venue's slug from `process.env["VENUE_SLUG"]`.
 *
 * Throws a `Error` if the variable is unset or empty. The error message
 * is safe to log; it names the variable and the expected source
 * (`.env.local` for development, the venue's server-side `.env` for
 * production).
 */
export function getVenueSlug(): string {
  const value = process.env["VENUE_SLUG"];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(
      'VENUE_SLUG is not set. Add VENUE_SLUG=<venue-slug> to .env.local (development) or the venue\'s server-side .env (production). See BUILD.md §9.3.'
    );
  }
  return value;
}
