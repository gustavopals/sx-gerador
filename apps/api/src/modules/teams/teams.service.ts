import crypto from 'crypto';
import type {
  CreateTeamInput,
  InviteProjectMemberInput,
  TeamRole as SharedTeamRole,
  UpdateTeamInput,
  UpdateTeamMemberRoleInput,
} from '@sxgerador/shared-types';
import type {
  Prisma,
  PrismaClient,
  ProjectInvite,
  Team,
  TeamMember,
  TeamRole,
} from '../../generated/prisma';
import { logAudit } from '../audit';
import { TeamErrors } from './teams.errors';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface TeamsMailer {
  sendProjectInviteEmail(
    to: string,
    token: string,
    context: ProjectInviteEmailContext,
  ): Promise<void>;
}

export interface ProjectInviteEmailContext {
  projectName: string;
  teamName: string;
  invitedById: string;
  role: TeamRole;
  expiresAt: Date;
}

const noopMailer: TeamsMailer = {
  sendProjectInviteEmail: async () => undefined,
};

export interface ProjectInviteResult {
  invite: ProjectInvite;
  token: string;
}

export type TeamMemberWithUser = TeamMember & {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export class TeamsService {
  constructor(
    private readonly db: PrismaClient,
    private readonly mailer: TeamsMailer = noopMailer,
  ) {}

  async list(actorUserId?: string): Promise<Team[]> {
    const userId = requireActor(actorUserId);
    return this.db.team.findMany({
      where: {
        deletedAt: null,
        members: { some: { userId, removedAt: null } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(id: string, actorUserId?: string): Promise<Team> {
    const userId = requireActor(actorUserId);
    await this.ensureActiveMember(id, userId);
    const team = await this.db.team.findFirst({ where: { id, deletedAt: null } });
    if (!team) throw TeamErrors.NOT_FOUND;
    return team;
  }

  async create(input: CreateTeamInput, actorUserId?: string): Promise<Team> {
    const userId = requireActor(actorUserId);
    await this.ensureSlugAvailable(input.slug);

    const team = await this.db.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: normalizeCreateTeamInput(input),
      });
      await tx.teamMember.create({
        data: {
          teamId: created.id,
          userId,
          role: 'OWNER',
        },
      });
      return created;
    });

    await logAudit(this.db, 'teams.create', userId, { teamId: team.id });
    return team;
  }

  async update(id: string, input: UpdateTeamInput, actorUserId?: string): Promise<Team> {
    const userId = requireActor(actorUserId);
    await this.ensureManager(id, userId);
    if (input.slug) await this.ensureSlugAvailable(input.slug, id);

    const team = await this.db.team.update({
      where: { id },
      data: normalizeUpdateTeamInput(input),
    });

    await logAudit(this.db, 'teams.update', userId, { teamId: id });
    return team;
  }

  async delete(id: string, actorUserId?: string): Promise<Team> {
    const userId = requireActor(actorUserId);
    await this.ensureOwner(id, userId);

    const team = await this.db.team.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit(this.db, 'teams.delete', userId, { teamId: id });
    return team;
  }

  async listMembers(teamId: string, actorUserId?: string): Promise<TeamMemberWithUser[]> {
    const userId = requireActor(actorUserId);
    await this.ensureActiveMember(teamId, userId);
    return this.db.teamMember.findMany({
      where: { teamId, removedAt: null },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async inviteProjectMember(
    input: InviteProjectMemberInput,
    actorUserId?: string,
  ): Promise<ProjectInviteResult> {
    const userId = requireActor(actorUserId);
    const role = normalizeInviteRole(input.role);

    const project = await this.db.project.findFirst({
      where: { id: input.projectId, deletedAt: null },
      include: { ownerTeam: true },
    });
    if (!project) throw TeamErrors.PROJECT_NOT_FOUND;
    if (!project.ownerTeamId || !project.ownerTeam) throw TeamErrors.PROJECT_WITHOUT_TEAM;

    await this.ensureManager(project.ownerTeamId, userId);
    await this.ensureEmailIsNotActiveTeamMember(project.ownerTeamId, input.email);

    const existingInvite = await this.db.projectInvite.findFirst({
      where: {
        projectId: project.id,
        email: input.email,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) throw TeamErrors.EMAIL_ALREADY_INVITED;

    const token = generateOpaqueToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    const invite = await this.db.projectInvite.create({
      data: {
        projectId: project.id,
        email: input.email,
        invitedById: userId,
        role,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    await this.mailer.sendProjectInviteEmail(input.email, token, {
      projectName: project.name,
      teamName: project.ownerTeam.name,
      invitedById: userId,
      role,
      expiresAt,
    });
    await logAudit(this.db, 'teams.invite', userId, {
      teamId: project.ownerTeamId,
      projectId: project.id,
      inviteId: invite.id,
      email: input.email,
      role,
    });

    return { invite, token };
  }

  async listProjectInvites(projectId: string, actorUserId?: string): Promise<ProjectInvite[]> {
    const userId = requireActor(actorUserId);
    const project = await this.db.project.findFirst({ where: { id: projectId, deletedAt: null } });
    if (!project) throw TeamErrors.PROJECT_NOT_FOUND;
    if (!project.ownerTeamId) throw TeamErrors.PROJECT_WITHOUT_TEAM;
    await this.ensureManager(project.ownerTeamId, userId);

    return this.db.projectInvite.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvite(rawToken: string, actorUserId?: string): Promise<ProjectInvite> {
    const userId = requireActor(actorUserId);
    const user = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw TeamErrors.AUTH_REQUIRED;

    const invite = await this.getPendingInviteByToken(rawToken);
    if (invite.email !== user.email.toLowerCase()) throw TeamErrors.INVALID_INVITE;

    const project = await this.db.project.findFirst({
      where: { id: invite.projectId, deletedAt: null },
    });
    if (!project) throw TeamErrors.PROJECT_NOT_FOUND;
    if (!project.ownerTeamId) throw TeamErrors.PROJECT_WITHOUT_TEAM;

    const accepted = await this.db.$transaction(async (tx) => {
      await tx.teamMember.upsert({
        where: { teamId_userId: { teamId: project.ownerTeamId!, userId } },
        update: { role: invite.role, removedAt: null },
        create: { teamId: project.ownerTeamId!, userId, role: invite.role },
      });
      return tx.projectInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
    });

    await logAudit(this.db, 'teams.invite.accept', userId, {
      projectId: invite.projectId,
      teamId: project.ownerTeamId,
      inviteId: invite.id,
    });
    return accepted;
  }

  async rejectInvite(rawToken: string, actorUserId?: string): Promise<ProjectInvite> {
    const userId = requireActor(actorUserId);
    const user = await this.db.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) throw TeamErrors.AUTH_REQUIRED;

    const invite = await this.getPendingInviteByToken(rawToken);
    if (invite.email !== user.email.toLowerCase()) throw TeamErrors.INVALID_INVITE;

    const rejected = await this.db.projectInvite.update({
      where: { id: invite.id },
      data: { status: 'REJECTED', rejectedAt: new Date() },
    });

    await logAudit(this.db, 'teams.invite.reject', userId, {
      projectId: invite.projectId,
      inviteId: invite.id,
    });
    return rejected;
  }

  async updateMemberRole(
    teamId: string,
    memberId: string,
    input: UpdateTeamMemberRoleInput,
    actorUserId?: string,
  ): Promise<TeamMember> {
    const userId = requireActor(actorUserId);
    await this.ensureOwner(teamId, userId);
    const role = normalizeMemberRole(input.role);
    const member = await this.getActiveMemberById(teamId, memberId);
    if (member.role === 'OWNER') await this.ensureAnotherOwner(teamId, member.id);

    const updated = await this.db.teamMember.update({
      where: { id: memberId },
      data: { role },
    });

    await logAudit(this.db, 'teams.member.role', userId, { teamId, memberId, role });
    return updated;
  }

  async removeMember(teamId: string, memberId: string, actorUserId?: string): Promise<TeamMember> {
    const userId = requireActor(actorUserId);
    await this.ensureManager(teamId, userId);
    const member = await this.getActiveMemberById(teamId, memberId);
    if (member.role === 'OWNER') await this.ensureAnotherOwner(teamId, member.id);

    const removed = await this.db.teamMember.update({
      where: { id: memberId },
      data: { removedAt: new Date() },
    });

    await logAudit(this.db, 'teams.member.remove', userId, { teamId, memberId });
    return removed;
  }

  async transferOwnership(
    teamId: string,
    targetUserId: string,
    actorUserId?: string,
  ): Promise<TeamMember> {
    const userId = requireActor(actorUserId);
    const currentOwner = await this.ensureOwner(teamId, userId);
    const target = await this.db.teamMember.findFirst({
      where: { teamId, userId: targetUserId, removedAt: null },
    });
    if (!target) throw TeamErrors.MEMBER_NOT_FOUND;

    const newOwner = await this.db.$transaction(async (tx) => {
      await tx.teamMember.update({
        where: { id: currentOwner.id },
        data: { role: 'ADMIN' },
      });
      return tx.teamMember.update({
        where: { id: target.id },
        data: { role: 'OWNER' },
      });
    });

    await logAudit(this.db, 'teams.ownership.transfer', userId, {
      teamId,
      fromUserId: userId,
      toUserId: targetUserId,
    });
    return newOwner;
  }

  private async ensureSlugAvailable(slug: string, ignoreTeamId?: string): Promise<void> {
    const existing = await this.db.team.findUnique({ where: { slug } });
    if (existing && existing.id !== ignoreTeamId) throw TeamErrors.SLUG_IN_USE;
  }

  private async ensureActiveMember(teamId: string, userId: string): Promise<TeamMember> {
    const member = await this.db.teamMember.findFirst({
      where: { teamId, userId, removedAt: null, team: { deletedAt: null } },
    });
    if (!member) throw TeamErrors.FORBIDDEN;
    return member;
  }

  private async ensureManager(teamId: string, userId: string): Promise<TeamMember> {
    const member = await this.ensureActiveMember(teamId, userId);
    if (!['OWNER', 'ADMIN'].includes(member.role)) throw TeamErrors.FORBIDDEN;
    return member;
  }

  private async ensureOwner(teamId: string, userId: string): Promise<TeamMember> {
    const member = await this.ensureActiveMember(teamId, userId);
    if (member.role !== 'OWNER') throw TeamErrors.FORBIDDEN;
    return member;
  }

  private async getActiveMemberById(teamId: string, memberId: string): Promise<TeamMember> {
    const member = await this.db.teamMember.findFirst({
      where: { id: memberId, teamId, removedAt: null },
    });
    if (!member) throw TeamErrors.MEMBER_NOT_FOUND;
    return member;
  }

  private async ensureAnotherOwner(teamId: string, ignoredMemberId: string): Promise<void> {
    const count = await this.db.teamMember.count({
      where: {
        teamId,
        role: 'OWNER',
        removedAt: null,
        id: { not: ignoredMemberId },
      },
    });
    if (count === 0) throw TeamErrors.LAST_OWNER;
  }

  private async ensureEmailIsNotActiveTeamMember(teamId: string, email: string): Promise<void> {
    const member = await this.db.teamMember.findFirst({
      where: {
        teamId,
        removedAt: null,
        user: { email, deletedAt: null },
      },
    });
    if (member) throw TeamErrors.USER_ALREADY_MEMBER;
  }

  private async getPendingInviteByToken(rawToken: string): Promise<ProjectInvite> {
    const invite = await this.db.projectInvite.findFirst({
      where: {
        tokenHash: hashToken(rawToken),
        status: 'PENDING',
      },
    });
    if (!invite || invite.expiresAt < new Date()) throw TeamErrors.INVALID_INVITE;
    return invite;
  }
}

function requireActor(actorUserId: string | undefined): string {
  if (!actorUserId) throw TeamErrors.AUTH_REQUIRED;
  return actorUserId;
}

function normalizeCreateTeamInput(input: CreateTeamInput): Prisma.TeamCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    avatarUrl: input.avatarUrl || null,
  };
}

function normalizeUpdateTeamInput(input: UpdateTeamInput): Prisma.TeamUpdateInput {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl || null } : {}),
  };
}

function normalizeInviteRole(role: SharedTeamRole | undefined): Exclude<TeamRole, 'OWNER'> {
  if (!role || role === 'MEMBER') return 'MEMBER';
  if (role === 'OWNER') throw TeamErrors.OWNER_ROLE_REQUIRES_TRANSFER;
  return role;
}

function normalizeMemberRole(role: SharedTeamRole): Exclude<TeamRole, 'OWNER'> {
  if (role === 'OWNER') throw TeamErrors.OWNER_ROLE_REQUIRES_TRANSFER;
  return role;
}

function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}
