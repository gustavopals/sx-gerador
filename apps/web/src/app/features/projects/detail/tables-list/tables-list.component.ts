import { Component, inject, Input, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
  PoTableModule,
  type PoSelectOption,
  type PoTableAction,
  type PoTableColumn,
  type PoTableColumnLabel,
  type PoTableLiterals,
} from '@po-ui/ng-components';
import {
  mapTablesError,
  TablesService,
  type TableSummary,
} from '../../../../core/services/tables.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

type TableRow = TableSummary & { status: string; fieldCount: number; indexCount: number };

@Component({
  selector: 'sxg-tables-list',
  imports: [
    ReactiveFormsModule,
    PoButtonModule,
    PoFieldModule,
    PoTableModule,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './tables-list.component.html',
  styleUrl: './tables-list.component.scss',
})
export class TablesListComponent implements OnInit {
  @Input() projectId!: string;
  @Input() projectDeleted = false;

  private readonly tablesService = inject(TablesService);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly submitType = PoButtonType.Submit;
  readonly tables = signal<TableRow[]>([]);
  readonly tableLiterals: PoTableLiterals = {
    noData: 'Nenhuma tabela cadastrada. Clique em "Nova tabela" para começar.',
  };
  readonly isLoading = signal(false);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly totalPages = signal(0);

  readonly filterForm = this.fb.group({
    search: [''],
    archived: ['active'],
  });

  readonly filterOptions: PoSelectOption[] = [
    { label: 'Apenas ativas', value: 'active' },
    { label: 'Incluir arquivadas', value: 'all' },
  ];

  readonly sharingModeLabels: PoTableColumnLabel[] = [
    { value: 'C', label: 'Compartilhado', color: 'color-10' },
    { value: 'E', label: 'Exclusivo', color: 'color-07' },
  ];

  readonly statusLabels: PoTableColumnLabel[] = [
    { value: 'active', label: 'Ativa', color: 'color-10' },
    { value: 'archived', label: 'Arquivada', color: 'color-07' },
  ];

  readonly columns: PoTableColumn[] = [
    {
      property: 'prefix',
      label: 'Prefixo',
      width: '120px',
      type: 'link',
      action: (value: string, row: TableSummary) => this.navigateToDetail(row),
    },
    { property: 'namePt', label: 'Nome' },
    {
      property: 'modeCompany',
      label: 'Modo',
      width: '160px',
      type: 'label',
      labels: this.sharingModeLabels,
    },
    { property: 'fieldCount', label: 'Campos', width: '100px', type: 'number' },
    { property: 'indexCount', label: 'Índices', width: '100px', type: 'number' },
    {
      property: 'status',
      label: 'Situação',
      width: '140px',
      type: 'label',
      labels: this.statusLabels,
    },
  ];

  readonly actions: PoTableAction[] = [
    {
      label: 'Editar',
      icon: 'an an-pencil',
      action: (row: TableSummary) => this.editTable(row),
      visible: (row: TableSummary) => !row.deletedAt,
    },
    {
      label: 'Arquivar',
      icon: 'an an-archive',
      type: 'danger',
      action: (row: TableSummary) => void this.archiveTable(row),
      visible: (row: TableSummary) => !row.deletedAt,
    },
    {
      label: 'Restaurar',
      icon: 'an an-arrow-u-up-left',
      action: (row: TableSummary) => void this.restoreTable(row),
      visible: (row: TableSummary) => !!row.deletedAt,
    },
  ];

  ngOnInit(): void {
    void this.load();
  }

  /** Recarrega a lista (ex.: após importação JSON). */
  reload(): void {
    void this.load();
  }

  get hasPreviousPage(): boolean {
    return this.page() > 1;
  }

  get hasNextPage(): boolean {
    return this.page() < this.totalPages();
  }

  applyFilters(): void {
    this.page.set(1);
    void this.load();
  }

  clearFilters(): void {
    this.filterForm.setValue({ search: '', archived: 'active' });
    this.applyFilters();
  }

  previousPage(): void {
    if (!this.hasPreviousPage) return;
    this.page.update((v) => v - 1);
    void this.load();
  }

  nextPage(): void {
    if (!this.hasNextPage) return;
    this.page.update((v) => v + 1);
    void this.load();
  }

  navigateToNew(): void {
    void this.router.navigate(['/projects', this.projectId, 'tables', 'new']);
  }

  private navigateToDetail(row: TableSummary): void {
    void this.router.navigate(['/projects', this.projectId, 'tables', row.id]);
  }

  private editTable(row: TableSummary): void {
    void this.router.navigate(['/projects', this.projectId, 'tables', row.id, 'edit']);
  }

  private async archiveTable(row: TableSummary): Promise<void> {
    try {
      await this.tablesService.archive(this.projectId, row.id);
      this.notification.success(`Tabela ${row.prefix} arquivada.`);
      void this.load();
    } catch (err) {
      this.notification.error(mapTablesError(err));
    }
  }

  private async restoreTable(row: TableSummary): Promise<void> {
    try {
      await this.tablesService.restore(this.projectId, row.id);
      this.notification.success(`Tabela ${row.prefix} restaurada.`);
      void this.load();
    } catch (err) {
      this.notification.error(mapTablesError(err));
    }
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { search, archived } = this.filterForm.value;
      const response = await this.tablesService.list(this.projectId, {
        page: this.page(),
        pageSize: this.pageSize,
        search: search?.trim() || undefined,
        includeArchived: archived === 'all',
      });
      this.tables.set(
        response.tables.map((t) => ({
          ...t,
          status: t.deletedAt ? 'archived' : 'active',
          fieldCount: 0,
          indexCount: 0,
        })),
      );
      this.total.set(response.meta.total);
      this.totalPages.set(response.meta.totalPages);
    } catch {
      this.notification.error('Não foi possível carregar as tabelas.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
