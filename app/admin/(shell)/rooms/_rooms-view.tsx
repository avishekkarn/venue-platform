"use client";

import { useState, useMemo, type JSX } from "react";
import { formatMoney } from "@/lib/money";
import { formatElapsed } from "@/lib/date";
import { RoomState } from "@/domain/organization/room.repository";
import { RoomCategoriesSheetTrigger } from "./_categories-sheet-trigger";
import { AddRoomButton } from "./_add-room-button";
import { EditRoomSheet, type EditableRoom } from "./_edit-room-sheet";
import { EndRoomSessionButton } from "./_end-session-button";
import { RoomQrDialog } from "./_room-qr-dialog";
import type { RoomCategoryItem } from "./_categories-sheet";

export interface RoomItemView {
  id: string;
  number: string;
  state: RoomState;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    basePrice: string;
  } | null;
  activeSession: {
    id: string;
    startedAt: string;
    ordersCount: number;
    requestsCount: number;
    roomRate: string;
    totalAmount: string;
    dndActive: boolean;
  } | null;
  todaySessionsCount: number;
  todayOrdersCount: number;
  todayRequestsCount: number;
  todayRevenue: number;
  qrTokenId: string | null;
}

interface RoomsViewProps {
  readonly initialRooms: readonly RoomItemView[];
  readonly categories: readonly RoomCategoryItem[];
  readonly currency: string;
}

export function RoomsView({
  initialRooms,
  categories,
  currency,
}: RoomsViewProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [editingRoom, setEditingRoom] = useState<EditableRoom | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of initialRooms) {
      const catKey = r.categoryId ?? "unassigned";
      counts.set(catKey, (counts.get(catKey) ?? 0) + 1);
    }
    return counts;
  }, [initialRooms]);

  // Compute state counts
  const stateCounts = useMemo(() => {
    let vacant = 0;
    let occupied = 0;
    let cleaning = 0;
    let outOfService = 0;
    let dndCount = 0;

    for (const r of initialRooms) {
      if (r.state === RoomState.VACANT) vacant++;
      if (r.state === RoomState.OCCUPIED) occupied++;
      if (r.state === RoomState.CLEANING) cleaning++;
      if (r.state === RoomState.OUT_OF_SERVICE) outOfService++;
      if (r.activeSession?.dndActive) dndCount++;
    }
    return { vacant, occupied, cleaning, outOfService, dndCount };
  }, [initialRooms]);

  // Filter rooms
  const filteredRooms = useMemo(() => {
    return initialRooms.filter((r) => {
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "unassigned") {
          if (r.categoryId) return false;
        } else if (r.categoryId !== selectedCategory) {
          return false;
        }
      }

      if (selectedState !== "ALL") {
        if (r.state !== selectedState) return false;
      }

      return true;
    });
  }, [initialRooms, selectedCategory, selectedState]);

  // Total daily revenue for rooms
  const totalDailyRevenue = useMemo(() => {
    return initialRooms.reduce((acc, r) => acc + r.todayRevenue, 0);
  }, [initialRooms]);

  const handleOpenEdit = (r: RoomItemView) => {
    setEditingRoom({
      id: r.id,
      number: r.number,
      categoryId: r.categoryId,
      state: r.state,
      hasActiveSession: !!r.activeSession,
    });
    setEditSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-staff-text-secondary">
            {initialRooms.length} Total Room{initialRooms.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <RoomCategoriesSheetTrigger
            categories={categories}
            currency={currency}
          />
          <AddRoomButton
            categories={categories}
            currency={currency}
          />
        </div>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1">
          <span className="text-[11px] font-medium text-staff-text-muted uppercase tracking-wider">
            Total Rooms
          </span>
          <span className="text-xl font-bold text-staff-text-primary">
            {initialRooms.length}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
            Vacant (Ready)
          </span>
          <span className="text-xl font-bold text-emerald-700">
            {stateCounts.vacant}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
            Occupied
          </span>
          <span className="text-xl font-bold text-amber-700">
            {stateCounts.occupied}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1">
          <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">
            Cleaning / Service
          </span>
          <span className="text-xl font-bold text-blue-700">
            {stateCounts.cleaning + stateCounts.outOfService}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1 col-span-2 sm:col-span-1 min-w-0 overflow-hidden">
          <span className="text-[11px] font-medium text-staff-text-muted uppercase tracking-wider truncate" title="Today's Room Revenue">
            Today&apos;s Room Revenue
          </span>
          <span
            className="text-lg sm:text-xl font-bold font-mono text-staff-brand truncate whitespace-nowrap"
            title={formatMoney(totalDailyRevenue.toFixed(2), currency)}
          >
            {formatMoney(totalDailyRevenue.toFixed(2), currency)}
          </span>
        </div>
      </div>

      {/* Filter Tabs & State Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-staff-border-subtle">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === "ALL"
                ? "bg-[#344b3c] text-white shadow-xs font-semibold"
                : "bg-stone-100 text-stone-700 hover:text-stone-900 hover:bg-stone-200"
            }`}
            style={selectedCategory === "ALL" ? { backgroundColor: "#344b3c", color: "#ffffff" } : undefined}
          >
            All Categories ({initialRooms.length})
          </button>
          {categories.map((c) => {
            const count = categoryCounts.get(c.id) ?? 0;
            const isSelected = selectedCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#344b3c] text-white shadow-xs font-semibold"
                    : "bg-stone-100 text-stone-700 hover:text-stone-900 hover:bg-stone-200"
                }`}
                style={isSelected ? { backgroundColor: "#344b3c", color: "#ffffff" } : undefined}
              >
                <span>{c.name}</span>
                <span className={isSelected ? "text-white/80 text-[10px]" : "text-stone-500 text-[10px]"}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* State Filter Pills */}
        <div className="flex items-center gap-1 shrink-0">
          {[
            { id: "ALL", label: "All States" },
            { id: RoomState.VACANT, label: "Vacant" },
            { id: RoomState.OCCUPIED, label: "Occupied" },
            { id: RoomState.CLEANING, label: "Cleaning" },
            { id: RoomState.OUT_OF_SERVICE, label: "Out of Service" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedState(s.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                selectedState === s.id
                  ? "bg-[#141413] text-white shadow-xs font-semibold"
                  : "text-staff-text-muted hover:text-staff-text-secondary hover:bg-staff-surface-raised"
              }`}
              style={selectedState === s.id ? { backgroundColor: "#141413", color: "#ffffff" } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-staff-border-subtle bg-staff-surface">
          <p className="text-sm text-staff-text-muted">
            No rooms match the selected category or state filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((r) => {
            const isOccupied = r.state === RoomState.OCCUPIED;
            const isCleaning = r.state === RoomState.CLEANING;
            const isOutOfService = r.state === RoomState.OUT_OF_SERVICE;
            const isDnd = r.activeSession?.dndActive;

            return (
              <div
                key={r.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                  isOccupied
                    ? "bg-amber-50/30 border-amber-200"
                    : isCleaning
                    ? "bg-blue-50/30 border-blue-200"
                    : isOutOfService
                    ? "bg-zinc-50 border-zinc-200 opacity-80"
                    : "bg-staff-surface-raised border-staff-border-subtle hover:border-staff-border"
                }`}
              >
                {/* Room Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-staff-text-primary">
                        Room {r.number}
                      </span>
                      {isDnd && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                          🔴 DND
                        </span>
                      )}
                    </div>
                    {r.category ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-staff-text-secondary">
                          {r.category.name}
                        </span>
                        <span className="text-[11px] font-mono font-medium text-staff-brand">
                          ({formatMoney(r.category.basePrice, currency)}/night)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-staff-text-muted italic block mt-0.5">
                        Unassigned Category
                      </span>
                    )}
                  </div>

                  {/* State Badge */}
                  <div>
                    {r.state === RoomState.VACANT && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                        Vacant
                      </span>
                    )}
                    {r.state === RoomState.OCCUPIED && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 animate-pulse">
                        Occupied
                      </span>
                    )}
                    {r.state === RoomState.CLEANING && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-800">
                        Cleaning
                      </span>
                    )}
                    {r.state === RoomState.OUT_OF_SERVICE && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-200 text-zinc-700">
                        Out of Service
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Stay Info (if occupied) */}
                {r.activeSession ? (
                  <div className="p-2.5 rounded-lg bg-amber-100/60 border border-amber-200 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900">
                        Active Stay
                      </span>
                      <span className="text-[11px] text-amber-800" suppressHydrationWarning>
                        {formatElapsed(new Date(r.activeSession.startedAt), new Date())}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-800">
                      <span>
                        {r.activeSession.ordersCount} ord · {r.activeSession.requestsCount} req
                      </span>
                      <span className="font-mono font-bold text-amber-950">
                        Total Folio: {formatMoney(r.activeSession.totalAmount, currency)}
                      </span>
                    </div>
                    {Number(r.activeSession.roomRate) > 0 && (
                      <div className="text-[10px] text-amber-700 italic flex justify-between">
                        <span>Includes room stay rate</span>
                        <span className="font-mono">+{formatMoney(r.activeSession.roomRate, currency)}</span>
                      </div>
                    )}
                    <div className="pt-1 flex justify-end">
                      <EndRoomSessionButton
                        roomId={r.id}
                        roomNumber={r.number}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Today's Metrics */}
                <div className="pt-2 border-t border-staff-border-subtle/80 flex items-center justify-between text-xs text-staff-text-muted">
                  <div>
                    <span>Today: </span>
                    <span className="font-medium text-staff-text-primary">
                      {r.todaySessionsCount} sess · {r.todayOrdersCount} ord · {r.todayRequestsCount} req
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-staff-text-primary">
                    {formatMoney(r.todayRevenue.toFixed(2), currency)}
                  </span>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <RoomQrDialog
                    roomId={r.id}
                    roomNumber={r.number}
                    categoryName={r.category?.name}
                    qrTokenId={r.qrTokenId}
                  />

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(r)}
                    className="px-2.5 py-1 text-xs font-medium text-staff-brand hover:underline"
                  >
                    Edit Room →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Room Sheet */}
      <EditRoomSheet
        room={editingRoom}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        categories={categories}
        currency={currency}
      />
    </div>
  );
}
