import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  generateToken,
  type GenerateTokenDeps,
} from "@/domain/qr/generate-token";
import {
  type QrToken,
  type QrTokenRepository,
  PlaceType,
  QrTokenState,
} from "@/domain/qr/qr-token.repository";
import { ok, DomainErrorCode } from "@/domain/shared/result";

describe("generateToken domain function", () => {
  let mockRepo: QrTokenRepository;
  let deps: GenerateTokenDeps;

  const venueId = "venue-1";

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

  it("Test 1: Valid input for a TABLE -> calls repo.generate and returns ok(token)", async () => {
    const tableToken: QrToken = {
      id: "token-1",
      token: "uuid-table-1",
      venueId,
      state: QrTokenState.ACTIVE,
      createdAt: new Date(),
      revokedAt: null,
      placeType: PlaceType.TABLE,
      tableId: "table-123",
      roomId: null,
      counterId: null,
    };

    vi.mocked(mockRepo.generate).mockResolvedValueOnce(ok(tableToken));

    const input = {
      venueId,
      placeType: PlaceType.TABLE as const,
      tableId: "table-123",
    };

    const result = await generateToken(deps, input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(tableToken);
      expect(result.value.placeType).toBe(PlaceType.TABLE);
      expect(result.value.tableId).toBe("table-123");
    }
    expect(mockRepo.generate).toHaveBeenCalledTimes(1);
    expect(mockRepo.generate).toHaveBeenCalledWith(input);
  });

  it("Test 2: Valid input for a ROOM -> calls repo.generate and returns ok(token)", async () => {
    const roomToken: QrToken = {
      id: "token-2",
      token: "uuid-room-1",
      venueId,
      state: QrTokenState.ACTIVE,
      createdAt: new Date(),
      revokedAt: null,
      placeType: PlaceType.ROOM,
      tableId: null,
      roomId: "room-456",
      counterId: null,
    };

    vi.mocked(mockRepo.generate).mockResolvedValueOnce(ok(roomToken));

    const input = {
      venueId,
      placeType: PlaceType.ROOM as const,
      roomId: "room-456",
    };

    const result = await generateToken(deps, input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(roomToken);
      expect(result.value.placeType).toBe(PlaceType.ROOM);
      expect(result.value.roomId).toBe("room-456");
    }
    expect(mockRepo.generate).toHaveBeenCalledTimes(1);
    expect(mockRepo.generate).toHaveBeenCalledWith(input);
  });

  it("Test 3: Valid input for a COUNTER -> calls repo.generate and returns ok(token)", async () => {
    const counterToken: QrToken = {
      id: "token-3",
      token: "uuid-counter-1",
      venueId,
      state: QrTokenState.ACTIVE,
      createdAt: new Date(),
      revokedAt: null,
      placeType: PlaceType.COUNTER,
      tableId: null,
      roomId: null,
      counterId: "counter-789",
    };

    vi.mocked(mockRepo.generate).mockResolvedValueOnce(ok(counterToken));

    const input = {
      venueId,
      placeType: PlaceType.COUNTER as const,
      counterId: "counter-789",
    };

    const result = await generateToken(deps, input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(counterToken);
      expect(result.value.placeType).toBe(PlaceType.COUNTER);
      expect(result.value.counterId).toBe("counter-789");
    }
    expect(mockRepo.generate).toHaveBeenCalledTimes(1);
    expect(mockRepo.generate).toHaveBeenCalledWith(input);
  });

  it("Test 4: Invalid input (e.g., placeType: 'TABLE' but tableId is missing/undefined) -> returns fail(VALIDATION_FAILED) and does not call repo.generate", async () => {
    // Missing tableId
    const invalidTableInput = {
      venueId,
      placeType: PlaceType.TABLE,
    } as unknown as Parameters<typeof generateToken>[1];

    const result1 = await generateToken(deps, invalidTableInput);

    expect(result1.ok).toBe(false);
    if (!result1.ok) {
      expect(result1.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result1.error.message).toBe("Invalid place details for the given place type");
    }

    // Missing roomId
    const invalidRoomInput = {
      venueId,
      placeType: PlaceType.ROOM,
    } as unknown as Parameters<typeof generateToken>[1];

    const result2 = await generateToken(deps, invalidRoomInput);
    expect(result2.ok).toBe(false);
    if (!result2.ok) {
      expect(result2.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result2.error.message).toBe("Invalid place details for the given place type");
    }

    // Missing counterId
    const invalidCounterInput = {
      venueId,
      placeType: PlaceType.COUNTER,
    } as unknown as Parameters<typeof generateToken>[1];

    const result3 = await generateToken(deps, invalidCounterInput);
    expect(result3.ok).toBe(false);
    if (!result3.ok) {
      expect(result3.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result3.error.message).toBe("Invalid place details for the given place type");
    }

    // Missing venueId
    const missingVenueInput = {
      placeType: PlaceType.TABLE,
      tableId: "t-1",
    } as unknown as Parameters<typeof generateToken>[1];

    const result4 = await generateToken(deps, missingVenueInput);
    expect(result4.ok).toBe(false);
    if (!result4.ok) {
      expect(result4.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(result4.error.message).toBe("Invalid place details for the given place type");
    }

    expect(mockRepo.generate).not.toHaveBeenCalled();
  });
});
