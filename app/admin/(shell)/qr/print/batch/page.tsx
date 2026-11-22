import type { JSX } from "react";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { PrintTrigger } from "../[id]/_print-trigger";
import { BatchPrintActions } from "./_batch-print-actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface BatchPrintPageProps {
  readonly searchParams?: Promise<{
    type?: string;
    print?: string;
  }>;
}

interface PlacardItem {
  id: string;
  type: "TABLE" | "ROOM" | "COUNTER";
  number: string;
  categoryName: string | null;
  isReserved?: boolean;
  qrTokenId: string | null;
}

export default async function BatchQrPrintPage({
  searchParams,
}: BatchPrintPageProps): Promise<JSX.Element> {
  const staff = await requireRole(["admin"]);
  const params = searchParams ? await searchParams : {};
  const currentType = params.type || "all";
  const shouldPrint = params.print === "true";

  const venueRepo = createPrismaVenueRepository(prisma);
  const venueResult = await venueRepo.findById(staff.venueId);

  if (!venueResult.ok) {
    notFound();
  }
  const venue = venueResult.value;

  const [tables, rooms, counters, activeTokens] = await Promise.all([
    prisma.table.findMany({
      where: { venueId: staff.venueId },
      include: { category: true },
      orderBy: { number: "asc" },
    }),
    prisma.room.findMany({
      where: { venueId: staff.venueId },
      include: { category: true },
      orderBy: { number: "asc" },
    }),
    prisma.counter.findMany({
      where: { venueId: staff.venueId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.qrToken.findMany({
      where: {
        venueId: staff.venueId,
        state: "ACTIVE",
      },
      select: {
        id: true,
        tableId: true,
        roomId: true,
        counterId: true,
        placeType: true,
      },
    }),
  ]);

  const qrByTableId = new Map<string, string>();
  const qrByRoomId = new Map<string, string>();
  const qrByCounterId = new Map<string, string>();

  for (const tok of activeTokens) {
    if (tok.tableId) qrByTableId.set(tok.tableId, tok.id);
    if (tok.roomId) qrByRoomId.set(tok.roomId, tok.id);
    if (tok.counterId) qrByCounterId.set(tok.counterId, tok.id);
  }

  const tablePlacards: PlacardItem[] = tables.map((t) => ({
    id: t.id,
    type: "TABLE",
    number: t.number,
    categoryName: t.category?.name ?? null,
    isReserved: t.category?.isReserved ?? false,
    qrTokenId: qrByTableId.get(t.id) ?? null,
  }));

  const roomPlacards: PlacardItem[] = rooms.map((r) => ({
    id: r.id,
    type: "ROOM",
    number: r.number,
    categoryName: r.category?.name ?? null,
    qrTokenId: qrByRoomId.get(r.id) ?? null,
  }));

  const counterPlacards: PlacardItem[] = counters.map((c) => ({
    id: c.id,
    type: "COUNTER",
    number: c.name || "Counter",
    categoryName: "Pickup & Service",
    qrTokenId: qrByCounterId.get(c.id) ?? null,
  }));

  let displayedPlacards: PlacardItem[] = [];
  if (currentType === "tables") {
    displayedPlacards = tablePlacards;
  } else if (currentType === "rooms") {
    displayedPlacards = roomPlacards;
  } else if (currentType === "counters") {
    displayedPlacards = counterPlacards;
  } else {
    displayedPlacards = [...counterPlacards, ...tablePlacards, ...roomPlacards];
  }

  const welcomeMessage = venue.welcomeMessage || "Scan to view menu, place orders & request service";

  return (
    <div className="min-h-screen bg-staff-surface print:bg-white print:min-h-0">
      <PrintTrigger shouldPrint={shouldPrint} />

      {/* Screen-only top action & filter bar */}
      <BatchPrintActions
        currentType={currentType}
        totalCount={counterPlacards.length + tablePlacards.length + roomPlacards.length}
        countersCount={counterPlacards.length}
        tablesCount={tablePlacards.length}
        roomsCount={roomPlacards.length}
      />

      {/* Printable Sheet Content — exactly 1 placard per printed page */}
      <main className="p-6 md:p-10 max-w-5xl mx-auto print:p-0 print:m-0 print:max-w-none print:block">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:block print:space-y-0 print:m-0">
          {displayedPlacards.map((item, index) => {
            const placeLabel =
              item.type === "COUNTER"
                ? item.number
                : `${item.type === "TABLE" ? "Table" : "Room"} ${item.number}`;
            const isLast = index === displayedPlacards.length - 1;

            return (
              <div
                key={`${item.type}-${item.id}`}
                className={`print-placard-page ${
                  isLast ? "last-print-page" : "print-page-break print:break-after-page print:page-break-after-always"
                } print:break-inside-avoid print:page-break-inside-avoid w-full max-w-md mx-auto bg-white border-2 border-stone-800 rounded-3xl p-8 md:p-10 flex flex-col items-center text-center shadow-lg print:shadow-none print:border-2 print:border-black print:rounded-2xl print:p-8 print:max-w-none print:w-[92%] print:m-0`}
              >
                {/* Venue Branding Header */}
                <div className="flex flex-col items-center gap-1.5 w-full">
                  <span className="text-[11px] uppercase tracking-widest text-stone-500 font-semibold">
                    Welcome to
                  </span>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tight">
                    {venue.name}
                  </h2>
                  <p className="text-xs text-stone-600 max-w-xs mt-0.5">
                    {welcomeMessage}
                  </p>
                </div>

                {/* QR Image Container */}
                <div className="my-6 p-4 bg-white border-2 border-stone-200 rounded-2xl shadow-2xs flex items-center justify-center print:border-2 print:border-stone-400 print:shadow-none">
                  {item.qrTokenId ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`/api/admin/qr/${item.qrTokenId}/image`}
                      alt={`QR Code for ${placeLabel}`}
                      className="w-56 h-56 md:w-60 md:h-60 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-56 h-56 md:w-60 md:h-60 flex flex-col items-center justify-center p-6 text-center bg-stone-100 rounded-lg text-stone-500">
                      <span className="text-sm font-semibold">No Active QR Generated</span>
                      <span className="text-xs mt-1 text-stone-400">
                        Generate QR in admin QR Codes hub
                      </span>
                    </div>
                  )}
                </div>

                {/* Place Identifier & Category Badge */}
                <div className="flex flex-col items-center gap-2">
                  <h3 className="text-3xl md:text-4xl font-serif font-extrabold text-stone-900 tracking-tight">
                    {placeLabel}
                  </h3>
                  {item.categoryName && (
                    <span
                      className={`inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        item.isReserved
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-stone-100 text-stone-800 border border-stone-200"
                      }`}
                    >
                      {item.isReserved ? "Reserved Table" : item.categoryName}
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
            );
          })}
        </div>
      </main>
    </div>
  );
}
