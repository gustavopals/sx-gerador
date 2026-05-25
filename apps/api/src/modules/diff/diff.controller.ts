import { CompareMigrationsBodySchema, CompareProjectsBodySchema } from '@sxgerador/shared-types';
import type { NextFunction, Request, Response } from 'express';
import type { DiffService } from './diff.service';

export class DiffController {
  constructor(private readonly service: DiffService) {}

  compareProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = CompareProjectsBodySchema.parse(req.body);
      const result = await this.service.compareProjects(
        body.projectIdA,
        body.projectIdB,
        req.user?.sub,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  compareMigrations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = CompareMigrationsBodySchema.parse(req.body);
      const result = await this.service.compareMigrations(
        body.projectId,
        body.migrationIdA,
        body.migrationIdB,
        req.user?.sub,
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}
