"use client";

import { useState, type JSX, type FormEvent } from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

  const handlePlaceTypeChange = (value: unknown): void => {
    if (typeof value === "string" && (value === "TABLE" || value === "ROOM" || value === "COUNTER")) {
      setPlaceType(value);
      setSelectedPlaceId("");
      setErrorMessage(null);
    }
  };

  const handlePlaceChange = (value: unknown): void => {
    if (typeof value === "string") {
      setSelectedPlaceId(value);
      setErrorMessage(null);
    }
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
              <Select
                value={placeType}
                onValueChange={handlePlaceTypeChange}
                disabled={loading}
              >
                <SelectTrigger id="place-type-select">
                  <SelectValue placeholder="Select place type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TABLE">TABLE</SelectItem>
                  <SelectItem value="ROOM">ROOM</SelectItem>
                  <SelectItem value="COUNTER">COUNTER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="place-select"
                className="text-[13px] font-medium leading-[18px] text-staff-text-primary"
              >
                Place
              </label>
              <Select
                value={selectedPlaceId}
                onValueChange={handlePlaceChange}
                disabled={loading || availablePlaces.length === 0}
              >
                <SelectTrigger id="place-select">
                  <SelectValue
                    placeholder={
                      availablePlaces.length === 0
                        ? `No ${placeType.toLowerCase()}s available`
                        : `Select a ${placeType.toLowerCase()}`
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availablePlaces.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
