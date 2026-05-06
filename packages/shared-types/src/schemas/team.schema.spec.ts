import { describe, expect, it } from 'vitest';
import {
  CreateTeamSchema,
  InviteProjectMemberSchema,
  TransferTeamOwnershipSchema,
  UpdateTeamMemberRoleSchema,
  UpdateTeamSchema,
} from './team.schema';

describe('CreateTeamSchema', () => {
  it('normalizes a valid team payload', () => {
    expect(CreateTeamSchema.parse({ name: 'Equipe Produto', slug: 'produto' })).toEqual({
      name: 'Equipe Produto',
      slug: 'produto',
    });
  });

  it('rejects invalid slug', () => {
    expect(() =>
      CreateTeamSchema.parse({ name: 'Equipe Produto', slug: 'Equipe Produto' }),
    ).toThrow();
  });
});

describe('UpdateTeamSchema', () => {
  it('accepts partial payloads', () => {
    expect(UpdateTeamSchema.parse({ name: 'Novo nome' })).toEqual({ name: 'Novo nome' });
  });

  it('rejects empty payloads', () => {
    expect(() => UpdateTeamSchema.parse({})).toThrow();
  });
});

describe('InviteProjectMemberSchema', () => {
  it('normalizes email and default role', () => {
    expect(
      InviteProjectMemberSchema.parse({
        projectId: 'clwproject0000000000000001',
        email: 'DEV@SXGERADOR.LOCAL',
      }),
    ).toEqual({
      projectId: 'clwproject0000000000000001',
      email: 'dev@sxgerador.local',
      role: 'MEMBER',
    });
  });
});

describe('UpdateTeamMemberRoleSchema', () => {
  it('accepts valid team roles', () => {
    expect(UpdateTeamMemberRoleSchema.parse({ role: 'ADMIN' })).toEqual({ role: 'ADMIN' });
  });
});

describe('TransferTeamOwnershipSchema', () => {
  it('requires a cuid user id', () => {
    expect(() => TransferTeamOwnershipSchema.parse({ userId: 'user-1' })).toThrow();
  });
});
