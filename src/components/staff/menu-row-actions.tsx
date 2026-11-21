"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCsrfToken } from "@/lib/csrf-client";
import type { MenuItemView } from "@/domain/menu/menu.repository";
import { MenuItemState } from "@/domain/menu/menu.repository";

export function MenuRowActions({ item, editHref }: { item: MenuItemView; editHref?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
