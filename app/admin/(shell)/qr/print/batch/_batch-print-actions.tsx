"use client";

import { type JSX } from "react";
import Link from "next/link";

interface BatchPrintActionsProps {
  readonly currentType: string;
  readonly totalCount: number;
  readonly tablesCount: number;
  readonly roomsCount: number;
}

export function BatchPrintActions({
  currentType,
  totalCount,
  tablesCount,
  roomsCount,
}: BatchPrintActionsProps): JSX.Element {
  return (
    <div
      data-staff-hide="true"
      className="print:hidden sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-staff-border-subtle bg-staff-surface-raised/95 backdrop-blur-xs px-6 py-4 shadow-2xs"
    >
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/admin/qr"
          className="text-xs font-medium text-staff-text-muted hover:text-staff-text-primary transition-colors inline-flex items-center gap-1"
        >
          ← Back to QR Codes
        </Link>
        <span className="text-staff-border">|</span>
        <div className="flex items-center gap-1.5">
          <Link
            href="/admin/qr/print/batch?type=all"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentType === "all"
                ? "bg-staff-brand text-white shadow-2xs"
                : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary"
            }`}
          >
            All Placards ({totalCount})
          </Link>
          <Link
            href="/admin/qr/print/batch?type=tables"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentType === "tables"
                ? "bg-staff-brand text-white shadow-2xs"
                : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary"
            }`}
          >
            Tables Only ({tablesCount})
          </Link>
          <Link
            href="/admin/qr/print/batch?type=rooms"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              currentType === "rooms"
                ? "bg-staff-brand text-white shadow-2xs"
                : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary"
            }`}
          >
            Rooms Only ({roomsCount})
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover shadow-2xs transition-colors cursor-pointer"
        >
          🖨️ Print Batch Sheets
        </button>
      </div>
    </div>
  );
}
