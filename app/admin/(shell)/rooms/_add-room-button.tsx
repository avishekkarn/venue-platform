"use client";

import { useState, type JSX } from "react";
import { AddRoomSheet } from "./_add-room-sheet";

interface AddRoomButtonProps {
  readonly categories: readonly { id: string; name: string; basePrice: string }[];
  readonly currency: string;
}

export function AddRoomButton({
  categories,
  currency,
}: AddRoomButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs font-medium rounded-lg bg-[#344b3c] text-white hover:bg-[#243329] transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
        style={{ backgroundColor: "#344b3c", color: "#ffffff" }}
      >
        + Add Room
      </button>

      <AddRoomSheet
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        currency={currency}
      />
    </>
  );
}
