import { prisma } from '../../config/db';
import { createTeamsRouter } from './teams.routes';
import { TeamsService } from './teams.service';

export const teamsService = new TeamsService(prisma);
export const teamsRouter = createTeamsRouter(teamsService);
