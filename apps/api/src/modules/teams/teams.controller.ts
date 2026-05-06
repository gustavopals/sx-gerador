import { InviteTokenSchema, TransferTeamOwnershipSchema } from '@sxgerador/shared-types';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { TeamsService } from './teams.service';

const IdParamSchema = z.object({ id: z.string().cuid() });
const TeamMemberParamSchema = z.object({
  teamId: z.string().cuid(),
  memberId: z.string().cuid(),
});
const ProjectIdParamSchema = z.object({ projectId: z.string().cuid() });

export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const teams = await this.service.list(req.user?.sub);
      res.json({ teams });
    } catch (err) {
      next(err);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const team = await this.service.get(id, req.user?.sub);
      res.json({ team });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const team = await this.service.create(req.body, req.user?.sub);
      res.status(201).json({ team });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const team = await this.service.update(id, req.body, req.user?.sub);
      res.json({ team });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const team = await this.service.delete(id, req.user?.sub);
      res.json({ team });
    } catch (err) {
      next(err);
    }
  };

  listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const members = await this.service.listMembers(id, req.user?.sub);
      res.json({ members });
    } catch (err) {
      next(err);
    }
  };

  inviteProjectMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { invite } = await this.service.inviteProjectMember(req.body, req.user?.sub);
      res.status(201).json({ invite });
    } catch (err) {
      next(err);
    }
  };

  listProjectInvites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = ProjectIdParamSchema.parse(req.params);
      const invites = await this.service.listProjectInvites(projectId, req.user?.sub);
      res.json({ invites });
    } catch (err) {
      next(err);
    }
  };

  acceptInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = InviteTokenSchema.parse(req.body);
      const invite = await this.service.acceptInvite(token, req.user?.sub);
      res.json({ invite });
    } catch (err) {
      next(err);
    }
  };

  rejectInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = InviteTokenSchema.parse(req.body);
      const invite = await this.service.rejectInvite(token, req.user?.sub);
      res.json({ invite });
    } catch (err) {
      next(err);
    }
  };

  updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, memberId } = TeamMemberParamSchema.parse(req.params);
      const member = await this.service.updateMemberRole(teamId, memberId, req.body, req.user?.sub);
      res.json({ member });
    } catch (err) {
      next(err);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { teamId, memberId } = TeamMemberParamSchema.parse(req.params);
      const member = await this.service.removeMember(teamId, memberId, req.user?.sub);
      res.json({ member });
    } catch (err) {
      next(err);
    }
  };

  transferOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = IdParamSchema.parse(req.params);
      const { userId } = TransferTeamOwnershipSchema.parse(req.body);
      const member = await this.service.transferOwnership(id, userId, req.user?.sub);
      res.json({ member });
    } catch (err) {
      next(err);
    }
  };
}
