import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { MigrationsController } from './migrations.controller';
import type { MigrationsService } from './migrations.service';

export function createMigrationsRouter(service: MigrationsService): Router {
  const router = Router();
  const ctrl = new MigrationsController(service);

  router.get('/projects/:projectId/migrations', requireAuth, ctrl.list);
  router.get('/projects/:projectId/migrations/draft', requireAuth, ctrl.draft);
  router.post('/projects/:projectId/migrations/generate', requireAuth, ctrl.generate);
  router.get('/projects/:projectId/migrations/:id/preview', requireAuth, ctrl.preview);
  router.get('/projects/:projectId/migrations/:id/download', requireAuth, ctrl.download);

  return router;
}
