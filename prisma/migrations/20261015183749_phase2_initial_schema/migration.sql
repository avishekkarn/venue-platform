-- CreateEnum
CREATE TYPE "VenueModule" AS ENUM ('TABLE', 'ROOM', 'COUNTER', 'KITCHEN');

-- CreateEnum
CREATE TYPE "HotelService" AS ENUM ('ROOM_SERVICE_FOOD', 'HOUSEKEEPING', 'MAINTENANCE', 'CONCIERGE', 'LAUNDRY', 'SPA', 'LATE_CHECKOUT', 'WAKE_UP_CALL', 'DO_NOT_DISTURB');

-- CreateEnum
CREATE TYPE "TableState" AS ENUM ('FREE', 'OCCUPIED', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "RoomState" AS ENUM ('OCCUPIED', 'VACANT', 'CLEANING', 'OUT_OF_SERVICE');

-- CreateEnum
CREATE TYPE "QrTokenState" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('TABLE', 'ROOM', 'COUNTER');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'MANAGER', 'CHEF', 'TABLE_SERVICE', 'ROOM_SERVICE', 'HOUSEKEEPING', 'MAINTENANCE', 'CONCIERGE', 'LAUNDRY', 'SPA', 'FRONT_DESK');

-- CreateEnum
CREATE TYPE "StaffState" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "MenuItemState" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ModifierChoiceType" AS ENUM ('SINGLE', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "OrderState" AS ENUM ('PLACED', 'APPROVED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestState" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DECLINED');

-- CreateEnum
CREATE TYPE "PaymentState" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brandColor" TEXT NOT NULL DEFAULT '#1a1a1a',
    "logoUrl" TEXT,
    "heroImageUrl" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Welcome',
    "language" TEXT NOT NULL DEFAULT 'en',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "taxRate" DECIMAL(5,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_module_toggles" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "module" "VenueModule" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "venue_module_toggles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_service_toggles" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "service" "HotelService" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "venue_service_toggles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "state" "TableState" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "state" "RoomState" NOT NULL DEFAULT 'VACANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counters" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Counter',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "placeType" "PlaceType" NOT NULL,
    "tableId" TEXT,
    "roomId" TEXT,
    "counterId" TEXT,
    "state" "QrTokenState" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" "StaffRole"[],
    "state" "StaffState" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_sessions" (
    "id" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "staff_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" TEXT NOT NULL,
    "qrTokenId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "placeType" "PlaceType" NOT NULL,
    "tableId" TEXT,
    "roomId" TEXT,
    "counterId" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photoUrl" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "state" "MenuItemState" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_groups" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "choiceType" "ModifierChoiceType" NOT NULL DEFAULT 'SINGLE',
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modifier_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modifier_options" (
    "id" TEXT NOT NULL,
    "modifierGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "additionalPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modifier_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "guestSessionId" TEXT,
    "placeType" "PlaceType" NOT NULL,
    "tableId" TEXT,
    "roomId" TEXT,
    "counterId" TEXT,
    "pickupName" TEXT,
    "state" "OrderState" NOT NULL DEFAULT 'PLACED',
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,4) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "menuItemId" TEXT,
    "itemName" TEXT NOT NULL,
    "itemPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "modifiersJson" JSONB NOT NULL DEFAULT '[]',
    "modifierPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_state_changes" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "state" "OrderState" NOT NULL,
    "staffMemberId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_state_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "roomId" TEXT,
    "serviceType" "HotelService" NOT NULL,
    "state" "RequestState" NOT NULL DEFAULT 'SUBMITTED',
    "detailsJson" JSONB NOT NULL DEFAULT '{}',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_state_changes" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "state" "RequestState" NOT NULL,
    "staffMemberId" TEXT,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_state_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_tickets" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "state" "PaymentState" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "payment_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "paymentTicketId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "tipAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "guestEmail" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_slug_key" ON "venues"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "venue_module_toggles_venueId_module_key" ON "venue_module_toggles"("venueId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "venue_service_toggles_venueId_service_key" ON "venue_service_toggles"("venueId", "service");

-- CreateIndex
CREATE INDEX "tables_venueId_idx" ON "tables"("venueId");

-- CreateIndex
CREATE INDEX "tables_venueId_state_idx" ON "tables"("venueId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "tables_venueId_number_key" ON "tables"("venueId", "number");

-- CreateIndex
CREATE INDEX "rooms_venueId_idx" ON "rooms"("venueId");

-- CreateIndex
CREATE INDEX "rooms_venueId_state_idx" ON "rooms"("venueId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_venueId_number_key" ON "rooms"("venueId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "counters_venueId_key" ON "counters"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_token_key" ON "qr_tokens"("token");

-- CreateIndex
CREATE INDEX "qr_tokens_token_idx" ON "qr_tokens"("token");

-- CreateIndex
CREATE INDEX "qr_tokens_venueId_idx" ON "qr_tokens"("venueId");

-- CreateIndex
CREATE INDEX "qr_tokens_venueId_state_idx" ON "qr_tokens"("venueId", "state");

-- CreateIndex
CREATE INDEX "staff_members_venueId_idx" ON "staff_members"("venueId");

-- CreateIndex
CREATE INDEX "staff_members_venueId_state_idx" ON "staff_members"("venueId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_venueId_username_key" ON "staff_members"("venueId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "staff_sessions_token_key" ON "staff_sessions"("token");

-- CreateIndex
CREATE INDEX "staff_sessions_token_idx" ON "staff_sessions"("token");

-- CreateIndex
CREATE INDEX "staff_sessions_staffMemberId_idx" ON "staff_sessions"("staffMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_token_key" ON "guest_sessions"("token");

-- CreateIndex
CREATE INDEX "guest_sessions_token_idx" ON "guest_sessions"("token");

-- CreateIndex
CREATE INDEX "guest_sessions_qrTokenId_idx" ON "guest_sessions"("qrTokenId");

-- CreateIndex
CREATE INDEX "menu_categories_venueId_sortOrder_idx" ON "menu_categories"("venueId", "sortOrder");

-- CreateIndex
CREATE INDEX "menu_items_venueId_idx" ON "menu_items"("venueId");

-- CreateIndex
CREATE INDEX "menu_items_categoryId_idx" ON "menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "menu_items_venueId_state_idx" ON "menu_items"("venueId", "state");

-- CreateIndex
CREATE INDEX "modifier_groups_menuItemId_idx" ON "modifier_groups"("menuItemId");

-- CreateIndex
CREATE INDEX "modifier_options_modifierGroupId_idx" ON "modifier_options"("modifierGroupId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

-- CreateIndex
CREATE INDEX "orders_venueId_state_idx" ON "orders"("venueId", "state");

-- CreateIndex
CREATE INDEX "orders_venueId_placedAt_idx" ON "orders"("venueId", "placedAt");

-- CreateIndex
CREATE INDEX "orders_guestSessionId_idx" ON "orders"("guestSessionId");

-- CreateIndex
CREATE INDEX "orders_tableId_idx" ON "orders"("tableId");

-- CreateIndex
CREATE INDEX "orders_roomId_idx" ON "orders"("roomId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_state_changes_orderId_idx" ON "order_state_changes"("orderId");

-- CreateIndex
CREATE INDEX "service_requests_venueId_state_idx" ON "service_requests"("venueId", "state");

-- CreateIndex
CREATE INDEX "service_requests_venueId_serviceType_idx" ON "service_requests"("venueId", "serviceType");

-- CreateIndex
CREATE INDEX "service_requests_venueId_submittedAt_idx" ON "service_requests"("venueId", "submittedAt");

-- CreateIndex
CREATE INDEX "request_state_changes_requestId_idx" ON "request_state_changes"("requestId");

-- CreateIndex
CREATE INDEX "payment_tickets_orderId_idx" ON "payment_tickets"("orderId");

-- CreateIndex
CREATE INDEX "payment_tickets_venueId_state_idx" ON "payment_tickets"("venueId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_paymentTicketId_key" ON "receipts"("paymentTicketId");

-- CreateIndex
CREATE INDEX "receipts_orderId_idx" ON "receipts"("orderId");

-- AddForeignKey
ALTER TABLE "venue_module_toggles" ADD CONSTRAINT "venue_module_toggles_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_service_toggles" ADD CONSTRAINT "venue_service_toggles_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counters" ADD CONSTRAINT "counters_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "counters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_sessions" ADD CONSTRAINT "staff_sessions_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_qrTokenId_fkey" FOREIGN KEY ("qrTokenId") REFERENCES "qr_tokens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modifier_options" ADD CONSTRAINT "modifier_options_modifierGroupId_fkey" FOREIGN KEY ("modifierGroupId") REFERENCES "modifier_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "guest_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "counters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_state_changes" ADD CONSTRAINT "order_state_changes_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_state_changes" ADD CONSTRAINT "order_state_changes_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_state_changes" ADD CONSTRAINT "request_state_changes_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_state_changes" ADD CONSTRAINT "request_state_changes_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_tickets" ADD CONSTRAINT "payment_tickets_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_tickets" ADD CONSTRAINT "payment_tickets_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_paymentTicketId_fkey" FOREIGN KEY ("paymentTicketId") REFERENCES "payment_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
