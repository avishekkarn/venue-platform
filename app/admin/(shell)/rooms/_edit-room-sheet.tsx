"use client";

import { useState, useEffect, type FormEvent, type JSX } from "react";
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

export interface EditableRoom {
  id: string;
  number: string;
  categoryId: string | null;
  state: RoomState;
  hasActiveSession: boolean;
}

interface EditRoomSheetProps {
  readonly room: EditableRoom | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly categories: readonly { id: string; name: string; basePrice: string }[];
  readonly currency: string;
}

export function EditRoomSheet({
  room,
  open,
  onOpenChange,
  categories,
  currency,
}: EditRoomSheetProps): JSX.Element {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [state, setState] = useState<RoomState>(RoomState.VACANT);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room) {
      setNumber(room.number);
      setCategoryId(room.categoryId ?? "");
      setState(room.state);
      setError(null);
    }
  }, [room]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!room) return;
    setError(null);

    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      setError("Room number is required.");
      return;
    }

    setLoading(true);

    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: "PATCH",
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
        throw new Error(json.error?.message || "Failed to update room");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update room");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!room) return;
    if (room.hasActiveSession) {
      setError("Cannot delete a room with an active session. Force checkout first.");
      return;
    }

    const ok = window.confirm(`Permanently delete Room ${room.number}?`);
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/rooms/${room.id}`, {
        method: "DELETE",
        headers: {
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to delete room");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-staff-border-subtle">
          <SheetTitle className="text-xl font-bold text-staff-text-primary">
            Edit Room {room ? room.number : ""}
          </SheetTitle>
          <SheetDescription className="text-xs text-staff-text-secondary mt-1">
            Update room numbering, category rate, or housekeeping status.
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
              <label htmlFor="edit-room-number" className="text-xs font-medium text-staff-text-secondary">
                Room Number / Name *
              </label>
              <input
                id="edit-room-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 401, 502"
                required
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-room-category" className="text-xs font-medium text-staff-text-secondary">
                Category & Nightly Pricing
              </label>
              <select
                id="edit-room-category"
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
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-room-state" className="text-xs font-medium text-staff-text-secondary">
                Operational State
              </label>
              <select
                id="edit-room-state"
                value={state}
                onChange={(e) => setState(e.target.value as RoomState)}
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              >
                <option value={RoomState.VACANT}>Vacant</option>
                <option value={RoomState.OCCUPIED}>Occupied</option>
                <option value={RoomState.CLEANING}>Cleaning</option>
                <option value={RoomState.OUT_OF_SERVICE}>Out of Service</option>
              </select>
            </div>

            {room?.hasActiveSession && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                ⚠️ This room currently has an active guest stay. You can force checkout from the room card.
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-staff-border-subtle mt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleting || room?.hasActiveSession}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete Room"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={loading || deleting}
                  className="px-4 py-2 text-xs font-medium border border-staff-border-subtle rounded-lg text-staff-text-secondary hover:bg-staff-surface-raised transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || deleting || !number.trim()}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover transition-colors disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
