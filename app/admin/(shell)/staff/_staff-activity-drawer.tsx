"use client";

import { useState, useEffect, useCallback, type JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCsrfToken } from "@/lib/csrf-client";
import { ROLE_METAS } from "./_role-meta";
import type { AdminStaffItem, StaffActivityDetails } from "./_types";

interface StaffActivityDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly staff: AdminStaffItem | null;
  readonly onShiftEnded?: () => void;
}

export function StaffActivityDrawer({
  open,
  onOpenChange,
  staff,
  onShiftEnded,
}: StaffActivityDrawerProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<StaffActivityDetails | null>(null);
  const [activeTab, setActiveTab] = useState<"SHIFTS" | "ORDERS" | "REQUESTS">("SHIFTS");
  const [endingShift, setEndingShift] = useState(false);

  const fetchActivity = useCallback(() => {
    if (!staff) return;
    setLoading(true);
    fetch(`/api/admin/staff/${staff.id}/activity`, { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.activity) {
          setDetails(json.data.activity);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
      });
  }, [staff]);

  useEffect(() => {
    if (!open || !staff) {
      setDetails(null);
      return;
    }
    fetchActivity();
  }, [open, staff, fetchActivity]);

  const handleEndShift = async () => {
    if (!staff) return;
    if (!window.confirm(`Are you sure you want to end active shift for ${staff.name}? This will log out their session.`)) {
      return;
    }

    setEndingShift(true);
    try {
      const res = await fetch(`/api/admin/staff/${staff.id}/end-shift`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
      });
      if (res.ok) {
        fetchActivity();
        onShiftEnded?.();
      }
    } catch {
      // Handled silently
    } finally {
      setEndingShift(false);
    }
  };

  if (!staff) return <></>;

  const formatMins = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-hidden flex flex-col bg-staff-surface-raised border border-staff-border-subtle p-0 rounded-2xl shadow-2xl">
        {/* Drawer Header */}
        <DialogHeader className="p-6 pb-4 border-b border-staff-border-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <DialogTitle className="text-lg font-bold text-staff-text-primary">
                  {staff.name}
                </DialogTitle>
                {staff.isOnline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Online / On Duty
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                    Offline
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-staff-text-muted">
                @{staff.username} · Member since {new Date(staff.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
          </div>

          {/* Active Hours & KPI Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="p-3 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-0.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-staff-text-muted tracking-wider">
                Active Today
              </span>
              <span className="text-lg font-extrabold font-mono text-staff-text-primary">
                {formatMins(details?.activeHoursTodayMinutes ?? staff.activeHoursTodayMinutes)}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-0.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-staff-text-muted tracking-wider">
                This Week (7d)
              </span>
              <span className="text-lg font-extrabold font-mono text-staff-text-primary">
                {formatMins(details?.activeHoursWeekMinutes ?? staff.activeHoursWeekMinutes)}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-0.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-staff-text-muted tracking-wider">
                Orders Handled
              </span>
              <span className="text-lg font-extrabold font-mono text-emerald-700">
                {details?.ordersHandledCount ?? staff.ordersHandledCount}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-staff-border-subtle bg-white flex flex-col gap-0.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-staff-text-muted tracking-wider">
                Requests Resolved
              </span>
              <span className="text-lg font-extrabold font-mono text-blue-700">
                {details?.requestsResolvedCount ?? staff.requestsResolvedCount}
              </span>
            </div>
          </div>

          {/* Activity Section Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-staff-border-subtle">
            <button
              type="button"
              onClick={() => setActiveTab("SHIFTS")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === "SHIFTS"
                  ? "bg-staff-brand text-white shadow-2xs"
                  : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary"
              }`}
            >
              ⏱️ Shift Sessions ({details?.recentSessions.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ORDERS")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === "ORDERS"
                  ? "bg-staff-brand text-white shadow-2xs"
                  : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary"
              }`}
            >
              🍽️ Order Actions ({details?.recentOrderActions.length ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("REQUESTS")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                activeTab === "REQUESTS"
                  ? "bg-staff-brand text-white shadow-2xs"
                  : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary"
              }`}
            >
              🛎️ Service Actions ({details?.recentRequestActions.length ?? 0})
            </button>
          </div>
        </DialogHeader>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-staff-text-muted gap-2">
              <div className="w-5 h-5 border-2 border-staff-brand border-t-transparent rounded-full animate-spin" />
              <span>Loading activity records...</span>
            </div>
          ) : (
            <>
              {activeTab === "SHIFTS" && (
                <div className="flex flex-col gap-2.5">
                  {!details || details.recentSessions.length === 0 ? (
                    <p className="text-xs text-staff-text-muted text-center py-8">
                      No shift login sessions recorded yet.
                    </p>
                  ) : (
                    details.recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl border border-staff-border-subtle bg-white flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{session.isLive ? "🟢" : "⚪"}</span>
                          <div className="flex flex-col">
                            <span className="font-semibold text-staff-text-primary">
                              {session.isLive
                                ? "Active Shift (In Progress)"
                                : `Shift Ended at ${new Date(session.endedAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                            </span>
                            <span className="text-[11px] text-staff-text-muted">
                              Started: {new Date(session.createdAt).toLocaleDateString()} at{" "}
                              {new Date(session.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-end">
                            <span className="font-mono font-bold text-staff-text-primary">
                              {formatMins(session.durationMinutes)}
                            </span>
                            <span className="text-[10px] text-staff-text-muted">Duty Duration</span>
                          </div>

                          {session.isLive && (
                            <button
                              type="button"
                              disabled={endingShift}
                              onClick={handleEndShift}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1 disabled:opacity-50"
                              title="End this active shift"
                            >
                              <span>🚪</span> {endingShift ? "Ending..." : "End Shift"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "ORDERS" && (
                <div className="flex flex-col gap-2.5">
                  {!details || details.recentOrderActions.length === 0 ? (
                    <p className="text-xs text-staff-text-muted text-center py-8">
                      No order lifecycle actions recorded for this staff member.
                    </p>
                  ) : (
                    details.recentOrderActions.map((action) => (
                      <div
                        key={action.id}
                        className="p-3 rounded-xl border border-staff-border-subtle bg-white flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-staff-text-primary">
                            Transitioned Order to <span className="font-mono text-emerald-800">{action.state}</span>
                          </span>
                          <span className="text-[11px] text-staff-text-muted">
                            Order #{action.orderId.slice(0, 8)} · Total NPR {Number(action.orderTotal).toLocaleString()} ({action.placeType})
                          </span>
                        </div>
                        <span className="text-[11px] text-staff-text-muted font-mono">
                          {new Date(action.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "REQUESTS" && (
                <div className="flex flex-col gap-2.5">
                  {!details || details.recentRequestActions.length === 0 ? (
                    <p className="text-xs text-staff-text-muted text-center py-8">
                      No hotel service requests resolved by this staff member yet.
                    </p>
                  ) : (
                    details.recentRequestActions.map((action) => (
                      <div
                        key={action.id}
                        className="p-3 rounded-xl border border-staff-border-subtle bg-white flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-staff-text-primary">
                            {action.serviceType.replace(/_/g, " ")} → <span className="font-mono text-blue-800">{action.state}</span>
                          </span>
                          <span className="text-[11px] text-staff-text-muted">
                            Request #{action.requestId.slice(0, 8)} ({action.placeType})
                          </span>
                        </div>
                        <span className="text-[11px] text-staff-text-muted font-mono">
                          {new Date(action.occurredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
