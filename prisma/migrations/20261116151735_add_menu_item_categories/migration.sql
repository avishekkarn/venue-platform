-- CreateTable
CREATE TABLE "menu_item_categories" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_item_categories_pkey" PRIMARY KEY ("id")
);

-- Backfill (before the drop)
INSERT INTO "menu_item_categories" ("id", "venueId", "menuItemId", "categoryId", "sortOrder")
SELECT gen_random_uuid()::text, "venueId", "id", "categoryId", "sortOrder"
FROM "menu_items";

-- DropForeignKey
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_categoryId_fkey";

-- DropIndex
DROP INDEX "menu_items_categoryId_idx";

-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "categoryId";

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_categories_menuItemId_categoryId_key" ON "menu_item_categories"("menuItemId", "categoryId");

-- CreateIndex
CREATE INDEX "menu_item_categories_venueId_idx" ON "menu_item_categories"("venueId");

-- CreateIndex
CREATE INDEX "menu_item_categories_categoryId_idx" ON "menu_item_categories"("categoryId");

-- AddForeignKey
ALTER TABLE "menu_item_categories" ADD CONSTRAINT "menu_item_categories_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_categories" ADD CONSTRAINT "menu_item_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
