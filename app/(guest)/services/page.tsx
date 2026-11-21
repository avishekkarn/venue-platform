import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaServiceRepository } from "@/infrastructure/db/repositories/service.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { GuestHero } from "@/components/guest/hero";
import { JoinRequestScript } from "@/components/guest/join-request-script";
import { Button } from "@/components/ui/button";
import { PhoneCall, Clock, X } from "lucide-react";
import { ServiceList } from "./_service-list";

export const metadata: Metadata = {
  title: "Services",
  robots: {
    index: false,
  },
};

export default async function ServicesPage(): Promise<JSX.Element> {
  const cookie = await getGuestCookie();
  if (!cookie) {
    redirect("/");
  }

  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const session = await getGuestSession({ repo: guestRepo }, cookie);
  if (!session.ok) {
    redirect("/");
  }

  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(getVenueSlug());
  if (!venue.ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 text-center">
        <p className="text-base text-guest-text-muted">
          We couldn&apos;t load the venue.
        </p>
      </div>
    );
  }

  let placeContext: string | null = null;
  if (session.value.placeType === PlaceType.TABLE) {
    const table = await prisma.table.findUnique({
      where: { id: session.value.placeId },
    });
    if (table) {
      placeContext = `Table ${table.number}`;
    }
  } else if (session.value.placeType === PlaceType.ROOM) {
    const room = await prisma.room.findUnique({
      where: { id: session.value.placeId },
    });
    if (room) {
      placeContext = `Room ${room.number}`;
    }
  }

  const serviceRepo = createPrismaServiceRepository(prisma);
  const catalogResult = await serviceRepo.getFullServiceCatalog(venue.value.id);
  const fullCatalog = catalogResult.ok ? catalogResult.value : [];
  const categories = fullCatalog
    .map((c) => ({
      ...c,
      items: c.items.filter((i) => i.state === MenuItemState.AVAILABLE),
    }))
    .filter((c) => c.items.length > 0);

  const currency = venue.value.currency || "NPR";
  const initialSignature = categories
    .map(
      (cat) =>
        `${cat.id}:${cat.items.map((it) => `${it.id}:${it.state}:${it.price}`).join(",")}`
    )
    .join("|");

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)]">
      <GuestHero venue={venue.value} placeContext={placeContext} />
      <div className="mt-4 flex justify-center animate-in fade-in duration-700 delay-500 ease-guest-entrance">
        <Button size="xl" variant="primary">
          Explore Services
        </Button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 flex-wrap px-4 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <button
          type="button"
          id="btn-call-front-desk"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5 text-guest-brand" />
          <span>Call Front Desk</span>
        </button>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-guest-surface-raised border border-guest-border-subtle text-guest-text-primary hover:border-guest-brand hover:text-guest-brand transition-all shadow-xs"
        >
          <Clock className="w-3.5 h-3.5 text-guest-brand" />
          <span>View Requests</span>
        </Link>
      </div>

      {/* Front desk dialer modal */}
      <div
        id="front-desk-modal"
        style={{ display: "none" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="front-desk-modal-title"
      >
        <div className="relative w-full max-w-sm rounded-2xl bg-guest-surface-raised border border-guest-border-subtle p-6 shadow-xl flex flex-col items-center text-center gap-4">
          <button
            type="button"
            id="close-front-desk-modal"
            className="absolute top-4 right-4 p-1.5 rounded-full text-guest-text-muted hover:text-guest-text-primary hover:bg-guest-surface-sunken transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 rounded-full bg-guest-brand/10 text-guest-brand flex items-center justify-center">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 id="front-desk-modal-title" className="font-display text-lg font-semibold text-guest-text-primary">
              Front Desk Assistance
            </h3>
            <p className="text-xs text-guest-text-secondary">
              Our front desk team is on duty 24/7 to assist with any request or inquiry.
            </p>
          </div>
          <div className="w-full flex flex-col gap-2 pt-2">
            <a
              href="tel:+97714200000"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all shadow-sm"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Dial Now (+977 1-4200000)</span>
            </a>
            <div className="rounded-lg bg-guest-surface-sunken border border-guest-border-subtle/50 p-2.5 text-xs text-guest-text-secondary">
              From your in-room telephone: <span className="font-semibold text-guest-text-primary">Dial 0</span>
            </div>
          </div>
        </div>
      </div>

      {categories.length > 0 ? (
        <ServiceList categories={categories} currency={currency} />
      ) : (
        <div className="mt-6 text-center text-sm text-guest-text-muted">
          No services are currently available.
        </div>
      )}

      <div className="mt-8 max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
        <div className="flex flex-row items-start justify-center gap-4 md:gap-8 text-center">
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              1.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Choose a service.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              2.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              Tell us what you need.
            </span>
          </div>
          <div>
            <span className="font-display text-xl text-guest-brand mb-2 block">
              3.
            </span>
            <span className="text-xs md:text-sm font-semibold text-guest-text-primary">
              We take care of it.
            </span>
          </div>
        </div>
      </div>
      <footer className="mt-6 mb-4 text-center text-xs text-guest-text-muted">
        <p className="font-display text-guest-text-secondary">{venue.value.name}</p>
        <p className="mt-1 text-[10px]">Open daily. Powered by IronMan.</p>
      </footer>
      <JoinRequestScript />

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var currentSignature = ${JSON.stringify(initialSignature)};
  var lastReloadTime = 0;

  var openModalBtn = document.getElementById('btn-call-front-desk');
  var closeModalBtn = document.getElementById('close-front-desk-modal');
  var frontDeskModal = document.getElementById('front-desk-modal');

  if (openModalBtn && frontDeskModal) {
    openModalBtn.addEventListener('click', function() {
      frontDeskModal.style.display = 'flex';
    });
  }
  if (closeModalBtn && frontDeskModal) {
    closeModalBtn.addEventListener('click', function() {
      frontDeskModal.style.display = 'none';
    });
  }
  if (frontDeskModal) {
    frontDeskModal.addEventListener('click', function(e) {
      if (e.target === frontDeskModal) {
        frontDeskModal.style.display = 'none';
      }
    });
  }

  function checkServiceStates() {
    if (document.visibilityState !== 'visible') return;

    fetch('/api/guest/services/states')
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function(json) {
        if (!json || typeof json.signature !== 'string') return;
        if (json.signature !== currentSignature) {
          var now = Date.now();
          if (now - lastReloadTime > 2000) {
            lastReloadTime = now;
            window.location.reload();
          }
        }
      })
      .catch(function() {});
  }

  setInterval(checkServiceStates, 5000);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      checkServiceStates();
    }
  });
})();
`,
        }}
      />
    </div>
  );
}
