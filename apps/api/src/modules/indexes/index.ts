import { prisma } from '../../config/db';
import { migrationsService } from '../migrations';
import { createIndexesRouter } from './indexes.routes';
import { IndexesService } from './indexes.service';

export const indexesService = new IndexesService(prisma, migrationsService);
export const indexesRouter = createIndexesRouter(indexesService);
