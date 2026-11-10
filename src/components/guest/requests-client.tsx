"use client";

import type { JSX } from "react";
import Link from "next/link";
import { ArrowLeft, Inbox } from "lucide-react";
import {
  RequestState,
  HotelService,
  type ServiceRequest,
} from "@/domain/requests/request.repository";
import { RequestStatusTimeline } from "@/components/guest/request-status-timeline";
import { formatDateTime } from "@/lib/date";

export interface RequestsClientProps {
  readonly initialRequests: readonly ServiceRequest[];
  readonly placeContext: string | null;
  readonly venueName: string;
  readonly locale: string;
}

const SERVICE_LABELS: Record<HotelService, string> = {
  ROOM_SERVICE_FOOD: "Room Service",
  HOUSEKEEPING: "Housekeeping",
  MAINTENANCE: "Maintenance",
  CONCIERGE: "Concierge",
  LAUNDRY: "Laundry",
  SPA: "Spa",
  LATE_CHECKOUT: "Late Checkout",
  WAKE_UP_CALL: "Wake-up Call",
  DO_NOT_DISTURB: "Do Not Disturb",
  CALL_WAITER: "Call Waiter",
  REQUEST_BILL: "Request Bill",
};

const ACTIVE_STATES: readonly RequestState[] = [
  RequestState.SUBMITTED,
  RequestState.ACKNOWLEDGED,
  RequestState.IN_PROGRESS,
];

const TERMINAL_STATES: readonly RequestState[] = [
  RequestState.COMPLETED,
  RequestState.CANCELLED,
  RequestState.DECLINED,
];

export function RequestsClient({
  initialRequests,
  placeContext,
  venueName,
  locale,
}: RequestsClientProps): JSX.Element {
  const activeRequests = initialRequests.filter((r) => ACTIVE_STATES.includes(r.state));
  const pastRequests = initialRequests
    .filter((r) => TERMINAL_STATES.includes(r.state))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <main data-world="guest" className="min-h-dvh bg-guest-surface text-guest-text-primary px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-guest-text-secondary hover:text-guest-text-primary transition-colors w-fit focus-visible:outline-none"
            aria-label="Back to services"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Services</span>
          </Link>
          <div className="mt-2">
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Your requests
            </h1>
            <p className="text-sm text-guest-text-secondary mt-1">
              {venueName}
              {placeContext ? ` · ${placeContext}` : ""}
            </p>
          </div>
        </header>

        {activeRequests.length === 0 ? (
          <div className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-8 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-guest-surface-sunken flex items-center justify-center text-guest-brand">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-lg font-semibold text-guest-text-primary">
                No active requests
              </h2>
              <p className="text-sm text-guest-text-secondary max-w-sm">
                When you submit a service request, you'll see its progress here.
              </p>
            </div>
            <Link
              href="/services"
              className="mt-2 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all"
            >
              Browse services
            </Link>
          </div>
        ) : (
          <section className="flex flex-col gap-4">
            <h2 className="font-display text-lg font-semibold text-guest-text-primary">
              Active ({activeRequests.length})
            </h2>
            {activeRequests.map((req) => (
              <article
                key={req.id}
                data-request-card={req.id}
                data-request-state={req.state}
                className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-5 flex flex-col gap-4"
              >
                <header className="flex items-baseline justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-guest-text-primary">
                      {SERVICE_LABELS[req.serviceType] ?? req.serviceType}
                    </h3>
                    <p className="text-xs text-guest-text-muted mt-0.5">
                      Requested {formatDateTime(new Date(req.submittedAt), locale)}
                    </p>
                  </div>
                </header>
                <div data-timeline-container={req.id}>
                  <RequestStatusTimeline
                    currentState={req.state}
                    stateChanges={req.stateChanges}
                    serviceType={req.serviceType}
                    locale={locale}
                  />
                </div>
              </article>
            ))}
          </section>
        )}

        {pastRequests.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-base font-semibold text-guest-text-secondary">
              Recent history
            </h2>
            {pastRequests.map((req) => (
              <article
                key={req.id}
                className="bg-guest-surface-raised border border-guest-border-subtle rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-guest-text-primary">
                    {SERVICE_LABELS[req.serviceType] ?? req.serviceType}
                  </p>
                  <p className="text-xs text-guest-text-muted mt-0.5">
                    {formatDateTime(new Date(req.submittedAt), locale)}
                  </p>
                </div>
                <span className="text-xs font-medium text-guest-text-secondary">
                  {req.state}
                </span>
              </article>
            ))}
          </section>
        )}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
/*
 * POLLING HTML XSS CONTRACT (task 7.6.8, decisions D-19.1 and D-19.2)
 *
 * Every string passed to renderTimelineHtml (or interpolated into the
 * container.innerHTML) MUST come from one of:
 *   1. The FLOW constant defined inside this script (labels and copy).
 *   2. The FLOW_INDEX enum (derived from the request's \`state\` field, which
 *      the API route validates against \`HotelService\` and \`RequestState\`).
 *   3. The \`occurredAt\` timestamps from \`stateChanges\`, formatted by
 *      formatTimeSimple (a fixed toLocaleTimeString output).
 *
 * None of those are user-supplied. Today's polling surface has zero XSS
 * vectors by construction.
 *
 * Phase 9 will add free-text service request details (guest notes,
 * maintenance descriptions). At the moment those are first interpolated
 * into a polling HTML string, an escapeHtml(str) function MUST be added
 * inside this script and applied to every details field before
 * concatenation. Do not interpolate user input without it.
 *
 * A future session that adds a new field to the polling HTML must also
 * add it to this contract. A field not listed here is not covered by the
 * guarantee.
 */
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

  function renderTimelineHtml(state, serviceType, stateChanges, loc) {
    var FLOW = [
      { state: 'SUBMITTED', label: 'Submitted', copy: 'We have your request.' },
      { state: 'ACKNOWLEDGED', label: 'Acknowledged', copy: 'Staff have seen it.' },
      { state: 'IN_PROGRESS', label: 'In progress', copy: 'Staff are on it.' },
      { state: 'COMPLETED', label: 'Completed', copy: 'Done.' }
    ];
    var FLOW_INDEX = {
      'SUBMITTED': 0, 'ACKNOWLEDGED': 1, 'IN_PROGRESS': 2, 'COMPLETED': 3,
      'CANCELLED': -1, 'DECLINED': -1
    };

    var stateTimeMap = {};
    if (Array.isArray(stateChanges)) {
      for (var scIdx = 0; scIdx < stateChanges.length; scIdx++) {
        var sc = stateChanges[scIdx];
        stateTimeMap[sc.state] = sc.occurredAt;
      }
    }

    var steps = [];
    if (state === 'CANCELLED' || state === 'DECLINED') {
      for (var f = 0; f < FLOW.length; f++) {
        var it = FLOW[f];
        if (stateTimeMap[it.state]) {
          steps.push({ state: it.state, label: it.label, copy: it.copy, status: 'completed', timeStr: formatTimeSimple(stateTimeMap[it.state], loc) });
        }
      }
      var term = state === 'CANCELLED' ? 'Cancelled' : 'Declined';
      steps.push({
        state: state, label: term,
        copy: state === 'CANCELLED' ? 'Request was cancelled.' : 'Staff could not fulfil the request.',
        status: 'cancelled',
        timeStr: stateTimeMap[state] ? formatTimeSimple(stateTimeMap[state], loc) : null
      });
    } else {
      var currentIndex = FLOW_INDEX[state] !== undefined ? FLOW_INDEX[state] : 0;
      for (var i = 0; i < FLOW.length; i++) {
        var item = FLOW[i];
        var status = 'future';
        if (i < currentIndex) status = 'completed';
        else if (i === currentIndex) status = 'current';
        var timeStr = stateTimeMap[item.state] ? formatTimeSimple(stateTimeMap[item.state], loc) : null;
        steps.push({ state: item.state, label: item.label, copy: item.copy, status: status, timeStr: timeStr });
      }
    }

    var html = '<div class="w-full"><div class="space-y-0" role="list">';
    for (var s = 0; s < steps.length; s++) {
      var step = steps[s];
      var isLast = s === steps.length - 1;
      var connectorHtml = !isLast ? '<div class="absolute left-[15px] top-[28px] bottom-[-4px] w-[2px] ' + (step.status === 'completed' ? 'bg-guest-brand' : 'bg-guest-border-subtle') + '" aria-hidden="true"></div>' : '';
      
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

      html += '<div class="relative flex items-start gap-4" role="listitem">' + connectorHtml + '<div class="relative z-10 flex size-8 shrink-0 items-center justify-center">' + dotHtml + '</div><div class="flex-1 min-w-0 pb-6"><div class="flex items-baseline justify-between gap-2"><h3 class="text-sm font-medium ' + titleClass + '">' + step.label + '</h3>' + timeHtml + '</div><p class="text-xs mt-0.5 ' + copyClass + '">' + step.copy + '</p></div></div>';
    }
    html += '</div></div>';
    return html;
  }

  function pollRequests() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/requests')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(result) {
        if (!result || !Array.isArray(result.data)) return;
        var requests = result.data;
        for (var i = 0; i < requests.length; i++) {
          var r = requests[i];
          var card = document.querySelector('[data-request-card="' + r.id + '"]');
          var container = document.querySelector('[data-timeline-container="' + r.id + '"]');
          if (container) {
            var prevState = card ? card.getAttribute('data-request-state') : null;
            if (r.state === 'COMPLETED' || r.state === 'CANCELLED' || r.state === 'DECLINED') {
              window.location.reload();
              return;
            }
            if (!prevState || prevState !== r.state) {
              if (card) card.setAttribute('data-request-state', r.state);
              container.innerHTML = renderTimelineHtml(r.state, r.serviceType, r.stateChanges, locale);
            }
          }
        }
      })
      .catch(function() {});
  }

  setInterval(pollRequests, 5000);
  pollRequests();
})();
`,
        }}
      />
    </main>
  );
}
