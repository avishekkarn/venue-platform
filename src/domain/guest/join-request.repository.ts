import { type Result } from "@/domain/shared/result";

export interface JoinRequest {
  readonly id: string;
  readonly sessionId: string;
  readonly requestingDevice: string;
  readonly name: string;
  readonly status: string;
  readonly createdAt: Date;
}

export interface JoinRequestRepository {
  create(
    sessionId: string,
    requestingDevice: string,
    name: string
  ): Promise<Result<JoinRequest>>;
  findPendingBySession(sessionId: string): Promise<Result<JoinRequest[]>>;
  findByDevice(
    sessionId: string,
    deviceId: string
  ): Promise<Result<JoinRequest | null>>;
  updateStatus(
    id: string,
    status: "APPROVED" | "REJECTED"
  ): Promise<Result<JoinRequest>>;
}

