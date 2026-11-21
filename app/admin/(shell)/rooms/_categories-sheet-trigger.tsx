"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { RoomCategoriesSheet, type RoomCategoryItem } from "./_categories-sheet";

interface RoomCategoriesSheetTriggerProps {
  readonly categories: readonly RoomCategoryItem[];
  readonly currency: string;
}

export function RoomCategoriesSheetTrigger({
  categories,
  currency,
}: RoomCategoriesSheetTriggerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-xs font-medium border border-staff-border-subtle rounded-lg text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised transition-colors"
      >
        Room Pricing & Categories
      </button>

      {open ? (
        <RoomCategoriesSheet
          open={open}
          onOpenChange={setOpen}
          initialCategories={categories}
          currency={currency}
          onClose={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
