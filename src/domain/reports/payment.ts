/**
 * Pure domain descriptor: Payment Reconciliation (View 6 / View 7).
 *
 * Headers:
 * # Cash Collection Summary (v1 Scope). Total Cash Collected: X NPR (N completed orders).
 * # Payment reconciliation activates when the venue's payment provider is connected (D-7.1, D-7.7).
 * Payment Ticket ID,Order ID,Amount,Currency,State,Payment Method,Confirmed At,Receipt ID
 *
 * Governed by D-7.1, D-7.7, D-12.2.
 */

import { type PaymentReconciliationStatus, type PaymentReconciliationRow } from "./types";

export function generatePaymentReconciliationStatus(params: {
  totalCashCollected: string;
  completedOrdersCount: number;
  currency: string;
}): PaymentReconciliationStatus {
  return {
    status: "INACTIVE_V1_SCOPE",
    totalCashCollected: `${params.totalCashCollected} ${params.currency}`,
    completedOrdersCount: params.completedOrdersCount,
    commentary:
      "Payment reconciliation activates when the venue's payment provider is connected (D-7.1, D-7.7). In v1, all guest settlement is handled via cash at counter or room folio checkout.",
  };
}

export const PAYMENT_RECONCILIATION_HEADERS: readonly string[] = [
  "Payment Ticket ID",
  "Order ID",
  "Amount",
  "Currency",
  "State",
  "Payment Method",
  "Confirmed At",
  "Receipt ID",
];
