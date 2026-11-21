"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
} from "@/components/ui/sheet";
import { EditServiceForm } from "./_edit-service-form";
import type { ServiceItemView } from "@/domain/services/service.repository";

interface EditServiceSheetProps {
  readonly item: ServiceItemView;
  readonly categoryId: string;
  readonly categories: readonly { id: string; name: string }[];
  readonly currency: string;
}

export function EditServiceSheet({
  item,
  categoryId,
  categories,
  currency,
}: EditServiceSheetProps): JSX.Element {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setOpen(false);
          router.push("/admin/services");
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
          <SheetTitle>Edit service</SheetTitle>
          <SheetDescription>
            Update service details, price, category, and photo.
          </SheetDescription>
        </SheetHeader>
        <SheetBody className="flex-1 overflow-y-auto min-h-0">
          <EditServiceForm
            item={item}
            categoryId={categoryId}
            categories={categories}
            currency={currency}
            onClose={() => {
              setOpen(false);
              router.push("/admin/services");
              router.refresh();
            }}
            setParentLoading={setLoading}
          />
        </SheetBody>
        <div className="shrink-0 p-4 pb-6 border-t border-staff-border-subtle bg-staff-surface-raised flex items-center justify-end gap-3">
          <Link
            href="/admin/services"
            className="h-9 px-4 rounded-md text-sm font-medium text-staff-text-secondary hover:bg-staff-surface-sunken inline-flex items-center justify-center transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form="edit-service-form"
            disabled={loading}
            className="h-9 px-4 rounded-md text-sm font-medium bg-[#344b3c] text-white hover:bg-[#243329] transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
          >
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
