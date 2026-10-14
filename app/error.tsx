'use client';

import type { JSX } from 'react';

/**
 * The root error boundary.
 *
 * Next.js renders this screen when a React error is thrown somewhere in
 * the app's render tree. It is a Client Component by Next.js convention:
 * error boundaries are client-side constructs, and Next.js requires the
 * "use client" directive at the top of any error.tsx file.
 *
 * What this screen does NOT do:
 *   - It does not display the error message. Per SYSTEM.md §16, the
 *     product never shows an internal detail to a guest. The error's
 *     message may contain a stack fragment, a database column name, or a
 *     file path. None of that belongs on a guest's phone.
 *   - It does not display the error's digest. The digest is a hash that
 *     correlates a client error with a server log; it is for the developer
 *     and for a future error-reporting service, not for the guest.
 *   - It does not set data-world. The error boundary renders inside
 *     whichever layout was rendering when the error was thrown. If a
 *     guest page fails, app/(guest)/layout.tsx is an ancestor, and
 *     data-world="guest" is already set. If a staff page fails,
 *     app/staff/layout.tsx is an ancestor. This screen inherits its world
 *     from its ancestors, which is the correct behaviour. Setting a world
 *     here would override the failing page's world with a fixed one.
 *
 * Why the console.error call:
 *   During development, the developer needs to see the error. Next.js
 *   already logs it in the terminal, but the browser console is where the
 *   developer looks first. In production, this call is harmless and can be
 *   replaced later with a call to a real error-reporting service (Sentry
 *   or equivalent) when one is added. It is deliberately the only side
 *   effect of this component beyond the reset button.
 *
 * What "reset" does:
 *   Next.js passes a reset function that re-attempts to render the segment
 *   that threw. Calling it from the button is the standard recovery path.
 *   It is not guaranteed to succeed (if the underlying cause persists, the
 *   error will fire again), but it is the correct first action to offer.
 *
 * Reference: SYSTEM.md §16 (the error and failure model — the product
 * never shows internal detail to a guest), BUILD.md §2.5 (explicit return
 * types), ROADMAP.md §4 Milestone 1.5.
 */
interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({
  error,
  reset,
}: RootErrorProps): JSX.Element {
  // The browser console is the developer's first stop. In production, this
  // is harmless; a real error-reporting service can replace it later.
  console.error(error);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <h1 className="font-sans font-semibold text-[28px] leading-[36px]">
        Something went wrong.
      </h1>
      <p className="mt-4 max-w-[480px] text-[16px] leading-[26px] text-muted-foreground">
        Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md border border-border bg-transparent px-5 py-2 text-[13px] font-semibold leading-[18px] hover:bg-muted"
      >
        Try again
      </button>
    </div>
  );
}