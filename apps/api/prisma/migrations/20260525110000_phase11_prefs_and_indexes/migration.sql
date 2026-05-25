-- Fase 11: preferências de UI por usuário e índices alinhados às telas críticas.
ALTER TABLE "User" ADD COLUMN "prefs" JSONB;

CREATE INDEX "Project_ownerUserId_deletedAt_updatedAt_idx" ON "Project"("ownerUserId", "deletedAt", "updatedAt");
CREATE INDEX "Project_ownerTeamId_deletedAt_updatedAt_idx" ON "Project"("ownerTeamId", "deletedAt", "updatedAt");

CREATE INDEX "Table_projectId_deletedAt_updatedAt_idx" ON "Table"("projectId", "deletedAt", "updatedAt");
CREATE INDEX "Field_tableId_deletedAt_order_idx" ON "Field"("tableId", "deletedAt", "order");
CREATE INDEX "Index_tableId_deletedAt_order_idx" ON "Index"("tableId", "deletedAt", "order");

CREATE INDEX "Migration_projectId_status_createdAt_idx" ON "Migration"("projectId", "status", "createdAt");

CREATE INDEX "Template_isOfficial_downloads_createdAt_idx" ON "Template"("isOfficial", "downloads", "createdAt");
CREATE INDEX "Template_sourceTablePrefix_idx" ON "Template"("sourceTablePrefix");
