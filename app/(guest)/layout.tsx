import type { ReactNode, JSX } from 'react';

/**
 * The guest world's layout.
 *
 * Sets data-world="guest" on a wrapper div. Every component rendered under
 * this layout — the QR landing, the menu, the cart, the order tracking,
 * the service catalog and its forms — inherits the guest world's tokens
 * from app/globals.css:
 *
 *   [data-world="guest"] { --guest-surface, --guest-text-primary, ... }
 *
 * The guest world is always light. There is no data-theme attribute, and
 * there is no dark mode. Per D-9.4, the guest experience is designed for a
 * warm, appetite-driven look, and a dark mode would undermine it.
 *
 * The wrapper paints the page background with bg-guest-surface (--color-sand-50,
 * a fraction warmer than white). The root <html> in app/layout.tsx has no
 * background; this div is what fills the viewport. min-h-dvh makes it fill
 * the dynamic viewport height (dvH rather than vh, so mobile browser chrome
 * is handled correctly).
 *
 * This is a Server Component. It does no client work.
 *
 * Reference: DESIGN.md §4.2.4 (guest semantic tokens), §4.15.2 (guest token
 * block), D-9.4 (no guest dark mode), SYSTEM.md §2 (the layers).
 */
interface GuestLayoutProps {
  children: ReactNode;
}

export default function GuestLayout({
  children,
}: GuestLayoutProps): JSX.Element {
  return (
    <div data-world="guest" className="min-h-dvh bg-guest-surface">
      {children}
    </div>
  );
}