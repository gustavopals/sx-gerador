import { DatePipe } from '@angular/common';
import { Component, inject, signal, ViewChild, type OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoModalModule,
  PoNotificationService,
  PoPageModule,
  type PoBreadcrumb,
  type PoModalAction,
  type PoModalComponent,
  type PoPageAction,
} from '@po-ui/ng-components';
import {
  DiffService,
  mapDiffError,
  type CompareMigrationsResponse,
} from '../../../../core/services/diff.service';
import {
  mapMigrationsError,
  MigrationsService,
  type DraftMigrationItem,
  type GeneratedMigrationListItem,
} from '../../../../core/services/migrations.service';
import { DiffViewerComponent } from '../../../../shared/components/diff-viewer/diff-viewer.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'sxg-migrations-list',
  imports: [
    DatePipe,
    PoButtonModule,
    PoModalModule,
    PoPageModule,
    DiffViewerComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './migrations-list.component.html',
  styleUrl: './migrations-list.component.scss',
})
export class MigrationsListComponent implements OnInit {
  @ViewChild('compareModal') private readonly compareModal?: PoModalComponent;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MigrationsService);
  private readonly diffService = inject(DiffService);
  private readonly notification = inject(PoNotificationService);

  readonly projectId = signal('');
  readonly isLoading = signal(false);
  readonly isDownloading = signal<string | null>(null);
  readonly isComparing = signal(false);
  readonly migrations = signal<GeneratedMigrationListItem[]>([]);
  readonly expandedIds = signal<Set<string>>(new Set());
  readonly selectedForCompare = signal<string[]>([]);
  readonly compareResult = signal<CompareMigrationsResponse | null>(null);

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [
        { label: 'Projetos', link: '/projects' },
        { label: 'Projeto', link: `/projects/${this.projectId()}` },
        { label: 'Migrations' },
      ],
    };
  }

  get compareModalCloseAction(): PoModalAction {
    return {
      label: 'Fechar',
      action: () => this.compareModal?.close(),
    };
  }

  get pageActions(): PoPageAction[] {
    const actions: PoPageAction[] = [
      {
        label: 'Gerar migration',
        icon: 'an an-file-arrow-up',
        kind: 'primary',
        action: () =>
          void this.router.navigate(['/projects', this.projectId(), 'migrations', 'generate']),
      },
    ];

    if (this.selectedForCompare().length === 2) {
      actions.unshift({
        label: 'Comparar selecionadas',
        icon: 'an an-arrows-left-right',
        kind: 'secondary',
        action: () => void this.runCompare(),
      });
    }

    actions.push({
      label: 'Voltar',
      icon: 'an an-arrow-left',
      action: () => void this.router.navigate(['/projects', this.projectId()]),
    });

    return actions;
  }

  ngOnInit(): void {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      void this.router.navigate(['/projects']);
      return;
    }
    this.projectId.set(projectId);
    void this.loadMigrations();
  }

  navigateToGenerate(): void {
    void this.router.navigate(['/projects', this.projectId(), 'migrations', 'generate']);
  }

  isExpanded(migrationId: string): boolean {
    return this.expandedIds().has(migrationId);
  }

  toggleExpanded(migrationId: string): void {
    const next = new Set(this.expandedIds());
    if (next.has(migrationId)) next.delete(migrationId);
    else next.add(migrationId);
    this.expandedIds.set(next);
  }

  isSelectedForCompare(migrationId: string): boolean {
    return this.selectedForCompare().includes(migrationId);
  }

  toggleCompareSelection(migrationId: string): void {
    const current = this.selectedForCompare();
    if (current.includes(migrationId)) {
      this.selectedForCompare.set(current.filter((id) => id !== migrationId));
      return;
    }
    if (current.length >= 2) {
      this.notification.warning('Selecione no máximo duas migrations para comparar.');
      return;
    }
    this.selectedForCompare.set([...current, migrationId]);
  }

  migrationLabel(migration: GeneratedMigrationListItem): string {
    return `#${migration.sequence} — ${migration.name}`;
  }

  compareLabelA(): string {
    const result = this.compareResult();
    return result ? `#${result.migrationA.sequence} ${result.migrationA.name}` : 'Migration A';
  }

  compareLabelB(): string {
    const result = this.compareResult();
    return result ? `#${result.migrationB.sequence} ${result.migrationB.name}` : 'Migration B';
  }

  private async runCompare(): Promise<void> {
    const [migrationIdA, migrationIdB] = this.selectedForCompare();
    if (!migrationIdA || !migrationIdB) return;

    this.isComparing.set(true);
    this.compareResult.set(null);
    try {
      const result = await this.diffService.compareMigrations({
        projectId: this.projectId(),
        migrationIdA,
        migrationIdB,
      });
      this.compareResult.set(result);
      this.compareModal?.open();
    } catch (err) {
      this.notification.error(mapDiffError(err));
    } finally {
      this.isComparing.set(false);
    }
  }

  async downloadAgain(migration: GeneratedMigrationListItem): Promise<void> {
    this.isDownloading.set(migration.id);
    try {
      const blob = await this.service.download(this.projectId(), migration.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${String(migration.sequence).padStart(3, '0')}_${slugify(migration.name)}.prw`;
      a.click();
      URL.revokeObjectURL(url);
      this.notification.success('Download iniciado.');
    } catch (err) {
      this.notification.error(mapMigrationsError(err));
    } finally {
      this.isDownloading.set(null);
    }
  }

  trackMigration(_: number, migration: GeneratedMigrationListItem): string {
    return migration.id;
  }

  trackItem(_: number, item: DraftMigrationItem): string {
    return item.id;
  }

  displayDate(migration: GeneratedMigrationListItem): string {
    return migration.generatedAt ?? migration.createdAt;
  }

  private async loadMigrations(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.service.list(this.projectId());
      this.migrations.set(response.migrations);
    } catch (err) {
      this.notification.error(mapMigrationsError(err));
      void this.router.navigate(['/projects', this.projectId()]);
    } finally {
      this.isLoading.set(false);
    }
  }
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
