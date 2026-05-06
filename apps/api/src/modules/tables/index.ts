import { prisma } from '../../config/db';
import { createTablesRouter } from './tables.routes';
import { TablesService } from './tables.service';

export const tablesService = new TablesService(prisma);
export const tablesRouter = createTablesRouter(tablesService);
