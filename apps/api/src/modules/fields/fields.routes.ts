import { CreateFieldSchema, UpdateFieldSchema } from '@sxgerador/shared-types';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { FieldsController } from './fields.controller';
import type { FieldsService } from './fields.service';

const ReorderFieldsSchema = z.object({
  fieldIds: z.array(z.string().cuid()).min(1),
});

const BulkUpdateFieldsSchema = z.object({
  fieldIds: z.array(z.string().cuid()).min(1),
  changes: UpdateFieldSchema,
});

export function createFieldsRouter(service: FieldsService): Router {
  const router = Router();
  const ctrl = new FieldsController(service);

  router.get('/projects/:projectId/tables/:tableId/fields', requireAuth, ctrl.list);
  router.post(
    '/projects/:projectId/tables/:tableId/fields',
    requireAuth,
    validate(CreateFieldSchema),
    ctrl.create,
  );
  router.post(
    '/projects/:projectId/tables/:tableId/fields/reorder',
    requireAuth,
    validate(ReorderFieldsSchema),
    ctrl.reorder,
  );
  router.post(
    '/projects/:projectId/tables/:tableId/fields/bulk',
    requireAuth,
    validate(BulkUpdateFieldsSchema),
    ctrl.bulkUpdate,
  );
  router.get('/projects/:projectId/tables/:tableId/fields/:id', requireAuth, ctrl.get);
  router.patch(
    '/projects/:projectId/tables/:tableId/fields/:id',
    requireAuth,
    validate(UpdateFieldSchema),
    ctrl.update,
  );
  router.delete('/projects/:projectId/tables/:tableId/fields/:id', requireAuth, ctrl.delete);
  router.post('/projects/:projectId/tables/:tableId/fields/:id/restore', requireAuth, ctrl.restore);

  return router;
}
