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
  readonly p50ApprovalSec: number;
  readonly p90ApprovalSec: number;
  readonly maxApprovalSec: number;
  readonly avgPrepSec: number;
  readonly p50PrepSec: number;
  readonly p90PrepSec: number;
  readonly maxPrepSec: number;
  readonly avgDeliverySec: number;
  readonly p50DeliverySec: number;
  readonly p90DeliverySec: number;
  readonly maxDeliverySec: number;
  readonly avgCloseOutSec: number;
  readonly p50CloseOutSec: number;
  readonly p90CloseOutSec: number;
  readonly maxCloseOutSec: number;
  readonly avgCycleSec: number;
  readonly p50CycleSec: number;
  readonly p90CycleSec: number;
  readonly maxCycleSec: number;
}

export interface OrderAnomalyRow {
  readonly orderId: string;
  readonly date: string;
  readonly segment: string;
  readonly durationSec: number;
  readonly p90ThresholdSec: number;
}

// 4. Service Requests Report
export interface ServiceRequestsRow {
  readonly serviceType: string;
  readonly submitted: number;
  readonly completed: number;
  readonly declined: number;
  readonly cancelled: number;
  readonly avgResolutionMin: number | null; // null rendered as "—" when completed = 0
}

// 5. Place Utilization
export interface PlaceUtilizationRow {
  readonly placeType: string;
  readonly placeNumber: string;
  readonly category: string;
  readonly sessionsClosed: number;
  readonly activeSessions: number;
  readonly avgDwellMin: number;
  readonly maxDwellMin: number;
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
  readonly revokedBy: string;
  readonly revocationReason: string;
  readonly sessionsGenerated: number;
}

// 7. Payment Reconciliation
export interface PaymentReconciliationStatus {
  readonly status: "INACTIVE_V1_SCOPE";
  readonly totalCashCollected: string;
  readonly completedOrdersCount: number;
  readonly commentary: string;
}

export interface PaymentReconciliationRow {
  readonly paymentTicketId: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly state: string;
  readonly paymentMethod: string;
  readonly confirmedAt: string;
  readonly receiptId: string;
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
  readonly hour: number; // 0..23 in venue local time (D-11.5)
  readonly placeType: string; // TABLE, ROOM, COUNTER
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
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly taxRate: string;
  readonly taxRatePct: string;
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
  readonly n: number;
  readonly p50ResolutionMin: number;
  readonly p90ResolutionMin: number | null; // suppressed if N < 20
  readonly p99ResolutionMin: number | null; // suppressed if N < 20
  readonly maxResolutionMin: number;
  readonly openAtEndOfPeriod: number;
}

// 15. Room Folio Report
export interface RoomFolioRow {
  readonly room: string;
  readonly stayStart: string;
  readonly stayEnd: string | null;
  readonly status: "ACTIVE" | "CLOSED";
  readonly orders: number;
  readonly requests: number;
  readonly orderRevenue: string;
  readonly requestCount: number;
  readonly staleSession: boolean;
}

// 16. Occupancy & Dwell
export interface OccupancyDwellRow {
  readonly placeType: string;
  readonly placeNumber: string;
  readonly period: string;
  readonly totalSessions: number;
  readonly avgDwellMin: number;
  readonly peakConcurrent: number;
  readonly staleSessions: number;
}

// 17. QR Scan-to-Order Conversion
export interface ConversionRow {
  readonly token: string;
  readonly placeType: string;
  readonly placeLabel: string;
  readonly sessions: number;
  readonly orders: number;
  readonly conversionPct: string;
  readonly revenuePerSession: string;
}

// Data Quality Meta Envelope
export interface ReportQualityMeta {
  readonly uncategorizedItemPct: number;
  readonly outlierOrders: number;
  readonly tipsTracked: boolean;
  readonly paymentMethodsTracked: boolean;
  readonly staleSessions?: number;
}
