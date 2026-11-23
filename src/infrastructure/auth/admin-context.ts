import { type PrismaClient, type Prisma } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getSessionCookie } from "@/infrastructure/auth/cookies";
import { validateSession } from "@/infrastructure/auth/session";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaStaffRepository } from "@/infrastructure/db/repositories/staff.repo";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { canAccess } from "@/domain/auth/can-access";
import { StaffState, type StaffMember } from "@/domain/auth/staff.repository";
import { type Venue } from "@/domain/organization/venue.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import type { ActorResolvers } from "@/infrastructure/audit/logger";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export interface AdminContextSuccess {
  readonly ok: true;
  readonly venue: Venue;
  readonly staff: StaffMember;
  readonly session: { readonly id: string; readonly staffMemberId: string };
}

export interface AdminContextFailure {
  readonly ok: false;
  readonly status: number;
  readonly code: DomainErrorCode;
  readonly message: string;
}

export type AdminContextResult = AdminContextSuccess | AdminContextFailure;

export async function resolveAdminContext(db: DbClient): Promise<AdminContextResult> {
  const sessionToken = await getSessionCookie();
  if (!sessionToken) {
    return { ok: false, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  const session = await validateSession(db, sessionToken);
  if (!session) {
    return { ok: false, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());
  if (!venueResult.ok) {
    return { ok: false, status: 500, code: DomainErrorCode.INTERNAL, message: "Venue not configured" };
  }
  const venue = venueResult.value;

  const staffRepo = createPrismaStaffRepository(db);
  const staffResult = await staffRepo.findById(venue.id, session.staffMemberId);
  if (!staffResult.ok || staffResult.value.state === StaffState.DEACTIVATED) {
    return { ok: false, status: 401, code: DomainErrorCode.UNAUTHORIZED, message: "No active session" };
  }
  if (!canAccess(staffResult.value.roles, "admin")) {
    return { ok: false, status: 403, code: DomainErrorCode.FORBIDDEN, message: "Insufficient permissions" };
  }

  return {
    ok: true,
    venue,
    staff: staffResult.value,
    session: { id: session.id, staffMemberId: session.staffMemberId },
  };
}

export const adminResolvers: ActorResolvers = {
  resolveStaff: async () => {
    const token = await getSessionCookie();
    if (!token) return null;
    const session = await validateSession(prisma, token);
    if (!session) return null;
    const venueRepo = createPrismaVenueRepository(prisma);
    const venueResult = await venueRepo.findBySlug(getVenueSlug());
    if (!venueResult.ok) return null;
    const staffRepo = createPrismaStaffRepository(prisma);
    const staffResult = await staffRepo.findById(venueResult.value.id, session.staffMemberId);
    if (!staffResult.ok) return null;
    const staff = staffResult.value;
    if (staff.state === StaffState.DEACTIVATED) return null;
    return {
      actorId: staff.id,
      actorRole: staff.roles[0] ?? "UNKNOWN",
      venueId: venueResult.value.id,
    };
  },
  resolveGuest: async () => null,
};
