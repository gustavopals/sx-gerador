import { DatePipe } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoNotificationService,
  PoPageModule,
  type PoBreadcrumb,
  type PoPageAction,
} from '@po-ui/ng-components';
import {
  mapMigrationsError,
  MigrationsService,
  type DraftMigrationItem,
  type GeneratedMigrationListItem,
} from '../../../../core/services/migrations.service';

@Component({
  selector: 'sxg-migrations-list',
  imports: [DatePipe, PoButtonModule, PoPageModule],
  templateUrl: './migrations-list.component.html',
  styleUrl: './migrations-list.component.scss',
})
export class MigrationsListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MigrationsService);
  private readonly notification = inject(PoNotificationService);

  readonly projectId = signal('');
  readonly isLoading = signal(false);
  readonly isDownloading = signal<string | null>(null);
  readonly migrations = signal<GeneratedMigrationListItem[]>([]);
  readonly expandedIds = signal<Set<string>>(new Set());

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [
        { label: 'Projetos', link: '/projects' },
        { label: 'Projeto', link: `/projects/${this.projectId()}` },
        { label: 'Migrations' },
      ],
    };
  }

  get pageActions(): PoPageAction[] {
    return [
      {
        label: 'Gerar migration',
        icon: 'an an-file-arrow-up',
        kind: 'primary',
        action: () =>
          void this.router.navigate(['/projects', this.projectId(), 'migrations', 'generate']),
      },
      {
        label: 'Voltar',
        icon: 'an an-arrow-left',
        action: () => void this.router.navigate(['/projects', this.projectId()]),
      },
    ];
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

  isExpanded(migrationId: string): boolean {
    return this.expandedIds().has(migrationId);
  }

  toggleExpanded(migrationId: string): void {
    const next = new Set(this.expandedIds());
    if (next.has(migrationId)) next.delete(migrationId);
    else next.add(migrationId);
    this.expandedIds.set(next);
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
