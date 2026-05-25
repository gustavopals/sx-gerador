import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoFieldModule,
  PoNotificationService,
  PoPageModule,
  PoTableModule,
  type PoBreadcrumb,
  type PoPageAction,
  type PoTableColumn,
} from '@po-ui/ng-components';
import {
  mapMigrationsError,
  MigrationsService,
  type DraftMigrationItem,
} from '../../../../core/services/migrations.service';
import { LoadingSkeletonComponent } from '../../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'sxg-generate-migration',
  imports: [
    FormsModule,
    PoButtonModule,
    PoFieldModule,
    PoPageModule,
    PoTableModule,
    LoadingSkeletonComponent,
  ],
  templateUrl: './generate-migration.component.html',
  styleUrl: './generate-migration.component.scss',
})
export class GenerateMigrationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(MigrationsService);
  private readonly notification = inject(PoNotificationService);

  readonly projectId = signal('');
  readonly isLoading = signal(false);
  readonly isGenerating = signal(false);
  readonly migrationName = signal('');
  readonly draftItems = signal<DraftMigrationItem[]>([]);
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly previewCode = signal('');

  readonly columns: PoTableColumn[] = [
    { property: 'operation', label: 'Operação', width: '180px' },
    { property: 'targetType', label: 'Tipo', width: '120px' },
    { property: 'targetName', label: 'Alvo' },
    { property: 'createdAt', label: 'Data', type: 'dateTime', width: '180px' },
  ];

  readonly selectedItems = computed(() =>
    this.draftItems().filter((item) => this.selectedIds().has(item.id)),
  );

  readonly validationErrors = computed(() => {
    const errors: string[] = [];
    const selected = this.selectedItems();
    if (selected.length === 0) errors.push('Selecione ao menos uma mudança para incluir.');

    const hasCreateTable = selected.some((item) => item.operation === 'CREATE_TABLE');
    const hasPrimaryIndex = selected.some(
      (item) => item.operation === 'CREATE_INDEX' && item.targetName === '1',
    );
    if (hasCreateTable && !hasPrimaryIndex) {
      errors.push('Tabelas novas devem incluir índice de ordem 1 nesta migration.');
    }

    return errors;
  });

  readonly validationWarnings = computed(() => {
    const warnings: string[] = [];
    const selected = this.selectedItems();
    if (selected.some((item) => item.operation === 'DROP_TABLE')) {
      warnings.push('Há exclusão de tabela na seleção. Revise o impacto antes de gerar.');
    }
    if (selected.some((item) => item.operation === 'DROP_FIELD')) {
      warnings.push('Há exclusão de campo na seleção. Isso pode impactar rotinas existentes.');
    }
    return warnings;
  });

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [
        { label: 'Projetos', link: '/projects' },
        { label: 'Projeto', link: `/projects/${this.projectId()}` },
        { label: 'Gerar migration' },
      ],
    };
  }

  get pageActions(): PoPageAction[] {
    return [
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
    void this.loadDraft();
  }

  isSelected(itemId: string): boolean {
    return this.selectedIds().has(itemId);
  }

  toggleItem(itemId: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(itemId)) next.delete(itemId);
    else next.add(itemId);
    this.selectedIds.set(next);
  }

  async generateAndDownload(): Promise<void> {
    if (this.validationErrors().length > 0) {
      this.notification.warning('Corrija as validações antes de gerar a migration.');
      return;
    }

    const name = this.migrationName().trim();
    if (!name) {
      this.notification.warning('Informe um nome amigável para a migration.');
      return;
    }

    this.isGenerating.set(true);
    try {
      const generated = await this.service.generate(this.projectId(), name);
      const preview = await this.service.preview(this.projectId(), generated.migration.id);
      this.previewCode.set(preview.code);

      const blob = await this.service.download(this.projectId(), generated.migration.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${String(generated.migration.sequence).padStart(3, '0')}_${slugify(name)}.prw`;
      a.click();
      URL.revokeObjectURL(url);

      this.notification.success('Migration gerada e download iniciado.');
    } catch (err) {
      this.notification.error(mapMigrationsError(err));
    } finally {
      this.isGenerating.set(false);
    }
  }

  private async loadDraft(): Promise<void> {
    this.isLoading.set(true);
    try {
      const draft = await this.service.getDraft(this.projectId());
      this.migrationName.set(draft.draft.name);
      this.draftItems.set(draft.items);
      this.selectedIds.set(new Set(draft.items.map((item) => item.id)));
    } catch (err) {
      this.notification.error(mapMigrationsError(err));
      void this.router.navigate(['/projects', this.projectId()]);
    } finally {
      this.isLoading.set(false);
    }
  }

  highlightedPreview(): string {
    const escaped = escapeHtml(this.previewCode());
    return escaped
      .replace(
        /\b(User Function|Local|If|Else|EndIf|Return|Static Function|dbSelectArea|dbSetOrder|dbSeek|RecLock|MsUnLock)\b/g,
        '<span class="sxg-gm__kw">$1</span>',
      )
      .replace(/("[^"]*")/g, '<span class="sxg-gm__str">$1</span>')
      .replace(/(;.*)$/gm, '<span class="sxg-gm__comment">$1</span>');
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
