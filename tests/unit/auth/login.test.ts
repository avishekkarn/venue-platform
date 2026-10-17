import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  login,
  type LoginDependencies,
  type LoginInput,
} from "@/domain/auth/login";
import {
  StaffRole,
  StaffState,
  type StaffMemberWithCredentials,
} from "@/domain/auth/staff.repository";
import { type StaffSession } from "@/domain/auth/staff-session.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("login domain function", () => {
  let deps: LoginDependencies;
  const venueId = "venue-1";
  const username = "alice";
  const password = "password123";

  const activeStaff: StaffMemberWithCredentials = {
    id: "staff-1",
    venueId,
    name: "Alice Manager",
    username: "alice",
    passwordHash: "$argon2id$hashed",
    roles: [StaffRole.MANAGER],
    state: StaffState.ACTIVE,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  };

  const sampleSession: StaffSession = {
    id: "session-1",
    staffMemberId: "staff-1",
    token: "token-abc-123",
    createdAt: new Date(),
    expiresAt: null,
    endedAt: null,
  };

  beforeEach(() => {
    deps = {
      staffRepo: {
        findById: vi.fn(),
        findByUsername: vi.fn(),
        listForVenue: vi.fn(),
        create: vi.fn(),
        updatePasswordHash: vi.fn(),
        setState: vi.fn(),
      },
      verifyPassword: vi.fn(),
      createSession: vi.fn(),
      invalidateAllSessions: vi.fn(),
    };
  });

  it("returns ok with the staff member and session token on valid login", async () => {
    vi.mocked(deps.staffRepo.findByUsername).mockResolvedValueOnce(
      ok(activeStaff)
    );
    vi.mocked(deps.verifyPassword).mockResolvedValueOnce(true);
    vi.mocked(deps.invalidateAllSessions).mockResolvedValueOnce(1);
    vi.mocked(deps.createSession).mockResolvedValueOnce(sampleSession);

    const input: LoginInput = { venueId, username, password };
    const result = await login(deps, input);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected ok");

    expect(result.value.sessionToken).toBe("token-abc-123");
    expect(result.value.staff).toEqual({
      id: "staff-1",
      venueId,
      name: "Alice Manager",
      username: "alice",
      roles: [StaffRole.MANAGER],
      state: StaffState.ACTIVE,
      createdAt: activeStaff.createdAt,
      updatedAt: activeStaff.updatedAt,
    });
    expect("passwordHash" in result.value.staff).toBe(false);

    expect(deps.staffRepo.findByUsername).toHaveBeenCalledWith(
      venueId,
      username
    );
    expect(deps.verifyPassword).toHaveBeenCalledWith(
      password,
      "$argon2id$hashed"
    );
    expect(deps.invalidateAllSessions).toHaveBeenCalledWith("staff-1");
    expect(deps.createSession).toHaveBeenCalledWith("staff-1");
  });

  it("returns fail with UNAUTHORIZED and generic message when user is not found", async () => {
    vi.mocked(deps.staffRepo.findByUsername).mockResolvedValueOnce(
      fail(DomainErrorCode.NOT_FOUND, "Staff member not found")
    );

    const input: LoginInput = { venueId, username: "nonexistent", password };
    const result = await login(deps, input);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected fail");

    expect(result.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
    expect(result.error.message).toBe("Incorrect username or password");
    expect(deps.verifyPassword).not.toHaveBeenCalled();
    expect(deps.createSession).not.toHaveBeenCalled();
  });

  it("returns fail with UNAUTHORIZED when password is wrong", async () => {
    vi.mocked(deps.staffRepo.findByUsername).mockResolvedValueOnce(
      ok(activeStaff)
    );
    vi.mocked(deps.verifyPassword).mockResolvedValueOnce(false);

    const input: LoginInput = { venueId, username, password: "wrongpassword" };
    const result = await login(deps, input);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected fail");

    expect(result.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
    expect(result.error.message).toBe("Incorrect username or password");
    expect(deps.invalidateAllSessions).not.toHaveBeenCalled();
    expect(deps.createSession).not.toHaveBeenCalled();
  });

  it("returns fail with UNAUTHORIZED when staff member is deactivated", async () => {
    const deactivatedStaff: StaffMemberWithCredentials = {
      ...activeStaff,
      state: StaffState.DEACTIVATED,
    };
    vi.mocked(deps.staffRepo.findByUsername).mockResolvedValueOnce(
      ok(deactivatedStaff)
    );
    vi.mocked(deps.verifyPassword).mockResolvedValueOnce(true);

    const input: LoginInput = { venueId, username, password };
    const result = await login(deps, input);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("Expected fail");

    expect(result.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
    expect(result.error.message).toBe("Incorrect username or password");
    expect(deps.invalidateAllSessions).not.toHaveBeenCalled();
    expect(deps.createSession).not.toHaveBeenCalled();
  });

  it("invalidates all sessions before creating a new session", async () => {
    vi.mocked(deps.staffRepo.findByUsername).mockResolvedValueOnce(
      ok(activeStaff)
    );
    vi.mocked(deps.verifyPassword).mockResolvedValueOnce(true);

    const callOrder: string[] = [];
    vi.mocked(deps.invalidateAllSessions).mockImplementationOnce(async () => {
      callOrder.push("invalidateAllSessions");
      return 1;
    });
    vi.mocked(deps.createSession).mockImplementationOnce(async () => {
      callOrder.push("createSession");
      return sampleSession;
    });

    const input: LoginInput = { venueId, username, password };
    const result = await login(deps, input);

    expect(result.ok).toBe(true);
    expect(callOrder).toEqual(["invalidateAllSessions", "createSession"]);
  });
});
