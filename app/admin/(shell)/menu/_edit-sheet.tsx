"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
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
  readonly initialCategoryId: string;
  readonly categories: readonly MenuCategoryView[];
  readonly currency: string;
}

export function EditSheet({
  item,
  initialCategoryId,
  categories,
  currency,
}: EditSheetProps): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(true);

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
      <SheetContent side="right" world="staff">
        <SheetHeader>
          <SheetTitle>Edit menu item</SheetTitle>
          <SheetDescription>
            Update item details, price, category, and photo.
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <EditForm
            item={item}
            initialCategoryId={initialCategoryId}
            categories={categories}
            currency={currency}
            onClose={() => {
              setOpen(false);
              router.push("/admin/menu");
            }}
          />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
