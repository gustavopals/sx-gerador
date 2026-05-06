import { describe, expect, it } from 'vitest';
import { validateFieldName } from './validate-field-name.js';

describe('validateFieldName', () => {
  describe('valid field names', () => {
    it('accepts ZZZ_FILIAL for table prefix ZZZ', () => {
      const result = validateFieldName('ZZZ_FILIAL', 'ZZZ');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts field names with numbers and underscore suffix', () => {
      const result = validateFieldName('ZA1_COD1', 'ZA1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('invalid table prefix input', () => {
    it('rejects empty table prefix', () => {
      const result = validateFieldName('ZZZ_CAMPO', '');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Prefixo da tabela é obrigatório/);
    });

    it('rejects table prefix not matching 3 alphanumeric chars', () => {
      const result = validateFieldName('ZZZ_CAMPO', 'ZZ');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/3 caracteres A-Z\/0-9/);
    });
  });

  describe('invalid field names', () => {
    it('rejects empty field name', () => {
      const result = validateFieldName('', 'ZZZ');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Nome do campo é obrigatório/);
    });

    it('rejects lowercase field names', () => {
      const result = validateFieldName('zzz_campo', 'ZZZ');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(expect.arrayContaining([expect.stringMatching(/maiúsculas/)]));
    });

    it('rejects names that do not start with table prefix', () => {
      const result = validateFieldName('AAA_CAMPO', 'ZZZ');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/deve começar com "ZZZ_"/)]),
      );
    });

    it('rejects names longer than 10 chars', () => {
      const result = validateFieldName('ZZZ_NOMETXT', 'ZZZ');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/no máximo 10 caracteres/)]),
      );
    });

    it('rejects names without underscore', () => {
      const result = validateFieldName('ZZZCAMPO', 'ZZZ');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/padrão PREFIXO_NOME/)]),
      );
    });

    it('rejects names with invalid characters', () => {
      const result = validateFieldName('ZZZ_CAM-PO', 'ZZZ');
      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringMatching(/A-Z, 0-9 e underscore/)]),
      );
    });
  });
});
