-- AlterTable
ALTER TABLE "service_requests" ADD COLUMN     "guestSessionId" TEXT;

-- CreateIndex
CREATE INDEX "service_requests_venueId_guestSessionId_idx" ON "service_requests"("venueId", "guestSessionId");

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "guest_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
