import {
  ApplyTemplateBodySchema,
  ApplyTemplatePreviewBodySchema,
  CreateTemplateFromTableSchema,
} from '@sxgerador/shared-types';
import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { TemplatesController } from './templates.controller';
import type { TemplatesService } from './templates.service';

export function createTemplatesRouter(service: TemplatesService): Router {
  const router = Router();
  const ctrl = new TemplatesController(service);

  router.get('/templates', optionalAuth, ctrl.list);
  router.get('/templates/:id', optionalAuth, ctrl.get);
  router.post(
    '/templates',
    requireAuth,
    validate(CreateTemplateFromTableSchema),
    ctrl.createFromTable,
  );
  router.post(
    '/templates/:id/apply/preview',
    requireAuth,
    validate(ApplyTemplatePreviewBodySchema),
    ctrl.previewApply,
  );
  router.post('/templates/:id/apply', requireAuth, validate(ApplyTemplateBodySchema), ctrl.apply);

  return router;
}
