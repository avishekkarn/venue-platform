import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  POST,
  setTestDbClient as setModifiersTestDbClient,
} from "@/../app/api/admin/menu/modifiers/route";
import {
  PATCH,
  DELETE,
  setTestDbClient as setModifierDynamicTestDbClient,
} from "@/../app/api/admin/menu/modifiers/[id]/route";
import {
  POST as POST_OPTION,
  setTestDbClient as setModifierOptionsTestDbClient,
} from "@/../app/api/admin/menu/modifiers/[id]/options/route";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { createPrismaMenuRepository } from "@/infrastructure/db/repositories/menu.repo";
import { createSession } from "@/infrastructure/auth/session";
import { hashPassword } from "@/infrastructure/auth/password";
import { StaffRole } from "@/domain/auth/staff.repository";
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

describe("Admin Menu Modifiers API Integration Tests (8.3.6.B)", () => {
  let auditDir: string;
  const originalAuditLogDir = process.env["AUDIT_LOG_DIR"];

  beforeEach(() => {
    vi.clearAllMocks();
    auditDir = mkdtempSync(join(tmpdir(), "menu-modifiers-audit-test-"));
    process.env["AUDIT_LOG_DIR"] = auditDir;
  });

  afterEach(() => {
    setModifiersTestDbClient(null);
    setModifierDynamicTestDbClient(null);
    setModifierOptionsTestDbClient(null);
    if (existsSync(auditDir)) rmSync(auditDir, { recursive: true, force: true });
    if (originalAuditLogDir === undefined) delete process.env["AUDIT_LOG_DIR"];
    else process.env["AUDIT_LOG_DIR"] = originalAuditLogDir;
  });

  it("Test 1: returns 401 UNAUTHORIZED when session is missing (POST)", async () => {
    vi.mocked(getSessionCookie).mockResolvedValue(null);
    vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

    const request = new NextRequest("http://localhost/api/admin/menu/modifiers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "test-csrf-token",
      },
      body: JSON.stringify({
        menuItemId: "11111111-2222-3333-4444-555555555555",
        name: "Size",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.code).toBe(DomainErrorCode.UNAUTHORIZED);
  });

  it("Test 2: returns 403 FORBIDDEN for LEADER role (POST)", async () => {
    await withTransaction(async (tx) => {
      setModifiersTestDbClient(tx);
      setModifierDynamicTestDbClient(tx);
      setModifierOptionsTestDbClient(tx);

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
        username: "leader_modifier_create",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.LEADER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost/api/admin/menu/modifiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          menuItemId: "11111111-2222-3333-4444-555555555555",
          name: "Size",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.FORBIDDEN);
    });
  });

  it("Test 3: returns 400 VALIDATION_FAILED when name is missing (POST)", async () => {
    await withTransaction(async (tx) => {
      setModifiersTestDbClient(tx);
      setModifierDynamicTestDbClient(tx);
      setModifierOptionsTestDbClient(tx);

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
        username: "alice_modifier_400",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      const request = new NextRequest("http://localhost/api/admin/menu/modifiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          menuItemId: "11111111-2222-3333-4444-555555555555",
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe(DomainErrorCode.VALIDATION_FAILED);
      expect(json.error.message).toContain("name is required");
    });
  });

  it("Test 4: full lifecycle (POST group 201 -> PATCH group 200 -> POST option 201 -> DELETE group 204)", async () => {
    await withTransaction(async (tx) => {
      setModifiersTestDbClient(tx);
      setModifierDynamicTestDbClient(tx);
      setModifierOptionsTestDbClient(tx);

      const venueRepo = createPrismaVenueRepository(tx);
      const staffRepo = createPrismaStaffRepository(tx);
      const menuRepo = createPrismaMenuRepository(tx);
      const venueSlug = process.env["VENUE_SLUG"] ?? "juniper-house";

      // a. Venue + MANAGER setup
      const venueResult = await venueRepo.create({
        name: "Juniper House",
        slug: venueSlug,
        taxRate: "0.0825",
      });
      expect(venueResult.ok).toBe(true);
      if (!venueResult.ok) return;
      const venueId = venueResult.value.id;

      const staffResult = await staffRepo.create({
        venueId,
        name: "Alice Manager",
        username: "alice_modifier_lifecycle",
        passwordHash: await hashPassword("password123"),
        roles: [StaffRole.MANAGER],
      });
      expect(staffResult.ok).toBe(true);
      if (!staffResult.ok) return;

      const session = await createSession(tx, staffResult.value.id);
      vi.mocked(getSessionCookie).mockResolvedValue(session.token);
      vi.mocked(getCsrfCookie).mockResolvedValue("test-csrf-token");

      // b. Create a category + menuItem
      const catResult = await menuRepo.createCategory({
        venueId,
        name: "Mains",
        sortOrder: 1,
      });
      expect(catResult.ok).toBe(true);
      if (!catResult.ok) return;

      const itemResult = await menuRepo.createItem({
        venueId,
        categoryIds: [catResult.value.id],
        name: "Pizza",
        price: "10.00",
      });
      expect(itemResult.ok).toBe(true);
      if (!itemResult.ok) return;
      const itemId = itemResult.value.id;

      // c. POST /api/admin/menu/modifiers with { menuItemId, name: "Size", choiceType: "SINGLE", isRequired: true } -> 201
      const createGroupReq = new NextRequest("http://localhost/api/admin/menu/modifiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": "test-csrf-token",
          "x-forwarded-for": "127.0.0.1",
        },
        body: JSON.stringify({
          menuItemId: itemId,
          name: "Size",
          choiceType: "SINGLE",
          isRequired: true,
        }),
      });
      const createGroupRes = await POST(createGroupReq);
      expect(createGroupRes.status).toBe(201);
      const groupJson = await createGroupRes.json();
      expect(groupJson.data.name).toBe("Size");
      const groupId = groupJson.data.id;

      // d. PATCH /<groupId> with { name: "Size (large)" } -> 200
      const patchGroupReq = new NextRequest(
        `http://localhost/api/admin/menu/modifiers/${groupId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({ name: "Size (large)" }),
        }
      );
      const patchGroupRes = await PATCH(patchGroupReq, {
        params: Promise.resolve({ id: groupId }),
      });
      expect(patchGroupRes.status).toBe(200);
      const patchJson = await patchGroupRes.json();
      expect(patchJson.data.name).toBe("Size (large)");

      // e. POST /<groupId>/options with { name: "Large", additionalPrice: "2.50" } -> 201
      const createOptionReq = new NextRequest(
        `http://localhost/api/admin/menu/modifiers/${groupId}/options`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
          body: JSON.stringify({
            name: "Large",
            additionalPrice: "2.50",
          }),
        }
      );
      const createOptionRes = await POST_OPTION(createOptionReq, {
        params: Promise.resolve({ id: groupId }),
      });
      expect(createOptionRes.status).toBe(201);
      const optionJson = await createOptionRes.json();
      expect(optionJson.data.name).toBe("Large");
      expect(optionJson.data.additionalPrice).toBe("2.50");

      // f. DELETE /<groupId> -> 204
      const deleteGroupReq = new NextRequest(
        `http://localhost/api/admin/menu/modifiers/${groupId}`,
        {
          method: "DELETE",
          headers: {
            "X-CSRF-Token": "test-csrf-token",
            "x-forwarded-for": "127.0.0.1",
          },
        }
      );
      const deleteGroupRes = await DELETE(deleteGroupReq, {
        params: Promise.resolve({ id: groupId }),
      });
      expect(deleteGroupRes.status).toBe(204);
    });
  });
});
