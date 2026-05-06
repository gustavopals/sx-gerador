import { Component, forwardRef } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { PoCheckboxGroupModule, type PoCheckboxGroupOption } from '@po-ui/ng-components';

export interface TotvModule {
  code: string;
  label: string;
  bit: number;
}

export const TOTVS_MODULES: TotvModule[] = [
  { code: 'SIGAFAT', label: 'Faturamento (SIGAFAT)', bit: 0 },
  { code: 'SIGAEST', label: 'Estoque e Custos (SIGAEST)', bit: 1 },
  { code: 'SIGACOM', label: 'Compras (SIGACOM)', bit: 2 },
  { code: 'SIGAFIN', label: 'Financeiro (SIGAFIN)', bit: 3 },
  { code: 'SIGAGPE', label: 'Gestão de Pessoal (SIGAGPE)', bit: 4 },
  { code: 'SIGAMNT', label: 'Manutenção (SIGAMNT)', bit: 5 },
  { code: 'SIGAATF', label: 'Ativo Fixo (SIGAATF)', bit: 6 },
  { code: 'SIGAOFE', label: 'Manufatura (SIGAOFE)', bit: 7 },
  { code: 'SIGATMS', label: 'Transportes (SIGATMS)', bit: 8 },
  { code: 'SIGACRM', label: 'CRM (SIGACRM)', bit: 9 },
  { code: 'SIGAHOSP', label: 'Hospitalar (SIGAHOSP)', bit: 10 },
  { code: 'SIGAPLS', label: 'Plano de Saúde (SIGAPLS)', bit: 11 },
];

@Component({
  selector: 'sxg-modules-editor',
  imports: [FormsModule, PoCheckboxGroupModule],
  templateUrl: './modules-editor.component.html',
  styleUrl: './modules-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ModulesEditorComponent),
      multi: true,
    },
  ],
})
export class ModulesEditorComponent implements ControlValueAccessor {
  readonly moduleOptions: PoCheckboxGroupOption[] = TOTVS_MODULES.map((m) => ({
    label: m.label,
    value: m.code,
  }));

  selectedCodes: string[] = [];
  isDisabled = false;

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(bitmap: number): void {
    this.selectedCodes = bitmapToCodes(bitmap ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelectionChange(codes: string[]): void {
    this.selectedCodes = codes;
    this.onChange(codesToBitmap(codes));
    this.onTouched();
  }

  get bitmapValue(): number {
    return codesToBitmap(this.selectedCodes);
  }
}

function codesToBitmap(codes: string[]): number {
  return codes.reduce((acc, code) => {
    const mod = TOTVS_MODULES.find((m) => m.code === code);
    return mod ? acc | (1 << mod.bit) : acc;
  }, 0);
}

function bitmapToCodes(bitmap: number): string[] {
  return TOTVS_MODULES.filter((m) => (bitmap & (1 << m.bit)) !== 0).map((m) => m.code);
}
