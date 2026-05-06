import { Router, type Router as ExpressRouter } from 'express';
import { authRouter } from '../modules/auth';
import { fieldsRouter } from '../modules/fields';
import { indexesRouter } from '../modules/indexes';
import { migrationsRouter } from '../modules/migrations';
import { projectsRouter } from '../modules/projects';
import { tablesRouter } from '../modules/tables';
import { teamsRouter } from '../modules/teams';
import { usersRouter } from '../modules/users';
import { healthRouter } from './health.routes';

export const routes: ExpressRouter = Router();

routes.use(healthRouter);
routes.use('/api/v1', authRouter);
routes.use('/api/v1', usersRouter);
routes.use('/api/v1', projectsRouter);
routes.use('/api/v1', tablesRouter);
routes.use('/api/v1', fieldsRouter);
routes.use('/api/v1', indexesRouter);
routes.use('/api/v1', migrationsRouter);
routes.use('/api/v1', teamsRouter);
