"use client";

import { useState, useMemo, useEffect, useCallback, type JSX } from "react";
import Link from "next/link";
import { StaffRole, StaffState } from "@/domain/auth/staff.repository";
import { ROLE_METAS } from "./_role-meta";
import type { AdminStaffItem, StaffPlacesData } from "./_types";
import { AddStaffDialog } from "./_add-staff-dialog";
import { EditStaffDialog } from "./_edit-staff-dialog";
import { ResetPasswordDialog } from "./_reset-password-dialog";
import { StaffActivityDrawer } from "./_staff-activity-drawer";

interface StaffManagementViewProps {
  readonly initialData: StaffPlacesData;
}

export function StaffManagementView({
  initialData,
}: StaffManagementViewProps): JSX.Element {
  const [data, setData] = useState<StaffPlacesData>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedOnline, setSelectedOnline] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  // Dialog & Drawer states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminStaffItem | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminStaffItem | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityTarget, setActivityTarget] = useState<AdminStaffItem | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const poll = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/staff", { credentials: "same-origin" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.data) {
        setData(json.data);
        setLastRefreshedAt(new Date());
      }
    } catch {
      // Network jitter retry handled silently
    } finally {
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && active) {
        poll(false);
      }
    }, 6000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [poll]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return data.staff.filter((s) => {
      if (selectedRole !== "ALL" && !s.roles.includes(selectedRole as StaffRole)) {
        return false;
      }
      if (selectedState !== "ALL" && s.state !== selectedState) {
        return false;
      }
      if (selectedOnline === "ONLINE" && !s.isOnline) {
        return false;
      }
      if (selectedOnline === "OFFLINE" && s.isOnline) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchUsername = s.username.toLowerCase().includes(q);
        if (!matchName && !matchUsername) return false;
      }
      return true;
    });
  }, [data.staff, selectedRole, selectedState, selectedOnline, searchQuery]);

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  const formatShiftStart = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) {
      return `Shift started: ${timeStr}`;
    }
    return `Shift started: ${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
  };

  const formatLastSeen = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (isToday) {
      return `Last seen today at ${timeStr}`;
    }
    return `Last seen: ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back to Dashboard Breadcrumb */}
      <div>
        <Link
          href="/admin"
          className="text-xs font-medium text-staff-text-muted hover:text-staff-text-primary transition-colors inline-flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-staff-text-primary">
              Staff Management Hub
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Live Presence Sync
            </span>
          </div>
          <p className="text-xs text-staff-text-secondary">
            Manage staff accounts, assign operational roles, monitor on-duty hours, and view shift activity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => poll(true)}
            disabled={isRefreshing}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-staff-border-subtle bg-white hover:bg-stone-50 text-staff-text-secondary transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            title="Refresh now"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
            {isRefreshing ? "Syncing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>+</span> Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] font-medium text-staff-text-muted uppercase tracking-wider">
            Total Staff
          </span>
          <span className="text-2xl font-bold font-mono text-staff-text-primary">
            {data.summary.totalStaff}
          </span>
          <span className="text-[11px] text-staff-text-muted">Registered in venue</span>
        </div>

        <div className="p-4 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            On Duty Now
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700">
            {data.summary.onlineStaff}
          </span>
          <span className="text-[11px] text-staff-text-muted">Active logged-in shifts</span>
        </div>

        <div className="p-4 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] font-medium text-staff-text-muted uppercase tracking-wider">
            Active Accounts
          </span>
          <span className="text-2xl font-bold font-mono text-staff-text-primary">
            {data.summary.activeStaff}
          </span>
          <span className="text-[11px] text-staff-text-muted">Ready for dispatch</span>
        </div>

        <div className="p-4 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-1 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
            Deactivated
          </span>
          <span className="text-2xl font-bold font-mono text-amber-700">
            {data.summary.deactivatedStaff}
          </span>
          <span className="text-[11px] text-staff-text-muted">Access revoked</span>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="p-4 rounded-xl border border-staff-border-subtle bg-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-2.5 text-xs text-staff-text-muted">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or @username..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-staff-border-subtle bg-stone-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-staff-brand text-staff-text-primary"
            />
          </div>

          <div className="flex items-center gap-1.5 border-l border-staff-border-subtle pl-3">
            <button
              type="button"
              onClick={() => setSelectedOnline("ALL")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedOnline === "ALL"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-staff-text-secondary hover:text-staff-text-primary"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedOnline("ONLINE")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 ${
                selectedOnline === "ONLINE"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              On Duty ({data.summary.onlineStaff})
            </button>
            <button
              type="button"
              onClick={() => setSelectedOnline("OFFLINE")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedOnline === "OFFLINE"
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-staff-text-secondary hover:text-staff-text-primary"
              }`}
            >
              Offline
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-staff-border-subtle bg-white text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand cursor-pointer"
          >
            <option value="ALL">All Roles ({data.staff.length})</option>
            {(Object.keys(ROLE_METAS) as StaffRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_METAS[r].label} ({data.summary.roleCounts[r] || 0})
              </option>
            ))}
          </select>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-staff-border-subtle bg-white text-staff-text-primary focus:outline-hidden focus:ring-1 focus:ring-staff-brand cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="border border-staff-border-subtle rounded-xl bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-staff-border-subtle bg-staff-surface/50 text-[11px] font-bold text-staff-text-muted uppercase tracking-wider">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Assigned Roles</th>
                <th className="py-3 px-4">Presence & Shift</th>
                <th className="py-3 px-4">Duty Hours (7d / All)</th>
                <th className="py-3 px-4">Contributions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-staff-border-subtle">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-staff-text-muted">
                    No staff members match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr
                    key={staff.id}
                    className="hover:bg-stone-50/80 transition-colors group"
                  >
                    {/* Staff Member Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-staff-text-primary truncate">
                            {staff.name}
                          </span>
                          <span className="text-[11px] font-mono text-staff-text-muted">
                            @{staff.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Assigned Roles */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {staff.roles.map((r) => {
                          const meta = ROLE_METAS[r];
                          return (
                            <span
                              key={r}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                meta ? meta.badgeCls : "bg-stone-100 text-stone-800 border-stone-200"
                              }`}
                            >
                              {meta ? meta.label : r}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Presence & Shift */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        {staff.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                            On Duty Now
                          </span>
                        ) : (
                          <span className="text-stone-500 font-medium">Offline</span>
                        )}
                        <span className="text-[10px] text-staff-text-muted" suppressHydrationWarning>
                          {staff.isOnline && staff.shiftStartedAt
                            ? formatShiftStart(staff.shiftStartedAt)
                            : staff.lastLoginAt
                            ? formatLastSeen(staff.lastLoginAt)
                            : "Never logged in"}
                        </span>
                      </div>
                    </td>

                    {/* Duty Hours */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex flex-col">
                        <span className="font-bold text-staff-text-primary">
                          {formatHours(staff.activeHoursWeekMinutes)}
                        </span>
                        <span className="text-[10px] text-staff-text-muted">
                          {staff.totalHistoricalHours}h lifetime
                        </span>
                      </div>
                    </td>

                    {/* Operational Contributions */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col text-[11px] gap-0.5">
                        <span className="text-stone-800">
                          🍽️ <span className="font-mono font-semibold">{staff.ordersHandledCount}</span> orders
                        </span>
                        <span className="text-stone-800">
                          🛎️ <span className="font-mono font-semibold">{staff.requestsResolvedCount}</span> requests
                        </span>
                      </div>
                    </td>

                    {/* Account Status */}
                    <td className="py-3 px-4">
                      {staff.state === StaffState.ACTIVE ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setActivityTarget(staff);
                            setActivityOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-staff-border-subtle bg-white hover:bg-stone-50 text-staff-text-primary transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          title="View shift sessions and activity"
                        >
                          <span>📊</span> Shifts
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditTarget(staff);
                            setEditOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-staff-border-subtle bg-white hover:bg-stone-50 text-staff-text-primary transition-colors cursor-pointer shadow-2xs"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setResetTarget(staff);
                            setResetOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-staff-border-subtle bg-white hover:bg-stone-50 text-staff-text-secondary hover:text-staff-brand transition-colors cursor-pointer shadow-2xs"
                          title="Reset password"
                        >
                          🔑 Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Dialog */}
      <AddStaffDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onStaffCreated={() => poll(true)}
      />

      {/* Edit Staff Dialog */}
      <EditStaffDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        staff={editTarget}
        onStaffUpdated={() => poll(true)}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        staff={resetTarget}
        onPasswordReset={() => poll(true)}
      />

      {/* Staff Activity & Shifts Drawer */}
      <StaffActivityDrawer
        open={activityOpen}
        onOpenChange={setActivityOpen}
        staff={activityTarget}
      />
    </div>
  );
}
