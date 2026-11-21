"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCsrfToken } from "@/lib/csrf-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { EditForm } from "./_edit-form";
import type {
  MenuItemView,
  MenuCategoryView,
} from "@/domain/menu/menu.repository";

/**
 * EditSheet (8.3.3, DESIGN.md §4.10.8).
 *
 * Client Component boundary wrapping the controlled Sheet and EditForm.
 * Controls sheet open state and dismiss behavior: clicking the backdrop or
 * the close (X) button triggers onOpenChange(false) which sets open to false
 * and clears ?id= via router.push("/admin/menu").
 *
 * Reference: ROADMAP.md §12 (8.3.3), DESIGN.md §4.10.8.
 */
interface EditSheetProps {
  readonly item: MenuItemView;
  readonly initialCategoryIds: readonly string[];
  readonly categories: readonly MenuCategoryView[];
  readonly currency: string;
}

export function EditSheet({
  item,
  initialCategoryIds,
  categories,
  currency,
}: EditSheetProps): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm("Delete this item permanently?")) return;
    setLoading(true);
    try {
      let res = await fetch(`/api/admin/menu/items/${item.id}`, {
        method: "DELETE",
        headers: { "X-CSRF-Token": getCsrfToken() },
      });
      if (res.status === 405) {
        res = await fetch(`/api/admin/menu/items/${item.id}/state`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": getCsrfToken(),
          },
          body: JSON.stringify({ state: "HIDDEN" }),
        });
      }
      if (res.ok) {
        setOpen(false);
        router.push("/admin/menu");
        router.refresh();
      } else {
        alert("Failed to delete");
        setLoading(false);
      }
    } catch {
      alert("Network error");
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setOpen(false);
          router.push("/admin/menu");
        } else {
          setOpen(true);
        }
      }}
    >
      <SheetContent
        side="right"
        world="staff"
        className="flex flex-col h-full w-full sm:max-w-[480px] overflow-hidden"
      >
        <SheetHeader className="shrink-0">
          <SheetTitle>Edit menu item</SheetTitle>
          <SheetDescription>
            Update item details, price, category, and photo.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="flex-1 overflow-y-auto min-h-0">
          <EditForm
            item={item}
            initialCategoryIds={initialCategoryIds}
            categories={categories}
            currency={currency}
            onClose={() => {
              setOpen(false);
              router.push("/admin/menu");
            }}
          />
        </SheetBody>
        <div className="shrink-0 p-4 pb-6 border-t border-staff-border-subtle bg-staff-surface-raised flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="h-9 px-3 rounded-md text-sm font-medium text-status-cancelled hover:bg-status-cancelled-bg disabled:opacity-50"
          >
            Delete item
          </button>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/menu"
              className="h-9 px-4 rounded-md text-sm font-medium text-staff-text-secondary hover:bg-staff-surface-sunken inline-flex items-center justify-center transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              form="edit-item-form"
              disabled={loading}
              className="h-9 px-4 rounded-md text-sm font-medium bg-[#344b3c] text-white hover:bg-[#243329] transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
