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

interface DeletePlaceDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly place: PlaceItemView | null;
  readonly onPlaceDeleted: () => void;
}

export function DeletePlaceDialog({
  open,
  onOpenChange,
  place,
  onPlaceDeleted,
}: DeletePlaceDialogProps): JSX.Element {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!place) return <></>;

  const handleDelete = async (): Promise<void> => {
    setError(null);
    setSubmitting(true);

    try {
      let endpoint = "";
      if (place.type === "TABLE") endpoint = `/api/admin/tables/${place.id}`;
      else if (place.type === "ROOM") endpoint = `/api/admin/rooms/${place.id}`;
      else endpoint = `/api/admin/counters/${place.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || `Failed to delete ${place.type.toLowerCase()}`);
        setSubmitting(false);
        return;
      }

      onOpenChange(false);
      onPlaceDeleted();
    } catch {
      setError("A network error occurred while deleting the place.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-xl shadow-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">🗑️</span>
            <DialogTitle className="text-base font-bold text-red-700">
              Delete {place.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-staff-text-muted mt-1.5">
            Are you sure you want to permanently delete {place.name}? This action cannot be undone. Its QR codes will be revoked automatically.
          </DialogDescription>
        </DialogHeader>

        {place.activeSession && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-800 my-2">
            ⚠️ This place has an active guest session. You must end the session before deleting.
          </div>
        )}

        {error && (
          <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 my-3">
            {error}
          </p>
        )}

        <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-staff-border-subtle mt-4">
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
            disabled={submitting || !!place.activeSession}
            onClick={handleDelete}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Deleting..." : "Permanently Delete Place"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
