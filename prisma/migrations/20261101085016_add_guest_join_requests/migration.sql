-- CreateTable
CREATE TABLE "guest_join_requests" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "requestingDevice" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "guest_join_requests_sessionId_idx" ON "guest_join_requests"("sessionId");

-- CreateIndex
CREATE INDEX "guest_join_requests_requestingDevice_idx" ON "guest_join_requests"("requestingDevice");

-- AddForeignKey
ALTER TABLE "guest_join_requests" ADD CONSTRAINT "guest_join_requests_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "guest_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
