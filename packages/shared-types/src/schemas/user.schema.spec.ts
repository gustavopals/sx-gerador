import { describe, expect, it } from 'vitest';
import { CreateUserSchema, UpdateUserSchema, UserRoleSchema, UserSchema } from './user.schema';

describe('UserRoleSchema', () => {
  it('accepts valid roles', () => {
    expect(UserRoleSchema.parse('OWNER')).toBe('OWNER');
    expect(UserRoleSchema.parse('ADMIN')).toBe('ADMIN');
    expect(UserRoleSchema.parse('MEMBER')).toBe('MEMBER');
    expect(UserRoleSchema.parse('VIEWER')).toBe('VIEWER');
  });

  it('rejects invalid role', () => {
    expect(() => UserRoleSchema.parse('SUPERADMIN')).toThrow();
  });
});

describe('CreateUserSchema', () => {
  const valid = {
    name: 'Gustavo Pals',
    email: 'gustavo@example.com',
    password: 'Senha123',
    acceptedTerms: true as const,
  };

  it('accepts valid input', () => {
    const result = CreateUserSchema.parse(valid);
    expect(result.name).toBe('Gustavo Pals');
    expect(result.locale).toBe('pt-BR');
  });

  it('rejects name shorter than 2 chars', () => {
    expect(() => CreateUserSchema.parse({ ...valid, name: 'A' })).toThrow();
  });

  it('rejects invalid email', () => {
    expect(() => CreateUserSchema.parse({ ...valid, email: 'not-an-email' })).toThrow();
  });

  it('rejects password without uppercase', () => {
    expect(() => CreateUserSchema.parse({ ...valid, password: 'senha123' })).toThrow();
  });

  it('rejects password without number', () => {
    expect(() => CreateUserSchema.parse({ ...valid, password: 'SenhaSemNumero' })).toThrow();
  });

  it('rejects password shorter than 8 chars', () => {
    expect(() => CreateUserSchema.parse({ ...valid, password: 'Ab1' })).toThrow();
  });

  it('rejects when terms not accepted', () => {
    expect(() =>
      CreateUserSchema.parse({ ...valid, acceptedTerms: false as unknown as true }),
    ).toThrow();
  });

  it('accepts custom locale', () => {
    const result = CreateUserSchema.parse({ ...valid, locale: 'en-US' });
    expect(result.locale).toBe('en-US');
  });
});

describe('UpdateUserSchema', () => {
  it('accepts partial updates', () => {
    expect(UpdateUserSchema.parse({ name: 'Novo Nome' })).toEqual({ name: 'Novo Nome' });
    expect(UpdateUserSchema.parse({ locale: 'es-ES' })).toEqual({ locale: 'es-ES' });
    expect(UpdateUserSchema.parse({})).toEqual({});
  });

  it('rejects invalid locale', () => {
    expect(() => UpdateUserSchema.parse({ locale: 'fr-FR' })).toThrow();
  });
});

describe('UserSchema', () => {
  it('coerces date strings', () => {
    const result = UserSchema.parse({
      id: 'clwxyz123',
      name: 'Test',
      email: 'test@example.com',
      role: 'MEMBER',
      locale: 'pt-BR',
      emailVerified: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});
