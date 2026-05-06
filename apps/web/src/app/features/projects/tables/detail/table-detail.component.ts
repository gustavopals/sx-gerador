import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoNotificationService,
  PoPageModule,
  PoTabsModule,
  PoTagModule,
  PoTagType,
  type PoBreadcrumb,
  type PoPageAction,
} from '@po-ui/ng-components';
import { FieldsService, type FieldSummary } from '../../../../core/services/fields.service';
import { IndexesService, type IndexSummary } from '../../../../core/services/indexes.service';
import {
  mapTablesError,
  TablesService,
  type TableSummary,
} from '../../../../core/services/tables.service';
import { FieldsListComponent } from '../../fields/list/fields-list.component';
import { IndexesListComponent } from '../../indexes/list/indexes-list.component';

@Component({
  selector: 'sxg-table-detail',
  imports: [
    DatePipe,
    PoButtonModule,
    PoPageModule,
    PoTabsModule,
    PoTagModule,
    FieldsListComponent,
    IndexesListComponent,
  ],
  templateUrl: './table-detail.component.html',
  styleUrl: './table-detail.component.scss',
})
export class TableDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tablesService = inject(TablesService);
  private readonly fieldsService = inject(FieldsService);
  private readonly indexesService = inject(IndexesService);
  private readonly notification = inject(PoNotificationService);

  readonly table = signal<TableSummary | null>(null);
  readonly projectId = signal<string>('');
  readonly isLoading = signal(false);
  readonly isActing = signal(false);
  readonly tagType = PoTagType;
  readonly fields = signal<FieldSummary[]>([]);
  readonly indexes = signal<IndexSummary[]>([]);

  readonly hasFilialField = computed(() =>
    this.fields().some((field) => field.name === `${this.table()?.prefix ?? ''}_FILIAL`),
  );
  readonly hasPrimaryIndex = computed(() =>
    this.indexes().some((index) => index.order === '1' && !index.deletedAt),
  );

  get breadcrumb(): PoBreadcrumb {
    const t = this.table();
    return {
      items: [
        { label: 'Projetos', link: '/projects' },
        { label: 'Projeto', link: `/projects/${this.projectId()}` },
        { label: t ? `${t.prefix} — ${t.namePt}` : '…' },
      ],
    };
  }

  get pageActions(): PoPageAction[] {
    const t = this.table();
    if (!t) return [];

    if (t.deletedAt) {
      return [
        {
          label: 'Restaurar',
          icon: 'an an-arrow-u-up-left',
          kind: 'primary',
          action: () => void this.restoreTable(),
        },
      ];
    }

    return [
      {
        label: 'Editar',
        icon: 'an an-pencil',
        kind: 'primary',
        action: () =>
          void this.router.navigate(['/projects', this.projectId(), 'tables', t.id, 'edit']),
      },
      {
        label: 'Arquivar',
        icon: 'an an-archive',
        action: () => void this.archiveTable(),
      },
    ];
  }

  get modeLabel(): string {
    const t = this.table();
    if (!t) return '';
    return t.modeCompany === 'C' ? 'Compartilhado' : 'Exclusivo';
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    const tableId = this.route.snapshot.paramMap.get('tableId');

    if (!projectId || !tableId) {
      void this.router.navigate(['/projects']);
      return;
    }

    this.projectId.set(projectId);
    void this.loadTable(projectId, tableId);
  }

  navigateToEdit(): void {
    const t = this.table();
    if (!t) return;
    void this.router.navigate(['/projects', this.projectId(), 'tables', t.id, 'edit']);
  }

  navigateToNewField(): void {
    const t = this.table();
    if (!t) return;
    void this.router.navigate(['/projects', this.projectId(), 'tables', t.id, 'fields', 'new']);
  }

  navigateToEditField(fieldId: string): void {
    const t = this.table();
    if (!t || t.deletedAt) return;
    void this.router.navigate([
      '/projects',
      this.projectId(),
      'tables',
      t.id,
      'fields',
      fieldId,
      'edit',
    ]);
  }

  navigateToNewIndex(): void {
    const t = this.table();
    if (!t) return;
    void this.router.navigate(['/projects', this.projectId(), 'tables', t.id, 'indexes', 'new']);
  }

  private async loadTable(projectId: string, tableId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      this.table.set(await this.tablesService.get(projectId, tableId));
      const [fieldsResponse, indexesResponse] = await Promise.all([
        this.fieldsService.list(projectId, tableId),
        this.indexesService.list(projectId, tableId),
      ]);
      this.fields.set(fieldsResponse.fields.filter((field) => !field.deletedAt));
      this.indexes.set(indexesResponse.indexes.filter((index) => !index.deletedAt));
    } catch {
      this.notification.error('Tabela não encontrada.');
      void this.router.navigate(['/projects', projectId]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async archiveTable(): Promise<void> {
    const t = this.table();
    if (!t) return;
    this.isActing.set(true);
    try {
      this.table.set(await this.tablesService.archive(this.projectId(), t.id));
      this.notification.success('Tabela arquivada.');
    } catch (err) {
      this.notification.error(mapTablesError(err));
    } finally {
      this.isActing.set(false);
    }
  }

  private async restoreTable(): Promise<void> {
    const t = this.table();
    if (!t) return;
    this.isActing.set(true);
    try {
      this.table.set(await this.tablesService.restore(this.projectId(), t.id));
      this.notification.success('Tabela restaurada.');
    } catch (err) {
      this.notification.error(mapTablesError(err));
    } finally {
      this.isActing.set(false);
    }
  }
}
