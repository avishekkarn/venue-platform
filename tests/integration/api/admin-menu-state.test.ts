import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { POST, setTestDbClient } from "@/../app/api/admin/menu/items/[id]/state/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";
import { auditFilePath, type AuditEvent } from "@/infrastructure/audit/logger";
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

describe("POST /api/admin/menu/items/[id]/state — audit (8.3.0.F, W-0021)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "menu-state-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });
  afterEach(() => {
    setTestDbClient(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  function readAuditLines(): AuditEvent[] {
    const filePath = auditFilePath(new Date());
    if (!existsSync(filePath)) return [];
    return readFileSync(filePath, "utf8")
      .split("\n")
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as AuditEvent);
  }

  it("writes an audit line with status 200 and the MANAGER actor on a valid transition", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      const venueResult = await venueRepo.create({ name: "Juniper House", slug: venueSlug, taxRate: "0.0825" });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const staffResult = await staffRepo.create({
        venueId, name: "Alice Manager", username: "alice_menu_state_audit",
        passwordHash: await hashPassword("password123"), roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;
      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const categoryResult = await menuRepo.createCategory({ venueId, name: "Starters", sortOrder: 1 });
      expect(categoryResult.ok).toBe(true);
      if (!categoryResult.ok) return;
      const itemResult = await menuRepo.createItem({
        venueId, categoryId: categoryResult.value.id, name: "Soup", price: "6.50",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;
      const itemId = itemResult.value.id;

      const request = new NextRequest(
        `http://localhost/api/admin/menu/items/${itemId}/state`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({ state: MenuItemState.UNAVAILABLE }),
        }
      );
      const response = await POST(request, { params: Promise.resolve({ id: itemId }) });
      expect(response.status).toBe(200);

      const lines = readAuditLines();
      expect(lines).toHaveLength(1);
      const line = lines[0];
      expect(line).toBeDefined();
      if (!line) return;
      expect(line.route).toBe("/api/admin/menu/items/[id]/state");
      expect(line.method).toBe("POST");
      expect(line.status).toBe(200);
      expect(line.actorType).toBe("staff");
      expect(line.actorRole).toBe("MANAGER");
      expect(line.venueId).toBe(venueId);
      expect(line.ip).not.toBeNull();
      expect(line.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  it("writes an audit line with status 403 when the CSRF header is missing", async () => {
    await withTransaction(async (tx) => {
      setTestDbClient(tx);
      vi.mocked(getSessionCookie).mockResolvedValue(null);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const id = "11111111-2222-3333-4444-555555555555";
      const request = new NextRequest(
        `http://localhost/api/admin/menu/items/${id}/state`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: MenuItemState.UNAVAILABLE }) }
      );
      const response = await POST(request, { params: Promise.resolve({ id }) });
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe("FORBIDDEN");
      expect(json.error.message).toBe("CSRF token missing or invalid");

      const lines = readAuditLines();
      expect(lines).toHaveLength(1);
      const line = lines[0];
      expect(line).toBeDefined();
      if (!line) return;
      expect(line.route).toBe("/api/admin/menu/items/[id]/state");
      expect(line.method).toBe("POST");
      expect(line.status).toBe(403);
    });
  });
});
