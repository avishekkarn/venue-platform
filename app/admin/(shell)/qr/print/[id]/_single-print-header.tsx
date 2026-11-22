"use client";

import { type JSX } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SinglePrintHeader(): JSX.Element {
  return (
    <header
      data-staff-hide="true"
      className="print:hidden flex items-center justify-between border-b border-staff-border-subtle bg-staff-surface-raised px-6 py-4 shadow-2xs"
    >
      <Link
        href="/admin/qr"
        className="text-sm font-medium text-staff-text-muted hover:text-staff-text-primary transition-colors inline-flex items-center gap-1.5"
      >
        ← Back to QR Codes
      </Link>
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => window.print()}
          className="cursor-pointer font-semibold shadow-2xs"
          id="manual-print-btn"
        >
          🖨️ Print Placard
        </Button>
      </div>
    </header>
  );
}
