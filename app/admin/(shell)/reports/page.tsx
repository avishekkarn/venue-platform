import { type JSX } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { getVenueSlug } from "@/infrastructure/config/venue";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { ReportsDashboardView } from "./_reports-dashboard-view";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage(): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);
  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findBySlug(getVenueSlug());

  const currency = venueResult.ok ? venueResult.value.currency : "NPR";
  const venueName = venueResult.ok ? venueResult.value.name : "Venue Platform";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <ReportsDashboardView
        staffId={staff.id}
        staffName={staff.name}
        currency={currency}
        venueName={venueName}
      />
    </div>
  );
}
