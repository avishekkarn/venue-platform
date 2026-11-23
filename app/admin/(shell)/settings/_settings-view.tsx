"use client";

import { useState, type JSX } from "react";
import { getCsrfToken } from "@/lib/csrf-client";
import { SUPPORTED_CURRENCIES } from "@/domain/settings/update-regional";
import type { VenueSettings, TaxRateSummary } from "@/domain/settings/types";

interface ModuleItem {
  readonly module: string;
  isEnabled: boolean;
}

interface ServiceItem {
  readonly service: string;
  isEnabled: boolean;
}

interface AuditRunItem {
  readonly id: string;
  readonly ranAt: string;
  readonly rowCount: number;
  readonly params: Record<string, unknown>;
  readonly staffName: string;
}

interface SettingsViewProps {
  readonly venueName: string;
  readonly initialSettings: VenueSettings;
  readonly initialTaxRates: readonly TaxRateSummary[];
  readonly initialModules: readonly ModuleItem[];
  readonly initialServices: readonly ServiceItem[];
  readonly initialAuditRuns: readonly AuditRunItem[];
}

type TabKey = "general" | "regional" | "tax" | "modules" | "audit" | "recovery";

const TIMEZONES = [
  "Asia/Kathmandu",
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Bangkok",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const MODULE_LABELS: Record<string, { label: string; desc: string }> = {
  TABLE: { label: "Table Dining", desc: "QR ordering and service calls at dining tables" },
  ROOM: { label: "Room Service", desc: "Hotel room service ordering and hospitality requests" },
  COUNTER: { label: "Takeaway / Counter", desc: "Fast-casual counter and takeaway orders" },
  KITCHEN: { label: "Kitchen Display (KDS)", desc: "Real-time kitchen order preparation screen" },
};

const SERVICE_LABELS: Record<string, string> = {
  ROOM_SERVICE_FOOD: "In-Room Food Delivery",
  HOUSEKEEPING: "Housekeeping & Cleaning",
  MAINTENANCE: "Engineering & Maintenance",
  CONCIERGE: "Concierge & Luggage Assistance",
  LAUNDRY: "Laundry & Dry Cleaning",
  SPA: "Spa & Wellness Services",
  LATE_CHECKOUT: "Late Checkout Requests",
  WAKE_UP_CALL: "Wake-Up Call Scheduling",
  DO_NOT_DISTURB: "Do Not Disturb Status",
  CALL_WAITER: "Call Staff / Waiter",
  REQUEST_BILL: "Request Bill & Payment",
};

export function SettingsView({
  venueName,
  initialSettings,
  initialTaxRates,
  initialModules,
  initialServices,
  initialAuditRuns,
}: SettingsViewProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [settings, setSettings] = useState<VenueSettings>(initialSettings);
  const [taxRates, setTaxRates] = useState<TaxRateSummary[]>([...initialTaxRates]);
  const [modules, setModules] = useState<ModuleItem[]>([...initialModules]);
  const [services, setServices] = useState<ServiceItem[]>([...initialServices]);
  const [auditRuns, setAuditRuns] = useState<AuditRunItem[]>([...initialAuditRuns]);

  // Status / Feedback
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // General Form State
  const [generalForm, setGeneralForm] = useState({
    contactName: initialSettings.contactName ?? "",
    contactPhone: initialSettings.contactPhone ?? "",
    contactEmail: initialSettings.contactEmail ?? "",
    counterPhone: initialSettings.counterPhone ?? "",
    receiptHeader: initialSettings.receiptHeader ?? "",
    receiptFooter: initialSettings.receiptFooter ?? "",
  });

  // Regional Form State
  const [regionalForm, setRegionalForm] = useState({
    currency: initialSettings.currency,
    timezone: initialSettings.timezone,
    timeFormat: initialSettings.timeFormat,
  });
  const [pendingTzChange, setPendingTzChange] = useState<string | null>(null);

  // New Tax Rate Modal State
  const [isAddingTaxRate, setIsAddingTaxRate] = useState(false);
  const [newTaxForm, setNewTaxForm] = useState({
    name: "",
    ratePercent: "13.00",
    isDefault: false,
    isInclusive: false,
  });

  // Audit Export Form State
  const todayStr = new Date().toISOString().substring(0, 10);
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const [auditExportForm, setAuditExportForm] = useState({
    from: thirtyDaysAgoStr,
    to: todayStr,
    audience: "ALL",
  });
  const [isExportingAudit, setIsExportingAudit] = useState(false);

  // Seed Snapshot State
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);

  function showMessage(type: "success" | "error", text: string) {
    setStatusMsg({ type, text });
    setTimeout(() => {
      setStatusMsg((cur) => (cur?.text === text ? null : cur));
    }, 5000);
  }

  // --- GENERAL SAVE ---
  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        body: JSON.stringify({
          contactName: generalForm.contactName || null,
          contactPhone: generalForm.contactPhone || null,
          contactEmail: generalForm.contactEmail || null,
          counterPhone: generalForm.counterPhone || null,
          receiptHeader: generalForm.receiptHeader || null,
          receiptFooter: generalForm.receiptFooter || null,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        showMessage("error", body?.error?.message ?? "Failed to save contact settings.");
        return;
      }

      setSettings(body.data);
      showMessage("success", "General contact and receipt settings saved successfully.");
    } catch {
      showMessage("error", "Network error while saving settings.");
    } finally {
      setIsSaving(false);
    }
  }

  // --- REGIONAL SAVE ---
  async function handleSaveRegional(confirmedTz?: string) {
    setIsSaving(true);
    setStatusMsg(null);

    const tzToSave = confirmedTz ?? regionalForm.timezone;

    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        body: JSON.stringify({
          currency: regionalForm.currency,
          timezone: tzToSave,
          timeFormat: regionalForm.timeFormat,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        showMessage("error", body?.error?.message ?? "Failed to save regional settings.");
        return;
      }

      setSettings(body.data);
      setRegionalForm({
        currency: body.data.currency,
        timezone: body.data.timezone,
        timeFormat: body.data.timeFormat,
      });
      setPendingTzChange(null);
      showMessage("success", "Regional and localization settings updated.");
    } catch {
      showMessage("error", "Network error while saving regional settings.");
    } finally {
      setIsSaving(false);
    }
  }

  // --- TAX RATE CREATION ---
  async function handleCreateTaxRate(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    const parsedRateNum = parseFloat(newTaxForm.ratePercent);
    if (isNaN(parsedRateNum) || parsedRateNum < 0 || parsedRateNum > 100) {
      showMessage("error", "Tax rate percentage must be between 0% and 100%.");
      setIsSaving(false);
      return;
    }

    const decimalRate = (parsedRateNum / 100).toFixed(4);

    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/settings/tax-rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        body: JSON.stringify({
          name: newTaxForm.name.trim(),
          rate: decimalRate,
          isDefault: newTaxForm.isDefault,
          isInclusive: newTaxForm.isInclusive,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        showMessage("error", body?.error?.message ?? "Failed to create tax rate.");
        return;
      }

      // Refresh list
      const listRes = await fetch("/api/admin/settings/tax-rates");
      if (listRes.ok) {
        const listBody = await listRes.json();
        setTaxRates(listBody.data);
      }

      setIsAddingTaxRate(false);
      setNewTaxForm({ name: "", ratePercent: "13.00", isDefault: false, isInclusive: false });
      showMessage("success", `Tax rate '${body.data.name}' created successfully.`);
    } catch {
      showMessage("error", "Network error while creating tax rate.");
    } finally {
      setIsSaving(false);
    }
  }

  // --- TOGGLE TAX RATE ACTIVE OR DEFAULT ---
  async function handleUpdateTaxRate(id: string, updates: { isDefault?: boolean; isActive?: boolean }) {
    try {
      const csrf = getCsrfToken();
      const res = await fetch(`/api/admin/settings/tax-rates/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        body: JSON.stringify(updates),
      });

      const body = await res.json();
      if (!res.ok) {
        showMessage("error", body?.error?.message ?? "Failed to update tax rate.");
        return;
      }

      // Refresh list
      const listRes = await fetch("/api/admin/settings/tax-rates");
      if (listRes.ok) {
        const listBody = await listRes.json();
        setTaxRates(listBody.data);
      }
      showMessage("success", "Tax rate updated.");
    } catch {
      showMessage("error", "Network error while updating tax rate.");
    }
  }

  // --- MODULE TOGGLE ---
  async function handleToggleModule(moduleName: string, isEnabled: boolean) {
    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/modules", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        body: JSON.stringify({ module: moduleName, isEnabled }),
      });

      if (!res.ok) {
        const body = await res.json();
        showMessage("error", body?.error?.message ?? "Failed to update module.");
        return;
      }

      setModules((prev) =>
        prev.map((m) => (m.module === moduleName ? { ...m, isEnabled } : m))
      );
      showMessage("success", `Module ${moduleName} ${isEnabled ? "enabled" : "disabled"}.`);
    } catch {
      showMessage("error", "Network error while updating module.");
    }
  }

  // --- SERVICE TOGGLE ---
  async function handleToggleService(serviceName: string, isEnabled: boolean) {
    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
        body: JSON.stringify({ service: serviceName, isEnabled }),
      });

      if (!res.ok) {
        const body = await res.json();
        showMessage("error", body?.error?.message ?? "Failed to update hotel service.");
        return;
      }

      setServices((prev) =>
        prev.map((s) => (s.service === serviceName ? { ...s, isEnabled } : s))
      );
      showMessage("success", `Service updated.`);
    } catch {
      showMessage("error", "Network error while updating service.");
    }
  }

  // --- AUDIT CSV EXPORT ---
  function handleDownloadAuditCsv() {
    setIsExportingAudit(true);
    const url = `/api/admin/settings/audit-export?from=${encodeURIComponent(
      auditExportForm.from
    )}&to=${encodeURIComponent(auditExportForm.to)}&audience=${encodeURIComponent(
      auditExportForm.audience
    )}`;
    window.location.href = url;
    setTimeout(() => {
      setIsExportingAudit(false);
      showMessage("success", "Audit CSV export initiated.");
    }, 1500);
  }

  // --- REGENERATE SEED SNAPSHOT ---
  async function handleRegenerateSnapshot() {
    setIsGeneratingSnapshot(true);
    try {
      const csrf = getCsrfToken();
      const res = await fetch("/api/admin/settings/seed-snapshot", {
        method: "POST",
        headers: {
          ...(csrf ? { "x-csrf-token": csrf } : {}),
        },
      });

      const body = await res.json();
      if (!res.ok) {
        showMessage("error", body?.error?.message ?? "Failed to regenerate seed snapshot.");
        return;
      }

      showMessage("success", `Reference snapshot successfully saved to ${body.data.path}`);
    } catch {
      showMessage("error", "Network error regenerating snapshot.");
    } finally {
      setIsGeneratingSnapshot(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-staff-border-subtle pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-staff-text-primary">
            Venue Settings
          </h1>
          <p className="text-sm text-staff-text-secondary mt-1">
            Operational self-sufficiency, tax configuration, regional compliance, and disaster recovery.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-staff-surface-sunken text-staff-text-secondary font-mono">
            {venueName} ({settings.slug})
          </span>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusMsg && (
        <div
          role="alert"
          className={`px-4 py-3 rounded-md text-sm border flex items-center justify-between transition-all ${
            statusMsg.type === "success"
              ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-200"
              : "bg-rose-950/40 border-rose-800/80 text-rose-200"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-xs underline hover:no-underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-staff-border-subtle overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "general"
              ? "border-staff-brand text-staff-text-primary font-semibold"
              : "border-transparent text-staff-text-secondary hover:text-staff-text-primary"
          }`}
        >
          General & Contact
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("regional")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "regional"
              ? "border-staff-brand text-staff-text-primary font-semibold"
              : "border-transparent text-staff-text-secondary hover:text-staff-text-primary"
          }`}
        >
          Regional & Time
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tax")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "tax"
              ? "border-staff-brand text-staff-text-primary font-semibold"
              : "border-transparent text-staff-text-secondary hover:text-staff-text-primary"
          }`}
        >
          Tax Rates ({taxRates.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("modules")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "modules"
              ? "border-staff-brand text-staff-text-primary font-semibold"
              : "border-transparent text-staff-text-secondary hover:text-staff-text-primary"
          }`}
        >
          Modules & Services
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "audit"
              ? "border-staff-brand text-staff-text-primary font-semibold"
              : "border-transparent text-staff-text-secondary hover:text-staff-text-primary"
          }`}
        >
          Audit Export
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recovery")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "recovery"
              ? "border-staff-brand text-staff-text-primary font-semibold"
              : "border-transparent text-staff-text-secondary hover:text-staff-text-primary"
          }`}
        >
          Data & Recovery
        </button>
      </div>

      {/* TAB 1: GENERAL & CONTACT */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="flex flex-col gap-6 max-w-3xl">
          <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-staff-text-primary border-b border-staff-border-subtle pb-2">
              Venue Contact Information (D-9.16)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                  Contact Person / Manager Name
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={generalForm.contactName}
                  onChange={(e) => setGeneralForm({ ...generalForm, contactName: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={generalForm.contactPhone}
                  onChange={(e) => setGeneralForm({ ...generalForm, contactPhone: e.target.value })}
                  placeholder="e.g. +977-1-4444444"
                  className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                  Contact Email Address
                </label>
                <input
                  type="email"
                  maxLength={150}
                  value={generalForm.contactEmail}
                  onChange={(e) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })}
                  placeholder="e.g. hospitality@juniper.com"
                  className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                  Front Desk / Counter Hotline Phone
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={generalForm.counterPhone}
                  onChange={(e) => setGeneralForm({ ...generalForm, counterPhone: e.target.value })}
                  placeholder="e.g. +977-1-4444445"
                  className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
                />
              </div>
            </div>
          </div>

          <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-staff-text-primary border-b border-staff-border-subtle pb-2">
              Receipt Header & Footer Customization (D-9.18)
            </h2>
            <div>
              <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                Receipt Header Lines (PAN / VAT / Registration & Physical Address)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={generalForm.receiptHeader}
                onChange={(e) => setGeneralForm({ ...generalForm, receiptHeader: e.target.value })}
                placeholder="e.g. PAN: 601234567&#10;Kathmandu, Ward 4, Nepal"
                className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
              />
              <span className="text-[11px] text-staff-text-secondary">
                Printed at the top of customer receipts before line items. Maximum 500 characters.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                Receipt Footer Lines (Courtesy Notes & Wi-Fi Details)
              </label>
              <textarea
                rows={2}
                maxLength={500}
                value={generalForm.receiptFooter}
                onChange={(e) => setGeneralForm({ ...generalForm, receiptFooter: e.target.value })}
                placeholder="e.g. Thank you for dining with us!&#10;Guest Wi-Fi: JuniperGuest / Key: welcome2026"
                className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
              />
              <span className="text-[11px] text-staff-text-secondary">
                Printed at the bottom of customer receipts after tax totals.
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded bg-staff-brand text-staff-surface-sunken font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? "Saving..." : "Save Contact Settings"}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: REGIONAL & TIME */}
      {activeTab === "regional" && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-staff-text-primary border-b border-staff-border-subtle pb-2">
              Currency & Accounting Unit (D-11.6)
            </h2>
            <div>
              <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                Operational Currency
              </label>
              <select
                disabled={settings.isCurrencyLocked}
                value={regionalForm.currency}
                onChange={(e) => setRegionalForm({ ...regionalForm, currency: e.target.value })}
                className="w-full sm:w-64 bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-staff-brand"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {settings.isCurrencyLocked ? (
                <p className="text-xs text-amber-400 mt-2 flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>
                    Currency is locked as immutable because historical orders exist in the database (D-11.6).
                  </span>
                </p>
              ) : (
                <p className="text-xs text-staff-text-secondary mt-1">
                  Editable during venue setup. Will lock automatically upon first live order.
                </p>
              )}
            </div>
          </div>

          <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-5 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-staff-text-primary border-b border-staff-border-subtle pb-2">
              Timezone & Formatting (D-11.6)
            </h2>
            <div>
              <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                Venue Timezone
              </label>
              <select
                value={regionalForm.timezone}
                onChange={(e) => {
                  const newTz = e.target.value;
                  if (newTz !== settings.timezone) {
                    setPendingTzChange(newTz);
                  } else {
                    setPendingTzChange(null);
                    setRegionalForm({ ...regionalForm, timezone: newTz });
                  }
                }}
                className="w-full sm:w-80 bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-staff-text-secondary mt-1">
                Governs business day boundaries, report groupings, and shift schedules.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-staff-text-secondary mb-2">
                Time Display Format
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-staff-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="12h"
                    checked={regionalForm.timeFormat === "12h"}
                    onChange={() => setRegionalForm({ ...regionalForm, timeFormat: "12h" })}
                    className="text-staff-brand"
                  />
                  <span>12-Hour (e.g. 2:30 PM)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-staff-text-primary cursor-pointer">
                  <input
                    type="radio"
                    name="timeFormat"
                    value="24h"
                    checked={regionalForm.timeFormat === "24h"}
                    onChange={() => setRegionalForm({ ...regionalForm, timeFormat: "24h" })}
                    className="text-staff-brand"
                  />
                  <span>24-Hour (e.g. 14:30)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveRegional()}
              className="px-5 py-2 rounded bg-staff-brand text-staff-surface-sunken font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSaving ? "Saving..." : "Save Regional Settings"}
            </button>
          </div>

          {/* Timezone Confirmation Warning Modal */}
          {pendingTzChange && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg max-w-md w-full p-6 flex flex-col gap-4 shadow-xl">
                <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                  <span>⚠️</span> Confirm Timezone Change
                </h3>
                <p className="text-sm text-staff-text-secondary leading-relaxed">
                  Changing venue timezone from{" "}
                  <strong className="text-staff-text-primary">{settings.timezone}</strong> to{" "}
                  <strong className="text-staff-text-primary">{pendingTzChange}</strong> affects
                  daily reporting boundaries, calendar aggregation, and active order timestamps.
                </p>
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingTzChange(null);
                      setRegionalForm({ ...regionalForm, timezone: settings.timezone });
                    }}
                    className="px-4 py-2 text-sm rounded bg-staff-surface-sunken text-staff-text-secondary hover:text-staff-text-primary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegionalForm({ ...regionalForm, timezone: pendingTzChange });
                      handleSaveRegional(pendingTzChange);
                    }}
                    className="px-4 py-2 text-sm rounded bg-amber-600 text-white font-medium hover:bg-amber-500"
                  >
                    Confirm & Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TAX RATES */}
      {activeTab === "tax" && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-staff-text-primary">
                Hierarchical Tax Rates (D-4.13)
              </h2>
              <p className="text-sm text-staff-text-secondary">
                Three-tier tax resolution: Menu Item Override &gt; Category Override &gt; Venue Default &gt; Fallback ({settings.taxRateFallback}).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingTaxRate(true)}
              className="px-4 py-2 rounded bg-staff-brand text-staff-surface-sunken text-sm font-medium hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              + Add Tax Rate
            </button>
          </div>

          <div className="overflow-x-auto border border-staff-border-subtle rounded-lg bg-staff-surface-raised">
            <table className="w-full text-left text-sm">
              <thead className="bg-staff-surface-sunken text-xs uppercase text-staff-text-secondary border-b border-staff-border-subtle font-mono">
                <tr>
                  <th className="py-3 px-4">Rate Name</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Calculation</th>
                  <th className="py-3 px-4">Default</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-staff-border-subtle">
                {taxRates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-staff-text-secondary">
                      No tax rates configured. Venue baseline fallback applies.
                    </td>
                  </tr>
                ) : (
                  taxRates.map((tr) => {
                    const percentDisplay = (parseFloat(tr.rate) * 100).toFixed(2) + "%";
                    return (
                      <tr key={tr.id} className="hover:bg-staff-surface-sunken/40">
                        <td className="py-3.5 px-4 font-medium text-staff-text-primary">
                          {tr.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-staff-text-primary font-semibold">
                          {percentDisplay}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-staff-text-secondary">
                          {tr.isInclusive ? "Inclusive (Gross)" : "Exclusive (Net)"}
                        </td>
                        <td className="py-3.5 px-4">
                          {tr.isDefault ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Venue Default
                            </span>
                          ) : (
                            <span className="text-xs text-staff-text-secondary">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              tr.isActive
                                ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {tr.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-staff-text-secondary">
                          {tr.usageCount ?? 0} entity overrides
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          {!tr.isDefault && tr.isActive && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTaxRate(tr.id, { isDefault: true })}
                              className="text-xs text-staff-brand hover:underline font-medium"
                            >
                              Make Default
                            </button>
                          )}
                          {!tr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleUpdateTaxRate(tr.id, { isActive: !tr.isActive })}
                              className="text-xs text-staff-text-secondary hover:text-staff-text-primary underline ml-2"
                            >
                              {tr.isActive ? "Deactivate" : "Activate"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-lg bg-staff-surface-sunken border border-staff-border-subtle text-xs text-staff-text-secondary leading-relaxed">
            <strong>Immutability Policy (D-4.13):</strong> Tax rate percentages are frozen upon creation and cannot be edited. If statutory tax rates change, create a new tax rate and deactivate the old one. This preserves historical invoice snapshots without retroactive calculation drift.
          </div>

          {/* Add Tax Rate Modal */}
          {isAddingTaxRate && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg max-w-md w-full p-6 flex flex-col gap-4 shadow-xl">
                <h3 className="text-base font-bold text-staff-text-primary">
                  Create New Tax Rate
                </h3>
                <form onSubmit={handleCreateTaxRate} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                      Rate Name
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={newTaxForm.name}
                      onChange={(e) => setNewTaxForm({ ...newTaxForm, name: e.target.value })}
                      placeholder="e.g. Standard VAT, Alcohol Tax"
                      className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary focus:outline-none focus:ring-1 focus:ring-staff-brand"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                      Rate Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        value={newTaxForm.ratePercent}
                        onChange={(e) => setNewTaxForm({ ...newTaxForm, ratePercent: e.target.value })}
                        className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary pr-8 focus:outline-none focus:ring-1 focus:ring-staff-brand"
                      />
                      <span className="absolute right-3 top-2 text-sm text-staff-text-secondary font-mono">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2 text-xs text-staff-text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTaxForm.isInclusive}
                        onChange={(e) => setNewTaxForm({ ...newTaxForm, isInclusive: e.target.checked })}
                      />
                      <span>Inclusive Tax (Prices already include this tax)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-staff-text-primary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newTaxForm.isDefault}
                        onChange={(e) => setNewTaxForm({ ...newTaxForm, isDefault: e.target.checked })}
                      />
                      <span>Set as Venue Default Tax Rate</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 mt-4 border-t border-staff-border-subtle pt-3">
                    <button
                      type="button"
                      onClick={() => setIsAddingTaxRate(false)}
                      className="px-4 py-2 text-sm rounded bg-staff-surface-sunken text-staff-text-secondary hover:text-staff-text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 text-sm rounded bg-staff-brand text-staff-surface-sunken font-medium hover:opacity-90 disabled:opacity-50"
                    >
                      {isSaving ? "Creating..." : "Create Tax Rate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MODULES & SERVICES */}
      {activeTab === "modules" && (
        <div className="flex flex-col gap-8 max-w-4xl">
          {/* Module Toggles */}
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-staff-text-primary border-b border-staff-border-subtle pb-2">
              Operational Venue Modules (D-9.6)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((m) => {
                const info = MODULE_LABELS[m.module] ?? { label: m.module, desc: "" };
                return (
                  <div
                    key={m.module}
                    className="p-4 rounded-lg bg-staff-surface-raised border border-staff-border-subtle flex items-start justify-between gap-4"
                  >
                    <div>
                      <h3 className="text-sm font-semibold text-staff-text-primary">
                        {info.label}
                      </h3>
                      <p className="text-xs text-staff-text-secondary mt-1">
                        {info.desc}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.isEnabled}
                        onChange={(e) => handleToggleModule(m.module, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-staff-brand"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Toggles */}
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-staff-text-primary border-b border-staff-border-subtle pb-2">
              Hospitality Services Configuration (D-9.6)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map((s) => (
                <div
                  key={s.service}
                  className="p-3.5 rounded bg-staff-surface-raised border border-staff-border-subtle flex items-center justify-between gap-3"
                >
                  <span className="text-xs font-medium text-staff-text-primary">
                    {SERVICE_LABELS[s.service] ?? s.service}
                  </span>
                  <input
                    type="checkbox"
                    checked={s.isEnabled}
                    onChange={(e) => handleToggleService(s.service, e.target.checked)}
                    className="rounded text-staff-brand focus:ring-staff-brand w-4 h-4 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT EXPORT */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-5 flex flex-col gap-4">
            <div>
              <h2 className="text-base font-semibold text-staff-text-primary">
                Audit Log Audience-Filtered Extract (D-9.17)
              </h2>
              <p className="text-xs text-staff-text-secondary mt-1">
                Download statutory RFC 4180 CSV audit extracts partitioned by audience. Date range limited to 180 days (D-12.1).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={auditExportForm.from}
                  onChange={(e) => setAuditExportForm({ ...auditExportForm, from: e.target.value })}
                  className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={auditExportForm.to}
                  onChange={(e) => setAuditExportForm({ ...auditExportForm, to: e.target.value })}
                  className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-staff-text-secondary mb-1">
                  Audience Segmentation
                </label>
                <select
                  value={auditExportForm.audience}
                  onChange={(e) => setAuditExportForm({ ...auditExportForm, audience: e.target.value })}
                  className="w-full bg-staff-surface-sunken border border-staff-border-subtle rounded px-3 py-2 text-sm text-staff-text-primary"
                >
                  <option value="ALL">ALL (Blended Audit Stream)</option>
                  <option value="USER">USER (Guest Scans &amp; Orders)</option>
                  <option value="STAFF">STAFF (Queue Prep &amp; Approvals)</option>
                  <option value="ADMIN">ADMIN (Settings &amp; Staff CRUD)</option>
                  <option value="SYSTEM">SYSTEM (Maintenance &amp; Archival)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isExportingAudit}
                onClick={handleDownloadAuditCsv}
                className="px-5 py-2 rounded bg-staff-brand text-staff-surface-sunken font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                <span>📥</span>
                <span>{isExportingAudit ? "Preparing CSV..." : "Download Audit CSV"}</span>
              </button>
            </div>
          </div>

          {/* Recent Runs Table */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-staff-text-primary">
              Recent Audit Export Executions (ReportRun Log)
            </h3>
            <div className="overflow-x-auto border border-staff-border-subtle rounded-lg bg-staff-surface-raised">
              <table className="w-full text-left text-xs">
                <thead className="bg-staff-surface-sunken text-staff-text-secondary border-b border-staff-border-subtle font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Run Timestamp</th>
                    <th className="py-2.5 px-3">Executed By</th>
                    <th className="py-2.5 px-3">Date Window</th>
                    <th className="py-2.5 px-3">Audience Filter</th>
                    <th className="py-2.5 px-3">Rows Exported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-staff-border-subtle">
                  {auditRuns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-staff-text-secondary">
                        No recent audit export executions logged.
                      </td>
                    </tr>
                  ) : (
                    auditRuns.map((r) => (
                      <tr key={r.id}>
                        <td className="py-2.5 px-3 font-mono text-staff-text-primary">
                          {new Date(r.ranAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-staff-text-primary">{r.staffName}</td>
                        <td className="py-2.5 px-3 font-mono text-staff-text-secondary">
                          {String(r.params.from ?? "—")} to {String(r.params.to ?? "—")}
                        </td>
                        <td className="py-2.5 px-3 text-staff-text-secondary">
                          {String(r.params.audience ?? "ALL")}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-staff-text-primary">{r.rowCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DATA & RECOVERY */}
      {activeTab === "recovery" && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="bg-staff-surface-raised border border-staff-border-subtle rounded-lg p-6 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🛡️</div>
              <div>
                <h2 className="text-base font-bold text-staff-text-primary">
                  Disaster-Recovery Seed Snapshot (D-8.6)
                </h2>
                <p className="text-sm text-staff-text-secondary mt-1 leading-relaxed">
                  A self-contained JSON snapshot containing complete venue operational parameters, places, QR code tokens, menu hierarchies, and active staff account hashes.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded bg-staff-surface-sunken border border-staff-border-subtle text-xs text-staff-text-secondary space-y-2">
              <p>
                <strong>Cold Restore Command:</strong>
              </p>
              <code className="block p-2 rounded bg-black/40 font-mono text-emerald-400">
                pnpm seed:from-snapshot backups/seed/seed-snapshot.json
              </code>
              <p>
                Strictly free of guest PII, payment tokens, or historical order ledgers (D-2.1).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="/api/admin/settings/seed-snapshot"
                download
                className="px-4 py-2.5 rounded bg-staff-surface-sunken border border-staff-border-subtle text-staff-text-primary text-sm font-medium hover:bg-staff-surface-sunken/80 text-center flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>Download Seed Snapshot (JSON)</span>
              </a>

              <button
                type="button"
                disabled={isGeneratingSnapshot}
                onClick={handleRegenerateSnapshot}
                className="px-4 py-2.5 rounded bg-staff-brand text-staff-surface-sunken text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>{isGeneratingSnapshot ? "Regenerating..." : "Regenerate Server Snapshot"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
