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
import { OrderState } from "@/domain/orders/order.repository";
import { addDecimal } from "@/domain/shared/money";
import { formatMoney } from "@/lib/money";
import { formatTime } from "@/lib/date";
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

  // 3. Read URL order directly through order repository
  const orderRepo = createPrismaOrderRepository(prisma);
  const orderResult = await orderRepo.findById(session.venueId, id.trim());
  if (!orderResult.ok) {
    return <OrderNotFoundView />;
  }

  const urlOrder = orderResult.value;

  // 4. Privacy & session scoping: verify order belongs to active guestSessionId
  if (urlOrder.guestSessionId !== session.id) {
    return <OrderNotFoundView />;
  }

  // 5. Read all orders for this guest session
  const listResult = await orderRepo.listForGuestSession(
    session.venueId,
    session.id
  );
  const allOrders = listResult.ok ? listResult.value : [urlOrder];

  // 6. Order list: place URL order first, followed by others newest-first
  const otherOrders = allOrders
    .filter((o) => o.id !== urlOrder.id)
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
  const orderedList = [urlOrder, ...otherOrders];

  // 7. Read venue for currency and locale
  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findById(session.venueId);
  const currency = venueResult.ok ? venueResult.value.currency : "USD";
  const locale = venueResult.ok ? venueResult.value.language : "en-US";

  // 8. Compute display sum of frozen order totals for all billable orders (active + completed)
  const billOrders = allOrders.filter(
    (o) => o.state !== OrderState.CANCELLED
  );
  const combinedTotalDecimal = billOrders.reduce(
    (sum, o) => addDecimal(sum, o.total),
    "0.00"
  );
  const combinedTotalFormatted = formatMoney(
    combinedTotalDecimal,
    currency,
    locale
  );

  const urlOrderNumberShort = urlOrder.id.slice(0, 8);

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
          {orderedList.length === 1
            ? `Order #${urlOrderNumberShort}`
            : "Your Orders"}
        </span>

        <div className="w-14" aria-hidden="true" />
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 py-6 space-y-6">
        {/* Order Cards List */}
        {orderedList.map((order, index) => {
          const orderNumShort = order.id.slice(0, 8);
          const isUrlOrder = order.id === urlOrder.id;
          const placedTime = formatTime(new Date(order.placedAt), locale);

          return (
            <article
              key={order.id}
              aria-labelledby={`order-heading-${order.id}`}
              className="rounded-lg bg-guest-surface-raised border border-guest-border-subtle p-5 shadow-sm space-y-5"
            >
              {/* Order Card Header */}
              <div className="flex items-center justify-between border-b border-guest-border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <h2
                    id={`order-heading-${order.id}`}
                    className="font-mono text-sm font-bold text-guest-text-primary"
                  >
                    Order #{orderNumShort}
                  </h2>
                  {orderedList.length > 1 && isUrlOrder && (
                    <span className="text-[11px] font-medium bg-guest-surface-sunken text-guest-text-secondary px-1.5 py-0.5 rounded">
                      This order
                    </span>
                  )}
                </div>
                <span className="text-xs text-guest-text-secondary">
                  {placedTime}
                </span>
              </div>

              {/* Order Status Timeline */}
              <OrderStatusTimeline
                currentState={order.state}
                stateChanges={order.stateChanges}
                placeType={order.placeType}
                locale={locale}
              />

              {/* Collapsible Items List */}
              <details
                open={index === 0}
                className="group rounded-md bg-guest-surface border border-guest-border-subtle overflow-hidden"
              >
                <summary className="flex items-center justify-between p-3 cursor-pointer select-none font-medium text-xs text-guest-text-primary hover:bg-guest-surface-sunken transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span>
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "item" : "items"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-guest-text-secondary">
                      {formatMoney(order.total, currency, locale)}
                    </span>
                    <svg
                      className="size-3.5 text-guest-text-secondary transition-transform duration-guest-base group-open:rotate-180"
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
                  </div>
                </summary>

                <div className="px-3 pb-3 border-t border-guest-border-subtle pt-2.5">
                  <ul
                    className="divide-y divide-guest-border-subtle"
                    role="list"
                  >
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
                        <li key={item.id} className="py-2 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="font-mono text-xs font-medium text-guest-text-secondary">
                                  {item.quantity}×
                                </span>
                                <span className="text-xs font-medium text-guest-text-primary">
                                  {item.itemName}
                                </span>
                              </div>
                              {modifiers.length > 0 && (
                                <p className="mt-0.5 text-[11px] text-guest-text-secondary pl-5">
                                  {modifiers.join(", ")}
                                </p>
                              )}
                              {item.notes && (
                                <p className="mt-0.5 text-[11px] italic text-guest-text-muted pl-5">
                                  &ldquo;{item.notes}&rdquo;
                                </p>
                              )}
                            </div>
                            <span className="font-mono text-xs font-medium text-guest-text-primary shrink-0">
                              {formatMoney(item.lineTotal, currency, locale)}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Order Financial Breakdown */}
                  <div className="mt-2.5 pt-2.5 border-t border-guest-border-subtle space-y-1 text-xs">
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
                    <div className="flex justify-between pt-1.5 border-t border-guest-border-subtle font-medium text-guest-text-primary">
                      <span>Order total</span>
                      <span className="font-mono">
                        {formatMoney(order.total, currency, locale)}
                      </span>
                    </div>
                  </div>
                </div>
              </details>
            </article>
          );
        })}

        {/* Combined Bill Total Block (D-4.5) */}
        <section
          aria-labelledby="combined-bill-heading"
          className="rounded-lg bg-guest-surface-raised border border-guest-border-subtle p-5 shadow-sm"
        >
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2
                id="combined-bill-heading"
                className="text-base font-semibold text-guest-text-primary"
              >
                Total for all orders
              </h2>
              <p className="mt-1 text-xs text-guest-text-secondary">
                Your orders will be combined into one bill.
              </p>
            </div>
            <span className="font-mono text-xl font-bold text-guest-text-primary shrink-0">
              {combinedTotalFormatted}
            </span>
          </div>
        </section>

        {/* Actions (DESIGN.md §4.8.5) */}
        <div className="pt-2 space-y-3">
          <div className="space-y-1.5">
            <Link
              href="/menu"
              className="w-full h-11 rounded-md border border-guest-border-strong bg-transparent text-guest-text-primary font-medium text-sm inline-flex items-center justify-center hover:bg-guest-surface-sunken transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Add more items
            </Link>
            <p className="text-center text-xs text-guest-text-secondary">
              This will start a new order.
            </p>
          </div>

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
