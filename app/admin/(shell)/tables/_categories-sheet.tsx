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

export interface TableCategoryItem {
  id: string;
  name: string;
  description: string | null;
  isReserved: boolean;
  sortOrder: number;
}

interface TableCategoriesSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (next: boolean) => void;
  readonly initialCategories: readonly TableCategoryItem[];
  readonly onClose: () => void;
}

interface ToastOptions {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
}

export function TableCategoriesSheet({
  open,
  onOpenChange,
  initialCategories,
  onClose,
}: TableCategoriesSheetProps): JSX.Element {
  const [categories, setCategories] = useState<TableCategoryItem[]>([
    ...initialCategories,
  ]);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIsReserved, setNewIsReserved] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsReserved, setEditIsReserved] = useState(false);

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
      const res = await fetch("/api/admin/tables/categories", {
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

    setBusyId("add");
    setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/tables/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmed,
          description: newDescription.trim() || undefined,
          isReserved: newIsReserved,
          sortOrder: categories.length + 1,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to create category");
      }

      setNewName("");
      setNewDescription("");
      setNewIsReserved(false);
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

  const handleStartEdit = (cat: TableCategoryItem) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
    setEditIsReserved(cat.isReserved);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditIsReserved(false);
    setError(null);
  };

  const handleSaveEdit = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed || busyId !== null) return;

    setBusyId(id);
    setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/tables/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          name: trimmed,
          description: editDescription.trim() || null,
          isReserved: editIsReserved,
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

  const handleDelete = async (cat: TableCategoryItem) => {
    if (busyId !== null) return;
    const ok = window.confirm(
      `Delete category "${cat.name}"? Tables in this category will become unassigned.`
    );
    if (!ok) return;

    setBusyId(cat.id);
    setError(null);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/tables/categories/${cat.id}`, {
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
            Table Categories
          </SheetTitle>
          <SheetDescription className="text-xs text-staff-text-secondary mt-1">
            Organize tables by dining zone, section, or reservation status.
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
              Add New Category
            </h3>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="category-name" className="text-xs font-medium text-staff-text-secondary">
                Category Name *
              </label>
              <input
                id="category-name"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Indoor, Patio, VIP Lounge, Reserved"
                required
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="category-desc" className="text-xs font-medium text-staff-text-secondary">
                Description (Optional)
              </label>
              <input
                id="category-desc"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief section note"
                className="w-full px-3 py-2 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary placeholder:text-staff-text-muted focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={newIsReserved}
                onChange={(e) => setNewIsReserved(e.target.checked)}
                className="h-4 w-4 rounded border-staff-border-subtle text-amber-600 focus:ring-amber-500"
              />
              <div className="text-xs">
                <span className="font-medium text-staff-text-primary block">
                  Mark as Reserved Category
                </span>
                <span className="text-[11px] text-staff-text-muted">
                  Guests scanning tables in this category are blocked from self-service and routed to reservation notice.
                </span>
              </div>
            </label>

            <button
              type="submit"
              disabled={busyId !== null || !newName.trim()}
              className="mt-1 w-full py-2 text-xs font-medium rounded-lg bg-[#344b3c] text-white hover:bg-[#243329] transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center shadow-xs"
              style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
            >
              {busyId === "add" ? "Adding..." : "Add Category"}
            </button>
          </form>

          {/* Existing Categories List */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-staff-text-primary uppercase tracking-wide">
              Existing Categories ({categories.length})
            </h3>

            {categories.length === 0 ? (
              <p className="text-xs text-staff-text-muted italic py-4 text-center">
                No categories configured yet.
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
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                          className="w-full px-3 py-1.5 text-xs border border-staff-border-subtle rounded-lg bg-staff-surface text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand"
                        />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editIsReserved}
                            onChange={(e) => setEditIsReserved(e.target.checked)}
                            className="h-4 w-4 rounded border-staff-border-subtle text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-xs text-staff-text-primary font-medium">
                            Reserved Category (blocks walk-ins)
                          </span>
                        </label>
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
                            {cat.isReserved && (
                              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                Reserved
                              </span>
                            )}
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
