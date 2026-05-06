import { prisma } from '../../config/db';
import { createMigrationsRouter } from './migrations.routes';
import { MigrationsService } from './migrations.service';

export const migrationsService = new MigrationsService(prisma);
export const migrationsRouter = createMigrationsRouter(migrationsService);
