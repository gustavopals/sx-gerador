import { Component, forwardRef } from '@angular/core';
import {
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  type AbstractControl,
  type ControlValueAccessor,
  type ValidationErrors,
  type Validator,
} from '@angular/forms';
import { PoButtonModule, PoFieldModule } from '@po-ui/ng-components';

export interface ComboboxEditorValue {
  comboPt: string;
  comboEs: string;
  comboEn: string;
}

export interface ComboboxRow {
  key: string;
  pt: string;
  es: string;
  en: string;
}

@Component({
  selector: 'sxg-combobox-editor',
  imports: [FormsModule, PoButtonModule, PoFieldModule],
  templateUrl: './combobox-editor.component.html',
  styleUrl: './combobox-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboboxEditorComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ComboboxEditorComponent),
      multi: true,
    },
  ],
})
export class ComboboxEditorComponent implements ControlValueAccessor, Validator {
  rows: ComboboxRow[] = [{ key: '', pt: '', es: '', en: '' }];
  isDisabled = false;

  private onChange: (value: ComboboxEditorValue) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: ComboboxEditorValue | null): void {
    const comboPt = value?.comboPt ?? '';
    const comboEs = value?.comboEs ?? '';
    const comboEn = value?.comboEn ?? '';
    this.rows = parseComboboxStrings(comboPt, comboEs, comboEn);
    if (this.rows.length === 0) this.rows = [{ key: '', pt: '', es: '', en: '' }];
  }

  registerOnChange(fn: (value: ComboboxEditorValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.hasDuplicateKeys() ? { duplicateComboboxKeys: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  addRow(): void {
    this.rows = [...this.rows, { key: '', pt: '', es: '', en: '' }];
    this.emitValue();
  }

  removeRow(index: number): void {
    if (this.rows.length === 1) {
      this.rows = [{ key: '', pt: '', es: '', en: '' }];
      this.emitValue();
      return;
    }
    this.rows = this.rows.filter((_, idx) => idx !== index);
    this.emitValue();
  }

  onRowChange(): void {
    this.emitValue();
  }

  isDuplicateKey(index: number): boolean {
    const key = this.rows[index]?.key?.trim();
    if (!key) return false;
    return this.rows.some((row, idx) => idx !== index && row.key.trim() === key);
  }

  hasDuplicateKeys(): boolean {
    return this.rows.some((_, index) => this.isDuplicateKey(index));
  }

  private emitValue(): void {
    const normalized = this.rows
      .map((row) => ({
        key: row.key.trim(),
        pt: row.pt.trim(),
        es: row.es.trim(),
        en: row.en.trim(),
      }))
      .filter((row) => row.key.length > 0);

    const value = serializeComboboxRows(normalized);
    this.onChange(value);
    this.onTouched();
    this.onValidatorChange();
  }
}

export function serializeComboboxRows(rows: ComboboxRow[]): ComboboxEditorValue {
  return {
    comboPt: rows.map((row) => `${row.key}=${row.pt}`).join(';'),
    comboEs: rows.map((row) => `${row.key}=${row.es}`).join(';'),
    comboEn: rows.map((row) => `${row.key}=${row.en}`).join(';'),
  };
}

export function parseComboboxStrings(
  comboPt: string,
  comboEs: string,
  comboEn: string,
): ComboboxRow[] {
  const ptRows = parseLangCombobox(comboPt);
  const esRows = parseLangCombobox(comboEs);
  const enRows = parseLangCombobox(comboEn);

  const allKeys = new Set<string>([
    ...ptRows.map((row) => row.key),
    ...esRows.map((row) => row.key),
    ...enRows.map((row) => row.key),
  ]);

  return Array.from(allKeys).map((key) => ({
    key,
    pt: ptRows.find((row) => row.key === key)?.value ?? '',
    es: esRows.find((row) => row.key === key)?.value ?? '',
    en: enRows.find((row) => row.key === key)?.value ?? '',
  }));
}

function parseLangCombobox(value: string): Array<{ key: string; value: string }> {
  return value
    .split(';')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [key, ...rest] = entry.split('=');
      return { key: key?.trim() ?? '', value: rest.join('=').trim() };
    })
    .filter((entry) => entry.key.length > 0);
}
