import { Router, type Router as ExpressRouter } from 'express';
import { healthRouter } from './health.routes';

export const routes: ExpressRouter = Router();

routes.use(healthRouter);
