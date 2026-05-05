import cors from 'cors';
import express, { json, urlencoded } from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { routes } from './routes';

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
    }),
  );
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ extended: true }));

  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
