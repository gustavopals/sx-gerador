import '@angular/compiler';
import { describe, expect, it } from 'vitest';
import { parseComboboxStrings, serializeComboboxRows } from './combobox-editor.component';

describe('sxg-combobox-editor helpers', () => {
  it('serializes rows to PT/ES/EN combobox strings', () => {
    const result = serializeComboboxRows([
      { key: '1', pt: 'Sim', es: 'Si', en: 'Yes' },
      { key: '2', pt: 'Nao', es: 'No', en: 'No' },
    ]);

    expect(result.comboPt).toBe('1=Sim;2=Nao');
    expect(result.comboEs).toBe('1=Si;2=No');
    expect(result.comboEn).toBe('1=Yes;2=No');
  });

  it('parses PT/ES/EN combobox strings into unified rows', () => {
    const rows = parseComboboxStrings('1=Sim;2=Nao', '1=Si;2=No', '1=Yes;2=No');

    expect(rows).toEqual([
      { key: '1', pt: 'Sim', es: 'Si', en: 'Yes' },
      { key: '2', pt: 'Nao', es: 'No', en: 'No' },
    ]);
  });

  it('keeps keys present in only one language', () => {
    const rows = parseComboboxStrings('1=Sim', '', '2=No');

    expect(rows).toEqual([
      { key: '1', pt: 'Sim', es: '', en: '' },
      { key: '2', pt: '', es: '', en: 'No' },
    ]);
  });
});
