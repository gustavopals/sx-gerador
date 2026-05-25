import { Component, input, signal } from '@angular/core';
import type { DiffResult, TableDiff } from '../../../core/services/diff.service';

@Component({
  selector: 'sxg-diff-viewer',
  imports: [],
  templateUrl: './diff-viewer.component.html',
  styleUrl: './diff-viewer.component.scss',
})
export class DiffViewerComponent {
  readonly diff = input.required<DiffResult>();
  readonly labelA = input('Estado A');
  readonly labelB = input('Estado B');

  readonly expandedPrefixes = signal<Set<string>>(new Set());

  togglePrefix(prefix: string): void {
    const next = new Set(this.expandedPrefixes());
    if (next.has(prefix)) next.delete(prefix);
    else next.add(prefix);
    this.expandedPrefixes.set(next);
  }

  isExpanded(prefix: string): boolean {
    return this.expandedPrefixes().has(prefix);
  }

  trackTable(_: number, table: TableDiff): string {
    return table.prefix;
  }

  kindLabel(kind: string): string {
    if (kind === 'added') return 'Adicionado';
    if (kind === 'removed') return 'Removido';
    return 'Alterado';
  }

  formatValue(value: unknown): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
