import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoButtonModule,
  PoFieldModule,
  PoNotificationService,
  PoTableModule,
  type PoTableAction,
  type PoTableColumn,
} from '@po-ui/ng-components';
import { mapIndexesError, type IndexSummary } from '../../../../core/services/indexes.service';
import { IndexesStore } from '../../../../stores/indexes.store';

@Component({
  selector: 'sxg-indexes-list',
  imports: [FormsModule, PoButtonModule, PoFieldModule, PoTableModule],
  templateUrl: './indexes-list.component.html',
  styleUrl: './indexes-list.component.scss',
})
export class IndexesListComponent {
  private readonly indexesStore = inject(IndexesStore);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);

  readonly projectId = input.required<string>();
  readonly tableId = input.required<string>();
  readonly isDisabled = input(false);

  readonly isLoading = this.indexesStore.isLoading;
  readonly search = signal('');

  readonly columns: PoTableColumn[] = [
    { property: 'order', label: 'Ordem', width: '90px' },
    { property: 'key', label: 'Chave' },
    { property: 'descPt', label: 'Descrição PT' },
    { property: 'nickname', label: 'Apelido', width: '120px' },
    { property: 'showSearch', label: 'F3', width: '80px' },
  ];

  readonly actions: PoTableAction[] = [
    {
      label: 'Editar',
      icon: 'an an-pencil',
      action: (row: IndexSummary) => void this.editIndex(row.id),
      disabled: () => this.isDisabled(),
    },
    {
      label: 'Arquivar',
      icon: 'an an-archive',
      action: (row: IndexSummary) => void this.archive(row.id),
      disabled: () => this.isDisabled(),
    },
  ];

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      const tableId = this.tableId();
      if (projectId && tableId) void this.load();
    });
  }

  get rows(): IndexSummary[] {
    const query = this.search().trim().toLowerCase();
    const rows = this.indexesStore.indexes();
    if (!query) return rows;
    return rows.filter((row) =>
      `${row.key} ${row.descPt} ${row.nickname ?? ''}`.toLowerCase().includes(query),
    );
  }

  async load(): Promise<void> {
    try {
      await this.indexesStore.loadIndexes(this.projectId(), this.tableId());
    } catch (err) {
      this.notification.error(mapIndexesError(err));
    }
  }

  goToNew(): void {
    void this.router.navigate([
      '/projects',
      this.projectId(),
      'tables',
      this.tableId(),
      'indexes',
      'new',
    ]);
  }

  async editIndex(indexId: string): Promise<void> {
    await this.router.navigate([
      '/projects',
      this.projectId(),
      'tables',
      this.tableId(),
      'indexes',
      indexId,
      'edit',
    ]);
  }

  async archive(indexId: string): Promise<void> {
    try {
      await this.indexesStore.delete(this.projectId(), this.tableId(), indexId);
      this.notification.success('Índice arquivado.');
    } catch (err) {
      this.notification.error(mapIndexesError(err));
    }
  }
}
