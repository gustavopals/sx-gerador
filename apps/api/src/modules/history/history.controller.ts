import { HistoryQuerySchema } from '@sxgerador/shared-types';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { HistoryService } from './history.service';

const ProjectParamSchema = z.object({
  projectId: z.string().cuid(),
});

export class HistoryController {
  constructor(private readonly service: HistoryService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = ProjectParamSchema.parse(req.params);
      const query = HistoryQuerySchema.parse(req.query);
      const result = await this.service.listProjectHistory(projectId, query, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
