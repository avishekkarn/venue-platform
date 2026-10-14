/**
 * Money formatting for display.
 *
 * This utility turns a decimal money value into a localized display string.
 * It does not compute. It does not round. It does not sum. All arithmetic
 * belongs to the domain layer (src/domain/orders/compute-price.ts and
 * compute-tax.ts, Phase 2). This function's only job is to take a value the
 * server has already produced and render it the way the guest's or staff
 * member's browser expects to see it.
 *
 * Why the input is a string, never a number:
 *   BUILD.md §7.1 — "The domain accepts and returns decimal values or strings,
 *   never floating-point numbers." A JavaScript `number` cannot represent
 *   10.99 exactly; it holds 10.989999999999998. Accepting a `number` here
 *   would let that representation reach a guest's screen. The signature
 *   rejects `number` at compile time, so the mistake cannot happen silently.
 *   Callers with a number convert it to a string before calling — and if
 *   they ever have a number, that is a signal their value escaped the domain.
 *
 * Why Intl.NumberFormat:
 *   BUILD.md §7.1 — "The client formats money for display with the browser's
 *   built-in internationalization." Intl.NumberFormat is that mechanism. It
 *   is available in Node 24 and in every target browser, it carries its own
 *   locale and currency data, and it produces the correct grouping, symbol,
 *   and decimal separator for each locale without us maintaining a table.
 *
 * Why the return type is explicit:
 *   BUILD.md §2.5 — "Explicit return types on every exported function."
 *   (The existing cn helper in src/lib/utils.ts violates this; the fix is a
 *   small follow-up, noted in ENTRY-0024. This utility obeys from the start.)
 *
 * Why invalid input throws:
 *   BUILD.md §2.9 — "Validate untrusted input at the boundary." A string
 *   that reaches formatMoney is past the boundary; it should already be a
 *   valid decimal. A malformed string here is a programming error in the
 *   caller, not a runtime input to be tolerated. Throwing surfaces the bug
 *   in development and in tests, instead of silently rendering "abc" as a
 *   price on a guest's phone.
 *
 * Reference: BUILD.md §7.1 (money rules), §2.5 (explicit return types),
 * §2.9 (boundary validation), DESIGN.md §4.15.7 (utilities live in src/lib),
 * ROADMAP.md §4 Milestone 1.4 (shared utilities).
 */

/**
 * The shape a valid money string takes: an optional minus sign, one or more
 * digits, an optional decimal point, and one or two digits after the point.
 *
 * Two digits is the normal case (BUILD.md §7.1: "two digits after the decimal
 * point"). One digit is accepted because some sources hand us "10.5" and the
 * intent is unambiguous; the formatter will render it with two digits anyway.
 * Zero digits after the point ("10") is also accepted, for the same reason.
 *
 * A value that does not match this shape is not a decimal money string and
 * the utility refuses it.
 */
const DECIMAL_STRING = /^-?\d+(\.\d{1,2})?$/;

/**
 * Format a decimal money value as a localized display string.
 *
 * @param value    The money value as a decimal string (for example "10.99").
 *                 Never a `number`. See the file header for why.
 * @param currency The ISO 4217 currency code (for example "USD", "EUR",
 *                 "INR", "NPR"). The caller supplies it; this utility does
 *                 not assume a currency.
 * @param locale   The BCP 47 locale tag (for example "en-US", "de-DE",
 *                 "en-IN"). The caller supplies it; this utility does not
 *                 assume a locale.
 * @returns        The localized display string (for example "$10.99").
 * @throws         TypeError if `value` is not a decimal money string.
 *
 * @example
 *   formatMoney("10.99", "USD", "en-US")   // "$10.99"
 *   formatMoney("1234.50", "EUR", "de-DE") // "1.234,50 €"
 *   formatMoney("10.99", "INR", "en-IN")   // "₹10.99"
 */
export function formatMoney(
  value: string,
  currency: string,
  locale: string
): string {
  if (!DECIMAL_STRING.test(value)) {
    throw new TypeError(
      `formatMoney received a value that is not a decimal money string: ${JSON.stringify(value)}`
    );
  }

  // The value is validated as a decimal string. Intl.NumberFormat needs a
  // number to format, so we parse here. The parse is safe because the string
  // matches DECIMAL_STRING, and because Intl.NumberFormat itself rounds the
  // parsed value to the currency's minor unit before rendering — the display
  // never shows more than two decimal places for a two-decimal currency, and
  // never shows more than the currency's own precision for currencies that
  // use a different number of minor units (for example JPY, which uses zero).
  const numeric = Number(value);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(numeric);
}