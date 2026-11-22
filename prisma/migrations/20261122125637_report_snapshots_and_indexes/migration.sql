-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "categoryName" TEXT;

-- CreateIndex
CREATE INDEX "guest_sessions_venueId_createdAt_idx" ON "guest_sessions"("venueId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_venueId_state_placedAt_idx" ON "orders"("venueId", "state", "placedAt");

-- CreateIndex
CREATE INDEX "service_requests_venueId_serviceType_submittedAt_idx" ON "service_requests"("venueId", "serviceType", "submittedAt");
