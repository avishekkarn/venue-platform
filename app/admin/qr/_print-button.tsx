"use client";

import type { JSX } from "react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  readonly tokenId: string;
}

export function PrintButton({ tokenId }: PrintButtonProps): JSX.Element {
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => window.open(`/admin/qr/print/${tokenId}?print=true`, "_blank")}
    >
      Print
    </Button>
  );
}
