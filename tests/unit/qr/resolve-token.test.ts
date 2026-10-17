import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveToken,
  type ResolveTokenDeps,
} from "@/domain/qr/resolve-token";
import {
  type QrTokenRepository,
  type ResolvedQrContext,
  PlaceType,
  QrTokenState,
} from "@/domain/qr/qr-token.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

describe("resolveToken domain function", () => {
  let mockRepo: QrTokenRepository;
  let deps: ResolveTokenDeps;

  const validToken = "12345678-1234-1234-1234-123456789abc";
  const venueId = "venue-1";

  const sampleContext: ResolvedQrContext = {
    id: "qr-1",
    token: validToken,
    venueId,
    state: QrTokenState.ACTIVE,
    createdAt: new Date("2026-01-01"),
    revokedAt: null,
    placeType: PlaceType.TABLE,
    tableId: "table-1",
    roomId: null,
    counterId: null,
  };

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

  it("Test 1: Invalid UUID format -> returns fail(VALIDATION_FAILED) and does not call repo.resolve", async () => {
    // Non-UUID strings
    const invalidTokens = [
      "",
      "not-a-uuid",
      "12345",
      "12345678-1234-1234-1234-123456789abg", // 'g' is not hex
      " 12345678-1234-1234-1234-123456789abc", // leading space
    ];

    for (const invalid of invalidTokens) {
      const result = await resolveToken(deps, invalid);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toBe("Invalid token format");
      }
    }

    expect(mockRepo.resolve).not.toHaveBeenCalled();
  });

  it("Test 2: Valid UUID and repo returns ok(context) -> returns ok(context)", async () => {
    vi.mocked(mockRepo.resolve).mockResolvedValueOnce(ok(sampleContext));

    const result = await resolveToken(deps, validToken);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(sampleContext);
      expect(result.value.placeType).toBe(PlaceType.TABLE);
      expect(result.value.tableId).toBe("table-1");
    }
    expect(mockRepo.resolve).toHaveBeenCalledTimes(1);
    expect(mockRepo.resolve).toHaveBeenCalledWith(validToken);
  });

  it("Test 3: Valid UUID and repo returns fail(NOT_FOUND) -> returns fail(NOT_FOUND)", async () => {
    vi.mocked(mockRepo.resolve).mockResolvedValueOnce(
      fail(DomainErrorCode.NOT_FOUND, `QR token '${validToken}' not found`)
    );

    const result = await resolveToken(deps, validToken);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
      expect(result.error.message).toContain("not found");
    }
    expect(mockRepo.resolve).toHaveBeenCalledTimes(1);
    expect(mockRepo.resolve).toHaveBeenCalledWith(validToken);
  });

  it("Test 4: Valid UUID and repo returns fail(INVALID_STATE) -> returns fail(INVALID_STATE)", async () => {
    vi.mocked(mockRepo.resolve).mockResolvedValueOnce(
      fail(DomainErrorCode.INVALID_STATE, `QR token '${validToken}' is revoked`)
    );

    const result = await resolveToken(deps, validToken);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(DomainErrorCode.INVALID_STATE);
      expect(result.error.message).toContain("revoked");
    }
    expect(mockRepo.resolve).toHaveBeenCalledTimes(1);
    expect(mockRepo.resolve).toHaveBeenCalledWith(validToken);
  });
});
