import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { FormsModule, NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

export type SxgCodeLanguage = 'advpl' | 'sql' | 'text';
export type SxgCodeEditorMode = 'edit' | 'read-only';

@Component({
  selector: 'sxg-code-editor',
  imports: [FormsModule],
  templateUrl: './code-editor.component.html',
  styleUrl: './code-editor.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CodeEditorComponent),
      multi: true,
    },
  ],
})
export class CodeEditorComponent implements ControlValueAccessor {
  readonly language = input<SxgCodeLanguage>('text');
  readonly mode = input<SxgCodeEditorMode>('edit');
  readonly label = input<string>('Editor de código');
  readonly placeholder = input<string>('Digite o código...');
  readonly rows = input<number>(8);

  readonly value = signal<string>('');
  readonly syntaxError = signal<string | null>(null);
  readonly isDisabled = signal(false);
  readonly isReadOnly = computed(() => this.mode() === 'read-only' || this.isDisabled());
  readonly highlightedCode = computed(() => highlightCode(this.value(), this.language()));

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    this.syntaxError.set(validateCodeSyntax(value ?? '', this.language()));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onValueChange(nextValue: string): void {
    this.value.set(nextValue);
    this.syntaxError.set(validateCodeSyntax(nextValue, this.language()));
    this.onChange(nextValue);
    this.onTouched();
  }
}

const ADVPL_KEYWORDS = [
  'USER',
  'FUNCTION',
  'LOCAL',
  'IF',
  'ELSE',
  'ENDIF',
  'FOR',
  'NEXT',
  'RETURN',
  'DO',
  'CASE',
  'ENDCASE',
  'WHILE',
  'ENDDO',
];

const SQL_KEYWORDS = [
  'SELECT',
  'FROM',
  'WHERE',
  'JOIN',
  'INNER',
  'LEFT',
  'RIGHT',
  'ON',
  'ORDER',
  'BY',
  'GROUP',
  'HAVING',
  'INSERT',
  'INTO',
  'UPDATE',
  'DELETE',
  'CREATE',
  'TABLE',
  'ALTER',
];

export function highlightCode(value: string, language: SxgCodeLanguage): string {
  const safe = escapeHtml(value);
  const keywords = language === 'advpl' ? ADVPL_KEYWORDS : language === 'sql' ? SQL_KEYWORDS : [];
  if (keywords.length === 0) return safe;

  const pattern = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
  return safe.replace(pattern, '<span class="sxg-code-editor__kw">$1</span>');
}

export function validateCodeSyntax(value: string, language: SxgCodeLanguage): string | null {
  if (!value.trim()) return null;
  if (!hasBalancedChars(value, '(', ')')) return 'Parênteses desbalanceados.';
  if (!hasBalancedQuotes(value)) return 'Aspas desbalanceadas.';

  if (language === 'sql') {
    const trimmed = value.trim().toUpperCase();
    const startsWithValidVerb =
      trimmed.startsWith('SELECT') ||
      trimmed.startsWith('INSERT') ||
      trimmed.startsWith('UPDATE') ||
      trimmed.startsWith('DELETE') ||
      trimmed.startsWith('CREATE') ||
      trimmed.startsWith('ALTER');
    if (!startsWithValidVerb)
      return 'SQL deve iniciar com um comando válido (SELECT/INSERT/UPDATE...).';
  }

  return null;
}

function hasBalancedChars(value: string, open: string, close: string): boolean {
  let depth = 0;
  for (const char of value) {
    if (char === open) depth += 1;
    if (char === close) depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function hasBalancedQuotes(value: string): boolean {
  let single = 0;
  let double = 0;
  for (const char of value) {
    if (char === "'") single += 1;
    if (char === '"') double += 1;
  }
  return single % 2 === 0 && double % 2 === 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
