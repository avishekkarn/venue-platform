import type { Metadata } from "next";
import type { JSX } from "react";
import { redirect } from "next/navigation";
import {
  UtensilsCrossed,
  BedDouble,
  Wrench,
  Bell,
  Shirt,
  Flower,
  Clock,
  Phone,
  DoorClosed,
  type LucideIcon,
} from "lucide-react";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { type HotelService } from "@/domain/organization/venue.repository";
import { GuestHero } from "@/components/guest/hero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Services",
  robots: {
    index: false,
  },
};

interface ServiceDescriptor {
  label: string;
  icon: LucideIcon;
}

const SERVICE_DESCRIPTORS: Record<HotelService, ServiceDescriptor> = {
  ROOM_SERVICE_FOOD: {
    label: "Room Service",
    icon: UtensilsCrossed,
  },
  HOUSEKEEPING: {
    label: "Housekeeping",
    icon: BedDouble,
  },
  MAINTENANCE: {
    label: "Maintenance",
    icon: Wrench,
  },
  CONCIERGE: {
    label: "Concierge",
    icon: Bell,
  },
  LAUNDRY: {
    label: "Laundry",
    icon: Shirt,
  },
  SPA: {
    label: "Spa",
    icon: Flower,
  },
  LATE_CHECKOUT: {
    label: "Late Checkout",
    icon: Clock,
  },
  WAKE_UP_CALL: {
    label: "Wake-up Call",
    icon: Phone,
  },
  DO_NOT_DISTURB: {
    label: "Do Not Disturb",
    icon: DoorClosed,
  },
};

function getServiceDescriptor(service: HotelService): ServiceDescriptor {
  return (
    SERVICE_DESCRIPTORS[service] ?? {
      label: service,
      icon: Bell,
    }
  );
}

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
      <div className="mt-4 flex justify-center animate-in fade-in duration-700 delay-500 ease-guest-entrance">
        <Button size="xl" variant="primary">
          Explore Services
        </Button>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <Button variant="ghost" size="sm">
          Call the front desk
        </Button>
        <Button variant="ghost" size="sm">
          View requests
        </Button>
      </div>

      {venue.value.services && venue.value.services.length > 0 && (
        <div className="mt-6 w-full max-w-4xl mx-auto px-4 animate-in fade-in duration-700 delay-500 ease-guest-entrance">
          <h2 className="font-display text-xl text-guest-text-primary mb-3 text-center">
            Our Services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {venue.value.services.map((service) => {
              const { label, icon: Icon } = getServiceDescriptor(service);
              return (
                <Card
                  key={service}
                  interactive={true}
                  className="p-3 flex flex-col items-center text-center"
                >
                  <Icon className="w-6 h-6 text-guest-brand mb-2" />
                  <span className="text-sm font-semibold text-guest-text-primary">
                    {label}
                  </span>
                </Card>
              );
            })}
          </div>
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
    </div>
  );
}
