"use client";

import {
  useState,
  useEffect,
  useCallback,
  type JSX,
  type FormEvent,
} from "react";
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

interface CategoryItem {
  id: string;
  name: string;
  sortOrder: number;
}

interface CategoriesSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (next: boolean) => void;
  readonly initialCategories: readonly CategoryItem[];
  readonly onClose: () => void;
}

interface ToastOptions {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
}

export function CategoriesSheet({
  open,
  onOpenChange,
  initialCategories,
  onClose,
}: CategoriesSheetProps): JSX.Element {
  const [categories, setCategories] = useState<CategoryItem[]>([
    ...initialCategories,
  ]);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let active = true;
    fetch("/api/admin/menu/categories", { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (active && Array.isArray(json.data)) {
            setCategories(
              json.data.map((c: { id: string; name: string; sortOrder: number }) => ({
                id: c.id,
                name: c.name,
                sortOrder: c.sortOrder,
              }))
            );
          }
        }
      })
      .catch(() => {
        // Fallback to initialCategories
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAdd = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed || busyId !== null) return;

    setBusyId("add");
    setError(null);
    try {
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sortOrder), 0);
      const nextOrder = maxOrder + 1;
      const res = await fetch("/api/admin/menu/categories", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ name: trimmed, sortOrder: nextOrder }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        setCategories((prev) => [
          ...prev,
          {
            id: data.data.id,
            name: data.data.name,
            sortOrder: data.data.sortOrder,
          },
        ]);
        setNewName("");
        onClose();
      } else if (res.status === 409) {
        toast({
          variant: "error",
          title: "Category already exists",
          description: data.error?.message ?? "Category already exists",
        });
      } else {
        setError(data.error?.message ?? "Failed to add category");
      }
    } catch {
      setError("Network error adding category");
    } finally {
      setBusyId(null);
    }
  };

  const handleRename = async (id: string, name: string) => {
    if (busyId !== null) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/categories/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, name: data.data.name } : c))
        );
        onClose();
      } else {
        setError(data.error?.message ?? "Failed to rename category");
      }
    } catch {
      setError("Network error renaming category");
    } finally {
      setBusyId(null);
    }
  };

  const handleMove = async (
    id: string,
    idx: number,
    direction: "up" | "down"
  ) => {
    if (busyId !== null) return;
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const current = sorted[idx];
    const neighbor = sorted[targetIdx];
    if (!current || !neighbor) return;

    setBusyId(id);
    setError(null);
    try {
      let currentNewOrder = neighbor.sortOrder;
      let neighborNewOrder = current.sortOrder;
      if (currentNewOrder === neighborNewOrder) {
        currentNewOrder =
          direction === "up" ? neighbor.sortOrder - 1 : neighbor.sortOrder + 1;
      }

      const [res1, res2] = await Promise.all([
        fetch(`/api/admin/menu/categories/${current.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({ sortOrder: currentNewOrder }),
        }),
        fetch(`/api/admin/menu/categories/${neighbor.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({ sortOrder: neighborNewOrder }),
        }),
      ]);

      if (res1.ok && res2.ok) {
        setCategories((prev) =>
          prev.map((c) => {
            if (c.id === current.id) return { ...c, sortOrder: currentNewOrder };
            if (c.id === neighbor.id) return { ...c, sortOrder: neighborNewOrder };
            return c;
          })
        );
        onClose();
      } else {
        const errJson = await (res1.ok ? res2.json() : res1.json());
        setError(errJson.error?.message ?? "Failed to reorder categories");
      }
    } catch {
      setError("Network error reordering categories");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (busyId !== null) return;
    const confirmed = window.confirm(
      `Delete category "${name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRF-Token": getCsrfToken() },
      });

      if (res.status === 204) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        onClose();
      } else {
        const data = await res.json();
        if (res.status === 409) {
          toast({
            variant: "error",
            title: "Cannot delete",
            description: data.error?.message ?? "Cannot delete category",
          });
        } else if (res.status === 404) {
          toast({
            variant: "error",
            title: "Not found",
            description: "This category is no longer available.",
          });
        } else {
          setError(data.error?.message ?? "Failed to delete category");
        }
      }
    } catch {
      setError("Network error deleting category");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        world="staff"
        className="flex flex-col h-full w-full sm:max-w-[480px] overflow-hidden"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>Manage categories</SheetTitle>
          <SheetDescription>
            Add, rename, reorder, and delete this venue&apos;s categories.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="flex-1 overflow-y-auto min-h-0">
          {error ? (
            <div
              role="alert"
              className="rounded-md border border-status-cancelled bg-status-cancelled-bg p-3 text-sm text-status-cancelled mb-3"
            >
              {error}
            </div>
          ) : null}

          {/* the add row */}
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <label htmlFor="new-category-name" className="sr-only">
              New category name
            </label>
            <input
              id="new-category-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New category name"
              className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-staff-brand flex-1"
            />
            <button
              type="submit"
              disabled={busyId !== null || newName.trim().length === 0}
              className="h-10 px-4 rounded-md text-sm font-medium bg-staff-brand text-white hover:bg-staff-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </form>

          {/* the list */}
          <ul className="flex flex-col gap-2">
            {[...categories]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat, idx, arr) => (
                <li
                  key={cat.id}
                  className="flex items-center gap-2 rounded-md border border-staff-border-subtle bg-staff-surface-raised px-3 py-2"
                >
                  <input
                    type="text"
                    defaultValue={cat.name}
                    onBlur={(e) => {
                      const val = e.target.value.trim();
                      if (val !== cat.name && val.length > 0) {
                        handleRename(cat.id, val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                    aria-label={`Rename ${cat.name}`}
                    className="flex-1 bg-transparent border-0 text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand rounded px-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleMove(cat.id, idx, "up")}
                    disabled={busyId !== null || idx === 0}
                    aria-label={`Move ${cat.name} up`}
                    className="size-8 rounded-md text-sm bg-staff-surface-sunken hover:bg-staff-border-subtle disabled:opacity-40"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(cat.id, idx, "down")}
                    disabled={busyId !== null || idx === arr.length - 1}
                    aria-label={`Move ${cat.name} down`}
                    className="size-8 rounded-md text-sm bg-staff-surface-sunken hover:bg-staff-border-subtle disabled:opacity-40"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={busyId !== null}
                    aria-label={`Delete ${cat.name}`}
                    className="size-8 rounded-md text-sm text-status-cancelled bg-staff-surface-sunken hover:bg-status-cancelled-bg disabled:opacity-40"
                  >
                    ✕
                  </button>
                </li>
              ))}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
