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
import { StaffRole } from "@/domain/auth/staff.repository";
import { ROLE_METAS } from "./_role-meta";

interface AddStaffDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onStaffCreated: () => void;
}

export function AddStaffDialog({
  open,
  onOpenChange,
  onStaffCreated,
}: AddStaffDialogProps): JSX.Element {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<StaffRole[]>([StaffRole.TABLE_SERVICE]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setUsername("");
    setPassword("");
    setSelectedRoles([StaffRole.TABLE_SERVICE]);
    setError(null);
  };

  const handleRoleToggle = (role: StaffRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // Keep at least one
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let generated = "";
    for (let i = 0; i < 12; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username.trim().toLowerCase())) {
      setError("Username must be 3-30 lowercase characters with numbers or underscores only.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (selectedRoles.length === 0) {
      setError("At least one role must be selected.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim().toLowerCase(),
          password,
          roles: selectedRoles,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Failed to create staff member.");
        setSubmitting(false);
        return;
      }

      resetForm();
      onOpenChange(false);
      onStaffCreated();
    } catch {
      setError("Network error while creating staff account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <DialogTitle className="text-base font-bold text-staff-text-primary">
              Add New Staff Member
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-staff-text-muted mt-1">
            Create an operational staff account, assign roles, and set login credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 my-2">
          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-staff-text-primary">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Suman Thapa"
                className="px-3 py-2 text-xs rounded-lg border border-staff-border-subtle bg-white focus:outline-hidden focus:ring-1 focus:ring-staff-brand text-staff-text-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-staff-text-primary">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="e.g. suman_thapa"
                className="px-3 py-2 text-xs font-mono rounded-lg border border-staff-border-subtle bg-white focus:outline-hidden focus:ring-1 focus:ring-staff-brand text-staff-text-primary"
              />
              <span className="text-[10px] text-staff-text-muted">Lowercase letters, numbers, and underscores</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-staff-text-primary">
                Initial Password <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-[11px] font-semibold text-staff-brand hover:underline cursor-pointer"
              >
                ⚡ Generate Random Password
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

          <div className="flex flex-col gap-2 pt-2 border-t border-staff-border-subtle">
            <label className="text-xs font-semibold text-staff-text-primary">
              Assigned Roles & Capabilities <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-staff-text-muted">
              Select one or multiple roles. The staff dashboard dynamically grants access based on this union.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {(Object.keys(ROLE_METAS) as StaffRole[]).map((r) => {
                const meta = ROLE_METAS[r];
                const isChecked = selectedRoles.includes(r);
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => handleRoleToggle(r)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isChecked
                        ? "border-staff-brand bg-staff-brand/5 shadow-2xs"
                        : "border-staff-border-subtle bg-white hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by button
                      className="mt-0.5 rounded text-staff-brand focus:ring-staff-brand cursor-pointer pointer-events-none"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-staff-text-primary">
                          {meta.label}
                        </span>
                        <span className="text-[9px] uppercase font-semibold text-staff-text-muted">
                          {meta.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-staff-text-secondary mt-0.5 line-clamp-2">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover shadow-2xs transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {submitting ? "Creating..." : "Create Staff Account"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
