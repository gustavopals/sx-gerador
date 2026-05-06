import { Component, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { PoCheckboxGroupModule, type PoCheckboxGroupOption } from '@po-ui/ng-components';
import {
  decodeX3Usado as decodeProtheusX3Usado,
  encodeX3Usado as encodeProtheusX3Usado,
  type UsadoFlags,
} from '@sxgerador/advpl-builder';

export interface UsadoFlagDefinition {
  code: keyof UsadoFlags;
  label: string;
}

export const USADO_FLAGS: UsadoFlagDefinition[] = [
  { code: 'visible', label: 'Visível' },
  { code: 'browse', label: 'Exibe no browse' },
  { code: 'query', label: 'Pesquisa/F3' },
  { code: 'canChange', label: 'Permite edição' },
  { code: 'required', label: 'Obrigatório' },
  { code: 'virtual', label: 'Campo virtual' },
  { code: 'noPrint', label: 'Não imprime' },
  { code: 'blocked', label: 'Bloqueado' },
  { code: 'noGet', label: 'Sem Get' },
  { code: 'restricted', label: 'Restrito' },
  { code: 'memo', label: 'Memo' },
  { code: 'noTrigger', label: 'Sem gatilho' },
];

@Component({
  selector: 'sxg-usado-editor',
  imports: [FormsModule, PoCheckboxGroupModule],
  templateUrl: './usado-editor.component.html',
  styleUrl: './usado-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UsadoEditorComponent),
      multi: true,
    },
  ],
})
export class UsadoEditorComponent implements ControlValueAccessor {
  readonly flagOptions: PoCheckboxGroupOption[] = USADO_FLAGS.map((flag) => ({
    label: flag.label,
    value: flag.code,
  }));

  selectedFlags: string[] = [];
  encodedValue = '';
  isDisabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(encoded: string | null): void {
    this.encodedValue = encoded ?? '';
    this.selectedFlags = decodeX3Usado(this.encodedValue);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelectionChange(flags: string[]): void {
    this.selectedFlags = flags;
    this.encodedValue = encodeX3Usado(flags);
    this.onChange(this.encodedValue);
    this.onTouched();
  }

  get previewValue(): string {
    if (!this.encodedValue) return '(vazio)';
    return this.encodedValue.replaceAll(' ', '·');
  }
}

export function encodeX3Usado(flags: string[]): string {
  const selected = new Set(flags);
  const usableFlags = createEmptyUsadoFlags();

  for (const definition of USADO_FLAGS) {
    usableFlags[definition.code] = selected.has(definition.code);
  }

  return encodeProtheusX3Usado(usableFlags);
}

export function decodeX3Usado(encoded: string): string[] {
  if (!encoded) return [];

  const flags = decodeProtheusX3Usado(encoded);
  return USADO_FLAGS.filter((flag) => flags[flag.code]).map((flag) => flag.code);
}

function createEmptyUsadoFlags(): UsadoFlags {
  return {
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
}
