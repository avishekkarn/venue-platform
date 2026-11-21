"use client";

import { useState, type FormEvent, type JSX } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { getCsrfToken } from "@/lib/csrf-client";
import { RoomState } from "@/domain/organization/room.repository";
import { formatMoney } from "@/lib/money";

interface AddRoomSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly categories: readonly { id: string; name: string; basePrice: string }[];
  readonly currency: string;
}

export function AddRoomSheet({
  open,
  onOpenChange,
  categories,
  currency,
}: AddRoomSheetProps): JSX.Element {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [state, setState] = useState<RoomState>(RoomState.VACANT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = (): void => {
    setNumber("");
    setCategoryId("");
    setState(RoomState.VACANT);
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      setError("Room number or identifier is required.");
      return;
    }

    setLoading(true);

    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          number: trimmedNumber,
          categoryId: categoryId || null,
          state,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to create room");
      }

      handleOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent data-world="staff" side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-white">
        <SheetHeader className="p-6 border-b border-staff-border-subtle">
          <SheetTitle className="text-xl font-bold text-staff-text-primary">
            Add New Room
          </SheetTitle>
          <SheetDescription className="text-xs text-staff-text-secondary mt-1">
            Create a hotel guest room with category and nightly pricing assignment.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="room-number" className="text-xs font-medium text-staff-text-secondary">
                Room Number / Name *
              </label>
              <input
                id="room-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 401, 502, Presidential Suite"
                required
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
              <span className="text-[11px] text-staff-text-muted">
                Unique identifier displayed to guests, housekeepers, and front desk.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="room-category" className="text-xs font-medium text-staff-text-secondary">
                Room Category & Pricing
              </label>
              <select
                id="room-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              >
                <option value="">No Category (Unassigned - 0.00)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({formatMoney(c.basePrice, currency)}/night)
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-staff-text-muted">
                Selecting a category binds the room&apos;s base nightly rate to guest checkout.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="room-state" className="text-xs font-medium text-staff-text-secondary">
                Initial Operational State
              </label>
              <select
                id="room-state"
                value={state}
                onChange={(e) => setState(e.target.value as RoomState)}
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              >
                <option value={RoomState.VACANT}>Vacant (Ready for guest check-in)</option>
                <option value={RoomState.OCCUPIED}>Occupied</option>
                <option value={RoomState.CLEANING}>Cleaning</option>
                <option value={RoomState.OUT_OF_SERVICE}>Out of Service</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-staff-border-subtle mt-2">
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
                className="px-4 py-2 text-xs font-medium border border-staff-border-subtle rounded-lg text-staff-text-secondary hover:bg-staff-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !number.trim()}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-[#344b3c] text-white hover:bg-[#243329] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center shadow-xs"
                style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
