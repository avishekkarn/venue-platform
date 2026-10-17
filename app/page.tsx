import type { Metadata } from "next";
import type { JSX } from "react";

export const metadata: Metadata = {
  title: "Scan the QR code",
  robots: {
    index: false,
  },
};

export default function RootPage(): JSX.Element {
  return (
    <div
      data-world="guest"
      className="min-h-dvh bg-guest-surface flex flex-col items-center justify-center px-4 text-center"
    >
      <h1 className="font-display text-4xl text-guest-text-primary mb-4">
        Scan the QR code.
      </h1>
      <p className="text-base leading-relaxed text-guest-text-muted">
        Please scan the QR code on your table or in your room to view the menu and order.
      </p>
    </div>
  );
}