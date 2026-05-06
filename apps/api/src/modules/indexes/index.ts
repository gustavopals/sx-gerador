import { prisma } from '../../config/db';
import { createIndexesRouter } from './indexes.routes';
import { IndexesService } from './indexes.service';

export const indexesService = new IndexesService(prisma);
export const indexesRouter = createIndexesRouter(indexesService);
