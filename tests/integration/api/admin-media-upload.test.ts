import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, existsSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import sharp from "sharp";
import { POST, setTestDbClient } from "@/../app/api/admin/media/upload/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createSession } from "@/infrastructure/auth/session";
import { StaffRole } from "@/domain/auth/staff.repository";
import { hashPassword } from "@/infrastructure/auth/password";
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
  return {
    ...actual,
    getCsrfCookie: vi.fn(),
  };
});

import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { getCsrfCookie } from "@/infrastructure/csrf/cookies";

describe("POST /api/admin/media/upload Integration Tests", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];
  const createdFiles: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "media-upload-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setTestDbClient(null);
    if (existsSync(auditDir)) {
      rmSync(auditDir, { recursive: true, force: true });
    }
    if (originalAuditLogDir === undefined) {
      delete process.env["AUDIT_LOG_DIR"];
    } else {
      process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
    }
    for (const file of createdFiles) {
      if (existsSync(file)) {
        try {
          unlinkSync(file);
        } catch {
          // ignore
        }
      }
    }
    createdFiles.length = 0;
  });

  it("returns 401 UNAUTHORIZED without session cookie", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

    const formData = new FormData();
    const file = new File([Buffer.from("fake-image")], "test.png", { type: "image/png" });
    formData.append("file", file);

    const request = new NextRequest("http://localhost/api/admin/media/upload", {
      method: "POST",
      headers: {
        "X-CSRF-Token": "test-csrf-token",
      },
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("returns 403 FORBIDDEN for LEADER role", async () => {
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
        name: "Leader Staff",
        username: "leader_staff_media_test",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const formData = new FormData();
      const file = new File([Buffer.from("fake-image")], "test.png", { type: "image/png" });
      formData.append("file", file);

      const request = new NextRequest("http://localhost/api/admin/media/upload", {
        method: "POST",
        headers: {
          "X-CSRF-Token": "test-csrf-token",
        },
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("returns 400 VALIDATION_FAILED for invalid MIME type (text/plain)", async () => {
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
        name: "Alice Manager",
        username: "alice_manager_upload_mime",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const formData = new FormData();
      const file = new File([Buffer.from("plain text content")], "test.txt", { type: "text/plain" });
      formData.append("file", file);

      const request = new NextRequest("http://localhost/api/admin/media/upload", {
        method: "POST",
        headers: {
          "X-CSRF-Token": "test-csrf-token",
        },
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
    });
  });

  it("processes valid image, returns 200 with photoUrl and photoBlurData, writes webp to disk", async () => {
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
        name: "Alice Manager",
        username: "alice_manager_upload_ok",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      // Generate a small 100x100 PNG buffer using sharp
      const samplePng = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 0, b: 0 },
        },
      })
        .png()
        .toBuffer();

      const formData = new FormData();
      const file = new File([samplePng], "sample.png", { type: "image/png" });
      formData.append("file", file);

      const request = new NextRequest("http://localhost/api/admin/media/upload", {
        method: "POST",
        headers: {
          "X-CSRF-Token": "test-csrf-token",
        },
        body: formData,
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();
      expect(json.data.photoUrl).toMatch(/^\/uploads\/catalog\/[a-f0-9-]+\.webp$/);
      expect(json.data.photoBlurData).toMatch(/^data:image\/webp;base64,/);

      // Verify file written to disk
      const fullDiskPath = join(process.cwd(), "public", json.data.photoUrl.replace(/^\//, ""));
      createdFiles.push(fullDiskPath);
      expect(existsSync(fullDiskPath)).toBe(true);

      // Verify magic bytes: RIFF at 0..3, WEBP at 8..11
      const fileBytes = readFileSync(fullDiskPath);
      expect(fileBytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(fileBytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
    });
  });
});
