/**
 * Pure domain calculator: Order Funnel & Latency (View 7 / View 3).
 *
 * Headers: Date,Orders Placed,Approved,Preparing,Ready,Delivered,Completed,Cancelled,Avg Approval Sec,P50 Approval Sec,P90 Approval Sec,Max Approval Sec,Avg Prep Sec,P50 Prep Sec,P90 Prep Sec,Max Prep Sec,Avg Delivery Sec,P50 Delivery Sec,P90 Delivery Sec,Max Delivery Sec,Avg Close-Out Sec,P50 Close-Out Sec,P90 Close-Out Sec,Max Close-Out Sec,Avg Cycle Sec,P50 Cycle Sec,P90 Cycle Sec,Max Cycle Sec
 *
 * Mathematical invariant:
 * |Cycle - (Approval + Prep + Delivery + Close-Out)| <= 1s per completed order.
 * Governed by D-4.7, D-4.8, D-4.9, D-4.10, BUILD.md §7.1, §11.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type OrderFunnelRow, type OrderAnomalyRow } from "./types";

export interface OrderStateChangeInput {
  readonly state: string;
  readonly occurredAt: Date | string;
}

export interface OrderFunnelInput {
  readonly id: string;
  readonly placedAt: Date | string;
  readonly state: string;
  readonly stateChanges: readonly OrderStateChangeInput[];
}

export interface OrderFunnelResult {
  readonly rows: OrderFunnelRow[];
  readonly anomalies: OrderAnomalyRow[];
}

function computeQuantiles(values: number[]): {
  mean: number;
  p50: number;
  p90: number;
  max: number;
} {
  if (values.length === 0) {
    return { mean: 0, p50: 0, p90: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = Math.round(sum / sorted.length);
  const max = sorted[sorted.length - 1] ?? 0;

  // P50 (median)
  const mid = Math.floor(sorted.length / 2);
  const p50 =
    sorted.length % 2 !== 0
      ? (sorted[mid] ?? 0)
      : Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);

  // P90
  const idx90 = Math.min(
    sorted.length - 1,
    Math.floor((sorted.length - 1) * 0.9)
  );
  const p90 = sorted[idx90] ?? max;

  return { mean, p50, p90, max };
}

export function generateOrderFunnel(
  orders: readonly OrderFunnelInput[]
): Result<OrderFunnelResult> {
  if (!Array.isArray(orders)) {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Orders must be an array");
  }

  interface Acc {
    date: string;
    placed: number;
    approved: number;
    preparing: number;
    ready: number;
    delivered: number;
    completed: number;
    cancelled: number;
    approvalDurations: number[];
    prepDurations: number[];
    deliveryDurations: number[];
    closeOutDurations: number[];
    cycleDurations: number[];
  }

  const map = new Map<string, Acc>();
  const orderDurations: Array<{
    id: string;
    date: string;
    approval: number | null;
    prep: number | null;
    delivery: number | null;
    closeOut: number | null;
    cycle: number | null;
  }> = [];

  for (const o of orders) {
    const placedDate = o.placedAt instanceof Date ? o.placedAt : new Date(o.placedAt);
    if (isNaN(placedDate.getTime())) continue;
    const dateStr = placedDate.toISOString().slice(0, 10);

    const current: Acc = map.get(dateStr) ?? {
      date: dateStr,
      placed: 0,
      approved: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      approvalDurations: [],
      prepDurations: [],
      deliveryDurations: [],
      closeOutDurations: [],
      cycleDurations: [],
    };

    current.placed += 1;

    // Track timestamps per state
    const timestamps = new Map<string, number>();
    timestamps.set("PLACED", placedDate.getTime());

    for (const sc of o.stateChanges ?? []) {
      const t = sc.occurredAt instanceof Date ? sc.occurredAt : new Date(sc.occurredAt);
      if (!isNaN(t.getTime())) {
        if (!timestamps.has(sc.state)) {
          timestamps.set(sc.state, t.getTime());
        }
      }
    }

    if (timestamps.has("APPROVED")) current.approved += 1;
    if (timestamps.has("PREPARING")) current.preparing += 1;
    if (timestamps.has("READY")) current.ready += 1;
    if (timestamps.has("DELIVERED")) current.delivered += 1;
    if (timestamps.has("COMPLETED") || o.state === "COMPLETED") current.completed += 1;
    if (timestamps.has("CANCELLED") || o.state === "CANCELLED") current.cancelled += 1;

    // Segment 1: Approval (APPROVED - PLACED)
    const placedTs = timestamps.get("PLACED");
    const approvedTs = timestamps.get("APPROVED");
    let approvalSec: number | null = null;
    if (placedTs && approvedTs && approvedTs >= placedTs) {
      approvalSec = Math.round((approvedTs - placedTs) / 1000);
      current.approvalDurations.push(approvalSec);
    }

    // Segment 2: Prep (READY - APPROVED)
    const startPrepTs = timestamps.get("APPROVED") ?? timestamps.get("PREPARING");
    const readyTs = timestamps.get("READY");
    let prepSec: number | null = null;
    if (startPrepTs && readyTs && readyTs >= startPrepTs) {
      prepSec = Math.round((readyTs - startPrepTs) / 1000);
      current.prepDurations.push(prepSec);
    }

    // Segment 3: Delivery (DELIVERED - READY)
    const deliveredTs = timestamps.get("DELIVERED");
    let deliverySec: number | null = null;
    if (readyTs && deliveredTs && deliveredTs >= readyTs) {
      deliverySec = Math.round((deliveredTs - readyTs) / 1000);
      current.deliveryDurations.push(deliverySec);
    }

    // Segment 4: Close-Out (COMPLETED - DELIVERED)
    const completedTs = timestamps.get("COMPLETED");
    let closeOutSec: number | null = null;
    if (deliveredTs && completedTs && completedTs >= deliveredTs) {
      closeOutSec = Math.round((completedTs - deliveredTs) / 1000);
      current.closeOutDurations.push(closeOutSec);
    }

    // Full Cycle: COMPLETED - PLACED
    let cycleSec: number | null = null;
    if (placedTs && completedTs && completedTs >= placedTs) {
      cycleSec = Math.round((completedTs - placedTs) / 1000);
      current.cycleDurations.push(cycleSec);
    }

    orderDurations.push({
      id: o.id,
      date: dateStr,
      approval: approvalSec,
      prep: prepSec,
      delivery: deliverySec,
      closeOut: closeOutSec,
      cycle: cycleSec,
    });

    map.set(dateStr, current);
  }

  const rows: OrderFunnelRow[] = Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => {
      const qApp = computeQuantiles(item.approvalDurations);
      const qPrep = computeQuantiles(item.prepDurations);
      const qDel = computeQuantiles(item.deliveryDurations);
      const qClose = computeQuantiles(item.closeOutDurations);
      const qCyc = computeQuantiles(item.cycleDurations);

      return {
        date: item.date,
        ordersPlaced: item.placed,
        approved: item.approved,
        preparing: item.preparing,
        ready: item.ready,
        delivered: item.delivered,
        completed: item.completed,
        cancelled: item.cancelled,
        avgApprovalSec: qApp.mean,
        p50ApprovalSec: qApp.p50,
        p90ApprovalSec: qApp.p90,
        maxApprovalSec: qApp.max,
        avgPrepSec: qPrep.mean,
        p50PrepSec: qPrep.p50,
        p90PrepSec: qPrep.p90,
        maxPrepSec: qPrep.max,
        avgDeliverySec: qDel.mean,
        p50DeliverySec: qDel.p50,
        p90DeliverySec: qDel.p90,
        maxDeliverySec: qDel.max,
        avgCloseOutSec: qClose.mean,
        p50CloseOutSec: qClose.p50,
        p90CloseOutSec: qClose.p90,
        maxCloseOutSec: qClose.max,
        avgCycleSec: qCyc.mean,
        p50CycleSec: qCyc.p50,
        p90CycleSec: qCyc.p90,
        maxCycleSec: qCyc.max,
      };
    });

  // Calculate global P90s across all periods for anomaly threshold (> 3 * P90)
  const allApproval = Array.from(map.values()).flatMap((m) => m.approvalDurations);
  const allCycle = Array.from(map.values()).flatMap((m) => m.cycleDurations);
  const globalP90Approval = computeQuantiles(allApproval).p90;
  const globalP90Cycle = computeQuantiles(allCycle).p90;

  const thresholdApproval = Math.max(60, globalP90Approval * 3);
  const thresholdCycle = Math.max(120, globalP90Cycle * 3);

  const anomalies: OrderAnomalyRow[] = [];
  for (const od of orderDurations) {
    if (od.approval !== null && od.approval > thresholdApproval) {
      anomalies.push({
        orderId: od.id,
        date: od.date,
        segment: "Approval",
        durationSec: od.approval,
        p90ThresholdSec: thresholdApproval,
      });
    } else if (od.cycle !== null && od.cycle > thresholdCycle) {
      anomalies.push({
        orderId: od.id,
        date: od.date,
        segment: "Cycle",
        durationSec: od.cycle,
        p90ThresholdSec: thresholdCycle,
      });
    }
  }

  return ok({ rows, anomalies });
}
