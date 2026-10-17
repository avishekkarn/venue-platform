import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSession,
  validateSession,
  invalidateAllSessions,
  type DbClient,
} from "@/infrastructure/auth/session";
import { type StaffSession } from "@/domain/auth/staff-session.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

const mockRepo = {
  create: vi.fn(),
  findByToken: vi.fn(),
  listActiveForStaff: vi.fn(),
  endById: vi.fn(),
  endAllForStaff: vi.fn(),
};

vi.mock("@/infrastructure/db/repositories/staff-session.repo", () => ({
  createPrismaStaffSessionRepository: vi.fn(() => mockRepo),
}));

describe("Staff session service", () => {
  const fakeClient = {} as DbClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createSession calls repo.create and returns the created session", async () => {
    const mockCreatedSession: StaffSession = {
      id: "session-1",
      staffMemberId: "staff-123",
      token: "generated-token",
      createdAt: new Date(),
      expiresAt: null,
      endedAt: null,
    };

    mockRepo.create.mockResolvedValueOnce(ok(mockCreatedSession));

    const result = await createSession(fakeClient, "staff-123");

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        staffMemberId: "staff-123",
        token: expect.any(String),
      })
    );
    expect(result).toEqual(mockCreatedSession);
  });

  it("validateSession returns the session if it exists, is not expired, and not ended", async () => {
    const activeSession: StaffSession = {
      id: "session-2",
      staffMemberId: "staff-123",
      token: "valid-token",
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      endedAt: null,
    };

    mockRepo.findByToken.mockResolvedValueOnce(ok(activeSession));

    const result = await validateSession(fakeClient, "valid-token");

    expect(mockRepo.findByToken).toHaveBeenCalledWith("valid-token");
    expect(result).toEqual(activeSession);
  });

  it("validateSession returns null if the session is expired", async () => {
    const expiredSession: StaffSession = {
      id: "session-3",
      staffMemberId: "staff-123",
      token: "expired-token",
      createdAt: new Date(Date.now() - 120_000),
      expiresAt: new Date(Date.now() - 60_000),
      endedAt: null,
    };

    mockRepo.findByToken.mockResolvedValueOnce(ok(expiredSession));

    const result = await validateSession(fakeClient, "expired-token");

    expect(mockRepo.findByToken).toHaveBeenCalledWith("expired-token");
    expect(result).toBeNull();
  });

  it("validateSession returns null if the session is already ended", async () => {
    const endedSession: StaffSession = {
      id: "session-4",
      staffMemberId: "staff-123",
      token: "ended-token",
      createdAt: new Date(Date.now() - 120_000),
      expiresAt: null,
      endedAt: new Date(Date.now() - 60_000),
    };

    mockRepo.findByToken.mockResolvedValueOnce(ok(endedSession));

    const result = await validateSession(fakeClient, "ended-token");

    expect(mockRepo.findByToken).toHaveBeenCalledWith("ended-token");
    expect(result).toBeNull();
  });

  it("invalidateAllSessions calls repo.endAllForStaff and returns the count", async () => {
    mockRepo.endAllForStaff.mockResolvedValueOnce(ok(3));

    const count = await invalidateAllSessions(fakeClient, "staff-123");

    expect(mockRepo.endAllForStaff).toHaveBeenCalledWith("staff-123");
    expect(count).toBe(3);
  });
});
