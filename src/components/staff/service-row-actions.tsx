"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCsrfToken } from "@/lib/csrf-client";
import { MenuItemState } from "@/domain/menu/menu.repository";
import type { ServiceItemView } from "@/domain/services/service.repository";

export function ServiceRowActions({ item }: { item: ServiceItemView }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const setState = async (state: MenuItemState) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/items/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ state }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error?.message ?? "Failed to update state");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const toggleState = () => {
    const next =
      item.state === MenuItemState.AVAILABLE
        ? MenuItemState.UNAVAILABLE
        : MenuItemState.AVAILABLE;
    setState(next);
  };

  const btnClass =
    "h-8 px-2 rounded text-xs font-medium inline-flex items-center justify-center bg-staff-surface-raised hover:bg-staff-surface-sunken text-staff-text-primary border border-staff-border-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  return (
    <div className="inline-flex gap-2">
      <Link href={`/admin/services?id=${item.id}`} className={btnClass}>
        Edit
      </Link>
      <button
        type="button"
        onClick={toggleState}
        disabled={loading}
        className={btnClass}
      >
        {item.state === MenuItemState.AVAILABLE
          ? "Mark Unavailable"
          : "Mark Available"}
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
