/**
 * Port: OrderRepository
 *
 * Requirements:
 * - Pure domain interface and types; zero @prisma/client imports.
 * - OrderState domain enum: PLACED, APPROVED, PREPARING, READY, DELIVERED, COMPLETED, CANCELLED.
 * - PlaceType domain enum: TABLE, ROOM, COUNTER.
 * - Order, OrderItem, OrderStateChange domain interfaces.
 * - Money-as-string: subtotal, taxRate, taxAmount, total, itemPrice, modifierPrice, lineTotal are strings.
 * - Order has no idempotencyKey exposed in domain shape (SYSTEM.md §9.7).
 * - Input types: CreateOrderInput (with idempotencyKey), CreateOrderItemInput, AdvanceOrderInput, CancelOrderInput.
 * - Methods: create, findById, findByIdempotencyKey, listForVenue, listForGuestSession, advanceState, cancel.
 *
 * Reference: SYSTEM.md §2 (ports and adapters), SYSTEM.md §9 (order lifecycle & idempotency),
 * SYSTEM.md §11.1 (Order entities), DECISIONS.md D-4.1, D-4.7, D-4.12, D-10.2.
 */

import { type Result } from "@/domain/shared/result";

export enum OrderState {
  PLACED = "PLACED",
  APPROVED = "APPROVED",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PlaceType {
  TABLE = "TABLE",
  ROOM = "ROOM",
  COUNTER = "COUNTER",
}

export interface OrderItem {
  readonly id: string;
  readonly orderId: string;
  readonly menuItemId: string | null;
  readonly itemName: string;
  readonly itemPrice: string;
  readonly quantity: number;
  readonly modifiersJson: unknown;
  readonly modifierPrice: string;
  readonly lineTotal: string;
  readonly notes: string | null;
}

export interface OrderStateChange {
  readonly id: string;
  readonly orderId: string;
  readonly state: OrderState;
  readonly staffMemberId: string | null;
  readonly note: string | null;
  readonly occurredAt: Date;
}

export interface Order {
  readonly id: string;
  readonly venueId: string;
  readonly guestSessionId: string | null;
  readonly placeType: PlaceType;
  readonly tableId: string | null;
  readonly roomId: string | null;
  readonly counterId: string | null;
  readonly pickupName: string | null;
  readonly state: OrderState;
  readonly subtotal: string;
  readonly taxRate: string;
  readonly taxAmount: string;
  readonly total: string;
  readonly notes: string | null;
  readonly placedAt: Date;
  readonly updatedAt: Date;
  readonly items: readonly OrderItem[];
  readonly stateChanges: readonly OrderStateChange[];
}

export interface CreateOrderItemInput {
  readonly menuItemId?: string | null;
  readonly itemName: string;
  readonly itemPrice: string;
  readonly quantity: number;
  readonly modifiersJson?: unknown;
  readonly modifierPrice?: string;
  readonly lineTotal: string;
  readonly notes?: string | null;
}

export interface CreateOrderInput {
  readonly venueId: string;
  readonly idempotencyKey: string;
  readonly placeType: PlaceType;
  readonly tableId?: string | null;
  readonly roomId?: string | null;
  readonly counterId?: string | null;
  readonly pickupName?: string | null;
  readonly guestSessionId?: string | null;
  readonly subtotal: string;
  readonly taxRate: string;
  readonly taxAmount: string;
  readonly total: string;
  readonly notes?: string | null;
  readonly items: readonly CreateOrderItemInput[];
}

export interface AdvanceOrderInput {
  readonly venueId: string;
  readonly orderId: string;
  readonly toState: OrderState;
  readonly staffMemberId?: string | null;
}

export interface CancelOrderInput {
  readonly venueId: string;
  readonly orderId: string;
  readonly reason: string;
  readonly staffMemberId?: string | null;
}

export interface OrderFilter {
  readonly state?: OrderState;
}

export interface OrderRepository {
  create(input: CreateOrderInput): Promise<Result<Order>>;
  findById(venueId: string, id: string): Promise<Result<Order>>;
  findByIdempotencyKey(
    venueId: string,
    idempotencyKey: string
  ): Promise<Result<Order>>;
  listForVenue(
    venueId: string,
    filter?: OrderFilter
  ): Promise<Result<Order[]>>;
  listForGuestSession(
    venueId: string,
    guestSessionId: string
  ): Promise<Result<Order[]>>;
  advanceState(input: AdvanceOrderInput): Promise<Result<Order>>;
  cancel(input: CancelOrderInput): Promise<Result<Order>>;
}
