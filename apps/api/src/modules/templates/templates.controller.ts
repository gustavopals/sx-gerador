import {
  ApplyTemplateBodySchema,
  ApplyTemplatePreviewBodySchema,
  CreateTemplateFromTableSchema,
  ListTemplatesQuerySchema,
} from '@sxgerador/shared-types';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { TemplatesService } from './templates.service';

const IdParamSchema = z.object({ id: z.string().cuid() });

export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = ListTemplatesQuerySchema.parse(req.query);
      const result = await this.templates.list(query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const template = await this.templates.get(id);
      res.json({ template });
    } catch (err) {
      next(err);
    }
  };

  createFromTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = CreateTemplateFromTableSchema.parse(req.body);
      const template = await this.templates.createFromTable(body, req.user!.sub);
      res.status(201).json({ template });
    } catch (err) {
      next(err);
    }
  };

  previewApply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = ApplyTemplatePreviewBodySchema.parse(req.body);
      const result = await this.templates.previewApply(id, body, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  apply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = ApplyTemplateBodySchema.parse(req.body);
      const result = await this.templates.apply(id, body, req.user?.sub);
      if (!result.success) {
        res.status(422).json({
          error: { code: 'TEMPLATE_APPLY_FAILED', messages: result.errors },
        });
        return;
      }
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };
}
