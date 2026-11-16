"use client";

import { useRef, useState, type JSX, type ChangeEvent, type DragEvent } from "react";
import { getCsrfToken } from "@/lib/csrf-client";

/**
 * The photo box (8.3.2a, DESIGN.md §4.10.8).
 *
 * A drag-and-drop area + a file picker. On drop (or file select):
 *   1. build a FormData with the file under "file",
 *   2. POST /api/admin/media/upload with X-CSRF-Token: getCsrfToken(),
 *   3. on 200, preview the returned photoUrl and call onUploaded(photoUrl, photoBlurData),
 *   4. on 403/400/500, show the error (no upload).
 *
 * The box does NOT submit a form and does NOT router.refresh(). The
 * consumer (the 8.3.3 form) holds the photoUrl / photoBlurData and sends
 * them in its POST/PATCH body.
 *
 * The upload route (8.3.0) is withAudit + withCsrf; the CSRF header is
 * required (D-20.1). A missing token is a 403 (the box never sends a
 * missing token — getCsrfToken returns "" only if the cookie is absent,
 * and then the server rejects; the box surfaces the error).
 *
 * Reference: ROADMAP.md §12 (8.3.2a), DESIGN.md §4.10.8, D-20.1, D-22.1,
 * D-23.1.
 */
interface PhotoBoxProps {
  readonly initialPhotoUrl?: string | null;
  readonly onUploaded: (photoUrl: string, photoBlurData: string) => void;
  readonly disabled?: boolean;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function PhotoBox({
  initialPhotoUrl = null,
  onUploaded,
  disabled = false,
}: PhotoBoxProps): JSX.Element {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPhotoUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File): Promise<void> {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("The image must be 5MB or smaller.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        headers: { "X-CSRF-Token": getCsrfToken() },
        body: formData,
      });

      const json: unknown = await response.json();

      if (!response.ok) {
        let message = "Failed to upload the image.";
        if (
          json &&
          typeof json === "object" &&
          "error" in json &&
          json.error &&
          typeof json.error === "object" &&
          "message" in json.error &&
          typeof (json.error as { message: unknown }).message === "string"
        ) {
          message = (json.error as { message: string }).message;
        }
        setError(message);
        setLoading(false);
        return;
      }

      if (
        json &&
        typeof json === "object" &&
        "data" in json &&
        json.data &&
        typeof json.data === "object" &&
        "photoUrl" in json.data &&
        "photoBlurData" in json.data &&
        typeof (json.data as { photoUrl: unknown }).photoUrl === "string" &&
        typeof (json.data as { photoBlurData: unknown }).photoBlurData === "string"
      ) {
        const data = json.data as { photoUrl: string; photoBlurData: string };
        setPreviewUrl(data.photoUrl);
        onUploaded(data.photoUrl, data.photoBlurData);
      } else {
        setError("The upload returned an unexpected response.");
      }
      setLoading(false);
    } catch (err: unknown) {
      console.error(err);
      setError("An unexpected error occurred.");
      setLoading(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
    if (disabled || loading) return;
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (!disabled && !loading) setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (file) void upload(file);
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        aria-disabled={disabled || loading}
        onClick={() => {
          if (!disabled && !loading) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !loading) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-staff-brand bg-staff-surface-sunken"
            : "border-staff-border-subtle bg-staff-surface-raised hover:bg-staff-surface-sunken",
          disabled || loading ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Item photo preview"
            className="h-32 w-32 rounded-lg object-cover"
          />
        ) : (
          <p className="text-sm text-staff-text-secondary">
            Drag an image here, or click to choose a file.
          </p>
        )}
        <p className="text-xs text-staff-text-muted">
          {loading
            ? "Uploading…"
            : previewUrl
              ? "Drop a new image to replace."
              : "JPEG, PNG, or WebP, up to 5MB."}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={disabled || loading}
          onChange={handleFileChange}
        />
      </div>
      {error ? (
        <p className="text-[13px] leading-[18px] text-status-cancelled">{error}</p>
      ) : null}
    </div>
  );
}
