import { NextResponse, type NextRequest } from "next/server";
import { resolveToken } from "@/domain/qr/resolve-token";
import { PlaceType } from "@/domain/qr/qr-token.repository";
import { createGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { prisma } from "@/infrastructure/db/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  // a. Read token from params
  const { token } = await params;

  // b. Resolve token
  const qrRepo = createPrismaQrTokenRepository(prisma);
  const resolved = await resolveToken({ qrTokenRepo: qrRepo }, token);
  if (!resolved.ok) {
    console.error("[qr-landing] resolve failed", {
      code: resolved.error.code,
      token,
    });
    return NextResponse.redirect(new URL("/qr/inactive", request.url));
  }

  // c. Fetch venue by slug
  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (!venue.ok) {
    console.error("[qr-landing] venue fetch failed", {
      code: venue.error.code,
      slug: process.env["VENUE_SLUG"] ?? "juniper-house",
    });
    return NextResponse.redirect(new URL("/qr/inactive", request.url));
  }

  // d. Derive placeId from discriminated union
  let placeId: string;
  switch (resolved.value.placeType) {
    case PlaceType.TABLE:
      placeId = resolved.value.tableId;
      break;
    case PlaceType.ROOM:
      placeId = resolved.value.roomId;
      break;
    case PlaceType.COUNTER:
      placeId = resolved.value.counterId;
      break;
  }

  // e. Create guest session
  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const session = await createGuestSession(
    { repo: guestRepo },
    {
      venueId: venue.value.id,
      placeType: resolved.value.placeType,
      placeId,
      qrTokenId: resolved.value.id,
    }
  );
  if (!session.ok) {
    console.error("[qr-landing] session creation failed", {
      code: session.error.code,
      placeId,
      venueId: venue.value.id,
    });
    return NextResponse.redirect(new URL("/qr/inactive", request.url));
  }

  // f. Redirect by place type, and set the cookie on the redirect response
  let destination: string;
  switch (resolved.value.placeType) {
    case PlaceType.TABLE:
      destination = "/menu";
      break;
    case PlaceType.ROOM:
      destination = "/services";
      break;
    case PlaceType.COUNTER:
      destination = "/menu";
      break;
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set("venue_guest", session.value.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
