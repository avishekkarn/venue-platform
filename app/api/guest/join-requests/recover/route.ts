import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/db/client";
import { DomainErrorCode } from "@/domain/shared/result";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      sessionId?: unknown;
      hostToken?: unknown;
    };

    if (
      typeof body.sessionId !== "string" ||
      !body.sessionId.trim() ||
      typeof body.hostToken !== "string" ||
      !body.hostToken.trim()
    ) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.VALIDATION_FAILED,
            message: "Missing sessionId or hostToken",
          },
        },
        { status: 400 }
      );
    }

    const sessionId = body.sessionId.trim();
    const hostToken = body.hostToken.trim();

    const session = await prisma.guestSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.endedAt !== null) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.NOT_FOUND,
            message: "Session not found or already ended",
          },
        },
        { status: 404 }
      );
    }

    if (session.token !== hostToken) {
      return NextResponse.json(
        {
          error: {
            code: DomainErrorCode.FORBIDDEN,
            message: "Invalid host token for this session",
          },
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json(
      {
        data: {
          sessionId: session.id,
          sessionToken: session.token,
        },
      },
      { status: 200 }
    );

    response.cookies.set("venue_guest", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
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

