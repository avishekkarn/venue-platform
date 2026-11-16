"use client";

import { useState, type JSX, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCsrfToken } from "@/lib/csrf-client";
import { PhotoBox } from "./_photo-box";
import type { MenuItemView } from "@/domain/menu/menu.repository";

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
  readonly initialCategoryId: string;
  readonly categories: readonly { id: string; name: string }[];
  readonly currency?: string;
  readonly onClose?: () => void;
}

export function EditForm({
  item,
  initialCategoryId,
  categories,
  currency = "NPR",
  onClose,
}: EditFormProps): JSX.Element {
  const router = useRouter();

  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(item.price);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
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

    // Build the diff against the initial item (partial PATCH contract):
    const payload: Record<string, unknown> = {};
    if (trimmedName !== item.name) payload.name = trimmedName;
    if (description.trim() !== (item.description ?? "")) {
      payload.description = description.trim() || null;
    }
    if (trimmedPrice !== item.price) payload.price = trimmedPrice;
    if (categoryId !== initialCategoryId) payload.categoryId = categoryId;
    if (photoUrl !== item.photoUrl) payload.photoUrl = photoUrl;
    if (photoBlurData !== (item.photoBlurData ?? null)) {
      payload.photoBlurData = photoBlurData;
    }

    if (Object.keys(payload).length === 0) {
      setError("No changes to save.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        setError(data?.error?.message ?? `Update failed with status ${res.status}`);
        setLoading(false);
        return;
      }

      // Success: single navigation (no router.refresh())
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
          Category
        </label>
        <select
          id="edit-item-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={loading}
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-staff-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-staff-brand"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
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

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-staff-border-subtle">
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
