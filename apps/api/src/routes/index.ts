import { Router, type Router as ExpressRouter } from 'express';
import { authRouter } from '../modules/auth';
import { healthRouter } from './health.routes';

export const routes: ExpressRouter = Router();

routes.use(healthRouter);
routes.use('/api/v1', authRouter);
