import { describe, it, expect } from "vitest";
import { canAccess } from "@/domain/auth/can-access";
import { StaffRole } from "@/domain/auth/staff.repository";

describe("canAccess domain function", () => {
  it("grants Owner access to admin, kitchen, and table-service", () => {
    const roles = [StaffRole.OWNER];

    expect(canAccess(roles, "admin")).toBe(true);
    expect(canAccess(roles, "kitchen")).toBe(true);
    expect(canAccess(roles, "table-service")).toBe(true);
  });

  it("grants Manager access to admin, kitchen, and table-service", () => {
    const roles = [StaffRole.MANAGER];

    expect(canAccess(roles, "admin")).toBe(true);
    expect(canAccess(roles, "kitchen")).toBe(true);
    expect(canAccess(roles, "table-service")).toBe(true);
  });

  it("grants Chef access to kitchen, but not admin or table-service", () => {
    const roles = [StaffRole.CHEF];

    expect(canAccess(roles, "kitchen")).toBe(true);
    expect(canAccess(roles, "admin")).toBe(false);
    expect(canAccess(roles, "table-service")).toBe(false);
  });

  it("grants Table Service access to table-service, but not admin or kitchen", () => {
    const roles = [StaffRole.TABLE_SERVICE];

    expect(canAccess(roles, "table-service")).toBe(true);
    expect(canAccess(roles, "admin")).toBe(false);
    expect(canAccess(roles, "kitchen")).toBe(false);
  });

  it("grants access to the union of multiple roles", () => {
    const roles = [StaffRole.TABLE_SERVICE, StaffRole.HOUSEKEEPING];

    expect(canAccess(roles, "table-service")).toBe(true);
    expect(canAccess(roles, "housekeeping")).toBe(true);
    expect(canAccess(roles, "admin")).toBe(false);
  });

  it("denies access to any area when roles array is empty", () => {
    const roles: StaffRole[] = [];

    expect(canAccess(roles, "admin")).toBe(false);
    expect(canAccess(roles, "kitchen")).toBe(false);
    expect(canAccess(roles, "table-service")).toBe(false);
    expect(canAccess(roles, "room-service")).toBe(false);
    expect(canAccess(roles, "housekeeping")).toBe(false);
    expect(canAccess(roles, "maintenance")).toBe(false);
    expect(canAccess(roles, "concierge")).toBe(false);
    expect(canAccess(roles, "laundry")).toBe(false);
    expect(canAccess(roles, "spa")).toBe(false);
    expect(canAccess(roles, "front-desk")).toBe(false);
  });
});
