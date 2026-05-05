import { DatePipe } from '@angular/common';
import { Component, inject, signal, ViewChild, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
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
import {
  mapProjectsError,
  ProjectsService,
  type ProjectSummary,
} from '../../../core/services/projects.service';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'sxg-projects-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    PoButtonModule,
    PoFieldModule,
    PoModalModule,
    PoPageModule,
    PoTagModule,
  ],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
})
export class ProjectsListComponent implements OnInit {
  @ViewChild('createProjectModal') private readonly createProjectModal?: PoModalComponent;

  private readonly projectsService = inject(ProjectsService);
  private readonly notification = inject(PoNotificationService);
  private readonly fb = inject(FormBuilder);

  readonly submitType = PoButtonType.Submit;
  readonly tagType = PoTagType;
  readonly isLoading = signal(false);
  readonly isCreating = signal(false);
  readonly projects = signal<ProjectSummary[]>([]);
  readonly page = signal(1);
  readonly pageSize = 12;
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly includeArchived = signal(false);
  readonly search = signal('');

  readonly pageActions: PoPageAction[] = [
    {
      label: 'Novo projeto',
      icon: 'an an-plus',
      kind: 'primary',
      action: () => this.openCreateModal(),
    },
    {
      label: 'Atualizar',
      icon: 'an an-arrow-clockwise',
      action: () => void this.loadProjects(),
    },
  ];

  readonly visibilityOptions: PoSelectOption[] = [
    { label: 'Privado', value: 'PRIVATE' },
    { label: 'Não listado', value: 'UNLISTED' },
    { label: 'Público', value: 'PUBLIC' },
  ];

  readonly filterOptions: PoSelectOption[] = [
    { label: 'Ativos', value: 'active' },
    { label: 'Ativos e arquivados', value: 'all' },
  ];

  readonly filtersForm = this.fb.group({
    search: [''],
    archived: ['active'],
  });

  readonly createForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.minLength(2), Validators.pattern(SLUG_PATTERN)]],
    description: ['', [Validators.maxLength(500)]],
    visibility: ['PRIVATE'],
  });

  ngOnInit(): void {
    void this.loadProjects();
  }

  get hasPreviousPage(): boolean {
    return this.page() > 1;
  }

  get hasNextPage(): boolean {
    return this.page() < this.totalPages();
  }

  get nameError(): string {
    const c = this.createForm.controls.name;
    if (c.touched && c.hasError('required')) return 'Nome é obrigatório';
    if (c.touched && c.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get slugError(): string {
    const c = this.createForm.controls.slug;
    if (c.touched && c.hasError('required')) return 'Slug é obrigatório';
    if (c.touched && c.hasError('pattern')) return 'Use letras minúsculas, números e hífens';
    return '';
  }

  get createPrimaryAction(): PoModalAction {
    return {
      label: 'Criar projeto',
      loading: this.isCreating(),
      disabled: this.createForm.invalid || this.isCreating(),
      action: () => void this.createProject(),
    };
  }

  get createSecondaryAction(): PoModalAction {
    return {
      label: 'Cancelar',
      disabled: this.isCreating(),
      action: () => this.createProjectModal?.close(),
    };
  }

  async loadProjects(): Promise<void> {
    this.isLoading.set(true);
    try {
      const response = await this.projectsService.list({
        page: this.page(),
        pageSize: this.pageSize,
        search: this.search(),
        includeArchived: this.includeArchived(),
      });
      this.projects.set(response.projects);
      this.total.set(response.meta.total);
      this.totalPages.set(response.meta.totalPages);
    } catch {
      this.notification.error('Não foi possível carregar os projetos.');
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilters(): void {
    const { search, archived } = this.filtersForm.value;
    this.search.set(search?.trim() ?? '');
    this.includeArchived.set(archived === 'all');
    this.page.set(1);
    void this.loadProjects();
  }

  clearFilters(): void {
    this.filtersForm.setValue({ search: '', archived: 'active' });
    this.applyFilters();
  }

  previousPage(): void {
    if (!this.hasPreviousPage) return;
    this.page.update((value) => value - 1);
    void this.loadProjects();
  }

  nextPage(): void {
    if (!this.hasNextPage) return;
    this.page.update((value) => value + 1);
    void this.loadProjects();
  }

  openCreateModal(): void {
    this.createForm.reset({
      name: '',
      slug: '',
      description: '',
      visibility: 'PRIVATE',
    });
    this.createProjectModal?.open();
  }

  syncSlugFromName(): void {
    const slug = this.createForm.controls.slug;
    if (slug.dirty) return;
    slug.setValue(toSlug(this.createForm.controls.name.value ?? ''), { emitEvent: false });
  }

  async createProject(): Promise<void> {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    try {
      const { name, slug, description, visibility } = this.createForm.getRawValue();
      await this.projectsService.create({
        name: name!,
        slug: slug!,
        description: description?.trim() || null,
        visibility: visibility as 'PRIVATE' | 'UNLISTED' | 'PUBLIC',
      });
      this.createProjectModal?.close();
      this.notification.success('Projeto criado.');
      this.page.set(1);
      await this.loadProjects();
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isCreating.set(false);
    }
  }

  async archiveProject(project: ProjectSummary): Promise<void> {
    try {
      await this.projectsService.archive(project.id);
      this.notification.success('Projeto arquivado.');
      await this.loadProjects();
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    }
  }

  async restoreProject(project: ProjectSummary): Promise<void> {
    try {
      await this.projectsService.restore(project.id);
      this.notification.success('Projeto restaurado.');
      await this.loadProjects();
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    }
  }

  visibilityLabel(project: ProjectSummary): string {
    const option = this.visibilityOptions.find((item) => item.value === project.visibility);
    return option?.label ?? project.visibility;
  }

  tableCount(project: ProjectSummary): number {
    return project.tableCount ?? 0;
  }
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
