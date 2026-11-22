"use client";

import { useState, type JSX, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCsrfToken } from "@/lib/csrf-client";

interface CategoryOption {
  id: string;
  name: string;
}

interface AddPlaceDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onPlaceCreated: () => void;
  readonly tableCategories: readonly CategoryOption[];
  readonly roomCategories: readonly CategoryOption[];
}

export function AddPlaceDialog({
  open,
  onOpenChange,
  onPlaceCreated,
  tableCategories,
  roomCategories,
}: AddPlaceDialogProps): JSX.Element {
  const [placeType, setPlaceType] = useState<"TABLE" | "ROOM" | "COUNTER">("TABLE");
  const [numberOrName, setNumberOrName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [autoGenerateQr, setAutoGenerateQr] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let createdPlaceId = "";

      if (placeType === "TABLE") {
        if (!numberOrName.trim()) {
          setError("Table number is required");
          setSubmitting(false);
          return;
        }
        const res = await fetch("/api/admin/tables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({
            number: numberOrName.trim(),
            categoryId: categoryId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message || "Failed to create table");
          setSubmitting(false);
          return;
        }
        createdPlaceId = data.data.id;
      } else if (placeType === "ROOM") {
        if (!numberOrName.trim()) {
          setError("Room number is required");
          setSubmitting(false);
          return;
        }
        const res = await fetch("/api/admin/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({
            number: numberOrName.trim(),
            categoryId: categoryId || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message || "Failed to create room");
          setSubmitting(false);
          return;
        }
        createdPlaceId = data.data.id;
      } else {
        const res = await fetch("/api/admin/counters", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({
            name: numberOrName.trim() || "Counter",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message || "Failed to create counter");
          setSubmitting(false);
          return;
        }
        createdPlaceId = data.data.id;
      }

      // Automatically generate QR if checked
      if (autoGenerateQr && createdPlaceId) {
        const qrPayload: Record<string, string> = { placeType };
        if (placeType === "TABLE") qrPayload["tableId"] = createdPlaceId;
        if (placeType === "ROOM") qrPayload["roomId"] = createdPlaceId;
        if (placeType === "COUNTER") qrPayload["counterId"] = createdPlaceId;

        await fetch("/api/admin/qr/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify(qrPayload),
        });
      }

      setNumberOrName("");
      setCategoryId("");
      onOpenChange(false);
      onPlaceCreated();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-staff-text-primary">
            Add New Venue Place
          </DialogTitle>
          <DialogDescription className="text-xs text-staff-text-muted mt-1">
            Create a physical or service location and automatically issue its scannable QR placard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {/* Place Type Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-staff-text-secondary uppercase tracking-wide">
              Place Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPlaceType("TABLE");
                  setCategoryId("");
                  setError(null);
                }}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  placeType === "TABLE"
                    ? "bg-staff-brand text-white border-staff-brand shadow-2xs font-semibold"
                    : "bg-staff-surface border-staff-border-subtle text-staff-text-secondary hover:text-staff-text-primary"
                }`}
              >
                🍽️ Table
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaceType("ROOM");
                  setCategoryId("");
                  setError(null);
                }}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  placeType === "ROOM"
                    ? "bg-staff-brand text-white border-staff-brand shadow-2xs font-semibold"
                    : "bg-staff-surface border-staff-border-subtle text-staff-text-secondary hover:text-staff-text-primary"
                }`}
              >
                🛏️ Hotel Room
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaceType("COUNTER");
                  setCategoryId("");
                  setError(null);
                }}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  placeType === "COUNTER"
                    ? "bg-staff-brand text-white border-staff-brand shadow-2xs font-semibold"
                    : "bg-staff-surface border-staff-border-subtle text-staff-text-secondary hover:text-staff-text-primary"
                }`}
              >
                🛎️ Counter
              </button>
            </div>
          </div>

          {/* Identifier or Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-staff-text-secondary uppercase tracking-wide">
              {placeType === "TABLE"
                ? "Table Number *"
                : placeType === "ROOM"
                ? "Room Number *"
                : "Counter Name *"}
            </label>
            <input
              type="text"
              required
              value={numberOrName}
              onChange={(e) => setNumberOrName(e.target.value)}
              placeholder={
                placeType === "TABLE"
                  ? "e.g. 13, 14, Patio-1"
                  : placeType === "ROOM"
                  ? "e.g. 405, 501, Deluxe-A"
                  : "e.g. Main Counter, Bar Counter"
              }
              className="h-10 px-3 rounded-lg border border-staff-border-subtle bg-staff-surface text-staff-text-primary text-sm focus:border-staff-brand focus:ring-1 focus:ring-staff-brand outline-none"
            />
          </div>

          {/* Category Dropdown (for Table and Room) */}
          {placeType === "TABLE" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-staff-text-secondary uppercase tracking-wide">
                Table Category (Zone)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 px-3 rounded-lg border border-staff-border-subtle bg-staff-surface text-staff-text-primary text-sm focus:border-staff-brand outline-none"
              >
                <option value="">No Category (Default)</option>
                {tableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {placeType === "ROOM" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-staff-text-secondary uppercase tracking-wide">
                Room Category & Pricing
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="h-10 px-3 rounded-lg border border-staff-border-subtle bg-staff-surface text-staff-text-primary text-sm focus:border-staff-brand outline-none"
              >
                <option value="">Standard (No base rate)</option>
                {roomCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Auto Generate QR Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-staff-border-subtle bg-staff-surface cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoGenerateQr}
              onChange={(e) => setAutoGenerateQr(e.target.checked)}
              className="rounded border-staff-border-subtle text-staff-brand focus:ring-staff-brand h-4 w-4"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-staff-text-primary">
                Auto-generate active QR placard
              </span>
              <span className="text-[11px] text-staff-text-muted">
                Immediately issues a scannable token and enables placard printing.
              </span>
            </div>
          </label>

          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
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
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Place"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
