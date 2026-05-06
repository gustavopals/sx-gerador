import { describe, expect, it } from 'vitest';
import { validatePrefix } from './validate-prefix.js';

describe('validatePrefix', () => {
  describe('valid prefixes', () => {
    it('accepts a valid custom prefix starting with Z', () => {
      const result = validatePrefix('ZZZ');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('accepts a valid prefix with letters and digits', () => {
      const result = validatePrefix('ZA1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('accepts an all-digit prefix', () => {
      const result = validatePrefix('Z12');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('warning: prefix not starting with Z', () => {
    it('returns a warning when prefix starts with a letter other than Z', () => {
      const result = validatePrefix('SA1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toMatch(/começa com "Z"/);
    });

    it('returns a warning for all-digit prefix', () => {
      const result = validatePrefix('123');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });

    it('does NOT warn when prefix starts with Z', () => {
      const result = validatePrefix('ZAB');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('invalid prefixes', () => {
    it('rejects empty string', () => {
      const result = validatePrefix('');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/obrigatório/);
    });

    it('rejects prefix shorter than 3 chars', () => {
      const result = validatePrefix('ZZ');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/3 caracteres/);
    });

    it('rejects prefix longer than 3 chars', () => {
      const result = validatePrefix('ZZZZ');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/3 caracteres/);
    });

    it('rejects lowercase letters', () => {
      const result = validatePrefix('zzz');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/maiúsculas/);
    });

    it('rejects special characters', () => {
      const result = validatePrefix('Z!Z');
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/A-Z.*0-9/);
    });

    it('rejects prefix with underscore', () => {
      const result = validatePrefix('Z_Z');
      expect(result.valid).toBe(false);
    });

    it('rejects prefix with space', () => {
      const result = validatePrefix('Z Z');
      expect(result.valid).toBe(false);
    });

    it('rejects accented characters', () => {
      const result = validatePrefix('ZÃO');
      expect(result.valid).toBe(false);
    });
  });

  describe('return shape', () => {
    it('always returns valid, errors, and warnings fields', () => {
      const result = validatePrefix('ZZZ');
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('does not return warnings for invalid prefix', () => {
      const result = validatePrefix('zz');
      expect(result.valid).toBe(false);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
