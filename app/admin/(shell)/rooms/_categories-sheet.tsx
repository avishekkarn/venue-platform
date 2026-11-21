"use client";

import {
  useState,
  useEffect,
  useCallback,
  type JSX,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { getCsrfToken } from "@/lib/csrf-client";
import { formatMoney } from "@/lib/money";

export interface RoomCategoryItem {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  sortOrder: number;
}

interface RoomCategoriesSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (next: boolean) => void;
  readonly initialCategories: readonly RoomCategoryItem[];
  readonly currency: string;
  readonly onClose: () => void;
}

interface ToastOptions {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
}

export function RoomCategoriesSheet({
  open,
  onOpenChange,
  initialCategories,
  currency,
  onClose,
}: RoomCategoriesSheetProps): JSX.Element {
  const [categories, setCategories] = useState<RoomCategoryItem[]>([
    ...initialCategories,
  ]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBasePrice, setNewBasePrice] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBasePrice, setEditBasePrice] = useState("");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { fire } = useToast();
  const toast = useCallback(
    (opts: ToastOptions) => {
      fire({
        variant: opts.variant,
        message: opts.description ?? opts.title ?? "",
      });
    },
    [fire]
  );

  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rooms/categories", {
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data)) {
          setCategories(json.data);
        }
      }
    } catch {
      // Keep existing categories
    }
  }, []);

  useEffect(() => {
    if (open) {
      refreshCategories();
    }
  }, [open, refreshCategories]);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || busyId !== null) return;

    const trimmedPrice = newBasePrice.trim();
    if (trimmedPrice && !/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      setError("Base price must be a valid numeric amount (e.g. 2500.00).");
      return;
    }

    setBusyId("add");
    setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/rooms/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmed,
          description: newDescription.trim() || undefined,
          basePrice: trimmedPrice ? parseFloat(trimmedPrice) : 0,
          sortOrder: categories.length + 1,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to create category");
      }

      setNewName("");
      setNewDescription("");
      setNewBasePrice("");
      await refreshCategories();
      router.refresh();
      toast({ variant: "success", title: "Category created" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create category";
      setError(msg);
      toast({ variant: "error", title: "Error", description: msg });
    } finally {
      setBusyId(null);
    }
  };

  const handleStartEdit = (cat: RoomCategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditBasePrice(cat.basePrice || "0");
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditBasePrice("");
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed || busyId !== null) return;

    const trimmedPrice = editBasePrice.trim();
    if (trimmedPrice && !/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      setError("Base price must be a valid numeric amount (e.g. 2500.00).");
      return;
    }

    setBusyId(id);
    setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/rooms/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmed,
          description: editDescription.trim() || null,
          basePrice: trimmedPrice ? parseFloat(trimmedPrice) : 0,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to update category");
      }

      setEditingId(null);
      await refreshCategories();
      router.refresh();
      toast({ variant: "success", title: "Category updated" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update category";
      setError(msg);
      toast({ variant: "error", title: "Error", description: msg });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (cat: RoomCategoryItem) => {
    if (busyId !== null) return;
    const ok = window.confirm(
      `Delete category "${cat.name}"? Rooms in this category will become unassigned.`
    );
    if (!ok) return;

    setBusyId(cat.id);
    setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/rooms/categories/${cat.id}`, {
        method: "DELETE",
        headers: {
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to delete category");
      }

      await refreshCategories();
      router.refresh();
      toast({ variant: "success", title: "Category deleted" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete category";
      setError(msg);
      toast({ variant: "error", title: "Error", description: msg });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) onClose();
      }}
    >
      <SheetContent data-world="staff" side="right" className="w-full sm:max-w-lg flex flex-col p-0 bg-white">
        <SheetHeader className="p-6 border-b border-staff-border-subtle">
          <SheetTitle className="text-xl font-bold text-staff-text-primary">
            Room Categories & Pricing
          </SheetTitle>
          <SheetDescription className="text-xs text-staff-text-secondary mt-1">
            Configure room types (Deluxe, Non AC, Suites) and set nightly stay rates in {currency}.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-50 text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {/* Add Category Form */}
          <form
            onSubmit={handleAdd}
            className="p-4 rounded-xl bg-staff-surface-raised border border-staff-border-subtle flex flex-col gap-3"
          >
            <h3 className="text-xs font-semibold text-staff-text-primary uppercase tracking-wide">
              Add New Room Category
            </h3>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="room-cat-name" className="text-xs font-medium text-staff-text-secondary">
                Category Name *
              </label>
              <input
                id="room-cat-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Deluxe, Super Deluxe, Non AC, Night Suites"
                required
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="room-cat-price" className="text-xs font-medium text-staff-text-secondary">
                Base Nightly Stay Rate ({currency}) *
              </label>
              <input
                id="room-cat-price"
                type="text"
                value={newBasePrice}
                onChange={(e) => setNewBasePrice(e.target.value)}
                placeholder="e.g. 2500.00"
                required
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
              <span className="text-[11px] text-staff-text-muted">
                This rate is automatically included in the guest folio and final bill checkout.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="room-cat-desc" className="text-xs font-medium text-staff-text-secondary">
                Description (Optional)
              </label>
              <input
                id="room-cat-desc"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Bed type, AC/Non-AC, amenities"
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
            </div>

            <button
              type="submit"
              disabled={busyId !== null || !newName.trim()}
              className="mt-1 w-full py-2 text-xs font-medium rounded-lg bg-[#344b3c] text-white hover:bg-[#243329] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center shadow-xs"
              style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
            >
              {busyId === "add" ? "Adding..." : "Add Room Category"}
            </button>
          </form>

          {/* Existing Categories List */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-staff-text-primary uppercase tracking-wide">
              Configured Categories ({categories.length})
            </h3>

            {categories.length === 0 ? (
              <p className="text-xs text-staff-text-muted italic py-4 text-center">
                No room categories configured yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface flex flex-col gap-2"
                  >
                    {editingId === cat.id ? (
                      <div className="flex flex-col gap-2.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Category name"
                          className="w-full px-3 py-1.5 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-staff-text-muted">{currency}:</span>
                          <input
                            type="text"
                            value={editBasePrice}
                            onChange={(e) => setEditBasePrice(e.target.value)}
                            placeholder="Nightly rate"
                            className="w-full px-3 py-1.5 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
                          />
                        </div>
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-1.5 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={busyId === cat.id}
                            className="px-3 py-1 text-xs border border-staff-border-subtle rounded-lg text-staff-text-secondary hover:bg-staff-surface-raised transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            disabled={busyId === cat.id || !editName.trim()}
                            className="px-3 py-1 text-xs font-medium rounded-lg bg-[#344b3c] text-white hover:bg-[#243329] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center shadow-xs"
                            style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
                          >
                            {busyId === cat.id ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-staff-text-primary">
                              {cat.name}
                            </span>
                            <span className="text-xs font-mono font-semibold text-staff-brand">
                              {formatMoney(cat.basePrice, currency)}/night
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-staff-text-secondary">
                              {cat.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            disabled={busyId !== null}
                            className="px-2 py-1 text-[11px] text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            disabled={busyId !== null}
                            className="px-2 py-1 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
