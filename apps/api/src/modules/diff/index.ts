import { prisma } from '../../config/db';
import { createDiffRouter } from './diff.routes';
import { DiffService } from './diff.service';

export const diffService = new DiffService(prisma);
export const diffRouter = createDiffRouter(diffService);
