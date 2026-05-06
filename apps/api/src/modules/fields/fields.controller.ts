import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { FieldsService } from './fields.service';

const ParamsSchema = z.object({
  projectId: z.string().cuid(),
  tableId: z.string().cuid(),
});

const IdParamsSchema = ParamsSchema.extend({
  id: z.string().cuid(),
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

export class FieldsController {
  constructor(private readonly service: FieldsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId } = ParamsSchema.parse(req.params);
      const query = ListQuerySchema.parse(req.query);
      const result = await this.service.list(projectId, tableId, query, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId, id } = IdParamsSchema.parse(req.params);
      const field = await this.service.get(projectId, tableId, id, req.user?.sub);
      res.json({ field });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId } = ParamsSchema.parse(req.params);
      const field = await this.service.create(projectId, tableId, req.body, req.user?.sub);
      res.status(201).json({ field });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId, id } = IdParamsSchema.parse(req.params);
      const field = await this.service.update(projectId, tableId, id, req.body, req.user?.sub);
      res.json({ field });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId, id } = IdParamsSchema.parse(req.params);
      const field = await this.service.delete(projectId, tableId, id, req.user?.sub);
      res.json({ field });
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId, id } = IdParamsSchema.parse(req.params);
      const field = await this.service.restore(projectId, tableId, id, req.user?.sub);
      res.json({ field });
    } catch (err) {
      next(err);
    }
  };

  reorder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId } = ParamsSchema.parse(req.params);
      const fields = await this.service.reorder(projectId, tableId, req.body, req.user?.sub);
      res.json({ fields });
    } catch (err) {
      next(err);
    }
  };

  bulkUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, tableId } = ParamsSchema.parse(req.params);
      const result = await this.service.bulkUpdate(projectId, tableId, req.body, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
