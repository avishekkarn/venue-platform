import { notFound } from "next/navigation";
import { headers } from "next/headers";
import os from "os";
import type { JSX } from "react";
import { prisma } from "@/infrastructure/db/client";
import { PlaceType, QrTokenState } from "@/domain/qr/qr-token.repository";
import { QrDisplay, type DevQrTokenItem } from "./_qr-display";

export const dynamic = "force-dynamic";

// Dev-only access. In production, allow only when accessed from the developer's
// own machine (localhost / 127.0.0.1). This preserves the D-17.4 security posture
// while enabling production-mode LAN testing: the developer views the QR codes on
// their laptop, then manually enters the token URL on a phone over LAN.
async function assertLocalhostInProduction(): Promise<void> {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const headersList = await headers();
  const hostHeader = headersList.get("host") || "";
  const hostname = hostHeader.split(":")[0];

  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    notFound();
  }
}

export default async function DevQrPage(): Promise<JSX.Element> {
  await assertLocalhostInProduction();

  // Detect local network IP for mobile testing over Wi-Fi
  const networkInterfaces = os.networkInterfaces();
  let lanIp = "localhost";
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        lanIp = iface.address;
        break;
      }
    }
    if (lanIp !== "localhost") break;
  }

  const headersList = await headers();
  const host = headersList.get("host") || "";
  const port = host.includes(":") ? host.split(":")[1] : "3000";
  const origin = `http://${lanIp}:${port}`;

  const venue = await prisma.venue.findFirst({
    where: { slug: process.env["VENUE_SLUG"] ?? "juniper-house" },
    select: { id: true, name: true },
  });

  const venueId = venue?.id;

  const [activeTokens, tables, rooms] = await Promise.all([
    prisma.qrToken.findMany({
      where: {
        ...(venueId ? { venueId } : {}),
        state: QrTokenState.ACTIVE,
      },
    }),
    prisma.table.findMany({
      where: venueId ? { venueId } : undefined,
      select: { id: true, number: true },
    }),
    prisma.room.findMany({
      where: venueId ? { venueId } : undefined,
      select: { id: true, number: true },
    }),
  ]);

  const tableMap = new Map(tables.map((t) => [t.id, t.number]));
  const roomMap = new Map(rooms.map((r) => [r.id, r.number]));

  type SortableItem = DevQrTokenItem & { sortPriority: number; sortNumber: number };

  const tokenItems: SortableItem[] = activeTokens.map((t) => {
    let placeLabel = "Counter";
    let sortPriority = 3;
    let sortNumber = 0;

    if (t.placeType === PlaceType.TABLE && t.tableId) {
      const num = tableMap.get(t.tableId);
      placeLabel = num ? `Table ${num}` : `Table (${t.tableId.slice(0, 8)})`;
      sortPriority = 1;
      sortNumber = num ? parseInt(num, 10) || 0 : 0;
    } else if (t.placeType === PlaceType.ROOM && t.roomId) {
      const num = roomMap.get(t.roomId);
      placeLabel = num ? `Room ${num}` : `Room (${t.roomId.slice(0, 8)})`;
      sortPriority = 2;
      sortNumber = num ? parseInt(num, 10) || 0 : 0;
    }

    return {
      id: t.id,
      token: t.token.trim().replace(/\s+/g, ""),
      placeType: t.placeType as PlaceType,
      placeLabel,
      sortPriority,
      sortNumber,
    };
  });

  // Sort so Tables (1..N) appear first, followed by Rooms (101..N), then Counters
  tokenItems.sort((a, b) => {
    if (a.sortPriority !== b.sortPriority) {
      return a.sortPriority - b.sortPriority;
    }
    return a.sortNumber - b.sortNumber;
  });

  return (
    <main className="min-h-dvh p-6 bg-staff-surface flex flex-col items-center justify-center">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6">
        <header className="text-center">
          <h1 className="text-[24px] font-bold text-staff-text-primary tracking-tight">
            Development QR Interface
          </h1>
          <p className="text-[14px] text-staff-text-muted mt-1">
            Local Area Network Mobile Testing (D-17.4)
          </p>
        </header>

        <QrDisplay
          tokens={tokenItems}
          venueName={venue?.name}
          origin={origin}
        />
      </div>
    </main>
  );
}
