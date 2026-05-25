import { Component, computed, inject, signal, type OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type AsyncValidatorFn,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoNotificationService,
  PoPageModule,
  type PoPageAction,
  type PoSelectOption,
} from '@po-ui/ng-components';
import { from, of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { mapProjectsError, ProjectsService } from '../../../core/services/projects.service';
import {
  mapTeamsError,
  TeamsService,
  type TeamSummary,
} from '../../../core/services/teams.service';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PERSONAL_OWNER = 'personal';
const TEAM_OWNER_PREFIX = 'team:';

@Component({
  selector: 'sxg-project-form',
  imports: [
    ReactiveFormsModule,
    PoButtonModule,
    PoFieldModule,
    PoPageModule,
    LoadingSkeletonComponent,
  ],
  templateUrl: './project-form.component.html',
  styleUrl: './project-form.component.scss',
})
export class ProjectFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly projectsService = inject(ProjectsService);
  private readonly teamsService = inject(TeamsService);
  private readonly notification = inject(PoNotificationService);
  private readonly fb = inject(FormBuilder);

  readonly projectId = signal<string | null>(null);
  readonly isEditMode = computed(() => this.projectId() !== null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly teams = signal<TeamSummary[]>([]);
  readonly submitType = PoButtonType.Submit;
  readonly ownerOptions = computed<PoSelectOption[]>(() => [
    { label: 'Pessoal', value: PERSONAL_OWNER },
    ...this.teams().map((team) => ({
      label: `Equipe: ${team.name}`,
      value: `${TEAM_OWNER_PREFIX}${team.id}`,
    })),
  ]);

  readonly visibilityOptions: PoSelectOption[] = [
    { label: 'Privado', value: 'PRIVATE' },
    { label: 'Não listado', value: 'UNLISTED' },
    { label: 'Público', value: 'PUBLIC' },
  ];

  readonly langOptions: PoSelectOption[] = [
    { label: 'Português (Brasil)', value: 'pt-BR' },
    { label: 'Inglês (EUA)', value: 'en-US' },
    { label: 'Espanhol', value: 'es-ES' },
  ];

  readonly tamFilOptions: PoSelectOption[] = [
    { label: '1 caractere', value: 1 },
    { label: '2 caracteres (padrão)', value: 2 },
    { label: '3 caracteres', value: 3 },
    { label: '4 caracteres', value: 4 },
    { label: '5 caracteres', value: 5 },
    { label: '6 caracteres', value: 6 },
  ];

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
      [this.slugAvailabilityValidator()],
    ],
    description: ['', [Validators.maxLength(500)]],
    visibility: ['PRIVATE'],
    owner: [PERSONAL_OWNER],
    defaultLang: ['pt-BR'],
    defaultTamFil: [2],
  });

  readonly pageActions: PoPageAction[] = [
    {
      label: 'Voltar para projetos',
      icon: 'an an-arrow-left',
      action: () => void this.router.navigate(['/projects']),
    },
  ];

  get pageTitle(): string {
    return this.isEditMode() ? 'Editar projeto' : 'Novo projeto';
  }

  get pageSubtitle(): string {
    return this.isEditMode()
      ? 'Atualize as configurações do dicionário'
      : 'Crie um novo dicionário de dados Protheus';
  }

  get nameError(): string {
    const c = this.form.controls.name;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Nome é obrigatório';
    if (c.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (c.hasError('maxlength')) return 'Máximo 100 caracteres';
    return '';
  }

  get slugError(): string {
    const c = this.form.controls.slug;
    if (!c.touched) return '';
    if (c.hasError('required')) return 'Slug é obrigatório';
    if (c.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (c.hasError('maxlength')) return 'Máximo 80 caracteres';
    if (c.hasError('pattern')) return 'Use letras minúsculas, números e hífens';
    if (c.hasError('slugTaken')) return 'Esse slug já está em uso';
    return '';
  }

  get isSlugPending(): boolean {
    return this.form.controls.slug.pending;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      void this.loadProject(id);
    } else {
      void this.loadOwnerTeams();
    }
  }

  syncSlugFromName(): void {
    const slug = this.form.controls.slug;
    if (slug.dirty) return;
    slug.setValue(toSlug(this.form.controls.name.value ?? ''), { emitEvent: false });
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const { name, slug, description, visibility, owner, defaultLang, defaultTamFil } =
        this.form.getRawValue();
      const id = this.projectId();

      if (id) {
        await this.projectsService.update(id, {
          name: name!,
          slug: slug!,
          description: description?.trim() || null,
          visibility: visibility as 'PRIVATE' | 'UNLISTED' | 'PUBLIC',
          defaultLang: defaultLang as 'pt-BR' | 'en-US' | 'es-ES',
          defaultTamFil: defaultTamFil!,
        });
        this.notification.success('Projeto atualizado.');
      } else {
        await this.projectsService.create({
          name: name!,
          slug: slug!,
          description: description?.trim() || null,
          visibility: visibility as 'PRIVATE' | 'UNLISTED' | 'PUBLIC',
          ownerTeamId: getOwnerTeamId(owner),
          defaultLang: defaultLang as 'pt-BR' | 'en-US' | 'es-ES',
          defaultTamFil: defaultTamFil!,
        });
        this.notification.success('Projeto criado.');
      }

      void this.router.navigate(['/projects']);
    } catch (err) {
      this.notification.error(mapProjectsError(err));
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel(): void {
    void this.router.navigate(['/projects']);
  }

  private async loadProject(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const project = await this.projectsService.get(id);
      this.form.patchValue({
        name: project.name,
        slug: project.slug,
        description: project.description ?? '',
        visibility: project.visibility,
        defaultLang: project.defaultLang,
        defaultTamFil: project.defaultTamFil,
      });
      this.form.controls.slug.markAsDirty();
    } catch {
      this.notification.error('Não foi possível carregar o projeto.');
      void this.router.navigate(['/projects']);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadOwnerTeams(): Promise<void> {
    this.isLoading.set(true);
    try {
      this.teams.set(await this.teamsService.list());
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    } finally {
      this.isLoading.set(false);
    }
  }

  private slugAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl) =>
      timer(500).pipe(
        switchMap(() => {
          const slug = (control.value as string) ?? '';
          if (!SLUG_PATTERN.test(slug)) return of(null);
          return from(
            this.projectsService.checkSlugAvailability(slug, this.projectId() ?? undefined),
          ).pipe(
            map((available) => (available ? null : { slugTaken: true })),
            catchError(() => of(null)),
          );
        }),
      );
  }
}

function getOwnerTeamId(owner: string | null | undefined): string | null {
  if (!owner?.startsWith(TEAM_OWNER_PREFIX)) return null;
  return owner.slice(TEAM_OWNER_PREFIX.length);
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
