-- CreateTable
CREATE TABLE "menu_collections" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "featuredFrom" TIMESTAMP(3),
    "featuredTo" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_collection_items" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "menu_collection_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "menu_collections_venueId_sortOrder_idx" ON "menu_collections"("venueId", "sortOrder");

-- CreateIndex
CREATE INDEX "menu_collection_items_venueId_idx" ON "menu_collection_items"("venueId");

-- CreateIndex
CREATE INDEX "menu_collection_items_collectionId_idx" ON "menu_collection_items"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_collection_items_collectionId_menuItemId_key" ON "menu_collection_items"("collectionId", "menuItemId");

-- AddForeignKey
ALTER TABLE "menu_collections" ADD CONSTRAINT "menu_collections_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_collection_items" ADD CONSTRAINT "menu_collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "menu_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_collection_items" ADD CONSTRAINT "menu_collection_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
