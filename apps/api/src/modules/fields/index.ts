import { prisma } from '../../config/db';
import { createFieldsRouter } from './fields.routes';
import { FieldsService } from './fields.service';

export const fieldsService = new FieldsService(prisma);
export const fieldsRouter = createFieldsRouter(fieldsService);
