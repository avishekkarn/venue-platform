/**
 * Port: PaymentRepository
 *
 * Requirements:
 * - Pure domain interface and types; zero @prisma/client imports.
 * - Module is payments (SYSTEM.md §4).
 * - PaymentState domain enum: PENDING, SUCCEEDED, FAILED.
 * - PaymentTicket and Receipt domain entities.
 * - Money-as-string: amount, subtotal, taxAmount, tipAmount, total are strings.
 * - Inputs: CreatePaymentTicketInput, CreateReceiptInput.
 * - One unified interface PaymentRepository, plus focused sub-interfaces
 *   PaymentTicketRepository and ReceiptRepository for the two adapter factories.
 *
 * Reference: SYSTEM.md §2, §4, §11.1, DECISIONS.md D-7.1, D-7.7, D-10.2.
 */

import { type Result } from "@/domain/shared/result";

export enum PaymentState {
  PENDING = "PENDING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
}

export interface PaymentTicket {
  readonly id: string;
  readonly venueId: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
  readonly state: PaymentState;
  readonly providerRef: string | null;
  readonly failureReason: string | null;
  readonly createdAt: Date;
  readonly confirmedAt: Date | null;
}

export interface Receipt {
  readonly id: string;
  readonly paymentTicketId: string;
  readonly orderId: string;
  readonly subtotal: string;
  readonly taxAmount: string;
  readonly tipAmount: string;
  readonly total: string;
  readonly currency: string;
  readonly paymentMethod: string;
  readonly guestEmail: string | null;
  readonly issuedAt: Date;
}

export interface CreatePaymentTicketInput {
  readonly venueId: string;
  readonly orderId: string;
  readonly amount: string;
  readonly currency: string;
}

export interface CreateReceiptInput {
  readonly paymentTicketId: string;
  readonly orderId: string;
  readonly subtotal: string;
  readonly taxAmount: string;
  readonly tipAmount?: string;
  readonly total: string;
  readonly currency: string;
  readonly paymentMethod?: string;
  readonly guestEmail?: string | null;
}

export interface PaymentTicketRepository {
  createTicket(
    input: CreatePaymentTicketInput
  ): Promise<Result<PaymentTicket>>;
  findTicketById(
    venueId: string,
    id: string
  ): Promise<Result<PaymentTicket>>;
  confirmTicket(
    venueId: string,
    id: string,
    providerRef?: string | null
  ): Promise<Result<PaymentTicket>>;
  failTicket(
    venueId: string,
    id: string,
    reason?: string | null
  ): Promise<Result<PaymentTicket>>;
}

export interface ReceiptRepository {
  createReceipt(input: CreateReceiptInput): Promise<Result<Receipt>>;
  findReceiptForTicket(
    venueId: string,
    paymentTicketId: string
  ): Promise<Result<Receipt>>;
}

export interface PaymentRepository
  extends PaymentTicketRepository,
    ReceiptRepository {}
