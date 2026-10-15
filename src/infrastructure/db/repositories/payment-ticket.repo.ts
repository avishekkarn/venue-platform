/**
 * Prisma adapter for PaymentTicket operations.
 *
 * Requirements:
 * - Exports createPrismaPaymentTicketRepository(client: DbClient): PaymentTicketRepository (no default value).
 * - Enforces venue isolation on every query (DECISIONS.md D-10.2).
 * - createTicket writes a PENDING row and stores amount as Decimal.
 * - confirmTicket sets state = SUCCEEDED, confirmedAt = now(), and providerRef.
 *   Returns INVALID_STATE if already confirmed.
 * - failTicket sets state = FAILED. Schema has no failureReason column; reason is accepted but not stored.
 * - Money-as-string: writes amount as string; reads Decimal(10, 2) via .toFixed(2) on Prisma Decimal.
 *
 * Reference: SYSTEM.md §2, §4, §11.1, DECISIONS.md D-7.1, D-7.7, D-10.2.
 */

import {
  type PrismaClient,
  type Prisma,
  PaymentState as PrismaPaymentState,
  type PaymentTicket as PrismaPaymentTicket,
} from "@prisma/client";
import {
  type PaymentTicketRepository,
  type PaymentTicket,
  type CreatePaymentTicketInput,
  PaymentState,
} from "@/domain/payments/payment.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

const PRISMA_TO_DOMAIN_PAYMENT_STATE: Record<
  PrismaPaymentState,
  PaymentState
> = {
  [PrismaPaymentState.PENDING]: PaymentState.PENDING,
  [PrismaPaymentState.SUCCEEDED]: PaymentState.SUCCEEDED,
  [PrismaPaymentState.FAILED]: PaymentState.FAILED,
};

const DOMAIN_TO_PRISMA_PAYMENT_STATE: Record<
  PaymentState,
  PrismaPaymentState
> = {
  [PaymentState.PENDING]: PrismaPaymentState.PENDING,
  [PaymentState.SUCCEEDED]: PrismaPaymentState.SUCCEEDED,
  [PaymentState.FAILED]: PrismaPaymentState.FAILED,
};

function mapPaymentTicket(raw: PrismaPaymentTicket): PaymentTicket {
  return {
    id: raw.id,
    venueId: raw.venueId,
    orderId: raw.orderId,
    amount: raw.amount.toFixed(2),
    currency: raw.currency,
    state: PRISMA_TO_DOMAIN_PAYMENT_STATE[raw.state],
    providerRef: raw.providerRef,
    failureReason: raw.failureReason,
    createdAt: raw.createdAt,
    confirmedAt: raw.confirmedAt,
  };
}

export function createPrismaPaymentTicketRepository(
  client: DbClient
): PaymentTicketRepository {
  async function findTicketById(
    venueId: string,
    id: string
  ): Promise<Result<PaymentTicket>> {
    try {
      const raw = await client.paymentTicket.findFirst({
        where: { id, venueId },
      });

      if (!raw) {
        return fail(
          DomainErrorCode.NOT_FOUND,
          `Payment ticket '${id}' not found for venue '${venueId}'`
        );
      }

      return ok(mapPaymentTicket(raw));
    } catch (error) {
      return fail(
        DomainErrorCode.INTERNAL,
        error instanceof Error
          ? error.message
          : "Failed to find payment ticket"
      );
    }
  }

  return {
    createTicket: async (
      input: CreatePaymentTicketInput
    ): Promise<Result<PaymentTicket>> => {
      try {
        const raw = await client.paymentTicket.create({
          data: {
            venueId: input.venueId,
            orderId: input.orderId,
            amount: input.amount,
            currency: input.currency,
            state: PrismaPaymentState.PENDING,
          },
        });

        return ok(mapPaymentTicket(raw));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to create payment ticket"
        );
      }
    },

    findTicketById,

    confirmTicket: async (
      venueId: string,
      id: string,
      providerRef?: string | null
    ): Promise<Result<PaymentTicket>> => {
      try {
        const existing = await client.paymentTicket.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Payment ticket '${id}' not found for venue '${venueId}'`
          );
        }

        if (existing.state === PrismaPaymentState.SUCCEEDED) {
          return fail(
            DomainErrorCode.INVALID_STATE,
            `Payment ticket '${id}' is already confirmed`
          );
        }

        const updated = await client.paymentTicket.update({
          where: { id },
          data: {
            state: PrismaPaymentState.SUCCEEDED,
            confirmedAt: new Date(),
            providerRef: providerRef ?? existing.providerRef,
          },
        });

        return ok(mapPaymentTicket(updated));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to confirm payment ticket"
        );
      }
    },

    failTicket: async (
      venueId: string,
      id: string,
      reason?: string | null
    ): Promise<Result<PaymentTicket>> => {
      try {
        const existing = await client.paymentTicket.findFirst({
          where: { id, venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Payment ticket '${id}' not found for venue '${venueId}'`
          );
        }

        const updated = await client.paymentTicket.update({
          where: { id },
          data: {
            state: PrismaPaymentState.FAILED,
            failureReason: reason ?? null,
          },
        });

        return ok(mapPaymentTicket(updated));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to fail payment ticket"
        );
      }
    },
  };
}
