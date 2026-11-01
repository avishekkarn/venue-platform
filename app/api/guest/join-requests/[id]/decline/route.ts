import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaJoinRequestRepository } from "@/infrastructure/db/repositories/join-request.repo";
import { DomainErrorCode } from "@/domain/shared/result";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.VALIDATION_FAILED,
          message: "Missing request ID",
        },
      },
      { status: 400 }
    );
  }

  // Verify request belongs to the host's session
  const existing = await prisma.guestJoinRequest.findUnique({
    where: { id },
  });
  if (!existing || existing.sessionId !== sessionResult.value.id) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.NOT_FOUND,
          message: "Join request not found for this session",
        },
      },
      { status: 404 }
    );
  }

  const joinRepo = createPrismaJoinRequestRepository(prisma);
  const updated = await joinRepo.updateStatus(id, "REJECTED");
  if (!updated.ok) {
    return NextResponse.json(
      { error: { code: updated.error.code, message: updated.error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: updated.value }, { status: 200 });
}

