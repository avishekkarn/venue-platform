import type { Metadata } from "next";
import type { JSX } from "react";
import { redirect } from "next/navigation";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaServiceRequestRepository } from "@/infrastructure/db/repositories/request.repo";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { RequestsClient } from "@/components/guest/requests-client";

export const metadata: Metadata = {
  title: "Requests",
  robots: { index: false },
};

export default async function RequestsPage(): Promise<JSX.Element> {
  const cookie = await getGuestCookie();
  if (!cookie) redirect("/");

  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const session = await getGuestSession({ repo: guestRepo }, cookie);
  if (!session.ok) redirect("/");

  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(process.env["VENUE_SLUG"] ?? "juniper-house");
  if (!venue.ok) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 text-center">
        <p className="text-base text-guest-text-muted">We couldn't load the venue.</p>
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

  const requestRepo = createPrismaServiceRequestRepository(prisma);
  const requestsResult = await requestRepo.listForGuestSession!(venue.value.id, session.value.id);
  const initialRequests = requestsResult.ok ? requestsResult.value : [];

  const locale = venue.value.language === "en" ? "en-US" : venue.value.language;

  return (
    <RequestsClient
      initialRequests={initialRequests}
      placeContext={placeContext}
      venueName={venue.value.name}
      locale={locale}
    />
  );
}
