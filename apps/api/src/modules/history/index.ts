import { prisma } from '../../config/db';
import { createHistoryRouter } from './history.routes';
import { HistoryService } from './history.service';

export const historyService = new HistoryService(prisma);
export const historyRouter = createHistoryRouter(historyService);
