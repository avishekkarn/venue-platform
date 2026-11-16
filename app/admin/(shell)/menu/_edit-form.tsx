"use client";

import { useState, type JSX, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCsrfToken } from "@/lib/csrf-client";
import { PhotoBox } from "./_photo-box";
import { MenuItemState, type MenuItemView } from "@/domain/menu/menu.repository";

/**
 * Edit menu item form (8.3.3, DESIGN.md §4.10.8).
 *
 * Client Component rendered inside the Sheet drawer on the admin menu page.
 * Holds state for editable fields (name, description, price, category, photo)
 * and renders PhotoBox (8.3.2a) for image upload and preview.
 *
 * Submits via PATCH /api/admin/menu/items/[id] with X-CSRF-Token: getCsrfToken().
 * Sends only the changed fields (the diff against initial item) to honor the
 * partial PATCH contract and prevent accidental data-loss.
 * On success: calls router.push("/admin/menu") to close the drawer and update the list.
 *
 * Reference: ROADMAP.md §12 (8.3.3), DESIGN.md §4.10.8, D-20.1, D-22.1, D-23.1.
 */
interface EditFormProps {
  readonly item: MenuItemView;
  readonly initialCategoryIds: readonly string[];
  readonly categories: readonly { id: string; name: string }[];
  readonly currency?: string;
  readonly onClose?: () => void;
}

export function EditForm({
  item,
  initialCategoryIds,
  categories,
  currency = "NPR",
  onClose,
}: EditFormProps): JSX.Element {
  const router = useRouter();

  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(item.price);
  const [categoryIds, setCategoryIds] = useState<string[]>([...initialCategoryIds]);
  const [state, setState] = useState<MenuItemState>(item.state);
  const [photoUrl, setPhotoUrl] = useState<string | null>(item.photoUrl);
  const [photoBlurData, setPhotoBlurData] = useState<string | null>(
    item.photoBlurData ?? null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUploaded = (url: string, blurData: string): void => {
    setPhotoUrl(url);
    setPhotoBlurData(blurData);
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

    const stateChanged = state !== item.state;

    // Build the diff against the initial item (partial PATCH contract):
    const payload: Record<string, unknown> = {};
    if (trimmedName !== item.name) payload.name = trimmedName;
    if (description.trim() !== (item.description ?? "")) {
      payload.description = description.trim() || null;
    }
    if (trimmedPrice !== item.price) payload.price = trimmedPrice;

    const initialSorted = [...initialCategoryIds].sort();
    const currentSorted = [...categoryIds].sort();
    const categoryIdsChanged =
      initialSorted.length !== currentSorted.length ||
      initialSorted.some((id, idx) => id !== currentSorted[idx]);
    if (categoryIdsChanged) {
      payload.categoryIds = categoryIds;
    }

    if (photoUrl !== item.photoUrl) payload.photoUrl = photoUrl;
    if (photoBlurData !== (item.photoBlurData ?? null)) {
      payload.photoBlurData = photoBlurData;
    }

    if (Object.keys(payload).length === 0 && !stateChanged) {
      setError("No changes to save.");
      return;
    }

    setLoading(true);

    try {
      // 1. The PATCH (if there are non-state changes):
      if (Object.keys(payload).length > 0) {
        const patchRes = await fetch(`/api/admin/menu/items/${item.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify(payload),
        });

        if (!patchRes.ok) {
          const data = (await patchRes.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          setError(
            data?.error?.message ?? `Update failed with status ${patchRes.status}`
          );
          setLoading(false);
          return;
        }
      }

      // 2. The state route (if the state changed):
      if (stateChanged) {
        const stateRes = await fetch(`/api/admin/menu/items/${item.id}/state`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({ state }),
        });

        if (!stateRes.ok) {
          const data = (await stateRes.json().catch(() => null)) as {
            error?: { message?: string };
          } | null;
          setError(
            data?.error?.message ??
              `State update failed with status ${stateRes.status}`
          );
          setLoading(false);
          return;
        }
      }

      // 3. Success: single navigation (no router.refresh())
      if (onClose) {
        onClose();
      } else {
        router.push("/admin/menu");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error ? (
        <div
          role="alert"
          className="rounded-md border border-status-cancelled-border bg-status-cancelled-bg p-3 text-sm text-status-cancelled"
        >
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-staff-text-primary">
          Item photo
        </label>
        <PhotoBox
          initialPhotoUrl={photoUrl}
          onUploaded={handlePhotoUploaded}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-item-name"
          className="text-sm font-medium text-staff-text-primary"
        >
          Name
        </label>
        <input
          id="edit-item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-staff-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-item-category"
          className="text-sm font-medium text-staff-text-primary"
        >
          Categories
        </label>
        <select
          id="edit-item-category"
          multiple
          size={Math.min(6, Math.max(3, categories.length))}
          value={categoryIds}
          onChange={(e) =>
            setCategoryIds(
              Array.from(e.target.selectedOptions, (o) => o.value)
            )
          }
          disabled={loading}
          className="p-2 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-staff-brand"
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
        <label
          htmlFor="edit-item-state"
          className="text-sm font-medium text-staff-text-primary"
        >
          State
        </label>
        <select
          id="edit-item-state"
          value={state}
          onChange={(e) => {
            const v = e.target.value;
            if (
              v === MenuItemState.AVAILABLE ||
              v === MenuItemState.UNAVAILABLE ||
              v === MenuItemState.HIDDEN
            ) {
              setState(v);
            }
          }}
          disabled={loading}
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-staff-brand"
        >
          <option value={MenuItemState.AVAILABLE}>Available</option>
          <option value={MenuItemState.UNAVAILABLE}>Unavailable</option>
          <option value={MenuItemState.HIDDEN}>Hidden</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-item-price"
          className="text-sm font-medium text-staff-text-primary"
        >
          Price ({currency})
        </label>
        <input
          id="edit-item-price"
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={loading}
          required
          placeholder="0.00"
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-staff-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-item-description"
          className="text-sm font-medium text-staff-text-primary"
        >
          Description
        </label>
        <textarea
          id="edit-item-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          placeholder="Optional item description..."
          className="px-3 py-2 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-staff-brand resize-y"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-staff-border-subtle sticky bottom-0 bg-staff-surface-raised pb-2 mt-2">
        <Link
          href="/admin/menu"
          className="h-9 px-4 rounded-md text-sm font-medium text-staff-text-secondary hover:bg-staff-surface-sunken inline-flex items-center justify-center"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="h-9 px-4 rounded-md text-sm font-medium bg-staff-brand text-white hover:bg-staff-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
