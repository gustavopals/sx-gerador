import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AuthError } from '../modules/auth/auth.errors';
import { ProjectsError } from '../modules/projects/projects.errors';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  void next;

  if (err instanceof AuthError) {
    res.status(err.statusCode).json({ error: { code: 'AUTH_ERROR', message: err.message } });
    return;
  }

  if (err instanceof ProjectsError) {
    res.status(err.statusCode).json({ error: { code: 'PROJECTS_ERROR', message: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        issues: err.issues,
      },
    });
    return;
  }

  logger.error({ err }, 'Unhandled request error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    },
  });
};
