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
              data-order-card={order.id}
              data-order-state={order.state}
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
              <div data-timeline-container={order.id}>
                <OrderStatusTimeline
                  currentState={order.state}
                  stateChanges={order.stateChanges}
                  placeType={order.placeType}
                  locale={locale}
                />
              </div>

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

        {/* Actions (DESIGN.md §4.8.5, §4.6.17.18, §4.13.2) */}
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

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              id="btn-call-waiter"
              type="button"
              className="w-full h-10 rounded-md border border-guest-border-strong bg-transparent text-guest-text-primary font-medium text-sm inline-flex items-center justify-center hover:bg-guest-surface-sunken transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Call a waiter
            </button>
            <button
              id="btn-request-bill"
              type="button"
              className="w-full h-10 rounded-md border border-guest-border-strong bg-transparent text-guest-text-primary font-medium text-sm inline-flex items-center justify-center hover:bg-guest-surface-sunken transition-all select-none outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Request the bill
            </button>
          </div>

          <div
            id="call-status-message"
            className="hidden text-center text-sm font-medium py-2 px-3 rounded-md transition-all"
            role="status"
            aria-live="polite"
          />
        </div>
      </main>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var callWaiterBtn = document.getElementById('btn-call-waiter');
  var requestBillBtn = document.getElementById('btn-request-bill');
  var statusMsg = document.getElementById('call-status-message');
  var orderId = ${JSON.stringify(urlOrder.id)};
  var inFlight = false;

  function showStatus(text, isError) {
    if (!statusMsg) return;
    statusMsg.textContent = text;
    statusMsg.className = isError
      ? 'text-center text-sm font-medium py-2 px-3 rounded-md bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900 transition-all block'
      : 'text-center text-sm font-medium py-2 px-3 rounded-md bg-guest-surface-sunken text-guest-text-primary border border-guest-border-subtle transition-all block';
  }

  function sendCall(type) {
    if (inFlight) return;
    inFlight = true;

    if (callWaiterBtn) callWaiterBtn.disabled = true;
    if (requestBillBtn) requestBillBtn.disabled = true;

    showStatus('Sending request...', false);

    fetch('/api/guest/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: type,
        orderId: orderId,
      }),
    })
    .then(function(res) {
      return res.json().then(function(data) {
        return { ok: res.ok, status: res.status, data: data };
      });
    })
    .then(function(result) {
      inFlight = false;
      if (!result.ok) {
        var err = (result.data && result.data.error && result.data.error.message) || 'Failed to submit request';
        showStatus(err, true);
        if (callWaiterBtn) callWaiterBtn.disabled = false;
        if (requestBillBtn) requestBillBtn.disabled = false;
        return;
      }

      if (type === 'WAITER') {
        showStatus('A waiter is on the way.', false);
        if (callWaiterBtn) {
          callWaiterBtn.disabled = true;
          callWaiterBtn.textContent = 'Waiter called';
        }
        if (requestBillBtn) requestBillBtn.disabled = false;
      } else {
        showStatus('The bill is on its way.', false);
        if (requestBillBtn) {
          requestBillBtn.disabled = true;
          requestBillBtn.textContent = 'Bill requested';
        }
        if (callWaiterBtn) callWaiterBtn.disabled = false;
      }
    })
    .catch(function() {
      inFlight = false;
      showStatus('Network error. Please try again.', true);
      if (callWaiterBtn) callWaiterBtn.disabled = false;
      if (requestBillBtn) requestBillBtn.disabled = false;
    });
  }

  if (callWaiterBtn) {
    callWaiterBtn.addEventListener('click', function() {
      sendCall('WAITER');
    });
  }

  if (requestBillBtn) {
    requestBillBtn.addEventListener('click', function() {
      sendCall('BILL');
    });
  }
})();
`,
        }}
      />

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var locale = ${JSON.stringify(locale)};

  function formatTimeSimple(dateStr, loc) {
    try {
      var d = new Date(dateStr);
      return d.toLocaleTimeString(loc || 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  }

  function renderTimelineHtml(state, placeType, stateChanges, loc) {
    var ORDER_FLOW = [
      { state: 'PLACED', label: 'Placed', copy: 'We have your order.' },
      { state: 'APPROVED', label: 'Approved', copy: 'The kitchen has accepted it.' },
      { state: 'PREPARING', label: 'Preparing', copy: 'The kitchen is on it.' },
      {
        state: 'READY',
        label: 'Ready',
        copy: placeType === 'ROOM' ? 'Ready for your room.' : (placeType === 'COUNTER' ? 'Ready for pickup.' : 'Ready for your table.')
      },
      {
        state: 'DELIVERED',
        label: 'Delivered',
        copy: placeType === 'COUNTER' ? 'Order picked up.' : 'Delivered.'
      },
      { state: 'COMPLETED', label: 'Completed', copy: 'Enjoy.' }
    ];

    var ORDER_FLOW_INDEX = {
      'PLACED': 0,
      'APPROVED': 1,
      'PREPARING': 2,
      'READY': 3,
      'DELIVERED': 4,
      'COMPLETED': 5,
      'CANCELLED': -1
    };

    var stateTimeMap = {};
    if (Array.isArray(stateChanges)) {
      for (var scIdx = 0; scIdx < stateChanges.length; scIdx++) {
        var sc = stateChanges[scIdx];
        stateTimeMap[sc.state] = sc.occurredAt;
      }
    }

    var steps = [];
    if (state === 'CANCELLED') {
      for (var f = 0; f < ORDER_FLOW.length; f++) {
        var it = ORDER_FLOW[f];
        if (stateTimeMap[it.state]) {
          steps.push({
            state: it.state,
            label: it.label,
            copy: it.copy,
            status: 'completed',
            timeStr: formatTimeSimple(stateTimeMap[it.state], loc)
          });
        }
      }
      steps.push({
        state: 'CANCELLED',
        label: 'Cancelled',
        copy: 'Order was cancelled.',
        status: 'cancelled',
        timeStr: stateTimeMap['CANCELLED'] ? formatTimeSimple(stateTimeMap['CANCELLED'], loc) : null
      });
    } else {
      var currentIndex = ORDER_FLOW_INDEX[state] !== undefined ? ORDER_FLOW_INDEX[state] : 0;
      for (var i = 0; i < ORDER_FLOW.length; i++) {
        var item = ORDER_FLOW[i];
        var status = 'future';
        if (i < currentIndex) {
          status = 'completed';
        } else if (i === currentIndex) {
          status = 'current';
        }
        var timeStr = stateTimeMap[item.state] ? formatTimeSimple(stateTimeMap[item.state], loc) : null;
        steps.push({
          state: item.state,
          label: item.label,
          copy: item.copy,
          status: status,
          timeStr: timeStr
        });
      }
    }

    var html = '<div class="w-full"><div class="space-y-0" role="list">';
    for (var s = 0; s < steps.length; s++) {
      var step = steps[s];
      var isLast = s === steps.length - 1;

      var connectorHtml = !isLast ?
        '<div class="absolute left-[15px] top-[28px] bottom-[-4px] w-[2px] ' +
        (step.status === 'completed' ? 'bg-guest-brand' : 'bg-guest-border-subtle') +
        '" aria-hidden="true"></div>' : '';

      var dotHtml = '';
      if (step.status === 'completed') {
        dotHtml = '<div class="size-6 rounded-full bg-guest-brand text-guest-brand-contrast flex items-center justify-center transition-colors duration-guest-base"><svg class="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5L6.5 11.5L12.5 4.5"></path></svg></div>';
      } else if (step.status === 'current') {
        dotHtml = '<div class="timeline-dot-current size-6 rounded-full bg-guest-brand text-guest-brand-contrast flex items-center justify-center ring-4 ring-guest-brand/20"><div class="size-2 rounded-full bg-guest-brand-contrast"></div></div>';
      } else if (step.status === 'future') {
        dotHtml = '<div class="size-6 rounded-full border-2 border-guest-border-subtle bg-guest-surface-sunken"></div>';
      } else if (step.status === 'cancelled') {
        dotHtml = '<div class="size-6 rounded-full bg-status-cancelled text-status-cancelled-contrast flex items-center justify-center"><svg class="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4L12 12M12 4L4 12"></path></svg></div>';
      }

      var titleClass = step.status === 'current' ? 'text-guest-brand font-semibold' : (step.status === 'completed' ? 'text-guest-text-primary' : (step.status === 'cancelled' ? 'text-status-cancelled font-semibold' : 'text-guest-text-muted'));
      var copyClass = step.status === 'current' ? 'text-guest-text-primary' : (step.status === 'future' ? 'text-guest-text-muted/60' : 'text-guest-text-secondary');
      var timeHtml = step.timeStr ? '<span class="font-mono text-xs text-guest-text-secondary shrink-0">' + step.timeStr + '</span>' : '';

      html += '<div class="relative flex items-start gap-4" role="listitem">' +
        connectorHtml +
        '<div class="relative z-10 flex size-8 shrink-0 items-center justify-center">' + dotHtml + '</div>' +
        '<div class="flex-1 min-w-0 pb-6">' +
          '<div class="flex items-baseline justify-between gap-2">' +
            '<h3 class="text-sm font-medium ' + titleClass + '">' + step.label + '</h3>' +
            timeHtml +
          '</div>' +
          '<p class="text-xs mt-0.5 ' + copyClass + '">' + step.copy + '</p>' +
        '</div>' +
      '</div>';
    }
    html += '</div></div>';
    return html;
  }

  function pollOrders() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/orders')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(result) {
        if (!result || !Array.isArray(result.data)) return;
        var orders = result.data;
        for (var i = 0; i < orders.length; i++) {
          var o = orders[i];
          var card = document.querySelector('[data-order-card="' + o.id + '"]');
          var container = document.querySelector('[data-timeline-container="' + o.id + '"]');
          if (card && container) {
            var prevState = card.getAttribute('data-order-state');
            if (prevState !== o.state) {
              card.setAttribute('data-order-state', o.state);
              container.innerHTML = renderTimelineHtml(o.state, o.placeType, o.stateChanges, locale);
            }
          }
        }
      })
      .catch(function() {});
  }

  setInterval(pollOrders, 5000);

  // Host Join Request Banner Poller
  var BANNER_ID = 'host-join-request-banner';
  var inFlightAction = false;

  function removeBanner() {
    var b = document.getElementById(BANNER_ID);
    if (b && b.parentNode) {
      b.parentNode.removeChild(b);
    }
  }

  function handleAction(requestId, action) {
    if (inFlightAction) return;
    inFlightAction = true;
    fetch('/api/guest/join-requests/' + encodeURIComponent(requestId) + '/' + action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    .then(function() {
      inFlightAction = false;
      removeBanner();
    })
    .catch(function() {
      inFlightAction = false;
    });
  }

  function renderBanner(req) {
    var existing = document.getElementById(BANNER_ID);
    if (existing) {
      if (existing.getAttribute('data-request-id') === req.id) {
        return;
      }
      removeBanner();
    }

    var banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.setAttribute('data-request-id', req.id);
    banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[440px] bg-guest-surface-raised border border-guest-border-strong shadow-2xl rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-300';

    var headerRow = document.createElement('div');
    headerRow.className = 'flex items-center gap-3';

    var iconWrapper = document.createElement('div');
    iconWrapper.className = 'size-9 rounded-full bg-guest-brand/10 text-guest-brand flex items-center justify-center shrink-0';
    iconWrapper.innerHTML = '<svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';

    var textCol = document.createElement('div');
    textCol.className = 'flex-1 min-w-0';

    var title = document.createElement('p');
    title.className = 'text-sm font-semibold text-guest-text-primary leading-tight truncate';
    title.textContent = req.name + ' wants to join';

    var subtitle = document.createElement('p');
    subtitle.className = 'text-xs text-guest-text-secondary mt-0.5';
    subtitle.textContent = 'Allow this device to join your session and order.';

    textCol.appendChild(title);
    textCol.appendChild(subtitle);
    headerRow.appendChild(iconWrapper);
    headerRow.appendChild(textCol);

    var btnRow = document.createElement('div');
    btnRow.className = 'flex items-center gap-2.5 pt-1';

    var declineBtn = document.createElement('button');
    declineBtn.type = 'button';
    declineBtn.className = 'h-9 px-4 rounded-md border border-guest-border-strong text-guest-text-secondary text-xs font-medium hover:bg-guest-surface-sunken transition-all outline-none';
    declineBtn.textContent = 'Decline';
    declineBtn.addEventListener('click', function() {
      declineBtn.disabled = true;
      declineBtn.textContent = 'Declining…';
      handleAction(req.id, 'decline');
    });

    var approveBtn = document.createElement('button');
    approveBtn.type = 'button';
    approveBtn.className = 'flex-1 h-9 rounded-md bg-guest-brand text-guest-brand-contrast text-xs font-semibold hover:brightness-95 transition-all outline-none';
    approveBtn.textContent = 'Approve';
    approveBtn.addEventListener('click', function() {
      approveBtn.disabled = true;
      approveBtn.textContent = 'Approving…';
      handleAction(req.id, 'approve');
    });

    btnRow.appendChild(declineBtn);
    btnRow.appendChild(approveBtn);

    banner.appendChild(headerRow);
    banner.appendChild(btnRow);
    document.body.appendChild(banner);
  }

  function pollJoinRequests() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/join-requests')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(result) {
        if (!result || !Array.isArray(result.data)) {
          removeBanner();
          return;
        }
        var requests = result.data;
        if (requests.length === 0) {
          removeBanner();
          return;
        }
        renderBanner(requests[0]);
      })
      .catch(function() {});
  }

  setInterval(pollJoinRequests, 5000);
  pollJoinRequests();
})();
`,
        }}
      />
    </div>
  );
}
