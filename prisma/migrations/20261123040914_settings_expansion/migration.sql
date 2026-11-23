-- AlterTable
ALTER TABLE "menu_categories" ADD COLUMN     "taxRateId" TEXT;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "taxRateId" TEXT;

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "counterPhone" TEXT,
ADD COLUMN     "currencyLockedAt" TIMESTAMP(3),
ADD COLUMN     "receiptFooter" TEXT,
ADD COLUMN     "receiptHeader" TEXT,
ADD COLUMN     "taxRateId" TEXT,
ADD COLUMN     "timeFormat" TEXT NOT NULL DEFAULT '12h';

-- CreateTable
CREATE TABLE "tax_rates" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(6,4) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isInclusive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_rates_venueId_isActive_idx" ON "tax_rates"("venueId", "isActive");

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rates" ADD CONSTRAINT "tax_rates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_taxRateId_fkey" FOREIGN KEY ("taxRateId") REFERENCES "tax_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
