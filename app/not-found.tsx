import Link from 'next/link';
import type { JSX } from 'react';

/**
 * The 404 screen.
 *
 * This is the fallback that Next.js renders when a URL does not match any
 * route in the app. In this product, the most common cause of a 404 is a
 * bad QR: a token that has been revoked, a table that was removed, or a
 * camera that appended a stray character to the URL. The guest who reaches
 * this screen is a real guest, at a real table or in a real room, who
 * expects to order. They are not lost in a website; they are holding a
 * phone at a venue, and something did not work.
 *
 * The screen therefore belongs to the guest world. It uses the guest
 * surface, the guest voice, and the guest's Fraunces headline. It does not
 * display the number 404. It does not display an error code. It does not
 * use staff vocabulary. It tells the guest, in the venue's voice, that the
 * code did not lead anywhere, and it asks them to ask a member of staff
 * for help — the same instruction the root placeholder gives.
 *
 * Why data-world="guest" is set on this element:
 *   app/not-found.tsx renders inside app/layout.tsx, not inside
 *   app/(guest)/layout.tsx. The guest route group's layout is not an
 *   ancestor of this file. Without setting data-world here, the guest
 *   tokens would fall back to their :root values and the wrong surface
 *   would show. Setting it on the root div of this screen is what makes
 *   the guest tokens resolve. This is the exception to the rule that only
 *   a route-group layout sets data-world, and it is the correct exception:
 *   a not-found screen has no route group.
 *
 * This is a Server Component. It has no interactive behaviour beyond the
 * link, which is a standard Next.js <Link>.
 *
 * Reference: PRODUCT.md §1 and D-1.3 (the "scan the QR code" screen),
 * DESIGN.md §4.2.4 (guest tokens), §4.7 (the guest voice), §4.15.2,
 * SYSTEM.md §3 (the folder structure), D-9.4 (the guest world is light).
 */
export default function NotFound(): JSX.Element {
  return (
    <div
      data-world="guest"
      className="flex min-h-dvh flex-col items-center justify-center bg-guest-surface px-6 text-center"
    >
      <h1 className="font-display text-guest-text-primary text-[32px] leading-[38px] md:text-[40px] md:leading-[46px]">
        That code doesn&rsquo;t lead anywhere.
      </h1>
      <p className="mt-4 max-w-[480px] text-guest-text-muted text-[16px] leading-[26px]">
        If you scanned a QR code, please ask a member of staff for help.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md border border-guest-border-strong bg-transparent px-5 py-2 text-guest-text-primary text-[13px] font-semibold leading-[18px] hover:bg-guest-surface-sunken"
      >
        Back to start
      </Link>
    </div>
  );
}