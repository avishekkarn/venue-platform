"use client";

import { useState, type JSX, type FormEvent, type ChangeEvent } from "react";
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
import type { PlacesByType } from "./_types";

type PlaceTypeKey = "TABLE" | "ROOM" | "COUNTER";

interface GenerateDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly placesByType: PlacesByType;
}

export function GenerateDialog({
  open,
  onOpenChange,
  placesByType,
}: GenerateDialogProps): JSX.Element {
  const router = useRouter();
  const [placeType, setPlaceType] = useState<PlaceTypeKey>("TABLE");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availablePlaces = placesByType[placeType] ?? [];

  const handlePlaceTypeChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value;
    if (value === "TABLE" || value === "ROOM" || value === "COUNTER") {
      setPlaceType(value);
      setSelectedPlaceId("");
      setErrorMessage(null);
    }
  };

  const handlePlaceChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    setSelectedPlaceId(e.target.value);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const payload: Record<string, string> = { placeType };
      if (placeType === "TABLE") {
        if (selectedPlaceId) payload["tableId"] = selectedPlaceId;
      } else if (placeType === "ROOM") {
        if (selectedPlaceId) payload["roomId"] = selectedPlaceId;
      } else if (placeType === "COUNTER") {
        if (selectedPlaceId) payload["counterId"] = selectedPlaceId;
      }

      const response = await fetch("/api/admin/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
          setErrorMessage("Failed to generate QR token");
        }
        setLoading(false);
        return;
      }

      // Success
      setLoading(false);
      onOpenChange(false);
      setSelectedPlaceId("");
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
      <DialogContent world="staff" size="md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Generate QR code</DialogTitle>
            <DialogDescription>
              Create a new active token for a place. The old token, if any, is not revoked automatically.
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="place-type-select"
                className="text-[13px] font-medium leading-[18px] text-staff-text-primary"
              >
                Place type
              </label>
              <select
                id="place-type-select"
                value={placeType}
                onChange={handlePlaceTypeChange}
                disabled={loading}
                className="h-10 w-full rounded-md border border-staff-border-subtle bg-staff-surface-raised px-3 text-[14px] text-staff-text-primary outline-none transition-none focus:border-ring focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-staff-surface-sunken disabled:text-staff-text-muted"
              >
                <option value="TABLE">TABLE</option>
                <option value="ROOM">ROOM</option>
                <option value="COUNTER">COUNTER</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="place-select"
                className="text-[13px] font-medium leading-[18px] text-staff-text-primary"
              >
                Place
              </label>
              <select
                id="place-select"
                value={selectedPlaceId}
                onChange={handlePlaceChange}
                disabled={loading || availablePlaces.length === 0}
                className="h-10 w-full rounded-md border border-staff-border-subtle bg-staff-surface-raised px-3 text-[14px] text-staff-text-primary outline-none transition-none focus:border-ring focus:ring-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-staff-surface-sunken disabled:text-staff-text-muted"
              >
                <option value="" disabled>
                  {availablePlaces.length === 0
                    ? `No ${placeType.toLowerCase()}s available`
                    : `Select a ${placeType.toLowerCase()}`}
                </option>
                {availablePlaces.map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.label}
                  </option>
                ))}
              </select>
            </div>

            {errorMessage ? (
              <p className="text-[13px] leading-[18px] text-status-cancelled">
                {errorMessage}
              </p>
            ) : null}
          </DialogBody>

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
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-current" />
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:200ms]" />
                  <span className="inline-block size-1.5 animate-pulse rounded-full bg-current [animation-delay:400ms]" />
                </span>
              ) : (
                "Generate"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
