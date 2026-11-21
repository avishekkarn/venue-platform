"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { getCsrfToken } from "@/lib/csrf-client";
import { useToast } from "@/components/ui/toast";

interface EndRoomSessionButtonProps {
  readonly roomId: string;
  readonly roomNumber: string;
}

export function EndRoomSessionButton({
  roomId,
  roomNumber,
}: EndRoomSessionButtonProps): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { fire } = useToast();

  const handleCheckout = async () => {
    const ok = window.confirm(
      `Force checkout active session for Room ${roomNumber}? This will complete active orders, cancel pending service requests, and reset room state.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/rooms/${roomId}/end-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to checkout room");
      }

      fire({
        variant: "success",
        message: `Room ${roomNumber} has been successfully checked out.`,
      });
      router.refresh();
    } catch (err: unknown) {
      fire({
        variant: "error",
        message: err instanceof Error ? err.message : "Failed to checkout room",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className="px-2.5 py-1 text-xs font-medium rounded-md border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
    >
      {loading ? "Checking out..." : "Checkout Room"}
    </button>
  );
}
