import type { ErrorRequestHandler, RequestHandler } from 'express';
import { logger } from '../config/logger';

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

  logger.error({ err }, 'Unhandled request error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
    },
  });
};
