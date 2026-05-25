import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoCheckboxModule,
  PoFieldModule,
  PoModalModule,
  PoNotificationService,
  PoPageModule,
  PoTagModule,
  PoTagType,
  type PoModalAction,
  type PoModalComponent,
  type PoPageAction,
  type PoSelectOption,
} from '@po-ui/ng-components';
import { TEMPLATE_CATEGORIES, type TemplateCategory } from '@sxgerador/shared-types';
import {
  mapProjectsError,
  ProjectsService,
  type ProjectSummary,
} from '../../../core/services/projects.service';
import {
  mapTemplatesError,
  TemplatesService,
  type ApplyTemplatePreviewResult,
  type TemplateSummary,
} from '../../../core/services/templates.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'sxg-templates-gallery',
  imports: [
    ReactiveFormsModule,
    PoButtonModule,
    PoCheckboxModule,
    PoFieldModule,
    PoModalModule,
    PoPageModule,
    PoTagModule,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './templates-gallery.component.html',
  styleUrl: './templates-gallery.component.scss',
})
export class TemplatesGalleryComponent implements OnInit {
  private readonly templatesService = inject(TemplatesService);
  private readonly projectsService = inject(ProjectsService);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly tagType = PoTagType;
  readonly submitType = PoButtonType.Submit;
  readonly isLoading = signal(false);
  readonly templates = signal<TemplateSummary[]>([]);
  readonly projects = signal<ProjectSummary[]>([]);
  readonly applyTemplate = signal<TemplateSummary | null>(null);
  readonly applyPreview = signal<ApplyTemplatePreviewResult | null>(null);
  readonly isApplyPreviewing = signal(false);
  readonly isApplying = signal(false);

  applyModal?: PoModalComponent;

  readonly pageActions: PoPageAction[] = [
    {
      label: 'Atualizar',
      icon: 'an an-arrow-clockwise',
      action: () => void this.loadTemplates(),
    },
  ];

  readonly categoryOptions: PoSelectOption[] = [
    { label: 'Todas as categorias', value: '' },
    ...TEMPLATE_CATEGORIES.map((c) => ({ label: c, value: c })),
  ];

  readonly projectOptions = signal<PoSelectOption[]>([]);

  readonly filtersForm = this.fb.group({
    search: [''],
    category: [''],
    officialOnly: [false],
  });

  readonly applyForm = this.fb.group({
    projectId: [''],
    prefixOverride: [''],
  });

  get applyModalCloseAction(): PoModalAction {
    return {
      label: 'Cancelar',
      disabled: this.isApplying(),
      action: () => this.closeApplyModal(),
    };
  }

  ngOnInit(): void {
    void this.loadTemplates();
    void this.loadProjects();
  }

  async loadTemplates(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { search, category, officialOnly } = this.filtersForm.getRawValue();
      const result = await this.templatesService.list({
        page: 1,
        pageSize: 24,
        search: search?.trim() || undefined,
        category: (category as TemplateCategory) || undefined,
        officialOnly: officialOnly === true,
      });
      this.templates.set(result.templates);
    } catch (err) {
      this.notification.error(mapTemplatesError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilters(): void {
    void this.loadTemplates();
  }

  clearFilters(): void {
    this.filtersForm.reset({ search: '', category: '', officialOnly: false });
    void this.loadTemplates();
  }

  openApply(template: TemplateSummary, modal: PoModalComponent): void {
    this.applyTemplate.set(template);
    this.applyPreview.set(null);
    this.applyForm.reset({
      projectId: '',
      prefixOverride: template.sourceTablePrefix ?? '',
    });
    this.applyModal = modal;
    modal.open();
  }

  closeApplyModal(): void {
    this.applyModal?.close();
    this.applyTemplate.set(null);
    this.applyPreview.set(null);
  }

  async runApplyPreview(): Promise<void> {
    const template = this.applyTemplate();
    const projectId = this.applyForm.value.projectId?.trim();
    if (!template || !projectId) {
      this.notification.warning('Selecione o projeto destino.');
      return;
    }

    const prefixOverride = this.applyForm.value.prefixOverride?.trim().toUpperCase();
    this.isApplyPreviewing.set(true);
    this.applyPreview.set(null);
    try {
      const result = await this.templatesService.previewApply(template.id, {
        projectId,
        prefixOverride: prefixOverride?.length === 3 ? prefixOverride : undefined,
      });
      this.applyPreview.set(result);
      if (!result.valid) {
        this.notification.warning('Revise os erros antes de aplicar.');
      }
    } catch (err) {
      this.notification.error(mapTemplatesError(err));
    } finally {
      this.isApplyPreviewing.set(false);
    }
  }

  async runApply(): Promise<void> {
    const template = this.applyTemplate();
    const preview = this.applyPreview();
    const projectId = this.applyForm.value.projectId?.trim();
    if (!template || !projectId || !preview?.valid) {
      this.notification.warning('Pré-visualize com sucesso antes de aplicar.');
      return;
    }

    const prefixOverride = this.applyForm.value.prefixOverride?.trim().toUpperCase();
    this.isApplying.set(true);
    try {
      const result = await this.templatesService.apply(template.id, {
        projectId,
        prefixOverride: prefixOverride?.length === 3 ? prefixOverride : undefined,
      });
      if (!result.success) {
        this.notification.error(result.errors.join('\n') || 'Falha ao aplicar.');
        return;
      }
      this.notification.success(`Tabela ${result.prefix} criada no projeto.`);
      this.closeApplyModal();
      void this.router.navigate(['/projects', projectId, 'tables', result.tableId]);
    } catch (err) {
      this.notification.error(mapTemplatesError(err));
    } finally {
      this.isApplying.set(false);
    }
  }

  private async loadProjects(): Promise<void> {
    try {
      const { projects } = await this.projectsService.list({ page: 1, pageSize: 100 });
      const active = projects.filter((p) => !p.deletedAt);
      this.projects.set(active);
      this.projectOptions.set(active.map((p) => ({ label: p.name, value: p.id })));
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    }
  }
}
