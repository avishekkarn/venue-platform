"use client";

import { useState, type JSX } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TableQrDialogProps {
  readonly tableId: string;
  readonly tableNumber: string;
  readonly categoryName?: string | null;
  readonly qrTokenId?: string | null;
}

export function TableQrDialog({
  tableNumber,
  categoryName,
  qrTokenId,
}: TableQrDialogProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 text-xs font-medium border border-staff-border-subtle rounded-md text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised transition-colors"
      >
        QR Code
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs text-center p-6 flex flex-col items-center">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg font-bold text-staff-text-primary">
              Table {tableNumber} QR Code
            </DialogTitle>
            {categoryName && (
              <DialogDescription className="text-xs text-staff-text-secondary">
                {categoryName}
              </DialogDescription>
            )}
          </DialogHeader>

          {qrTokenId ? (
            <div className="flex flex-col items-center gap-4 my-2">
              <div className="p-3 bg-white border border-staff-border-subtle rounded-xl shadow-xs">
                <Image
                  src={`/api/admin/qr/${qrTokenId}/image`}
                  alt={`QR code for Table ${tableNumber}`}
                  width={180}
                  height={180}
                  className="rounded-lg"
                  unoptimized
                />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/qr/print/${qrTokenId}`}
                  target="_blank"
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover transition-colors"
                >
                  Print QR Placard ↗
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-xs font-medium border border-staff-border-subtle rounded-lg text-staff-text-secondary hover:bg-staff-surface-raised transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 my-4">
              <p className="text-xs text-staff-text-muted">
                No active QR token found for this table.
              </p>
              <Link
                href="/admin/qr"
                className="px-4 py-2 text-xs font-medium rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover transition-colors"
              >
                Generate in QR Codes Hub
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
