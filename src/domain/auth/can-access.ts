import { StaffRole } from "@/domain/auth/staff.repository";

/**
 * The areas a staff member can be granted access to.
 * Maps to the route groups: /admin, /kitchen, /staff/table, /staff/room, etc.
 */
export type Area =
  | "admin"
  | "kitchen"
  | "table-service"
  | "room-service"
  | "housekeeping"
  | "maintenance"
  | "concierge"
  | "laundry"
  | "spa"
  | "front-desk";

/**
 * Evaluates if a set of staff roles grants access to a specific area.
 * 
 * Implements the role-to-area mapping defined in SYSTEM.md §7.1.
 * A staff member with multiple roles has access to the union of their roles' areas.
 */
export function canAccess(roles: readonly StaffRole[], area: Area): boolean {
  // Owner and Manager have access to everything (SYSTEM.md §7.1).
  if (roles.includes(StaffRole.OWNER) || roles.includes(StaffRole.MANAGER)) {
    return true;
  }

  switch (area) {
    case "kitchen":
      return roles.includes(StaffRole.CHEF);
    case "table-service":
      return roles.includes(StaffRole.TABLE_SERVICE);
    case "room-service":
      return roles.includes(StaffRole.ROOM_SERVICE);
    case "housekeeping":
      return roles.includes(StaffRole.HOUSEKEEPING);
    case "maintenance":
      return roles.includes(StaffRole.MAINTENANCE);
    case "concierge":
      return roles.includes(StaffRole.CONCIERGE);
    case "laundry":
      return roles.includes(StaffRole.LAUNDRY);
    case "spa":
      return roles.includes(StaffRole.SPA);
    case "front-desk":
      return roles.includes(StaffRole.FRONT_DESK);
    case "admin":
      // Only Owner and Manager have admin access; already handled above.
      return false;
    default:
      // Exhaustive check (TypeScript ensures all Area cases are handled).
      return false;
  }
}
