"use client";

import { useState, type JSX } from "react";
import { AddItemSheet } from "./_add-item-sheet";

interface AddItemButtonProps {
  readonly categories: readonly { id: string; name: string }[];
  readonly currency: string;
}

export function AddItemButton({ categories, currency }: AddItemButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 px-4 rounded-md text-sm font-medium bg-[#344b3c] text-white hover:bg-[#243329] shadow-sm transition-colors inline-flex items-center justify-center cursor-pointer"
        style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
      >
        Add item
      </button>
      <AddItemSheet
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        currency={currency}
      />
    </>
  );
}
