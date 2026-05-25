import { Component, effect, HostListener, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoButtonModule,
  PoFieldModule,
  PoNotificationService,
  PoTableModule,
  type PoSelectOption,
  type PoTableAction,
  type PoTableColumn,
} from '@po-ui/ng-components';
import { mapFieldsError, type FieldSummary } from '../../../../core/services/fields.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';
import { FieldsStore } from '../../../../stores/fields.store';

interface FieldRow extends FieldSummary {
  $selected?: boolean;
  _editing?: boolean;
  _editTitlePt?: string;
  _editDescPt?: string;
}

@Component({
  selector: 'sxg-fields-list',
  imports: [
    FormsModule,
    PoButtonModule,
    PoFieldModule,
    PoTableModule,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './fields-list.component.html',
  styleUrl: './fields-list.component.scss',
})
export class FieldsListComponent {
  private readonly fieldsStore = inject(FieldsStore);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);

  readonly projectId = input.required<string>();
  readonly tableId = input.required<string>();
  readonly isDisabled = input(false);

  readonly isLoading = this.fieldsStore.isLoading;
  readonly showShortcuts = signal(false);
  readonly rows = signal<FieldRow[]>([]);
  readonly selectedRows = signal<FieldRow[]>([]);
  readonly search = signal('');
  readonly typeFilter = signal<string>('');
  readonly browseFilter = signal<string>('');
  readonly requiredFilter = signal<string>('');
  readonly virtualFilter = signal<string>('');

  readonly visibleColumnKeys = signal<string[]>(['name', 'type', 'size', 'titlePt', 'descPt']);

  readonly typeOptions: PoSelectOption[] = [
    { label: 'Todos', value: '' },
    { label: 'C', value: 'C' },
    { label: 'N', value: 'N' },
    { label: 'D', value: 'D' },
    { label: 'M', value: 'M' },
    { label: 'L', value: 'L' },
  ];
  readonly yesNoFilterOptions: PoSelectOption[] = [
    { label: 'Todos', value: '' },
    { label: 'Sim', value: 'S' },
    { label: 'Não', value: 'N' },
  ];
  readonly columnOptions = [
    { label: 'Nome', value: 'name' },
    { label: 'Tipo', value: 'type' },
    { label: 'Tamanho', value: 'size' },
    { label: 'Decimais', value: 'decimals' },
    { label: 'Título PT', value: 'titlePt' },
    { label: 'Descrição PT', value: 'descPt' },
    { label: 'Browse', value: 'showBrowse' },
  ];

  readonly allColumns: PoTableColumn[] = [
    { property: 'name', label: 'Campo' },
    { property: 'type', label: 'Tipo', width: '70px' },
    { property: 'size', label: 'Tam.', width: '80px' },
    { property: 'decimals', label: 'Dec.', width: '80px' },
    { property: 'titlePt', label: 'Título PT' },
    { property: 'descPt', label: 'Descrição PT' },
    { property: 'showBrowse', label: 'Browse', width: '90px' },
  ];

  readonly actions: PoTableAction[] = [
    {
      label: 'Mover para cima',
      icon: 'an an-arrow-up',
      action: (row: FieldRow) => void this.moveUp(row),
    },
    {
      label: 'Mover para baixo',
      icon: 'an an-arrow-down',
      action: (row: FieldRow) => void this.moveDown(row),
    },
    {
      label: 'Editar inline',
      icon: 'an an-pencil',
      visible: (row: FieldRow) => !row._editing,
      action: (row: FieldRow) => this.startInlineEdit(row),
    },
    {
      label: 'Salvar inline',
      icon: 'an an-check',
      visible: (row: FieldRow) => !!row._editing,
      action: (row: FieldRow) => void this.saveInlineEdit(row),
    },
    {
      label: 'Cancelar inline',
      icon: 'an an-x',
      visible: (row: FieldRow) => !!row._editing,
      action: (row: FieldRow) => this.cancelInlineEdit(row),
    },
  ];

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      const tableId = this.tableId();
      if (projectId && tableId) void this.load();
    });
    effect(() => {
      const loaded = this.fieldsStore.fields();
      if (loaded.length >= 0) this.rows.set(loaded as FieldRow[]);
    });
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (isTypingTarget(event.target)) return;

    const key = event.key.toLowerCase();
    if (key === 'n') {
      event.preventDefault();
      this.goToNewField();
      return;
    }

    if (key === 'e') {
      event.preventDefault();
      void this.editSelectedField();
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      void this.bulkDeleteWithConfirm();
      return;
    }

    if (key === '?') {
      event.preventDefault();
      this.showShortcuts.set(true);
    }

    if (key === 'escape' && this.showShortcuts()) {
      event.preventDefault();
      this.showShortcuts.set(false);
    }
  }

  get columns(): PoTableColumn[] {
    const visible = new Set(this.visibleColumnKeys());
    return this.allColumns.filter((column) => visible.has(String(column.property)));
  }

  get filteredRows(): FieldRow[] {
    const query = this.search().trim().toLowerCase();
    return this.rows().filter((row) => {
      if (query) {
        const haystack = `${row.name} ${row.titlePt} ${row.descPt}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (this.typeFilter() && row.type !== this.typeFilter()) return false;
      if (this.browseFilter() && row.showBrowse !== this.browseFilter()) return false;
      if (this.requiredFilter()) {
        const isRequired = row.required && row.required.trim().length > 0 ? 'S' : 'N';
        if (isRequired !== this.requiredFilter()) return false;
      }
      if (this.virtualFilter()) {
        const isVirtual = row.contextMode === 'V' ? 'S' : 'N';
        if (isVirtual !== this.virtualFilter()) return false;
      }
      return true;
    });
  }

  onVisibleColumnsChange(values: string[]): void {
    if (values.length === 0) return;
    this.visibleColumnKeys.set(values);
  }

  onRowSelected(row: FieldRow): void {
    this.selectedRows.update((selected) =>
      selected.some((item) => item.id === row.id) ? selected : [...selected, row],
    );
  }

  onRowUnselected(row: FieldRow): void {
    this.selectedRows.update((selected) => selected.filter((item) => item.id !== row.id));
  }

  onAllSelected(rows: FieldRow[]): void {
    this.selectedRows.set(rows);
  }

  onAllUnselected(): void {
    this.selectedRows.set([]);
  }

  async load(): Promise<void> {
    try {
      await this.fieldsStore.loadFields(this.projectId(), this.tableId());
      this.selectedRows.set([]);
    } catch (err) {
      this.notification.error(mapFieldsError(err));
    }
  }

  async moveUp(row: FieldRow): Promise<void> {
    const ordered = [...this.rows()].sort((a, b) => a.order.localeCompare(b.order));
    const index = ordered.findIndex((item) => item.id === row.id);
    if (index <= 0) return;
    [ordered[index - 1], ordered[index]] = [ordered[index], ordered[index - 1]];
    await this.persistReorder(ordered.map((item) => item.id));
  }

  async moveDown(row: FieldRow): Promise<void> {
    const ordered = [...this.rows()].sort((a, b) => a.order.localeCompare(b.order));
    const index = ordered.findIndex((item) => item.id === row.id);
    if (index < 0 || index >= ordered.length - 1) return;
    [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
    await this.persistReorder(ordered.map((item) => item.id));
  }

  startInlineEdit(row: FieldRow): void {
    this.rows.update((rows) =>
      rows.map((item) =>
        item.id === row.id
          ? {
              ...item,
              _editing: true,
              _editTitlePt: item.titlePt,
              _editDescPt: item.descPt,
            }
          : item,
      ),
    );
  }

  cancelInlineEdit(row: FieldRow): void {
    this.rows.update((rows) =>
      rows.map((item) => (item.id === row.id ? { ...item, _editing: false } : item)),
    );
  }

  async saveInlineEdit(row: FieldRow): Promise<void> {
    try {
      const updated = await this.fieldsStore.update(this.projectId(), this.tableId(), row.id, {
        titlePt: row._editTitlePt ?? row.titlePt,
        descPt: row._editDescPt ?? row.descPt,
      });
      this.rows.update((rows) =>
        rows.map((item) =>
          item.id === row.id
            ? { ...updated, _editing: false, _editTitlePt: '', _editDescPt: '' }
            : item,
        ),
      );
      this.notification.success('Campo atualizado.');
    } catch (err) {
      this.notification.error(mapFieldsError(err));
    }
  }

  async bulkSetBrowse(value: 'S' | 'N'): Promise<void> {
    const ids = this.selectedRows().map((row) => row.id);
    if (ids.length === 0) return;
    try {
      await this.fieldsStore.bulkUpdate(this.projectId(), this.tableId(), ids, {
        showBrowse: value,
      });
      await this.load();
      this.notification.success('Campos atualizados em lote.');
    } catch (err) {
      this.notification.error(mapFieldsError(err));
    }
  }

  async bulkSetRequired(value: 'S' | 'N'): Promise<void> {
    const ids = this.selectedRows().map((row) => row.id);
    if (ids.length === 0) return;
    try {
      await this.fieldsStore.bulkUpdate(this.projectId(), this.tableId(), ids, {
        required: value === 'S' ? 'OBRIGAT' : null,
      });
      await this.load();
      this.notification.success('Campos atualizados em lote.');
    } catch (err) {
      this.notification.error(mapFieldsError(err));
    }
  }

  async bulkDelete(): Promise<void> {
    const ids = this.selectedRows().map((row) => row.id);
    if (ids.length === 0) return;
    try {
      await Promise.all(
        ids.map((id) => this.fieldsStore.delete(this.projectId(), this.tableId(), id)),
      );
      await this.load();
      this.notification.success('Campos arquivados.');
    } catch (err) {
      this.notification.error(mapFieldsError(err));
    }
  }

  goToNewField(): void {
    void this.router.navigate([
      '/projects',
      this.projectId(),
      'tables',
      this.tableId(),
      'fields',
      'new',
    ]);
  }

  async editSelectedField(): Promise<void> {
    const selected = this.selectedRows();
    if (selected.length !== 1) {
      this.notification.warning('Selecione exatamente 1 campo para editar.');
      return;
    }
    const field = selected[0];
    await this.router.navigate([
      '/projects',
      this.projectId(),
      'tables',
      this.tableId(),
      'fields',
      field.id,
      'edit',
    ]);
  }

  async bulkDeleteWithConfirm(): Promise<void> {
    if (this.selectedRows().length === 0) {
      this.notification.warning('Selecione ao menos 1 campo para deletar.');
      return;
    }
    const confirmed = window.confirm(
      `Deseja arquivar ${this.selectedRows().length} campo(s) selecionado(s)?`,
    );
    if (!confirmed) return;
    await this.bulkDelete();
  }

  closeShortcutsFromBackdrop(event: Event): void {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.showShortcuts.set(false);
  }

  private async persistReorder(fieldIds: string[]): Promise<void> {
    try {
      await this.fieldsStore.reorder(this.projectId(), this.tableId(), fieldIds);
      this.notification.success('Ordem dos campos atualizada.');
    } catch (err) {
      this.notification.error(mapFieldsError(err));
    }
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}
