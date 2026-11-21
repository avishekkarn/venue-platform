"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { getCsrfToken } from "@/lib/csrf-client";
import { useToast } from "@/components/ui/toast";

interface EndTableSessionButtonProps {
  readonly tableId: string;
  readonly tableNumber: string;
}

export function EndTableSessionButton({
  tableId,
  tableNumber,
}: EndTableSessionButtonProps): JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { fire } = useToast();

  const handleEndSession = async () => {
    const ok = window.confirm(
      `Force end active session for Table ${tableNumber}? This will finalize active orders and free the table.`
    );
    if (!ok) return;

    setLoading(true);
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/tables/${tableId}/end-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error?.message || "Failed to end table session");
      }

      fire({
        variant: "success",
        message: `Session for Table ${tableNumber} has been ended.`,
      });
      router.refresh();
    } catch (err: unknown) {
      fire({
        variant: "error",
        message: err instanceof Error ? err.message : "Failed to end table session",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEndSession}
      disabled={loading}
      className="px-2.5 py-1 text-xs font-medium rounded-md border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors disabled:opacity-50"
    >
      {loading ? "Ending..." : "End Session"}
    </button>
  );
}
