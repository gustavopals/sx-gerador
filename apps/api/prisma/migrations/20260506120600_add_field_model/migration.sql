-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('C', 'N', 'D', 'M', 'L');

-- CreateEnum
CREATE TYPE "VisualMode" AS ENUM ('V', 'A', 'R');

-- CreateEnum
CREATE TYPE "ContextMode" AS ENUM ('R', 'V');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('U', 'S');

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "size" INTEGER NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 0,
    "titlePt" TEXT NOT NULL,
    "titleEs" TEXT,
    "titleEn" TEXT,
    "descPt" TEXT NOT NULL,
    "descEs" TEXT,
    "descEn" TEXT,
    "picture" TEXT,
    "pictureVar" TEXT,
    "pictureBrowse" TEXT,
    "validation" TEXT,
    "userValidation" TEXT,
    "defaultRel" TEXT,
    "whenExpr" TEXT,
    "initBrowse" TEXT,
    "comboPt" TEXT,
    "comboEs" TEXT,
    "comboEn" TEXT,
    "searchKey" TEXT,
    "visualMode" "VisualMode" NOT NULL DEFAULT 'A',
    "contextMode" "ContextMode" NOT NULL DEFAULT 'R',
    "owner" "OwnerType" NOT NULL DEFAULT 'U',
    "required" TEXT,
    "showBrowse" "YesNo" NOT NULL DEFAULT 'S',
    "hasCheck" "YesNo" NOT NULL DEFAULT 'N',
    "hasTrigger" "YesNo" NOT NULL DEFAULT 'N',
    "level" INTEGER NOT NULL DEFAULT 0,
    "pyme" "YesNo" NOT NULL DEFAULT 'N',
    "serverIndex" "YesNo" NOT NULL DEFAULT 'N',
    "fieldIndex" "YesNo" NOT NULL DEFAULT 'N',
    "spelling" "YesNo" NOT NULL DEFAULT 'N',
    "modal" "YesNo" NOT NULL DEFAULT 'N',
    "positionLogix" "YesNo" NOT NULL DEFAULT 'N',
    "usadoFlags" JSONB NOT NULL DEFAULT '{}',
    "modulesFlags" JSONB NOT NULL DEFAULT '{}',
    "sqlCondition" VARCHAR(250),
    "sqlCheck" VARCHAR(250),
    "groupSxg" TEXT,
    "folder" TEXT,
    "screen" TEXT,
    "grouping" TEXT,
    "reserved" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Field_tableId_idx" ON "Field"("tableId");

-- CreateIndex
CREATE INDEX "Field_deletedAt_idx" ON "Field"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Field_tableId_name_key" ON "Field"("tableId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Field_tableId_order_key" ON "Field"("tableId", "order");

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;
