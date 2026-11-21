-- AlterTable
ALTER TABLE "rooms" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "table_categories" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isReserved" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_categories" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "table_categories_venueId_sortOrder_idx" ON "table_categories"("venueId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "table_categories_venueId_name_key" ON "table_categories"("venueId", "name");

-- CreateIndex
CREATE INDEX "room_categories_venueId_sortOrder_idx" ON "room_categories"("venueId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "room_categories_venueId_name_key" ON "room_categories"("venueId", "name");

-- CreateIndex
CREATE INDEX "rooms_categoryId_idx" ON "rooms"("categoryId");

-- CreateIndex
CREATE INDEX "tables_categoryId_idx" ON "tables"("categoryId");

-- AddForeignKey
ALTER TABLE "table_categories" ADD CONSTRAINT "table_categories_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_categories" ADD CONSTRAINT "room_categories_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "table_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "room_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
