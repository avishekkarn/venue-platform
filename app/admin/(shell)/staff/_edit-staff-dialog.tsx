"use client";

import { useState, useEffect, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getCsrfToken } from "@/lib/csrf-client";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { ROLE_METAS } from "./_role-meta";
import type { AdminStaffItem } from "./_types";

interface EditStaffDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly staff: AdminStaffItem | null;
  readonly onStaffUpdated: () => void;
}

export function EditStaffDialog({
  open,
  onOpenChange,
  staff,
  onStaffUpdated,
}: EditStaffDialogProps): JSX.Element {
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<StaffRole[]>([]);
  const [state, setState] = useState<StaffState>(StaffState.ACTIVE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setSelectedRoles([...staff.roles]);
      setState(staff.state);
      setError(null);
    }
  }, [staff]);

  if (!staff) return <></>;

  const handleRoleToggle = (role: StaffRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length === 1) return; // Keep at least one role
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (selectedRoles.length === 0) {
      setError("At least one role must be selected.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
        body: JSON.stringify({
          name: name.trim(),
          roles: selectedRoles,
          state,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || "Failed to update staff member.");
        setSubmitting(false);
        return;
      }

      onOpenChange(false);
      onStaffUpdated();
    } catch {
      setError("Network error while updating staff account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-staff-surface-raised border border-staff-border-subtle p-6 rounded-2xl shadow-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            <DialogTitle className="text-base font-bold text-staff-text-primary">
              Edit Staff Member — @{staff.username}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-staff-text-muted mt-1">
            Update account name, role assignments, or active/deactivated state.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 my-2">
          {error && (
            <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-staff-text-primary">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-staff-border-subtle bg-white focus:outline-hidden focus:ring-1 focus:ring-staff-brand text-staff-text-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-staff-text-primary">
              Account Status
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="staffState"
                  value={StaffState.ACTIVE}
                  checked={state === StaffState.ACTIVE}
                  onChange={() => setState(StaffState.ACTIVE)}
                  className="text-staff-brand focus:ring-staff-brand"
                />
                <span className="text-emerald-700 font-semibold">Active</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="staffState"
                  value={StaffState.DEACTIVATED}
                  checked={state === StaffState.DEACTIVATED}
                  onChange={() => setState(StaffState.DEACTIVATED)}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-red-700 font-semibold">Deactivated</span>
              </label>
            </div>
            {state === StaffState.DEACTIVATED && (
              <p className="text-[11px] text-red-600 bg-red-50 p-2 rounded border border-red-200 mt-1">
                ⚠️ Deactivating immediately revokes all active login sessions and denies access. Historical orders and audit logs remain intact.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-staff-border-subtle">
            <label className="text-xs font-semibold text-staff-text-primary">
              Assigned Roles
            </label>
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
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
