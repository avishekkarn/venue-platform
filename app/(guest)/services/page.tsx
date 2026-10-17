// Phase 4 placeholder. Replaced by Phase 9 (the service catalog).
import type { JSX } from "react";

export default async function ServicesPlaceholderPage(): Promise<JSX.Element> {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <h1 className="font-display text-3xl text-guest-text-primary">
          Services are being prepared.
        </h1>
        <p className="text-base leading-relaxed text-guest-text-muted">
          Please check back in a moment.
        </p>
      </div>
    </div>
  );
}
