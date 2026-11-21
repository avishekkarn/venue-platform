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
import { TableState } from "@/domain/organization/table.repository";

interface AddTableSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly categories: readonly { id: string; name: string; isReserved: boolean }[];
}

export function AddTableSheet({
  open,
  onOpenChange,
  categories,
}: AddTableSheetProps): JSX.Element {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [state, setState] = useState<TableState>(TableState.FREE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = (): void => {
    setNumber("");
    setCategoryId("");
    setState(TableState.FREE);
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
      setError("Table number or identifier is required.");
      return;
    }

    setLoading(true);

    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/tables", {
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
        throw new Error(json.error?.message || "Failed to create table");
      }

      handleOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create table");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-staff-border-subtle">
          <SheetTitle className="text-xl font-bold text-staff-text-primary">
            Add New Table
          </SheetTitle>
          <SheetDescription className="text-xs text-staff-text-secondary mt-1">
            Create a table with custom numbering and category assignment.
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
              <label htmlFor="table-number" className="text-xs font-medium text-staff-text-secondary">
                Table Number / Name *
              </label>
              <input
                id="table-number"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. 13, Patio 4, VIP 2"
                required
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
              <span className="text-[11px] text-staff-text-muted">
                Unique identifier displayed to guests and staff.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="table-category" className="text-xs font-medium text-staff-text-secondary">
                Category
              </label>
              <select
                id="table-category"
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
              <span className="text-[11px] text-staff-text-muted">
                Selecting a Reserved category automatically blocks customer self-ordering.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="table-state" className="text-xs font-medium text-staff-text-secondary">
                Initial Operational State
              </label>
              <select
                id="table-state"
                value={state}
                onChange={(e) => setState(e.target.value as TableState)}
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              >
                <option value={TableState.FREE}>Free (Ready for guests)</option>
                <option value={TableState.OCCUPIED}>Occupied</option>
                <option value={TableState.OUT_OF_SERVICE}>Out of Service</option>
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
                className="px-4 py-2 text-xs font-medium rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Table"}
              </button>
            </div>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
