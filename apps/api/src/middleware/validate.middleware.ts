import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({
        error: {
          code: 'VALIDATION_ERROR',
          issues: result.error.issues,
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
