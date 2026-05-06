import { prisma } from '../../config/db';
import { migrationsService } from '../migrations';
import { createTablesRouter } from './tables.routes';
import { TablesService } from './tables.service';

export const tablesService = new TablesService(prisma, migrationsService);
export const tablesRouter = createTablesRouter(tablesService);
