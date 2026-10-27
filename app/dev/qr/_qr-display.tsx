"use client";

import { useState } from "react";
import type { PlaceType } from "@/domain/qr/qr-token.repository";

export interface DevQrTokenItem {
  id: string;
  token: string;
  placeType: PlaceType;
  placeLabel: string;
}

interface QrDisplayProps {
  tokens: DevQrTokenItem[];
  origin: string;
  venueName?: string;
}

export function QrDisplay({ tokens, origin, venueName }: QrDisplayProps) {
  const [selectedTokenId, setSelectedTokenId] = useState<string>(
    tokens[0]?.id ?? ""
  );
  const [copied, setCopied] = useState<boolean>(false);

  const selectedToken =
    tokens.find((t) => t.id === selectedTokenId) ?? tokens[0];

  const cleanToken = selectedToken
    ? selectedToken.token.trim().replace(/\s+/g, "")
    : "";
  const cleanOrigin = origin.trim().replace(/\/+$/, "");

  const destinationUrl = cleanToken
    ? `${cleanOrigin}/qr/${cleanToken}`
    : "";

  if (!tokens || tokens.length === 0) {
    return (
      <div className="p-6 bg-staff-surface-raised border border-staff-border-subtle rounded-xl text-center">
        <p className="text-staff-text-muted text-[14px]">
          No active QR tokens found in the database.
        </p>
      </div>
    );
  }

  const handleCopy = async () => {
    if (!destinationUrl) return;
    try {
      await navigator.clipboard.writeText(destinationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is restricted
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 bg-staff-surface-raised border border-staff-border-subtle rounded-2xl shadow-sm">
      {/* Venue Context */}
      {venueName && (
        <div className="text-center">
          <span className="text-[12px] font-semibold tracking-wider text-staff-text-muted uppercase">
            {venueName}
          </span>
        </div>
      )}

      {/* Dropdown to switch between Table 1, Room 101, Counter, etc. */}
      <div className="w-full flex flex-col gap-2">
        <label
          htmlFor="qr-place-select"
          className="text-[14px] font-medium text-staff-text-secondary"
        >
          Select Table / Room / Counter
        </label>
        <select
          id="qr-place-select"
          value={selectedToken?.id ?? ""}
          onChange={(e) => setSelectedTokenId(e.target.value)}
          className="w-full px-3 py-2 text-[14px] bg-staff-surface border border-staff-border-subtle rounded-lg text-staff-text-primary focus:outline-none focus:ring-2 focus:ring-staff-brand cursor-pointer"
        >
          {tokens.map((token) => (
            <option key={token.id} value={token.id}>
              {token.placeLabel} ({token.placeType})
            </option>
          ))}
        </select>
      </div>

      {/* QR Code Image */}
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-staff-border-subtle shadow-inner">
        {destinationUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`/api/dev/qr?url=${encodeURIComponent(destinationUrl)}`}
            alt={`QR code for ${selectedToken?.placeLabel}`}
            width={300}
            height={300}
            className="w-[300px] h-[300px] object-contain rounded"
          />
        ) : null}
      </div>

      {/* Raw URL Display & Copy */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-staff-text-muted uppercase tracking-wider">
            Scannable LAN URL
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[12px] font-semibold text-staff-brand hover:underline cursor-pointer transition-colors"
          >
            {copied ? "✓ Copied" : "Copy URL"}
          </button>
        </div>
        <div className="w-full overflow-x-auto bg-staff-surface border border-staff-border-subtle rounded-lg p-2.5">
          <code className="text-[13px] text-staff-text-primary whitespace-nowrap select-all font-mono block">
            {destinationUrl}
          </code>
        </div>
      </div>
    </div>
  );
}
