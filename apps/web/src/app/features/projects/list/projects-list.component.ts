import { DatePipe } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
  PoPageModule,
  PoTagModule,
  PoTagType,
  type PoPageAction,
  type PoSelectOption,
} from '@po-ui/ng-components';
import {
  mapProjectsError,
  ProjectsService,
  type ProjectSummary,
} from '../../../core/services/projects.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'sxg-projects-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    PoButtonModule,
    PoFieldModule,
    PoPageModule,
    PoTagModule,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './projects-list.component.html',
  styleUrl: './projects-list.component.scss',
})
export class ProjectsListComponent implements OnInit {
  private readonly projectsService = inject(ProjectsService);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly submitType = PoButtonType.Submit;
  readonly tagType = PoTagType;
  readonly isLoading = signal(false);
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
      action: () => void this.router.navigate(['/projects/new']),
    },
    {
      label: 'Comparar projetos',
      icon: 'an an-arrows-left-right',
      action: () => void this.router.navigate(['/diff/projects']),
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

  ngOnInit(): void {
    void this.loadProjects();
  }

  get hasPreviousPage(): boolean {
    return this.page() > 1;
  }

  get hasNextPage(): boolean {
    return this.page() < this.totalPages();
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

  editProject(project: ProjectSummary): void {
    void this.router.navigate(['/projects', project.id, 'edit']);
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
