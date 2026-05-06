import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { decodeX3Usado, encodeX3Usado, USADO_FLAGS } from './usado-editor.component';

describe('sxg-usado-editor encoders', () => {
  it('encodes and decodes flags symmetrically', () => {
    const input = ['visible', 'browse', 'required', 'virtual'];
    const encoded = encodeX3Usado(input);
    const decoded = decodeX3Usado(encoded);

    expect(encoded).toHaveLength(120);
    expect(decoded.sort()).toEqual(input.sort());
  });

  it('ignores unknown flags on encode', () => {
    const encoded = encodeX3Usado(['visible', 'UNKNOWN_FLAG']);
    const decoded = decodeX3Usado(encoded);

    expect(decoded).toContain('visible');
    expect(decoded).not.toContain('UNKNOWN_FLAG');
  });

  it('returns empty list when value is empty', () => {
    expect(decodeX3Usado('')).toEqual([]);
  });

  it('supports turning every known flag on', () => {
    const all = USADO_FLAGS.map((flag) => flag.code);
    const encoded = encodeX3Usado(all);
    const decoded = decodeX3Usado(encoded);

    expect(decoded.sort()).toEqual(all.sort());
  });
});
