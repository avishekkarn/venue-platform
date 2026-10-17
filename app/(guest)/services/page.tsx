import type { Metadata } from "next";
import type { JSX } from "react";
import { redirect } from "next/navigation";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { GuestHero } from "@/components/guest/hero";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)]">
      <GuestHero venue={venue.value} placeContext={placeContext} />
      <div className="mt-6 flex justify-center animate-in fade-in duration-700 delay-500 ease-guest-entrance">
        <Button size="xl" variant="primary">
          Explore Services
        </Button>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <Button variant="ghost" size="md">
          Call the front desk
        </Button>
        <Button variant="ghost" size="md">
          View requests
        </Button>
      </div>
      <div className="mt-8 max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center">
          <div>
            <span className="font-display text-2xl text-guest-brand mb-2 block">
              1.
            </span>
            <span className="text-sm font-semibold text-guest-text-primary">
              Choose a service.
            </span>
          </div>
          <div>
            <span className="font-display text-2xl text-guest-brand mb-2 block">
              2.
            </span>
            <span className="text-sm font-semibold text-guest-text-primary">
              Tell us what you need.
            </span>
          </div>
          <div>
            <span className="font-display text-2xl text-guest-brand mb-2 block">
              3.
            </span>
            <span className="text-sm font-semibold text-guest-text-primary">
              We take care of it.
            </span>
          </div>
        </div>
      </div>
      <footer className="mt-12 mb-6 text-center text-sm text-guest-text-muted">
        <p className="font-display text-guest-text-secondary">{venue.value.name}</p>
        <p className="mt-1">Open daily. Powered by IronMan.</p>
      </footer>
    </div>
  );
}
