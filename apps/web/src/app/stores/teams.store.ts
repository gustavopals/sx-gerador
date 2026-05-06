import { computed, inject } from '@angular/core';
import type { CreateTeamInput, UpdateTeamInput } from '@sxgerador/shared-types';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  TeamsService,
  type InviteProjectMemberInput,
  type ProjectInviteSummary,
  type TeamMemberSummary,
  type TeamSummary,
} from '../core/services/teams.service';

interface TeamsState {
  teams: TeamSummary[];
  currentTeam: TeamSummary | null;
  members: TeamMemberSummary[];
  invites: ProjectInviteSummary[];
  isLoading: boolean;
}

const initialState: TeamsState = {
  teams: [],
  currentTeam: null,
  members: [],
  invites: [],
  isLoading: false,
};

export const TeamsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    isEmpty: computed(() => !store.isLoading() && store.teams().length === 0),
    activeMembers: computed(() => store.members().filter((member) => !member.removedAt)),
    pendingInvites: computed(() => store.invites().filter((invite) => invite.status === 'PENDING')),
  })),
  withMethods((store, service = inject(TeamsService)) => ({
    async loadTeams(): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        patchState(store, { teams: await service.list() });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async loadTeam(id: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        patchState(store, { currentTeam: await service.get(id) });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async create(input: CreateTeamInput): Promise<TeamSummary> {
      patchState(store, { isLoading: true });
      try {
        const team = await service.create(input);
        patchState(store, { currentTeam: team, teams: [team, ...store.teams()] });
        return team;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async update(id: string, input: UpdateTeamInput): Promise<TeamSummary> {
      patchState(store, { isLoading: true });
      try {
        const team = await service.update(id, input);
        patchState(store, {
          currentTeam: team,
          teams: store.teams().map((item) => (item.id === id ? team : item)),
        });
        return team;
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async delete(id: string): Promise<void> {
      patchState(store, { isLoading: true });
      try {
        const team = await service.delete(id);
        patchState(store, {
          currentTeam: store.currentTeam()?.id === id ? team : store.currentTeam(),
          teams: store.teams().filter((item) => item.id !== id),
        });
      } finally {
        patchState(store, { isLoading: false });
      }
    },

    async loadMembers(teamId: string): Promise<void> {
      patchState(store, { members: await service.listMembers(teamId) });
    },

    async loadInvites(projectIds: string[]): Promise<void> {
      const invites = (
        await Promise.all(projectIds.map((id) => service.listProjectInvites(id)))
      ).flat();
      patchState(store, { invites });
    },

    async invite(input: InviteProjectMemberInput): Promise<ProjectInviteSummary> {
      const invite = await service.inviteProjectMember(input);
      patchState(store, { invites: [invite, ...store.invites()] });
      return invite;
    },

    async updateMemberRole(
      teamId: string,
      memberId: string,
      role: Exclude<TeamMemberSummary['role'], 'OWNER'>,
    ): Promise<void> {
      const member = await service.updateMemberRole(teamId, memberId, role);
      patchState(store, {
        members: store.members().map((item) => (item.id === memberId ? member : item)),
      });
    },

    async removeMember(teamId: string, memberId: string): Promise<void> {
      await service.removeMember(teamId, memberId);
      patchState(store, { members: store.members().filter((item) => item.id !== memberId) });
    },

    async transferOwnership(teamId: string, userId: string): Promise<void> {
      await service.transferOwnership(teamId, userId);
      patchState(store, { members: await service.listMembers(teamId) });
    },
  })),
);
