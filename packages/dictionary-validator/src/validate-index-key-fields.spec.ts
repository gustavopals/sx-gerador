import { describe, expect, it } from 'vitest';
import { validateIndexKeyFields } from './validate-index-key-fields.js';

describe('validateIndexKeyFields', () => {
  const fields = ['ZZZ_FILIAL', 'ZZZ_CODIGO', 'ZZZ_LOJA'];

  it('accepts keys composed only by existing fields', () => {
    const result = validateIndexKeyFields('ZZZ_FILIAL+ZZZ_CODIGO', fields);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.referencedFields).toEqual(['ZZZ_FILIAL', 'ZZZ_CODIGO']);
  });

  it('accepts spaces around plus separator', () => {
    const result = validateIndexKeyFields('ZZZ_FILIAL + ZZZ_LOJA', fields);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.referencedFields).toEqual(['ZZZ_FILIAL', 'ZZZ_LOJA']);
  });

  it('accepts supported special expression tokens', () => {
    const result = validateIndexKeyFields("xFilial('ZZZ')+ZZZ_CODIGO", fields);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects empty key expression', () => {
    const result = validateIndexKeyFields('   ', fields);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/obrigatória/i);
  });

  it('rejects unsupported expression tokens', () => {
    const result = validateIndexKeyFields('Upper(ZZZ_CODIGO)+ZZZ_FILIAL', fields);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/apenas nomes de campos/i);
  });

  it('rejects keys that reference unknown fields', () => {
    const result = validateIndexKeyFields('ZZZ_FILIAL+ZZZ_INEXISTENTE', fields);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/inexistentes/i);
    expect(result.errors[0]).toMatch(/ZZZ_INEXISTENTE/);
  });
});
