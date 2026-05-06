import { Component, forwardRef, input } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { PoButtonModule, PoFieldModule } from '@po-ui/ng-components';

interface DragPayload {
  source: 'available' | 'selected';
  index: number;
}

interface SpecialKeyToken {
  label: string;
  value: string;
}

const DEFAULT_SPECIAL_TOKEN = '';
const DEFAULT_SPECIAL_TOKENS: SpecialKeyToken[] = [
  { label: "xFilial('<PREFIX>')", value: "xFilial('<PREFIX>')" },
  { label: 'DTOS(Date())', value: 'DTOS(Date())' },
  { label: 'StrZero(0, 6)', value: 'StrZero(0,6)' },
];

@Component({
  selector: 'sxg-key-builder',
  imports: [FormsModule, PoButtonModule, PoFieldModule],
  templateUrl: './key-builder.component.html',
  styleUrl: './key-builder.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KeyBuilderComponent),
      multi: true,
    },
  ],
})
export class KeyBuilderComponent implements ControlValueAccessor {
  readonly availableFields = input<string[]>([]);
  readonly tablePrefix = input<string>('ZZZ');

  keyTokens: string[] = [];
  selectedSpecialToken = DEFAULT_SPECIAL_TOKEN;
  isDisabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.keyTokens = parseKeyExpression(value ?? '');
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

  get normalizedSpecialTokens(): SpecialKeyToken[] {
    return DEFAULT_SPECIAL_TOKENS.map((token) => ({
      label: token.label.replace('<PREFIX>', this.tablePrefix()),
      value: token.value.replace('<PREFIX>', this.tablePrefix()),
    }));
  }

  get keyPreview(): string {
    return buildKeyExpression(this.keyTokens);
  }

  addFieldToken(fieldName: string): void {
    if (this.isDisabled) return;
    this.keyTokens = [...this.keyTokens, fieldName];
    this.emitValue();
  }

  addSpecialToken(): void {
    if (this.isDisabled || !this.selectedSpecialToken) return;
    this.keyTokens = [...this.keyTokens, this.selectedSpecialToken];
    this.selectedSpecialToken = DEFAULT_SPECIAL_TOKEN;
    this.emitValue();
  }

  removeToken(index: number): void {
    if (this.isDisabled) return;
    this.keyTokens = this.keyTokens.filter((_, idx) => idx !== index);
    this.emitValue();
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDragStart(event: DragEvent, source: 'available' | 'selected', index: number): void {
    if (this.isDisabled || !event.dataTransfer) return;
    const payload: DragPayload = { source, index };
    event.dataTransfer.setData('application/json', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'move';
  }

  onDropToSelected(event: DragEvent, targetIndex: number = this.keyTokens.length): void {
    if (this.isDisabled || !event.dataTransfer) return;

    event.preventDefault();
    const payload = parseDragPayload(event.dataTransfer.getData('application/json'));
    if (!payload) return;

    if (payload.source === 'available') {
      const sourceField = this.availableFields()[payload.index];
      if (!sourceField) return;
      this.keyTokens = insertAt(this.keyTokens, sourceField, targetIndex);
      this.emitValue();
      return;
    }

    const sourceToken = this.keyTokens[payload.index];
    if (!sourceToken) return;

    this.keyTokens = reorderWithinList(this.keyTokens, payload.index, targetIndex);
    this.emitValue();
  }

  onDropToAvailable(event: DragEvent): void {
    if (this.isDisabled || !event.dataTransfer) return;

    event.preventDefault();
    const payload = parseDragPayload(event.dataTransfer.getData('application/json'));
    if (!payload || payload.source !== 'selected') return;

    this.keyTokens = this.keyTokens.filter((_, idx) => idx !== payload.index);
    this.emitValue();
  }

  isFieldAlreadyInKey(fieldName: string): boolean {
    return this.keyTokens.includes(fieldName);
  }

  private emitValue(): void {
    this.onChange(this.keyPreview);
    this.onTouched();
  }
}

function parseDragPayload(raw: string): DragPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DragPayload>;
    const { source, index } = parsed;
    if (
      (source === 'available' || source === 'selected') &&
      typeof index === 'number' &&
      Number.isInteger(index) &&
      index >= 0
    ) {
      return { source, index };
    }
    return null;
  } catch {
    return null;
  }
}

function insertAt(items: string[], item: string, rawIndex: number): string[] {
  const index = Math.min(Math.max(rawIndex, 0), items.length);
  return [...items.slice(0, index), item, ...items.slice(index)];
}

export function buildKeyExpression(tokens: string[]): string {
  return tokens
    .map((token) => token.trim())
    .filter((token) => token.length > 0)
    .join('+');
}

export function parseKeyExpression(expression: string): string[] {
  return expression
    .split('+')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

export function reorderWithinList(items: string[], fromIndex: number, toIndex: number): string[] {
  if (
    fromIndex < 0 ||
    fromIndex >= items.length ||
    toIndex < 0 ||
    toIndex > items.length ||
    fromIndex === toIndex
  ) {
    return items;
  }

  const copy = [...items];
  const [item] = copy.splice(fromIndex, 1);
  const normalizedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
  copy.splice(normalizedTo, 0, item);
  return copy;
}
