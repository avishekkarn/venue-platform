import type { Metadata } from "next";
import type { JSX } from "react";
import Link from "next/link";
import { PhoneCall, ShieldAlert, ArrowLeft } from "lucide-react";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { getVenueSlug } from "@/infrastructure/config/venue";

export const metadata: Metadata = {
  title: "Table Reserved",
  robots: {
    index: false,
  },
};

interface ReservedPageProps {
  searchParams: Promise<{
    table?: string;
  }>;
}

export default async function ReservedTablePage({
  searchParams,
}: ReservedPageProps): Promise<JSX.Element> {
  const { table } = await searchParams;
  const tableLabel = table ? `Table ${table}` : "This Table";

  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(getVenueSlug());
  const venueName = venue.ok ? venue.value.name : "Juniper House";
  const venuePhone = "+977 1-4200000";

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-12 bg-guest-surface text-guest-text-primary">
      <div className="w-full max-w-[440px] rounded-2xl bg-guest-surface-raised border border-guest-border-subtle p-6 sm:p-8 shadow-sm text-center">
        {/* Reserved Icon & Badge */}
        <div className="mx-auto mb-4 size-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-inner">
          <ShieldAlert className="size-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Reserved
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-guest-text-primary mb-2">
          {tableLabel} is Reserved
        </h1>

        <p className="text-sm text-guest-text-secondary leading-relaxed mb-6">
          This table has been reserved for another party. Please speak with our host
          or team member to be seated, or select an open table.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <a
            href={`tel:${venuePhone.replace(/\s+/g, "")}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold bg-guest-brand text-guest-brand-contrast hover:brightness-95 transition-all shadow-sm"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call Host ({venuePhone})</span>
          </a>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium text-guest-text-secondary hover:text-guest-text-primary hover:bg-guest-surface transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Venue Welcome</span>
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-guest-border-subtle/60 text-xs text-guest-text-muted">
          <p className="font-medium text-guest-text-secondary">{venueName}</p>
          <p className="mt-1">Thank you for your patience and cooperation.</p>
        </div>
      </div>
    </main>
  );
}
