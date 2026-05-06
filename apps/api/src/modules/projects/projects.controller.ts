import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { ProjectsService } from './projects.service';

const IdParamSchema = z.object({ id: z.string().cuid() });
const CheckSlugQuerySchema = z.object({
  slug: z.string().trim().min(1),
  excludeId: z.string().cuid().optional(),
});
const BooleanQuerySchema = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .transform((value) => value === true || value === 'true');
const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).optional(),
  includeArchived: BooleanQuerySchema.optional(),
});

export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const result = await this.service.list(query, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  checkSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug, excludeId } = CheckSlugQuerySchema.parse(req.query);
      const available = await this.service.isSlugAvailable(slug, excludeId);
      res.json({ available });
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.service.get(id, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await this.service.create(req.body, req.user?.sub);
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.service.update(id, req.body, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.service.delete(id, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.service.restore(id, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  duplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.service.duplicate(id, req.user?.sub);
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  };
}
