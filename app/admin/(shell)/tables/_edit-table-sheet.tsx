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
import { TableState } from "@/domain/organization/table.repository";

export interface EditableTable {
  id: string;
  number: string;
  categoryId: string | null;
  state: TableState;
  hasActiveSession: boolean;
}

interface EditTableSheetProps {
  readonly table: EditableTable | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly categories: readonly { id: string; name: string; isReserved: boolean }[];
}

export function EditTableSheet({
  table,
  open,
  onOpenChange,
  categories,
}: EditTableSheetProps): JSX.Element {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [state, setState] = useState<TableState>(TableState.FREE);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (table) {
      setNumber(table.number);
      setCategoryId(table.categoryId ?? "");
      setState(table.state);
      setError(null);
    }
  }, [table]);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!table) return;
    setError(null);

    const trimmedNumber = number.trim();
    if (!trimmedNumber) {
      setError("Table number is required.");
      return;
    }

    setLoading(true);

    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/tables/${table.id}`, {
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
        throw new Error(json.error?.message || "Failed to update table");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update table");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!table) return;
    if (table.hasActiveSession) {
      setError("Cannot delete a table with an active session. End the session first.");
      return;
    }

    const ok = window.confirm(`Permanently delete Table ${table.number}?`);
    if (!ok) return;

    setDeleting(true);
    setError(null);

    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/tables/${table.id}`, {
        method: "DELETE",
        headers: {
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to delete table");
      }

      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete table");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-staff-border-subtle">
          <SheetTitle className="text-xl font-bold text-staff-text-primary">
            Edit Table {table ? table.number : ""}
          </SheetTitle>
          <SheetDescription className="text-xs text-staff-text-secondary mt-1">
            Update table numbering, zone category, or operational status.
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
              <label htmlFor="edit-table-number" className="text-xs font-medium text-staff-text-secondary">
                Table Number / Name *
              </label>
              <input
                id="edit-table-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 1, 14, Patio 2"
                required
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-table-category" className="text-xs font-medium text-staff-text-secondary">
                Category
              </label>
              <select
                id="edit-table-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              >
                <option value="">No Category (Unassigned)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.isReserved ? "(Reserved)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-table-state" className="text-xs font-medium text-staff-text-secondary">
                Operational State
              </label>
              <select
                id="edit-table-state"
                value={state}
                onChange={(e) => setState(e.target.value as TableState)}
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              >
                <option value={TableState.FREE}>Free</option>
                <option value={TableState.OCCUPIED}>Occupied</option>
                <option value={TableState.OUT_OF_SERVICE}>Out of Service</option>
              </select>
            </div>

            {table?.hasActiveSession && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                ⚠️ This table currently has an active guest session. You can force-end the session from the table card.
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-staff-border-subtle mt-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || deleting || table?.hasActiveSession}
                className="px-3 py-2 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              >
                {deleting ? "Deleting..." : "Delete Table"}
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
