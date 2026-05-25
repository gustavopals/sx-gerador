import { Component, inject, signal, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PoButtonModule,
  PoFieldModule,
  PoNotificationService,
  PoPageModule,
  type PoBreadcrumb,
  type PoSelectOption,
} from '@po-ui/ng-components';
import {
  DiffService,
  mapDiffError,
  type CompareProjectsResponse,
} from '../../../core/services/diff.service';
import { mapProjectsError, ProjectsService } from '../../../core/services/projects.service';
import { DiffViewerComponent } from '../../../shared/components/diff-viewer/diff-viewer.component';

@Component({
  selector: 'sxg-projects-compare',
  imports: [ReactiveFormsModule, PoButtonModule, PoFieldModule, PoPageModule, DiffViewerComponent],
  templateUrl: './projects-compare.component.html',
  styleUrl: './projects-compare.component.scss',
})
export class ProjectsCompareComponent implements OnInit {
  private readonly projectsService = inject(ProjectsService);
  private readonly diffService = inject(DiffService);
  private readonly notification = inject(PoNotificationService);
  private readonly fb = inject(FormBuilder);

  readonly isLoadingProjects = signal(false);
  readonly isComparing = signal(false);
  readonly projectOptions = signal<PoSelectOption[]>([]);
  readonly result = signal<CompareProjectsResponse | null>(null);

  readonly form = this.fb.group({
    projectIdA: ['', Validators.required],
    projectIdB: ['', Validators.required],
  });

  readonly breadcrumb: PoBreadcrumb = {
    items: [{ label: 'Projetos', link: '/projects' }, { label: 'Comparar projetos' }],
  };

  ngOnInit(): void {
    void this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    this.isLoadingProjects.set(true);
    try {
      const response = await this.projectsService.list({
        page: 1,
        pageSize: 100,
        includeArchived: false,
      });
      this.projectOptions.set(
        response.projects.map((p) => ({
          label: `${p.name} (${p.slug})`,
          value: p.id,
        })),
      );
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isLoadingProjects.set(false);
    }
  }

  async compare(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { projectIdA, projectIdB } = this.form.getRawValue();
    if (projectIdA === projectIdB) {
      this.notification.warning('Selecione dois projetos diferentes.');
      return;
    }

    this.isComparing.set(true);
    this.result.set(null);
    try {
      const response = await this.diffService.compareProjects({
        projectIdA: projectIdA!,
        projectIdB: projectIdB!,
      });
      this.result.set(response);
    } catch (err) {
      this.notification.error(mapDiffError(err));
    } finally {
      this.isComparing.set(false);
    }
  }

  labelA(): string {
    return this.result()?.projectA.name ?? 'Projeto A';
  }

  labelB(): string {
    return this.result()?.projectB.name ?? 'Projeto B';
  }
}
