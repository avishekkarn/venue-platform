/**
 * Pure domain calculator: QR Scan-to-Order Conversion (View 17).
 *
 * Headers: Token,Place Type,Sessions,Orders,Conversion %,Revenue per Session
 * Governed by D-2.1, D-10.2, BUILD.md §7.1.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { parseDecimal, roundToTwoDecimals } from "@/domain/shared/money";
import { type ConversionRow } from "./types";

export interface TokenConversionInput {
  readonly tokenId: string;
  readonly placeType: string;
  readonly sessionsCount: number;
  readonly convertedSessionsCount: number;
  readonly ordersCount: number;
  readonly orderTotals: readonly string[];
}

export function generateQrConversionReport(
  tokens: readonly TokenConversionInput[]
): Result<ConversionRow[]> {
  if (!Array.isArray(tokens)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Tokens must be an array");
  }

  const rows: ConversionRow[] = [];

  for (const t of tokens) {
    let revSum = 0;
    for (const tot of t.orderTotals) {
      const dec = parseDecimal(tot);
      if (dec.ok) {
        revSum += dec.value;
      }
    }

    const sessions = Math.max(0, t.sessionsCount || 0);
    const converted = Math.max(0, t.convertedSessionsCount || 0);
    const orders = Math.max(0, t.ordersCount || 0);

    const convPct =
      sessions > 0
        ? ((converted / sessions) * 100).toFixed(1) + "%"
        : "0.0%";

    const revPerSession =
      sessions > 0
        ? roundToTwoDecimals(revSum / sessions)
        : "0.00";

    rows.push({
      token: t.tokenId,
      placeType: t.placeType,
      sessions,
      orders,
      conversionPct: convPct,
      revenuePerSession: revPerSession,
    });
  }

  rows.sort((a, b) => b.sessions - a.sessions || b.orders - a.orders);

  return ok(rows);
}
