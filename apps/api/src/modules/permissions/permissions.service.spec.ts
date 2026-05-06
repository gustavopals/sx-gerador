import { describe, expect, it } from 'vitest';
import { canUserDo, type ProjectPermissionContext } from './permissions.service';

const USER = { id: 'user-1' };
const PRIVATE_PERSONAL: ProjectPermissionContext = {
  id: 'project-1',
  visibility: 'PRIVATE',
  ownerUserId: 'user-1',
  ownerTeamId: null,
};
const PRIVATE_TEAM_MEMBER: ProjectPermissionContext = {
  id: 'project-1',
  visibility: 'PRIVATE',
  ownerUserId: null,
  ownerTeamId: 'team-1',
  teamRole: 'MEMBER',
};
const PRIVATE_TEAM_VIEWER: ProjectPermissionContext = {
  ...PRIVATE_TEAM_MEMBER,
  teamRole: 'VIEWER',
};
const PRIVATE_TEAM_ADMIN: ProjectPermissionContext = {
  ...PRIVATE_TEAM_MEMBER,
  teamRole: 'ADMIN',
};
const PUBLIC_PROJECT: ProjectPermissionContext = {
  id: 'project-1',
  visibility: 'PUBLIC',
  ownerUserId: null,
  ownerTeamId: null,
};

describe('canUserDo', () => {
  it('allows authenticated users to create projects', () => {
    expect(canUserDo(USER, 'project:create')).toBe(true);
    expect(canUserDo(null, 'project:create')).toBe(false);
  });

  it('allows personal owners to do every project and dictionary action', () => {
    for (const action of [
      'project:read',
      'project:update',
      'project:delete',
      'project:restore',
      'project:duplicate',
      'dictionary:read',
      'dictionary:write',
    ] as const) {
      expect(canUserDo(USER, action, { type: 'project', project: PRIVATE_PERSONAL })).toBe(true);
    }
  });

  it('allows team members to read and write dictionary resources, but not manage the project', () => {
    expect(canUserDo(USER, 'project:read', { type: 'project', project: PRIVATE_TEAM_MEMBER })).toBe(
      true,
    );
    expect(
      canUserDo(USER, 'dictionary:write', { type: 'field', project: PRIVATE_TEAM_MEMBER }),
    ).toBe(true);
    expect(
      canUserDo(USER, 'project:update', { type: 'project', project: PRIVATE_TEAM_MEMBER }),
    ).toBe(false);
  });

  it('keeps team viewers read-only', () => {
    expect(
      canUserDo(USER, 'dictionary:read', { type: 'table', project: PRIVATE_TEAM_VIEWER }),
    ).toBe(true);
    expect(
      canUserDo(USER, 'dictionary:write', { type: 'table', project: PRIVATE_TEAM_VIEWER }),
    ).toBe(false);
  });

  it('allows team admins to manage projects', () => {
    expect(
      canUserDo(USER, 'project:update', { type: 'project', project: PRIVATE_TEAM_ADMIN }),
    ).toBe(true);
    expect(
      canUserDo(USER, 'project:delete', { type: 'project', project: PRIVATE_TEAM_ADMIN }),
    ).toBe(true);
  });

  it('allows authenticated reads on public projects but blocks writes', () => {
    expect(canUserDo(USER, 'project:read', { type: 'project', project: PUBLIC_PROJECT })).toBe(
      true,
    );
    expect(canUserDo(USER, 'dictionary:read', { type: 'index', project: PUBLIC_PROJECT })).toBe(
      true,
    );
    expect(canUserDo(USER, 'dictionary:write', { type: 'index', project: PUBLIC_PROJECT })).toBe(
      false,
    );
  });

  it('blocks unauthenticated access to resources', () => {
    expect(canUserDo(null, 'project:read', { type: 'project', project: PUBLIC_PROJECT })).toBe(
      false,
    );
  });
});
