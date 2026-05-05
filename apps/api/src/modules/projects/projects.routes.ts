import { CreateProjectSchema, UpdateProjectSchema } from '@sxgerador/shared-types';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { ProjectsController } from './projects.controller';
import type { ProjectsService } from './projects.service';

export function createProjectsRouter(service: ProjectsService): Router {
  const router = Router();
  const ctrl = new ProjectsController(service);

  router.get('/projects', requireAuth, ctrl.list);
  router.post('/projects', requireAuth, validate(CreateProjectSchema), ctrl.create);
  router.get('/projects/:id', requireAuth, ctrl.get);
  router.patch('/projects/:id', requireAuth, validate(UpdateProjectSchema), ctrl.update);
  router.delete('/projects/:id', requireAuth, ctrl.delete);
  router.post('/projects/:id/restore', requireAuth, ctrl.restore);
  router.post('/projects/:id/duplicate', requireAuth, ctrl.duplicate);

  return router;
}
