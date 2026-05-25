import { DatePipe } from '@angular/common';
import { Component, inject, signal, ViewChild, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoModalModule,
  PoNotificationService,
  PoPageModule,
  type PoModalAction,
  type PoModalComponent,
  type PoPageAction,
} from '@po-ui/ng-components';
import { mapTeamsError, type TeamSummary } from '../../../core/services/teams.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { TeamsStore } from '../../../stores/teams.store';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'sxg-teams-list',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    PoButtonModule,
    PoFieldModule,
    PoModalModule,
    PoPageModule,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './teams-list.component.html',
  styleUrl: './teams-list.component.scss',
})
export class TeamsListComponent implements OnInit {
  @ViewChild('teamModal') private readonly teamModal?: PoModalComponent;

  private readonly teamsStore = inject(TeamsStore);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly teams = this.teamsStore.teams;
  readonly isLoading = this.teamsStore.isLoading;
  readonly submitType = PoButtonType.Submit;
  readonly isSaving = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(80),
        Validators.pattern(SLUG_PATTERN),
      ],
    ],
    description: ['', [Validators.maxLength(500)]],
  });

  readonly pageActions: PoPageAction[] = [
    {
      label: 'Nova equipe',
      icon: 'an an-plus',
      kind: 'primary',
      action: () => this.openCreateModal(),
    },
    {
      label: 'Atualizar',
      icon: 'an an-arrow-clockwise',
      action: () => void this.loadTeams(),
    },
  ];

  get primaryAction(): PoModalAction {
    return {
      label: 'Criar equipe',
      loading: this.isSaving(),
      disabled: this.form.invalid || this.isSaving(),
      action: () => void this.createTeam(),
    };
  }

  get secondaryAction(): PoModalAction {
    return {
      label: 'Cancelar',
      disabled: this.isSaving(),
      action: () => this.teamModal?.close(),
    };
  }

  get nameError(): string {
    const c = this.form.controls.name;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Nome é obrigatório';
    if (c.hasError('minlength')) return 'Mínimo 2 caracteres';
    return '';
  }

  get slugError(): string {
    const c = this.form.controls.slug;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Slug é obrigatório';
    if (c.hasError('pattern')) return 'Use letras minúsculas, números e hífens';
    return '';
  }

  ngOnInit(): void {
    void this.loadTeams();
  }

  syncSlugFromName(): void {
    const slug = this.form.controls.slug;
    if (slug.dirty) return;
    slug.setValue(toSlug(this.form.controls.name.value ?? ''), { emitEvent: false });
  }

  openCreateModal(): void {
    this.form.reset({ name: '', slug: '', description: '' });
    this.teamModal?.open();
  }

  openTeam(team: TeamSummary): void {
    void this.router.navigate(['/teams', team.id]);
  }

  async loadTeams(): Promise<void> {
    try {
      await this.teamsStore.loadTeams();
    } catch {
      this.notification.error('Não foi possível carregar as equipes.');
    }
  }

  async createTeam(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const { name, slug, description } = this.form.getRawValue();
      const team = await this.teamsStore.create({
        name: name!,
        slug: slug!,
        description: description?.trim() || null,
      });
      this.notification.success('Equipe criada.');
      this.teamModal?.close();
      void this.router.navigate(['/teams', team.id]);
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    } finally {
      this.isSaving.set(false);
    }
  }
}

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
