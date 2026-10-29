-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "HotelService" ADD VALUE 'CALL_WAITER';
ALTER TYPE "HotelService" ADD VALUE 'REQUEST_BILL';

-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "counterId" TEXT,
ADD COLUMN     "placeType" "PlaceType",
ADD COLUMN     "tableId" TEXT;

-- CreateIndex
CREATE INDEX "service_requests_venueId_tableId_idx" ON "service_requests"("venueId", "tableId");

-- CreateIndex
CREATE INDEX "service_requests_venueId_counterId_idx" ON "service_requests"("venueId", "counterId");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "counters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
