import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { rmSync, mkdtempSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { GET, setTestDbClient } from "@/../app/api/admin/audit/export/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
import { withTransaction } from "../setup";

vi.mock("@/infrastructure/auth/cookies", () => ({
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock("@/infrastructure/guest/cookies", () => ({
  getGuestCookie: vi.fn(),
  setGuestCookie: vi.fn(),
  clearGuestCookie: vi.fn(),
}));

vi.mock("@/infrastructure/csrf/cookies", async () => {
  const actual = await vi.importActual<typeof import("@/infrastructure/csrf/cookies")>(
    "@/infrastructure/csrf/cookies"
  );
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("GET /api/admin/audit/export Integration Tests", () => {
  let auditDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "audit-export-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
    vi.mocked(getGuestCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");
  });

  afterEach(() => {
    setTestDbClient(null);
    if (existsSync(auditDir)) {
      rmSync(auditDir, { recursive: true, force: true });
    }
    delete process.env["AUDIT_LOG_DIR"];
  });

  it("returns 200, application/zip, and a valid ZIP body when the admin has audit files", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const today = new Date();
      const stamp =
        `${today.getUTCFullYear()}` +
        `-${String(today.getUTCMonth() + 1).padStart(2, "0")}` +
        `-${String(today.getUTCDate()).padStart(2, "0")}`;
      mkdirSync(auditDir, { recursive: true });
      writeFileSync(
        join(auditDir, `${stamp}.jsonl`),
        '{"timestamp":"2026-11-12T10:00:00.000Z"}\n',
        "utf8"
      );

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Manager",
        username: "alice_audit_export",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/audit/export", {
        method: "GET",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/zip");
      expect(response.headers.get("content-disposition")).toMatch(
        /^attachment; filename="audit-\d{4}-\d{2}-\d{2}\.zip"$/
      );

      const buf = Buffer.from(await response.arrayBuffer());
      expect(buf.length).toBeGreaterThan(0);
      expect(buf[0]).toBe(0x50); // 'P'
      expect(buf[1]).toBe(0x4b); // 'K'
      expect(buf[2]).toBe(0x03);
      expect(buf[3]).toBe(0x04);
    });
  });

  it("returns 401 UNAUTHORIZED without a session cookie", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/admin/audit/export", {
        method: "GET",
      });
      const response = await GET(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHORIZED");
      expect(json.error.message).toBe("No active session");
    });
  });

  it("returns 403 FORBIDDEN for a CHEF (non-admin) staff member", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Chef Charlie",
        username: "chef_audit_export",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.CHEF],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/audit/export", {
        method: "GET",
      });
      const response = await GET(request);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toBe("Insufficient permissions");
    });
  });

  it("returns 200 with an empty (but valid) ZIP when the audit directory has no files", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Alice Owner",
        username: "alice_audit_export_empty",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.OWNER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/audit/export", {
        method: "GET",
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("application/zip");
      const buf = Buffer.from(await response.arrayBuffer());
      expect(buf.length).toBeGreaterThan(0);
      expect(buf[0]).toBe(0x50);
      expect(buf[1]).toBe(0x4b);
    });
  });

  it("returns 403 FORBIDDEN for a LEADER (not admin per D-18.2)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";
      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;

      const staffResult = await staffRepo.create({
        venueId: venueResult.value.id,
        name: "Leader Larry",
        username: "leader_audit_export",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);

      const request = new NextRequest("http://localhost/api/admin/audit/export", {
        method: "GET",
      });
      const response = await GET(request);

      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
    });
  });

  it("end-to-end: a wrapped POST /api/admin/qr/generate call produces a log line that the export ZIP contains (7.7.1d)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      // Fresh audit dir. This test asserts on the exact line the wrapped
      // route writes, and that the export route's ZIP contains it.
      const auditDir = mkdtempSync(join(tmpdir(), "audit-e2e-test-"));
      process.env["AUDIT_LOG_DIR"] = auditDir;
      try {
        // 1. Seed a venue + a manager + a table.
        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.0825",
        });
        expect(venueResult.ok).toBe(true);
        if (!venueResult.ok) return;

        const table = await tx.table.create({
          data: { venueId: venueResult.value.id, number: "301" },
        });

        const staffResult = await staffRepo.create({
          venueId: venueResult.value.id,
          name: "Alice Manager",
          username: "alice_audit_e2e",
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.MANAGER],
        });
        expect(staffResult.ok).toBe(true);
        if (!staffResult.ok) return;

        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        // 2. Call the REAL wrapped QR generate route.
        const { POST: qrGeneratePOST, setTestDbClient: setQrGenerateDb } =
          await import("@/../app/api/admin/qr/generate/route");
        setQrGenerateDb(tx);

        const qrRequest = new NextRequest(
          "http://localhost/api/admin/qr/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": "test-csrf-token",
            },
            body: JSON.stringify({
              placeType: "TABLE",
              tableId: table.id,
            }),
          }
        );
        const qrResponse = await qrGeneratePOST(qrRequest);
        expect(qrResponse.status).toBe(201);

        // 3. Confirm the JSONL line exists for today's UTC date.
        const today = new Date();
        const stamp =
          `${today.getUTCFullYear()}` +
          `-${String(today.getUTCMonth() + 1).padStart(2, "0")}` +
          `-${String(today.getUTCDate()).padStart(2, "0")}`;
        const auditFile = join(auditDir, `${stamp}.jsonl`);
        expect(existsSync(auditFile)).toBe(true);
        const auditContent = readFileSync(auditFile, "utf8");
        expect(auditContent).toContain('"route":"/api/admin/qr/generate"');
        expect(auditContent).toContain(`"actorId":"${staffResult.value.id}"`);
        expect(auditContent).toContain('"status":201');

        // 4. Call the export route and download the ZIP.
        const exportRequest = new NextRequest(
          "http://localhost/api/admin/audit/export",
          { method: "GET" }
        );
        const exportResponse = await GET(exportRequest);
        expect(exportResponse.status).toBe(200);
        expect(exportResponse.headers.get("content-type")).toBe("application/zip");

        // 5. Assert the ZIP is valid (magic bytes).
        const zipBuf = Buffer.from(await exportResponse.arrayBuffer());
        expect(zipBuf.length).toBeGreaterThan(0);
        expect(zipBuf[0]).toBe(0x50);
        expect(zipBuf[1]).toBe(0x4b);
        expect(zipBuf[2]).toBe(0x03);
        expect(zipBuf[3]).toBe(0x04);

        // 6. The ZIP's local-file-header section names the file.
        const filename = `${stamp}.jsonl`;
        expect(zipBuf.includes(Buffer.from(filename, "utf8"))).toBe(true);

        // 7. Clear the qr/generate test DB client to leave the wrapper routes
        //    in a clean state for the next test.
        setQrGenerateDb(null);
      } finally {
        delete process.env["AUDIT_LOG_DIR"];
        if (existsSync(auditDir)) {
          rmSync(auditDir, { recursive: true, force: true });
        }
      }
    });
  });

  it("end-to-end: an unauthenticated call to a wrapped route logs an anonymous line that the export ZIP contains (7.7.1d)", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);

      const auditDir = mkdtempSync(join(tmpdir(), "audit-e2e-anon-test-"));
      process.env["AUDIT_LOG_DIR"] = auditDir;
      try {
        // 1. Seed a venue + a manager.
        const venueRepo = createPrismaVenueRepository(tx);
        const staffRepo = createPrismaStaffRepository(tx);
        const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

        const venueResult = await venueRepo.create({
          name: "Juniper House",
          slug: venueSlug,
          taxRate: "0.0825",
        });
        expect(venueResult.ok).toBe(true);
        if (!venueResult.ok) return;

        const staffResult = await staffRepo.create({
          venueId: venueResult.value.id,
          name: "Alice Manager",
          username: "alice_audit_e2e_anon",
          passwordHash: await hashPassword("password123"),
          roles: [StaffRole.MANAGER],
        });
        expect(staffResult.ok).toBe(true);
        if (!staffResult.ok) return;

        // 2. Call the wrapped QR generate route WITHOUT a session cookie.
        //    The wrapper logs an anonymous line; the handler returns 401.
        const { POST: qrGeneratePOST, setTestDbClient: setQrGenerateDb } =
          await import("@/../app/api/admin/qr/generate/route");
        setQrGenerateDb(tx);

        vi.mocked(getSessionCookie).mockResolvedValue(null);

        const qrRequest = new NextRequest(
          "http://localhost/api/admin/qr/generate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": "test-csrf-token",
            },
            body: JSON.stringify({ placeType: "TABLE", tableId: "dummy-table-id" }),
          }
        );
        const qrResponse = await qrGeneratePOST(qrRequest);
        expect(qrResponse.status).toBe(401);

        // 3. The wrapper wrote an anonymous audit line despite the 401.
        const today = new Date();
        const stamp =
          `${today.getUTCFullYear()}` +
          `-${String(today.getUTCMonth() + 1).padStart(2, "0")}` +
          `-${String(today.getUTCDate()).padStart(2, "0")}`;
        const auditFile = join(auditDir, `${stamp}.jsonl`);
        expect(existsSync(auditFile)).toBe(true);
        const auditContent = readFileSync(auditFile, "utf8");
        expect(auditContent).toContain('"actorType":"anonymous"');
        expect(auditContent).toContain('"status":401');

        // 4. Call the export route AS A MANAGER so it doesn't 401 itself.
        const session = await createSession(tx, staffResult.value.id);
        vi.mocked(getSessionCookie).mockResolvedValue(session.token);

        const exportRequest = new NextRequest(
          "http://localhost/api/admin/audit/export",
          { method: "GET" }
        );
        const exportResponse = await GET(exportRequest);
        expect(exportResponse.status).toBe(200);
        const zipBuf = Buffer.from(await exportResponse.arrayBuffer());
        expect(zipBuf.length).toBeGreaterThan(0);
        expect(zipBuf[0]).toBe(0x50);
        expect(zipBuf[1]).toBe(0x4b);

        // The ZIP contains the file whose contents the anonymous line is in.
        expect(zipBuf.includes(Buffer.from(`${stamp}.jsonl`, "utf8"))).toBe(true);

        setQrGenerateDb(null);
      } finally {
        delete process.env["AUDIT_LOG_DIR"];
        if (existsSync(auditDir)) {
          rmSync(auditDir, { recursive: true, force: true });
        }
      }
    });
  });
});

