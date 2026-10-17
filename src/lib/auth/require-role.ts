import { redirect } from "next/navigation";
import { getAuthenticatedStaff } from "@/lib/auth/validate-session";
import { canAccess, type Area } from "@/domain/auth/can-access";
import type { StaffMember } from "@/domain/auth/staff.repository";

/**
 * Validates that the current user has an active staff session and possesses
 * access to at least one of the specified allowed areas.
 *
 * If the user is unauthenticated, redirects to `/staff/login`.
 * If the user lacks access to any of the specified areas, redirects to `/forbidden`.
 *
 * @param allowedAreas The areas permitted for the page.
 * @returns The authenticated StaffMember object.
 */
export async function requireRole(allowedAreas: Area[]): Promise<StaffMember> {
  const staff = await getAuthenticatedStaff();
  if (!staff) {
    redirect("/staff/login");
  }

  const hasAccess = allowedAreas.some((area) => canAccess(staff.roles, area));
  if (!hasAccess) {
    redirect("/forbidden");
  }

  return staff;
}
