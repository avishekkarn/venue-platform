import { StaffRole } from "@/domain/auth/staff.repository";

/**
 * Returns the landing route for a staff member based on their roles.
 * Role hierarchy for landing destinations:
 * 1. OWNER or MANAGER -> "/admin"
 * 2. CHEF -> "/kitchen"
 * 3. Any other role -> "/staff"
 */
export function getLandingRouteForRoles(roles: readonly StaffRole[]): string {
  if (roles.includes(StaffRole.OWNER) || roles.includes(StaffRole.MANAGER)) {
    return "/admin";
  }
  if (roles.includes(StaffRole.CHEF)) {
    return "/kitchen";
  }
  return "/staff";
}
