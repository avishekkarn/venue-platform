/**
 * Pure domain calculator: Room Folio Report (View 13 / View 15).
 *
 * Headers:
 * # Folio groups consecutive sessions at the same room with a gap <= 4 hours (D-12.8).
 * # Billable service charges not tracked in v1.
 * Room,Stay Start,Stay End,Status,Orders,Requests,Order Revenue,Request Count,Stale Session
 *
 * Governed by D-2.1, D-2.5, D-12.8, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type RoomFolioRow } from "./types";

export interface FolioSessionInput {
  readonly roomNumber: string;
  readonly createdAt: Date | string;
  readonly endedAt?: Date | string | null;
  readonly ordersCount: number;
  readonly requestsCount: number;
  readonly ordersRevenue: string;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function generateRoomFolio(
  sessions: readonly FolioSessionInput[],
  now: Date = new Date()
): Result<RoomFolioRow[]> {
  if (!Array.isArray(sessions)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Sessions must be an array");
  }

  // 1. Group sessions by roomNumber
  const byRoom = new Map<string, FolioSessionInput[]>();
  for (const s of sessions) {
    const list = byRoom.get(s.roomNumber) ?? [];
    list.push(s);
    byRoom.set(s.roomNumber, list);
  }

  const rows: RoomFolioRow[] = [];

  // 2. Process each room's timeline
  for (const [roomNumber, roomSessions] of byRoom.entries()) {
    // Sort chronologically by createdAt
    const sorted = [...roomSessions].sort((a, b) => {
      const tA = (a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)).getTime();
      const tB = (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)).getTime();
      return tA - tB;
    });

    interface StayGroup {
      start: Date;
      end: Date | null;
      isActive: boolean;
      orders: number;
      requests: number;
      revenueNum: number;
      staleSession: boolean;
      lastEndedAt: Date | null;
    }

    const stays: StayGroup[] = [];
    let currentStay: StayGroup | null = null;

    for (const s of sorted) {
      const startT = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
      const endT = s.endedAt ? (s.endedAt instanceof Date ? s.endedAt : new Date(s.endedAt)) : null;

      const revRes = parseDecimal(s.ordersRevenue);
      const revVal = revRes.ok ? revRes.value : 0;

      const isStale = !endT && now.getTime() - startT.getTime() > FOUR_HOURS_MS;

      if (!currentStay) {
        currentStay = {
          start: startT,
          end: endT,
          isActive: !endT,
          orders: s.ordersCount,
          requests: s.requestsCount,
          revenueNum: revVal,
          staleSession: isStale,
          lastEndedAt: endT,
        };
      } else {
        // Gap check between currentStay.lastEndedAt and this session's startT
        const gap = currentStay.lastEndedAt ? startT.getTime() - currentStay.lastEndedAt.getTime() : 0;

        if (gap <= FOUR_HOURS_MS) {
          // Extend the current stay
          currentStay.orders += s.ordersCount;
          currentStay.requests += s.requestsCount;
          currentStay.revenueNum += revVal;
          if (isStale) currentStay.staleSession = true;
          if (!endT) {
            currentStay.isActive = true;
            currentStay.end = null;
            currentStay.lastEndedAt = null;
          } else if (!currentStay.isActive) {
            currentStay.end = endT;
            currentStay.lastEndedAt = endT;
          }
        } else {
          // Close previous stay and start a fresh one
          stays.push(currentStay);
          currentStay = {
            start: startT,
            end: endT,
            isActive: !endT,
            orders: s.ordersCount,
            requests: s.requestsCount,
            revenueNum: revVal,
            staleSession: isStale,
            lastEndedAt: endT,
          };
        }
      }
    }

    if (currentStay) {
      stays.push(currentStay);
    }

    for (const st of stays) {
      rows.push({
        room: roomNumber,
        stayStart: st.start.toISOString().slice(0, 16).replace("T", " "),
        stayEnd: st.end ? st.end.toISOString().slice(0, 16).replace("T", " ") : null,
        status: st.isActive ? "ACTIVE" : "CLOSED",
        orders: st.orders,
        requests: st.requests,
        orderRevenue: roundToTwoDecimals(st.revenueNum),
        requestCount: st.requests,
        staleSession: st.staleSession,
      });
    }
  }

  rows.sort((a, b) => a.room.localeCompare(b.room) || a.stayStart.localeCompare(b.stayStart));

  return ok(rows);
}
