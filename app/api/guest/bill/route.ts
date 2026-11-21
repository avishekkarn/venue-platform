import { NextResponse, type NextRequest } from "next/server";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { getGuestCookie } from "@/infrastructure/guest/cookies";
import { getGuestSession } from "@/domain/guest/guest-session.service";
import { createPrismaGuestSessionRepository } from "@/infrastructure/db/repositories/guest-session.repo";
import { createPrismaOrderRepository } from "@/infrastructure/db/repositories/order.repo";
import { createPrismaVenueRepository } from "@/infrastructure/db/repositories/organization.repo";
import { PlaceType } from "@/domain/guest/guest-session.repository";
import { OrderState } from "@/domain/orders/order.repository";
import { RequestState } from "@/domain/requests/request.repository";
import { DomainErrorCode } from "@/domain/shared/result";

type DbClient = PrismaClient | Prisma.TransactionClient;

let testDbClient: DbClient | null = null;

export function setTestDbClient(client: DbClient | null): void {
  testDbClient = client;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const db = testDbClient ?? prisma;

  // 1. Session check: token from guest session cookie
  const cookie = await getGuestCookie();
  if (!cookie) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.UNAUTHORIZED,
          message: "No active guest session",
        },
      },
      { status: 401 }
    );
  }

  const guestRepo = createPrismaGuestSessionRepository(db);
  const sessionResult = await getGuestSession({ repo: guestRepo }, cookie);
  if (!sessionResult.ok) {
    return NextResponse.json(
      {
        error: {
          code: DomainErrorCode.UNAUTHORIZED,
          message: sessionResult.error.message,
        },
      },
      { status: 401 }
    );
  }
  const session = sessionResult.value;

  const venueRepo = createPrismaVenueRepository(db);
  const venueResult = await venueRepo.findById(session.venueId);
  const currency = venueResult.ok ? venueResult.value.currency : "NPR";

  // 2. Resolve place context
  let placeLabel = "Guest";
  let roomStayCharge: {
    categoryName: string;
    basePrice: string;
  } | null = null;
  let roomSubtotal = new Prisma.Decimal(0);

  if (session.placeType === PlaceType.TABLE && session.placeId) {
    const table = await db.table.findUnique({ where: { id: session.placeId } });
    if (table) placeLabel = `Table ${table.number}`;
  } else if (session.placeType === PlaceType.ROOM && session.placeId) {
    const room = await db.room.findUnique({
      where: { id: session.placeId },
      include: { category: true },
    });
    if (room) {
      placeLabel = `Room ${room.number}`;
      if (room.category && room.category.basePrice.gt(0)) {
        const rate = new Prisma.Decimal(room.category.basePrice);
        roomSubtotal = rate;
        roomStayCharge = {
          categoryName: room.category.name,
          basePrice: rate.toFixed(2),
        };
      }
    }
  }

  // 3. Fetch active non-cancelled food & drink orders
  const orderRepo = createPrismaOrderRepository(db);
  const ordersResult = await orderRepo.listForGuestSession(
    session.venueId,
    session.id
  );
  const orders = ordersResult.ok
    ? ordersResult.value.filter((o) => o.state !== OrderState.CANCELLED)
    : [];

  let ordersSubtotal = new Prisma.Decimal(0);
  let ordersTax = new Prisma.Decimal(0);
  let ordersTotal = new Prisma.Decimal(0);

  const orderLineItems = orders.map((o) => {
    const sub = new Prisma.Decimal(o.subtotal);
    const tax = new Prisma.Decimal(o.taxAmount);
    const tot = new Prisma.Decimal(o.total);
    ordersSubtotal = ordersSubtotal.add(sub);
    ordersTax = ordersTax.add(tax);
    ordersTotal = ordersTotal.add(tot);

    return {
      id: o.id,
      placedAt: o.placedAt,
      state: o.state,
      total: o.total,
      items: o.items.map((i) => ({
        name: i.itemName,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
      })),
    };
  });

  // 4. If ROOM session, fetch payable service requests
  const payableServices: Array<{
    id: string;
    serviceName: string;
    price: string;
    createdAt: Date;
    state: string;
  }> = [];
  let servicesSubtotal = new Prisma.Decimal(0);

  if (session.placeType === PlaceType.ROOM) {
    const requests = await db.serviceRequest.findMany({
      where: {
        venueId: session.venueId,
        guestSessionId: session.id,
        state: {
          notIn: [RequestState.CANCELLED, RequestState.DECLINED],
        },
        serviceItemId: { not: null },
      },
      include: {
        serviceItem: true,
      },
    });

    for (const r of requests) {
      if (r.serviceItem && r.serviceItem.price.gt(0)) {
        const itemPrice = new Prisma.Decimal(r.serviceItem.price);
        servicesSubtotal = servicesSubtotal.add(itemPrice);
        payableServices.push({
          id: r.id,
          serviceName: r.serviceItem.name,
          price: itemPrice.toFixed(2),
          createdAt: r.submittedAt,
          state: r.state,
        });
      }
    }
  }

  const grandSubtotal = ordersSubtotal.add(servicesSubtotal).add(roomSubtotal);
  const grandTax = ordersTax;
  const grandTotal = grandSubtotal.add(grandTax);

  return NextResponse.json(
    {
      data: {
        placeType: session.placeType,
        placeLabel,
        currency,
        orders: orderLineItems,
        payableServices,
        summary: {
          ordersCount: orders.length,
          ordersTotal: ordersTotal.toFixed(2),
          payableServicesCount: payableServices.length,
          payableServicesTotal: servicesSubtotal.toFixed(2),
          roomStayCharge,
          subtotal: grandSubtotal.toFixed(2),
          tax: grandTax.toFixed(2),
          total: grandTotal.toFixed(2),
        },
      },
    },
    { status: 200 }
  );
}
