import {
  CreateProjectSchema,
  ImportApplyBodySchema,
  ImportCsvPreviewBodySchema,
  ImportPreviewBodySchema,
  UpdateProjectSchema,
} from '@sxgerador/shared-types';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import type { ProjectCsvService } from './project-csv.service';
import type { ProjectImportService } from './project-import.service';
import { ProjectsController } from './projects.controller';
import type { ProjectsService } from './projects.service';

export function createProjectsRouter(
  projects: ProjectsService,
  projectImport: ProjectImportService,
  projectCsv: ProjectCsvService,
): Router {
  const router = Router();
  const ctrl = new ProjectsController(projects, projectImport, projectCsv);

  router.get('/projects', requireAuth, ctrl.list);
  router.post('/projects', requireAuth, validate(CreateProjectSchema), ctrl.create);
  router.get('/projects/check-slug', requireAuth, ctrl.checkSlug);
  router.get('/projects/:id/export', requireAuth, ctrl.exportJson);
  router.get('/projects/:id/export/csv/:dictionary', requireAuth, ctrl.exportCsv);
  router.post(
    '/projects/:id/import/csv/preview',
    requireAuth,
    validate(ImportCsvPreviewBodySchema),
    ctrl.importCsvPreview,
  );
  router.post(
    '/projects/:id/import/csv',
    requireAuth,
    validate(ImportCsvPreviewBodySchema),
    ctrl.importCsvApply,
  );
  router.post(
    '/projects/:id/import/preview',
    requireAuth,
    validate(ImportPreviewBodySchema),
    ctrl.importPreview,
  );
  router.post(
    '/projects/:id/import',
    requireAuth,
    validate(ImportApplyBodySchema),
    ctrl.importApply,
  );
  router.get('/projects/:id', requireAuth, ctrl.get);
  router.patch('/projects/:id', requireAuth, validate(UpdateProjectSchema), ctrl.update);
  router.delete('/projects/:id', requireAuth, ctrl.delete);
  router.post('/projects/:id/restore', requireAuth, ctrl.restore);
  router.post('/projects/:id/duplicate', requireAuth, ctrl.duplicate);

  return router;
}
