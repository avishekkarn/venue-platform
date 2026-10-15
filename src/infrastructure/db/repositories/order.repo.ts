/**
 * Prisma adapter for the OrderRepository port.
 *
 * Requirements:
 * - Exports createPrismaOrderRepository(client: DbClient): OrderRepository (no default value).
 * - Enforces venue isolation on every query (DECISIONS.md D-10.2, SYSTEM.md §15.4).
 * - Executes create inside client.$transaction(...) writing Order, OrderItem[], and OrderStateChange(PLACED).
 * - Idempotency contract: Catches P2002 on orders_idempotencyKey_key via isUniqueConstraintError,
 *   reads existing order via findByIdempotencyKey, and returns ok(existingOrder) (SYSTEM.md §9.7, D-4.12).
 * - Money-as-string: accepts decimal strings on write and passes to Prisma as-is. Reads Decimal(10, 2)
 *   columns via .toFixed(2) on Prisma Decimal objects, never coercing with Number(...) or .toNumber().
 * - Frozen fields: OrderItem fields (itemName, itemPrice, modifiersJson, modifierPrice, lineTotal)
 *   are written as-is without querying MenuItem (D-4.1).
 * - cancel writes state = CANCELLED and creates an OrderStateChange with note = reason (D-4.7).
 * - advanceState writes new state and creates an OrderStateChange.
 *
 * Reference: SYSTEM.md §2, §9.7, §11.1, DECISIONS.md D-4.1, D-4.7, D-4.12, D-10.2.
 */

import {
  type PrismaClient,
  type Prisma,
  OrderState as PrismaOrderState,
  PlaceType as PrismaPlaceType,
  type Order as PrismaOrder,
  type OrderItem as PrismaOrderItem,
  type OrderStateChange as PrismaOrderStateChange,
} from "@prisma/client";
import {
  type OrderRepository,
  type Order,
  type OrderItem,
  type OrderStateChange,
  type CreateOrderInput,
  type AdvanceOrderInput,
  type CancelOrderInput,
  type OrderFilter,
  OrderState,
  PlaceType,
} from "@/domain/orders/order.repository";
import { ok, fail, DomainErrorCode, type Result } from "@/domain/shared/result";
import { isUniqueConstraintError } from "@/infrastructure/db/errors";

type DbClient = PrismaClient | Prisma.TransactionClient;

const PRISMA_TO_DOMAIN_ORDER_STATE: Record<PrismaOrderState, OrderState> = {
  [PrismaOrderState.PLACED]: OrderState.PLACED,
  [PrismaOrderState.APPROVED]: OrderState.APPROVED,
  [PrismaOrderState.PREPARING]: OrderState.PREPARING,
  [PrismaOrderState.READY]: OrderState.READY,
  [PrismaOrderState.DELIVERED]: OrderState.DELIVERED,
  [PrismaOrderState.COMPLETED]: OrderState.COMPLETED,
  [PrismaOrderState.CANCELLED]: OrderState.CANCELLED,
};

const DOMAIN_TO_PRISMA_ORDER_STATE: Record<OrderState, PrismaOrderState> = {
  [OrderState.PLACED]: PrismaOrderState.PLACED,
  [OrderState.APPROVED]: PrismaOrderState.APPROVED,
  [OrderState.PREPARING]: PrismaOrderState.PREPARING,
  [OrderState.READY]: PrismaOrderState.READY,
  [OrderState.DELIVERED]: PrismaOrderState.DELIVERED,
  [OrderState.COMPLETED]: PrismaOrderState.COMPLETED,
  [OrderState.CANCELLED]: PrismaOrderState.CANCELLED,
};

const PRISMA_TO_DOMAIN_PLACE_TYPE: Record<PrismaPlaceType, PlaceType> = {
  [PrismaPlaceType.TABLE]: PlaceType.TABLE,
  [PrismaPlaceType.ROOM]: PlaceType.ROOM,
  [PrismaPlaceType.COUNTER]: PlaceType.COUNTER,
};

const DOMAIN_TO_PRISMA_PLACE_TYPE: Record<PlaceType, PrismaPlaceType> = {
  [PlaceType.TABLE]: PrismaPlaceType.TABLE,
  [PlaceType.ROOM]: PrismaPlaceType.ROOM,
  [PlaceType.COUNTER]: PrismaPlaceType.COUNTER,
};

type RawOrderWithRelations = PrismaOrder & {
  items: PrismaOrderItem[];
  stateChanges: PrismaOrderStateChange[];
};

const ORDER_INCLUDE = {
  items: {
    orderBy: { id: "asc" as const },
  },
  stateChanges: {
    orderBy: { occurredAt: "asc" as const },
  },
} as const;

function mapOrderItem(raw: PrismaOrderItem): OrderItem {
  return {
    id: raw.id,
    orderId: raw.orderId,
    menuItemId: raw.menuItemId,
    itemName: raw.itemName,
    itemPrice: raw.itemPrice.toFixed(2),
    quantity: raw.quantity,
    modifiersJson: raw.modifiersJson,
    modifierPrice: raw.modifierPrice.toFixed(2),
    lineTotal: raw.lineTotal.toFixed(2),
    notes: raw.notes,
  };
}

function mapOrderStateChange(raw: PrismaOrderStateChange): OrderStateChange {
  return {
    id: raw.id,
    orderId: raw.orderId,
    state: PRISMA_TO_DOMAIN_ORDER_STATE[raw.state],
    staffMemberId: raw.staffMemberId,
    note: raw.note,
    occurredAt: raw.occurredAt,
  };
}

function mapOrder(raw: RawOrderWithRelations): Order {
  return {
    id: raw.id,
    venueId: raw.venueId,
    guestSessionId: raw.guestSessionId,
    placeType: PRISMA_TO_DOMAIN_PLACE_TYPE[raw.placeType],
    tableId: raw.tableId,
    roomId: raw.roomId,
    counterId: raw.counterId,
    pickupName: raw.pickupName,
    state: PRISMA_TO_DOMAIN_ORDER_STATE[raw.state],
    subtotal: raw.subtotal.toFixed(2),
    taxRate: raw.taxRate.toFixed(4),
    taxAmount: raw.taxAmount.toFixed(2),
    total: raw.total.toFixed(2),
    notes: raw.notes,
    placedAt: raw.placedAt,
    updatedAt: raw.updatedAt,
    items: raw.items.map(mapOrderItem),
    stateChanges: raw.stateChanges.map(mapOrderStateChange),
  };
}

export function createPrismaOrderRepository(client: DbClient): OrderRepository {
  async function findById(venueId: string, id: string): Promise<Result<Order>> {
    try {
      const raw = await client.order.findFirst({
        where: { id, venueId },
        include: ORDER_INCLUDE,
      });

      if (!raw) {
        return fail(
          DomainErrorCode.NOT_FOUND,
          `Order '${id}' not found for venue '${venueId}'`
        );
      }

      return ok(mapOrder(raw));
    } catch (error) {
      return fail(
        DomainErrorCode.INTERNAL,
        error instanceof Error ? error.message : "Failed to find order"
      );
    }
  }

  async function findByIdempotencyKey(
    venueId: string,
    idempotencyKey: string
  ): Promise<Result<Order>> {
    try {
      const raw = await client.order.findFirst({
        where: { venueId, idempotencyKey },
        include: ORDER_INCLUDE,
      });

      if (!raw) {
        return fail(
          DomainErrorCode.NOT_FOUND,
          `Order with idempotency key '${idempotencyKey}' not found for venue '${venueId}'`
        );
      }

      return ok(mapOrder(raw));
    } catch (error) {
      return fail(
        DomainErrorCode.INTERNAL,
        error instanceof Error
          ? error.message
          : "Failed to find order by idempotency key"
      );
    }
  }

  return {
    create: async (input: CreateOrderInput): Promise<Result<Order>> => {
      try {
        const createOrderInTx = async (tx: DbClient): Promise<Order> => {
          const raw = await tx.order.create({
            data: {
              venueId: input.venueId,
              idempotencyKey: input.idempotencyKey,
              placeType: DOMAIN_TO_PRISMA_PLACE_TYPE[input.placeType],
              tableId: input.tableId ?? null,
              roomId: input.roomId ?? null,
              counterId: input.counterId ?? null,
              pickupName: input.pickupName ?? null,
              guestSessionId: input.guestSessionId ?? null,
              state: PrismaOrderState.PLACED,
              subtotal: input.subtotal,
              taxRate: input.taxRate,
              taxAmount: input.taxAmount,
              total: input.total,
              notes: input.notes ?? null,
              items: {
                create: input.items.map((item) => ({
                  menuItemId: item.menuItemId ?? null,
                  itemName: item.itemName,
                  itemPrice: item.itemPrice,
                  quantity: item.quantity,
                  modifiersJson: (item.modifiersJson ?? []) as Prisma.InputJsonValue,
                  modifierPrice: item.modifierPrice ?? "0.00",
                  lineTotal: item.lineTotal,
                  notes: item.notes ?? null,
                })),
              },
              stateChanges: {
                create: [
                  {
                    state: PrismaOrderState.PLACED,
                    staffMemberId: null,
                    note: null,
                  },
                ],
              },
            },
            include: ORDER_INCLUDE,
          });

          return mapOrder(raw);
        };

        const resultOrder =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => createOrderInTx(tx))
            : await createOrderInTx(client);

        return ok(resultOrder);
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          const existing = await findByIdempotencyKey(
            input.venueId,
            input.idempotencyKey
          );
          if (existing.ok) {
            return existing;
          }
        }

        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error ? error.message : "Failed to create order"
        );
      }
    },

    findById,

    findByIdempotencyKey,

    listForVenue: async (
      venueId: string,
      filter?: OrderFilter
    ): Promise<Result<Order[]>> => {
      try {
        const rawOrders = await client.order.findMany({
          where: {
            venueId,
            ...(filter?.state
              ? { state: DOMAIN_TO_PRISMA_ORDER_STATE[filter.state] }
              : {}),
          },
          include: ORDER_INCLUDE,
          orderBy: { placedAt: "desc" },
        });

        return ok(rawOrders.map(mapOrder));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error ? error.message : "Failed to list orders for venue"
        );
      }
    },

    listForGuestSession: async (
      venueId: string,
      guestSessionId: string
    ): Promise<Result<Order[]>> => {
      try {
        const rawOrders = await client.order.findMany({
          where: {
            venueId,
            guestSessionId,
          },
          include: ORDER_INCLUDE,
          orderBy: { placedAt: "asc" },
        });

        return ok(rawOrders.map(mapOrder));
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error
            ? error.message
            : "Failed to list orders for guest session"
        );
      }
    },

    advanceState: async (
      input: AdvanceOrderInput
    ): Promise<Result<Order>> => {
      try {
        const existing = await client.order.findFirst({
          where: { id: input.orderId, venueId: input.venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Order '${input.orderId}' not found for venue '${input.venueId}'`
          );
        }

        const advanceInTx = async (tx: DbClient): Promise<Order> => {
          const updated = await tx.order.update({
            where: { id: input.orderId },
            data: {
              state: DOMAIN_TO_PRISMA_ORDER_STATE[input.toState],
              stateChanges: {
                create: {
                  state: DOMAIN_TO_PRISMA_ORDER_STATE[input.toState],
                  staffMemberId: input.staffMemberId ?? null,
                  note: null,
                },
              },
            },
            include: ORDER_INCLUDE,
          });

          return mapOrder(updated);
        };

        const resultOrder =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => advanceInTx(tx))
            : await advanceInTx(client);

        return ok(resultOrder);
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error ? error.message : "Failed to advance order state"
        );
      }
    },

    cancel: async (input: CancelOrderInput): Promise<Result<Order>> => {
      try {
        const existing = await client.order.findFirst({
          where: { id: input.orderId, venueId: input.venueId },
        });

        if (!existing) {
          return fail(
            DomainErrorCode.NOT_FOUND,
            `Order '${input.orderId}' not found for venue '${input.venueId}'`
          );
        }

        const cancelInTx = async (tx: DbClient): Promise<Order> => {
          const updated = await tx.order.update({
            where: { id: input.orderId },
            data: {
              state: PrismaOrderState.CANCELLED,
              stateChanges: {
                create: {
                  state: PrismaOrderState.CANCELLED,
                  staffMemberId: input.staffMemberId ?? null,
                  note: input.reason,
                },
              },
            },
            include: ORDER_INCLUDE,
          });

          return mapOrder(updated);
        };

        const resultOrder =
          "$transaction" in client && typeof client.$transaction === "function"
            ? await client.$transaction(async (tx) => cancelInTx(tx))
            : await cancelInTx(client);

        return ok(resultOrder);
      } catch (error) {
        return fail(
          DomainErrorCode.INTERNAL,
          error instanceof Error ? error.message : "Failed to cancel order"
        );
      }
    },
  };
}
