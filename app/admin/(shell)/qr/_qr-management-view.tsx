"use client";

import { useState, useMemo, useEffect, useCallback, type JSX } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { formatElapsed } from "@/lib/date";
import type { PlaceItemView, QrPlacesResponse } from "./_types";
import { AddPlaceDialog } from "./_add-place-dialog";
import { EndSessionDialog } from "./_end-session-dialog";
import { RegenerateQrDialog } from "./_regenerate-qr-dialog";
import { RevokeQrDialog } from "./_revoke-qr-dialog";
import { DeletePlaceDialog } from "./_delete-place-dialog";
import { getCsrfToken } from "@/lib/csrf-client";

interface CategoryOption {
  id: string;
  name: string;
}

interface QrManagementViewProps {
  readonly initialData: QrPlacesResponse;
  readonly tableCategories: readonly CategoryOption[];
  readonly roomCategories: readonly CategoryOption[];
}

export function QrManagementView({
  initialData,
  tableCategories,
  roomCategories,
}: QrManagementViewProps): JSX.Element {
  const [data, setData] = useState<QrPlacesResponse>(initialData);
  const [selectedType, setSelectedType] = useState<"ALL" | "COUNTER" | "TABLE" | "ROOM">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "ACTIVE_QR" | "NO_QR" | "IN_SESSION">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [mounted, setMounted] = useState(false);

  // Dialog states
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [sessionTargetPlace, setSessionTargetPlace] = useState<PlaceItemView | null>(null);
  const [endSessionOpen, setEndSessionOpen] = useState(false);
  const [regenerateTargetPlace, setRegenerateTargetPlace] = useState<PlaceItemView | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [revokeTargetPlace, setRevokeTargetPlace] = useState<PlaceItemView | null>(null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [deleteTargetPlace, setDeleteTargetPlace] = useState<PlaceItemView | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Quick batch generator state
  const [generatingMissing, setGeneratingMissing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const poll = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/qr/places", { credentials: "same-origin" });
      if (!res.ok) return;
      const json = await res.json();
      if (json && json.data) {
        setData(json.data);
        setLastRefreshedAt(new Date());
      }
    } catch {
      // Network jitter or silent retry
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
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [poll]);

  // Handle Generate Missing QRs in one click
  const handleGenerateMissing = async () => {
    setGeneratingMissing(true);
    try {
      const res = await fetch("/api/admin/qr/generate-missing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": getCsrfToken(),
        },
      });
      if (res.ok) {
        await poll(true);
      }
    } catch {
      // Ignore
    } finally {
      setGeneratingMissing(false);
    }
  };

  // Counts by type
  const typeCounts = useMemo(() => {
    let counters = 0;
    let tables = 0;
    let rooms = 0;
    for (const p of data.places) {
      if (p.type === "COUNTER") counters++;
      if (p.type === "TABLE") tables++;
      if (p.type === "ROOM") rooms++;
    }
    return { counters, tables, rooms };
  }, [data.places]);

  // Filtered places
  const filteredPlaces = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return data.places.filter((p) => {
      if (selectedType !== "ALL" && p.type !== selectedType) {
        return false;
      }

      if (selectedStatus === "ACTIVE_QR" && !p.activeQr) {
        return false;
      }
      if (selectedStatus === "NO_QR" && p.activeQr) {
        return false;
      }
      if (selectedStatus === "IN_SESSION" && !p.activeSession) {
        return false;
      }

      if (q) {
        const matchName = p.name.toLowerCase().includes(q);
        const matchIdentifier = p.identifier.toLowerCase().includes(q);
        const matchCategory = p.categoryName?.toLowerCase().includes(q) ?? false;
        const matchToken = p.activeQr?.token.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchIdentifier && !matchCategory && !matchToken) {
          return false;
        }
      }

      return true;
    });
  }, [data.places, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Live Header & Sync Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-staff-border-subtle">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Operations
          </div>
          <span className="text-xs text-staff-text-muted" suppressHydrationWarning>
            Auto-refreshing every 5s{mounted ? ` · Last synced at ${lastRefreshedAt.toLocaleTimeString()}` : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => poll(true)}
            disabled={isRefreshing}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-raised text-staff-text-primary transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <span className={isRefreshing ? "animate-spin" : ""}>↻</span>
            {isRefreshing ? "Syncing..." : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-staff-text-primary tracking-tight">
            QR Codes & Places Hub
          </h1>
          <p className="text-xs text-staff-text-muted mt-0.5">
            Manage physical places, scannable QR placards, active guest sessions, and batch printing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {data.revokedOrMissingCount > 0 && (
            <button
              type="button"
              onClick={handleGenerateMissing}
              disabled={generatingMissing}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>⚡</span>
              {generatingMissing
                ? "Generating..."
                : `Generate Missing QRs (${data.revokedOrMissingCount})`}
            </button>
          )}

          <Link
            href="/admin/qr/print/batch"
            target="_blank"
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-raised text-staff-text-primary transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>🖨️ Batch Print Placards ↗</span>
          </Link>

          <button
            type="button"
            onClick={() => setAddPlaceOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-staff-brand text-white hover:bg-staff-brand-hover transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
          >
            <span>+ Add Place</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1 min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-staff-text-muted uppercase tracking-wider truncate" title="Total Places">
            Total Places
          </span>
          <span className="text-xl font-bold text-staff-text-primary">
            {data.totalPlaces}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1 min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider truncate" title="Active QR Placards">
            Active QR Placards
          </span>
          <span className="text-xl font-bold text-emerald-700">
            {data.activeQrsCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1 min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider truncate" title="Needs QR / Revoked">
            Needs QR / Revoked
          </span>
          <span className="text-xl font-bold text-amber-700">
            {data.revokedOrMissingCount}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1 min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider truncate" title="In-Session Places">
            In-Session Places
          </span>
          <span className="text-xl font-bold text-purple-700">
            {data.activeSessionsCount}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-staff-border-subtle">
        {/* Type Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              selectedType === "ALL"
                ? "bg-staff-brand text-white font-semibold shadow-2xs"
                : "text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised"
            }`}
          >
            All Places ({data.totalPlaces})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("COUNTER")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              selectedType === "COUNTER"
                ? "bg-staff-brand text-white font-semibold shadow-2xs"
                : "text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised"
            }`}
          >
            Counters ({typeCounts.counters})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("TABLE")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              selectedType === "TABLE"
                ? "bg-staff-brand text-white font-semibold shadow-2xs"
                : "text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised"
            }`}
          >
            Tables ({typeCounts.tables})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("ROOM")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
              selectedType === "ROOM"
                ? "bg-staff-brand text-white font-semibold shadow-2xs"
                : "text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised"
            }`}
          >
            Rooms ({typeCounts.rooms})
          </button>
        </div>

        {/* Status Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as typeof selectedStatus)}
            className="h-8 px-2.5 rounded-lg border border-staff-border-subtle bg-staff-surface-raised text-xs text-staff-text-primary focus:border-staff-brand outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE_QR">Active QR Only</option>
            <option value="NO_QR">No Active QR / Revoked</option>
            <option value="IN_SESSION">In Session</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search place, category, or token..."
            className="h-8 px-3 rounded-lg border border-staff-border-subtle bg-staff-surface-raised text-xs text-staff-text-primary w-48 sm:w-60 focus:border-staff-brand outline-none"
          />
        </div>
      </div>

      {/* Places Grid */}
      {filteredPlaces.length === 0 ? (
        <div className="py-16 text-center border border-staff-border-subtle rounded-xl bg-staff-surface-raised">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-semibold text-staff-text-primary mt-2">
            No matching places found
          </p>
          <p className="text-xs text-staff-text-muted mt-1">
            Try adjusting your search query, type filter, or status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaces.map((place) => {
            const hasQr = place.activeQr !== null;
            const hasSession = place.activeSession !== null;

            return (
              <div
                key={`${place.type}-${place.id}`}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 shadow-2xs transition-all ${
                  hasSession
                    ? "bg-amber-50/40 border-amber-300"
                    : "bg-staff-surface-raised border-staff-border-subtle"
                }`}
              >
                {/* Place Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          place.type === "COUNTER"
                            ? "bg-amber-100 text-amber-900 border border-amber-200"
                            : place.type === "TABLE"
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                            : "bg-purple-100 text-purple-900 border border-purple-200"
                        }`}
                      >
                        {place.type}
                      </span>
                      {place.isReserved && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                          Reserved
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-staff-text-primary mt-1">
                      {place.name}
                    </h3>
                    <p className="text-xs text-staff-text-secondary">
                      {place.categoryName}
                    </p>
                  </div>

                  {/* QR Status Badge */}
                  <div>
                    {hasQr ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Active QR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Revoked / None
                      </span>
                    )}
                  </div>
                </div>

                {/* QR Placard Preview Section */}
                <div className="p-3 rounded-lg border border-staff-border-subtle bg-white flex items-center justify-between gap-3">
                  {hasQr ? (
                    <>
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/admin/qr/${place.activeQr!.id}/image`}
                          alt={`QR for ${place.name}`}
                          className="w-14 h-14 rounded border border-stone-200 object-contain shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-staff-text-muted font-mono truncate" title={place.activeQr!.token}>
                            Token: {place.activeQr!.token.slice(0, 12)}…
                          </span>
                          <Link
                            href={`/qr/${place.activeQr!.token}`}
                            target="_blank"
                            className="text-xs font-semibold text-staff-brand hover:underline mt-0.5 inline-flex items-center gap-1"
                          >
                            <span>Open Menu Link ↗</span>
                          </Link>
                          <span className="text-[10px] text-staff-text-muted mt-0.5" suppressHydrationWarning>
                            Issued: {new Date(place.activeQr!.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Link
                          href={`/admin/qr/print/${place.activeQr!.id}?print=true`}
                          target="_blank"
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-raised text-staff-text-primary transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          🖨️ Print
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setRevokeTargetPlace(place);
                            setRevokeOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                          title="Revoke compromised QR code immediately"
                        >
                          🚫 Revoke
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-2 w-full py-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-rose-800">
                          No Active QR Placard
                        </span>
                        <span className="text-[11px] text-staff-text-muted">
                          Customer scanning is currently disabled.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRegenerateTargetPlace(place);
                          setRegenerateOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
                      >
                        + Issue QR
                      </button>
                    </div>
                  )}
                </div>

                {/* Active Session Ribbon (if occupied) */}
                {hasSession && (
                  <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-100/70 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-900 inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                        Active In-House Session
                      </span>
                      <span className="text-[11px] font-mono text-amber-800" suppressHydrationWarning>
                        {formatElapsed(new Date(place.activeSession!.startedAt), new Date())}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-amber-900">
                      <span>
                        {place.activeSession!.ordersCount} orders · {place.activeSession!.requestsCount} requests
                      </span>
                      <span className="font-mono font-bold text-amber-950">
                        Folio: {formatMoney(place.activeSession!.totalAmount, data.currency)}
                      </span>
                    </div>

                    <div className="pt-1 border-t border-amber-200/80 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSessionTargetPlace(place);
                          setEndSessionOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded bg-red-600 text-white hover:bg-red-700 transition-colors shadow-2xs cursor-pointer"
                      >
                        Force End Session
                      </button>
                    </div>
                  </div>
                )}

                {/* Place Footer Actions */}
                <div className="pt-2 border-t border-staff-border-subtle flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegenerateTargetPlace(place);
                      setRegenerateOpen(true);
                    }}
                    className="text-xs font-medium text-staff-text-secondary hover:text-staff-brand transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>🔄</span>
                    {hasQr ? "Regenerate QR" : "Generate QR"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteTargetPlace(place);
                      setDeleteOpen(true);
                    }}
                    className="text-xs font-medium text-staff-text-muted hover:text-red-600 transition-colors cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <span>🗑️</span>
                    Delete Place
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Place Dialog */}
      <AddPlaceDialog
        open={addPlaceOpen}
        onOpenChange={setAddPlaceOpen}
        onPlaceCreated={() => poll(true)}
        tableCategories={tableCategories}
        roomCategories={roomCategories}
      />

      {/* End Session Dialog */}
      <EndSessionDialog
        open={endSessionOpen}
        onOpenChange={setEndSessionOpen}
        place={sessionTargetPlace}
        onSessionEnded={() => poll(true)}
      />

      {/* Regenerate QR Dialog */}
      <RegenerateQrDialog
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        place={regenerateTargetPlace}
        onQrRegenerated={() => poll(true)}
      />

      {/* Revoke QR Dialog */}
      <RevokeQrDialog
        open={revokeOpen}
        onOpenChange={setRevokeOpen}
        place={revokeTargetPlace}
        onQrRevoked={() => poll(true)}
      />

      {/* Delete Place Dialog */}
      <DeletePlaceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        place={deleteTargetPlace}
        onPlaceDeleted={() => poll(true)}
      />
    </div>
  );
}
