import type { JSX } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { PlaceType } from "@/domain/qr/qr-token.repository";
import { PrintTrigger } from "./_print-trigger";
import { SinglePrintHeader } from "./_single-print-header";

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
  let placeCategory: string | null = null;
  let isReserved = false;

  if (token.placeType === PlaceType.TABLE && token.tableId) {
    const table = await prisma.table.findUnique({
      where: { id: token.tableId },
      include: { category: true },
    });
    placeLabel = table ? `Table ${table.number}` : "Table";
    placeCategory = table?.category?.name ?? null;
    isReserved = table?.category?.isReserved ?? false;
  } else if (token.placeType === PlaceType.ROOM && token.roomId) {
    const room = await prisma.room.findUnique({
      where: { id: token.roomId },
      include: { category: true },
    });
    placeLabel = room ? `Room ${room.number}` : "Room";
    placeCategory = room?.category?.name ?? null;
  } else if (token.placeType === PlaceType.COUNTER && token.counterId) {
    const counter = await prisma.counter.findUnique({
      where: { id: token.counterId },
      select: { name: true },
    });
    placeLabel = counter?.name || "Counter";
    placeCategory = "Pickup & Service";
  }

  const welcomeMessage = venue.welcomeMessage || "Scan to view menu, place orders & request service";

  return (
    <div className="min-h-screen bg-staff-surface print:bg-white print:min-h-0">
      <PrintTrigger shouldPrint={shouldPrint} />

      {/* Screen action header */}
      <SinglePrintHeader />

      {/* Main print container */}
      <main className="p-4 md:p-8 flex flex-col items-center justify-center print:p-0 print:m-0 print:block">
        <div className="print-placard-page w-full max-w-md mx-auto bg-white border-2 border-stone-800 rounded-3xl p-8 md:p-10 flex flex-col items-center text-center shadow-lg print:shadow-none print:border-2 print:border-black print:rounded-2xl print:p-8 print:max-w-none print:w-[92%] print:m-0">
          {/* Venue Branding Header */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
              Welcome to
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
              {venue.name}
            </h1>
            <p className="text-xs text-stone-600 max-w-xs mt-0.5">
              {welcomeMessage}
            </p>
          </div>

          {/* High Contrast Scannable QR Image */}
          <div className="my-6 p-4 bg-white border-2 border-stone-200 rounded-2xl shadow-2xs flex items-center justify-center print:border-2 print:border-stone-400 print:shadow-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/admin/qr/${id}/image`}
              alt={`QR Code for ${placeLabel}`}
              className="w-56 h-56 md:w-60 md:h-60 object-contain rounded-lg"
            />
          </div>

          {/* Place Title & Category Badge */}
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-3xl md:text-4xl font-serif font-extrabold text-stone-900 tracking-tight">
              {placeLabel}
            </h2>
            {placeCategory && (
              <span
                className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  isReserved
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-stone-100 text-stone-800 border border-stone-200"
                }`}
              >
                {isReserved ? "Reserved Table" : placeCategory}
              </span>
            )}
          </div>

          {/* 3-Step Guest Instructions */}
          <div className="mt-6 pt-5 border-t border-stone-200 w-full flex flex-col items-center gap-3 print:border-stone-300">
            <div className="grid grid-cols-3 gap-2 w-full text-center">
              <div className="flex flex-col items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="text-[11px] font-semibold text-stone-800">
                  Open Camera
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="text-[11px] font-semibold text-stone-800">
                  Scan QR Code
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-[11px] font-semibold text-stone-800">
                  Order & Enjoy
                </span>
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-0.5">
              No app download required · Instant digital ordering & service
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
