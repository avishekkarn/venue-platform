import type { JSX } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { StaffManagementView } from "./_staff-management-view";
import type { StaffPlacesData, AdminStaffItem } from "./_types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminStaffPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findById(staff.venueId);
  if (!venueResult.ok) {
    notFound();
  }
  const venue = venueResult.value;

  // Initial staff data fetch
  const rawStaffList = await prisma.staffMember.findMany({
    where: { venueId: venue.id },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      _count: {
        select: {
          orderChanges: true,
          requestChanges: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const roleCounts: Record<string, number> = {};
  for (const r of Object.values(StaffRole)) {
    roleCounts[r] = 0;
  }

  let totalStaff = 0;
  let activeStaff = 0;
  let deactivatedStaff = 0;
  let onlineStaff = 0;

  const staffItems: AdminStaffItem[] = rawStaffList.map((m) => {
    totalStaff++;
    if (m.state === "ACTIVE") activeStaff++;
    if (m.state === "DEACTIVATED") deactivatedStaff++;

    for (const r of m.roles) {
      roleCounts[r] = (roleCounts[r] || 0) + 1;
    }

    // Determine online presence: has an un-ended session (D-3.2: no automatic timeout)
    const activeSession = m.sessions.find((s) => s.endedAt === null);
    const isOnline = !!activeSession && m.state === "ACTIVE";
    if (isOnline) onlineStaff++;

    const lastSession = m.sessions[0];
    const lastLoginAt = lastSession ? lastSession.createdAt.toISOString() : null;

    let activeMinutesToday = 0;
    let activeMinutesWeek = 0;
    let totalHistoricalMinutes = 0;

    for (const s of m.sessions) {
      const sStart = new Date(s.createdAt);
      const sEnd = s.endedAt ? new Date(s.endedAt) : now;
      const durationMs = Math.max(0, sEnd.getTime() - sStart.getTime());
      const durationMins = Math.round(durationMs / 60000);

      totalHistoricalMinutes += durationMins;

      if (sEnd.getTime() >= startOfToday.getTime()) {
        const overlapStart = Math.max(sStart.getTime(), startOfToday.getTime());
        activeMinutesToday += Math.round(Math.max(0, sEnd.getTime() - overlapStart) / 60000);
      }

      if (sEnd.getTime() >= sevenDaysAgo.getTime()) {
        const overlapStart = Math.max(sStart.getTime(), sevenDaysAgo.getTime());
        activeMinutesWeek += Math.round(Math.max(0, sEnd.getTime() - overlapStart) / 60000);
      }
    }

    return {
      id: m.id,
      venueId: m.venueId,
      name: m.name,
      username: m.username,
      roles: m.roles as StaffRole[],
      state: m.state as StaffState,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      isOnline,
      lastLoginAt,
      activeSessionId: activeSession ? activeSession.id : null,
      shiftStartedAt: activeSession ? activeSession.createdAt.toISOString() : null,
      activeHoursTodayMinutes: activeMinutesToday,
      activeHoursWeekMinutes: activeMinutesWeek,
      totalHistoricalHours: Number((totalHistoricalMinutes / 60).toFixed(1)),
      ordersHandledCount: m._count.orderChanges,
      requestsResolvedCount: m._count.requestChanges,
    };
  });

  const initialData: StaffPlacesData = {
    staff: staffItems,
    summary: {
      totalStaff,
      activeStaff,
      deactivatedStaff,
      onlineStaff,
      roleCounts,
    },
  };

  return <StaffManagementView initialData={initialData} />;
}
