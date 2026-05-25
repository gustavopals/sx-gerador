import { DatePipe } from '@angular/common';
import { Component, inject, signal, ViewChild, type OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoModalModule,
  PoNotificationService,
  PoPageModule,
  PoTabsModule,
  PoTagModule,
  PoTagType,
  type PoBreadcrumb,
  type PoModalAction,
  type PoModalComponent,
  type PoPageAction,
} from '@po-ui/ng-components';
import {
  mapProjectsError,
  ProjectsService,
  type CsvDictionary,
  type ImportPreviewResponse,
  type ProjectSummary,
} from '../../../core/services/projects.service';
import { HistoryTimelineComponent } from '../../../shared/components/history-timeline/history-timeline.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { TablesListComponent } from './tables-list/tables-list.component';

@Component({
  selector: 'sxg-project-detail',
  imports: [
    DatePipe,
    PoButtonModule,
    PoModalModule,
    PoPageModule,
    PoTabsModule,
    PoTagModule,
    TablesListComponent,
    HistoryTimelineComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  @ViewChild('importModal') private readonly importModal?: PoModalComponent;
  @ViewChild(TablesListComponent) private readonly tablesList?: TablesListComponent;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly notification = inject(PoNotificationService);

  readonly project = signal<ProjectSummary | null>(null);
  readonly isLoading = signal(false);
  readonly isActing = signal(false);
  readonly tagType = PoTagType;

  readonly importMode = signal<'json' | 'csv'>('json');
  readonly importFileName = signal<string | null>(null);
  readonly importDocument = signal<unknown | null>(null);
  readonly importCsvSx2 = signal<string | null>(null);
  readonly importCsvSx3 = signal<string | null>(null);
  readonly importCsvSix = signal<string | null>(null);
  readonly importCsvSx2Name = signal<string | null>(null);
  readonly importCsvSx3Name = signal<string | null>(null);
  readonly importCsvSixName = signal<string | null>(null);
  readonly importPreview = signal<ImportPreviewResponse | null>(null);
  readonly importSyncDeletions = signal(false);
  readonly isImportPreviewing = signal(false);
  readonly isImportApplying = signal(false);

  get importModalCloseAction(): PoModalAction {
    return {
      label: 'Fechar',
      disabled: this.isImportApplying(),
      action: () => void this.closeImportModal(),
    };
  }

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [{ label: 'Projetos', link: '/projects' }, { label: this.project()?.name ?? '…' }],
    };
  }

  get pageActions(): PoPageAction[] {
    const p = this.project();
    if (!p) return [];

    if (p.deletedAt) {
      return [
        {
          label: 'Restaurar',
          icon: 'an an-arrow-u-up-left',
          kind: 'primary',
          action: () => void this.restoreProject(),
        },
      ];
    }

    return [
      {
        label: 'Gerar migration',
        icon: 'an an-file-arrow-up',
        action: () => void this.router.navigate(['/projects', p.id, 'migrations', 'generate']),
      },
      {
        label: 'Baixar JSON',
        icon: 'an an-download-simple',
        action: () => void this.downloadExport(),
      },
      {
        label: 'Importar',
        icon: 'an an-upload',
        action: () => void this.openImportModal(),
      },
      {
        label: 'Editar',
        icon: 'an an-pencil',
        kind: 'primary',
        action: () => void this.router.navigate(['/projects', p.id, 'edit']),
      },
      {
        label: 'Duplicar',
        icon: 'an an-copy',
        action: () => void this.duplicateProject(),
      },
      {
        label: 'Arquivar',
        icon: 'an an-archive',
        action: () => void this.archiveProject(),
      },
    ];
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/projects']);
      return;
    }
    void this.loadProject(id);
  }

  visibilityLabel(v: string): string {
    return { PRIVATE: 'Privado', UNLISTED: 'Não listado', PUBLIC: 'Público' }[v] ?? v;
  }

  langLabel(lang: string): string {
    return (
      { 'pt-BR': 'Português (Brasil)', 'en-US': 'Inglês (EUA)', 'es-ES': 'Espanhol' }[lang] ?? lang
    );
  }

  navigateToEdit(): void {
    const p = this.project();
    if (p) void this.router.navigate(['/projects', p.id, 'edit']);
  }

  navigateToGenerateMigration(): void {
    const p = this.project();
    if (p) void this.router.navigate(['/projects', p.id, 'migrations', 'generate']);
  }

  navigateToMigrationsList(): void {
    const p = this.project();
    if (p) void this.router.navigate(['/projects', p.id, 'migrations']);
  }

  setImportMode(mode: 'json' | 'csv'): void {
    this.importMode.set(mode);
    this.importPreview.set(null);
  }

  openImportModal(): void {
    const p = this.project();
    if (!p || p.deletedAt) return;
    this.resetImportState();
    this.importModal?.open();
  }

  async downloadCsvExport(dictionary: CsvDictionary): Promise<void> {
    const p = this.project();
    if (!p || p.deletedAt) return;
    this.isActing.set(true);
    try {
      await this.projectsService.downloadProjectCsvExport(p.id, dictionary, p.slug);
      this.notification.success(`CSV ${dictionary.toUpperCase()} baixado.`);
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isActing.set(false);
    }
  }

  closeImportModal(): void {
    this.importModal?.close();
    this.resetImportState();
  }

  onCsvFileSelected(kind: 'sx2' | 'sx3' | 'six', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      if (kind === 'sx2') {
        this.importCsvSx2.set(text);
        this.importCsvSx2Name.set(file.name);
      } else if (kind === 'sx3') {
        this.importCsvSx3.set(text);
        this.importCsvSx3Name.set(file.name);
      } else {
        this.importCsvSix.set(text);
        this.importCsvSixName.set(file.name);
      }
      this.importPreview.set(null);
    };
    reader.onerror = () => this.notification.error('Não foi possível ler o arquivo.');
    reader.readAsText(file, 'UTF-8');
    input.value = '';
  }

  triggerCsvFilePicker(input: HTMLInputElement): void {
    input.click();
  }

  hasCsvSelection(): boolean {
    return Boolean(this.importCsvSx2() || this.importCsvSx3() || this.importCsvSix());
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importFileName.set(file.name);
    this.importPreview.set(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        const parsed: unknown = JSON.parse(text);
        this.importDocument.set(parsed);
      } catch {
        this.importDocument.set(null);
        this.notification.error('Arquivo JSON inválido ou corrompido.');
      }
    };
    reader.onerror = () => {
      this.importDocument.set(null);
      this.notification.error('Não foi possível ler o arquivo.');
    };
    reader.readAsText(file, 'UTF-8');
    input.value = '';
  }

  triggerImportFilePicker(importFileInput: HTMLInputElement): void {
    importFileInput.click();
  }

  onImportSyncCheckboxChange(event: Event): void {
    const t = event.target;
    this.importSyncDeletions.set(t instanceof HTMLInputElement ? t.checked : false);
  }

  async runImportPreview(): Promise<void> {
    const p = this.project();
    if (!p) return;

    if (this.importMode() === 'json') {
      const doc = this.importDocument();
      if (doc === null) {
        this.notification.warning('Selecione um arquivo JSON exportado do SXGerador.');
        return;
      }
    } else if (!this.hasCsvSelection()) {
      this.notification.warning('Selecione ao menos um CSV (SX2, SX3 ou SIX).');
      return;
    }

    this.isImportPreviewing.set(true);
    this.importPreview.set(null);
    try {
      const result =
        this.importMode() === 'json'
          ? await this.projectsService.importPreview(p.id, this.importDocument())
          : await this.projectsService.importCsvPreview(p.id, {
              sx2: this.importCsvSx2() ?? undefined,
              sx3: this.importCsvSx3() ?? undefined,
              six: this.importCsvSix() ?? undefined,
            });
      this.importPreview.set(result);
      if (!result.valid) {
        this.notification.warning('O arquivo não passou na validação. Veja os detalhes abaixo.');
      }
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isImportPreviewing.set(false);
    }
  }

  async runImportApply(): Promise<void> {
    const p = this.project();
    const preview = this.importPreview();
    if (!p || !preview?.valid) {
      this.notification.warning('Pré-visualize um arquivo válido antes de aplicar.');
      return;
    }

    if (this.importMode() === 'json' && this.importDocument() === null) {
      this.notification.warning('Selecione um arquivo JSON.');
      return;
    }
    if (this.importMode() === 'csv' && !this.hasCsvSelection()) {
      this.notification.warning('Selecione ao menos um CSV.');
      return;
    }

    this.isImportApplying.set(true);
    try {
      const syncDeletions = this.importSyncDeletions();
      const result =
        this.importMode() === 'json'
          ? await this.projectsService.importApply(p.id, this.importDocument(), { syncDeletions })
          : await this.projectsService.importCsvApply(p.id, {
              sx2: this.importCsvSx2() ?? undefined,
              sx3: this.importCsvSx3() ?? undefined,
              six: this.importCsvSix() ?? undefined,
              options: { syncDeletions },
            });
      if (!result.success) {
        const msg =
          result.errors.length > 0
            ? result.errors.join('\n')
            : 'Não foi possível aplicar a importação.';
        this.notification.error(msg);
        return;
      }
      this.notification.success('Importação aplicada com sucesso.');
      this.closeImportModal();
      this.tablesList?.reload();
      void this.loadProject(p.id);
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isImportApplying.set(false);
    }
  }

  private resetImportState(): void {
    this.importMode.set('json');
    this.importFileName.set(null);
    this.importDocument.set(null);
    this.importCsvSx2.set(null);
    this.importCsvSx3.set(null);
    this.importCsvSix.set(null);
    this.importCsvSx2Name.set(null);
    this.importCsvSx3Name.set(null);
    this.importCsvSixName.set(null);
    this.importPreview.set(null);
    this.importSyncDeletions.set(false);
  }

  private async loadProject(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      this.project.set(await this.projectsService.get(id));
    } catch {
      this.notification.error('Projeto não encontrado.');
      void this.router.navigate(['/projects']);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async archiveProject(): Promise<void> {
    const p = this.project();
    if (!p) return;
    this.isActing.set(true);
    try {
      this.project.set(await this.projectsService.archive(p.id));
      this.notification.success('Projeto arquivado.');
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isActing.set(false);
    }
  }

  private async restoreProject(): Promise<void> {
    const p = this.project();
    if (!p) return;
    this.isActing.set(true);
    try {
      this.project.set(await this.projectsService.restore(p.id));
      this.notification.success('Projeto restaurado.');
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isActing.set(false);
    }
  }

  private async duplicateProject(): Promise<void> {
    const p = this.project();
    if (!p) return;
    this.isActing.set(true);
    try {
      const copy = await this.projectsService.duplicate(p.id);
      this.notification.success(`Projeto duplicado como "${copy.name}".`);
      void this.router.navigate(['/projects', copy.id]);
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isActing.set(false);
    }
  }

  private async downloadExport(): Promise<void> {
    const p = this.project();
    if (!p || p.deletedAt) return;
    this.isActing.set(true);
    try {
      await this.projectsService.downloadProjectExport(p.id, p.slug);
      this.notification.success('Arquivo JSON baixado.');
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isActing.set(false);
    }
  }
}
