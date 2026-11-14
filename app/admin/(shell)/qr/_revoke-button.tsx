"use client";

import { useState, type JSX } from "react";
import { Button } from "@/components/ui/button";
import { RevokeDialog } from "./_revoke-dialog";

interface RevokeButtonProps {
  readonly tokenId: string;
  readonly disabled?: boolean;
}

export function RevokeButton({
  tokenId,
  disabled = false,
}: RevokeButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Revoke
      </Button>
      {!disabled ? (
        <RevokeDialog
          tokenId={tokenId}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
    </>
  );
}
