import { prisma } from '../../config/db';
import { createProjectsRouter } from './projects.routes';
import { ProjectsService } from './projects.service';

export const projectsService = new ProjectsService(prisma);
export const projectsRouter = createProjectsRouter(projectsService);
