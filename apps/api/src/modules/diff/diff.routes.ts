import { CompareMigrationsBodySchema, CompareProjectsBodySchema } from '@sxgerador/shared-types';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { DiffController } from './diff.controller';
import type { DiffService } from './diff.service';

export function createDiffRouter(service: DiffService): Router {
  const router = Router();
  const ctrl = new DiffController(service);

  router.post(
    '/diff/projects',
    requireAuth,
    validate(CompareProjectsBodySchema),
    ctrl.compareProjects,
  );
  router.post(
    '/diff/migrations',
    requireAuth,
    validate(CompareMigrationsBodySchema),
    ctrl.compareMigrations,
  );

  return router;
}
