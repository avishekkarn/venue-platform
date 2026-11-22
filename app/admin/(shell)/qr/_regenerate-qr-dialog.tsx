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

interface RegenerateQrDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly place: PlaceItemView | null;
  readonly onQrRegenerated: () => void;
}

export function RegenerateQrDialog({
  open,
  onOpenChange,
  place,
  onQrRegenerated,
}: RegenerateQrDialogProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!place) return <></>;

  const handleRegenerate = async (): Promise<void> => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/qr/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({
          placeType: place.type,
          placeId: place.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to regenerate QR code");
        setSubmitting(false);
        return;
      }

      onOpenChange(false);
      onQrRegenerated();
    } catch {
      setError("A network error occurred while regenerating QR code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-xl shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔄</span>
            <DialogTitle className="text-base font-bold text-staff-text-primary">
              Regenerate QR Code for {place.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-staff-text-muted mt-1.5">
            This will atomically revoke any existing QR placard for this {place.type.toLowerCase()} and issue a brand-new active QR token. Any old printed placards will no longer be scannable.
          </DialogDescription>
        </DialogHeader>

        {place.activeQr && (
          <div className="p-3 rounded-lg border border-stone-200 bg-stone-50 my-3 text-xs flex flex-col gap-1">
            <span className="text-staff-text-secondary">Current Active Token:</span>
            <code className="font-mono text-[11px] text-staff-text-primary break-all bg-white p-1 rounded border border-stone-200">
              {place.activeQr.token}
            </code>
          </div>
        )}

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
            onClick={handleRegenerate}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Regenerating..." : "Issue New QR Placard"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
