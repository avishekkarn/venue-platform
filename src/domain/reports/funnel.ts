/**
 * Pure domain calculator: Order Funnel & Latency (View 3).
 *
 * Headers: Date,Orders Placed,Approved,Preparing,Ready,Delivered,Completed,Cancelled,Avg Approval (s),Avg Prep (s),Avg Delivery (s),Avg Cycle (s)
 * Governed by D-4.7, D-4.8, D-4.9.
 */

import { type Result, ok, fail, DomainErrorCode } from "@/domain/shared/result";
import { type OrderFunnelRow } from "./types";

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

export function generateOrderFunnel(
  orders: readonly OrderFunnelInput[]
): Result<OrderFunnelRow[]> {
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
    cycleDurations: number[];
  }

  const map = new Map<string, Acc>();

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

    // Approval latency: PLACED -> APPROVED
    const placedTs = timestamps.get("PLACED");
    const approvedTs = timestamps.get("APPROVED");
    if (placedTs && approvedTs && approvedTs >= placedTs) {
      current.approvalDurations.push(Math.round((approvedTs - placedTs) / 1000));
    }

    // Prep latency: APPROVED (or PREPARING) -> READY
    const startPrepTs = timestamps.get("APPROVED") ?? timestamps.get("PREPARING");
    const readyTs = timestamps.get("READY");
    if (startPrepTs && readyTs && readyTs >= startPrepTs) {
      current.prepDurations.push(Math.round((readyTs - startPrepTs) / 1000));
    }

    // Delivery latency: READY -> DELIVERED (or COMPLETED)
    const endDeliveryTs = timestamps.get("DELIVERED") ?? timestamps.get("COMPLETED");
    if (readyTs && endDeliveryTs && endDeliveryTs >= readyTs) {
      current.deliveryDurations.push(Math.round((endDeliveryTs - readyTs) / 1000));
    }

    // Full Cycle: PLACED -> COMPLETED
    const completedTs = timestamps.get("COMPLETED");
    if (placedTs && completedTs && completedTs >= placedTs) {
      current.cycleDurations.push(Math.round((completedTs - placedTs) / 1000));
    }

    map.set(dateStr, current);
  }

  const avg = (nums: number[]): number =>
    nums.length > 0 ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0;

  const rows: OrderFunnelRow[] = Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date,
      ordersPlaced: item.placed,
      approved: item.approved,
      preparing: item.preparing,
      ready: item.ready,
      delivered: item.delivered,
      completed: item.completed,
      cancelled: item.cancelled,
      avgApprovalSec: avg(item.approvalDurations),
      avgPrepSec: avg(item.prepDurations),
      avgDeliverySec: avg(item.deliveryDurations),
      avgCycleSec: avg(item.cycleDurations),
    }));

  return ok(rows);
}
