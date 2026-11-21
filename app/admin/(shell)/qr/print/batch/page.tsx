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
  type: "TABLE" | "ROOM";
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

  const [tables, rooms, activeTokens] = await Promise.all([
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
    prisma.qrToken.findMany({
      where: {
        venueId: staff.venueId,
        state: "ACTIVE",
      },
      select: {
        id: true,
        tableId: true,
        roomId: true,
        placeType: true,
      },
    }),
  ]);

  const qrByTableId = new Map<string, string>();
  const qrByRoomId = new Map<string, string>();

  for (const tok of activeTokens) {
    if (tok.tableId) qrByTableId.set(tok.tableId, tok.id);
    if (tok.roomId) qrByRoomId.set(tok.roomId, tok.id);
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

  let displayedPlacards: PlacardItem[] = [];
  if (currentType === "tables") {
    displayedPlacards = tablePlacards;
  } else if (currentType === "rooms") {
    displayedPlacards = roomPlacards;
  } else {
    displayedPlacards = [...tablePlacards, ...roomPlacards];
  }

  return (
    <div className="min-h-screen bg-staff-surface">
      <PrintTrigger shouldPrint={shouldPrint} />

      {/* Screen-only top action & filter bar */}
      <BatchPrintActions
        currentType={currentType}
        totalCount={tablePlacards.length + roomPlacards.length}
        tablesCount={tablePlacards.length}
        roomsCount={roomPlacards.length}
      />

      {/* Printable Sheet Content */}
      <main className="p-6 md:p-10 max-w-6xl mx-auto print:p-0 print:max-w-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-6 print:m-0">
          {displayedPlacards.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="bg-white border-2 border-stone-800 rounded-2xl p-8 flex flex-col items-center text-center justify-between shadow-xs print:shadow-none print:border-2 print:border-black print:break-inside-avoid print:page-break-inside-avoid print:p-6"
              style={{ minHeight: "360px" }}
            >
              {/* Header Branding */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs uppercase tracking-widest text-stone-500 font-semibold">
                  Welcome to
                </span>
                <h2 className="text-2xl font-serif font-bold text-stone-900 tracking-tight">
                  {venue.name}
                </h2>
              </div>

              {/* QR Image Container */}
              <div className="my-4 p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center print:bg-white print:border-none">
                {item.qrTokenId ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/api/admin/qr/${item.qrTokenId}/image`}
                    alt={`QR Code for ${item.type === "TABLE" ? "Table" : "Room"} ${item.number}`}
                    className="w-48 h-48 object-contain rounded-md"
                  />
                ) : (
                  <div className="w-48 h-48 flex flex-col items-center justify-center p-4 text-center bg-stone-100 rounded-md text-stone-400 text-xs">
                    <span>No active QR generated</span>
                    <span className="text-[10px] mt-1 text-stone-500">
                      Generate in admin QR hub
                    </span>
                  </div>
                )}
              </div>

              {/* Place Identifier & Category */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-extrabold text-stone-900 tracking-tight">
                    {item.type === "TABLE" ? "Table" : "Room"} {item.number}
                  </h3>
                  {item.isReserved && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 print:border-black">
                      Reserved
                    </span>
                  )}
                </div>

                {item.categoryName && (
                  <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md print:border print:border-stone-400">
                    {item.categoryName}
                  </span>
                )}

                <p className="text-xs text-stone-500 mt-2 max-w-xs">
                  {item.type === "TABLE"
                    ? "Scan to explore our menu, place orders, and call for service."
                    : "Scan to order dining, request housekeeping, and manage your stay."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
