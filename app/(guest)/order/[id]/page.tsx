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

export const metadata: Metadata = {
  title: "Order Confirmation",
  robots: {
    index: false,
  },
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface OrderConfirmationPageProps {
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

export default async function OrderConfirmationPage({
  params,
}: OrderConfirmationPageProps): Promise<JSX.Element> {
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
    <main className="min-h-dvh px-4 py-10 sm:py-16">
      <style>{`
        @keyframes drawCheck {
          from {
            stroke-dashoffset: 40;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-draw-check {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawCheck 600ms cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .animate-fade-in-headline {
          opacity: 0;
          animation: fadeIn 400ms ease-out 200ms forwards;
        }
        .animate-fade-in-content {
          opacity: 0;
          animation: fadeIn 400ms ease-out 400ms forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-draw-check {
            stroke-dashoffset: 0 !important;
            animation: none !important;
          }
          .animate-fade-in-headline,
          .animate-fade-in-content {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>

      <div className="w-full max-w-[480px] mx-auto">
        {/* Animated Check Mark */}
        <div className="flex justify-center mb-6">
          <div className="size-20 rounded-full bg-guest-surface-sunken flex items-center justify-center">
            <svg
              className="size-10 text-guest-brand"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M14 24.5L21 31.5L34 16.5"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-draw-check"
              />
            </svg>
          </div>
        </div>

        {/* Headline & Order Number */}
        <div className="text-center animate-fade-in-headline">
          <h1 className="font-display text-[28px] sm:text-[32px] leading-[34px] sm:leading-[38px] text-guest-text-primary">
            Your order is on its way.
          </h1>
          <p className="mt-2 font-mono text-sm font-medium text-guest-text-secondary">
            Order #{orderNumberShort}
          </p>
        </div>

        {/* Summary Card & Items List */}
        <div className="mt-8 animate-fade-in-content">
          <div className="rounded-lg bg-guest-surface-raised border border-guest-border-subtle p-4 sm:p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-guest-text-muted mb-3">
              Order Summary
            </h2>
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
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
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

            {/* Financial Totals */}
            <div className="mt-4 pt-4 border-t border-guest-border-subtle space-y-1.5 text-sm">
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

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Link
              href={`/order/${order.id}/track`}
              className="w-full h-[52px] rounded-md bg-guest-brand text-guest-brand-contrast font-medium text-base inline-flex items-center justify-center hover:brightness-95 transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Track your order
            </Link>
            <div className="space-y-1.5">
              <Link
                href="/menu"
                className="w-full h-10 rounded-md border border-guest-border-strong bg-transparent text-guest-text-primary font-medium text-sm inline-flex items-center justify-center hover:bg-guest-surface-sunken transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Add more items
              </Link>
              <p className="text-center text-xs text-guest-text-secondary">
                This will start a new order.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

