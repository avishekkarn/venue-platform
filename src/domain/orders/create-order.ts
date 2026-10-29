/**
 * Domain orchestrator: createOrder
 *
 * Implements authoritative order creation for the QR-PROJECT hospitality platform:
 * 1. Validates the request inputs before any database or repository call.
 * 2. Checks the idempotency key first via orderRepo.findByIdempotencyKey:
 *    if an order already exists for this key, returns ok(existingOrder) without creating a second one.
 * 3. Reads the venue from venueRepo to obtain the authoritative venue taxRate.
 * 4. Reads each item from menuRepo via getItemWithModifiers:
 *    - Rejects nonexistent items with NOT_FOUND.
 *    - Rejects non-orderable items (state !== AVAILABLE) with VALIDATION_FAILED.
 *    - Resolves selected modifiers against the item's modifier groups and options.
 *    - Freezes database item names, base prices, modifier prices, and JSON representations.
 * 5. Computes line totals, subtotal, tax amount, and total using the pure decimal-money functions
 *    (computeLineTotal, computeSubtotal, computeTax, computeTotal).
 * 6. Never trusts any client-supplied price, subtotal, tax, or total.
 * 7. Assembles the fully-computed CreateOrderInput and calls orderRepo.create.
 * 8. Propagates repository failures unchanged.
 *
 * Reference: BUILD.md §5, §7.1, SYSTEM.md §5, §9.4, §9.5, §9.7, §11.1,
 * DECISIONS.md D-2.1, D-2.2, D-4.1, D-4.3, D-4.4, D-4.6, D-4.12, D-10.2.
 */

import {
  type Order,
  type OrderRepository,
  type CreateOrderInput,
  type CreateOrderItemInput,
  PlaceType,
} from "./order.repository";
import {
  type MenuRepository,
  MenuItemState,
} from "@/domain/menu/menu.repository";
import { type VenueRepository } from "@/domain/organization/venue.repository";
import {
  type Result,
  ok,
  fail,
  DomainErrorCode,
} from "@/domain/shared/result";
import { computeLineTotal, computeSubtotal } from "./compute-price";
import { computeTax, computeTotal } from "./compute-tax";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreateOrderItemRequest {
  readonly menuItemId: string;
  readonly quantity: number;
  readonly selectedModifierIds?: readonly string[];
  readonly notes?: string | null;
  // Permissive fields to demonstrate that client-supplied prices are strictly ignored
  readonly price?: unknown;
  readonly itemPrice?: unknown;
  readonly lineTotal?: unknown;
  readonly [key: string]: unknown;
}

export interface CreateOrderRequest {
  readonly venueId: string;
  readonly idempotencyKey: string;
  readonly placeType: PlaceType;
  readonly tableId?: string | null;
  readonly roomId?: string | null;
  readonly counterId?: string | null;
  readonly pickupName?: string | null;
  readonly guestSessionId?: string | null;
  readonly notes?: string | null;
  readonly items: readonly CreateOrderItemRequest[];
  // Permissive fields to demonstrate that client-supplied totals/taxes are strictly ignored
  readonly subtotal?: unknown;
  readonly taxRate?: unknown;
  readonly taxAmount?: unknown;
  readonly total?: unknown;
  readonly [key: string]: unknown;
}

export interface CreateOrderDeps {
  readonly orderRepo: OrderRepository;
  readonly menuRepo: MenuRepository;
  readonly venueRepo: VenueRepository;
}

export async function createOrder(
  deps: CreateOrderDeps,
  input: CreateOrderRequest
): Promise<Result<Order>> {
  if (!input || typeof input !== "object") {
    return fail(DomainErrorCode.VALIDATION_FAILED, "Request body is required");
  }

  // 1. Input validation before any database call
  if (
    !input.venueId ||
    typeof input.venueId !== "string" ||
    input.venueId.trim() === ""
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "venueId is required and must be non-empty"
    );
  }

  if (
    !input.idempotencyKey ||
    typeof input.idempotencyKey !== "string" ||
    !UUID_REGEX.test(input.idempotencyKey.trim())
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "idempotencyKey must be a valid UUID"
    );
  }

  if (
    input.placeType !== PlaceType.TABLE &&
    input.placeType !== PlaceType.ROOM &&
    input.placeType !== PlaceType.COUNTER
  ) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      `Invalid placeType: '${input.placeType}'`
    );
  }

  if (input.placeType === PlaceType.TABLE) {
    if (
      !input.tableId ||
      typeof input.tableId !== "string" ||
      input.tableId.trim() === ""
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "tableId is required for TABLE placeType"
      );
    }
  } else if (input.placeType === PlaceType.ROOM) {
    if (
      !input.roomId ||
      typeof input.roomId !== "string" ||
      input.roomId.trim() === ""
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "roomId is required for ROOM placeType"
      );
    }
  } else if (input.placeType === PlaceType.COUNTER) {
    if (
      !input.counterId ||
      typeof input.counterId !== "string" ||
      input.counterId.trim() === ""
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "counterId is required for COUNTER placeType"
      );
    }
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    return fail(
      DomainErrorCode.VALIDATION_FAILED,
      "Order must contain at least one item"
    );
  }

  for (const itemReq of input.items) {
    if (!itemReq || typeof itemReq !== "object") {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Invalid item request in items array"
      );
    }
    if (
      !itemReq.menuItemId ||
      typeof itemReq.menuItemId !== "string" ||
      itemReq.menuItemId.trim() === ""
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        "Item menuItemId is required and must be non-empty"
      );
    }
    if (
      typeof itemReq.quantity !== "number" ||
      !Number.isInteger(itemReq.quantity) ||
      itemReq.quantity <= 0
    ) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Item quantity must be a positive integer, received: ${itemReq.quantity}`
      );
    }
  }

  // 2. Check idempotency key first via order repository
  const existingOrderResult = await deps.orderRepo.findByIdempotencyKey(
    input.venueId,
    input.idempotencyKey.trim()
  );
  if (existingOrderResult.ok) {
    return ok(existingOrderResult.value);
  }
  if (existingOrderResult.error.code !== DomainErrorCode.NOT_FOUND) {
    return existingOrderResult;
  }

  // 3. Read venue to obtain the authoritative tax rate
  const venueResult = await deps.venueRepo.findById(input.venueId);
  if (!venueResult.ok) {
    return venueResult;
  }
  const venue = venueResult.value;

  // 4. Read each item from menu repository and freeze authoritative prices
  const orderItems: CreateOrderItemInput[] = [];
  const lineTotals: string[] = [];

  for (const itemReq of input.items) {
    const itemResult = await deps.menuRepo.getItemWithModifiers(
      input.venueId,
      itemReq.menuItemId.trim()
    );
    if (!itemResult.ok) {
      if (itemResult.error.code === DomainErrorCode.NOT_FOUND) {
        return fail(
          DomainErrorCode.NOT_FOUND,
          `Menu item '${itemReq.menuItemId}' not found`
        );
      }
      return itemResult;
    }

    const menuItem = itemResult.value;

    if (menuItem.state !== MenuItemState.AVAILABLE) {
      return fail(
        DomainErrorCode.VALIDATION_FAILED,
        `Menu item '${menuItem.name}' is not available for ordering`
      );
    }

    // Collect available modifier options for this item
    const availableOptions = new Map<
      string,
      { id: string; name: string; additionalPrice: string }
    >();
    for (const group of menuItem.modifierGroups ?? []) {
      for (const opt of group.options ?? []) {
        availableOptions.set(opt.id, {
          id: opt.id,
          name: opt.name,
          additionalPrice: opt.additionalPrice,
        });
      }
    }

    const selectedModifiers: Array<{
      id: string;
      name: string;
      price: string;
    }> = [];
    const modifierPrices: string[] = [];

    if (Array.isArray(itemReq.selectedModifierIds)) {
      for (const modId of itemReq.selectedModifierIds) {
        const option = availableOptions.get(modId);
        if (!option) {
          return fail(
            DomainErrorCode.VALIDATION_FAILED,
            `Modifier option '${modId}' is invalid for menu item '${menuItem.name}'`
          );
        }
        selectedModifiers.push({
          id: option.id,
          name: option.name,
          price: option.additionalPrice,
        });
        modifierPrices.push(option.additionalPrice);
      }
    }

    const lineTotalResult = computeLineTotal(
      menuItem.price,
      modifierPrices,
      itemReq.quantity
    );
    if (!lineTotalResult.ok) {
      return lineTotalResult;
    }

    const modifierPriceResult = computeSubtotal(modifierPrices);
    if (!modifierPriceResult.ok) {
      return modifierPriceResult;
    }

    lineTotals.push(lineTotalResult.value);
    orderItems.push({
      menuItemId: menuItem.id,
      itemName: menuItem.name,
      itemPrice: menuItem.price,
      quantity: itemReq.quantity,
      modifiersJson: selectedModifiers,
      modifierPrice: modifierPriceResult.value,
      lineTotal: lineTotalResult.value,
      notes: itemReq.notes?.trim() || null,
    });
  }

  // 5. Compute subtotal, tax amount, and total
  const subtotalResult = computeSubtotal(lineTotals);
  if (!subtotalResult.ok) {
    return subtotalResult;
  }
  const subtotal = subtotalResult.value;

  const taxResult = computeTax(subtotal, venue.taxRate);
  if (!taxResult.ok) {
    return taxResult;
  }
  const taxAmount = taxResult.value;

  const totalResult = computeTotal(subtotal, taxAmount);
  if (!totalResult.ok) {
    return totalResult;
  }
  const total = totalResult.value;

  // 6. Assemble CreateOrderInput with frozen authoritative values
  const createInput: CreateOrderInput = {
    venueId: input.venueId,
    idempotencyKey: input.idempotencyKey.trim(),
    placeType: input.placeType,
    tableId:
      input.placeType === PlaceType.TABLE
        ? input.tableId?.trim() ?? null
        : null,
    roomId:
      input.placeType === PlaceType.ROOM
        ? input.roomId?.trim() ?? null
        : null,
    counterId:
      input.placeType === PlaceType.COUNTER
        ? input.counterId?.trim() ?? null
        : null,
    pickupName: input.pickupName?.trim() || null,
    guestSessionId: input.guestSessionId?.trim() || null,
    subtotal,
    taxRate: venue.taxRate,
    taxAmount,
    total,
    notes: input.notes?.trim() || null,
    items: orderItems,
  };

  // 7. Persist via order repository and return result unchanged
  return await deps.orderRepo.create(createInput);
}

