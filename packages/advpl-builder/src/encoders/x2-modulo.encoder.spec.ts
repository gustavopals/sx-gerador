import { describe, expect, it } from 'vitest';
import {
  decodeX2Modulo,
  decodeX3Modulo,
  encodeX2Modulo,
  encodeX3Modulo,
  PROTHEUS_MODULES,
  type ProtheusModule,
} from './x2-modulo.encoder';

describe('X2_MODULO encoder', () => {
  it('codifica array vazio como bitmap zero', () => {
    expect(encodeX2Modulo([])).toBe(0);
  });

  it('codifica módulos reais nas posições de bit esperadas', () => {
    expect(encodeX2Modulo(['SIGAFAT', 'SIGAEST', 'SIGAFIN', 'SIGAGPE'])).toBe(27);
  });

  it('ignora duplicidades sem alterar o bitmap', () => {
    expect(encodeX2Modulo(['SIGAFAT', 'SIGAFAT', 'SIGACOM'])).toBe(5);
  });

  it('decodifica bitmap numérico preservando a ordem canônica', () => {
    expect(decodeX2Modulo(0b10101)).toEqual(['SIGAFAT', 'SIGACOM', 'SIGAGPE']);
  });

  it('decodifica bitmap vindo como string numérica', () => {
    expect(decodeX2Modulo(' 515 ')).toEqual(['SIGAFAT', 'SIGAEST', 'SIGACRM']);
  });

  it('faz round-trip com todos os módulos conhecidos', () => {
    expect(decodeX2Modulo(encodeX2Modulo(PROTHEUS_MODULES))).toEqual([...PROTHEUS_MODULES]);
  });

  it('rejeita módulo desconhecido', () => {
    expect(() => encodeX2Modulo(['SIGAFAKE' as ProtheusModule])).toThrow(
      'Módulo Protheus desconhecido: SIGAFAKE.',
    );
  });

  it('rejeita entradas que não são array no encoder', () => {
    expect(() => encodeX2Modulo(15 as unknown as ProtheusModule[])).toThrow(
      'Módulos de X2_MODULO devem ser um array.',
    );
  });

  it('rejeita bitmap negativo ou decimal', () => {
    expect(() => decodeX2Modulo(-1)).toThrow('Bitmap X2_MODULO deve ser um inteiro não negativo.');
    expect(() => decodeX2Modulo(1.5)).toThrow('Bitmap X2_MODULO deve ser um inteiro não negativo.');
  });

  it('rejeita bitmap textual inválido', () => {
    expect(() => decodeX2Modulo('SIGAFAT')).toThrow(
      'Bitmap X2_MODULO deve ser um inteiro não negativo.',
    );
  });

  it('expõe aliases para X3_MODULO com a mesma semântica', () => {
    const modules: ProtheusModule[] = ['SIGATMS', 'SIGACRM', 'SIGAPLS'];

    expect(encodeX3Modulo(modules)).toBe(2816);
    expect(decodeX3Modulo(2816)).toEqual(modules);
  });
});
