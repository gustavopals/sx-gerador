import { prisma } from '../../config/db';
import { migrationsService } from '../migrations';
import { createFieldsRouter } from './fields.routes';
import { FieldsService } from './fields.service';

export const fieldsService = new FieldsService(prisma, migrationsService);
export const fieldsRouter = createFieldsRouter(fieldsService);
