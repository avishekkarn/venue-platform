import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { formatMoney } from "@/lib/money";
import { OrderStatusTimeline } from "@/components/guest/order-status-timeline";

export const metadata: Metadata = {
  title: "Order Tracking",
  robots: {
    index: false,
  },
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface TrackOrderPageProps {
  params: Promise<{ id: string }>;
}

function OrderNotFoundView(): JSX.Element {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[480px] text-center">
        <h1 className="font-display text-[24px] leading-[32px] text-guest-text-primary">
          We couldn&apos;t find that order.
        </h1>
        <p className="mt-2 text-sm text-guest-text-secondary">
          This order may not exist or belongs to another session.
        </p>
        <div className="mt-6">
          <Link
            href="/menu"
            className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-guest-brand text-guest-brand-contrast text-sm font-medium hover:brightness-95 transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to menu
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function TrackOrderPage({
  params,
}: TrackOrderPageProps): Promise<JSX.Element> {
  // 1. Session check: token from guest session cookie
  const cookie = await getGuestCookie();
  if (!cookie) {
    redirect("/");
  }

  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const sessionResult = await getGuestSession({ repo: guestRepo }, cookie);
  if (!sessionResult.ok) {
    redirect("/");
  }
  const session = sessionResult.value;

  // 2. Validate route parameter
  const { id } = await params;
  if (!id || typeof id !== "string" || !UUID_REGEX.test(id.trim())) {
    return <OrderNotFoundView />;
  }

  // 3. Read order directly through order repository
  const orderRepo = createPrismaOrderRepository(prisma);
  const orderResult = await orderRepo.findById(session.venueId, id.trim());
  if (!orderResult.ok) {
    return <OrderNotFoundView />;
  }

  const order = orderResult.value;

  // 4. Privacy & session scoping: verify order belongs to active guestSessionId
  if (order.guestSessionId !== session.id) {
    return <OrderNotFoundView />;
  }

  // 5. Read venue for currency and locale
  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findById(session.venueId);
  const currency = venueResult.ok ? venueResult.value.currency : "USD";
  const locale = venueResult.ok ? venueResult.value.language : "en-US";

  const orderNumberShort = order.id.slice(0, 8);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Sticky Header Bar (DESIGN.md §4.8.5) */}
      <header className="sticky top-0 z-30 bg-guest-surface/95 backdrop-blur-sm border-b border-guest-border-subtle px-4 h-14 flex items-center justify-between">
        <Link
          href="/menu"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-guest-text-secondary hover:text-guest-text-primary transition-colors select-none outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm py-1 px-1.5"
          aria-label="Back to menu"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>Menu</span>
        </Link>

        <span className="font-mono text-sm font-medium text-guest-text-primary">
          Order #{orderNumberShort}
        </span>

        <div className="w-14" aria-hidden="true" />
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-6">
        {/* Order Status Timeline Card */}
        <section
          aria-labelledby="timeline-heading"
          className="rounded-lg bg-guest-surface-raised border border-guest-border-subtle p-5 shadow-sm"
        >
          <h2
            id="timeline-heading"
            className="text-xs font-semibold uppercase tracking-wider text-guest-text-muted mb-4"
          >
            Order Progress
          </h2>
          <OrderStatusTimeline
            currentState={order.state}
            stateChanges={order.stateChanges}
            placeType={order.placeType}
            locale={locale}
          />
        </section>

        {/* Collapsible Items List (DESIGN.md §4.8.5) */}
        <details
          open
          className="group mt-6 rounded-lg bg-guest-surface-raised border border-guest-border-subtle shadow-sm overflow-hidden"
        >
          <summary className="flex items-center justify-between p-4 cursor-pointer select-none font-medium text-sm text-guest-text-primary hover:bg-guest-surface-sunken transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>
              Order Items ({order.items.length}{" "}
              {order.items.length === 1 ? "item" : "items"})
            </span>
            <svg
              className="size-4 text-guest-text-secondary transition-transform duration-guest-base group-open:rotate-180"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </summary>

          <div className="px-4 pb-4 border-t border-guest-border-subtle pt-3">
            <ul className="divide-y divide-guest-border-subtle" role="list">
              {order.items.map((item) => {
                const modifiers = Array.isArray(item.modifiersJson)
                  ? (item.modifiersJson as Array<{ name?: string }>)
                      .map((m) => m?.name)
                      .filter(
                        (name): name is string =>
                          typeof name === "string" && name.length > 0
                      )
                  : [];

                return (
                  <li key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-sm font-medium text-guest-text-secondary">
                            {item.quantity}×
                          </span>
                          <span className="text-sm font-medium text-guest-text-primary">
                            {item.itemName}
                          </span>
                        </div>
                        {modifiers.length > 0 && (
                          <p className="mt-0.5 text-xs text-guest-text-secondary pl-6">
                            {modifiers.join(", ")}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-0.5 text-xs italic text-guest-text-muted pl-6">
                            &ldquo;{item.notes}&rdquo;
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-sm font-medium text-guest-text-primary shrink-0">
                        {formatMoney(item.lineTotal, currency, locale)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Financial Summary */}
            <div className="mt-3 pt-3 border-t border-guest-border-subtle space-y-1.5 text-sm">
              <div className="flex justify-between text-guest-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono">
                  {formatMoney(order.subtotal, currency, locale)}
                </span>
              </div>
              <div className="flex justify-between text-guest-text-secondary">
                <span>Tax</span>
                <span className="font-mono">
                  {formatMoney(order.taxAmount, currency, locale)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-guest-border-subtle text-base font-medium text-guest-text-primary">
                <span>Total</span>
                <span className="font-mono">
                  {formatMoney(order.total, currency, locale)}
                </span>
              </div>
            </div>
          </div>
        </details>

        {/* Actions (DESIGN.md §4.8.5) */}
        <div className="mt-6 space-y-3">
          <Link
            href="/menu"
            className="w-full h-11 rounded-md border border-guest-border-strong bg-transparent text-guest-text-primary font-medium text-sm inline-flex items-center justify-center hover:bg-guest-surface-sunken transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Add more items
          </Link>

          <button
            type="button"
            disabled
            className="w-full h-10 rounded-md bg-transparent text-guest-text-muted font-medium text-sm inline-flex items-center justify-center cursor-not-allowed opacity-50 select-none outline-none"
            title="Waiter call will be enabled in Task 5.7.4"
          >
            Call a waiter
          </button>
        </div>
      </main>
    </div>
  );
}

