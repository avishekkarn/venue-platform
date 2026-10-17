import { describe, it, expect, vi } from "vitest";
import {
  createGuestSession,
  getGuestSession,
  invalidateGuestSession,
  invalidateSessionsForPlace,
} from "@/domain/guest/guest-session.service";
import {
  type GuestSessionRepository,
  type GuestSession,
  PlaceType,
} from "@/domain/guest/guest-session.repository";
import { ok, DomainErrorCode } from "@/domain/shared/result";

describe("guest-session.service unit tests", () => {
  const validToken = "12345678-1234-1234-1234-123456789abc";
  const validSession: GuestSession = {
    id: "sess-1",
    token: validToken,
    venueId: "venue-1",
    placeType: PlaceType.TABLE,
    placeId: "table-1",
    createdAt: new Date("2026-10-17T12:00:00Z"),
    endedAt: null,
  };

  function createMockRepo(
    overrides?: Partial<GuestSessionRepository>
  ): GuestSessionRepository {
    return {
      create: vi.fn().mockResolvedValue(ok(validSession)),
      findByToken: vi.fn().mockResolvedValue(ok(validSession)),
      invalidateByToken: vi.fn().mockResolvedValue(ok(undefined)),
      invalidateByPlace: vi.fn().mockResolvedValue(ok(1)),
      ...overrides,
    };
  }

  describe("createGuestSession", () => {
    it("calls repo.create and returns ok with valid input", async () => {
      const repo = createMockRepo();
      const input = {
        venueId: "venue-1",
        placeType: PlaceType.TABLE,
        placeId: "table-1",
      };

      const result = await createGuestSession({ repo }, input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(validSession);
      }
      expect(repo.create).toHaveBeenCalledWith(input);
    });

    it("returns fail(VALIDATION_FAILED) without calling repo.create when venueId is empty", async () => {
      const repo = createMockRepo();
      const input = {
        venueId: "",
        placeType: PlaceType.TABLE,
        placeId: "table-1",
      };

      const result = await createGuestSession({ repo }, input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      }
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("returns fail(VALIDATION_FAILED) without calling repo.create when placeId is empty", async () => {
      const repo = createMockRepo();
      const input = {
        venueId: "venue-1",
        placeType: PlaceType.TABLE,
        placeId: "   ",
      };

      const result = await createGuestSession({ repo }, input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      }
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("returns fail(VALIDATION_FAILED) without calling repo.create when placeType is invalid", async () => {
      const repo = createMockRepo();
      const input = {
        venueId: "venue-1",
        placeType: "UNKNOWN" as PlaceType,
        placeId: "place-1",
      };

      const result = await createGuestSession({ repo }, input);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      }
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe("getGuestSession", () => {
    it("returns ok with a valid token and a valid session", async () => {
      const repo = createMockRepo({
        findByToken: vi.fn().mockResolvedValue(ok(validSession)),
      });

      const result = await getGuestSession({ repo }, validToken);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(validSession);
      }
      expect(repo.findByToken).toHaveBeenCalledWith(validToken);
    });

    it("returns fail(VALIDATION_FAILED) for a malformed token", async () => {
      const repo = createMockRepo();

      const result = await getGuestSession({ repo }, "not-a-uuid");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      }
      expect(repo.findByToken).not.toHaveBeenCalled();
    });

    it("returns fail(UNAUTHORIZED) when repo.findByToken returns ok(null)", async () => {
      const repo = createMockRepo({
        findByToken: vi.fn().mockResolvedValue(ok(null)),
      });

      const result = await getGuestSession({ repo }, validToken);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
        expect(result.error.message).toBe("Invalid or expired guest session");
      }
    });

    it("returns fail(UNAUTHORIZED) when session has endedAt set", async () => {
      const endedSession: GuestSession = {
        ...validSession,
        endedAt: new Date("2026-10-17T13:00:00Z"),
      };
      const repo = createMockRepo({
        findByToken: vi.fn().mockResolvedValue(ok(endedSession)),
      });

      const result = await getGuestSession({ repo }, validToken);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
        expect(result.error.message).toBe("Guest session has ended");
      }
    });
  });

  describe("invalidateGuestSession", () => {
    it("returns ok and calls repo.invalidateByToken with a valid token", async () => {
      const repo = createMockRepo({
        invalidateByToken: vi.fn().mockResolvedValue(ok(undefined)),
      });

      const result = await invalidateGuestSession({ repo }, validToken);

      expect(result.ok).toBe(true);
      expect(repo.invalidateByToken).toHaveBeenCalledWith(validToken);
    });

    it("returns fail(VALIDATION_FAILED) for a malformed token", async () => {
      const repo = createMockRepo();

      const result = await invalidateGuestSession({ repo }, "invalid-uuid");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      }
      expect(repo.invalidateByToken).not.toHaveBeenCalled();
    });
  });

  describe("invalidateSessionsForPlace", () => {
    it("calls repo.invalidateByPlace and returns ok(count) with valid inputs", async () => {
      const repo = createMockRepo({
        invalidateByPlace: vi.fn().mockResolvedValue(ok(3)),
      });

      const result = await invalidateSessionsForPlace(
        { repo },
        "venue-1",
        PlaceType.TABLE,
        "table-1"
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(3);
      }
      expect(repo.invalidateByPlace).toHaveBeenCalledWith(
        "venue-1",
        PlaceType.TABLE,
        "table-1"
      );
    });

    it("returns fail(VALIDATION_FAILED) without calling repo.invalidateByPlace when venueId is empty", async () => {
      const repo = createMockRepo();

      const result = await invalidateSessionsForPlace(
        { repo },
        "",
        PlaceType.TABLE,
        "table-1"
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toBe(
          "Invalid place details for the given place type"
        );
      }
      expect(repo.invalidateByPlace).not.toHaveBeenCalled();
    });

    it("returns fail(VALIDATION_FAILED) without calling repo.invalidateByPlace when placeId is empty", async () => {
      const repo = createMockRepo();

      const result = await invalidateSessionsForPlace(
        { repo },
        "venue-1",
        PlaceType.TABLE,
        "   "
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
        expect(result.error.message).toBe(
          "Invalid place details for the given place type"
        );
      }
      expect(repo.invalidateByPlace).not.toHaveBeenCalled();
    });
  });
});

