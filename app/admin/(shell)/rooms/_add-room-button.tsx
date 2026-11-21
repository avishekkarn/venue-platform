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
        className="px-4 py-2 text-xs font-medium rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover transition-colors shadow-2xs"
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
