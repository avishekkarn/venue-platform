"use client";

import { useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import { GenerateDialog } from "./_generate-dialog";
import type { PlacesByType } from "./_types";

export function GenerateButton({
  placesByType,
}: {
  placesByType: PlacesByType;
}): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        Generate QR
      </Button>
      <GenerateDialog
        open={open}
        onOpenChange={setOpen}
        placesByType={placesByType}
      />
    </>
  );
}
