import { Component, computed, inject, signal, ViewChild, type OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PoButtonModule,
  PoButtonType,
  PoFieldModule,
  PoModalModule,
  PoNotificationService,
  PoPageModule,
  PoTableModule,
  PoTabsModule,
  PoTagModule,
  PoTagType,
  type PoBreadcrumb,
  type PoModalAction,
  type PoModalComponent,
  type PoPageAction,
  type PoSelectOption,
  type PoTableAction,
  type PoTableColumn,
} from '@po-ui/ng-components';
import type { TeamRole } from '@sxgerador/shared-types';
import { ProjectsService, type ProjectSummary } from '../../../core/services/projects.service';
import { mapTeamsError, type TeamMemberSummary } from '../../../core/services/teams.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../../shared/components/loading-skeleton/loading-skeleton.component';
import { TeamsStore } from '../../../stores/teams.store';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'sxg-team-detail',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PoButtonModule,
    PoFieldModule,
    PoModalModule,
    PoPageModule,
    PoTableModule,
    PoTabsModule,
    PoTagModule,
    EmptyStateComponent,
    LoadingSkeletonComponent,
  ],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss',
})
export class TeamDetailComponent implements OnInit {
  @ViewChild('inviteModal') private readonly inviteModal?: PoModalComponent;
  @ViewChild('transferModal') private readonly transferModal?: PoModalComponent;
  @ViewChild('deleteModal') private readonly deleteModal?: PoModalComponent;

  private readonly teamsStore = inject(TeamsStore);
  private readonly projectsService = inject(ProjectsService);
  private readonly notification = inject(PoNotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly team = this.teamsStore.currentTeam;
  readonly members = this.teamsStore.members;
  readonly invites = this.teamsStore.invites;
  readonly isLoading = this.teamsStore.isLoading;
  readonly isSaving = signal(false);
  readonly isInviting = signal(false);
  readonly isDeleting = signal(false);
  readonly projects = signal<ProjectSummary[]>([]);
  readonly selectedTransferMember = signal<TeamMemberSummary | null>(null);
  readonly tagType = PoTagType;
  readonly submitType = PoButtonType.Submit;

  readonly roleOptions: PoSelectOption[] = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Membro', value: 'MEMBER' },
    { label: 'Visualizador', value: 'VIEWER' },
  ];

  readonly memberColumns: PoTableColumn[] = [
    { property: 'user.name', label: 'Nome' },
    { property: 'user.email', label: 'Email' },
    { property: 'role', label: 'Papel', width: '120px' },
    { property: 'createdAt', label: 'Entrada', type: 'date', width: '120px' },
  ];

  readonly inviteColumns: PoTableColumn[] = [
    { property: 'email', label: 'Email' },
    { property: 'role', label: 'Papel', width: '120px' },
    { property: 'status', label: 'Status', width: '140px' },
    { property: 'expiresAt', label: 'Expira', type: 'date', width: '120px' },
  ];

  readonly memberActions: PoTableAction[] = [
    {
      label: 'Promover a admin',
      action: (member: TeamMemberSummary) => void this.changeRole(member, 'ADMIN'),
      visible: (member: TeamMemberSummary) => member.role !== 'OWNER' && member.role !== 'ADMIN',
    },
    {
      label: 'Definir como membro',
      action: (member: TeamMemberSummary) => void this.changeRole(member, 'MEMBER'),
      visible: (member: TeamMemberSummary) => member.role !== 'OWNER' && member.role !== 'MEMBER',
    },
    {
      label: 'Definir como visualizador',
      action: (member: TeamMemberSummary) => void this.changeRole(member, 'VIEWER'),
      visible: (member: TeamMemberSummary) => member.role !== 'OWNER' && member.role !== 'VIEWER',
    },
    {
      label: 'Transferir ownership',
      action: (member: TeamMemberSummary) => this.openTransferModal(member),
      visible: (member: TeamMemberSummary) => member.role !== 'OWNER',
    },
    {
      label: 'Remover membro',
      type: 'danger',
      action: (member: TeamMemberSummary) => void this.removeMember(member),
      visible: (member: TeamMemberSummary) => member.role !== 'OWNER',
    },
  ];

  readonly settingsForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    slug: ['', [Validators.required, Validators.pattern(SLUG_PATTERN), Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(500)]],
    avatarUrl: ['', [Validators.maxLength(500)]],
  });

  readonly inviteForm = this.fb.group({
    projectId: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    role: ['MEMBER' as Exclude<TeamRole, 'OWNER'>, [Validators.required]],
  });

  readonly deleteForm = this.fb.group({
    confirmation: ['', [Validators.required, Validators.pattern(/^EXCLUIR$/)]],
  });

  readonly projectOptions = computed<PoSelectOption[]>(() =>
    this.projects().map((project) => ({ label: project.name, value: project.id })),
  );

  get breadcrumb(): PoBreadcrumb {
    return {
      items: [{ label: 'Equipes', link: '/teams' }, { label: this.team()?.name ?? '…' }],
    };
  }

  get pageActions(): PoPageAction[] {
    return [
      {
        label: 'Convidar',
        icon: 'an an-user-plus',
        kind: 'primary',
        action: () => this.openInviteModal(),
      },
      {
        label: 'Atualizar',
        icon: 'an an-arrow-clockwise',
        action: () => void this.reload(),
      },
    ];
  }

  get invitePrimaryAction(): PoModalAction {
    return {
      label: 'Enviar convite',
      loading: this.isInviting(),
      disabled: this.inviteForm.invalid || this.isInviting(),
      action: () => void this.sendInvite(),
    };
  }

  get transferPrimaryAction(): PoModalAction {
    return {
      label: 'Transferir',
      danger: true,
      action: () => void this.transferOwnership(),
    };
  }

  get deletePrimaryAction(): PoModalAction {
    return {
      label: 'Excluir equipe',
      danger: true,
      loading: this.isDeleting(),
      disabled: this.deleteForm.invalid || this.isDeleting(),
      action: () => void this.deleteTeam(),
    };
  }

  get closeModalAction(): PoModalAction {
    return { label: 'Cancelar', action: () => this.closeModals() };
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/teams']);
      return;
    }
    void this.load(id);
  }

  roleLabel(role: string): string {
    return (
      { OWNER: 'Owner', ADMIN: 'Admin', MEMBER: 'Membro', VIEWER: 'Visualizador' }[role] ?? role
    );
  }

  statusLabel(status: string): string {
    return (
      {
        PENDING: 'Pendente',
        ACCEPTED: 'Aceito',
        REJECTED: 'Recusado',
        EXPIRED: 'Expirado',
        REVOKED: 'Revogado',
      }[status] ?? status
    );
  }

  openInviteModal(): void {
    const firstProject = this.projects()[0]?.id ?? '';
    this.inviteForm.reset({ projectId: firstProject, email: '', role: 'MEMBER' });
    this.inviteModal?.open();
  }

  openTransferModal(member: TeamMemberSummary): void {
    this.selectedTransferMember.set(member);
    this.transferModal?.open();
  }

  openDeleteModal(): void {
    this.deleteForm.reset({ confirmation: '' });
    this.deleteModal?.open();
  }

  closeModals(): void {
    this.inviteModal?.close();
    this.transferModal?.close();
    this.deleteModal?.close();
  }

  async saveSettings(): Promise<void> {
    const team = this.team();
    if (!team || this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const { name, slug, description, avatarUrl } = this.settingsForm.getRawValue();
      await this.teamsStore.update(team.id, {
        name: name!,
        slug: slug!,
        description: description?.trim() || null,
        avatarUrl: avatarUrl?.trim() || null,
      });
      this.notification.success('Equipe atualizada.');
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    } finally {
      this.isSaving.set(false);
    }
  }

  async sendInvite(): Promise<void> {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.isInviting.set(true);
    try {
      const { projectId, email, role } = this.inviteForm.getRawValue();
      await this.teamsStore.invite({
        projectId: projectId!,
        email: email!,
        role: role!,
      });
      this.notification.success('Convite registrado.');
      this.inviteModal?.close();
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    } finally {
      this.isInviting.set(false);
    }
  }

  async changeRole(member: TeamMemberSummary, role: Exclude<TeamRole, 'OWNER'>): Promise<void> {
    const team = this.team();
    if (!team) return;
    try {
      await this.teamsStore.updateMemberRole(team.id, member.id, role);
      this.notification.success('Papel atualizado.');
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    }
  }

  async removeMember(member: TeamMemberSummary): Promise<void> {
    const team = this.team();
    if (!team) return;
    const confirmed = window.confirm(`Remover ${member.user.email} da equipe?`);
    if (!confirmed) return;
    try {
      await this.teamsStore.removeMember(team.id, member.id);
      this.notification.success('Membro removido.');
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    }
  }

  async transferOwnership(): Promise<void> {
    const team = this.team();
    const member = this.selectedTransferMember();
    if (!team || !member) return;
    try {
      await this.teamsStore.transferOwnership(team.id, member.userId);
      this.notification.success('Ownership transferido.');
      this.transferModal?.close();
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    }
  }

  async deleteTeam(): Promise<void> {
    const team = this.team();
    if (!team || this.deleteForm.invalid) {
      this.deleteForm.markAllAsTouched();
      return;
    }

    this.isDeleting.set(true);
    try {
      await this.teamsStore.delete(team.id);
      this.notification.success('Equipe excluída.');
      void this.router.navigate(['/teams']);
    } catch (err) {
      this.notification.error(mapTeamsError(err));
    } finally {
      this.isDeleting.set(false);
    }
  }

  private async load(id: string): Promise<void> {
    try {
      await this.teamsStore.loadTeam(id);
      const team = this.team();
      if (!team) return;
      this.settingsForm.patchValue({
        name: team.name,
        slug: team.slug,
        description: team.description ?? '',
        avatarUrl: team.avatarUrl ?? '',
      });
      await Promise.all([this.teamsStore.loadMembers(id), this.loadTeamProjects(id)]);
    } catch {
      this.notification.error('Não foi possível carregar a equipe.');
      void this.router.navigate(['/teams']);
    }
  }

  private async reload(): Promise<void> {
    const team = this.team();
    if (team) await this.load(team.id);
  }

  private async loadTeamProjects(teamId: string): Promise<void> {
    const response = await this.projectsService.list({ page: 1, pageSize: 100 });
    const projects = response.projects.filter((project) => project.ownerTeamId === teamId);
    this.projects.set(projects);
    await this.teamsStore.loadInvites(projects.map((project) => project.id));
  }
}
