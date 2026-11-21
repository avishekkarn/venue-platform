"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { TableCategoriesSheet, type TableCategoryItem } from "./_categories-sheet";

interface TableCategoriesSheetTriggerProps {
  readonly categories: readonly TableCategoryItem[];
}

export function TableCategoriesSheetTrigger({
  categories,
}: TableCategoriesSheetTriggerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-2 text-xs font-medium border border-staff-border-subtle rounded-lg text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised transition-colors"
      >
        Manage Categories
      </button>

      {open ? (
        <TableCategoriesSheet
          open={open}
          onOpenChange={setOpen}
          initialCategories={categories}
          onClose={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
