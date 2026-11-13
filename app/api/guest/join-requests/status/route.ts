import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaJoinRequestRepository } from "@/infrastructure/db/repositories/join-request.repo";
import { DomainErrorCode } from "@/domain/shared/result";
import {
  CSRF_COOKIE_NAME,
  CSRF_MAX_AGE_SECONDS,
} from "@/infrastructure/csrf/cookies";
import { generateCsrfToken } from "@/infrastructure/csrf/token";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");
  const deviceId = searchParams.get("deviceId");

  if (!sessionId || !deviceId) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Missing sessionId or deviceId",
        },
      },
      { status: 400 }
    );
  }

  const joinRepo = createPrismaJoinRequestRepository(prisma);
  const found = await joinRepo.findByDevice(sessionId, deviceId);
  if (!found.ok) {
    return NextResponse.json(
      { error: { code: found.error.code, message: found.error.message } },
      { status: 500 }
    );
  }

  if (!found.value) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.NOT_FOUND,
          message: "Join request not found",
        },
      },
      { status: 404 }
    );
  }

  const response = NextResponse.json(
    { data: { ...found.value } },
    { status: 200 }
  );

  if (found.value.status === "APPROVED") {
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
      select: { token: true },
    });

    if (session?.token) {
      response.cookies.set("venue_guest", session.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      response.cookies.set(CSRF_COOKIE_NAME, generateCsrfToken(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: CSRF_MAX_AGE_SECONDS,
      });
    }
  }

  return response;
}
