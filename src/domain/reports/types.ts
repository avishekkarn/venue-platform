/**
 * Domain types and contracts for Milestone 8.7 — Reports & Operational Intelligence Hub.
 *
 * Governed by:
 * - DECISIONS.md D-2.1 (zero guest PII)
 * - DECISIONS.md D-10.2 (strict venue scoping)
 * - DECISIONS.md D-12.1 (date range <= 180 days)
 * - DECISIONS.md D-12.2, D-12.5 (CSV export standard)
 * - DECISIONS.md D-12.4 (per-record audit only, no aggregate surveillance)
 * - DECISIONS.md D-12.6 (snapshotted categoryName)
 * - DECISIONS.md D-12.7 (saved reports and report-run auditing)
 * - BUILD.md §5.4 (pure domain, zero database imports)
 * - BUILD.md §7.1 (all money as decimal strings, never numbers)
 */

export interface ReportDateRange {
  readonly dateFrom: string; // ISO date string YYYY-MM-DD
  readonly dateTo: string;   // ISO date string YYYY-MM-DD
}

// 1. Revenue Summary
export interface RevenueSummaryRow {
  readonly date: string;
  readonly placeType: string;
  readonly completedOrders: number;
  readonly subtotal: string;
  readonly taxCollected: string;
  readonly totalRevenue: string;
  readonly currency: string;
}

// 2. Sales by Item
export interface ItemSalesRow {
  readonly category: string;
  readonly itemName: string;
  readonly unitsSold: number;
  readonly baseRevenue: string;
  readonly modifierRevenue: string;
  readonly lineRevenue: string;
  readonly modifierAttachRate: string; // formatted percentage e.g. "25.0%"
}

// 3. Order Funnel & Latency
export interface OrderFunnelRow {
  readonly date: string;
  readonly ordersPlaced: number;
  readonly approved: number;
  readonly preparing: number;
  readonly ready: number;
  readonly delivered: number;
  readonly completed: number;
  readonly cancelled: number;
  readonly avgApprovalSec: number;
  readonly avgPrepSec: number;
  readonly avgDeliverySec: number;
  readonly avgCycleSec: number;
}

// 4. Service Requests Report
export interface ServiceRequestsRow {
  readonly serviceType: string;
  readonly submitted: number;
  readonly completed: number;
  readonly declined: number;
  readonly cancelled: number;
  readonly avgResolutionMin: number;
}

// 5. Place Utilization
export interface PlaceUtilizationRow {
  readonly placeType: string;
  readonly placeNumber: string;
  readonly category: string;
  readonly sessions: number;
  readonly avgDwellMin: number;
  readonly orders: number;
  readonly revenue: string;
  readonly conversionPct: string; // e.g. "50.0%"
}

// 6. QR & Session Lifecycle
export interface QrLifecycleRow {
  readonly tokenId: string;
  readonly placeType: string;
  readonly placeLabel: string;
  readonly status: "ACTIVE" | "REVOKED";
  readonly issued: string;
  readonly revoked: string;
  readonly sessionsGenerated: number;
}

// 7. Payment Reconciliation (v1 Empty-State per D-7.1, D-7.7)
export interface PaymentReconciliationStatus {
  readonly status: "INACTIVE_V1_SCOPE";
  readonly commentary: string;
}

// 8. Per-Record Audit Export
export interface AuditExportRow {
  readonly timestamp: string;
  readonly recordType: "ORDER" | "SERVICE_REQUEST";
  readonly entityId: string;
  readonly targetState: string;
  readonly staffName: string;
  readonly staffUsername: string;
  readonly note: string;
}

// 9. Hourly Heatmap
export interface HourlyHeatmapRow {
  readonly date: string;
  readonly hour: number; // 0..23
  readonly orders: number;
  readonly revenue: string;
}

// 10. Menu Engineering Matrix
export type MenuMatrixQuadrant = "Star" | "Plowhorse" | "Puzzle" | "Dog";

export interface MenuMatrixRow {
  readonly itemName: string;
  readonly unitsSold: number;
  readonly lineRevenue: string;
  readonly quadrant: MenuMatrixQuadrant;
}

// 11. Modifier Attach-Rate
export interface ModifierAttachRow {
  readonly modifierGroup: string;
  readonly modifierOption: string;
  readonly timesSelected: number;
  readonly revenue: string;
  readonly attachRatePct: string;
}

// 12. Tax Remittance Report
export interface TaxRemittanceRow {
  readonly period: string;
  readonly taxRate: string;
  readonly taxableSubtotal: string;
  readonly taxCollected: string;
  readonly orders: number;
}

// 13. Cancellation Root-Cause
export interface CancellationRootCauseRow {
  readonly date: string;
  readonly cancelledOrders: number;
  readonly topReason: string;
  readonly reasonCount: number;
}

// 14. Service SLA Dashboard
export interface ServiceSlaRow {
  readonly serviceType: string;
  readonly p50ResolutionMin: number;
  readonly p90ResolutionMin: number;
  readonly p99ResolutionMin: number;
  readonly openNow: number;
}

// 15. Room Folio Report
export interface RoomFolioRow {
  readonly room: string;
  readonly stayStart: string;
  readonly stayEnd: string;
  readonly orders: number;
  readonly requests: number;
  readonly orderRevenue: string;
  readonly requestCount: number;
}

// 16. Occupancy & Dwell
export interface OccupancyDwellRow {
  readonly placeType: string;
  readonly period: string;
  readonly totalSessions: number;
  readonly avgDwellMin: number;
  readonly peakConcurrent: number;
}

// 17. QR Scan-to-Order Conversion
export interface ConversionRow {
  readonly token: string;
  readonly placeType: string;
  readonly sessions: number;
  readonly orders: number;
  readonly conversionPct: string;
  readonly revenuePerSession: string;
}
