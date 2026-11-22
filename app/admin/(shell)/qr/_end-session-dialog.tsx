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

interface EndSessionDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly place: PlaceItemView | null;
  readonly onSessionEnded: () => void;
}

export function EndSessionDialog({
  open,
  onOpenChange,
  place,
  onSessionEnded,
}: EndSessionDialogProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!place || !place.activeSession) return <></>;

  const handleEndSession = async (): Promise<void> => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/sessions/${place.activeSession!.id}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Failed to end session");
        setSubmitting(false);
        return;
      }

      onOpenChange(false);
      onSessionEnded();
    } catch {
      setError("A network error occurred while ending the session.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-xl shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <DialogTitle className="text-base font-bold text-staff-text-primary">
              End Active Session for {place.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-staff-text-muted mt-1.5">
            This will immediately close the active guest session, cancel any open service requests, and free this {place.type.toLowerCase()} for new guests.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 my-4 text-xs flex flex-col gap-1.5">
          <div className="flex justify-between text-amber-900">
            <span>Orders Placed:</span>
            <span className="font-semibold">{place.activeSession.ordersCount}</span>
          </div>
          <div className="flex justify-between text-amber-900">
            <span>Open Requests:</span>
            <span className="font-semibold">{place.activeSession.requestsCount}</span>
          </div>
          <div className="flex justify-between text-amber-950 font-bold border-t border-amber-200 pt-1 mt-0.5">
            <span>Total Folio Amount:</span>
            <span className="font-mono">NPR {place.activeSession.totalAmount}</span>
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
            onClick={handleEndSession}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Ending Session..." : "Confirm & End Session"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
