"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCsrfToken } from "@/lib/csrf-client";
import type { MenuItemView } from "@/domain/menu/menu.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";

export function MenuRowActions({
  item,
  editHref,
  categoryId,
  canMoveUp,
}: {
  item: MenuItemView;
  editHref?: string;
  categoryId?: string;
  canMoveUp?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleMoveUp = async () => {
    if (!categoryId || !canMoveUp || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ categoryId, direction: "up" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error?.message ?? "Failed to move item up");
      }
    } catch {
      alert("Network error moving item up");
    } finally {
      setLoading(false);
    }
  };

  const setState = async (newState: MenuItemState) => {
    setLoading(true);
    try {
      const token = getCsrfToken();
      console.log(`[MenuRowActions] Updating item ${item.id} state to ${newState}`);
      const res = await fetch(`/api/admin/menu/items/${item.id}/state`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ state: newState }),
      });
      if (res.ok) {
        console.log(`[MenuRowActions] State updated successfully to ${newState}`);
        router.refresh(); // Re-render the Server Component list
      } else {
        const data = await res.json().catch(() => null);
        console.error(`[MenuRowActions] State update failed:`, res.status, data);
        alert(data?.error?.message ?? `Failed to update state: ${res.status}`);
      }
    } catch (err) {
      console.error(`[MenuRowActions] Network error:`, err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const toggleState = () => {
    // Toggle between AVAILABLE and UNAVAILABLE. If currently HIDDEN, set to AVAILABLE.
    const nextState =
      item.state === MenuItemState.AVAILABLE
        ? MenuItemState.UNAVAILABLE
        : MenuItemState.AVAILABLE;
    setState(nextState);
  };

  const btnClass =
    "h-8 px-2 rounded text-xs font-medium inline-flex items-center justify-center bg-staff-surface-raised hover:bg-staff-surface-sunken text-staff-text-primary border border-staff-border-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="inline-flex gap-2">
      {categoryId ? (
        <button
          type="button"
          onClick={handleMoveUp}
          disabled={loading || !canMoveUp}
          aria-label={`Move ${item.name} up`}
          title={canMoveUp ? "Move item up in category" : "Already at top of category"}
          className="h-8 w-8 rounded text-xs font-bold inline-flex items-center justify-center bg-staff-surface-raised hover:bg-staff-surface-sunken text-staff-text-primary border border-staff-border-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ▲
        </button>
      ) : null}
      {editHref ? (
        <Link href={editHref} className={btnClass}>
          Edit
        </Link>
      ) : null}
      <button type="button" onClick={toggleState} disabled={loading} className={btnClass}>
        {item.state === MenuItemState.AVAILABLE ? "Mark Unavailable" : "Mark Available"}
      </button>
      <button
        type="button"
        onClick={() => setState(MenuItemState.HIDDEN)}
        disabled={loading || item.state === MenuItemState.HIDDEN}
        className={btnClass}
      >
        Hide
      </button>
    </div>
  );
}
