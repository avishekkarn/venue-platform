"use client";

import { useState, useEffect, type JSX, type FormEvent } from "react";
import { getCsrfToken } from "@/lib/csrf-client";
import { PhotoBox } from "../menu/_photo-box";
import { MenuItemState } from "@/domain/menu/menu.repository";
import type { ServiceItemView } from "@/domain/services/service.repository";

interface EditServiceFormProps {
  readonly item: ServiceItemView;
  readonly categoryId: string;
  readonly categories: readonly { id: string; name: string }[];
  readonly currency?: string;
  readonly onClose?: () => void;
  readonly setParentLoading?: (loading: boolean) => void;
}

export function EditServiceForm({
  item,
  categoryId: initialCategoryId,
  categories,
  currency = "NPR",
  onClose,
  setParentLoading,
}: EditServiceFormProps): JSX.Element {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description ?? "");
  const [price, setPrice] = useState(item.price);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    item.estimatedMinutes !== null ? String(item.estimatedMinutes) : ""
  );
  const [state, setState] = useState<MenuItemState>(item.state);
  const [photoUrl, setPhotoUrl] = useState<string | null>(item.photoUrl);
  const [photoBlurData, setPhotoBlurData] = useState<string | null>(
    item.photoBlurData ?? null
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(item.name);
    setDescription(item.description ?? "");
    setPrice(item.price);
    setCategoryId(initialCategoryId);
    setEstimatedMinutes(
      item.estimatedMinutes !== null ? String(item.estimatedMinutes) : ""
    );
    setState(item.state);
    setPhotoUrl(item.photoUrl);
    setPhotoBlurData(item.photoBlurData ?? null);
    setError(null);
  }, [item, initialCategoryId]);

  const updateLoading = (val: boolean): void => {
    setLoading(val);
    setParentLoading?.(val);
  };

  const handlePhotoUploaded = (url: string, blurData: string): void => {
    setPhotoUrl(url);
    setPhotoBlurData(blurData);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Service name is required.");
      return;
    }

    const trimmedPrice = price.trim();
    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      setError("Price must be a valid decimal amount (e.g. 15.00 or 0.00).");
      return;
    }

    if (!categoryId) {
      setError("Select a category.");
      return;
    }

    let parsedEstimatedMinutes: number | null = null;
    if (estimatedMinutes.trim() !== "") {
      const num = Number(estimatedMinutes.trim());
      if (!Number.isInteger(num) || num < 0) {
        setError("Estimated minutes must be a non-negative whole number.");
        return;
      }
      parsedEstimatedMinutes = num;
    }

    // Build diff against initial item:
    const payload: Record<string, unknown> = {};
    if (trimmedName !== item.name) payload.name = trimmedName;
    if (description.trim() !== (item.description ?? "")) {
      payload.description = description.trim() || null;
    }
    if (trimmedPrice !== item.price) payload.price = trimmedPrice;
    if (categoryId !== initialCategoryId) payload.categoryId = categoryId;
    if (parsedEstimatedMinutes !== item.estimatedMinutes) {
      payload.estimatedMinutes = parsedEstimatedMinutes;
    }
    if (state !== item.state) payload.state = state;
    if (photoUrl !== item.photoUrl) payload.photoUrl = photoUrl;
    if (photoBlurData !== (item.photoBlurData ?? null)) {
      payload.photoBlurData = photoBlurData;
    }

    if (Object.keys(payload).length === 0) {
      setError("No changes to save.");
      return;
    }

    updateLoading(true);

    try {
      const patchRes = await fetch(`/api/admin/services/items/${item.id}`, {
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
        setError(data?.error?.message ?? `Update failed with status ${patchRes.status}`);
        updateLoading(false);
        return;
      }

      updateLoading(false);
      onClose?.();
    } catch {
      setError("Network error occurred");
      updateLoading(false);
    }
  };

  return (
    <form id="edit-service-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
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
          Service photo
        </label>
        <PhotoBox
          initialPhotoUrl={photoUrl}
          onUploaded={handlePhotoUploaded}
          disabled={loading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-name" className="text-sm font-medium text-staff-text-primary">
          Name
        </label>
        <input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          required
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-price" className="text-sm font-medium text-staff-text-primary">
          Price ({currency})
        </label>
        <input
          id="edit-price"
          type="text"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          disabled={loading}
          required
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm font-mono text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-cat" className="text-sm font-medium text-staff-text-primary">
          Category
        </label>
        <select
          id="edit-cat"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={loading}
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-est" className="text-sm font-medium text-staff-text-primary">
          Estimated minutes
        </label>
        <input
          id="edit-est"
          type="number"
          min={0}
          value={estimatedMinutes}
          onChange={(e) => setEstimatedMinutes(e.target.value)}
          disabled={loading}
          placeholder="e.g. 45 (optional)"
          className="h-10 px-3 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm font-mono text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-state" className="text-sm font-medium text-staff-text-primary">
          State
        </label>
        <select
          id="edit-state"
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
        <label htmlFor="edit-desc" className="text-sm font-medium text-staff-text-primary">
          Description
        </label>
        <textarea
          id="edit-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
          placeholder="Optional description..."
          className="px-3 py-2 rounded-md border border-staff-border-subtle bg-staff-surface-raised text-sm text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand resize-y"
        />
      </div>
    </form>
  );
}
