import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { buildKeyExpression, parseKeyExpression, reorderWithinList } from './key-builder.component';

describe('sxg-key-builder helpers', () => {
  it('builds key expression joining tokens with plus', () => {
    const result = buildKeyExpression(['ZZZ_FILIAL', 'ZZZ_CODIGO']);
    expect(result).toBe('ZZZ_FILIAL+ZZZ_CODIGO');
  });

  it('parses key expression into token list', () => {
    const tokens = parseKeyExpression("ZZZ_FILIAL + ZZZ_CODIGO + xFilial('ZZZ')");
    expect(tokens).toEqual(['ZZZ_FILIAL', 'ZZZ_CODIGO', "xFilial('ZZZ')"]);
  });

  it('ignores blank tokens while parsing', () => {
    const tokens = parseKeyExpression('ZZZ_FILIAL++ZZZ_CODIGO+   ');
    expect(tokens).toEqual(['ZZZ_FILIAL', 'ZZZ_CODIGO']);
  });

  it('reorders tokens within selected list', () => {
    const reordered = reorderWithinList(['A', 'B', 'C'], 2, 0);
    expect(reordered).toEqual(['C', 'A', 'B']);
  });

  it('returns original list for invalid reorder indexes', () => {
    const original = ['A', 'B', 'C'];
    expect(reorderWithinList(original, -1, 1)).toEqual(original);
    expect(reorderWithinList(original, 1, 10)).toEqual(original);
  });
});
