import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireRole } from "@/lib/auth/require-role";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import { StaffRole, StaffState, type StaffMember } from "@/domain/auth/staff.repository";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("@/lib/auth/validate-session", () => ({
  getAuthenticatedStaff: vi.fn(),
}));

describe("requireRole helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to /staff/login when no staff is authenticated", async () => {
    vi.mocked(getAuthenticatedStaff).mockResolvedValue(null);

    await expect(requireRole(["admin"])).rejects.toThrow("REDIRECT:/staff/login");
  });

  it("redirects to /forbidden when staff role does not grant access", async () => {
    const tableStaff: StaffMember = {
      id: "staff-1",
      venueId: "venue-1",
      name: "Server Bob",
      username: "bob",
      roles: [StaffRole.TABLE_SERVICE],
      state: StaffState.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getAuthenticatedStaff).mockResolvedValue(tableStaff);

    await expect(requireRole(["admin"])).rejects.toThrow("REDIRECT:/forbidden");
  });

  it("returns staff member when staff role grants access to allowed areas", async () => {
    const managerStaff: StaffMember = {
      id: "staff-2",
      venueId: "venue-1",
      name: "Manager Alice",
      username: "alice",
      roles: [StaffRole.MANAGER],
      state: StaffState.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(getAuthenticatedStaff).mockResolvedValue(managerStaff);

    const result = await requireRole(["admin", "kitchen"]);

    expect(result).toEqual(managerStaff);
  });
});
