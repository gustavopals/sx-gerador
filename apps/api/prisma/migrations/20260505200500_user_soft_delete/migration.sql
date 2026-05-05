-- AlterTable
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "hardDeleteScheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_hardDeleteScheduledAt_idx" ON "User"("hardDeleteScheduledAt");
