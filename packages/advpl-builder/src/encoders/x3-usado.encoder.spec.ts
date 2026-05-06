import { describe, expect, it } from 'vitest';
import { decodeX3Usado, encodeX3Usado, X3_USADO_LENGTH, type UsadoFlags } from './x3-usado.encoder';

const EMPTY_FLAGS: UsadoFlags = {
  visible: false,
  browse: false,
  query: false,
  canChange: false,
  required: false,
  virtual: false,
  noPrint: false,
  blocked: false,
  noGet: false,
  restricted: false,
  memo: false,
  noTrigger: false,
};

describe('X3_USADO encoder', () => {
  it('codifica flags desligadas como bitmap textual de 120 caracteres', () => {
    const encoded = encodeX3Usado(EMPTY_FLAGS);

    expect(encoded).toHaveLength(X3_USADO_LENGTH);
    expect(encoded).toBe('0'.repeat(X3_USADO_LENGTH));
  });

  it('codifica bits na ordem estável esperada para campos reais de SX3', () => {
    const encoded = encodeX3Usado({
      ...EMPTY_FLAGS,
      visible: true,
      browse: true,
      canChange: true,
      required: true,
      noTrigger: true,
    });

    expect(encoded.slice(0, 12)).toBe('110110000001');
    expect(encoded.slice(12)).toBe('0'.repeat(108));
  });

  it('faz round-trip de todas as flags suportadas', () => {
    const flags: UsadoFlags = {
      visible: true,
      browse: false,
      query: true,
      canChange: false,
      required: true,
      virtual: false,
      noPrint: true,
      blocked: false,
      noGet: true,
      restricted: false,
      memo: true,
      noTrigger: false,
    };

    expect(decodeX3Usado(encodeX3Usado(flags))).toEqual(flags);
  });

  it('decodifica amostra textual de produção com bits de módulo mistos', () => {
    const productionLike = '101100001111'.padEnd(X3_USADO_LENGTH, '0');

    expect(decodeX3Usado(productionLike)).toEqual({
      visible: true,
      browse: false,
      query: true,
      canChange: true,
      required: false,
      virtual: false,
      noPrint: false,
      blocked: false,
      noGet: true,
      restricted: true,
      memo: true,
      noTrigger: true,
    });
  });

  it('decodifica bitmap legado de 15 bytes com caracteres estendidos', () => {
    const legacy = 'þ€²°'.padEnd(15, String.fromCharCode(0));

    expect(decodeX3Usado(legacy)).toEqual({
      visible: true,
      browse: true,
      query: true,
      canChange: true,
      required: true,
      virtual: true,
      noPrint: true,
      blocked: false,
      noGet: true,
      restricted: false,
      memo: false,
      noTrigger: false,
    });
  });

  it('rejeita X3_USADO textual com caracteres fora do alfabeto seguro', () => {
    expect(() => decodeX3Usado('1'.repeat(119) + 'x')).toThrow(
      'X3_USADO textual deve conter apenas caracteres 0 ou 1.',
    );
  });

  it('rejeita tamanho inválido', () => {
    expect(() => decodeX3Usado('1010')).toThrow(
      'X3_USADO deve ter 120 caracteres ou 15 bytes legados.',
    );
  });

  it('rejeita valores legados fora de byte', () => {
    expect(() => decodeX3Usado('😀'.padEnd(15, String.fromCharCode(0)))).toThrow(
      'X3_USADO legado deve conter apenas bytes de 0 a 255.',
    );
  });

  it('valida o shape das flags no runtime', () => {
    expect(() => encodeX3Usado({ ...EMPTY_FLAGS, visible: 'S' } as unknown as UsadoFlags)).toThrow(
      'Flag X3_USADO "visible" deve ser booleana.',
    );
  });

  it('rejeita flags nulas', () => {
    expect(() => encodeX3Usado(null as unknown as UsadoFlags)).toThrow(
      'Flags de X3_USADO devem ser um objeto.',
    );
  });
});
