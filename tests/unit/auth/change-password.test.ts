import { describe, it, expect, vi } from "vitest";
import {
  changePassword,
  type ChangePasswordDependencies,
  type ChangePasswordInput,
} from "@/domain/auth/change-password";
import {
  type StaffRepository,
  type StaffMember,
  StaffState,
  StaffRole,
} from "@/domain/auth/staff.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("changePassword domain function", () => {
  const mockStaff: StaffMember = {
    id: "staff-1",
    venueId: "venue-1",
    name: "Alice Manager",
    username: "alice",
    roles: [StaffRole.MANAGER],
    state: StaffState.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const defaultInput: ChangePasswordInput = {
    venueId: "venue-1",
    staffMemberId: "staff-1",
    newPlainPassword: "newpassword123",
  };

  function createMockDeps(): {
    deps: ChangePasswordDependencies;
    updatePasswordHash: ReturnType<typeof vi.fn>;
    hashPassword: ReturnType<typeof vi.fn>;
    invalidateAllSessions: ReturnType<typeof vi.fn>;
  } {
    const updatePasswordHash = vi.fn().mockResolvedValue(ok(mockStaff));
    const staffRepo = {
      updatePasswordHash,
    } as unknown as StaffRepository;

    const hashPassword = vi.fn().mockResolvedValue("$argon2id$mockhash");
    const invalidateAllSessions = vi.fn().mockResolvedValue(2);

    return {
      deps: {
        staffRepo,
        hashPassword,
        invalidateAllSessions,
      },
      updatePasswordHash,
      hashPassword,
      invalidateAllSessions,
    };
  }

  it("successfully hashes password, updates database, and invalidates sessions", async () => {
    const { deps, hashPassword, updatePasswordHash, invalidateAllSessions } =
      createMockDeps();

    const result = await changePassword(deps, defaultInput);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeUndefined();
    }
    expect(hashPassword).toHaveBeenCalledWith("newpassword123");
    expect(updatePasswordHash).toHaveBeenCalledWith(
      "venue-1",
      "staff-1",
      "$argon2id$mockhash"
    );
    expect(invalidateAllSessions).toHaveBeenCalledWith("staff-1");
  });

  it("returns failure when staff member is not found and skips session invalidation", async () => {
    const { deps, updatePasswordHash, invalidateAllSessions } =
      createMockDeps();
    updatePasswordHash.mockResolvedValue(
      fail(DomainErrorCode.NOT_FOUND, "Staff member not found")
    );

    const result = await changePassword(deps, defaultInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(result.error.message).toBe("Staff member not found");
    }
    expect(invalidateAllSessions).not.toHaveBeenCalled();
  });

  it("verifies invalidateAllSessions is called after updatePasswordHash succeeds", async () => {
    const { deps, updatePasswordHash, invalidateAllSessions } =
      createMockDeps();

    const result = await changePassword(deps, defaultInput);

    expect(result.ok).toBe(true);
    const updateOrder = updatePasswordHash.mock.invocationCallOrder[0];
    const invalidateOrder = invalidateAllSessions.mock.invocationCallOrder[0];
    expect(updateOrder).toBeDefined();
    expect(invalidateOrder).toBeDefined();
    expect(invalidateOrder!).toBeGreaterThan(updateOrder!);
  });

  it("returns fail(INTERNAL) when session invalidation throws", async () => {
    const { deps, invalidateAllSessions } = createMockDeps();
    invalidateAllSessions.mockRejectedValue(new Error("Database connection lost"));

    const result = await changePassword(deps, defaultInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
      expect(result.error.message).toBe(
        "Password changed but failed to invalidate sessions"
      );
    }
  });

  it("returns fail(INTERNAL) when hashPassword throws", async () => {
    const { deps, hashPassword, updatePasswordHash, invalidateAllSessions } =
      createMockDeps();
    hashPassword.mockRejectedValue(new Error("Native argon2 error"));

    const result = await changePassword(deps, defaultInput);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
      expect(result.error.message).toBe("Failed to hash password");
    }
    expect(updatePasswordHash).not.toHaveBeenCalled();
    expect(invalidateAllSessions).not.toHaveBeenCalled();
  });
});
