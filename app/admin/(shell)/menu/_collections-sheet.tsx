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

export interface CollectionItem {
  id: string;
  name: string;
  featuredFrom: string | null;
  featuredTo: string | null;
  sortOrder: number;
  items: readonly { id: string; name: string; sortOrder: number }[];
}

export interface MenuItemRef {
  id: string;
  name: string;
}

export interface CollectionsSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (next: boolean) => void;
  readonly initialCollections: readonly CollectionItem[];
  readonly allMenuItems: readonly MenuItemRef[];
  readonly onClose: () => void;
}

interface ToastOptions {
  variant?: "success" | "error" | "warning" | "info";
  title?: string;
  description?: string;
}

function toDateInputValue(val: string | null | undefined): string {
  if (!val) return "";
  const match = val.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] ?? "" : "";
}

export function CollectionsSheet({
  open,
  onOpenChange,
  initialCollections,
  allMenuItems,
  onClose,
}: CollectionsSheetProps): JSX.Element {
  const [collections, setCollections] = useState<CollectionItem[]>([
    ...initialCollections,
  ]);
  const [newName, setNewName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemByCol, setSelectedItemByCol] = useState<
    Record<string, string>
  >({});
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

  useEffect(() => {
    let active = true;
    const nowIso = new Date().toISOString();
    fetch(`/api/admin/menu/collections?at=${encodeURIComponent(nowIso)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          const json = await res.json();
          if (active && Array.isArray(json.data)) {
            setCollections(
              json.data.map(
                (c: {
                  id: string;
                  name: string;
                  featuredFrom: string | null;
                  featuredTo: string | null;
                  sortOrder: number;
                  items?: Array<{
                    id: string;
                    name: string;
                    sortOrder?: number;
                    order?: number;
                  }>;
                }) => ({
                  id: c.id,
                  name: c.name,
                  featuredFrom: c.featuredFrom,
                  featuredTo: c.featuredTo,
                  sortOrder: c.sortOrder,
                  items: Array.isArray(c.items)
                    ? c.items.map((i) => ({
                        id: i.id,
                        name: i.name,
                        sortOrder: i.sortOrder ?? i.order ?? 0,
                      }))
                    : [],
                })
              )
            );
          }
        }
      })
      .catch(() => {
        // Fallback to initialCollections
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
      const maxOrder = collections.reduce((m, c) => Math.max(m, c.sortOrder), 0);
      const nextOrder = maxOrder + 1;
      const res = await fetch("/api/admin/menu/collections", {
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
        setCollections((prev) => [
          ...prev,
          {
            id: data.data.id,
            name: data.data.name,
            featuredFrom: data.data.featuredFrom ?? null,
            featuredTo: data.data.featuredTo ?? null,
            sortOrder: data.data.sortOrder,
            items: [],
          },
        ]);
        setNewName("");
        router.refresh();
        onClose();
      } else if (res.status === 409) {
        toast({
          variant: "error",
          title: "Collection already exists",
          description: data.error?.message ?? "Collection already exists",
        });
      } else {
        setError(data.error?.message ?? "Failed to add collection");
      }
    } catch {
      setError("Network error adding collection");
    } finally {
      setBusyId(null);
    }
  };

  const handlePatch = async (
    id: string,
    patch: {
      name?: string;
      featuredFrom?: string | null;
      featuredTo?: string | null;
      sortOrder?: number;
    }
  ) => {
    if (busyId !== null) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/collections/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: data.data.name,
                  featuredFrom: data.data.featuredFrom ?? null,
                  featuredTo: data.data.featuredTo ?? null,
                  sortOrder: data.data.sortOrder,
                }
              : c
          )
        );
        router.refresh();
      } else {
        setError(data.error?.message ?? "Failed to update collection");
      }
    } catch {
      setError("Network error updating collection");
    } finally {
      setBusyId(null);
    }
  };

  const handleAddItem = async (collectionId: string) => {
    const menuItemId = selectedItemByCol[collectionId];
    if (!menuItemId || busyId !== null) return;

    setBusyId(`item-add-${collectionId}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/collections/${collectionId}/items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ menuItemId }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        const itemRef = allMenuItems.find((m) => m.id === menuItemId);
        const itemName = itemRef ? itemRef.name : "Item";
        const newItem = {
          id: menuItemId,
          name: itemName,
          sortOrder: data.data.sortOrder ?? 0,
        };
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? { ...c, items: [...c.items, newItem] }
              : c
          )
        );
        setSelectedItemByCol((prev) => ({ ...prev, [collectionId]: "" }));
        router.refresh();
      } else if (res.status === 409) {
        toast({
          variant: "error",
          title: "Cannot add item",
          description: data.error?.message ?? "Item is already in this collection",
        });
      } else {
        setError(data.error?.message ?? "Failed to add item to collection");
      }
    } catch {
      setError("Network error adding item to collection");
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveItem = async (collectionId: string, menuItemId: string) => {
    if (busyId !== null) return;
    setBusyId(`item-del-${collectionId}-${menuItemId}`);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/collections/${collectionId}/items`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ menuItemId }),
      });
      if (res.status === 204) {
        setCollections((prev) =>
          prev.map((c) =>
            c.id === collectionId
              ? { ...c, items: c.items.filter((it) => it.id !== menuItemId) }
              : c
          )
        );
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error?.message ?? "Failed to remove item from collection");
      }
    } catch {
      setError("Network error removing item from collection");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteCollection = async (id: string, name: string) => {
    if (busyId !== null) return;
    const confirmed = window.confirm(
      `Delete collection "${name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/menu/collections/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-CSRF-Token": getCsrfToken() },
      });

      if (res.status === 204) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        const data = await res.json();
        if (res.status === 404) {
          toast({
            variant: "error",
            title: "Not found",
            description: "This collection is no longer available.",
          });
        } else {
          setError(data.error?.message ?? "Failed to delete collection");
        }
      }
    } catch {
      setError("Network error deleting collection");
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
      <SheetContent
        side="right"
        world="staff"
        className="flex flex-col h-full w-full sm:max-w-[480px] overflow-hidden"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>Manage collections</SheetTitle>
          <SheetDescription>
            Add, edit dates, manage items, and delete this venue&apos;s collections.
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
            <label htmlFor="new-collection-name" className="sr-only">
              New collection name
            </label>
            <input
              id="new-collection-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New collection name"
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
          <ul className="flex flex-col gap-3">
            {[...collections]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((col) => {
                const assignedIds = new Set(col.items.map((it) => it.id));
                const availableItems = allMenuItems.filter(
                  (it) => !assignedIds.has(it.id)
                );

                return (
                  <li
                    key={col.id}
                    className="flex flex-col gap-2 rounded-md border border-staff-border-subtle bg-staff-surface-raised p-3"
                  >
                    {/* Top row: name + delete */}
                    <div className="flex items-center gap-2">
                      <label htmlFor={`col-name-${col.id}`} className="sr-only">
                        Collection name
                      </label>
                      <input
                        id={`col-name-${col.id}`}
                        type="text"
                        defaultValue={col.name}
                        onBlur={(e) => {
                          const val = e.target.value.trim();
                          if (val !== col.name && val.length > 0) {
                            handlePatch(col.id, { name: val });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                        aria-label={`Rename collection ${col.name}`}
                        className="flex-1 bg-transparent border-0 text-sm font-semibold text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand rounded px-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCollection(col.id, col.name)}
                        disabled={busyId !== null}
                        aria-label={`Delete collection ${col.name}`}
                        className="size-8 rounded-md text-sm text-status-cancelled bg-staff-surface-sunken hover:bg-status-cancelled-bg disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Second row: dates + sortOrder */}
                    <div className="grid grid-cols-5 gap-2 items-center text-xs">
                      <div className="col-span-2 flex flex-col gap-1">
                        <label
                          htmlFor={`col-from-${col.id}`}
                          className="text-staff-text-muted"
                        >
                          From
                        </label>
                        <input
                          id={`col-from-${col.id}`}
                          type="date"
                          value={toDateInputValue(col.featuredFrom)}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            handlePatch(col.id, {
                              featuredFrom: val.length > 0 ? val : null,
                            });
                          }}
                          aria-label={`Featured from date for ${col.name}`}
                          className="h-8 px-2 rounded border border-staff-border-subtle bg-staff-surface-sunken text-staff-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-staff-brand"
                        />
                      </div>
                      <div className="col-span-2 flex flex-col gap-1">
                        <label
                          htmlFor={`col-to-${col.id}`}
                          className="text-staff-text-muted"
                        >
                          To
                        </label>
                        <input
                          id={`col-to-${col.id}`}
                          type="date"
                          value={toDateInputValue(col.featuredTo)}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            handlePatch(col.id, {
                              featuredTo: val.length > 0 ? val : null,
                            });
                          }}
                          aria-label={`Featured to date for ${col.name}`}
                          className="h-8 px-2 rounded border border-staff-border-subtle bg-staff-surface-sunken text-staff-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-staff-brand"
                        />
                      </div>
                      <div className="col-span-1 flex flex-col gap-1">
                        <label
                          htmlFor={`col-order-${col.id}`}
                          className="text-staff-text-muted"
                        >
                          Order
                        </label>
                        <input
                          id={`col-order-${col.id}`}
                          type="number"
                          defaultValue={col.sortOrder}
                          onBlur={(e) => {
                            const n = parseInt(e.target.value, 10);
                            if (!isNaN(n) && n !== col.sortOrder) {
                              handlePatch(col.id, { sortOrder: n });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                          aria-label={`Sort order for ${col.name}`}
                          className="h-8 px-2 rounded border border-staff-border-subtle bg-staff-surface-sunken text-staff-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-staff-brand"
                        />
                      </div>
                    </div>

                    {/* Third row: Items in collection */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <span className="text-xs font-medium text-staff-text-muted">
                        Items ({col.items.length})
                      </span>
                      {col.items.length === 0 ? (
                        <p className="text-xs text-staff-text-muted italic">
                          No items in this collection
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {col.items.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-staff-surface-sunken border border-staff-border-subtle text-staff-text-primary"
                            >
                              <span>{item.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(col.id, item.id)}
                                disabled={busyId !== null}
                                aria-label={`Remove ${item.name} from ${col.name}`}
                                className="text-staff-text-muted hover:text-status-cancelled text-xs leading-none"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fourth row: Add item to collection */}
                    <div className="flex gap-2 items-center pt-1">
                      <label htmlFor={`add-item-select-${col.id}`} className="sr-only">
                        Select item to add to {col.name}
                      </label>
                      <select
                        id={`add-item-select-${col.id}`}
                        value={selectedItemByCol[col.id] ?? ""}
                        onChange={(e) =>
                          setSelectedItemByCol((prev) => ({
                            ...prev,
                            [col.id]: e.target.value,
                          }))
                        }
                        aria-label={`Select item to add to ${col.name}`}
                        className="h-8 px-2 rounded border border-staff-border-subtle bg-staff-surface-sunken text-staff-text-primary text-xs focus:outline-none focus:ring-2 focus:ring-staff-brand flex-1"
                      >
                        <option value="">Select menu item...</option>
                        {availableItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddItem(col.id)}
                        disabled={
                          busyId !== null || !selectedItemByCol[col.id]
                        }
                        aria-label={`Add item to ${col.name}`}
                        className="h-8 px-3 rounded text-xs font-medium bg-staff-brand text-white hover:bg-staff-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                  </li>
                );
              })}
          </ul>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
