/**
 * Guest Requests Page.
 *
 * Provides the guest's combined view of all active service requests for
 * their session — one card per request, each with the service type,
 * submission time, and the current state lifecycle via RequestStatusTimeline.
 *
 * Reference: PRODUCT.md §6.12 (the combined requests view),
 * DESIGN.md §4.6.17.7 (request status timeline), D-5.1 (generic request
 * structure), D-8.4 (the tracking screen shows live status; polling is not
 * required on this summary page).
 */

import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Inbox } from "lucide-react";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { RequestState, HotelService } from "@/domain/requests/request.repository";
import { RequestStatusTimeline } from "@/components/guest/request-status-timeline";
import { formatDateTime } from "@/lib/date";

export const metadata: Metadata = {
  title: "Requests",
  robots: { index: false },
};

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

export default async function RequestsPage(): Promise<JSX.Element> {
  const cookie = await getGuestCookie();
  if (!cookie) redirect("/");

  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const session = await getGuestSession({ repo: guestRepo }, cookie);
  if (!session.ok) redirect("/");

  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venue.ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 text-center">
        <p className="text-base text-guest-text-muted">
          We couldn't load the venue.
        </p>
      </div>
    );
  }

  let placeContext: string | null = null;
  if (session.value.placeType === PlaceType.ROOM) {
    const room = await prisma.room.findUnique({ where: { id: session.value.placeId } });
    if (room) placeContext = `Room ${room.number}`;
  } else if (session.value.placeType === PlaceType.TABLE) {
    const table = await prisma.table.findUnique({ where: { id: session.value.placeId } });
    if (table) placeContext = `Table ${table.number}`;
  }

  // Fetch all requests for the guest's session
  const requestRepo = createPrismaServiceRequestRepository(prisma);
  const requestsResult = await requestRepo.listForGuestSession!(
    venue.value.id,
    session.value.id
  );

  const allRequests = requestsResult.ok ? requestsResult.value : [];
  const activeRequests = allRequests.filter((r) => ACTIVE_STATES.includes(r.state));
  const pastRequests = allRequests
    .filter((r) => TERMINAL_STATES.includes(r.state))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const locale = venue.value.language === "en" ? "en-US" : venue.value.language;

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
              {venue.value.name}
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
                <RequestStatusTimeline
                  currentState={req.state}
                  stateChanges={req.stateChanges}
                  serviceType={req.serviceType}
                  locale={locale}
                />
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
    </main>
  );
}

