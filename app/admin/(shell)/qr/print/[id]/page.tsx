import type { JSX } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { PlaceType } from "@/domain/qr/qr-token.repository";
import { Button } from "@/components/ui/button";
import { PrintTrigger } from "./_print-trigger";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PrintQrPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<JSX.Element> {
  await requireRole(["admin"]);

  const { id } = await params;
  const { print } = await searchParams;
  const shouldPrint = print === "true";

  if (!id || !UUID_REGEX.test(id)) {
    notFound();
  }

  const token = await prisma.qrToken.findUnique({
    where: { id },
  });

  if (!token) {
    notFound();
  }

  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findById(token.venueId);

  if (!venueResult.ok) {
    notFound();
  }
  const venue = venueResult.value;

  let placeLabel = "Place";
  if (token.placeType === PlaceType.TABLE && token.tableId) {
    const table = await prisma.table.findUnique({
      where: { id: token.tableId },
      select: { number: true },
    });
    placeLabel = table ? `Table ${table.number}` : "Table";
  } else if (token.placeType === PlaceType.ROOM && token.roomId) {
    const room = await prisma.room.findUnique({
      where: { id: token.roomId },
      select: { number: true },
    });
    placeLabel = room ? `Room ${room.number}` : "Room";
  } else if (token.placeType === PlaceType.COUNTER && token.counterId) {
    placeLabel = "Counter";
  }

  const welcomeMessage = venue.welcomeMessage || "Welcome";

  return (
    <div className="min-h-screen bg-staff-surface">
      <PrintTrigger shouldPrint={shouldPrint} />

      {/* Staff world header — hidden on print */}
      <header
        data-staff-hide="true"
        className="flex items-center justify-between border-b border-staff-border-subtle bg-staff-surface-raised px-6 py-4"
      >
        <Link
          href="/admin/qr"
          className="text-[14px] font-medium text-staff-text-muted hover:text-staff-text-primary"
        >
          ← Back to QR Codes
        </Link>
        <Button
          variant="primary"
          size="sm"
          className="cursor-pointer"
        >
          <span id="manual-print-btn">
            Print
          </span>
        </Button>
      </header>

      {/* Main print poster container */}
      <main
        data-world="guest"
        className="min-h-dvh bg-guest-surface flex flex-col items-center justify-center p-4 md:p-8"
      >
        <div className="print-poster w-full max-w-2xl bg-guest-surface-raised border border-guest-border-subtle rounded-2xl flex flex-col items-center text-center p-12 md:p-20 shadow-sm gap-6">
          {/* Venue Branding */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-display text-4xl font-bold tracking-tight text-forest-700">
              {venue.name}
            </h1>
            <p className="text-[16px] leading-[24px] text-guest-text-secondary">
              {welcomeMessage}
            </p>
          </div>

          {/* QR Code Image */}
          <div className="my-2 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/qr/${id}/image`}
              alt={`QR Code for ${placeLabel}`}
              className="size-64 rounded-lg object-contain"
            />
          </div>

          {/* Place and Instruction */}
          <div className="flex flex-col items-center gap-2">
            <h2 className="font-display text-5xl font-semibold text-guest-text-primary mt-4 mb-2">
              {placeLabel}
            </h2>
            <p className="text-lg text-guest-text-secondary">
              Scan to view the menu, request services, and track your order.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
