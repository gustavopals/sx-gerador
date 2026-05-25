import { prisma } from '../../config/db';
import { ProjectCsvService } from './project-csv.service';
import { ProjectImportService } from './project-import.service';
import { createProjectsRouter } from './projects.routes';
import { ProjectsService } from './projects.service';

export const projectsService = new ProjectsService(prisma);
export const projectImportService = new ProjectImportService(prisma);
export const projectCsvService = new ProjectCsvService(
  prisma,
  projectsService,
  projectImportService,
);
export const projectsRouter = createProjectsRouter(
  projectsService,
  projectImportService,
  projectCsvService,
);
