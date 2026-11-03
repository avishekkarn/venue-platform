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
  // OWNER and MANAGER have access to every area (SYSTEM.md §7.1).
  if (roles.includes(StaffRole.OWNER) || roles.includes(StaffRole.MANAGER)) {
    return true;
  }
  // LEADER has access to every hospitality area, but not the admin panel (D-18.2).
  if (roles.includes(StaffRole.LEADER) && area !== "admin") {
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

/**
 * Returns the areas a staff member sees by default.
 *
 * OWNER / MANAGER: every area, including "admin".
 * LEADER:          every hospitality area (not "admin").
 * FRONT_DESK:      combined view of all room service requests (SYSTEM.md §7.1).
 * FOCUSED:         only the areas their roles map to.
 *
 * Reference: D-18.1, D-18.2, SYSTEM.md §7.1.
 */
export function visibleAreasFor(roles: readonly StaffRole[]): readonly Area[] {
  if (roles.includes(StaffRole.OWNER) || roles.includes(StaffRole.MANAGER)) {
    return [
      "admin",
      "kitchen",
      "table-service",
      "room-service",
      "housekeeping",
      "maintenance",
      "concierge",
      "laundry",
      "spa",
      "front-desk",
    ];
  }
  if (roles.includes(StaffRole.LEADER)) {
    return [
      "kitchen",
      "table-service",
      "room-service",
      "housekeeping",
      "maintenance",
      "concierge",
      "laundry",
      "spa",
      "front-desk",
    ];
  }
  if (roles.includes(StaffRole.FRONT_DESK)) {
    return [
      "room-service",
      "housekeeping",
      "maintenance",
      "concierge",
      "laundry",
      "spa",
      "front-desk",
    ];
  }
  const areas: Area[] = [];
  if (roles.includes(StaffRole.CHEF)) areas.push("kitchen");
  if (roles.includes(StaffRole.TABLE_SERVICE)) areas.push("table-service");
  if (roles.includes(StaffRole.ROOM_SERVICE)) areas.push("room-service");
  if (roles.includes(StaffRole.HOUSEKEEPING)) areas.push("housekeeping");
  if (roles.includes(StaffRole.MAINTENANCE)) areas.push("maintenance");
  if (roles.includes(StaffRole.CONCIERGE)) areas.push("concierge");
  if (roles.includes(StaffRole.LAUNDRY)) areas.push("laundry");
  if (roles.includes(StaffRole.SPA)) areas.push("spa");
  return areas;
}
