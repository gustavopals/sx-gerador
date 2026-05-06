import {
  CreateTeamSchema,
  InviteProjectMemberSchema,
  UpdateTeamMemberRoleSchema,
  UpdateTeamSchema,
} from '@sxgerador/shared-types';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { TeamsController } from './teams.controller';
import type { TeamsService } from './teams.service';

export function createTeamsRouter(service: TeamsService): Router {
  const router = Router();
  const ctrl = new TeamsController(service);

  router.get('/teams', requireAuth, ctrl.list);
  router.post('/teams', requireAuth, validate(CreateTeamSchema), ctrl.create);
  router.get('/teams/:id', requireAuth, ctrl.get);
  router.patch('/teams/:id', requireAuth, validate(UpdateTeamSchema), ctrl.update);
  router.delete('/teams/:id', requireAuth, ctrl.delete);
  router.get('/teams/:id/members', requireAuth, ctrl.listMembers);
  router.post('/teams/:id/transfer-ownership', requireAuth, ctrl.transferOwnership);
  router.patch(
    '/teams/:teamId/members/:memberId',
    requireAuth,
    validate(UpdateTeamMemberRoleSchema),
    ctrl.updateMemberRole,
  );
  router.delete('/teams/:teamId/members/:memberId', requireAuth, ctrl.removeMember);

  router.post(
    '/project-invites',
    requireAuth,
    validate(InviteProjectMemberSchema),
    ctrl.inviteProjectMember,
  );
  router.get('/projects/:projectId/invites', requireAuth, ctrl.listProjectInvites);
  router.post('/project-invites/accept', requireAuth, ctrl.acceptInvite);
  router.post('/project-invites/reject', requireAuth, ctrl.rejectInvite);

  return router;
}
