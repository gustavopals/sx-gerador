-- CreateTable
CREATE TABLE "Index" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "descPt" TEXT NOT NULL,
    "descEs" TEXT,
    "descEn" TEXT,
    "owner" "OwnerType" NOT NULL DEFAULT 'U',
    "searchExpr" TEXT,
    "nickname" TEXT,
    "showSearch" "YesNo" NOT NULL DEFAULT 'S',
    "isVirtual" "YesNo" NOT NULL DEFAULT 'N',
    "virtualCustomizable" "YesNo" NOT NULL DEFAULT 'N',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Index_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Index_tableId_idx" ON "Index"("tableId");

-- CreateIndex
CREATE INDEX "Index_deletedAt_idx" ON "Index"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Index_tableId_order_key" ON "Index"("tableId", "order");

-- AddForeignKey
ALTER TABLE "Index" ADD CONSTRAINT "Index_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
