import type { JSX } from 'react';

export default function RootPage(): JSX.Element {
  return (
    <main
      data-world="guest"
      className="min-h-screen bg-guest-surface text-guest-text-primary p-8"
    >
      <h1 className="font-display text-4xl mb-4">
        Scan the QR code at your table or in your room.
      </h1>
      <div className="rounded-lg shadow-md bg-guest-surface-raised p-6">
        <p className="text-guest-text-muted">The tokens are working.</p>
        <button className="mt-4 rounded-md bg-guest-brand text-guest-brand-contrast px-4 py-2">
          Example button
        </button>
      </div>
    </main>
  );
}