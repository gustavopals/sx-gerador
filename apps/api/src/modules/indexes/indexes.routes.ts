import { CreateIndexSchema, UpdateIndexSchema } from '@sxgerador/shared-types';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { IndexesController } from './indexes.controller';
import type { IndexesService } from './indexes.service';

export function createIndexesRouter(service: IndexesService): Router {
  const router = Router();
  const ctrl = new IndexesController(service);

  router.get('/projects/:projectId/tables/:tableId/indexes', requireAuth, ctrl.list);
  router.post(
    '/projects/:projectId/tables/:tableId/indexes',
    requireAuth,
    validate(CreateIndexSchema),
    ctrl.create,
  );
  router.get('/projects/:projectId/tables/:tableId/indexes/:id', requireAuth, ctrl.get);
  router.patch(
    '/projects/:projectId/tables/:tableId/indexes/:id',
    requireAuth,
    validate(UpdateIndexSchema),
    ctrl.update,
  );
  router.delete('/projects/:projectId/tables/:tableId/indexes/:id', requireAuth, ctrl.delete);
  router.post(
    '/projects/:projectId/tables/:tableId/indexes/:id/restore',
    requireAuth,
    ctrl.restore,
  );

  return router;
}
