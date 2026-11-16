"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import {
  CollectionsSheet,
  type CollectionItem,
  type MenuItemRef,
} from "./_collections-sheet";
import { Toaster } from "@/components/ui/toast";

interface CollectionsSheetTriggerProps {
  readonly collections: readonly CollectionItem[];
  readonly allMenuItems: readonly MenuItemRef[];
}

export function CollectionsSheetTrigger({
  collections,
  allMenuItems,
}: CollectionsSheetTriggerProps): JSX.Element {
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
          Manage collections
        </button>
        {open ? (
          <CollectionsSheet
            open={open}
            onOpenChange={setOpen}
            initialCollections={collections}
            allMenuItems={allMenuItems}
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
