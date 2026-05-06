import { describe, expect, it } from 'vitest';
import { CreateFieldSchema, UpdateFieldSchema } from './field.schema';

describe('CreateFieldSchema', () => {
  const baseInput = {
    name: 'ZZZ_CODIGO',
    type: 'C' as const,
    size: 10,
    titlePt: 'Codigo',
    descPt: 'Codigo do item',
  };

  it('accepts minimal valid input and applies defaults', () => {
    const result = CreateFieldSchema.parse(baseInput);
    expect(result.decimals).toBe(0);
    expect(result.visualMode).toBe('A');
    expect(result.contextMode).toBe('R');
    expect(result.owner).toBe('U');
    expect(result.level).toBe(0);
  });

  it('rejects name not following PREFIXO_NOME', () => {
    expect(() => CreateFieldSchema.parse({ ...baseInput, name: 'CODIGO_ZZZ' })).toThrow(
      /PREFIXO_NOME/,
    );
  });

  it('rejects name with more than 10 chars', () => {
    expect(() => CreateFieldSchema.parse({ ...baseInput, name: 'ZZZ_NOMETXT' })).toThrow(
      /10 caracteres/,
    );
  });

  it('allows decimals greater than zero only for numeric fields', () => {
    expect(() => CreateFieldSchema.parse({ ...baseInput, decimals: 2, type: 'C' })).toThrow(
      /tipo é numérico/,
    );
    expect(() =>
      CreateFieldSchema.parse({ ...baseInput, decimals: 2, type: 'N', size: 8 }),
    ).not.toThrow();
  });

  it('requires size > decimals for numeric fields', () => {
    expect(() =>
      CreateFieldSchema.parse({ ...baseInput, type: 'N', size: 2, decimals: 2 }),
    ).toThrow(/tamanho deve ser maior que decimais/);
  });

  it('allows combobox only for C or N types', () => {
    expect(() =>
      CreateFieldSchema.parse({
        ...baseInput,
        type: 'D',
        comboPt: '1=Ativo;2=Inativo',
      }),
    ).toThrow(/Combobox só é permitido/);

    expect(() =>
      CreateFieldSchema.parse({
        ...baseInput,
        type: 'N',
        comboPt: '1=Ativo;2=Inativo',
      }),
    ).not.toThrow();
  });
});

describe('UpdateFieldSchema', () => {
  it('accepts partial updates', () => {
    expect(UpdateFieldSchema.parse({ titlePt: 'Novo Tit.' })).toEqual({ titlePt: 'Novo Tit.' });
    expect(UpdateFieldSchema.parse({ type: 'N', size: 12 })).toEqual({ type: 'N', size: 12 });
  });

  it('rejects empty payload', () => {
    expect(() => UpdateFieldSchema.parse({})).toThrow(/ao menos um campo/);
  });
});
