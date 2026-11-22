import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET as getQrPlaces, setTestDbClient as setQrPlacesDb } from "@/../app/api/admin/qr/places/route";
import { POST as regenerateQr, setTestDbClient as setRegenerateDb } from "@/../app/api/admin/qr/regenerate/route";
import { POST as endSession, setTestDbClient as setEndSessionDb } from "@/../app/api/admin/sessions/[id]/end/route";
import { POST as endCounterSession, setTestDbClient as setEndCounterSessionDb } from "@/../app/api/admin/counters/[id]/end-session/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
import { PlaceType } from "@/domain/qr/qr-token.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return { ...actual, getCsrfCookie: vi.fn() };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("Admin QR Hub & Universal Session Termination Integration Tests (Milestone 8.5.10)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "admin-qr-hub-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setQrPlacesDb(null);
    setRegenerateDb(null);
    setEndSessionDb(null);
    setEndCounterSessionDb(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  it("GET /api/admin/qr/places returns 401 when session is missing", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);

    const request = new NextRequest("http://localhost/api/admin/qr/places", {
      method: "GET",
    });

    const response = await getQrPlaces(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("manages QR regeneration, places listing, and universal session termination", async () => {
    await withTransaction(async (tx) => {
      setQrPlacesDb(tx);
      setRegenerateDb(tx);
      setEndSessionDb(tx);
      setEndCounterSessionDb(tx);

      // 1. Setup venue and manager
      const venueRepo = createPrismaVenueRepository(tx);
      const venueResult = await venueRepo.create({
        slug: "juniper-house",
        name: "Juniper House",
        taxRate: "0.1300",
        currency: "NPR",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venue = venueResult.value;

      const staffRepo = createPrismaStaffRepository(tx);
      const passwordHash = await hashPassword("ValidPassword123!");
      const staffResult = await staffRepo.create({
        venueId: venue.id,
        name: "Test Manager",
        username: "testmanager",
        passwordHash,
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const staff = staffResult.value;

      const session = await createSession(tx, staff.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      // 2. Setup counter, table, room, and an active QR token
      const counter = await tx.counter.create({
        data: { venueId: venue.id, name: "Main Counter" },
      });
      const table = await tx.table.create({
        data: { venueId: venue.id, number: "T100" },
      });
      const oldToken = await tx.qrToken.create({
        data: {
          venueId: venue.id,
          placeType: "TABLE",
          tableId: table.id,
          state: "ACTIVE",
        },
      });

      // 3. Create active QR token and guest session for the counter
      const counterToken = await tx.qrToken.create({
        data: {
          venueId: venue.id,
          placeType: "COUNTER",
          counterId: counter.id,
          state: "ACTIVE",
        },
      });

      const counterSession = await tx.guestSession.create({
        data: {
          venueId: venue.id,
          qrTokenId: counterToken.id,
          placeType: "COUNTER",
          counterId: counter.id,
        },
      });

      // 4. Test GET /api/admin/qr/places
      const listReq = new NextRequest("http://localhost/api/admin/qr/places", {
        method: "GET",
      });
      const listRes = await getQrPlaces(listReq);
      expect(listRes.status).toBe(200);
      const listJson = await listRes.json();
      expect(listJson.data.totalPlaces).toBeGreaterThanOrEqual(2);
      expect(listJson.data.activeSessionsCount).toBeGreaterThanOrEqual(1);

      // Verify counter place view has activeSession
      const counterView = listJson.data.places.find(
        (p: { id: string }) => p.id === counter.id
      );
      expect(counterView).toBeDefined();
      expect(counterView.activeSession).not.toBeNull();
      expect(counterView.activeSession.id).toBe(counterSession.id);

      // 5. Test POST /api/admin/qr/regenerate (atomically revoking old token and creating new)
      const regenReq = new NextRequest("http://localhost/api/admin/qr/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
        },
        body: JSON.stringify({
          placeType: "TABLE",
          placeId: table.id,
        }),
      });

      const regenRes = await regenerateQr(regenReq);
      expect(regenRes.status).toBe(201);
      const regenJson = await regenRes.json();
      expect(regenJson.data.id).not.toBe(oldToken.id);
      expect(regenJson.data.state).toBe("ACTIVE");

      // Verify old token is now REVOKED
      const updatedOldToken = await tx.qrToken.findUnique({
        where: { id: oldToken.id },
      });
      expect(updatedOldToken?.state).toBe("REVOKED");

      // 6. Test Universal End Session: POST /api/admin/sessions/[id]/end
      const endReq = new NextRequest(
        `http://localhost/api/admin/sessions/${counterSession.id}/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf-token",
          },
        }
      );

      const endRes = await endSession(endReq, {
        params: Promise.resolve({ id: counterSession.id }),
      });
      expect(endRes.status).toBe(200);

      // Verify counter session is ended
      const updatedSession = await tx.guestSession.findUnique({
        where: { id: counterSession.id },
      });
      expect(updatedSession?.endedAt).not.toBeNull();
    });
  });
});
