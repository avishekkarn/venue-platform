"use client";

import { useState, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCsrfToken } from "@/lib/csrf-client";
import type { AdminStaffItem } from "./_types";

interface ResetPasswordDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly staff: AdminStaffItem | null;
  readonly onPasswordReset: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  staff,
  onPasswordReset,
}: ResetPasswordDialogProps): JSX.Element {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!staff) return <></>;

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleReset = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Failed to reset password.");
        setSubmitting(false);
        return;
      }

      setPassword("");
      onOpenChange(false);
      onPasswordReset();
    } catch {
      setError("Network error while resetting password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) setPassword(""); }}>
      <DialogContent className="max-w-md bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <DialogTitle className="text-base font-bold text-staff-text-primary">
              Reset Password — {staff.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-staff-text-muted mt-1">
            Set a new password for account <span className="font-mono text-staff-text-primary">@{staff.username}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReset} className="flex flex-col gap-4 my-2">
          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 text-xs flex flex-col gap-1">
            <span className="font-bold text-amber-900 inline-flex items-center gap-1">
              <span>⚠️</span> Session Invalidation Notice
            </span>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Resetting the password will immediately terminate all active sessions for this staff member across all mobile devices and browsers.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-staff-text-primary">
                New Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-[11px] font-semibold text-staff-brand hover:underline cursor-pointer"
              >
                ⚡ Generate Random
              </button>
            </div>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="px-3 py-2 text-xs font-mono rounded-lg border border-staff-border-subtle bg-white focus:outline-hidden focus:ring-1 focus:ring-staff-brand text-staff-text-primary"
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-staff-border-subtle">
            <button
              type="button"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-raised text-staff-text-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Resetting..." : "Reset Password & Revoke Sessions"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
