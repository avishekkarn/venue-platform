-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "view" TEXT NOT NULL,
    "paramsJson" JSONB NOT NULL DEFAULT '{}',
    "createdByStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_runs" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "view" TEXT NOT NULL,
    "paramsJson" JSONB NOT NULL DEFAULT '{}',
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ranByStaffId" TEXT,

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_reports_venueId_view_idx" ON "saved_reports"("venueId", "view");

-- CreateIndex
CREATE UNIQUE INDEX "saved_reports_venueId_name_key" ON "saved_reports"("venueId", "name");

-- CreateIndex
CREATE INDEX "report_runs_venueId_ranAt_idx" ON "report_runs"("venueId", "ranAt");

-- CreateIndex
CREATE INDEX "report_runs_venueId_view_idx" ON "report_runs"("venueId", "view");

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_reports" ADD CONSTRAINT "saved_reports_createdByStaffId_fkey" FOREIGN KEY ("createdByStaffId") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_ranByStaffId_fkey" FOREIGN KEY ("ranByStaffId") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
