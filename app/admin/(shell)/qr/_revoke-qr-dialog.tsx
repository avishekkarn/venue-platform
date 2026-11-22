"use client";

import { useState, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCsrfToken } from "@/lib/csrf-client";
import type { PlaceItemView } from "./_types";

interface RevokeQrDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly place: PlaceItemView | null;
  readonly onQrRevoked: () => void;
}

export function RevokeQrDialog({
  open,
  onOpenChange,
  place,
  onQrRevoked,
}: RevokeQrDialogProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!place || !place.activeQr) return <></>;

  const handleRevoke = async (): Promise<void> => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/qr/${place.activeQr!.id}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to revoke QR code");
        setSubmitting(false);
        return;
      }

      onOpenChange(false);
      onQrRevoked();
    } catch {
      setError("A network error occurred while revoking QR code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-xl shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚫</span>
            <DialogTitle className="text-base font-bold text-staff-text-primary">
              Revoke Compromised QR Code for {place.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-staff-text-muted mt-1.5 leading-relaxed">
            Are you sure you want to revoke this QR code? If this placard was compromised or photographed by unauthorized persons, revoking it disables scanning immediately and terminates any active guest sessions linked to it.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/70 my-3 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-semibold text-rose-800">
            <span>⚠️</span>
            <span>Customer access will be disabled immediately</span>
          </div>
          <p className="text-[11px] text-rose-700 leading-relaxed">
            Anyone scanning this physical placard will see an invalid/revoked notice. You can issue a brand-new secure QR code at any time from this dashboard.
          </p>
          <div className="mt-1 pt-2 border-t border-rose-200/60 flex flex-col gap-1">
            <span className="text-[10px] text-rose-600 uppercase tracking-wider font-medium">
              Compromised Token ID
            </span>
            <code className="font-mono text-[11px] text-rose-950 break-all bg-white/80 p-1 rounded border border-rose-200">
              {place.activeQr.id}
            </code>
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 mb-4">
            {error}
          </p>
        )}

        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-staff-border-subtle">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-raised text-staff-text-secondary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleRevoke}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {submitting ? "Revoking..." : "Revoke QR Now"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
