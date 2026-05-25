import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { HistoryController } from './history.controller';
import type { HistoryService } from './history.service';

export function createHistoryRouter(service: HistoryService): Router {
  const router = Router();
  const ctrl = new HistoryController(service);

  router.get('/projects/:projectId/history', requireAuth, ctrl.list);

  return router;
}
