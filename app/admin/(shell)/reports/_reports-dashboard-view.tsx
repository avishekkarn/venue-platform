"use client";

import { useState, useEffect, useCallback, useMemo, type JSX } from "react";
import { cn } from "@/lib/utils";

interface ReportsDashboardViewProps {
  readonly staffId: string;
  readonly staffName: string;
  readonly currency: string;
  readonly venueName: string;
}

type ViewCategory = "FINANCIAL" | "OPERATIONS" | "HOSPITALITY" | "PLACES_QR";

interface ViewMeta {
  readonly id: string;
  readonly label: string;
  readonly category: ViewCategory;
  readonly description: string;
}

const VIEW_METAS: readonly ViewMeta[] = [
  // Financial & Sales
  { id: "revenue", label: "1. Revenue Summary", category: "FINANCIAL", description: "Gross subtotal, tax collected, and place breakdown (Table, Room, Counter)" },
  { id: "sales", label: "2. Sales by Item", category: "FINANCIAL", description: "Units sold, base & modifier revenue, and add-on attach rate per item" },
  { id: "matrix", label: "3. Menu Matrix", category: "FINANCIAL", description: "Kasavana & Smith matrix: Stars, Plowhorses, Puzzles, and Dogs" },
  { id: "modifiers", label: "4. Modifier Attach-Rate", category: "FINANCIAL", description: "Add-on velocity, option popularity, and upsell performance" },
  { id: "tax", label: "5. Tax Remittance", category: "FINANCIAL", description: "Periodic taxable subtotals and tax liabilities for accountant filing" },
  { id: "payment", label: "6. Payment Reconciliation", category: "FINANCIAL", description: "Settlement bridge status and provider connectivity" },

  // Operations & Latency
  { id: "funnel", label: "7. Order Funnel & Latency", category: "OPERATIONS", description: "Stage progression counts and average approval, prep, delivery, and cycle times" },
  { id: "heatmap", label: "8. Hourly Heatmap", category: "OPERATIONS", description: "Hourly order density and revenue peaks across the operating day" },
  { id: "cancellations", label: "9. Cancellation Root-Cause", category: "OPERATIONS", description: "Cancelled order frequency and recorded reason breakdown" },
  { id: "audit", label: "10. Per-Record Audit Trail", category: "OPERATIONS", description: "Chronological ledger of operational mutations with staff attribution" },

  // Hospitality & Services
  { id: "requests", label: "11. Service Requests", category: "HOSPITALITY", description: "Guest request volume, completions, and resolution durations by department" },
  { id: "sla", label: "12. Service SLA Dashboard", category: "HOSPITALITY", description: "P50, P90, P99 percentile resolution metrics and live queue volume" },
  { id: "folio", label: "13. Room Folio Report", category: "HOSPITALITY", description: "Room stays, room orders, service charges, and guest folio totals" },

  // Places & QR Placards
  { id: "utilization", label: "14. Place Utilization", category: "PLACES_QR", description: "Table turns, stay durations, dwell minutes, revenue, and conversion %" },
  { id: "occupancy", label: "15. Occupancy & Dwell", category: "PLACES_QR", description: "Guest session volume, average dwell, and peak concurrent occupancy" },
  { id: "qr", label: "16. QR Placard Lifecycle", category: "PLACES_QR", description: "Placard issuance, active vs revoked status, and session generation" },
  { id: "conversion", label: "17. Placard Conversion", category: "PLACES_QR", description: "Funnel from physical QR scan to placed order and revenue per session" },
];

function getPresetDates(daysAgo: number): { from: string; to: string } {
  const now = new Date();
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return {
    from: past.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

interface SavedReportItem {
  id: string;
  name: string;
  view: string;
  params: { dateFrom?: string; dateTo?: string };
  createdAt: string;
  createdBy: { id: string; name: string; username: string } | null;
}

export function ReportsDashboardView({
  currency,
  venueName,
}: ReportsDashboardViewProps): JSX.Element {
  const defaultDates = useMemo(() => getPresetDates(30), []);

  const [dateFrom, setDateFrom] = useState<string>(defaultDates.from);
  const [dateTo, setDateTo] = useState<string>(defaultDates.to);
  const [selectedCategory, setSelectedCategory] = useState<ViewCategory>("FINANCIAL");
  const [selectedView, setSelectedView] = useState<string>("revenue");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  // Saved reports drawer & modal
  const [savedDrawerOpen, setSavedDrawerOpen] = useState<boolean>(false);
  const [savedReports, setSavedReports] = useState<SavedReportItem[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState<boolean>(false);
  const [newReportName, setNewReportName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Filter views belonging to current category
  const categoryViews = useMemo(
    () => VIEW_METAS.filter((v) => v.category === selectedCategory),
    [selectedCategory]
  );

  const activeViewMeta = useMemo(
    () => VIEW_METAS.find((v) => v.id === selectedView) ?? VIEW_METAS[0]!,
    [selectedView]
  );

  // Validate 180-day rule on client
  const dateValidationWarning = useMemo(() => {
    const from = new Date(`${dateFrom}T00:00:00.000Z`);
    const to = new Date(`${dateTo}T23:59:59.999Z`);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) return "Please select valid dates";
    if (from.getTime() > to.getTime()) return "Date From must be before or equal to Date To";
    const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 180) return `Date range exceeds maximum allowed window of 180 days (${diffDays} days selected)`;
    return null;
  }, [dateFrom, dateTo]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    if (dateValidationWarning && selectedView !== "payment") {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const url =
        selectedView === "payment"
          ? `/api/admin/reports/payment`
          : `/api/admin/reports/${selectedView}?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error?.message ?? "Failed to load report data");
        setReportData(null);
      } else {
        setReportData(json.data);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Network error");
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedView, dateFrom, dateTo, dateValidationWarning]);

  // Re-fetch when view or date range changes
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Fetch saved reports
  const fetchSavedReports = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reports/saved");
      if (res.ok) {
        const json = await res.json();
        setSavedReports(json.data ?? []);
      }
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    fetchSavedReports();
  }, [fetchSavedReports]);

  // Handle saving new query
  const handleSaveReport = async () => {
    if (!newReportName.trim()) {
      setSaveError("Please enter a report name");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // Read CSRF cookie
      const csrfMatch = document.cookie.match(/(?:^|;\s*)staff_csrf=([^;]+)/);
      const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1] ?? "") : "";

      const res = await fetch("/api/admin/reports/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          name: newReportName.trim(),
          view: selectedView,
          params: { dateFrom, dateTo },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error?.message ?? "Failed to save query");
      } else {
        setSaveModalOpen(false);
        setNewReportName("");
        fetchSavedReports();
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save query");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting saved query
  const handleDeleteSavedReport = async (id: string, name: string) => {
    if (!confirm(`Delete saved report "${name}"?`)) return;

    try {
      const csrfMatch = document.cookie.match(/(?:^|;\s*)staff_csrf=([^;]+)/);
      const csrfToken = csrfMatch ? decodeURIComponent(csrfMatch[1] ?? "") : "";

      const res = await fetch(`/api/admin/reports/saved/${id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken },
      });

      if (res.ok) {
        fetchSavedReports();
      }
    } catch {
      // non-fatal
    }
  };

  // CSV download URL
  const exportUrl =
    selectedView === "payment"
      ? `/api/admin/reports/payment/export`
      : `/api/admin/reports/${selectedView}/export?dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}`;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-staff-text-primary tracking-tight">
              Reports & Operational Intelligence Hub
            </h1>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-medium bg-staff-surface border border-staff-border-subtle text-staff-text-secondary">
              17 Views · CSV Ready
            </span>
          </div>
          <p className="text-sm text-staff-text-secondary mt-1">
            Industry-grade financial revenue, menu engineering, workflow funnel latency, hotel service SLAs, and placarded conversion for {venueName}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setSavedDrawerOpen(true)}
            className="px-3 py-2 text-xs font-medium rounded border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-sunken text-staff-text-primary transition-colors flex items-center gap-1.5"
          >
            <span>📁</span>
            <span>Saved Queries ({savedReports.length})</span>
          </button>

          <button
            onClick={() => {
              setNewReportName(`${activeViewMeta.label.replace(/^\d+\.\s*/, "")} (${dateFrom})`);
              setSaveError(null);
              setSaveModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-medium rounded border border-staff-border-subtle bg-staff-surface hover:bg-staff-surface-sunken text-staff-text-primary transition-colors flex items-center gap-1.5"
          >
            <span>💾</span>
            <span>Save Query</span>
          </button>

          <a
            href={dateValidationWarning && selectedView !== "payment" ? undefined : exportUrl}
            download
            className={cn(
              "px-3 py-2 text-xs font-medium rounded border text-white transition-colors flex items-center gap-1.5",
              dateValidationWarning && selectedView !== "payment"
                ? "bg-gray-400 cursor-not-allowed border-transparent"
                : "bg-black hover:bg-neutral-800 border-black shadow-sm"
            )}
          >
            <span>📥</span>
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* 2. Global Date Range Filter & Presets */}
      <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-staff-text-secondary mr-1">
              Time Horizon:
            </span>
            {[
              { label: "Today", days: 0 },
              { label: "Last 7 Days", days: 6 },
              { label: "Last 30 Days", days: 29 },
              { label: "Last 90 Days", days: 89 },
              { label: "6 Months (Max 180d)", days: 179 },
            ].map((preset) => {
              const p = getPresetDates(preset.days);
              const isActive = dateFrom === p.from && dateTo === p.to;
              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    setDateFrom(p.from);
                    setDateTo(p.to);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded border transition-colors",
                    isActive
                      ? "bg-black text-white border-black font-semibold"
                      : "bg-staff-surface text-staff-text-secondary border-staff-border-subtle hover:bg-staff-surface-sunken"
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="dateFrom" className="text-xs font-medium text-staff-text-secondary">
                From:
              </label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-staff-border-subtle bg-staff-surface text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="dateTo" className="text-xs font-medium text-staff-text-secondary">
                To:
              </label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1 text-xs rounded border border-staff-border-subtle bg-staff-surface text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <button
              onClick={fetchReport}
              disabled={isLoading || !!dateValidationWarning}
              className="px-3 py-1 text-xs font-semibold rounded bg-staff-surface-sunken border border-staff-border-subtle text-staff-text-primary hover:bg-staff-surface transition-colors disabled:opacity-50"
            >
              {isLoading ? "Running..." : "Refresh"}
            </button>
          </div>
        </div>

        {dateValidationWarning && (
          <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded p-2 flex items-center gap-1.5">
            <span>⚠️</span>
            <span>{dateValidationWarning} (DECISIONS.md D-12.1)</span>
          </div>
        )}
      </div>

      {/* 3. Category Selector */}
      <div className="flex items-center gap-1 border-b border-staff-border-subtle pb-1">
        {[
          { id: "FINANCIAL", label: "💰 Financial & Sales", views: 6 },
          { id: "OPERATIONS", label: "⏱️ Operations & Latency", views: 4 },
          { id: "HOSPITALITY", label: "🛎️ Hospitality & Services", views: 3 },
          { id: "PLACES_QR", label: "📍 Places & QR Placards", views: 4 },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id as ViewCategory);
                const first = VIEW_METAS.find((v) => v.category === cat.id);
                if (first) setSelectedView(first.id);
              }}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-t-md transition-colors border-b-2",
                isSelected
                  ? "border-black text-black bg-staff-surface-raised shadow-xs"
                  : "border-transparent text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface-sunken"
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 4. Modular View Switcher Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categoryViews.map((v) => {
          const isCurrent = selectedView === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setSelectedView(v.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-full border whitespace-nowrap transition-colors",
                isCurrent
                  ? "bg-black text-white border-black font-semibold shadow-xs"
                  : "bg-staff-surface-raised border-staff-border-subtle text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface"
              )}
            >
              {v.label}
            </button>
          );
        })}
      </div>

      {/* View Header Details */}
      <div className="bg-staff-surface rounded p-3 border border-staff-border-subtle flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-staff-text-primary uppercase tracking-wider">
            {activeViewMeta.label}
          </span>
          <p className="text-xs text-staff-text-secondary mt-0.5">
            {activeViewMeta.description}
          </p>
        </div>
        <div className="text-xs font-mono font-medium text-staff-text-secondary bg-staff-surface-raised px-2.5 py-1 rounded border border-staff-border-subtle">
          Range: {dateFrom} → {dateTo}
        </div>
      </div>

      {/* 5. Content Rendering */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <p className="font-semibold">Query Error</p>
          <p className="text-xs mt-1">{errorMessage}</p>
        </div>
      )}

      {/* Data Quality & Anomaly Banners */}
      {reportData?.meta?.quality?.uncategorizedItemPct > 10 && selectedView === "sales" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span>
            <strong>Data Quality Notice:</strong> {reportData.meta.quality.uncategorizedItemPct.toFixed(1)}% of sold items lack a snapshotted category. Run category backfill or verify menu assignments.
          </span>
        </div>
      )}

      {reportData?.meta?.isCleanOperations && selectedView === "cancellations" && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
          <span>✅</span>
          <span>
            <strong>Clean Operations:</strong> Zero cancellations in selected date range. 0 of {reportData.meta.totalOrders ?? 0} orders were cancelled ({reportData.meta.cancellationRatePct ?? "0.0%"}).
          </span>
        </div>
      )}

      {reportData?.meta?.anomalies && reportData.meta.anomalies.length > 0 && selectedView === "funnel" && (
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <span>⚡</span>
            <span>Latency Outliers & Anomalies ({reportData.meta.anomalies.length} orders &gt; 3× P90 duration)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead className="text-amber-800 font-semibold border-b border-amber-200">
                <tr>
                  <th className="py-1 px-2">Order ID</th>
                  <th className="py-1 px-2">Date</th>
                  <th className="py-1 px-2">Segment</th>
                  <th className="py-1 px-2 text-right">Duration (s)</th>
                  <th className="py-1 px-2 text-right">P90 Threshold (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/50 text-amber-900 font-mono">
                {reportData.meta.anomalies.map((a: any, idx: number) => (
                  <tr key={idx} className="hover:bg-amber-100/40">
                    <td className="py-1 px-2">{a.orderId.slice(0, 8)}...</td>
                    <td className="py-1 px-2">{a.date}</td>
                    <td className="py-1 px-2 font-sans font-medium">{a.segment}</td>
                    <td className="py-1 px-2 text-right font-bold text-red-700">{a.durationSec}s</td>
                    <td className="py-1 px-2 text-right">{a.p90ThresholdSec}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedView === "payment" ? (
        <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 text-amber-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              💳
            </div>
            <h3 className="text-base font-bold text-staff-text-primary">
              Payment Reconciliation & Settlement
            </h3>
            <p className="text-xs text-staff-text-secondary leading-relaxed max-w-md mx-auto">
              Cash-only settlement is active for v1 (D-7.1, D-7.7). Inactive payment gateways will show reconciliation discrepancies once the payment bridge connects in Phase 10.
            </p>
          </div>

          {/* Cash Summary Banner */}
          <div className="max-w-lg mx-auto bg-staff-surface p-4 rounded-lg border border-staff-border-subtle grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-[11px] text-staff-text-secondary font-medium uppercase tracking-wider">
                Total Cash Collected
              </div>
              <div className="text-xl font-bold font-mono text-staff-text-primary mt-0.5">
                {currency} {reportData?.totalCashCollected ?? "0.00"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-staff-text-secondary font-medium uppercase tracking-wider">
                Completed Orders
              </div>
              <div className="text-xl font-bold font-mono text-staff-text-primary mt-0.5">
                {reportData?.completedOrdersCount ?? 0}
              </div>
            </div>
          </div>

          <div className="text-center">
            <span className="inline-block px-3 py-1.5 rounded bg-staff-surface border border-staff-border-subtle text-xs font-mono text-staff-text-secondary">
              Scope Lock: DECISIONS.md D-7.1, D-7.7 · Phase 10 Payment Bridge
            </span>
          </div>
        </div>
      ) : isLoading ? (
        <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-12 text-center text-staff-text-secondary text-sm">
          <div className="inline-block animate-spin text-xl mb-2">⏳</div>
          <p>Compiling audited data ledger across venue operational tables...</p>
        </div>
      ) : !reportData || !reportData.rows || reportData.rows.length === 0 ? (
        <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-12 text-center text-staff-text-secondary text-sm">
          <div className="text-2xl mb-2">📭</div>
          <p className="font-semibold text-staff-text-primary">No Records Found</p>
          <p className="text-xs text-staff-text-secondary mt-1">
            No events or orders matching this criteria occurred between {dateFrom} and {dateTo}.
          </p>
        </div>
      ) : (
        <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-staff-surface border-b border-staff-border-subtle text-staff-text-secondary uppercase tracking-wider font-semibold">
                <tr>
                  {Object.keys(reportData.rows[0]).map((key) => (
                    <th
                      key={key}
                      className={cn(
                        "py-2.5 px-3",
                        ["subtotal", "taxCollected", "totalRevenue", "baseRevenue", "modifierRevenue", "lineRevenue", "revenue", "orderRevenue"].includes(key)
                          ? "text-right"
                          : ""
                      )}
                    >
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-staff-border-subtle text-staff-text-primary">
                {reportData.rows.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-staff-surface transition-colors">
                    {Object.entries(row).map(([k, v]: [string, any], cellIdx) => (
                      <td
                        key={cellIdx}
                        className={cn(
                          "py-2 px-3 whitespace-nowrap",
                          ["subtotal", "taxCollected", "totalRevenue", "baseRevenue", "modifierRevenue", "lineRevenue", "revenue", "orderRevenue"].includes(k)
                            ? "text-right font-mono font-medium"
                            : ""
                        )}
                      >
                        {k === "quadrant" ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              v === "Star"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : v === "Plowhorse"
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : v === "Puzzle"
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                            )}
                          >
                            {v}
                          </span>
                        ) : k === "status" ? (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                              v === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-stone-100 text-stone-700 border border-stone-200"
                            )}
                          >
                            {v}
                          </span>
                        ) : k === "staleSession" ? (
                          v ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              ⚠️ STALE (&gt;4h)
                            </span>
                          ) : (
                            <span className="text-stone-400">No</span>
                          )
                        ) : (k === "p90ResolutionMin" || k === "p99ResolutionMin") && v === null ? (
                          <span className="text-stone-400 italic">P50 / max</span>
                        ) : typeof v === "boolean" ? (
                          v ? "YES" : "NO"
                        ) : v === null || v === undefined ? (
                          "—"
                        ) : (
                          String(v)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-staff-surface p-2.5 border-t border-staff-border-subtle text-right text-xs text-staff-text-secondary font-mono">
            Total Rows: {reportData.rows.length} · Currency: {currency}
          </div>
        </div>
      )}

      {/* 6. Saved Reports Drawer */}
      {savedDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-staff-surface-raised h-full shadow-2xl border-l border-staff-border-subtle flex flex-col p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-staff-border-subtle">
              <h2 className="text-base font-bold text-staff-text-primary">
                📁 Saved Report Queries
              </h2>
              <button
                onClick={() => setSavedDrawerOpen(false)}
                className="text-staff-text-secondary hover:text-staff-text-primary text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {savedReports.length === 0 ? (
                <div className="text-center py-12 text-staff-text-secondary text-xs">
                  No saved report queries yet. Click &quot;Save Query&quot; on any view to bookmark parameters.
                </div>
              ) : (
                savedReports.map((sr) => (
                  <div
                    key={sr.id}
                    className="p-3 rounded-lg border border-staff-border-subtle bg-staff-surface hover:border-black/30 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-staff-text-primary">
                        {sr.name}
                      </span>
                      <button
                        onClick={() => handleDeleteSavedReport(sr.id, sr.name)}
                        className="text-red-500 hover:text-red-700 text-xs px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                        title="Delete query"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="text-[11px] text-staff-text-secondary space-y-0.5 font-mono">
                      <div>View: {sr.view}</div>
                      <div>
                        Range: {sr.params.dateFrom ?? "-"} → {sr.params.dateTo ?? "-"}
                      </div>
                      <div className="text-[10px] text-staff-text-secondary/70">
                        Saved by {sr.createdBy?.name ?? "Staff"} on {sr.createdAt.slice(0, 10)}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedView(sr.view);
                        const vMeta = VIEW_METAS.find((v) => v.id === sr.view);
                        if (vMeta) setSelectedCategory(vMeta.category);
                        if (sr.params.dateFrom) setDateFrom(sr.params.dateFrom);
                        if (sr.params.dateTo) setDateTo(sr.params.dateTo);
                        setSavedDrawerOpen(false);
                      }}
                      className="w-full py-1 text-xs font-semibold rounded bg-black text-white hover:bg-neutral-800 transition-colors mt-1"
                    >
                      Run Query
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. Save Query Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-staff-surface-raised rounded-lg shadow-xl border border-staff-border-subtle p-6 space-y-4">
            <h3 className="text-sm font-bold text-staff-text-primary">
              💾 Save Report Query
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="reportName" className="text-xs font-medium text-staff-text-secondary">
                Report Name:
              </label>
              <input
                id="reportName"
                type="text"
                value={newReportName}
                onChange={(e) => setNewReportName(e.target.value)}
                placeholder="e.g. Weekly Mains Latency"
                className="w-full px-3 py-1.5 text-xs rounded border border-staff-border-subtle bg-staff-surface text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            <div className="text-[11px] text-staff-text-secondary font-mono bg-staff-surface p-2 rounded border border-staff-border-subtle">
              <div>View: {selectedView}</div>
              <div>Date Range: {dateFrom} → {dateTo}</div>
            </div>

            {saveError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {saveError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded border border-staff-border-subtle text-staff-text-secondary hover:text-staff-text-primary hover:bg-staff-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-black text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Query"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
