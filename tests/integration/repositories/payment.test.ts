import { describe, it, expect } from "vitest";
import { withTransaction } from "../setup";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaPaymentTicketRepository } from "@/infrastructure/db/repositories/payment-ticket.repo";
import { createPrismaReceiptRepository } from "@/infrastructure/db/repositories/receipt.repo";
import {
  PaymentState,
  type CreatePaymentTicketInput,
  type CreateReceiptInput,
} from "@/domain/payments/payment.repository";
import { OrderState, PlaceType } from "@/domain/orders/order.repository";
import { DomainErrorCode } from "@/domain/shared/result";
import { type Prisma } from "@prisma/client";

describe("Payment and Receipt Repositories Integration Tests", () => {
  async function createFixtureVenueAndOrder(tx: Prisma.TransactionClient, suffix: string) {
    const venueRepo = createPrismaVenueRepository(tx);
    const orderRepo = createPrismaOrderRepository(tx);

    const venueResult = await venueRepo.create({
      name: `Payment Venue ${suffix}`,
      slug: `pay-venue-${Date.now()}-${suffix}`,
      taxRate: "0.1000",
      modules: ["TABLE"],
    });
    if (!venueResult.ok) {
      throw new Error(`Failed to create fixture venue: ${venueResult.error.message}`);
    }

    const venueId = venueResult.value.id;

    const orderResult = await orderRepo.create({
      venueId,
      idempotencyKey: `idem-pay-${Date.now()}-${suffix}`,
      placeType: PlaceType.TABLE,
      subtotal: "30.00",
      taxRate: "0.1000",
      taxAmount: "3.00",
      total: "33.00",
      items: [
        {
          itemName: "House Pasta",
          itemPrice: "30.00",
          quantity: 1,
          lineTotal: "30.00",
        },
      ],
    });
    if (!orderResult.ok) {
      throw new Error(`Failed to create fixture order: ${orderResult.error.message}`);
    }

    return {
      venueId,
      orderId: orderResult.value.id,
    };
  }

  it("Case 1: createTicket writes a PENDING row and returns amount as a string", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c1");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);

      const ticketResult = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "33.00",
        currency: "USD",
      });
      expect(ticketResult.ok).toBe(true);
      if (!ticketResult.ok) return;

      const ticket = ticketResult.value;
      expect(ticket.id).toBeDefined();
      expect(ticket.venueId).toBe(venueId);
      expect(ticket.orderId).toBe(orderId);
      expect(ticket.state).toBe(PaymentState.PENDING);
      expect(ticket.currency).toBe("USD");
      expect(ticket.providerRef).toBeNull();
      expect(ticket.confirmedAt).toBeNull();

      expect(typeof ticket.amount).toBe("string");
      expect(ticket.amount).toBe("33.00");

      // Verify in DB directly
      const dbTicket = await tx.paymentTicket.findUnique({
        where: { id: ticket.id },
      });
      expect(dbTicket).not.toBeNull();
      expect(dbTicket?.state).toBe("PENDING");
    });
  });

  it("Case 2: findTicketById returns the ticket; missing ticket returns NOT_FOUND", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c2");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);

      const created = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "25.50",
        currency: "USD",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const found = await ticketRepo.findTicketById(venueId, created.value.id);
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value.id).toBe(created.value.id);
        expect(found.value.amount).toBe("25.50");
      }

      const missing = await ticketRepo.findTicketById(
        venueId,
        "00000000-0000-0000-0000-000000000000"
      );
      expect(missing.ok).toBe(false);
      if (!missing.ok) {
        expect(missing.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("Case 3: confirmTicket sets SUCCEEDED, confirmedAt, and providerRef", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c3");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);

      const created = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "50.00",
        currency: "USD",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const confirmed = await ticketRepo.confirmTicket(
        venueId,
        created.value.id,
        "cash_register_drawer_1"
      );
      expect(confirmed.ok).toBe(true);
      if (!confirmed.ok) return;

      expect(confirmed.value.state).toBe(PaymentState.SUCCEEDED);
      expect(confirmed.value.confirmedAt).toBeInstanceOf(Date);
      expect(confirmed.value.providerRef).toBe("cash_register_drawer_1");

      // Verify in DB directly
      const dbTicket = await tx.paymentTicket.findUnique({
        where: { id: created.value.id },
      });
      expect(dbTicket?.state).toBe("SUCCEEDED");
      expect(dbTicket?.providerRef).toBe("cash_register_drawer_1");
    });
  });

  it("Case 4: confirmTicket on an already-confirmed ticket returns INVALID_STATE", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c4");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);

      const created = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "40.00",
        currency: "USD",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const firstConfirm = await ticketRepo.confirmTicket(
        venueId,
        created.value.id,
        "ref-1"
      );
      expect(firstConfirm.ok).toBe(true);

      const secondConfirm = await ticketRepo.confirmTicket(
        venueId,
        created.value.id,
        "ref-2"
      );
      expect(secondConfirm.ok).toBe(false);
      if (!secondConfirm.ok) {
        expect(secondConfirm.error.code).toBe(DomainErrorCode.INVALID_STATE);
      }
    });
  });

  it("Case 5: failTicket sets FAILED", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c5");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);

      const created = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "15.00",
        currency: "USD",
      });
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const failed = await ticketRepo.failTicket(
        venueId,
        created.value.id,
        "Customer walked away without paying"
      );
      expect(failed.ok).toBe(true);
      if (!failed.ok) return;

      expect(failed.value.state).toBe(PaymentState.FAILED);
      expect(failed.value.failureReason).toBe(
        "Customer walked away without paying"
      );

      // Verify in DB directly
      const dbTicket = await tx.paymentTicket.findUnique({
        where: { id: created.value.id },
      });
      expect(dbTicket?.state).toBe("FAILED");
      expect(dbTicket?.failureReason).toBe(
        "Customer walked away without paying"
      );
    });
  });

  it("Case 6: createReceipt writes a receipt with string money fields", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c6");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);
      const receiptRepo = createPrismaReceiptRepository(tx);

      const ticketResult = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "44.00",
        currency: "USD",
      });
      expect(ticketResult.ok).toBe(true);
      if (!ticketResult.ok) return;

      const receiptResult = await receiptRepo.createReceipt({
        paymentTicketId: ticketResult.value.id,
        orderId,
        subtotal: "36.00",
        taxAmount: "3.60",
        tipAmount: "4.40",
        total: "44.00",
        currency: "USD",
        paymentMethod: "CASH",
        guestEmail: "guest@example.com",
      });
      expect(receiptResult.ok).toBe(true);
      if (!receiptResult.ok) return;

      const receipt = receiptResult.value;
      expect(receipt.id).toBeDefined();
      expect(receipt.paymentTicketId).toBe(ticketResult.value.id);
      expect(receipt.orderId).toBe(orderId);
      expect(receipt.currency).toBe("USD");
      expect(receipt.paymentMethod).toBe("CASH");
      expect(receipt.guestEmail).toBe("guest@example.com");

      // Assert typeof string
      expect(typeof receipt.subtotal).toBe("string");
      expect(typeof receipt.taxAmount).toBe("string");
      expect(typeof receipt.tipAmount).toBe("string");
      expect(typeof receipt.total).toBe("string");

      expect(receipt.subtotal).toBe("36.00");
      expect(receipt.taxAmount).toBe("3.60");
      expect(receipt.tipAmount).toBe("4.40");
      expect(receipt.total).toBe("44.00");
    });
  });

  it("Case 7: second createReceipt for the same paymentTicketId returns CONFLICT", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c7");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);
      const receiptRepo = createPrismaReceiptRepository(tx);

      const ticketResult = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "20.00",
        currency: "USD",
      });
      expect(ticketResult.ok).toBe(true);
      if (!ticketResult.ok) return;

      const firstReceipt = await receiptRepo.createReceipt({
        paymentTicketId: ticketResult.value.id,
        orderId,
        subtotal: "18.00",
        taxAmount: "2.00",
        total: "20.00",
        currency: "USD",
      });
      expect(firstReceipt.ok).toBe(true);

      const duplicateReceipt = await receiptRepo.createReceipt({
        paymentTicketId: ticketResult.value.id,
        orderId,
        subtotal: "18.00",
        taxAmount: "2.00",
        total: "20.00",
        currency: "USD",
      });
      expect(duplicateReceipt.ok).toBe(false);
      if (!duplicateReceipt.ok) {
        expect(duplicateReceipt.error.code).toBe(DomainErrorCode.CONFLICT);
      }
    });
  });

  it("Case 8: findReceiptForTicket returns the receipt", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c8");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);
      const receiptRepo = createPrismaReceiptRepository(tx);

      const ticket = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "60.00",
        currency: "USD",
      });
      expect(ticket.ok).toBe(true);
      if (!ticket.ok) return;

      const created = await receiptRepo.createReceipt({
        paymentTicketId: ticket.value.id,
        orderId,
        subtotal: "50.00",
        taxAmount: "5.00",
        tipAmount: "5.00",
        total: "60.00",
        currency: "USD",
      });
      expect(created.ok).toBe(true);

      const found = await receiptRepo.findReceiptForTicket(
        venueId,
        ticket.value.id
      );
      expect(found.ok).toBe(true);
      if (found.ok) {
        expect(found.value.id).toBe(created.ok ? created.value.id : "");
        expect(found.value.total).toBe("60.00");
      }
    });
  });

  it("Case 9: findReceiptForTicket on a ticket with no receipt returns NOT_FOUND", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c9");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);
      const receiptRepo = createPrismaReceiptRepository(tx);

      const ticket = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "10.00",
        currency: "USD",
      });
      expect(ticket.ok).toBe(true);
      if (!ticket.ok) return;

      const missingReceipt = await receiptRepo.findReceiptForTicket(
        venueId,
        ticket.value.id
      );
      expect(missingReceipt.ok).toBe(false);
      if (!missingReceipt.ok) {
        expect(missingReceipt.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("Case 10: money fields round-trip as decimal strings without floating-point coercion", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c10");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);
      const receiptRepo = createPrismaReceiptRepository(tx);

      const ticket = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "123.45",
        currency: "USD",
      });
      expect(ticket.ok).toBe(true);
      if (!ticket.ok) return;

      const receipt = await receiptRepo.createReceipt({
        paymentTicketId: ticket.value.id,
        orderId,
        subtotal: "100.00",
        taxAmount: "10.00",
        tipAmount: "13.45",
        total: "123.45",
        currency: "USD",
      });
      expect(receipt.ok).toBe(true);
      if (!receipt.ok) return;

      expect(typeof ticket.value.amount).toBe("string");
      expect(ticket.value.amount).toBe("123.45");

      expect(typeof receipt.value.subtotal).toBe("string");
      expect(receipt.value.subtotal).toBe("100.00");

      expect(typeof receipt.value.taxAmount).toBe("string");
      expect(receipt.value.taxAmount).toBe("10.00");

      expect(typeof receipt.value.tipAmount).toBe("string");
      expect(receipt.value.tipAmount).toBe("13.45");

      expect(typeof receipt.value.total).toBe("string");
      expect(receipt.value.total).toBe("123.45");
    });
  });

  it("Case 11: tipAmount defaults to '0.00' when no tip is provided", async () => {
    await withTransaction(async (tx) => {
      const { venueId, orderId } = await createFixtureVenueAndOrder(tx, "c11");
      const ticketRepo = createPrismaPaymentTicketRepository(tx);
      const receiptRepo = createPrismaReceiptRepository(tx);

      const ticket = await ticketRepo.createTicket({
        venueId,
        orderId,
        amount: "22.00",
        currency: "USD",
      });
      expect(ticket.ok).toBe(true);
      if (!ticket.ok) return;

      const receipt = await receiptRepo.createReceipt({
        paymentTicketId: ticket.value.id,
        orderId,
        subtotal: "20.00",
        taxAmount: "2.00",
        total: "22.00",
        currency: "USD",
      });
      expect(receipt.ok).toBe(true);
      if (!receipt.ok) return;

      expect(receipt.value.tipAmount).toBe("0.00");
    });
  });

  it("Case 12: cross-venue read on tickets and receipts returns NOT_FOUND, never FORBIDDEN", async () => {
    await withTransaction(async (tx) => {
      const { venueId: venueA, orderId: orderA } =
        await createFixtureVenueAndOrder(tx, "c12a");
      const { venueId: venueB } = await createFixtureVenueAndOrder(tx, "c12b");

      const ticketRepo = createPrismaPaymentTicketRepository(tx);
      const receiptRepo = createPrismaReceiptRepository(tx);

      const ticketA = await ticketRepo.createTicket({
        venueId: venueA,
        orderId: orderA,
        amount: "18.00",
        currency: "USD",
      });
      expect(ticketA.ok).toBe(true);
      if (!ticketA.ok) return;

      const receiptA = await receiptRepo.createReceipt({
        paymentTicketId: ticketA.value.id,
        orderId: orderA,
        subtotal: "16.00",
        taxAmount: "2.00",
        total: "18.00",
        currency: "USD",
      });
      expect(receiptA.ok).toBe(true);
      if (!receiptA.ok) return;

      // Venue B attempts to read Venue A's ticket
      const crossTicket = await ticketRepo.findTicketById(
        venueB,
        ticketA.value.id
      );
      expect(crossTicket.ok).toBe(false);
      if (!crossTicket.ok) {
        expect(crossTicket.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      // Venue B attempts to read Venue A's receipt
      const crossReceipt = await receiptRepo.findReceiptForTicket(
        venueB,
        ticketA.value.id
      );
      expect(crossReceipt.ok).toBe(false);
      if (!crossReceipt.ok) {
        expect(crossReceipt.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });

  it("Case 13: confirmTicket and failTicket return NOT_FOUND on non-existent or cross-venue tickets", async () => {
    await withTransaction(async (tx) => {
      const { venueId: venueA, orderId: orderA } =
        await createFixtureVenueAndOrder(tx, "c13a");
      const { venueId: venueB } = await createFixtureVenueAndOrder(tx, "c13b");

      const ticketRepo = createPrismaPaymentTicketRepository(tx);

      const ticketA = await ticketRepo.createTicket({
        venueId: venueA,
        orderId: orderA,
        amount: "25.00",
        currency: "USD",
      });
      expect(ticketA.ok).toBe(true);
      if (!ticketA.ok) return;

      const fakeId = "00000000-0000-0000-0000-000000000000";

      // Non-existent ticket
      const confirmMissing = await ticketRepo.confirmTicket(venueA, fakeId);
      expect(confirmMissing.ok).toBe(false);
      if (!confirmMissing.ok) {
        expect(confirmMissing.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      // Cross-venue confirmTicket
      const crossConfirm = await ticketRepo.confirmTicket(
        venueB,
        ticketA.value.id
      );
      expect(crossConfirm.ok).toBe(false);
      if (!crossConfirm.ok) {
        expect(crossConfirm.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }

      // Cross-venue failTicket
      const crossFail = await ticketRepo.failTicket(venueB, ticketA.value.id);
      expect(crossFail.ok).toBe(false);
      if (!crossFail.ok) {
        expect(crossFail.error.code).toBe(DomainErrorCode.NOT_FOUND);
      }
    });
  });
});
