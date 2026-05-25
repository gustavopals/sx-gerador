import { prisma } from '../../config/db';
import { migrationsService } from '../migrations';
import { createTemplatesRouter } from './templates.routes';
import { TemplatesService } from './templates.service';

export const templatesService = new TemplatesService(prisma, migrationsService);
export const templatesRouter = createTemplatesRouter(templatesService);
