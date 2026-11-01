import {
  type PrismaClient,
  type Prisma,
  type GuestJoinRequest as PrismaGuestJoinRequest,
} from "@prisma/client";
import {
  type JoinRequest,
  type JoinRequestRepository,
} from "@/domain/guest/join-request.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapJoinRequest(raw: PrismaGuestJoinRequest): JoinRequest {
  return {
    id: raw.id,
    sessionId: raw.sessionId,
    requestingDevice: raw.requestingDevice,
    name: raw.name,
    status: raw.status,
    createdAt: raw.createdAt,
  };
}

export function createPrismaJoinRequestRepository(
  client: DbClient
): JoinRequestRepository {
  return {
    async create(
      sessionId: string,
      requestingDevice: string,
      name: string
    ): Promise<Result<JoinRequest>> {
      try {
        const created = await client.guestJoinRequest.create({
          data: {
            sessionId,
            requestingDevice,
            name,
            status: "PENDING",
          },
        });
        return ok(mapJoinRequest(created));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },

    async findPendingBySession(
      sessionId: string
    ): Promise<Result<JoinRequest[]>> {
      try {
        const list = await client.guestJoinRequest.findMany({
          where: {
            sessionId,
            status: "PENDING",
          },
          orderBy: { createdAt: "asc" },
        });
        return ok(list.map(mapJoinRequest));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async findByDevice(
      sessionId: string,
      deviceId: string
    ): Promise<Result<JoinRequest | null>> {
      try {
        const found = await client.guestJoinRequest.findFirst({
          where: {
            sessionId,
            requestingDevice: deviceId,
          },
          orderBy: { createdAt: "desc" },
        });
        return ok(found ? mapJoinRequest(found) : null);
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database read operation failed"
        );
      }
    },

    async updateStatus(
      id: string,
      status: "APPROVED" | "REJECTED"
    ): Promise<Result<JoinRequest>> {
      try {
        const updated = await client.guestJoinRequest.update({
          where: { id },
          data: { status },
        });
        return ok(mapJoinRequest(updated));
      } catch {
        return fail(
          DomainErrorCode.INTERNAL,
          "Database write operation failed"
        );
      }
    },
  };
}

