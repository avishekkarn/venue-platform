import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getSession,
  type GetSessionDependencies,
} from "@/domain/auth/get-session";
import { type StaffSession } from "@/domain/auth/staff-session.repository";
import { DomainErrorCode } from "@/domain/shared/result";

describe("getSession domain function", () => {
  let deps: GetSessionDependencies;

  const validSession: StaffSession = {
    id: "session-1",
    staffMemberId: "staff-123",
    token: "token-secret-xyz",
    createdAt: new Date("2026-01-01"),
    expiresAt: null,
    endedAt: null,
  };

  beforeEach(() => {
    deps = {
      validateSession: vi.fn(),
    };
  });

  it("returns ok with the session when validateSession returns a StaffSession", async () => {
    vi.mocked(deps.validateSession).mockResolvedValueOnce(validSession);

    const result = await getSession(deps, "token-secret-xyz");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok");
    expect(result.value).toEqual(validSession);
  });

  it("returns fail with UNAUTHORIZED when validateSession returns null", async () => {
    vi.mocked(deps.validateSession).mockResolvedValueOnce(null);

    const result = await getSession(deps, "invalid-token");

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected fail");
    expect(result.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
    expect(result.error.message).toBe("Invalid or expired session");
  });

  it("forwards the exact token to validateSession", async () => {
    vi.mocked(deps.validateSession).mockResolvedValueOnce(validSession);

    await getSession(deps, "specific-cookie-token");

    expect(deps.validateSession).toHaveBeenCalledTimes(1);
    expect(deps.validateSession).toHaveBeenCalledWith("specific-cookie-token");
  });
});
