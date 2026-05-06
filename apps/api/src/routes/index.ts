import { Router, type Router as ExpressRouter } from 'express';
import { authRouter } from '../modules/auth';
import { projectsRouter } from '../modules/projects';
import { tablesRouter } from '../modules/tables';
import { usersRouter } from '../modules/users';
import { healthRouter } from './health.routes';

export const routes: ExpressRouter = Router();

routes.use(healthRouter);
routes.use('/api/v1', authRouter);
routes.use('/api/v1', usersRouter);
routes.use('/api/v1', projectsRouter);
routes.use('/api/v1', tablesRouter);
