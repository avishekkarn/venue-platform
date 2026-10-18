"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RevokeDialogProps {
  readonly tokenId: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function RevokeDialog({
  tokenId,
  open,
  onOpenChange,
}: RevokeDialogProps): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRevoke = async (): Promise<void> => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/qr/${tokenId}/revoke`, {
        method: "POST",
      });

      const json: unknown = await response.json();

      if (!response.ok) {
        if (
          json &&
          typeof json === "object" &&
          "error" in json &&
          json.error &&
          typeof json.error === "object" &&
          "message" in json.error &&
          typeof (json.error as { message: unknown }).message === "string"
        ) {
          setErrorMessage((json.error as { message: string }).message);
        } else {
          setErrorMessage("Failed to revoke QR token");
        }
        setLoading(false);
        return;
      }

      setLoading(false);
      onOpenChange(false);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    if (!loading) {
      onOpenChange(false);
      setErrorMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent world="staff" size="sm">
        <DialogHeader>
          <DialogTitle>Revoke QR code</DialogTitle>
          <DialogDescription>
            This QR code will stop working. Guests who scan it will see that it is no longer active.
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <DialogBody>
            <p className="text-[13px] leading-[18px] text-status-cancelled">
              {errorMessage}
            </p>
          </DialogBody>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleRevoke}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-current" />
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:200ms]" />
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:400ms]" />
              </span>
            ) : (
              "Revoke"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
