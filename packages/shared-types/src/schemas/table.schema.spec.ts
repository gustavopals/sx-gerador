import { describe, expect, it } from 'vitest';
import { CreateTableSchema, UpdateTableSchema } from './table.schema';

describe('CreateTableSchema', () => {
  const valid = {
    prefix: 'ZZZ',
    namePt: 'Contratos',
  };

  it('accepts minimal valid input with defaults applied', () => {
    const result = CreateTableSchema.parse(valid);
    expect(result.prefix).toBe('ZZZ');
    expect(result.namePt).toBe('Contratos');
    expect(result.modeCompany).toBe('C');
    expect(result.modeUnit).toBe('C');
    expect(result.modeBranch).toBe('C');
    expect(result.ttsEnabled).toBe('S');
    expect(result.pyme).toBe('N');
    expect(result.modules).toBe(0);
    expect(result.hasClob).toBe('N');
    expect(result.autoIncRec).toBe('N');
    expect(result.tamFil).toBe(2);
    expect(result.tamUn).toBe(2);
    expect(result.tamEmp).toBe(2);
  });

  describe('fileName auto-generation', () => {
    it('auto-generates fileName as <PREFIX>010 when not provided', () => {
      const result = CreateTableSchema.parse(valid);
      expect(result.fileName).toBe('ZZZ010');
    });

    it('uses provided fileName when explicitly given', () => {
      const result = CreateTableSchema.parse({ ...valid, fileName: 'ZZZ010' });
      expect(result.fileName).toBe('ZZZ010');
    });

    it('auto-generates fileName for any valid prefix', () => {
      expect(CreateTableSchema.parse({ ...valid, prefix: 'ZA1' }).fileName).toBe('ZA1010');
      expect(CreateTableSchema.parse({ ...valid, prefix: 'Z12' }).fileName).toBe('Z12010');
    });
  });

  describe('prefix validation', () => {
    it('accepts valid 3-char uppercase alphanumeric prefix', () => {
      expect(() => CreateTableSchema.parse({ ...valid, prefix: 'ZA1' })).not.toThrow();
      expect(() => CreateTableSchema.parse({ ...valid, prefix: 'SA1' })).not.toThrow();
    });

    it('rejects prefix shorter than 3 chars', () => {
      expect(() => CreateTableSchema.parse({ ...valid, prefix: 'ZZ' })).toThrow();
    });

    it('rejects prefix longer than 3 chars', () => {
      expect(() => CreateTableSchema.parse({ ...valid, prefix: 'ZZZZ' })).toThrow();
    });

    it('rejects lowercase prefix', () => {
      expect(() => CreateTableSchema.parse({ ...valid, prefix: 'zzz' })).toThrow();
    });

    it('rejects prefix with special characters', () => {
      expect(() => CreateTableSchema.parse({ ...valid, prefix: 'Z!Z' })).toThrow();
    });
  });

  describe('fileName validation when provided', () => {
    it('rejects fileName not matching <PREFIX>010 format', () => {
      expect(() => CreateTableSchema.parse({ ...valid, fileName: 'ZZZ001' })).toThrow();
      expect(() => CreateTableSchema.parse({ ...valid, fileName: 'ZZZZ010' })).toThrow();
      expect(() => CreateTableSchema.parse({ ...valid, fileName: 'zzz010' })).toThrow();
    });

    it('rejects fileName from a different prefix', () => {
      expect(() =>
        CreateTableSchema.parse({ ...valid, prefix: 'ZZZ', fileName: 'ZA1010' }),
      ).toThrow('Nome do arquivo deve corresponder ao prefixo informado');
    });
  });

  describe('name fields', () => {
    it('accepts optional nameEs and nameEn', () => {
      const result = CreateTableSchema.parse({
        ...valid,
        nameEs: 'Contratos',
        nameEn: 'Contracts',
      });
      expect(result.nameEs).toBe('Contratos');
      expect(result.nameEn).toBe('Contracts');
    });

    it('rejects empty namePt', () => {
      expect(() => CreateTableSchema.parse({ ...valid, namePt: '' })).toThrow();
    });

    it('rejects namePt longer than 30 chars', () => {
      expect(() => CreateTableSchema.parse({ ...valid, namePt: 'A'.repeat(31) })).toThrow();
    });
  });

  describe('sharing modes', () => {
    it('accepts C and E as sharing mode values', () => {
      const result = CreateTableSchema.parse({
        ...valid,
        modeCompany: 'E',
        modeUnit: 'E',
        modeBranch: 'E',
      });
      expect(result.modeCompany).toBe('E');
      expect(result.modeUnit).toBe('E');
      expect(result.modeBranch).toBe('E');
    });

    it('rejects invalid sharing mode', () => {
      expect(() => CreateTableSchema.parse({ ...valid, modeCompany: 'X' })).toThrow();
    });
  });

  describe('YesNo fields', () => {
    it('accepts S and N', () => {
      const result = CreateTableSchema.parse({
        ...valid,
        ttsEnabled: 'N',
        pyme: 'S',
        hasClob: 'S',
        autoIncRec: 'S',
      });
      expect(result.ttsEnabled).toBe('N');
      expect(result.pyme).toBe('S');
    });

    it('rejects invalid YesNo value', () => {
      expect(() => CreateTableSchema.parse({ ...valid, ttsEnabled: 'Y' })).toThrow();
    });
  });

  describe('numeric fields', () => {
    it('accepts valid tamFil values', () => {
      const result = CreateTableSchema.parse({ ...valid, tamFil: 4, tamUn: 3, tamEmp: 1 });
      expect(result.tamFil).toBe(4);
    });

    it('rejects tamFil of 0', () => {
      expect(() => CreateTableSchema.parse({ ...valid, tamFil: 0 })).toThrow();
    });

    it('rejects tamFil above 10', () => {
      expect(() => CreateTableSchema.parse({ ...valid, tamFil: 11 })).toThrow();
    });

    it('rejects negative modules value', () => {
      expect(() => CreateTableSchema.parse({ ...valid, modules: -1 })).toThrow();
    });
  });
});

describe('UpdateTableSchema', () => {
  it('accepts partial updates', () => {
    expect(UpdateTableSchema.parse({ namePt: 'Novo Nome' })).toEqual({ namePt: 'Novo Nome' });
    expect(UpdateTableSchema.parse({ modeCompany: 'E' })).toEqual({ modeCompany: 'E' });
    expect(UpdateTableSchema.parse({ modules: 15 })).toEqual({ modules: 15 });
  });

  it('rejects empty update payload', () => {
    expect(() => UpdateTableSchema.parse({})).toThrow();
  });

  it('does not include prefix (immutable — stripped from output)', () => {
    const result = UpdateTableSchema.parse({ namePt: 'Teste', prefix: 'ZZZ' } as object);
    expect(result).not.toHaveProperty('prefix');
  });

  it('rejects invalid modeCompany in update', () => {
    expect(() => UpdateTableSchema.parse({ modeCompany: 'X' })).toThrow();
  });

  it('accepts null for optional text fields', () => {
    const result = UpdateTableSchema.parse({ nameEs: null, notes: null });
    expect(result.nameEs).toBeNull();
    expect(result.notes).toBeNull();
  });
});
