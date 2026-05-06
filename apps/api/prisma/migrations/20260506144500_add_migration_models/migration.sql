-- CreateEnum
CREATE TYPE "MigrationOperation" AS ENUM (
    'CREATE_TABLE',
    'ALTER_TABLE',
    'DROP_TABLE',
    'CREATE_FIELD',
    'ALTER_FIELD',
    'DROP_FIELD',
    'CREATE_INDEX',
    'ALTER_INDEX',
    'DROP_INDEX'
);

-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('DRAFT', 'GENERATED');

-- CreateTable
CREATE TABLE "Migration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "MigrationStatus" NOT NULL DEFAULT 'DRAFT',
    "advplCode" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Migration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MigrationItem" (
    "id" TEXT NOT NULL,
    "migrationId" TEXT NOT NULL,
    "operation" "MigrationOperation" NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "targetName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MigrationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Migration_projectId_sequence_key" ON "Migration"("projectId", "sequence");

-- CreateIndex
CREATE INDEX "Migration_projectId_idx" ON "Migration"("projectId");

-- CreateIndex
CREATE INDEX "MigrationItem_migrationId_idx" ON "MigrationItem"("migrationId");

-- AddForeignKey
ALTER TABLE "Migration" ADD CONSTRAINT "Migration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MigrationItem" ADD CONSTRAINT "MigrationItem_migrationId_fkey" FOREIGN KEY ("migrationId") REFERENCES "Migration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
