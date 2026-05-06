import { CreateTableSchema, UpdateTableSchema } from '@sxgerador/shared-types';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { TablesController } from './tables.controller';
import type { TablesService } from './tables.service';

export function createTablesRouter(service: TablesService): Router {
  const router = Router();
  const ctrl = new TablesController(service);

  router.get('/projects/:projectId/tables', requireAuth, ctrl.list);
  router.post('/projects/:projectId/tables', requireAuth, validate(CreateTableSchema), ctrl.create);
  router.get('/projects/:projectId/tables/:id', requireAuth, ctrl.get);
  router.patch(
    '/projects/:projectId/tables/:id',
    requireAuth,
    validate(UpdateTableSchema),
    ctrl.update,
  );
  router.delete('/projects/:projectId/tables/:id', requireAuth, ctrl.delete);
  router.post('/projects/:projectId/tables/:id/restore', requireAuth, ctrl.restore);

  return router;
}
