import type { Metadata } from "next";
import type { JSX } from "react";

export const metadata: Metadata = {
  title: "QR Inactive",
  robots: {
    index: false,
  },
};

export default function InactiveQrPage(): JSX.Element {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl text-guest-text-primary mb-4">
        This QR is no longer active.
      </h1>
      <p className="text-base leading-relaxed text-guest-text-muted">
        Please ask a member of staff for help.
      </p>
    </div>
  );
}
