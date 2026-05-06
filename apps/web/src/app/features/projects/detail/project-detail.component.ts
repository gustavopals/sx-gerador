import { DatePipe } from '@angular/common';
import { Component, inject, signal, type OnInit } from '@angular/core';
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
import {
  mapProjectsError,
  ProjectsService,
  type ProjectSummary,
} from '../../../core/services/projects.service';

@Component({
  selector: 'sxg-project-detail',
  imports: [DatePipe, PoButtonModule, PoPageModule, PoTabsModule, PoTagModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
})
export class ProjectDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly notification = inject(PoNotificationService);

  readonly project = signal<ProjectSummary | null>(null);
  readonly isLoading = signal(false);
  readonly isActing = signal(false);
  readonly tagType = PoTagType;

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
}
