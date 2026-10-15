/**
 * Prisma adapter for Receipt operations.
 *
 * Requirements:
 * - Exports createPrismaReceiptRepository(client: DbClient): ReceiptRepository (no default value).
 * - Enforces venue isolation via relation filter to paymentTicket.venueId (DECISIONS.md D-10.2).
 * - createReceipt is idempotent against paymentTicketId @unique: returns CONFLICT on duplicate.
 * - Money-as-string: writes money strings as-is; reads Decimal(10, 2) via .toFixed(2) on Prisma Decimal.
 * - tipAmount defaults to "0.00" if omitted.
 *
 * Reference: SYSTEM.md §2, §4, §11.1, DECISIONS.md D-7.1, D-7.7, D-10.2.
 */

import {
  type PrismaClient,
  type Prisma,
  type Receipt as PrismaReceipt,
} from "@prisma/client";
import {
  type ReceiptRepository,
  type Receipt,
  type CreateReceiptInput,
} from "@/domain/payments/payment.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

function mapReceipt(raw: PrismaReceipt): Receipt {
  return {
    id: raw.id,
    paymentTicketId: raw.paymentTicketId,
    orderId: raw.orderId,
    subtotal: raw.subtotal.toFixed(2),
    taxAmount: raw.taxAmount.toFixed(2),
    tipAmount: raw.tipAmount.toFixed(2),
    total: raw.total.toFixed(2),
    currency: raw.currency,
    paymentMethod: raw.paymentMethod,
    guestEmail: raw.guestEmail,
    issuedAt: raw.issuedAt,
  };
}

export function createPrismaReceiptRepository(
  client: DbClient
): ReceiptRepository {
  return {
    createReceipt: async (
      input: CreateReceiptInput
    ): Promise<Result<Receipt>> => {
      try {
        const raw = await client.receipt.create({
          data: {
            paymentTicketId: input.paymentTicketId,
            orderId: input.orderId,
            subtotal: input.subtotal,
            taxAmount: input.taxAmount,
            tipAmount: input.tipAmount ?? "0.00",
            total: input.total,
            currency: input.currency,
            paymentMethod: input.paymentMethod ?? "CASH",
            guestEmail: input.guestEmail ?? null,
          },
        });

        return ok(mapReceipt(raw));
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          return fail(
            DomainErrorCode.CONFLICT,
            `Receipt already exists for payment ticket '${input.paymentTicketId}'`
          );
        }

        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error ? error.message : "Failed to create receipt"
        );
      }
    },

    findReceiptForTicket: async (
      venueId: string,
      paymentTicketId: string
    ): Promise<Result<Receipt>> => {
      try {
        const raw = await client.receipt.findFirst({
          where: {
            paymentTicketId,
            paymentTicket: {
              venueId,
            },
          },
        });

        if (!raw) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Receipt for payment ticket '${paymentTicketId}' not found for venue '${venueId}'`
          );
        }

        return ok(mapReceipt(raw));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to find receipt for payment ticket"
        );
      }
    },
  };
}
