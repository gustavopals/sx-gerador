import {
  ExportCsvParamSchema,
  ImportApplyBodySchema,
  ImportCsvPreviewBodySchema,
  ImportPreviewBodySchema,
} from '@sxgerador/shared-types';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { ProjectCsvService } from './project-csv.service';
import type { ProjectImportService } from './project-import.service';
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

function slugifyForFilename(slug: string): string {
  const normalized = slug
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized.length > 0 ? normalized : 'projeto';
}

const CsvParamsSchema = z.object({
  id: z.string().cuid(),
  dictionary: ExportCsvParamSchema,
});

export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly projectImport: ProjectImportService,
    private readonly projectCsv: ProjectCsvService,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = ListQuerySchema.parse(req.query);
      const result = await this.projects.list(query, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  checkSlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug, excludeId } = CheckSlugQuerySchema.parse(req.query);
      const available = await this.projects.isSlugAvailable(slug, excludeId);
      res.json({ available });
    } catch (err) {
      next(err);
    }
  };

  exportJson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const doc = await this.projects.exportJson(id, req.user?.sub);
      const slug = slugifyForFilename(doc.project.slug);
      const day = doc.exportedAt.slice(0, 10).replaceAll('-', '');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="sxgerador-${slug}-${day}.json"`);
      res.status(200).send(`${JSON.stringify(doc, null, 2)}\n`);
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.projects.get(id, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const project = await this.projects.create(req.body, req.user?.sub);
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.projects.update(id, req.body, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.projects.delete(id, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  restore = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.projects.restore(id, req.user?.sub);
      res.json({ project });
    } catch (err) {
      next(err);
    }
  };

  duplicate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const project = await this.projects.duplicate(id, req.user?.sub);
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  };

  importPreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = ImportPreviewBodySchema.parse(req.body);
      const result = await this.projectImport.preview(id, body.document, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  importApply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = ImportApplyBodySchema.parse(req.body);
      const result = await this.projectImport.apply(id, body.document, req.user?.sub, body.options);
      if (!result.success) {
        res.status(422).json({
          error: { code: 'IMPORT_VALIDATION_FAILED', messages: result.errors },
        });
        return;
      }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  exportCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, dictionary } = CsvParamsSchema.parse(req.params);
      const { content, fileName } = await this.projectCsv.exportCsv(id, dictionary, req.user?.sub);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.status(200).send(content);
    } catch (err) {
      next(err);
    }
  };

  importCsvPreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = ImportCsvPreviewBodySchema.parse(req.body);
      const { sx2, sx3, six } = body;
      const result = await this.projectCsv.importPreview(id, { sx2, sx3, six }, req.user?.sub);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  importCsvApply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const body = ImportCsvPreviewBodySchema.parse(req.body);
      const { sx2, sx3, six, options } = body;
      const result = await this.projectCsv.importApply(
        id,
        { sx2, sx3, six },
        req.user?.sub,
        options,
      );
      if (!result.success) {
        res.status(422).json({
          error: { code: 'IMPORT_VALIDATION_FAILED', messages: result.errors },
        });
        return;
      }
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
