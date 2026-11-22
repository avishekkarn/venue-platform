/**
 * Pure domain descriptor: Payment Reconciliation (View 7).
 *
 * Governed by D-7.1 and D-7.7 (cash-only v1 scope; payment bridge in Phase 10).
 */

import { type PaymentReconciliationStatus } from "./types";

export const PAYMENT_RECONCILIATION_V1_STATUS: PaymentReconciliationStatus = {
  status: "INACTIVE_V1_SCOPE",
  commentary:
    "Payment reconciliation activates when the venue's payment provider is connected (D-7.1, D-7.7). In v1, all guest settlement is handled via cash at counter or room folio checkout.",
};

export const PAYMENT_RECONCILIATION_HEADERS: readonly string[] = [
  "Ticket ID",
  "Order ID",
  "Amount",
  "Currency",
  "Method",
  "Provider",
  "Status",
  "Verified At",
];
