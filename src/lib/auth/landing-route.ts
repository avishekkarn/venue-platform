import { StaffRole } from "@/domain/auth/staff.repository";

/**
 * Returns the landing route for a staff member based on their roles.
 *
 * The top-level app is decided by the broadest role held:
 *   1. OWNER or MANAGER -> /admin
 *   2. CHEF             -> /kitchen
 *   3. Everything else  -> /staff (where visibleAreasFor filters the queues)
 *
 * A multi-role staff member (e.g., LEADER + TABLE_SERVICE) lands at
 * the highest-level app they can access. A LEADER lands at /staff,
 * where their role grants them every hospitality queue. A focused
 * TABLE_SERVICE also lands at /staff, where their role limits them
 * to only the table queue.
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
