"use client";

import { useState, useMemo, type JSX } from "react";
import { formatMoney } from "@/lib/money";
import { formatElapsed } from "@/lib/date";
import { TableState } from "@/domain/organization/table.repository";
import { TableCategoriesSheetTrigger } from "./_categories-sheet-trigger";
import { AddTableButton } from "./_add-table-button";
import { EditTableSheet, type EditableTable } from "./_edit-table-sheet";
import { EndTableSessionButton } from "./_end-session-button";
import { TableQrDialog } from "./_table-qr-dialog";
import type { TableCategoryItem } from "./_categories-sheet";

export interface TableItemView {
  id: string;
  number: string;
  state: TableState;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    isReserved: boolean;
  } | null;
  activeSession: {
    id: string;
    startedAt: string;
    ordersCount: number;
    totalAmount: string;
  } | null;
  todaySessionsCount: number;
  todayOrdersCount: number;
  todayRevenue: number;
  qrTokenId: string | null;
}

interface TablesViewProps {
  readonly initialTables: readonly TableItemView[];
  readonly categories: readonly TableCategoryItem[];
  readonly currency: string;
}

export function TablesView({
  initialTables,
  categories,
  currency,
}: TablesViewProps): JSX.Element {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [editingTable, setEditingTable] = useState<EditableTable | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of initialTables) {
      const catKey = t.categoryId ?? "unassigned";
      counts.set(catKey, (counts.get(catKey) ?? 0) + 1);
    }
    return counts;
  }, [initialTables]);

  // Compute state counts
  const stateCounts = useMemo(() => {
    let free = 0;
    let occupied = 0;
    let outOfService = 0;
    let reserved = 0;

    for (const t of initialTables) {
      if (t.state === TableState.FREE) free++;
      if (t.state === TableState.OCCUPIED) occupied++;
      if (t.state === TableState.OUT_OF_SERVICE) outOfService++;
      if (t.category?.isReserved) reserved++;
    }
    return { free, occupied, outOfService, reserved };
  }, [initialTables]);

  // Filter tables
  const filteredTables = useMemo(() => {
    return initialTables.filter((t) => {
      if (selectedCategory !== "ALL") {
        if (selectedCategory === "unassigned") {
          if (t.categoryId) return false;
        } else if (t.categoryId !== selectedCategory) {
          return false;
        }
      }

      if (selectedState !== "ALL") {
        if (t.state !== selectedState) return false;
      }

      return true;
    });
  }, [initialTables, selectedCategory, selectedState]);

  // Total daily revenue for tables
  const totalDailyRevenue = useMemo(() => {
    return initialTables.reduce((acc, t) => acc + t.todayRevenue, 0);
  }, [initialTables]);

  const handleOpenEdit = (t: TableItemView) => {
    setEditingTable({
      id: t.id,
      number: t.number,
      categoryId: t.categoryId,
      state: t.state,
      hasActiveSession: !!t.activeSession,
    });
    setEditSheetOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-staff-text-secondary">
            {initialTables.length} Total Table{initialTables.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TableCategoriesSheetTrigger categories={categories} />
          <AddTableButton categories={categories} />
        </div>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1">
          <span className="text-[11px] font-medium text-staff-text-muted uppercase tracking-wider">
            Total Tables
          </span>
          <span className="text-xl font-bold text-staff-text-primary">
            {initialTables.length}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
            Free (Ready)
          </span>
          <span className="text-xl font-bold text-emerald-700">
            {stateCounts.free}
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
          <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider">
            Reserved Zone
          </span>
          <span className="text-xl font-bold text-purple-700">
            {stateCounts.reserved}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-staff-border-subtle bg-staff-surface-raised flex flex-col gap-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-staff-text-muted uppercase tracking-wider">
            Today&apos;s Table Sales
          </span>
          <span className="text-xl font-bold font-mono text-staff-brand">
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
                ? "bg-staff-brand text-white shadow-2xs"
                : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised"
            }`}
          >
            All Categories ({initialTables.length})
          </button>
          {categories.map((c) => {
            const count = categoryCounts.get(c.id) ?? 0;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? "bg-staff-brand text-white shadow-2xs"
                    : "bg-staff-surface text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-raised"
                }`}
              >
                <span>{c.name}</span>
                <span className="opacity-75 text-[10px]">({count})</span>
                {c.isReserved && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                    R
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* State Filter Pills */}
        <div className="flex items-center gap-1 shrink-0">
          {[
            { id: "ALL", label: "All States" },
            { id: TableState.FREE, label: "Free" },
            { id: TableState.OCCUPIED, label: "Occupied" },
            { id: TableState.OUT_OF_SERVICE, label: "Out of Service" },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedState(s.id)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                selectedState === s.id
                  ? "bg-staff-text-primary text-white"
                  : "text-staff-text-muted hover:text-staff-text-secondary hover:bg-staff-surface-raised"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-staff-border-subtle bg-staff-surface">
          <p className="text-sm text-staff-text-muted">
            No tables match the selected category or state filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((t) => {
            const isReserved = t.category?.isReserved;
            const isOccupied = t.state === TableState.OCCUPIED;
            const isOutOfService = t.state === TableState.OUT_OF_SERVICE;

            return (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-2xs ${
                  isOccupied
                    ? "bg-amber-50/30 border-amber-200"
                    : isOutOfService
                    ? "bg-zinc-50 border-zinc-200 opacity-80"
                    : "bg-staff-surface-raised border-staff-border-subtle hover:border-staff-border"
                }`}
              >
                {/* Table Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-staff-text-primary">
                        Table {t.number}
                      </span>
                      {isReserved && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                          🛡️ Reserved
                        </span>
                      )}
                    </div>
                    {t.category ? (
                      <span className="text-xs text-staff-text-secondary block mt-0.5">
                        {t.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-staff-text-muted italic block mt-0.5">
                        Unassigned Zone
                      </span>
                    )}
                  </div>

                  {/* State Badge */}
                  <div>
                    {t.state === TableState.FREE && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-800">
                        Free
                      </span>
                    )}
                    {t.state === TableState.OCCUPIED && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 animate-pulse">
                        Occupied
                      </span>
                    )}
                    {t.state === TableState.OUT_OF_SERVICE && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-200 text-zinc-700">
                        Out of Service
                      </span>
                    )}
                  </div>
                </div>

                {/* Active Session Info (if occupied) */}
                {t.activeSession ? (
                  <div className="p-2.5 rounded-lg bg-amber-100/60 border border-amber-200 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-900">
                        Active Session
                      </span>
                      <span className="text-[11px] text-amber-800">
                        {formatElapsed(new Date(t.activeSession.startedAt), new Date())}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-amber-800">
                      <span>{t.activeSession.ordersCount} orders placed</span>
                      <span className="font-mono font-bold text-amber-950">
                        {formatMoney(t.activeSession.totalAmount, currency)}
                      </span>
                    </div>
                    <div className="pt-1 flex justify-end">
                      <EndTableSessionButton
                        tableId={t.id}
                        tableNumber={t.number}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Today's Metrics */}
                <div className="pt-2 border-t border-staff-border-subtle/80 flex items-center justify-between text-xs text-staff-text-muted">
                  <div>
                    <span>Today: </span>
                    <span className="font-medium text-staff-text-primary">
                      {t.todaySessionsCount} sess · {t.todayOrdersCount} ord
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-staff-text-primary">
                    {formatMoney(t.todayRevenue.toFixed(2), currency)}
                  </span>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-1 flex items-center justify-between gap-2">
                  <TableQrDialog
                    tableId={t.id}
                    tableNumber={t.number}
                    categoryName={t.category?.name}
                    qrTokenId={t.qrTokenId}
                  />

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(t)}
                    className="px-2.5 py-1 text-xs font-medium text-staff-brand hover:underline"
                  >
                    Edit Table →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Table Sheet */}
      <EditTableSheet
        table={editingTable}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        categories={categories}
      />
    </div>
  );
}
