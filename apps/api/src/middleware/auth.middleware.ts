import type { NextFunction, Request, Response } from 'express';
import { verify as jwtVerify } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthUserPayload } from '../modules/auth/auth.service';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function decodeAccessToken(token: string): AuthUserPayload | null {
  try {
    return jwtVerify(token, env.jwtAccessSecret) as AuthUserPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res
      .status(401)
      .json({ error: { code: 'UNAUTHORIZED', message: 'Token de acesso obrigatório' } });
    return;
  }
  const payload = decodeAccessToken(token);
  if (!payload) {
    res
      .status(401)
      .json({ error: { code: 'UNAUTHORIZED', message: 'Token inválido ou expirado' } });
    return;
  }
  req.user = payload;
  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (token) {
    req.user = decodeAccessToken(token) ?? undefined;
  }
  next();
}
