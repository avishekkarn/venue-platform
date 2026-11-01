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
  // 1. Resolve host and protocol dynamically from incoming request headers
  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "localhost:3000";
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (request.url.startsWith("https") ? "https" : "http");
  const baseUrl = `${protocol}://${host}`;

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
    return NextResponse.redirect(`${baseUrl}/qr/inactive`);
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
    return NextResponse.redirect(`${baseUrl}/qr/inactive`);
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

  // Check if an active session already exists for this place (TABLE or ROOM)
  if (
    resolved.value.placeType === PlaceType.TABLE ||
    resolved.value.placeType === PlaceType.ROOM
  ) {
    const activeSession = await prisma.guestSession.findFirst({
      where: {
        venueId: venue.value.id,
        endedAt: null,
        ...(resolved.value.placeType === PlaceType.TABLE
          ? { tableId: placeId }
          : {}),
        ...(resolved.value.placeType === PlaceType.ROOM
          ? { roomId: placeId }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (activeSession) {
      const guestCookie = request.cookies.get("venue_guest")?.value;
      if (guestCookie === activeSession.token) {
        const destinationPath =
          resolved.value.placeType === PlaceType.ROOM ? "/services" : "/menu";
        return NextResponse.redirect(`${baseUrl}${destinationPath}`);
      }

      return NextResponse.redirect(
        `${baseUrl}/qr/occupied?token=${encodeURIComponent(
          token
        )}&sessionId=${encodeURIComponent(activeSession.id)}`
      );
    }
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
    return NextResponse.redirect(`${baseUrl}/qr/inactive`);
  }

  // f. Redirect by place type per SYSTEM.md §8.3 using absolute baseUrl
  let destinationPath = "/menu";
  if (resolved.value.placeType === PlaceType.ROOM) {
    destinationPath = "/services";
  } else {
    // Both TABLE and COUNTER route to /menu
    destinationPath = "/menu";
  }

  const destinationUrl = `${baseUrl}${destinationPath}`;

  const response = NextResponse.redirect(destinationUrl);
  response.cookies.set("venue_guest", session.value.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
