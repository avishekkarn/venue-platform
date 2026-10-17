import { beforeEach, describe, expect, it, vi } from "vitest";
import { logout, type LogoutDependencies } from "@/domain/auth/logout";
import { DomainErrorCode } from "@/domain/shared/result";

describe("logout domain function", () => {
  let deps: LogoutDependencies;

  beforeEach(() => {
    deps = {
      deleteSession: vi.fn(),
    };
  });

  it("calls deleteSession with the correct sessionId and returns ok(undefined)", async () => {
    vi.mocked(deps.deleteSession).mockResolvedValueOnce(undefined);

    const result = await logout(deps, "session-123");

    expect(deps.deleteSession).toHaveBeenCalledTimes(1);
    expect(deps.deleteSession).toHaveBeenCalledWith("session-123");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok");
    expect(result.value).toBeUndefined();
  });

  it("returns fail with DomainErrorCode.INTERNAL when deleteSession throws", async () => {
    vi.mocked(deps.deleteSession).mockRejectedValueOnce(
      new Error("Database connection failure")
    );

    const result = await logout(deps, "session-123");

    expect(deps.deleteSession).toHaveBeenCalledWith("session-123");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected fail");
    expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
    expect(result.error.message).toBe("Database connection failure");
  });
});
