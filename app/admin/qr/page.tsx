import type { JSX } from "react";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/infrastructure/db/client";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaQrTokenRepository } from "@/infrastructure/db/repositories/qr-token.repo";
import {
  PlaceType,
  QrTokenState,
  type QrToken,
} from "@/domain/qr/qr-token.repository";
import { formatDateTime } from "@/lib/date";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./_logout-button";

export default async function AdminQrPage(): Promise<JSX.Element> {
  await requireRole(["admin"]);

  const venueRepo = createPrismaVenueRepository(prisma);
  const venue = await venueRepo.findBySlug(
    process.env["VENUE_SLUG"] ?? "juniper-house"
  );

  if (!venue.ok) {
    return (
      <main className="min-h-dvh p-6 bg-staff-surface">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
                QR Codes
              </h1>
            </div>
            <LogoutButton />
          </header>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            Could not load venue.
          </p>
        </div>
      </main>
    );
  }

  const qrRepo = createPrismaQrTokenRepository(prisma);
  const tokensResult = await qrRepo.listForVenue(venue.value.id);

  if (!tokensResult.ok) {
    return (
      <main className="min-h-dvh p-6 bg-staff-surface">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
                QR Codes
              </h1>
              <p className="text-[14px] leading-[20px] text-staff-text-muted">
                Every QR code for {venue.value.name}.
              </p>
            </div>
            <LogoutButton />
          </header>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            Could not load QR codes.
          </p>
        </div>
      </main>
    );
  }

  if (tokensResult.value.length === 0) {
    return (
      <main className="min-h-dvh p-6 bg-staff-surface">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
                QR Codes
              </h1>
              <p className="text-[14px] leading-[20px] text-staff-text-muted">
                Every QR code for {venue.value.name}.
              </p>
            </div>
            <LogoutButton />
          </header>
          <p className="text-[14px] leading-[20px] text-staff-text-muted">
            No QR codes yet.
          </p>
        </div>
      </main>
    );
  }

  const tableIds: string[] = [];
  const roomIds: string[] = [];
  const counterIds: string[] = [];

  for (const token of tokensResult.value) {
    if (token.placeType === PlaceType.TABLE && token.tableId !== null) {
      tableIds.push(token.tableId);
    } else if (token.placeType === PlaceType.ROOM && token.roomId !== null) {
      roomIds.push(token.roomId);
    } else if (token.placeType === PlaceType.COUNTER && token.counterId !== null) {
      counterIds.push(token.counterId);
    }
  }

  const [tables, rooms, counters] = await Promise.all([
    tableIds.length > 0
      ? prisma.table.findMany({
          where: { venueId: venue.value.id, id: { in: tableIds } },
          select: { id: true, number: true },
        })
      : Promise.resolve([]),
    roomIds.length > 0
      ? prisma.room.findMany({
          where: { venueId: venue.value.id, id: { in: roomIds } },
          select: { id: true, number: true },
        })
      : Promise.resolve([]),
    counterIds.length > 0
      ? prisma.counter.findMany({
          where: { venueId: venue.value.id, id: { in: counterIds } },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const tableMap = new Map<string, string>();
  for (const t of tables) {
    tableMap.set(t.id, `Table ${t.number}`);
  }

  const roomMap = new Map<string, string>();
  for (const r of rooms) {
    roomMap.set(r.id, `Room ${r.number}`);
  }

  const counterMap = new Map<string, string>();
  for (const c of counters) {
    counterMap.set(c.id, "Counter");
  }

  function placeLabel(token: QrToken): string {
    if (token.placeType === PlaceType.TABLE && token.tableId !== null) {
      return tableMap.get(token.tableId) ?? "Unknown place";
    }
    if (token.placeType === PlaceType.ROOM && token.roomId !== null) {
      return roomMap.get(token.roomId) ?? "Unknown place";
    }
    if (token.placeType === PlaceType.COUNTER && token.counterId !== null) {
      return counterMap.get(token.counterId) ?? "Unknown place";
    }
    return "Unknown place";
  }

  return (
    <main className="min-h-dvh p-6 bg-staff-surface">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[28px] leading-[36px] font-semibold text-staff-text-primary">
              QR Codes
            </h1>
            <p className="text-[14px] leading-[20px] text-staff-text-muted">
              Every QR code for {venue.value.name}.
            </p>
          </div>
          <LogoutButton />
        </header>

        <div className="rounded-lg border border-staff-border-subtle bg-staff-surface-raised overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Place</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tokensResult.value.map((token) => {
                const isActive = token.state === QrTokenState.ACTIVE;
                return (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium text-staff-text-primary">
                      {placeLabel(token)}
                    </TableCell>
                    <TableCell
                      className="font-mono text-[14px] leading-[20px] text-staff-text-muted"
                      title={token.token}
                    >
                      {token.token.slice(0, 12)}…
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="status"
                        status={isActive ? "active" : "cancelled"}
                      >
                        {isActive ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-staff-text-muted text-[13px]">
                      {formatDateTime(token.createdAt, venue.value.language)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <span title="Available in a later task">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                          >
                            Print
                          </Button>
                        </span>
                        <span title="Available in a later task">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                          >
                            Revoke
                          </Button>
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
