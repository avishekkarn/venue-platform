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
import { PhotoBox } from "./_photo-box";
import { MenuItemState } from "@/domain/menu/menu.repository";

interface AddItemSheetProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly categories: readonly { id: string; name: string }[];
  readonly currency: string;
}

export function AddItemSheet({
  open,
  onOpenChange,
  categories,
  currency,
}: AddItemSheetProps): JSX.Element {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>(
    categories.length > 0 && categories[0] ? [categories[0].id] : []
  );
  const [state, setState] = useState<MenuItemState>(MenuItemState.AVAILABLE);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBlurData, setPhotoBlurData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = (): void => {
    setName("");
    setDescription("");
    setPrice("");
    setCategoryIds(categories.length > 0 && categories[0] ? [categories[0].id] : []);
    setState(MenuItemState.AVAILABLE);
    setPhotoUrl(null);
    setPhotoBlurData(null);
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

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Item name is required.");
      return;
    }

    const trimmedPrice = price.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      setError("Price must be a valid decimal amount (e.g. 12.50).");
      return;
    }

    if (categoryIds.length === 0) {
      setError("Select at least one category.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/menu/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
          price: trimmedPrice,
          categoryIds,
          state,
          photoUrl,
          photoBlurData,
        }),
      });

      if (res.ok) {
        handleOpenChange(false);
        router.refresh();
      } else {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(data?.error?.message ?? `Failed to create item (status ${res.status})`);
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        world="staff"
        className="flex flex-col h-full w-full sm:max-w-[480px] overflow-hidden"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>Add menu item</SheetTitle>
          <SheetDescription>Create a new item for the menu.</SheetDescription>
        </SheetHeader>
        <SheetBody className="flex-1 overflow-y-auto min-h-0">
          {error ? (
            <div
              role="alert"
              className="mb-4 rounded-md border border-status-cancelled-border bg-status-cancelled-bg p-3 text-sm text-status-cancelled"
            >
              {error}
            </div>
          ) : null}
          <form id="add-item-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-staff-text-primary">
                Item photo
              </label>
              <PhotoBox
                initialPhotoUrl={photoUrl}
                onUploaded={(url, blur) => {
                  setPhotoUrl(url);
                  setPhotoBlurData(blur);
                }}
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-name" className="text-sm font-medium text-staff-text-primary">
                Name
              </label>
              <input
                id="add-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                placeholder="e.g. Steam Momo"
                className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-price" className="text-sm font-medium text-staff-text-primary">
                Price ({currency})
              </label>
              <input
                id="add-price"
                type="text"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={loading}
                required
                placeholder="0.00"
                className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm font-mono text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-cat" className="text-sm font-medium text-staff-text-primary">
                Categories
              </label>
              <select
                id="add-cat"
                multiple
                size={Math.min(6, Math.max(3, categories.length))}
                value={categoryIds}
                onChange={(e) =>
                  setCategoryIds(Array.from(e.target.selectedOptions, (o) => o.value))
                }
                disabled={loading}
                className="p-2 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="py-1 px-1">
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-staff-text-muted">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple categories.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-state" className="text-sm font-medium text-staff-text-primary">
                State
              </label>
              <select
                id="add-state"
                value={state}
                onChange={(e) => setState(e.target.value as MenuItemState)}
                disabled={loading}
                className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
              >
                <option value={MenuItemState.AVAILABLE}>Available</option>
                <option value={MenuItemState.UNAVAILABLE}>Unavailable</option>
                <option value={MenuItemState.HIDDEN}>Hidden</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="add-desc" className="text-sm font-medium text-staff-text-primary">
                Description
              </label>
              <textarea
                id="add-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
                placeholder="Optional description..."
                className="px-3 py-2 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand resize-y"
              />
            </div>
          </form>
        </SheetBody>
        <div className="shrink-0 p-4 pb-6 border-t border-staff-border-subtle bg-staff-surface-raised flex justify-end gap-3">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="h-9 px-4 rounded-md text-sm font-medium text-staff-text-secondary hover:bg-staff-surface-sunken transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-item-form"
            disabled={loading}
            className="h-9 px-4 rounded-md text-sm font-medium bg-[#344b3c] text-white hover:bg-[#243329] disabled:opacity-50 transition-colors inline-flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
          >
            {loading ? "Creating..." : "Create item"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
