/**
 * Pure domain calculator: Room Folio Report (View 15).
 *
 * Headers: Room,Stay Start,Stay End,Orders,Requests,Order Revenue,Request Count
 * Governed by D-8.5.5 (room billing & folio integration), BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type RoomFolioRow } from "./types";

export interface RoomFolioInput {
  readonly roomNumber: string;
  readonly stayStart: Date | string;
  readonly stayEnd?: Date | string | null;
  readonly orderTotals: readonly string[];
  readonly serviceRequestsCount: number;
}

export function generateRoomFolioReport(
  stays: readonly RoomFolioInput[]
): Result<RoomFolioRow[]> {
  if (!Array.isArray(stays)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Stays must be an array");
  }

  const rows: RoomFolioRow[] = [];

  for (const s of stays) {
    const start = s.stayStart instanceof Date ? s.stayStart : new Date(s.stayStart);
    const startIso = isNaN(start.getTime()) ? "-" : start.toISOString();

    let endIso = "Active Stay";
    if (s.stayEnd) {
      const end = s.stayEnd instanceof Date ? s.stayEnd : new Date(s.stayEnd);
      if (!isNaN(end.getTime())) {
        endIso = end.toISOString();
      }
    }

    let revenueSum = 0;
    for (const tot of s.orderTotals) {
      const dec = parseDecimal(tot);
      if (dec.ok) {
        revenueSum += dec.value;
      }
    }

    const orderCount = s.orderTotals.length;
    const reqCount = Math.max(0, s.serviceRequestsCount || 0);

    rows.push({
      room: s.roomNumber,
      stayStart: startIso,
      stayEnd: endIso,
      orders: orderCount,
      requests: reqCount,
      orderRevenue: roundToTwoDecimals(revenueSum),
      requestCount: reqCount,
    });
  }

  rows.sort((a, b) => b.stayStart.localeCompare(a.stayStart) || a.room.localeCompare(b.room));

  return ok(rows);
}
