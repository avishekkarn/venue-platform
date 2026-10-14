import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

/* Font loaders. DESIGN.md §4.3.1 and §4.3.5.
 *
 * Three families total, no more. Fraunces is the display serif for the guest
 * world only. Geist is the sans for both worlds. Geist Mono is for identifiers.
 * All three are self-hosted by next/font; no external CDN at runtime. */

export const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT'],
});

export const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
});

export const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

/* The class names to apply to the <html> element. */
export const fontVariables = [
  fraunces.variable,
  geistSans.variable,
  geistMono.variable,
].join(' ');