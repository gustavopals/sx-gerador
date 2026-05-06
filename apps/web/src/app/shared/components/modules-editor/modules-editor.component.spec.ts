import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { bitmapToCodes, codesToBitmap, TOTVS_MODULES } from './modules-editor.component';

describe('sxg-modules-editor bitmap helpers', () => {
  it('encodes and decodes selected modules symmetrically', () => {
    const selected = ['SIGAFAT', 'SIGAFIN', 'SIGAGPE'];
    const bitmap = codesToBitmap(selected);
    const decoded = bitmapToCodes(bitmap);

    expect(decoded.sort()).toEqual(selected.sort());
  });

  it('ignores unknown module codes on encoding', () => {
    const bitmap = codesToBitmap(['SIGAFAT', 'UNKNOWN']);
    const decoded = bitmapToCodes(bitmap);

    expect(decoded).toContain('SIGAFAT');
    expect(decoded).not.toContain('UNKNOWN');
  });

  it('returns empty list for bitmap zero', () => {
    expect(bitmapToCodes(0)).toEqual([]);
  });

  it('supports bitmap with all mapped modules selected', () => {
    const allCodes = TOTVS_MODULES.map((module) => module.code);
    const bitmap = codesToBitmap(allCodes);
    const decoded = bitmapToCodes(bitmap);

    expect(decoded.sort()).toEqual(allCodes.sort());
  });
});
