import type { Metadata } from "next";
import type { JSX } from "react";
import { redirect } from "next/navigation";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { GuestHero } from "@/components/guest/hero";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardMedia,
  CardHeader,
  CardTitle,
  CardDescription,
  CardBody,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Menu",
  robots: {
    index: false,
  },
};

export default async function MenuPage(): Promise<JSX.Element> {
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

  const menuRepo = createPrismaMenuRepository(prisma);
  const itemsResult = await menuRepo.listItems(venue.value.id);
  const featuredItems = itemsResult.ok
    ? itemsResult.value
        .filter((item) => item.state === MenuItemState.AVAILABLE)
        .slice(0, 3)
    : [];

  return (
    <div className="flex flex-col justify-center items-center min-h-[calc(100dvh-4rem)]">
      <GuestHero venue={venue.value} placeContext={placeContext} />
      <div className="mt-6 flex justify-center animate-in fade-in duration-700 delay-500 ease-guest-entrance">
        <Button size="xl" variant="primary">
          View Menu
        </Button>
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 animate-in fade-in duration-700 delay-700 ease-guest-entrance">
        <Button variant="ghost" size="md">
          Call a waiter
        </Button>
        <Button variant="ghost" size="md">
          Request the bill
        </Button>
      </div>
      {featuredItems.length > 0 ? (
        <div className="mt-8 w-full max-w-4xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
          <h2 className="font-display text-2xl text-guest-text-primary mb-6 text-center">
            Chef's Picks
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory [scrollbar-width:none] hide-scrollbar">
            {featuredItems.map((item) => {
              const imageUrl =
                item.photoUrl ??
                (item as unknown as { imageUrl?: string | null }).imageUrl;

              return (
                <Card
                  key={item.id}
                  interactive={true}
                  className="min-w-[200px] max-w-[200px] snap-center overflow-hidden flex flex-col justify-between"
                >
                  {imageUrl ? (
                    <CardMedia>
                      <img
                        src={imageUrl}
                        alt={item.name}
                        className="h-28 w-full object-cover"
                      />
                    </CardMedia>
                  ) : null}
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    {item.description ? (
                      <CardDescription>{item.description}</CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardBody>
                    <p className="text-guest-text-primary font-medium">
                      {formatMoney(item.price, venue.value.currency)}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mt-8 max-w-2xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-1000 ease-guest-entrance">
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-center">
          <div>
            <span className="font-display text-2xl text-guest-brand mb-2 block">
              1.
            </span>
            <span className="text-sm font-semibold text-guest-text-primary">
              Browse the menu.
            </span>
          </div>
          <div>
            <span className="font-display text-2xl text-guest-brand mb-2 block">
              2.
            </span>
            <span className="text-sm font-semibold text-guest-text-primary">
              Order from your phone.
            </span>
          </div>
          <div>
            <span className="font-display text-2xl text-guest-brand mb-2 block">
              3.
            </span>
            <span className="text-sm font-semibold text-guest-text-primary">
              We bring it to your table.
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
