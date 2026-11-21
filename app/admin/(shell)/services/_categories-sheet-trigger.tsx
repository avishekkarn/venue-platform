"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { ServiceCategoriesSheet } from "./_categories-sheet";
import { Toaster } from "@/components/ui/toast";

interface ServiceCategoriesSheetTriggerProps {
  readonly categories: readonly {
    id: string;
    name: string;
    sortOrder: number;
  }[];
}

export function ServiceCategoriesSheetTrigger({
  categories,
}: ServiceCategoriesSheetTriggerProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Toaster position="bottom-center">
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="h-9 px-3 rounded-md text-sm font-medium border border-staff-border-subtle bg-staff-surface-raised hover:bg-staff-surface-sunken text-staff-text-primary"
        >
          Manage categories
        </button>
        {open ? (
          <ServiceCategoriesSheet
            open={open}
            onOpenChange={setOpen}
            initialCategories={categories}
            onClose={() => {
              setOpen(false);
              router.refresh();
            }}
          />
        ) : null}
      </div>
    </Toaster>
  );
}
