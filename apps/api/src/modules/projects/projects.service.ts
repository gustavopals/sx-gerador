import type { CreateProjectInput, UpdateProjectInput } from '@sxgerador/shared-types';
import type { Prisma, PrismaClient, Project } from '../../generated/prisma';
import { logAudit } from '../audit';
import {
  assertProjectPermission,
  buildProjectAccessWhere,
  canUserDo,
  PermissionErrors,
} from '../permissions';
import { ProjectErrors } from './projects.errors';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface ListProjectsInput {
  page?: number;
  pageSize?: number;
  search?: string;
  includeArchived?: boolean;
}

export interface PaginatedProjects {
  projects: Project[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export class ProjectsService {
  constructor(private readonly db: PrismaClient) {}

  async list(input: ListProjectsInput = {}, actorUserId?: string): Promise<PaginatedProjects> {
    if (!actorUserId) throw PermissionErrors.AUTH_REQUIRED;
    const page = normalizePositiveInt(input.page, DEFAULT_PAGE);
    const pageSize = Math.min(
      normalizePositiveInt(input.pageSize, DEFAULT_PAGE_SIZE),
      MAX_PAGE_SIZE,
    );
    const where = buildListWhere(input, actorUserId);
    const [projects, total] = await this.db.$transaction([
      this.db.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.project.count({ where }),
    ]);

    return {
      projects,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async get(id: string, actorUserId?: string): Promise<Project> {
    const project = await this.db.project.findFirst({ where: { id, deletedAt: null } });
    if (!project) throw ProjectErrors.NOT_FOUND;
    await assertProjectPermission(this.db, actorUserId, 'project:read', id);
    return project;
  }

  async create(input: CreateProjectInput, actorUserId?: string): Promise<Project> {
    if (!actorUserId || !canUserDo({ id: actorUserId }, 'project:create')) {
      throw PermissionErrors.AUTH_REQUIRED;
    }
    await this.ensureSlugAvailable(input.slug);
    if (input.ownerTeamId) await this.ensureUserCanCreateForTeam(input.ownerTeamId, actorUserId);

    const project = await this.db.project.create({
      data: normalizeCreateProjectInput(input, actorUserId),
    });

    await logAudit(this.db, 'projects.create', actorUserId ?? null, { projectId: project.id });
    return project;
  }

  async update(id: string, input: UpdateProjectInput, actorUserId?: string): Promise<Project> {
    await this.get(id, actorUserId);
    await assertProjectPermission(this.db, actorUserId, 'project:update', id);
    if (input.slug) await this.ensureSlugAvailable(input.slug, id);

    const project = await this.db.project.update({
      where: { id },
      data: normalizeUpdateProjectInput(input),
    });

    await logAudit(this.db, 'projects.update', actorUserId ?? null, { projectId: project.id });
    return project;
  }

  async delete(id: string, actorUserId?: string): Promise<Project> {
    const project = await this.db.project.findUnique({ where: { id } });
    if (!project) throw ProjectErrors.NOT_FOUND;
    if (project.deletedAt) throw ProjectErrors.ALREADY_ARCHIVED;
    await assertProjectPermission(this.db, actorUserId, 'project:delete', id);

    const archived = await this.db.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logAudit(this.db, 'projects.delete', actorUserId ?? null, { projectId: id });
    return archived;
  }

  async restore(id: string, actorUserId?: string): Promise<Project> {
    const project = await this.db.project.findUnique({ where: { id } });
    if (!project) throw ProjectErrors.NOT_FOUND;
    if (!project.deletedAt) throw ProjectErrors.NOT_ARCHIVED;
    await assertProjectPermission(this.db, actorUserId, 'project:restore', id, {
      includeArchived: true,
    });

    const restored = await this.db.project.update({
      where: { id },
      data: { deletedAt: null },
    });

    await logAudit(this.db, 'projects.restore', actorUserId ?? null, { projectId: id });
    return restored;
  }

  async duplicate(id: string, actorUserId?: string): Promise<Project> {
    const project = await this.get(id, actorUserId);
    await assertProjectPermission(this.db, actorUserId, 'project:duplicate', id);
    const slug = await this.nextCopySlug(project.slug);

    const duplicate = await this.db.project.create({
      data: {
        name: `${project.name} (cópia)`,
        slug,
        description: project.description,
        visibility: project.visibility,
        ownerUser: actorUserId ? { connect: { id: actorUserId } } : undefined,
        defaultTamFil: project.defaultTamFil,
        defaultLang: project.defaultLang,
      },
    });

    await logAudit(this.db, 'projects.duplicate', actorUserId ?? null, {
      projectId: duplicate.id,
      sourceProjectId: id,
    });
    return duplicate;
  }

  async isSlugAvailable(slug: string, ignoreProjectId?: string): Promise<boolean> {
    const existing = await this.db.project.findUnique({ where: { slug } });
    if (!existing) return true;
    if (ignoreProjectId && existing.id === ignoreProjectId) return true;
    return false;
  }

  private async ensureSlugAvailable(slug: string, ignoreProjectId?: string): Promise<void> {
    const existing = await this.db.project.findUnique({ where: { slug } });
    if (existing && existing.id !== ignoreProjectId) throw ProjectErrors.SLUG_IN_USE;
  }

  private async ensureUserCanCreateForTeam(teamId: string, actorUserId: string): Promise<void> {
    const membership = await this.db.teamMember.findFirst({
      where: {
        teamId,
        userId: actorUserId,
        removedAt: null,
        team: { deletedAt: null },
      },
      select: { id: true },
    });
    if (!membership) throw PermissionErrors.FORBIDDEN;
  }

  private async nextCopySlug(sourceSlug: string): Promise<string> {
    const base = `${sourceSlug}-copy`;
    let candidate = base;
    let suffix = 2;

    while (await this.db.project.findUnique({ where: { slug: candidate } })) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }
}

function buildListWhere(input: ListProjectsInput, actorUserId: string): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = buildProjectAccessWhere(
    actorUserId,
    input.includeArchived,
  );

  const search = input.search?.trim();
  if (search) {
    where.AND = [
      {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      },
    ];
  }

  return where;
}

function normalizePositiveInt(value: number | undefined, fallback: number): number {
  if (!value || !Number.isInteger(value) || value < 1) return fallback;
  return value;
}

function normalizeCreateProjectInput(
  input: CreateProjectInput,
  actorUserId: string,
): Prisma.ProjectCreateInput {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    visibility: input.visibility ?? 'PRIVATE',
    ...(input.ownerTeamId
      ? { ownerTeam: { connect: { id: input.ownerTeamId } } }
      : { ownerUser: { connect: { id: actorUserId } } }),
    defaultTamFil: input.defaultTamFil ?? 2,
    defaultLang: input.defaultLang ?? 'pt-BR',
  };
}

function normalizeUpdateProjectInput(input: UpdateProjectInput): Prisma.ProjectUpdateInput {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description || null } : {}),
    ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
    ...(input.defaultTamFil !== undefined ? { defaultTamFil: input.defaultTamFil } : {}),
    ...(input.defaultLang !== undefined ? { defaultLang: input.defaultLang } : {}),
  };
}
