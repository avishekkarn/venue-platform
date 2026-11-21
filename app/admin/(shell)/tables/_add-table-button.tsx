"use client";

import { useState, type JSX } from "react";
import { AddTableSheet } from "./_add-table-sheet";

interface AddTableButtonProps {
  readonly categories: readonly { id: string; name: string; isReserved: boolean }[];
}

export function AddTableButton({ categories }: AddTableButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-xs font-medium rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover transition-colors shadow-2xs"
      >
        + Add Table
      </button>

      <AddTableSheet
        open={open}
        onOpenChange={setOpen}
        categories={categories}
      />
    </>
  );
}
