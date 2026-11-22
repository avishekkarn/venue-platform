/**
 * Pure domain calculator: QR & Session Lifecycle (View 6).
 *
 * Headers: Token ID,Place Type,Place Label,Status,Issued,Revoked,Sessions Generated
 * Governed by D-2.1, D-8.5.8.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type QrLifecycleRow } from "./types";

export interface QrLifecycleInput {
  readonly tokenId: string;
  readonly placeType: string;
  readonly placeLabel: string;
  readonly isRevoked: boolean;
  readonly createdAt: Date | string;
  readonly revokedAt?: Date | string | null;
  readonly sessionsCount: number;
}

export function generateQrLifecycleReport(
  tokens: readonly QrLifecycleInput[]
): Result<QrLifecycleRow[]> {
  if (!Array.isArray(tokens)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Tokens must be an array");
  }

  const rows: QrLifecycleRow[] = tokens.map((t) => {
    const createdDate = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
    const issuedIso = isNaN(createdDate.getTime()) ? "-" : createdDate.toISOString();

    let revokedIso = "-";
    if (t.isRevoked && t.revokedAt) {
      const revDate = t.revokedAt instanceof Date ? t.revokedAt : new Date(t.revokedAt);
      revokedIso = isNaN(revDate.getTime()) ? "-" : revDate.toISOString();
    }

    return {
      tokenId: t.tokenId,
      placeType: t.placeType,
      placeLabel: t.placeLabel,
      status: t.isRevoked ? "REVOKED" : "ACTIVE",
      issued: issuedIso,
      revoked: revokedIso,
      sessionsGenerated: Math.max(0, t.sessionsCount || 0),
    };
  });

  rows.sort((a, b) => b.issued.localeCompare(a.issued));

  return ok(rows);
}
