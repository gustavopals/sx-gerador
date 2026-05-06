-- CreateEnum
CREATE TYPE "SharingMode" AS ENUM ('C', 'E');

-- CreateEnum
CREATE TYPE "YesNo" AS ENUM ('S', 'N');

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "namePt" TEXT NOT NULL,
    "nameEs" TEXT,
    "nameEn" TEXT,
    "routine" TEXT,
    "modeCompany" "SharingMode" NOT NULL DEFAULT 'C',
    "modeUnit" "SharingMode" NOT NULL DEFAULT 'C',
    "modeBranch" "SharingMode" NOT NULL DEFAULT 'C',
    "ttsEnabled" "YesNo" NOT NULL DEFAULT 'S',
    "uniqueKey" VARCHAR(250),
    "pyme" "YesNo" NOT NULL DEFAULT 'N',
    "modules" INTEGER NOT NULL DEFAULT 0,
    "hasClob" "YesNo" NOT NULL DEFAULT 'N',
    "autoIncRec" "YesNo" NOT NULL DEFAULT 'N',
    "tamFil" INTEGER NOT NULL DEFAULT 2,
    "tamUn" INTEGER NOT NULL DEFAULT 2,
    "tamEmp" INTEGER NOT NULL DEFAULT 2,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Table_projectId_idx" ON "Table"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_projectId_prefix_key" ON "Table"("projectId", "prefix");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
