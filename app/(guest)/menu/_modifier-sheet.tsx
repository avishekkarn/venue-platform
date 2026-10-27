"use client";

import type { JSX } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

export function ModifierSheet(): JSX.Element {
  return (
    <>
      <Sheet open={false}>
        <div style={{ display: "none" }} />
      </Sheet>
      <div
        id="modifier-sheet"
        style={{ display: "none" }}
        className="fixed inset-0 z-50 flex items-end justify-center"
      >
        <div
          data-sheet-overlay
          className="fixed inset-0 z-40 bg-neutral-900/40"
        />
        <div className="relative z-50 w-full max-w-2xl max-h-[90vh] rounded-t-2xl bg-guest-surface-raised text-guest-text-primary shadow-xl p-6 flex flex-col outline-none">
          <button
            id="modifier-sheet-close"
            type="button"
            className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-md text-guest-text-muted hover:bg-guest-surface-sunken focus-visible:outline-none"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <div className="flex justify-between items-start gap-4 pr-6">
            <div>
              <h2
                id="modifier-sheet-title"
                className="text-[22px] font-display text-guest-text-primary"
              >
                Item Name
              </h2>
              <p
                id="modifier-sheet-desc"
                className="text-[14px] text-guest-text-secondary mt-1"
              >
                Item Description
              </p>
            </div>
            <span
              id="modifier-sheet-price"
              className="text-[18px] font-semibold text-guest-text-primary shrink-0"
            >
              $0.00
            </span>
          </div>
          <div
            id="modifier-groups-container"
            className="mt-4 flex flex-col gap-4 overflow-y-auto max-h-[50vh]"
          />
          <div className="mt-6">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
