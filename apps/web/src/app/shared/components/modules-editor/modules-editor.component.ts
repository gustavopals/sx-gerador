import { Component, forwardRef, input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { PoCheckboxGroupModule, type PoCheckboxGroupOption } from '@po-ui/ng-components';
import { decodeX2Modulo, encodeX2Modulo, type ProtheusModule } from '@sxgerador/advpl-builder';

export interface TotvModule {
  code: ProtheusModule;
  label: string;
}

export const TOTVS_MODULES: TotvModule[] = [
  { code: 'SIGAFAT', label: 'Faturamento (SIGAFAT)' },
  { code: 'SIGAEST', label: 'Estoque e Custos (SIGAEST)' },
  { code: 'SIGACOM', label: 'Compras (SIGACOM)' },
  { code: 'SIGAFIN', label: 'Financeiro (SIGAFIN)' },
  { code: 'SIGAGPE', label: 'Gestão de Pessoal (SIGAGPE)' },
  { code: 'SIGAMNT', label: 'Manutenção (SIGAMNT)' },
  { code: 'SIGAATF', label: 'Ativo Fixo (SIGAATF)' },
  { code: 'SIGAOFE', label: 'Manufatura (SIGAOFE)' },
  { code: 'SIGATMS', label: 'Transportes (SIGATMS)' },
  { code: 'SIGACRM', label: 'CRM (SIGACRM)' },
  { code: 'SIGAHOSP', label: 'Hospitalar (SIGAHOSP)' },
  { code: 'SIGAPLS', label: 'Plano de Saúde (SIGAPLS)' },
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
  readonly bitmapField = input<'X2_MODULO' | 'X3_MODULO'>('X2_MODULO');

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
  const knownCodes = codes.filter((code): code is ProtheusModule =>
    TOTVS_MODULES.some((module) => module.code === code),
  );
  return encodeX2Modulo(knownCodes);
}

function bitmapToCodes(bitmap: number): string[] {
  return decodeX2Modulo(bitmap);
}

export { bitmapToCodes, codesToBitmap };
