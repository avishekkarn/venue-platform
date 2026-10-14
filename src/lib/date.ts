/**
 * Date and time formatting for display.
 *
 * These helpers turn a Date (an exact instant) into a string a human reads:
 * a clock time, a full date-and-time, or a compact elapsed duration. They do
 * not decide what is late. They do not compare timestamps for business
 * reasons. They do not hold a clock. Every function is a pure function of
 * its arguments, so every function is deterministic and testable with fixed
 * inputs.
 *
 * Why the parameters are Date, not string:
 *   Unlike money — where a JavaScript number cannot represent 10.99 exactly
 *   and the wire format is a string (BUILD.md §7.1) — a Date is an exact
 *   representation of an instant. There is no precision problem to avoid.
 *   Passing a Date also forces the caller to make the instant decision
 *   explicitly: a string does not know its own timezone, a Date does.
 *
 * Why there is no timezone parameter:
 *   A Date already carries the correct instant. Intl.DateTimeFormat renders
 *   it in the runtime's local timezone by default. A single-venue deployment
 *   runs on a server whose timezone matches the venue's, so the local zone is
 *   the correct zone. If a future venue needs a fixed display timezone that
 *   differs from the server's, that is a per-venue decision with its own
 *   record in DECISIONS.md. It is not needed now, and inventing a parameter
 *   without a caller is the wrong direction.
 *
 * Why there is no default locale:
 *   Same reasoning as formatMoney (src/lib/money.ts). A hidden default
 *   propagates a wrong value silently. Every caller passes the locale. The
 *   venue's locale is read from src/config/venue.config.ts at the call site.
 *
 * Why the return types are explicit:
 *   BUILD.md §2.5 — "Explicit return types on every exported function."
 *
 * Reference: BUILD.md §2.5 (explicit return types), §8.2 (unit-test
 * coverage), DESIGN.md §4.15.7 (utilities live in src/lib),
 * ROADMAP.md §4 Milestone 1.4 (shared utilities).
 */

/**
 * Format an instant as a short clock time in the given locale.
 *
 * Used by the kitchen status strip's clock and by any place a time-of-day
 * alone is enough (for example, "Placed at 7:45 PM").
 *
 * @param timestamp The instant to format.
 * @param locale    The BCP 47 locale tag (for example "en-US", "en-GB").
 * @returns         The localized clock time (for example "7:45 PM" in
 *                  en-US, "19:45" in en-GB).
 *
 * @example
 *   formatTime(new Date("2026-10-14T19:45:00Z"), "en-US") // "7:45 PM"
 *   formatTime(new Date("2026-10-14T19:45:00Z"), "en-GB") // "19:45"
 */
export function formatTime(timestamp: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: undefined, // let the locale decide
  }).format(timestamp);
}

/**
 * Format an instant as a full date-and-time in the given locale.
 *
 * Used by the manager panel's order detail, the completed-orders list, the
 * reports, and the guest's "placed at" line on an order confirmation.
 *
 * @param timestamp The instant to format.
 * @param locale    The BCP 47 locale tag.
 * @returns         The localized date-and-time (for example
 *                  "Oct 14, 2026, 7:45 PM" in en-US).
 *
 * @example
 *   formatDateTime(new Date("2026-10-14T19:45:00Z"), "en-US")
 *   // "Oct 14, 2026, 7:45 PM"
 */
export function formatDateTime(timestamp: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: undefined, // let the locale decide
  }).format(timestamp);
}

/**
 * Format the interval between two instants as a compact duration string.
 *
 * The output contract is deliberately simple, because the kitchen ticket is
 * read at two meters and the staff queue is scanned, not read:
 *
 *   - Under one minute:    "<1m"
 *   - Under one hour:      "{n}m"        (for example "3m", "59m")
 *   - One hour or more:    "{h}h {m}m"   (for example "1h 12m", "2h 0m")
 *
 * No seconds. No "ago". No "just now". No words. A compact token.
 *
 * A negative interval — a `to` earlier than a `from` — returns "<1m". Clock
 * skew and badly ordered pairs must not produce "-3m" on a ticket.
 *
 * The function does not call Date.now(). Both instants are supplied by the
 * caller. That is what makes the function deterministic and testable with
 * fixed inputs, and it is what keeps the arithmetic out of the domain's way:
 * the domain will decide *whether* something is late (in Phase 2's
 * src/domain/shared/time.ts); this function decides only *how a duration
 * looks*.
 *
 * @param from The earlier instant.
 * @param to   The later instant.
 * @returns    The compact duration string.
 *
 * @example
 *   formatElapsed(new Date("2026-10-14T19:45:00Z"), new Date("2026-10-14T19:48:00Z")) // "3m"
 *   formatElapsed(new Date("2026-10-14T19:45:00Z"), new Date("2026-10-14T20:57:00Z")) // "1h 12m"
 */
export function formatElapsed(from: Date, to: Date): string {
  const diffMs = to.getTime() - from.getTime();

  // Defensive: negative intervals are clock skew or misordered arguments,
  // not real elapsed time. They render the smallest bucket.
  if (diffMs < 60_000) {
    return "<1m";
  }

  const totalMinutes = Math.floor(diffMs / 60_000);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m`;
}