import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { MigrationsService } from './migrations.service';

const ProjectParamSchema = z.object({
  projectId: z.string().cuid(),
});

const MigrationParamSchema = z.object({
  projectId: z.string().cuid(),
  id: z.string().cuid(),
});

const GenerateMigrationBodySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export class MigrationsController {
  constructor(private readonly service: MigrationsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = ProjectParamSchema.parse(req.params);
      const migrations = await this.service.listGenerated(projectId);
      res.json({ migrations });
    } catch (err) {
      next(err);
    }
  };

  draft = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = ProjectParamSchema.parse(req.params);
      const draft = await this.service.getDraftWithItems(projectId);
      res.json(draft);
    } catch (err) {
      next(err);
    }
  };

  generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = ProjectParamSchema.parse(req.params);
      const { name } = GenerateMigrationBodySchema.parse(req.body);
      const migration = await this.service.generateMigration(
        projectId,
        name,
        req.user?.sub ?? 'system',
      );
      res.status(201).json({
        migration: {
          id: migration.id,
          sequence: migration.sequence,
          name: migration.name,
          status: migration.status,
          generatedAt: migration.generatedAt,
          createdAt: migration.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  preview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, id } = MigrationParamSchema.parse(req.params);
      const migration = await this.service.getWithGeneratedCode(projectId, id);
      res.json({
        migration: {
          id: migration.id,
          sequence: migration.sequence,
          name: migration.name,
          status: migration.status,
        },
        code: migration.advplCode,
      });
    } catch (err) {
      next(err);
    }
  };

  download = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, id } = MigrationParamSchema.parse(req.params);
      const migration = await this.service.getWithGeneratedCode(projectId, id);
      const seq = String(migration.sequence).padStart(3, '0');
      const fileName = `${seq}_${slugify(migration.name)}.prw`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(migration.advplCode);
    } catch (err) {
      next(err);
    }
  };
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}
