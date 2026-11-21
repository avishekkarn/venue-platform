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
      <div className="mt-2 flex items-center justify-center gap-2 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <Button variant="ghost" size="sm">
          Call the front desk
        </Button>
        <Link href="/requests">
          <Button variant="ghost" size="sm">
            View requests
          </Button>
        </Link>
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
