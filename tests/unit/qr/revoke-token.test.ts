import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  revokeToken,
  type RevokeTokenDeps,
} from "@/domain/qr/revoke-token";
import {
  type QrTokenRepository,
} from "@/domain/qr/qr-token.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("revokeToken domain function", () => {
  let mockRepo: QrTokenRepository;
  let deps: RevokeTokenDeps;

  const validToken = "12345678-1234-1234-1234-123456789abc";

  beforeEach(() => {
    mockRepo = {
      findByToken: vi.fn(),
      findById: vi.fn(),
      generate: vi.fn(),
      revoke: vi.fn(),
      listForVenue: vi.fn(),
      resolve: vi.fn(),
    };
    deps = { qrTokenRepo: mockRepo };
  });

  it("Test 1: Invalid UUID format -> returns fail(VALIDATION_FAILED) and does not call repo.revoke", async () => {
    const invalidTokens = [
      "",
      "not-a-uuid",
      "12345",
      "12345678-1234-1234-1234-123456789abg", // non-hex
      " 12345678-1234-1234-1234-123456789abc", // leading whitespace
    ];

    for (const invalid of invalidTokens) {
      const result = await revokeToken(deps, invalid);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toBe("Invalid token format");
      }
    }

    expect(mockRepo.revoke).not.toHaveBeenCalled();
  });

  it("Test 2: Valid UUID and repo returns ok(undefined) -> returns ok(undefined)", async () => {
    vi.mocked(mockRepo.revoke).mockResolvedValueOnce(ok(undefined as any));

    const result = await revokeToken(deps, validToken);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBeUndefined();
    }
    expect(mockRepo.revoke).toHaveBeenCalledTimes(1);
    expect(mockRepo.revoke).toHaveBeenCalledWith(validToken);
  });

  it("Test 3: Valid UUID and repo returns fail(NOT_FOUND) -> returns fail(NOT_FOUND)", async () => {
    vi.mocked(mockRepo.revoke).mockResolvedValueOnce(
      fail(DomainErrorCode.NOT_FOUND, `QR token '${validToken}' not found`)
    );

    const result = await revokeToken(deps, validToken);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(result.error.message).toContain("not found");
    }
    expect(mockRepo.revoke).toHaveBeenCalledTimes(1);
    expect(mockRepo.revoke).toHaveBeenCalledWith(validToken);
  });

  it("Test 4: Valid UUID and repo returns fail(INVALID_STATE) -> returns fail(INVALID_STATE)", async () => {
    vi.mocked(mockRepo.revoke).mockResolvedValueOnce(
      fail(DomainErrorCode.INVALID_STATE, `QR token '${validToken}' is already revoked`)
    );

    const result = await revokeToken(deps, validToken);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
      expect(result.error.message).toContain("already revoked");
    }
    expect(mockRepo.revoke).toHaveBeenCalledTimes(1);
    expect(mockRepo.revoke).toHaveBeenCalledWith(validToken);
  });
});
