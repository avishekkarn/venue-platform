import { cookies } from "next/headers";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getSession } from "@/domain/auth/get-session";
import { validateSession } from "@/infrastructure/auth/session";
import { StaffState, type StaffMember } from "@/domain/auth/staff.repository";

let cachedVenueId: string | null = null;

async function getVenueId(): Promise<string | null> {
  if (cachedVenueId && process.env["NODE_ENV"] !== "test") {
    return cachedVenueId;
  }
  const venueRepo = createPrismaVenueRepository(prisma);
  const result = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );
  if (result.ok) {
    if (process.env["NODE_ENV"] !== "test") {
      cachedVenueId = result.value.id;
    }
    return result.value.id;
  }
  return null;
}

export async function getAuthenticatedStaff(): Promise<StaffMember | null> {
  const cookieStore = await cookies();
  const staffCookie = cookieStore.get("venue_staff");
  if (!staffCookie?.value) {
    return null;
  }

  const venueId = await getVenueId();
  if (!venueId) {
    return null;
  }

  const sessionResult = await getSession(
    {
      validateSession: (token) => validateSession(prisma, token),
    },
    staffCookie.value
  );

  if (!sessionResult.ok) {
    return null;
  }

  const staffRepo = createPrismaStaffRepository(prisma);
  const staffResult = await staffRepo.findById(
    venueId,
    sessionResult.value.staffMemberId
  );

  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return null;
  }

  return staffResult.value;
}
