"use client";

import type { JSX } from "react";
import Link from "next/link";
import { ArrowLeft, UtensilsCrossed, ExternalLink, Clock } from "lucide-react";
import {
  OrderState,
  type Order,
} from "@/domain/orders/order.repository";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/date";

export interface OrdersClientProps {
  readonly initialOrders: readonly Order[];
  readonly placeContext: string | null;
  readonly venueName: string;
  readonly currency: string;
  readonly locale: string;
}

const ACTIVE_ORDER_STATES: readonly OrderState[] = [
  OrderState.PLACED,
  OrderState.PREPARING,
  OrderState.READY,
  OrderState.DELIVERED,
];

const TERMINAL_ORDER_STATES: readonly OrderState[] = [
  OrderState.COMPLETED,
  OrderState.CANCELLED,
];

function getStateBadgeClass(state: OrderState): string {
  switch (state) {
    case OrderState.PLACED:
      return "bg-amber-100 text-amber-800 border-amber-200";
    case OrderState.PREPARING:
      return "bg-blue-100 text-blue-800 border-blue-200";
    case OrderState.READY:
      return "bg-emerald-100 text-emerald-800 border-emerald-200 animate-pulse";
    case OrderState.DELIVERED:
      return "bg-teal-100 text-teal-800 border-teal-200";
    case OrderState.COMPLETED:
      return "bg-guest-surface-sunken text-guest-text-secondary border-guest-border-subtle";
    case OrderState.CANCELLED:
      return "bg-rose-100 text-rose-800 border-rose-200";
    default:
      return "bg-guest-surface-sunken text-guest-text-secondary border-guest-border-subtle";
  }
}

export function OrdersClient({
  initialOrders,
  placeContext,
  venueName,
  currency,
  locale,
}: OrdersClientProps): JSX.Element {
  const activeOrders = initialOrders
    .filter((o) => ACTIVE_ORDER_STATES.includes(o.state))
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  const pastOrders = initialOrders
    .filter((o) => TERMINAL_ORDER_STATES.includes(o.state))
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());

  return (
    <main data-world="guest" className="min-h-dvh bg-guest-surface text-guest-text-primary px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link
            href="/menu"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-guest-text-secondary hover:text-guest-text-primary transition-colors w-fit focus-visible:outline-none"
            aria-label="Back to menu"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu</span>
          </Link>
          <div className="mt-2">
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Your Orders
            </h1>
            <p className="text-sm text-guest-text-secondary mt-1">
              {venueName}
              {placeContext ? ` · ${placeContext}` : ""}
            </p>
          </div>
        </header>

        {initialOrders.length === 0 ? (
          <div className="bg-guest-surface-raised border border-guest-border-subtle rounded-2xl p-8 text-center flex flex-col items-center gap-4 mt-2">
            <div className="w-14 h-14 rounded-full bg-guest-brand/10 text-guest-brand flex items-center justify-center">
              <UtensilsCrossed className="w-7 h-7" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h2 className="font-display text-lg font-semibold text-guest-text-primary">
                No orders yet
              </h2>
              <p className="text-sm text-guest-text-secondary">
                You haven&apos;t placed any food or beverage orders in this session.
              </p>
            </div>
            <Link
              href="/menu"
              className="mt-2 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all shadow-sm"
            >
              Browse Menu & Order →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Active Orders Section */}
            {activeOrders.length > 0 ? (
              <section className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-guest-text-primary">
                    Active Orders
                  </h2>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-guest-brand/10 text-guest-brand">
                    {activeOrders.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {activeOrders.map((order) => (
                    <article
                      key={order.id}
                      className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-guest-border-subtle/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-guest-text-secondary font-medium">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-guest-text-muted flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(order.placedAt, locale)}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStateBadgeClass(
                            order.state
                          )}`}
                        >
                          {order.state.replace("_", " ")}
                        </span>
                      </div>

                      {/* Items List */}
                      <ul className="flex flex-col gap-2 py-1">
                        {order.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-guest-text-primary">
                              <span className="font-semibold text-guest-brand mr-2">
                                {item.quantity}×
                              </span>
                              {item.itemName}
                            </span>
                            <span className="font-medium text-guest-text-secondary text-xs">
                              {formatMoney(item.lineTotal, currency)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* Footer total and link */}
                      <div className="flex items-center justify-between pt-2 border-t border-guest-border-subtle/60">
                        <div className="text-xs text-guest-text-secondary">
                          Total:{" "}
                          <span className="font-bold text-sm text-guest-text-primary">
                            {formatMoney(order.total, currency)}
                          </span>
                        </div>
                        <Link
                          href={`/order/${order.id}/track`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-guest-brand hover:underline"
                        >
                          <span>Track progress</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Past Orders Section */}
            {pastOrders.length > 0 ? (
              <section className="flex flex-col gap-3">
                <h2 className="font-display text-base font-semibold text-guest-text-secondary">
                  Previous Orders
                </h2>
                <div className="flex flex-col gap-3">
                  {pastOrders.map((order) => (
                    <article
                      key={order.id}
                      className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-4 flex flex-col gap-2.5 opacity-90"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-guest-text-secondary font-medium">
                            #{order.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-guest-text-muted">
                            {formatDateTime(order.placedAt, locale)}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStateBadgeClass(
                            order.state
                          )}`}
                        >
                          {order.state.replace("_", " ")}
                        </span>
                      </div>

                      <ul className="flex flex-col gap-1 text-xs text-guest-text-secondary">
                        {order.items.map((item, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>
                              {item.quantity}× {item.itemName}
                            </span>
                            <span>{formatMoney(item.lineTotal, currency)}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between pt-2 border-t border-guest-border-subtle/50 text-xs">
                        <span className="text-guest-text-muted">Total</span>
                        <span className="font-semibold text-guest-text-primary">
                          {formatMoney(order.total, currency)}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var lastSignature = '';

  function checkOrders() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/orders')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(json) {
        if (!json || !Array.isArray(json.data)) return;
        var sig = json.data.map(function(o) { return o.id + ':' + o.state; }).join('|');
        if (lastSignature && lastSignature !== sig) {
          window.location.reload();
        }
        lastSignature = sig;
      })
      .catch(function() {});
  }

  setInterval(checkOrders, 5000);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      checkOrders();
    }
  });
})();
`,
        }}
      />
    </main>
  );
}
