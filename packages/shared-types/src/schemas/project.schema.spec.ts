import { describe, expect, it } from 'vitest';
import { CreateProjectSchema, UpdateProjectSchema } from './project.schema';

describe('CreateProjectSchema', () => {
  const valid = {
    name: 'Financeiro',
    slug: 'financeiro',
  };

  it('accepts valid input with defaults', () => {
    const result = CreateProjectSchema.parse(valid);
    expect(result.visibility).toBe('PRIVATE');
    expect(result.defaultTamFil).toBe(2);
    expect(result.defaultLang).toBe('pt-BR');
  });

  it('rejects invalid slug', () => {
    expect(() => CreateProjectSchema.parse({ ...valid, slug: 'Financeiro DEV' })).toThrow();
  });

  it('rejects invalid filial size', () => {
    expect(() => CreateProjectSchema.parse({ ...valid, defaultTamFil: 0 })).toThrow();
  });
});

describe('UpdateProjectSchema', () => {
  it('accepts partial updates', () => {
    expect(UpdateProjectSchema.parse({ name: 'Novo' })).toEqual({ name: 'Novo' });
    expect(UpdateProjectSchema.parse({ visibility: 'PUBLIC' })).toEqual({ visibility: 'PUBLIC' });
  });

  it('rejects empty update payload', () => {
    expect(() => UpdateProjectSchema.parse({})).toThrow();
  });
});
