import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { TablesService } from './tables.service';

const IdParamSchema = z.object({
  projectId: z.string().cuid(),
  id: z.string().cuid(),
});
const ProjectIdParamSchema = z.object({ projectId: z.string().cuid() });

const BooleanQuerySchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');
const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
  includeArchived: BooleanQuerySchema.optional(),
});

export class TablesController {
  constructor(private readonly service: TablesService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = ProjectIdParamSchema.parse(req.params);
      const query = ListQuerySchema.parse(req.query);
      const result = await this.service.list(projectId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, id } = IdParamSchema.parse(req.params);
      const table = await this.service.get(projectId, id);
      res.json({ table });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = ProjectIdParamSchema.parse(req.params);
      const table = await this.service.create(projectId, req.body, req.user?.sub);
      res.status(201).json({ table });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, id } = IdParamSchema.parse(req.params);
      const table = await this.service.update(projectId, id, req.body, req.user?.sub);
      res.json({ table });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, id } = IdParamSchema.parse(req.params);
      const table = await this.service.delete(projectId, id, req.user?.sub);
      res.json({ table });
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, id } = IdParamSchema.parse(req.params);
      const table = await this.service.restore(projectId, id, req.user?.sub);
      res.json({ table });
    } catch (err) {
      next(err);
    }
  };
}
