import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaJoinRequestRepository } from "@/infrastructure/db/repositories/join-request.repo";
import { DomainErrorCode } from "@/domain/shared/result";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      sessionId?: unknown;
      deviceId?: unknown;
    };

    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      typeof body.sessionId !== "string" ||
      !body.sessionId.trim() ||
      typeof body.deviceId !== "string" ||
      !body.deviceId.trim()
    ) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Missing or invalid name, sessionId, or deviceId",
          },
        },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId.trim();
    const deviceId = body.deviceId.trim();
    const name = body.name.trim();

    // Verify session exists and is active
    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.endedAt !== null) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.NOT_FOUND,
            message: "Session not found or inactive",
          },
        },
        { status: 404 }
      );
    }

    const repo = createPrismaJoinRequestRepository(prisma);
    const result = await repo.create(sessionId, deviceId, name);

    if (!result.ok) {
      return NextResponse.json(
        { error: { code: result.error.code, message: result.error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: result.value }, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Invalid JSON body",
        },
      },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const querySessionId = searchParams.get("sessionId");
  const queryDeviceId = searchParams.get("deviceId");

  const joinRepo = createPrismaJoinRequestRepository(prisma);

  // If queried by device (joining guest polling status)
  if (querySessionId && queryDeviceId) {
    const found = await joinRepo.findByDevice(querySessionId, queryDeviceId);
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
        where: { id: querySessionId },
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
      }
    }

    return response;
  }

  // Host querying pending requests
  const cookie = await getGuestCookie();
  if (!cookie) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.UNAUTHORIZED,
          message: "No active guest session",
        },
      },
      { status: 401 }
    );
  }

  const guestRepo = createPrismaGuestSessionRepository(prisma);
  const sessionResult = await getGuestSession({ repo: guestRepo }, cookie);
  if (!sessionResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.UNAUTHORIZED,
          message: sessionResult.error.message,
        },
      },
      { status: 401 }
    );
  }

  const pendingResult = await joinRepo.findPendingBySession(
    sessionResult.value.id
  );
  if (!pendingResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: pendingResult.error.code,
          message: pendingResult.error.message,
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: pendingResult.value }, { status: 200 });
}

