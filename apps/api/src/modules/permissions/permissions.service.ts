import type { Prisma, PrismaClient, ProjectVisibility, TeamRole } from '../../generated/prisma';
import { PermissionErrors } from './permissions.errors';

export type PermissionAction =
  | 'project:read'
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  | 'project:restore'
  | 'project:duplicate'
  | 'dictionary:read'
  | 'dictionary:write';

export interface PermissionUser {
  id: string;
}

export interface PermissionResource {
  type: 'project' | 'table' | 'field' | 'index';
  project: ProjectPermissionContext;
}

export interface ProjectPermissionContext {
  id: string;
  visibility: ProjectVisibility;
  ownerUserId: string | null;
  ownerTeamId: string | null;
  teamRole?: TeamRole | null;
}

export function canUserDo(
  user: PermissionUser | null | undefined,
  action: PermissionAction,
  resource?: PermissionResource,
): boolean {
  if (action === 'project:create') return !!user;
  if (!user || !resource) return false;

  const project = resource.project;
  if (project.ownerUserId === user.id) return true;

  if (isReadAction(action) && project.visibility !== 'PRIVATE') return true;

  if (!project.ownerTeamId || !project.teamRole) return false;
  if (isReadAction(action)) return true;
  if (action === 'dictionary:write') return ['OWNER', 'ADMIN', 'MEMBER'].includes(project.teamRole);

  return ['OWNER', 'ADMIN'].includes(project.teamRole);
}

export async function assertProjectPermission(
  db: PrismaClient,
  actorUserId: string | undefined,
  action: PermissionAction,
  projectId: string,
  options: { includeArchived?: boolean } = {},
): Promise<ProjectPermissionContext> {
  if (!actorUserId) throw PermissionErrors.AUTH_REQUIRED;
  const project = await getProjectPermissionContext(db, actorUserId, projectId, options);
  if (!project) throw PermissionErrors.FORBIDDEN;
  if (!canUserDo({ id: actorUserId }, action, { type: 'project', project })) {
    throw PermissionErrors.FORBIDDEN;
  }
  return project;
}

export async function getProjectPermissionContext(
  db: PrismaClient,
  actorUserId: string,
  projectId: string,
  options: { includeArchived?: boolean } = {},
): Promise<ProjectPermissionContext | null> {
  const project = await db.project.findFirst({
    where: { id: projectId, ...(options.includeArchived ? {} : { deletedAt: null }) },
    select: {
      id: true,
      visibility: true,
      ownerUserId: true,
      ownerTeamId: true,
      ownerTeam: {
        select: {
          members: {
            where: { userId: actorUserId, removedAt: null },
            select: { role: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!project) return null;
  return {
    id: project.id,
    visibility: project.visibility,
    ownerUserId: project.ownerUserId,
    ownerTeamId: project.ownerTeamId,
    teamRole: project.ownerTeam?.members[0]?.role ?? null,
  };
}

export function buildProjectAccessWhere(
  actorUserId: string,
  includeArchived?: boolean,
): Prisma.ProjectWhereInput {
  return {
    ...(includeArchived ? {} : { deletedAt: null }),
    OR: [
      { ownerUserId: actorUserId },
      {
        ownerTeam: {
          members: { some: { userId: actorUserId, removedAt: null } },
        },
      },
      { visibility: { in: ['PUBLIC', 'UNLISTED'] } },
    ],
  };
}

function isReadAction(action: PermissionAction): boolean {
  return (
    action === 'project:read' || action === 'project:duplicate' || action === 'dictionary:read'
  );
}
