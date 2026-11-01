import { beforeEach, describe, expect, it, vi } from "vitest";
import { closeTable, type CloseTableDeps } from "@/domain/staff/close-table";
import { TableStatus, type TableRepository } from "@/domain/organization/table.repository";
import { PlaceType, type GuestSessionRepository } from "@/domain/guest/guest-session.repository";
import { ok, fail, DomainErrorCode } from "@/domain/shared/result";

interface MockTableRepository extends TableRepository {
  readonly setStatus: ReturnType<typeof vi.fn<TableRepository["setStatus"]>>;
}

interface MockGuestSessionRepository extends GuestSessionRepository {
  readonly invalidateByPlace: ReturnType<typeof vi.fn<GuestSessionRepository["invalidateByPlace"]>>;
}

describe("closeTable domain action", () => {
  const venueId = "venue-alpha";
  const tableId = "table-123";

  let mockTableRepo: MockTableRepository;
  let mockGuestRepo: MockGuestSessionRepository;
  let deps: CloseTableDeps;

  beforeEach(() => {
    mockTableRepo = {
      findById: vi.fn(),
      findByNumber: vi.fn(),
      listForVenue: vi.fn(),
      create: vi.fn(),
      setState: vi.fn(),
      setStatus: vi.fn().mockResolvedValue(ok(undefined)),
    };

    mockGuestRepo = {
      create: vi.fn(),
      findByToken: vi.fn(),
      invalidateByToken: vi.fn(),
      invalidateByPlace: vi.fn().mockResolvedValue(ok(2)),
    };

    deps = {
      tableRepo: mockTableRepo,
      guestRepo: mockGuestRepo,
    };
  });

  it("successfully invalidates guest sessions and frees the table", async () => {
    const result = await closeTable(deps, {
      venueId,
      tableId,
      staffMemberId: "staff-01",
    });

    expect(result.ok).toBe(true);
    expect(mockGuestRepo.invalidateByPlace).toHaveBeenCalledTimes(1);
    expect(mockGuestRepo.invalidateByPlace).toHaveBeenCalledWith(
      venueId,
      PlaceType.TABLE,
      tableId
    );
    expect(mockTableRepo.setStatus).toHaveBeenCalledTimes(1);
    expect(mockTableRepo.setStatus).toHaveBeenCalledWith(
      venueId,
      tableId,
      TableStatus.FREE
    );
  });

  it("supports guestSessionRepo property name in deps", async () => {
    const result = await closeTable(
      { tableRepo: mockTableRepo, guestSessionRepo: mockGuestRepo },
      { venueId, tableId }
    );

    expect(result.ok).toBe(true);
    expect(mockGuestRepo.invalidateByPlace).toHaveBeenCalledWith(
      venueId,
      PlaceType.TABLE,
      tableId
    );
    expect(mockTableRepo.setStatus).toHaveBeenCalledWith(
      venueId,
      tableId,
      TableStatus.FREE
    );
  });

  it("fails with VALIDATION_FAILED if venueId is missing or empty", async () => {
    const result = await closeTable(deps, {
      venueId: "  ",
      tableId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(mockGuestRepo.invalidateByPlace).not.toHaveBeenCalled();
    expect(mockTableRepo.setStatus).not.toHaveBeenCalled();
  });

  it("fails with VALIDATION_FAILED if tableId is missing or empty", async () => {
    const result = await closeTable(deps, {
      venueId,
      tableId: "",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    expect(mockGuestRepo.invalidateByPlace).not.toHaveBeenCalled();
    expect(mockTableRepo.setStatus).not.toHaveBeenCalled();
  });

  it("propagates error when invalidateSessionsForPlace fails", async () => {
    mockGuestRepo.invalidateByPlace.mockResolvedValueOnce(
      fail(DomainErrorCode.INTERNAL, "Session db error")
    );

    const result = await closeTable(deps, {
      venueId,
      tableId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.INTERNAL);
    expect(mockTableRepo.setStatus).not.toHaveBeenCalled();
  });

  it("propagates error when tableRepo.setStatus fails", async () => {
    mockTableRepo.setStatus.mockResolvedValueOnce(
      fail(DomainErrorCode.NOT_FOUND, "Table not found")
    );

    const result = await closeTable(deps, {
      venueId,
      tableId,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe(DomainErrorCode.NOT_FOUND);
  });
});

